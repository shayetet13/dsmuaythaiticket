/**
 * Application Constants
 * ✅ MCP Compliant: Uses environment variables, no hardcoded values
 */

// Frontend URL from environment variable
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://dsmuaythaiticket.com';

// Support email from environment variable
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@dsmuaythaiticket.com';

// Export for use in components
export default {
  FRONTEND_URL,
  SUPPORT_EMAIL
};
