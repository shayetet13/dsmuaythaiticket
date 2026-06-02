/**
 * Simple in-memory cache for API responses
 * Reduces database queries and improves response time
 */

const cache = new Map();
const CACHE_TTL = {
  // Static data - cache for 5 minutes
  hero: 5 * 60 * 1000,
  highlights: 5 * 60 * 1000,
  stadiums: 5 * 60 * 1000,
  stadiumSchedules: 5 * 60 * 1000,
  specialMatches: 5 * 60 * 1000,
  dailyImages: 5 * 60 * 1000,
  upcomingFightsBackground: 5 * 60 * 1000,
  // Dynamic data - cache for 30 seconds
  tickets: 30 * 1000,
  bookings: 10 * 1000,
  // Default TTL
  default: 60 * 1000
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
 * Clear cache for a specific key or pattern
 */
export const clearCache = (keyPattern) => {
  if (keyPattern) {
    // Clear specific key
    if (cache.has(keyPattern)) {
      cache.delete(keyPattern);
    } else {
      // Clear keys matching pattern
      for (const key of cache.keys()) {
        if (key.includes(keyPattern)) {
          cache.delete(key);
        }
      }
    }
  } else {
    // Clear all cache
    cache.clear();
  }
};

/**
 * Middleware to cache GET responses
 */
export const cacheMiddleware = (key, ttl = null) => {
  return (req, res, next) => {
    const cacheKey = key || req.originalUrl;
    const cached = getCache(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }
    
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache response
    res.json = (data) => {
      setCache(cacheKey, data, ttl);
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Clean expired cache entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now > item.expiresAt) {
      cache.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

export default { getCache, setCache, clearCache, cacheMiddleware };
