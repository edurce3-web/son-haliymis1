import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { apiCache, getCacheKey, CACHE_TTL } from '@/utils/cache';

interface UseApiCacheOptions {
  ttl?: number;
  enabled?: boolean;
  refetchOnMount?: boolean;
}

interface UseApiCacheReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

export function useApiCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  options: UseApiCacheOptions = {}
): UseApiCacheReturn<T> {
  const {
    ttl = CACHE_TTL.COURSES,
    enabled = true,
    refetchOnMount = false
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = apiCache.get<T>(cacheKey);
      if (cachedData && !refetchOnMount) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // Fetch fresh data
      const freshData = await fetchFn();
      
      // Cache the result
      apiCache.set(cacheKey, freshData, ttl);
      setData(freshData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error(`API Cache Error for ${cacheKey}:`, err);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchFn, ttl, enabled, refetchOnMount]);

  const clearCache = useCallback(() => {
    apiCache.delete(cacheKey);
  }, [cacheKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearCache
  };
}

// Specialized hooks for common use cases
export function useNavigationCache(userId?: number) {
  return useApiCache(
    getCacheKey.navigation(userId),
    async () => {
      const response = await fetch(`${API_BASE_URL}/navigation/menu`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch navigation');
      return response.json();
    },
    { ttl: CACHE_TTL.NAVIGATION }
  );
}

export function useSiteConfigCache() {
  return useApiCache(
    getCacheKey.siteConfig(),
    async () => {
      const response = await fetch(`${API_BASE_URL}/site/config`);
      if (!response.ok) throw new Error('Failed to fetch site config');
      return response.json();
    },
    { ttl: CACHE_TTL.SITE_CONFIG }
  );
}

export function useFooterConfigCache() {
  return useApiCache(
    getCacheKey.footerConfig(),
    async () => {
      const response = await fetch(`${API_BASE_URL}/site/footer`);
      if (!response.ok) throw new Error('Failed to fetch footer config');
      return response.json();
    },
    { ttl: CACHE_TTL.FOOTER_CONFIG }
  );
}

export function useCoursesCache(page: number = 1, filters?: any) {
  return useApiCache(
    getCacheKey.courses(page, filters),
    async () => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...filters
      });
      
      const response = await fetch(`${API_BASE_URL}/courses/search?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    },
    { ttl: CACHE_TTL.COURSES }
  );
}

export function useHomepageContentCache() {
  return useApiCache(
    getCacheKey.homepageContent(),
    async () => {
      const response = await fetch(`${API_BASE_URL}/homepage/content`);
      if (!response.ok) throw new Error('Failed to fetch homepage content');
      return response.json();
    },
    { ttl: CACHE_TTL.HOMEPAGE_CONTENT }
  );
}
