import { NextRequest } from "next/server";
import { auth, AuthenticatedRequest, HandlerContext } from "@/lib/api/auth-middleware";
import { errors, createSuccessResponse } from "@/lib/api/errors";
import { logActivity } from "@/lib/activity/log";

interface CreateWorkItemRequest {
  vehicle_id: string;
  title: string;
  status?: "BACKLOG" | "PLANNED" | "IN_PROGRESS" | "DONE";
  tags?: string[];
  due?: string;
  build_plan_id?: string;
}

async function createWorkItemHandler(
  req: NextRequest,
  context: HandlerContext,
  authContext: AuthenticatedRequest
) {
  try {
    const body: CreateWorkItemRequest = await req.json();

    // Validate required fields
    if (!body.vehicle_id || !body.title) {
      return errors.validation("Missing required fields: vehicle_id and title");
    }

    // Verify vehicle access (the middleware already checked this, but be explicit)
    const vehicle = await authContext.db.getVehicleWithAccess(
      authContext.user.id,
      body.vehicle_id
    );

    if (!vehicle) {
      return errors.notFound("Vehicle not found or access denied");
    }

    // Validate status if provided
    const validStatuses = ["BACKLOG", "PLANNED", "IN_PROGRESS", "DONE"];
    if (body.status && !validStatuses.includes(body.status)) {
      return errors.validation("Invalid status. Must be one of: " + validStatuses.join(", "));
    }

    // Create the work item
    const { data, error } = await authContext.supabase
      .from("work_item")
      .insert({
        vehicle_id: body.vehicle_id,
        title: body.title,
        status: body.status ?? "BACKLOG",
        tags: Array.isArray(body.tags) ? body.tags : null,
        due: body.due || null,
        build_plan_id: body.build_plan_id || null,
      })
      .select("id, title, status, tags, due, created_at")
      .single();

    if (error) {
      console.error("Work item creation error:", error);
      return errors.internal("Failed to create work item: " + error.message);
    }

    // Log the activity
    if (data) {
      await logActivity({
        actorId: authContext.user.id,
        entityType: "work_item",
        entityId: data.id,
        action: "create",
        diff: { after: { title: data.title, status: data.status } },
      });
    }

    return createSuccessResponse({ item: data }, 201);

  } catch (error) {
    console.error("Work item creation handler error:", error);
    return errors.internal("Unexpected error during work item creation");
  }
}

// Export the wrapped handler
export const POST = auth.authenticated(createWorkItemHandler);
