import { VisualData } from './questionGenerationService';

interface CacheEntry {
  data: VisualData;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  cacheSize: number;
  hitRate: number;
}

class VisualCacheService {
  private cache = new Map<string, CacheEntry>();
  private maxCacheSize = 1000;
  private maxAge = 30 * 60 * 1000; // 30 minutes
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    cacheSize: 0,
    hitRate: 0
  };

  /**
   * Generate cache key from visual parameters
   */
  private generateCacheKey(
    subSkill: string,
    difficulty: number,
    visualType: string,
    additionalParams?: Record<string, any>
  ): string {
    const baseKey = `${subSkill}-${difficulty}-${visualType}`;
    if (additionalParams) {
      const paramString = Object.entries(additionalParams)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
        .join('|');
      return `${baseKey}-${paramString}`;
    }
    return baseKey;
  }

  /**
   * Get visual data from cache or return null if not found/expired
   */
  get(
    subSkill: string,
    difficulty: number,
    visualType: string,
    additionalParams?: Record<string, any>
  ): VisualData | null {
    this.stats.totalRequests++;

    const key = this.generateCacheKey(subSkill, difficulty, visualType, additionalParams);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if entry is expired
    const now = Date.now();
    if (now - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;
    this.updateHitRate();

    return entry.data;
  }

  /**
   * Store visual data in cache
   */
  set(
    subSkill: string,
    difficulty: number,
    visualType: string,
    visualData: VisualData,
    additionalParams?: Record<string, any>
  ): void {
    const key = this.generateCacheKey(subSkill, difficulty, visualType, additionalParams);
    const now = Date.now();

    // If cache is full, remove least recently used entries
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry = {
      data: visualData,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    this.stats.cacheSize = this.cache.size;
  }

  /**
   * Remove expired entries from cache
   */
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    this.stats.cacheSize = this.cache.size;
  }

  /**
   * Evict least recently used entries when cache is full
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      cacheSize: 0,
      hitRate: 0
    };
  }

  /**
   * Preload common visual patterns for better performance
   */
  async preloadCommonVisuals(): Promise<void> {
    const commonCombinations = [
      { subSkill: 'Geometry', difficulty: 1, visualType: 'geometry' },
      { subSkill: 'Geometry', difficulty: 2, visualType: 'geometry' },
      { subSkill: 'Geometry', difficulty: 3, visualType: 'geometry' },
      { subSkill: 'Statistics', difficulty: 1, visualType: 'chart' },
      { subSkill: 'Statistics', difficulty: 2, visualType: 'chart' },
      { subSkill: 'Statistics', difficulty: 3, visualType: 'chart' },
      { subSkill: 'Pattern Recognition', difficulty: 1, visualType: 'pattern' },
      { subSkill: 'Pattern Recognition', difficulty: 2, visualType: 'pattern' },
      { subSkill: 'Pattern Recognition', difficulty: 3, visualType: 'pattern' },
      { subSkill: 'Algebra', difficulty: 1, visualType: 'diagram' },
      { subSkill: 'Algebra', difficulty: 2, visualType: 'diagram' },
      { subSkill: 'Algebra', difficulty: 3, visualType: 'diagram' }
    ];

    // Note: This would integrate with the actual visual generation service
    // For now, we're just setting up the cache structure

  }

  /**
   * Get cache performance metrics for monitoring
   */
  getPerformanceMetrics(): {
    hitRate: number;
    averageAccessCount: number;
    cacheEfficiency: string;
    memoryUsage: number;
  } {
    let totalAccessCount = 0;
    let entryCount = 0;

    for (const entry of this.cache.values()) {
      totalAccessCount += entry.accessCount;
      entryCount++;
    }

    const averageAccessCount = entryCount > 0 ? totalAccessCount / entryCount : 0;
    const memoryUsage = this.cache.size * 1024; // Rough estimate in bytes

    let cacheEfficiency = 'Poor';
    if (this.stats.hitRate > 80) cacheEfficiency = 'Excellent';
    else if (this.stats.hitRate > 60) cacheEfficiency = 'Good';
    else if (this.stats.hitRate > 40) cacheEfficiency = 'Fair';

    return {
      hitRate: this.stats.hitRate,
      averageAccessCount,
      cacheEfficiency,
      memoryUsage
    };
  }
}

// Export singleton instance
export const visualCacheService = new VisualCacheService();
export default visualCacheService;
