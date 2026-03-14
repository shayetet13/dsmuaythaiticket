/**
 * API Configuration
 * ✅ MCP Compliant: Uses environment variables, no hardcoded URLs
 */

// Get API URL from environment variable or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Remove trailing slash if present
export const API_URL = API_BASE_URL.replace(/\/$/, '');

// Export for components that need the base URL without /api
export const BASE_URL = API_URL.replace(/\/api$/, '');

// Get Admin API Key from environment variable
export const getAdminApiKey = () => {
  return import.meta.env.VITE_ADMIN_API_KEY || '';
};

// Create axios config with admin API key
export const getAdminAxiosConfig = () => {
  const apiKey = getAdminApiKey();
  if (!apiKey) {
    console.warn('⚠️ VITE_ADMIN_API_KEY not set in environment variables');
  }
  return {
    headers: {
      'X-API-Key': apiKey
    }
  };
};

// Log current API URL (only in development)
if (import.meta.env.DEV) {
  console.log('🔗 API URL:', API_URL);
  console.log('🔗 Base URL:', BASE_URL);
  console.log('🔗 Admin API Key:', getAdminApiKey() ? 'Set' : 'Not set');
}

export default API_URL;

