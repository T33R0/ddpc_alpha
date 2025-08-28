import { NextRequest } from "next/server";
import { auth, AuthenticatedRequest, HandlerContext } from "@/lib/api/auth-middleware";
import { errors, createSimpleSuccess } from "@/lib/api/errors";
import { logActivity } from "@/lib/activity/log";

interface UpdateTagsRequest {
  tags?: string[] | null;
}

async function updateTagsHandler(
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
    const body: UpdateTagsRequest = await req.json().catch(() => ({}));

    // Validate tags
    if (body.tags !== undefined && body.tags !== null && !Array.isArray(body.tags)) {
      return errors.validation("Tags must be an array of strings or null");
    }

    // Normalize tags
    let normalizedTags: string[] | null = null;
    if (Array.isArray(body.tags)) {
      normalizedTags = body.tags
        .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
        .filter((tag) => tag.length > 0);
    }

    // Get current work item for activity logging
    const { data: currentItem } = await authContext.supabase
      .from("work_item")
      .select("id, tags, title")
      .eq("id", workItemId)
      .maybeSingle();

    // Update the work item
    const { error } = await authContext.supabase
      .from("work_item")
      .update({ tags: normalizedTags })
      .eq("id", workItemId);

    if (error) {
      console.error("Work item tags update error:", error);
      return errors.internal("Failed to update tags: " + error.message);
    }

    // Log the activity
    if (currentItem) {
      await logActivity({
        actorId: authContext.user.id,
        entityType: "work_item",
        entityId: workItemId,
        action: "update",
        diff: {
          before: { tags: currentItem.tags },
          after: { tags: normalizedTags },
        },
      });
    }

    return createSimpleSuccess(200);

  } catch (error) {
    console.error("Work item tags update handler error:", error);
    return errors.internal("Unexpected error during tags update");
  }
}

// Export the wrapped handler
export const PATCH = auth.authenticated(updateTagsHandler);
