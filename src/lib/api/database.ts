import { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase";

export type Role = "OWNER" | "MANAGER" | "CONTRIBUTOR" | "VIEWER";

/**
 * Core database types
 */
export interface Garage {
  id: string;
  name: string;
  type: "PERSONAL" | "SHOP" | "CLUB";
  owner_id: string;
  created_at: string;
}

export interface GarageMember {
  garage_id: string;
  user_id: string;
  role: Role;
  created_at: string;
}

export interface Vehicle {
  id: string;
  garage_id: string;
  vin: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  nickname: string | null;
  privacy: "PUBLIC" | "PRIVATE";
  photo_url: string | null;
  created_at: string;
}

/**
 * Unified database service for consistent data access
 */
export class DatabaseService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Create a new DatabaseService instance with default Supabase client
   */
  static async create(): Promise<DatabaseService> {
    const supabase = await getServerSupabase();
    return new DatabaseService(supabase);
  }

  /**
   * Get all garages a user has access to
   */
  async getUserGarages(userId: string): Promise<Garage[]> {
    const { data, error } = await this.supabase
      .from("garage")
      .select("*")
      .or(`owner_id.eq.${userId},id.in.(${await this.getUserGarageIdsQuery(userId)})`);

    if (error) {
      console.error("DatabaseService.getUserGarages error:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Get garage IDs a user has access to (for subqueries)
   */
  private async getUserGarageIdsQuery(userId: string): Promise<string> {
    const { data } = await this.supabase
      .from("garage_member")
      .select("garage_id")
      .eq("user_id", userId);

    const ids = (data || []).map(m => m.garage_id);
    return ids.length > 0 ? `(${ids.join(",")})` : "(null)";
  }

  /**
   * Get user's role in a specific garage
   */
  async getUserGarageRole(userId: string, garageId: string): Promise<Role | null> {
    // First check if user is owner
    const { data: garage } = await this.supabase
      .from("garage")
      .select("owner_id")
      .eq("id", garageId)
      .maybeSingle();

    if (garage?.owner_id === userId) {
      return "OWNER";
    }

    // Check membership role
    const { data: member } = await this.supabase
      .from("garage_member")
      .select("role")
      .eq("garage_id", garageId)
      .eq("user_id", userId)
      .maybeSingle();

    return member?.role as Role || null;
  }

  /**
   * Ensure user has access to a garage with required role
   */
  async ensureGarageAccess(
    userId: string,
    garageId: string,
    requiredRole?: Role
  ): Promise<boolean> {
    const userRole = await this.getUserGarageRole(userId, garageId);

    if (!userRole) {
      return false;
    }

    if (!requiredRole) {
      return true; // Any role is sufficient
    }

    // Role hierarchy: OWNER > MANAGER > CONTRIBUTOR > VIEWER
    const roleHierarchy: Record<Role, number> = {
      OWNER: 4,
      MANAGER: 3,
      CONTRIBUTOR: 2,
      VIEWER: 1,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  /**
   * Get vehicle with garage access check
   */
  async getVehicleWithAccess(userId: string, vehicleId: string): Promise<Vehicle | null> {
    const { data: vehicle } = await this.supabase
      .from("vehicle")
      .select("*")
      .eq("id", vehicleId)
      .maybeSingle();

    if (!vehicle) {
      return null;
    }

    // Check if user has access to the vehicle's garage
    const hasAccess = await this.ensureGarageAccess(userId, vehicle.garage_id);
    if (!hasAccess) {
      return null;
    }

    return vehicle;
  }

  /**
   * Get vehicles for a user
   */
  async getUserVehicles(userId: string, garageId?: string): Promise<Vehicle[]> {
    let query = this.supabase
      .from("vehicle")
      .select("*");

    if (garageId) {
      // Specific garage - verify access
      const hasAccess = await this.ensureGarageAccess(userId, garageId);
      if (!hasAccess) {
        return [];
      }
      query = query.eq("garage_id", garageId);
    } else {
      // All garages user has access to
      const userGarageIds = await this.getUserGarages(userId).then(garages =>
        garages.map(g => g.id)
      );

      if (userGarageIds.length === 0) {
        return [];
      }

      query = query.in("garage_id", userGarageIds);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("DatabaseService.getUserVehicles error:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Create a vehicle
   */
  async createVehicle(
    userId: string,
    garageId: string,
    vehicleData: Partial<Vehicle>
  ): Promise<Vehicle | null> {
    // Verify user can write to garage
    const hasAccess = await this.ensureGarageAccess(userId, garageId, "CONTRIBUTOR");
    if (!hasAccess) {
      return null;
    }

    const { data, error } = await this.supabase
      .from("vehicle")
      .insert({
        ...vehicleData,
        garage_id: garageId,
      })
      .select("*")
      .single();

    if (error) {
      console.error("DatabaseService.createVehicle error:", error);
      return null;
    }

    return data;
  }

  /**
   * Update a vehicle
   */
  async updateVehicle(
    userId: string,
    vehicleId: string,
    updates: Partial<Vehicle>
  ): Promise<Vehicle | null> {
    // Get vehicle and verify access
    const vehicle = await this.getVehicleWithAccess(userId, vehicleId);
    if (!vehicle) {
      return null;
    }

    // Verify write access
    const hasAccess = await this.ensureGarageAccess(userId, vehicle.garage_id, "CONTRIBUTOR");
    if (!hasAccess) {
      return null;
    }

    const { data, error } = await this.supabase
      .from("vehicle")
      .update(updates)
      .eq("id", vehicleId)
      .select("*")
      .single();

    if (error) {
      console.error("DatabaseService.updateVehicle error:", error);
      return null;
    }

    return data;
  }

  /**
   * Delete a vehicle
   */
  async deleteVehicle(userId: string, vehicleId: string): Promise<boolean> {
    // Get vehicle and verify access
    const vehicle = await this.getVehicleWithAccess(userId, vehicleId);
    if (!vehicle) {
      return false;
    }

    // Only OWNER or MANAGER can delete
    const hasAccess = await this.ensureGarageAccess(userId, vehicle.garage_id, "MANAGER");
    if (!hasAccess) {
      return false;
    }

    const { error } = await this.supabase
      .from("vehicle")
      .delete()
      .eq("id", vehicleId);

    if (error) {
      console.error("DatabaseService.deleteVehicle error:", error);
      return false;
    }

    return true;
  }
}
