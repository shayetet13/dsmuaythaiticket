/**
 * Authentication & Authorization Middleware
 * Protects sensitive endpoints from unauthorized access
 */

// Secret keys for API authentication - Uses environment variables
const API_KEYS = {
  admin: process.env.ADMIN_API_KEY,
  internal: process.env.INTERNAL_API_KEY
};

// Validate required environment variables
if (!API_KEYS.admin || !API_KEYS.internal) {
  console.error('[Auth] ⚠️  Missing required API keys in environment variables!');
  console.error('[Auth] Please set ADMIN_API_KEY and INTERNAL_API_KEY in .env file');
  console.error('[Auth] Generate secure keys using: openssl rand -hex 32');
}

/**
 * Verify API Key from request header
 */
export const verifyApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      console.warn('[Auth] Missing API key:', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'API key is required' 
      });
    }

    // Check if API key is valid
    const isValid = Object.values(API_KEYS).includes(apiKey);
    
    if (!isValid) {
      console.warn('[Auth] Invalid API key attempt:', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        keyPrefix: apiKey.substring(0, 8) + '...'
      });
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Invalid API key' 
      });
    }

    console.log('[Auth] API key verified for:', req.path);
    next();

  } catch (error) {
    console.error('[Auth] Error verifying API key:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Authentication failed' 
    });
  }
};

/**
 * Admin-only access
 */
export const requireAdmin = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (apiKey !== API_KEYS.admin) {
      console.warn('[Auth] Unauthorized admin access attempt:', {
        ip: req.ip,
        path: req.path
      });
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Admin access required' 
      });
    }

    next();

  } catch (error) {
    console.error('[Auth] Error checking admin access:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Authorization failed' 
    });
  }
};

/**
 * Rate limiting to prevent abuse
 */
const rateLimitStore = new Map();

export const rateLimit = (maxRequests = 10, windowMs = 60000) => {
  return (req, res, next) => {
    try {
      const key = req.ip + req.path;
      const now = Date.now();
      
      // Get or create rate limit entry
      let entry = rateLimitStore.get(key);
      
      if (!entry) {
        entry = { count: 0, resetTime: now + windowMs };
        rateLimitStore.set(key, entry);
      }

      // Reset if window expired
      if (now > entry.resetTime) {
        entry.count = 0;
        entry.resetTime = now + windowMs;
      }

      // Increment counter
      entry.count++;

      // Check if exceeded
      if (entry.count > maxRequests) {
        console.warn('[Auth] Rate limit exceeded:', {
          ip: req.ip,
          path: req.path,
          count: entry.count
        });
        return res.status(429).json({ 
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        });
      }

      // Add rate limit info to response headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
      res.setHeader('X-RateLimit-Reset', entry.resetTime);

      next();

    } catch (error) {
      console.error('[Auth] Error in rate limiting:', error);
      next(); // Don't block request on rate limit error
    }
  };
};

/**
 * Clean up old rate limit entries (run periodically)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime + 60000) { // 1 minute after reset
      rateLimitStore.delete(key);
    }
  }
}, 300000); // Clean every 5 minutes

export default {
  verifyApiKey,
  requireAdmin,
  rateLimit
};

