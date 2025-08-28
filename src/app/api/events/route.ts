import { NextRequest, NextResponse } from "next/server";
import { auth, AuthenticatedRequest, HandlerContext } from "@/lib/api/auth-middleware";
import { errors, createSuccessResponse } from "@/lib/api/errors";
import { serverLog } from "@/lib/serverLog";
import { validateCreateEventPayload, type CreateEventPayload } from "@/lib/validators/events";
import { logActivity } from "@/lib/activity/log";

interface CreateEventRequest extends CreateEventPayload {
  type_key?: string;
  occurred_on?: string;
  date_confidence?: string;
}

async function createEventHandler(
  req: NextRequest,
  context: HandlerContext,
  authContext: AuthenticatedRequest
) {
  const requestId = Math.random().toString(36).slice(2, 10);

  try {
    // Parse and validate request body
    const body: CreateEventRequest = await req.json().catch(() => ({}));
    const validation = validateCreateEventPayload(body);

    if (!validation.ok) {
      return errors.validation(validation.error);
    }

    const { vehicle_id, occurred_at, title, notes, type } = validation.data;

    // Extract additional fields from raw body
    const manualTypeKey = typeof body.type_key === 'string' ? body.type_key : undefined;
    const occurred_on = typeof body.occurred_on === 'string' ? body.occurred_on : null;
    const date_confidence = typeof body.date_confidence === 'string' ? body.date_confidence : undefined;

    // Map app types -> DB types
    const typeToDb: Record<string, string> = {
      SERVICE: "SERVICE",
      MOD: "INSTALL",
      NOTE: "INSPECT",
      DYNO: "TUNE",
    };
    const dbType = typeToDb[type] ?? "INSPECT";

    // Verify vehicle access (middleware should have already checked this)
    const vehicle = await authContext.db.getVehicleWithAccess(
      authContext.user.id,
      vehicle_id
    );

    if (!vehicle) {
      return errors.notFound("Vehicle not found or access denied");
    }

    // Prepare insert payload
    const insertPayload = {
      vehicle_id,
      type: dbType,
      title: title || null,
      notes: notes || null,
      occurred_at: occurred_at || null,
      occurred_on: occurred_on || null,
      date_confidence: date_confidence || (occurred_at ? 'exact' : 'unknown'),
      manual_type_key: manualTypeKey || null,
      created_by: authContext.user.id,
    };

    // Insert the event
    const { data: created, error: insertError } = await authContext.supabase
      .from("event")
      .insert(insertPayload)
      .select("id, type, created_at, vehicle_id, title, notes, occurred_at, occurred_on, date_confidence, manual_type_key")
      .single();

    if (insertError) {
      console.error("Event creation error:", insertError);
      return errors.internal("Failed to create event: " + insertError.message);
    }

    // Update vehicle.last_event_at
    try {
      await authContext.supabase
        .from("vehicle")
        .update({ last_event_at: created.created_at })
        .eq("id", vehicle_id);
    } catch (updateError) {
      console.error("Failed to update vehicle last_event_at:", updateError);
      // Don't fail the request for this
    }

    // Log the event creation
    serverLog("event_create", {
      userId: authContext.user.id,
      vehicleId: vehicle_id,
      type: dbType,
      requestId
    });

    // Map DB type -> app type in response
    const dbToApp: Record<string, string> = {
      SERVICE: "SERVICE",
      INSTALL: "MOD",
      INSPECT: "NOTE",
      TUNE: "DYNO"
    };
    const appType = dbToApp[created.type] ?? "NOTE";

    // Try to enrich display metadata from event_types when manualTypeKey provided
    let display: { label?: string | null; icon?: string | null; color?: string | null } = {};
    if (created.manual_type_key) {
      try {
        const { data: eventType } = await authContext.supabase
          .from('event_types')
          .select('label, icon, color')
          .eq('key', created.manual_type_key)
          .maybeSingle();

        if (eventType) {
          display = {
            label: eventType.label,
            icon: eventType.icon,
            color: eventType.color
          };
        }
      } catch (metadataError) {
        console.error("Failed to fetch event type metadata:", metadataError);
        // Don't fail the request for this
      }
    }

    // Log activity
    await logActivity({
      actorId: authContext.user.id,
      entityType: "event",
      entityId: created.id,
      action: "create",
      diff: {
        after: {
          vehicle_id: created.vehicle_id,
          type: appType,
          title: created.title,
          notes: created.notes,
          occurred_at: created.occurred_at,
        }
      },
    });

    const event = {
      id: created.id,
      vehicle_id: created.vehicle_id,
      type: appType,
      title: created.title ?? title,
      notes: created.notes ?? null,
      occurred_at: created.occurred_at ?? created.created_at,
      occurred_on: created.occurred_on ?? (created.created_at ? created.created_at.slice(0, 10) : null),
      date_confidence: created.date_confidence ?? (occurred_at ? 'exact' : 'unknown'),
      manualTypeKey: created.manual_type_key ?? manualTypeKey,
      ...display,
    };

    return createSuccessResponse({ event }, 201);

  } catch (error) {
    console.error("Event creation handler error:", error);
    return errors.internal("Unexpected error during event creation");
  }
}

// Keep the GET handler simple
export async function GET(): Promise<Response> {
  return NextResponse.json({ ok: true, route: "/api/events" }, { status: 200 });
}

// Export the wrapped POST handler
export const POST = auth.authenticated(createEventHandler);

