/**
 * Authentication & Authorization Middleware
 * Protects sensitive endpoints from unauthorized access
 */

import { verifyVerificationToken } from '../services/jwtService.js';

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

/**
 * Custom rate limiting for email verification
 * Uses email from token instead of IP address
 * This prevents issues with shared IPs (NAT, proxy, etc.)
 */
const emailVerificationRateLimitStore = new Map();

export const rateLimitEmailVerification = (maxRequests = 20, windowMs = 3600000) => {
  return (req, res, next) => {
    try {
      // Try to get email from token in request body
      let email = null;
      let verificationId = null;
      
      try {
        const { token } = req.body;
        if (token && typeof token === 'string') {
          try {
            const decoded = verifyVerificationToken(token);
            email = decoded.email;
            verificationId = decoded.verificationId;
            console.log('[Auth] Email verification rate limit - Token decoded:', {
              email: email,
              verificationId: verificationId?.substring(0, 8) + '...'
            });
          } catch (jwtError) {
            // Token invalid/expired - will be handled by endpoint
            // Skip rate limiting for invalid tokens (endpoint will handle error)
            console.log('[Auth] Email verification rate limit - Token invalid/expired, skipping rate limit check');
            next(); // Allow request to proceed, endpoint will handle error
            return;
          }
        } else {
          // No token in body - skip rate limiting (endpoint will handle error)
          console.log('[Auth] Email verification rate limit - No token in body, skipping rate limit check');
          next();
          return;
        }
      } catch (error) {
        // If we can't process token, skip rate limiting
        console.warn('[Auth] Email verification rate limit - Error processing token, skipping rate limit check:', error.message);
        next();
        return;
      }

      // Only apply rate limiting if we have email and verificationId
      if (!email || !verificationId) {
        console.log('[Auth] Email verification rate limit - Missing email/verificationId, skipping rate limit check');
        next();
        return;
      }

      // Use email + verificationId as key
      const key = `email_verify_${email}_${verificationId}`;
      
      const now = Date.now();
      
      // Get or create rate limit entry
      let entry = emailVerificationRateLimitStore.get(key);
      
      if (!entry) {
        entry = { count: 0, resetTime: now + windowMs };
        emailVerificationRateLimitStore.set(key, entry);
        console.log('[Auth] Email verification rate limit - New entry created:', {
          email: email,
          key: key.substring(0, 50) + '...'
        });
      }

      // Reset if window expired
      if (now > entry.resetTime) {
        entry.count = 0;
        entry.resetTime = now + windowMs;
        console.log('[Auth] Email verification rate limit - Window expired, resetting:', {
          email: email
        });
      }

      // Increment counter
      entry.count++;

      console.log('[Auth] Email verification rate limit - Current count:', {
        email: email,
        count: entry.count,
        maxRequests: maxRequests,
        remaining: maxRequests - entry.count
      });

      // Check if exceeded
      if (entry.count > maxRequests) {
        console.warn('[Auth] Email verification rate limit exceeded:', {
          email: email,
          verificationId: verificationId?.substring(0, 8) + '...',
          ip: req.ip,
          count: entry.count,
          maxRequests: maxRequests,
          key: key.substring(0, 50) + '...'
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
      console.error('[Auth] Error in email verification rate limiting:', error);
      next(); // Don't block request on rate limit error
    }
  };
};

/**
 * Clean up old email verification rate limit entries (run periodically)
 */
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, entry] of emailVerificationRateLimitStore.entries()) {
    if (now > entry.resetTime + 60000) { // 1 minute after reset
      emailVerificationRateLimitStore.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[Auth] Cleaned up ${cleaned} expired email verification rate limit entries`);
  }
}, 300000); // Clean every 5 minutes

/**
 * Clear all email verification rate limit entries (for debugging/reset)
 */
export const clearEmailVerificationRateLimit = () => {
  const count = emailVerificationRateLimitStore.size;
  emailVerificationRateLimitStore.clear();
  console.log(`[Auth] Cleared ${count} email verification rate limit entries`);
  return count;
};

export default {
  verifyApiKey,
  requireAdmin,
  rateLimit,
  rateLimitEmailVerification
};

