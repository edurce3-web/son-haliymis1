// Cache utility for API responses
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class APICache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = ttl || this.defaultTTL;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + expiry
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalMemory: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }
}

// Cache TTL configurations for different data types
export const CACHE_TTL = {
  NAVIGATION: 30 * 60 * 1000, // 30 minutes
  SITE_CONFIG: 60 * 60 * 1000, // 1 hour
  FOOTER_CONFIG: 60 * 60 * 1000, // 1 hour
  COURSES: 5 * 60 * 1000, // 5 minutes
  USER_PROFILE: 10 * 60 * 1000, // 10 minutes
  CATEGORIES: 30 * 60 * 1000, // 30 minutes
  HOMEPAGE_CONTENT: 15 * 60 * 1000, // 15 minutes
  SEARCH_RESULTS: 2 * 60 * 1000, // 2 minutes
} as const;

// Global cache instance
export const apiCache = new APICache();

// Auto cleanup every 10 minutes
setInterval(() => {
  apiCache.cleanup();
}, 10 * 60 * 1000);

// Cache key generators
export const getCacheKey = {
  navigation: (userId?: number) => `navigation_${userId || 'anonymous'}`,
  siteConfig: () => 'site_config',
  footerConfig: () => 'footer_config',
  courses: (page: number, filters?: any) => `courses_${page}_${JSON.stringify(filters || {})}`,
  userProfile: (userId: number) => `user_profile_${userId}`,
  categories: () => 'categories',
  homepageContent: () => 'homepage_content',
  searchResults: (query: string, filters?: any) => `search_${query}_${JSON.stringify(filters || {})}`,
  courseDetails: (courseId: number) => `course_details_${courseId}`,
  instructorCourses: (instructorId: number) => `instructor_courses_${instructorId}`,
};

export default apiCache;
