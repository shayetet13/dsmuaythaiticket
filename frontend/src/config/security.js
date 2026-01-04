/**
 * Security Configuration
 * Centralized security settings and headers
 */

/**
 * Content Security Policy Headers
 * Prevents XSS, clickjacking, and other attacks
 */
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Remove unsafe-* in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' http://localhost:5000 https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

/**
 * Security Headers for API requests
 */
export const getSecurityHeaders = () => {
  return {
    'X-Requested-With': 'XMLHttpRequest',
    'X-Content-Type-Options': 'nosniff',
    // Don't expose sensitive headers
    'X-Powered-By': '', // Remove X-Powered-By header
  };
};

/**
 * Validate API response for security
 * @param {Object} response - API response
 * @returns {boolean} Is safe response
 */
export const validateApiResponse = (response) => {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
  ];
  
  const responseString = JSON.stringify(response);
  
  return !suspiciousPatterns.some(pattern => pattern.test(responseString));
};

/**
 * Rate limiting helper
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Remove old requests outside window
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return true;
  }
}

// Global rate limiter instance
export const apiRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

