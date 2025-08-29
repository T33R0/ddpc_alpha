/**
 * Simple in-memory cache for performance optimization
 * In production, this should be replaced with Redis or similar
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL: number; // TTL in milliseconds

  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Delete cached data
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size (for monitoring)
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Global cache instance
 */
export const globalCache = new MemoryCache();

// Cache keys
export const CacheKeys = {
  vehicleAnalytics: (userId: string, vehicleIds: string[]) =>
    `analytics:vehicles:${userId}:${vehicleIds.sort().join(',')}`,

  dashboardAnalytics: (userId: string) =>
    `analytics:dashboard:${userId}`,

  userGarageMemberships: (userId: string) =>
    `memberships:${userId}`,

  vehicleAccess: (userId: string, vehicleIds: string[]) =>
    `access:vehicles:${userId}:${vehicleIds.sort().join(',')}`,
} as const;

/**
 * Cache wrapper for analytics service
 */
export class CachedAnalyticsService {
  private cache: MemoryCache;
  private analyticsService: {
    getVehicleAnalytics: (vehicleIds: string[]) => Promise<Map<string, import('./analytics').VehicleAnalytics>>;
    getDashboardAnalytics: (userId: string) => Promise<{
      totalVehicles: number;
      upcomingTasks: number;
      recentEvents: number;
      avgDaysBetweenServices: number | null;
    }>;
    getUserGarageMemberships: (userId: string) => Promise<Map<string, { role: string; garage_name: string }>>;
    getAccessibleVehicles: (userId: string, vehicleIds: string[]) => Promise<Set<string>>;
  };

  constructor(analyticsService: typeof CachedAnalyticsService.prototype.analyticsService, cache?: MemoryCache) {
    this.cache = cache || globalCache;
    this.analyticsService = analyticsService;
  }

  async getVehicleAnalytics(vehicleIds: string[]): Promise<Map<string, import('./analytics').VehicleAnalytics>> {
    const cacheKey = CacheKeys.vehicleAnalytics('current-user', vehicleIds);

    // Try cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as Map<string, import('./analytics').VehicleAnalytics>;
    }

    // Fetch from service
    const result = await this.analyticsService.getVehicleAnalytics(vehicleIds);

    // Cache result (shorter TTL for analytics)
    this.cache.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes

    return result;
  }

  async getDashboardAnalytics(userId: string): Promise<{
    totalVehicles: number;
    upcomingTasks: number;
    recentEvents: number;
    avgDaysBetweenServices: number | null;
  }> {
    const cacheKey = CacheKeys.dashboardAnalytics(userId);

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as {
        totalVehicles: number;
        upcomingTasks: number;
        recentEvents: number;
        avgDaysBetweenServices: number | null;
      };
    }

    const result = await this.analyticsService.getDashboardAnalytics(userId);

    // Cache dashboard data for longer (5 minutes)
    this.cache.set(cacheKey, result, 5 * 60 * 1000);

    return result;
  }

  async getUserGarageMemberships(userId: string): Promise<Map<string, { role: string; garage_name: string }>> {
    const cacheKey = CacheKeys.userGarageMemberships(userId);

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as Map<string, { role: string; garage_name: string }>;
    }

    const result = await this.analyticsService.getUserGarageMemberships(userId);

    // Cache memberships for longer (10 minutes)
    this.cache.set(cacheKey, result, 10 * 60 * 1000);

    return result;
  }

  async getAccessibleVehicles(userId: string, vehicleIds: string[]): Promise<Set<string>> {
    const cacheKey = CacheKeys.vehicleAccess(userId, vehicleIds);

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as Set<string>;
    }

    const result = await this.analyticsService.getAccessibleVehicles(userId, vehicleIds);

    // Cache access checks for medium duration (3 minutes)
    this.cache.set(cacheKey, result, 3 * 60 * 1000);

    return result;
  }
}
