import { DatabaseService } from "./database";

export interface VehicleAnalytics {
  vehicle_id: string;
  upcoming_tasks: number;
  last_service_date: string | null;
  events_30_days: number;
  days_since_last_service: number | null;
  avg_days_between_services: number | null;
  last_event_date: string | null;
}

/**
 * Optimized analytics service to replace N+1 queries
 * Uses database aggregations and window functions for maximum performance
 */
export class AnalyticsService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Get analytics for multiple vehicles in a single optimized query
   * This replaces the 4 separate queries with complex client-side processing
   */
  async getVehicleAnalytics(vehicleIds: string[]): Promise<Map<string, VehicleAnalytics>> {
    if (vehicleIds.length === 0) {
      return new Map();
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Single optimized query that combines all analytics
    const { data, error } = await this.db.getSupabaseClient().rpc('get_vehicle_analytics', {
      vehicle_ids: vehicleIds,
      thirty_days_ago: thirtyDaysAgo
    });

    if (error) {
      console.error('Analytics query error:', error);
      return new Map();
    }

    // Convert array to Map for easy lookup
    const analyticsMap = new Map<string, VehicleAnalytics>();
    (data as VehicleAnalytics[] || []).forEach(analytics => {
      analyticsMap.set(analytics.vehicle_id, analytics);
    });

    return analyticsMap;
  }

  /**
   * Get dashboard overview analytics (for home page)
   */
  async getDashboardAnalytics(userId: string): Promise<{
    totalVehicles: number;
    upcomingTasks: number;
    recentEvents: number;
    avgDaysBetweenServices: number | null;
  }> {
    const { data, error } = await this.db.getSupabaseClient().rpc('get_dashboard_analytics', {
      user_id: userId
    });

    if (error) {
      console.error('Dashboard analytics error:', error);
      return {
        totalVehicles: 0,
        upcomingTasks: 0,
        recentEvents: 0,
        avgDaysBetweenServices: null
      };
    }

    return data?.[0] || {
      totalVehicles: 0,
      upcomingTasks: 0,
      recentEvents: 0,
      avgDaysBetweenServices: null
    };
  }

  /**
   * Get garage membership cache to avoid repeated checks
   */
  async getUserGarageMemberships(userId: string): Promise<Map<string, { role: string; garage_name: string }>> {
    // Get memberships first
    const { data: memberships, error: membershipError } = await this.db.getSupabaseClient()
      .from('garage_member')
      .select('garage_id, role')
      .eq('user_id', userId);

    if (membershipError) {
      console.error('Garage membership query error:', membershipError);
      return new Map();
    }

    if (!memberships || memberships.length === 0) {
      return new Map();
    }

    // Get garage names
    const garageIds = memberships.map(m => m.garage_id);
    const { data: garages, error: garageError } = await this.db.getSupabaseClient()
      .from('garage')
      .select('id, name')
      .in('id', garageIds);

    if (garageError) {
      console.error('Garage query error:', garageError);
      return new Map();
    }

    const garageMap = new Map((garages || []).map(g => [g.id, g.name]));

    const membershipMap = new Map<string, { role: string; garage_name: string }>();
    memberships.forEach((membership) => {
      membershipMap.set(membership.garage_id, {
        role: membership.role,
        garage_name: garageMap.get(membership.garage_id) || 'Unknown Garage'
      });
    });

    return membershipMap;
  }

  /**
   * Batch vehicle access check for multiple vehicles
   */
  async getAccessibleVehicles(userId: string, vehicleIds: string[]): Promise<Set<string>> {
    if (vehicleIds.length === 0) {
      return new Set();
    }

    // Get user's garage memberships
    const memberships = await this.getUserGarageMemberships(userId);
    const userGarageIds = Array.from(memberships.keys());

    if (userGarageIds.length === 0) {
      return new Set();
    }

    // Batch query for vehicle access
    const { data, error } = await this.db.getSupabaseClient()
      .from('vehicle')
      .select('id')
      .in('id', vehicleIds)
      .in('garage_id', userGarageIds);

    if (error) {
      console.error('Vehicle access check error:', error);
      return new Set();
    }

    return new Set((data || []).map(v => v.id));
  }
}
