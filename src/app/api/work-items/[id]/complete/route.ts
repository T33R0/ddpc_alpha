import { NextRequest } from "next/server";
import { auth, AuthenticatedRequest, HandlerContext } from "@/lib/api/auth-middleware";
import { errors, createSuccessResponse } from "@/lib/api/errors";
import { logActivity } from "@/lib/activity/log";

interface CompleteWorkItemRequest {
  completedAt?: string;
}

async function completeWorkItemHandler(
  req: NextRequest,
  context: HandlerContext,
  authContext: AuthenticatedRequest
) {
  try {
    const workItemIdRaw = context.params?.id;
    if (!workItemIdRaw) {
      return errors.badRequest("Missing work item ID");
    }

    const workItemId = Array.isArray(workItemIdRaw) ? workItemIdRaw[0] : workItemIdRaw;

    // Parse request body
    const body: CompleteWorkItemRequest = await req.json().catch(() => ({}));
    const completedAt = body.completedAt ? new Date(body.completedAt).toISOString() : new Date().toISOString();

    // Prepare update data
    const updateData = {
      status: "DONE" as const,
      completed_at: completedAt,
    };

    // Update the work item
    const { data, error } = await authContext.supabase
      .from("work_item")
      .update(updateData)
      .eq("id", workItemId)
      .select("id, title, status, vehicle_id")
      .single();

    if (error) {
      console.error("Work item completion error:", error);
      return errors.internal("Failed to complete work item: " + error.message);
    }

    // Log the activity
    if (data) {
      await logActivity({
        actorId: authContext.user.id,
        entityType: "work_item",
        entityId: workItemId,
        action: "update",
        diff: {
          before: { status: "IN_PROGRESS" }, // Assume it was in progress
          after: { status: "DONE", completed_at: completedAt },
        },
      });
    }

    return createSuccessResponse({ id: data.id }, 200);

  } catch (error) {
    console.error("Work item completion handler error:", error);
    return errors.internal("Unexpected error during work item completion");
  }
}

// Export the wrapped handler
export const PATCH = auth.authenticated(completeWorkItemHandler);
