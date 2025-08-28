import { NextRequest } from "next/server";
import { auth, AuthenticatedRequest, HandlerContext } from "@/lib/api/auth-middleware";
import { errors, createSimpleSuccess } from "@/lib/api/errors";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity/log";
import { Vehicle } from "@/lib/api/database";

interface VehicleUpdateRequest {
  nickname?: string;
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  privacy?: string;
}

async function deleteVehicleHandler(
  _req: NextRequest,
  context: HandlerContext,
  authContext: AuthenticatedRequest
) {
  try {
    const vehicleIdRaw = context.params?.id;
    if (!vehicleIdRaw) {
      return errors.badRequest("Missing vehicle ID");
    }

    const vehicleId = Array.isArray(vehicleIdRaw) ? vehicleIdRaw[0] : vehicleIdRaw;

    // Get vehicle and verify access (middleware should have already checked this)
    const vehicle = await authContext.db.getVehicleWithAccess(
      authContext.user.id,
      vehicleId
    );

    if (!vehicle) {
      return errors.notFound("Vehicle not found or access denied");
    }

    // Additional check: only OWNER or MANAGER can delete
    const hasDeletePermission = await authContext.db.ensureGarageAccess(
      authContext.user.id,
      vehicle.garage_id,
      "MANAGER"
    );

    if (!hasDeletePermission) {
      return errors.forbidden("Insufficient permissions. MANAGER or OWNER role required to delete vehicles");
    }

    // Delete the vehicle
    const success = await authContext.db.deleteVehicle(authContext.user.id, vehicleId);
    if (!success) {
      return errors.internal("Failed to delete vehicle");
    }

    // Log the activity
    await logActivity({
      actorId: authContext.user.id,
      entityType: "vehicle",
      entityId: vehicleId,
      action: "delete",
      diff: { before: { id: vehicleId, make: vehicle.make, model: vehicle.model } },
    });

    // Revalidate paths
    revalidatePath("/vehicles");

    return createSimpleSuccess(200);

  } catch (error) {
    console.error("Vehicle deletion error:", error);
    return errors.internal("Unexpected error during vehicle deletion");
  }
}

async function updateVehicleHandler(
  req: NextRequest,
  context: HandlerContext,
  authContext: AuthenticatedRequest
) {
  try {
    const vehicleIdRaw = context.params?.id;
    if (!vehicleIdRaw) {
      return errors.badRequest("Missing vehicle ID");
    }

    const vehicleId = Array.isArray(vehicleIdRaw) ? vehicleIdRaw[0] : vehicleIdRaw;

    // Get vehicle and verify access (middleware should have already checked this)
    const existingVehicle = await authContext.db.getVehicleWithAccess(
      authContext.user.id,
      vehicleId
    );

    if (!existingVehicle) {
      return errors.notFound("Vehicle not found or access denied");
    }

    // Parse form data
    const form = await req.formData();
    const nickname = (form.get("nickname") as string) || null;
    const yearStr = (form.get("year") as string) || "";
    const year = yearStr ? Number(yearStr) : null;
    const make = (form.get("make") as string) || null;
    const model = (form.get("model") as string) || null;
    const trim = (form.get("trim") as string) || null;
    const privacy = ((form.get("privacy") as string) || "PRIVATE").toUpperCase();

    // Validate privacy value
    if (privacy !== "PUBLIC" && privacy !== "PRIVATE") {
      return errors.validation("Privacy must be either 'PUBLIC' or 'PRIVATE'");
    }

    // Validate year if provided
    if (year !== null && (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1)) {
      return errors.validation("Invalid year. Must be between 1900 and next year");
    }

    // Prepare update data
    const updates: Partial<Vehicle> = {};
    if (nickname !== null) updates.nickname = nickname;
    if (year !== null) updates.year = year;
    if (make !== null) updates.make = make;
    if (model !== null) updates.model = model;
    if (trim !== null) updates.trim = trim;
    updates.privacy = privacy as "PUBLIC" | "PRIVATE";

    // Check if there are any actual changes
    const hasChanges = Object.keys(updates).length > 0;
    if (!hasChanges) {
      return errors.validation("No valid updates provided");
    }

    // Update the vehicle
    const updatedVehicle = await authContext.db.updateVehicle(
      authContext.user.id,
      vehicleId,
      updates
    );

    if (!updatedVehicle) {
      return errors.internal("Failed to update vehicle");
    }

    // Log the activity
    await logActivity({
      actorId: authContext.user.id,
      entityType: "vehicle",
      entityId: vehicleId,
      action: "update",
      diff: {
        before: {
          nickname: existingVehicle.nickname,
          year: existingVehicle.year,
          make: existingVehicle.make,
          model: existingVehicle.model,
          trim: existingVehicle.trim,
          privacy: existingVehicle.privacy,
        },
        after: updates,
      },
    });

    // Revalidate paths
    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath("/vehicles");

    return createSimpleSuccess(200);

  } catch (error) {
    console.error("Vehicle update error:", error);
    return errors.internal("Unexpected error during vehicle update");
  }
}

// Export the wrapped handlers
export const DELETE = auth.manager(deleteVehicleHandler);
export const PATCH = auth.contributor(updateVehicleHandler);


