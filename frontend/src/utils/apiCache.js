/**
 * Client-side API response cache
 * Reduces redundant API calls and improves performance
 */

const cache = new Map();
const CACHE_TTL = {
  hero: 5 * 60 * 1000, // 5 minutes
  highlights: 5 * 60 * 1000,
  stadiums: 5 * 60 * 1000,
  stadiumSchedules: 5 * 60 * 1000,
  specialMatches: 5 * 60 * 1000,
  dailyImages: 5 * 60 * 1000,
  upcomingFightsBackground: 5 * 60 * 1000,
  default: 60 * 1000 // 1 minute
};

/**
 * Get cached value
 */
export const getCache = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  
  // Check if expired
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
};

/**
 * Set cache value
 */
export const setCache = (key, value, ttl = null) => {
  const cacheKey = key.split('/').pop() || 'default';
  const ttlMs = ttl || CACHE_TTL[cacheKey] || CACHE_TTL.default;
  
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
};

/**
 * Clear cache
 */
export const clearCache = (keyPattern = null) => {
  if (keyPattern) {
    for (const key of cache.keys()) {
      if (key.includes(keyPattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

/**
 * Wrapper for axios requests with caching
 */
export const cachedRequest = async (axiosInstance, url, config = {}) => {
  // Only cache GET requests
  if (config.method && config.method.toLowerCase() !== 'get') {
    return axiosInstance(url, config);
  }
  
  // Check cache
  const cached = getCache(url);
  if (cached) {
    return { data: cached, fromCache: true };
  }
  
  // Make request
  const response = await axiosInstance(url, config);
  
  // Cache response
  if (response.data) {
    setCache(url, response.data);
  }
  
  return response;
};

export default { getCache, setCache, clearCache, cachedRequest };
