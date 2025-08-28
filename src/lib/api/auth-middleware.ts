import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { errors } from "./errors";
import { DatabaseService, Role, Vehicle } from "./database";

export interface AuthenticatedRequest {
  user: {
    id: string;
    email?: string;
  };
  supabase: Awaited<ReturnType<typeof getServerSupabase>>;
  db: DatabaseService;
}

/**
 * Options for authorization middleware
 */
export interface AuthOptions {
  /** Required role for accessing the resource */
  requiredRole?: Role;
  /** Whether public access is allowed (for public endpoints) */
  allowPublic?: boolean;
  /** Additional custom authorization check */
  customAuth?: (req: AuthenticatedRequest, context: HandlerContext) => Promise<boolean>;
}

/**
 * Context passed to the handler
 */
export interface HandlerContext {
  params?: Record<string, string | string[]>;
}

/**
 * API handler function signature
 */
export type ApiHandler = (
  req: NextRequest,
  context: HandlerContext,
  auth: AuthenticatedRequest
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps an API handler with standardized authentication and authorization
 */
export function withAuth(
  handler: ApiHandler,
  options: AuthOptions = {}
): (req: NextRequest, context?: HandlerContext) => Promise<NextResponse> {
  return async (req: NextRequest, context: HandlerContext = {}) => {
    try {
      // Get authenticated user
      const supabase = await getServerSupabase();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth middleware - auth error:", authError);
        return errors.internal("Authentication service error");
      }

      if (!user) {
        return errors.unauthorized();
      }

      // Create authenticated context
      const auth: AuthenticatedRequest = {
        user: {
          id: user.id,
          email: user.email,
        },
        supabase,
        db: new DatabaseService(supabase),
      };

      // Handle public access
      if (options.allowPublic) {
        return await handler(req, context, auth);
      }

      // Handle garage-specific authorization
      if (context.params?.garageId) {
        const garageId = Array.isArray(context.params.garageId)
          ? context.params.garageId[0]
          : context.params.garageId;

        const hasAccess = await auth.db.ensureGarageAccess(
          user.id,
          garageId,
          options.requiredRole
        );

        if (!hasAccess) {
          return errors.forbidden(
            `Insufficient permissions. Required role: ${options.requiredRole || "MEMBER"}`
          );
        }
      }

      // Handle vehicle-specific authorization
      if (context.params?.vehicleId) {
        const vehicleId = Array.isArray(context.params.vehicleId)
          ? context.params.vehicleId[0]
          : context.params.vehicleId;

        const vehicle = await auth.db.getVehicleWithAccess(user.id, vehicleId);
        if (!vehicle) {
          return errors.notFound("Vehicle not found or access denied");
        }

        // Store vehicle in context for handler use
        (context as HandlerContext & { vehicle?: Vehicle }).vehicle = vehicle;

        // Check role if required
        if (options.requiredRole) {
          const hasAccess = await (new DatabaseService(supabase)).ensureGarageAccess(
            user.id,
            vehicle.garage_id,
            options.requiredRole
          );

          if (!hasAccess) {
            return errors.forbidden(
              `Insufficient permissions. Required role: ${options.requiredRole}`
            );
          }
        }
      }

      // Custom authorization check
      if (options.customAuth) {
        const isAuthorized = await options.customAuth(auth, context);
        if (!isAuthorized) {
          return errors.forbidden("Access denied by custom authorization");
        }
      }

      // All checks passed, call the handler
      return await handler(req, context, auth);

    } catch (error) {
      console.error("Auth middleware error:", error);
      return errors.internal("Unexpected error during authorization");
    }
  };
}

/**
 * Convenience wrappers for common authorization patterns
 */
export const auth = {
  /** Requires authentication but no specific role */
  authenticated: (handler: ApiHandler) =>
    withAuth(handler),

  /** Requires MANAGER or OWNER role */
  manager: (handler: ApiHandler) =>
    withAuth(handler, { requiredRole: "MANAGER" }),

  /** Requires CONTRIBUTOR, MANAGER, or OWNER role */
  contributor: (handler: ApiHandler) =>
    withAuth(handler, { requiredRole: "CONTRIBUTOR" }),

  /** Allows public access */
  public: (handler: ApiHandler) =>
    withAuth(handler, { allowPublic: true }),

  /** Custom authorization */
  custom: (handler: ApiHandler, options: AuthOptions) =>
    withAuth(handler, options),
};
