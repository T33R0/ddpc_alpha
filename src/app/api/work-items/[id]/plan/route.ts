import { NextRequest } from "next/server";
import { auth, AuthenticatedRequest, HandlerContext } from "@/lib/api/auth-middleware";
import { errors, createSimpleSuccess } from "@/lib/api/errors";
import { validateUpdateWorkItemPlanPayload, type UpdateWorkItemPlanPayload } from "@/lib/validators/workItems";
import { serverLog } from "@/lib/serverLog";
import { logActivity } from "@/lib/activity/log";

async function updateWorkItemPlanHandler(
  req: NextRequest,
  context: HandlerContext,
  authContext: AuthenticatedRequest
) {
  const requestId = Math.random().toString(36).slice(2, 10);

  try {
    const workItemIdRaw = context.params?.id;
    if (!workItemIdRaw) {
      return errors.badRequest("Missing work item ID");
    }

    const workItemId = Array.isArray(workItemIdRaw) ? workItemIdRaw[0] : workItemIdRaw;

    // Parse and validate request body
    const body = await req.json().catch(() => ({}));
    const validation = validateUpdateWorkItemPlanPayload(body);

    if (!validation.ok) {
      return errors.validation(validation.error);
    }

    const { plan_id } = validation.data;

    // Load work item and its vehicle
    const { data: workItem } = await authContext.supabase
      .from("work_item")
      .select("id, vehicle_id, plan_id, title")
      .eq("id", workItemId)
      .maybeSingle();

    if (!workItem) {
      return errors.notFound("Work item not found");
    }

    // Get vehicle information
    const { data: vehicle } = await authContext.supabase
      .from("vehicle")
      .select("id, garage_id")
      .eq("id", workItem.vehicle_id)
      .maybeSingle();

    if (!vehicle) {
      return errors.notFound("Vehicle not found");
    }

    // Verify user has access to the vehicle's garage
    const hasAccess = await authContext.db.ensureGarageAccess(
      authContext.user.id,
      vehicle.garage_id,
      "CONTRIBUTOR" // Contributors can update work items
    );

    if (!hasAccess) {
      return errors.forbidden("Access denied. You must be a contributor to the garage.");
    }

    // Validate plan belongs to same vehicle and exists
    const { data: plan } = await authContext.supabase
      .from("build_plan")
      .select("id, vehicle_id, name")
      .eq("id", plan_id)
      .maybeSingle();

    if (!plan) {
      return errors.validation("Invalid plan_id: plan does not exist");
    }

    if (plan.vehicle_id !== workItem.vehicle_id) {
      return errors.validation("Plan does not belong to the same vehicle as the work item");
    }

    // Update the work item
    const { error: updateError } = await authContext.supabase
      .from("work_item")
      .update({ plan_id })
      .eq("id", workItemId);

    if (updateError) {
      console.error("Work item plan update error:", updateError);
      return errors.internal("Failed to update work item plan: " + updateError.message);
    }

    // Log the activity
    await logActivity({
      actorId: authContext.user.id,
      entityType: "work_item",
      entityId: workItemId,
      action: "update",
      diff: {
        before: { plan_id: workItem.plan_id },
        after: { plan_id },
      },
    });

    // Log the server event
    serverLog("task_plan_updated", {
      userId: authContext.user.id,
      taskId: workItemId,
      planId: plan_id,
      requestId
    });

    return createSimpleSuccess(200);

  } catch (error) {
    console.error("Work item plan update handler error:", error);
    return errors.internal("Unexpected error during plan update");
  }
}

// Export the wrapped handler
export const PATCH = auth.authenticated(updateWorkItemPlanHandler);
