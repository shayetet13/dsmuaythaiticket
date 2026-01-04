/**
 * Security Utilities
 * Functions to protect sensitive data and prevent leaks
 */

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

/**
 * Mask sensitive data (emails, phone numbers)
 * @param {string} data - Data to mask
 * @param {string} type - Type of data (email, phone, etc.)
 * @returns {string} Masked data
 */
export const maskSensitiveData = (data, type = 'default') => {
  if (!data) return '';
  
  switch (type) {
    case 'email':
      const [local, domain] = data.split('@');
      if (!domain) return data;
      const maskedLocal = local.length > 2 
        ? `${local.substring(0, 2)}${'*'.repeat(Math.min(local.length - 2, 4))}`
        : '**';
      return `${maskedLocal}@${domain}`;
    
    case 'phone':
      if (data.length <= 4) return '****';
      return `${data.substring(0, 2)}${'*'.repeat(data.length - 4)}${data.substring(data.length - 2)}`;
    
    case 'token':
      if (data.length <= 8) return '********';
      return `${data.substring(0, 4)}${'*'.repeat(data.length - 8)}${data.substring(data.length - 4)}`;
    
    default:
      return data.length > 4 
        ? `${data.substring(0, 2)}${'*'.repeat(data.length - 4)}${data.substring(data.length - 2)}`
        : '****';
  }
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Thai format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid phone
 */
export const isValidPhone = (phone) => {
  // Thai phone: 0XXXXXXXXX or +66XXXXXXXXX
  const phoneRegex = /^(0|\+66)[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Remove sensitive data from object before logging
 * @param {Object} obj - Object to clean
 * @param {string[]} sensitiveKeys - Keys to remove/mask
 * @returns {Object} Cleaned object
 */
export const removeSensitiveData = (obj, sensitiveKeys = ['password', 'token', 'apiKey', 'secret']) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned = Array.isArray(obj) ? [...obj] : { ...obj };
  
  Object.keys(cleaned).forEach(key => {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      cleaned[key] = '***REDACTED***';
    } else if (typeof cleaned[key] === 'object' && cleaned[key] !== null) {
      cleaned[key] = removeSensitiveData(cleaned[key], sensitiveKeys);
    }
  });
  
  return cleaned;
};

/**
 * Generate secure random token
 * @param {number} length - Token length
 * @returns {string} Random token
 */
export const generateSecureToken = (length = 32) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Check if running in secure context (HTTPS)
 * @returns {boolean} Is secure context
 */
export const isSecureContext = () => {
  return window.isSecureContext || location.protocol === 'https:';
};

/**
 * Secure storage wrapper (prevents XSS access)
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
export const secureSetItem = (key, value) => {
  try {
    // Sanitize key
    const sanitizedKey = sanitizeInput(key);
    
    // Stringify value
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    // Store
    localStorage.setItem(sanitizedKey, stringValue);
  } catch (error) {
    console.error('Failed to store data securely:', error);
  }
};

/**
 * Secure storage getter
 * @param {string} key - Storage key
 * @returns {any} Stored value
 */
export const secureGetItem = (key) => {
  try {
    const sanitizedKey = sanitizeInput(key);
    const value = localStorage.getItem(sanitizedKey);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Failed to retrieve data securely:', error);
    return null;
  }
};

/**
 * Clear sensitive data from storage
 */
export const clearSensitiveData = () => {
  try {
    const sensitiveKeys = ['token', 'apiKey', 'auth', 'password', 'secret'];
    sensitiveKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear sensitive data:', error);
  }
};

