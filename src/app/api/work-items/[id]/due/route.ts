import { NextRequest } from "next/server";
import { auth, AuthenticatedRequest, HandlerContext } from "@/lib/api/auth-middleware";
import { errors, createSimpleSuccess } from "@/lib/api/errors";
import { logActivity } from "@/lib/activity/log";

interface UpdateDueDateRequest {
  due?: string | null;
}

async function updateDueDateHandler(
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
    const body: UpdateDueDateRequest = await req.json().catch(() => ({}));

    // Validate and prepare due date
    let dueDate: string | null = null;
    if (body.due !== undefined) {
      if (body.due === null) {
        dueDate = null; // Clear due date
      } else if (typeof body.due === "string" && body.due.trim().length > 0) {
        // Validate date format
        const date = new Date(body.due);
        if (isNaN(date.getTime())) {
          return errors.validation("Invalid due date format");
        }
        dueDate = body.due;
      }
    }

    // Get current work item for activity logging
    const { data: currentItem } = await authContext.supabase
      .from("work_item")
      .select("id, due, title")
      .eq("id", workItemId)
      .maybeSingle();

    // Update the work item
    const { error } = await authContext.supabase
      .from("work_item")
      .update({ due: dueDate })
      .eq("id", workItemId);

    if (error) {
      console.error("Work item due date update error:", error);
      return errors.internal("Failed to update due date: " + error.message);
    }

    // Log the activity
    if (currentItem) {
      await logActivity({
        actorId: authContext.user.id,
        entityType: "work_item",
        entityId: workItemId,
        action: "update",
        diff: {
          before: { due: currentItem.due },
          after: { due: dueDate },
        },
      });
    }

    return createSimpleSuccess(200);

  } catch (error) {
    console.error("Work item due date update handler error:", error);
    return errors.internal("Unexpected error during due date update");
  }
}

// Export the wrapped handler
export const PATCH = auth.authenticated(updateDueDateHandler);
