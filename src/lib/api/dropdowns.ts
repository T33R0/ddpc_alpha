import { DatabaseService } from "./database";
import { globalCache, CacheKeys } from "./cache";

export interface DropdownOptions {
  years: string[];
  makes: string[];
  models: string[];
  trims: string[];
}

/**
 * Optimized dropdown service to replace inefficient pagination queries
 */
export class DropdownService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Get all years (cached for long term)
   */
  async getYears(): Promise<string[]> {
    const cacheKey = CacheKeys.vehicleAnalytics('years', []);

    // Try cache first (years change rarely)
    const cached = globalCache.get(cacheKey);
    if (cached) {
      return cached as string[];
    }

    // Fetch from database
    const { data, error } = await this.db.getSupabaseClient().rpc('get_vehicle_years');

    if (error) {
      console.error('Years dropdown error:', error);
      return [];
    }

    const years = (data || []).map((row: { year_value: string }) => row.year_value).filter(Boolean);

    // Cache for 24 hours (years data is very stable)
    globalCache.set(cacheKey, years, 24 * 60 * 60 * 1000);

    return years;
  }

  /**
   * Get makes, optionally filtered by year
   */
  async getMakes(year?: string): Promise<string[]> {
    const cacheKey = CacheKeys.vehicleAnalytics('makes', year ? [year] : []);

    // Try cache first (makes change moderately)
    const cached = globalCache.get(cacheKey);
    if (cached) {
      return cached as string[];
    }

    // Fetch from database
    const { data, error } = await this.db.getSupabaseClient().rpc('get_vehicle_makes', {
      year_filter: year || null
    });

    if (error) {
      console.error('Makes dropdown error:', error);
      return [];
    }

    const makes = (data || []).map((row: { make_value: string }) => row.make_value).filter(Boolean);

    // Cache for 6 hours (makes data is fairly stable)
    globalCache.set(cacheKey, makes, 6 * 60 * 60 * 1000);

    return makes;
  }

  /**
   * Get models for a specific make, optionally filtered by year
   */
  async getModels(make: string, year?: string): Promise<string[]> {
    if (!make) return [];

    const cacheKey = CacheKeys.vehicleAnalytics('models', [make, year || ''].filter(Boolean));

    // Try cache first (models change moderately)
    const cached = globalCache.get(cacheKey);
    if (cached) {
      return cached as string[];
    }

    // Fetch from database
    const { data, error } = await this.db.getSupabaseClient().rpc('get_vehicle_models', {
      make_filter: make,
      year_filter: year || null
    });

    if (error) {
      console.error('Models dropdown error:', error);
      return [];
    }

    const models = (data || []).map((row: { model_value: string }) => row.model_value).filter(Boolean);

    // Cache for 6 hours
    globalCache.set(cacheKey, models, 6 * 60 * 60 * 1000);

    return models;
  }

  /**
   * Get trims for a specific make/model, optionally filtered by year
   */
  async getTrims(make: string, model: string, year?: string): Promise<string[]> {
    if (!make || !model) return [];

    const cacheKey = CacheKeys.vehicleAnalytics('trims', [make, model, year || ''].filter(Boolean));

    // Try cache first (trims change moderately)
    const cached = globalCache.get(cacheKey);
    if (cached) {
      return cached as string[];
    }

    // Fetch from database
    const { data, error } = await this.db.getSupabaseClient().rpc('get_vehicle_trims', {
      make_filter: make,
      model_filter: model,
      year_filter: year || null
    });

    if (error) {
      console.error('Trims dropdown error:', error);
      return [];
    }

    const trims = (data || []).map((row: { trim_value: string }) => row.trim_value).filter(Boolean);

    // Cache for 6 hours
    globalCache.set(cacheKey, trims, 6 * 60 * 60 * 1000);

    return trims;
  }

  /**
   * Get all dropdown options at once (for preloading)
   */
  async getAllOptions(year?: string, make?: string, model?: string): Promise<DropdownOptions> {
    const [years, makes, models, trims] = await Promise.all([
      this.getYears(),
      year ? this.getMakes(year) : this.getMakes(),
      make ? this.getModels(make, year) : Promise.resolve([]),
      (make && model) ? this.getTrims(make, model, year) : Promise.resolve([])
    ]);

    return {
      years,
      makes,
      models,
      trims
    };
  }

  /**
   * Warm up cache for common queries
   */
  async warmupCache(): Promise<void> {
    try {
      // Warm up years and popular makes
      await Promise.all([
        this.getYears(),
        this.getMakes() // Get all makes without year filter
      ]);
    } catch (error) {
      console.error('Cache warmup error:', error);
    }
  }
}
