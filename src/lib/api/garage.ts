import { DatabaseService } from "./database";
import { globalCache, CacheKeys } from "./cache";

export interface GarageMember {
  id: string;
  user_id: string;
  role: "OWNER" | "MANAGER" | "CONTRIBUTOR" | "VIEWER";
  email: string;
  created_at: string;
}

export interface GarageWithMembers {
  id: string;
  name: string;
  type: "PERSONAL" | "SHOP" | "CLUB";
  owner_id: string;
  members: GarageMember[];
  memberCount: number;
}

/**
 * Optimized garage service to replace N+1 queries
 */
export class GarageService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Get garage members with emails in a single optimized query
   * This replaces the N+1 query pattern in the original getMembers function
   */
  async getGarageMembers(garageId: string): Promise<GarageMember[]> {
    const cacheKey = CacheKeys.userGarageMemberships(`garage_${garageId}`);

    // Try cache first (members change moderately)
    const cached = globalCache.get(cacheKey);
    if (cached && Array.isArray(cached)) {
      return cached as GarageMember[];
    }

    // Single optimized query that joins garage_member with auth.users
    const { data, error } = await this.db.getSupabaseClient()
      .from('garage_member')
      .select(`
        id,
        user_id,
        role,
        created_at,
        auth.users!inner(email)
      `)
      .eq('garage_id', garageId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Garage members query error:', error);
      return [];
    }

    const members: GarageMember[] = (data as unknown[] || []).map((member: unknown) => {
      const m = member as Record<string, unknown>;
      return {
        id: String(m.id || ''),
        user_id: String(m.user_id || ''),
        role: String(m.role || 'VIEWER') as GarageMember['role'], // Type assertion for role
        email: String(((m.users as Record<string, unknown>)?.email) || m.user_id || ''), // Fallback to user_id if email not available
        created_at: String(m.created_at || '')
      };
    });

    // Cache for 5 minutes (members change moderately)
    globalCache.set(cacheKey, members, 5 * 60 * 1000);

    return members;
  }

  /**
   * Get garage with all members in a single optimized query
   */
  async getGarageWithMembers(garageId: string): Promise<GarageWithMembers | null> {
    const cacheKey = `garage_with_members_${garageId}`;

    // Try cache first
    const cached = globalCache.get(cacheKey);
    if (cached) {
      return cached as GarageWithMembers;
    }

    // Get garage info and members in parallel
    const [garageResult, members] = await Promise.all([
      this.db.getSupabaseClient()
        .from('garage')
        .select('id, name, type, owner_id')
        .eq('id', garageId)
        .maybeSingle(),
      this.getGarageMembers(garageId)
    ]);

    if (garageResult.error || !garageResult.data) {
      console.error('Garage query error:', garageResult.error);
      return null;
    }

    const garage: GarageWithMembers = {
      ...garageResult.data,
      members,
      memberCount: members.length
    };

    // Cache for 10 minutes (garage info changes rarely)
    globalCache.set(cacheKey, garage, 10 * 60 * 1000);

    return garage;
  }

  /**
   * Get user's role in a specific garage (optimized)
   */
  async getUserGarageRole(userId: string, garageId: string): Promise<string | null> {
    const cacheKey = CacheKeys.userGarageMemberships(userId);

    // Try cache first
    const cachedMemberships = globalCache.get(cacheKey);
    if (cachedMemberships && typeof cachedMemberships === 'object' && cachedMemberships instanceof Map) {
      const membership = cachedMemberships.get(garageId);
      if (membership) {
        return membership.role;
      }
    }

    // Fallback to database query
    return this.db.getUserGarageRole(userId, garageId);
  }

  /**
   * Check if user can manage garage members
   */
  async canManageMembers(userId: string, garageId: string): Promise<boolean> {
    const userRole = await this.getUserGarageRole(userId, garageId);
    return userRole === 'OWNER' || userRole === 'MANAGER';
  }

  /**
   * Get garages where user has management permissions
   */
  async getManagedGarages(userId: string): Promise<Array<{ id: string; name: string; role: string }>> {
    const memberships = await this.db.getUserGarages(userId);
    return memberships.map(garage => ({
      id: garage.id,
      name: garage.name,
      role: 'OWNER' // Placeholder - should get actual role from membership
    }));
  }
}
