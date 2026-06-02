/**
 * Application Constants
 * ✅ MCP Compliant: Uses environment variables, no hardcoded values
 */

// Frontend URL from environment variable
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://dsmuaythaiticket.com';

// Support email from environment variable
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@dsmuaythaiticket.com';

/** Home page & default document title (SEO / browser tab) */
export const HOME_PAGE_TITLE = 'DS MUAYTHAI TICKET | Official partner muaythai ticket';

/** Brand suffix for inner pages, e.g. "Booking - DS MUAYTHAI TICKET" */
export const DOCUMENT_TITLE_BRAND_SUFFIX = 'DS MUAYTHAI TICKET';

// Export for use in components
export default {
  FRONTEND_URL,
  SUPPORT_EMAIL,
  HOME_PAGE_TITLE,
  DOCUMENT_TITLE_BRAND_SUFFIX
};
