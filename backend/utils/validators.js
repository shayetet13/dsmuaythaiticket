/**
 * Input Validators
 * Validates request parameters and user input
 */

// Lazy import to avoid circular dependency
let getStadiumsExtended = null;

const loadStadiumsFunction = async () => {
  if (!getStadiumsExtended) {
    const dbModule = await import('../database.js');
    getStadiumsExtended = dbModule.getStadiumsExtended;
  }
  return getStadiumsExtended;
};

/**
 * Validate date string format (YYYY-MM-DD)
 */
export const isValidDateFormat = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day;
};

/**
 * Validate stadium ID
 * Basic format validation - actual existence check is done in API endpoints
 * This allows new stadiums to be added without hardcoding
 */
export const isValidStadiumId = (stadiumId) => {
  if (!stadiumId || typeof stadiumId !== 'string') {
    return false;
  }
  
  // Basic validation: non-empty string, alphanumeric with hyphens/underscores
  // Allow any valid stadium ID format (not just hardcoded ones)
  const stadiumIdRegex = /^[a-z0-9_-]+$/;
  return stadiumIdRegex.test(stadiumId) && stadiumId.length > 0 && stadiumId.length <= 50;
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Thai format)
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  const phoneRegex = /^[0-9]{9,10}$/;
  return phoneRegex.test(phone.replace(/[-\s]/g, ''));
};

/**
 * Validate positive number
 */
export const isPositiveNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input, maxLength = 255) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.trim().slice(0, maxLength);
};

