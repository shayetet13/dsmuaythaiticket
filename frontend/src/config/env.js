// Environment Configuration
// ⚠️ NEVER commit .env files - they contain sensitive data

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Default value if not found
 * @returns {string} Environment variable value
 */
const getEnv = (key, defaultValue = '') => {
  return import.meta.env[key] || defaultValue;
};

// API Configuration
export const API_CONFIG = {
  // Base URL - ใช้ environment variable หรือ fallback
  BASE_URL: getEnv('VITE_API_BASE_URL', '/api'),
  
  // API Version
  VERSION: getEnv('VITE_API_VERSION', 'v1'),
  
  // Timeout (milliseconds)
  TIMEOUT: parseInt(getEnv('VITE_API_TIMEOUT', '30000'), 10),
  
  // Retry configuration
  RETRY: {
    MAX_RETRIES: parseInt(getEnv('VITE_API_MAX_RETRIES', '3'), 10),
    RETRY_DELAY: parseInt(getEnv('VITE_API_RETRY_DELAY', '1000'), 10),
  }
};

// Security Configuration
export const SECURITY_CONFIG = {
  // API Token (จะถูก inject จาก environment variable)
  API_TOKEN: getEnv('VITE_API_TOKEN', ''),
  
  // API Key (ถ้ามี)
  API_KEY: getEnv('VITE_API_KEY', ''),
  
  // Enable/Disable features
  ENABLE_ANALYTICS: getEnv('VITE_ENABLE_ANALYTICS', 'false') === 'true',
  ENABLE_DEBUG: getEnv('VITE_ENABLE_DEBUG', 'false') === 'true',
};

// App Configuration
export const APP_CONFIG = {
  NAME: getEnv('VITE_APP_NAME', 'FT Muay Thai Tickets'),
  VERSION: getEnv('VITE_APP_VERSION', '1.0.0'),
  ENV: getEnv('MODE', 'development'),
  
  // Feature flags
  FEATURES: {
    ADMIN_PANEL: getEnv('VITE_ENABLE_ADMIN', 'true') === 'true',
    BOOKING: getEnv('VITE_ENABLE_BOOKING', 'true') === 'true',
  }
};

// Build full API URL
export const getApiUrl = (endpoint = '') => {
  const baseUrl = API_CONFIG.BASE_URL;
  const version = API_CONFIG.VERSION;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // ถ้า BASE_URL เป็น relative path (เริ่มด้วย /) ไม่ต้องใส่ version
  if (baseUrl.startsWith('/')) {
    return `${baseUrl}${path}`;
  }
  
  return `${baseUrl}/${version}${path}`;
};

// Validate required environment variables
export const validateEnv = () => {
  const required = [];
  const missing = [];
  
  // ตรวจสอบ required vars (ถ้ามี)
  required.forEach(key => {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  });
  
  if (missing.length > 0 && APP_CONFIG.ENV === 'production') {
    console.error('❌ Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
};

// Initialize validation
if (typeof window !== 'undefined') {
  validateEnv();
}

