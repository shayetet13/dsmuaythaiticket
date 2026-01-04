/**
 * Validation Utilities
 * Input validation and sanitization
 */

import { isValidEmail, isValidPhone } from './security';

/**
 * Validate booking form data
 * @param {Object} formData - Form data to validate
 * @returns {Object} Validation result { isValid, errors }
 */
export const validateBookingForm = (formData) => {
  const errors = {};
  
  // Name validation
  if (!formData.name || formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  // Email validation
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }
  
  // Phone validation
  if (!formData.phone) {
    errors.phone = 'Phone is required';
  } else if (!isValidPhone(formData.phone)) {
    errors.phone = 'Invalid phone format (Thai format: 0XXXXXXXXX)';
  }
  
  // Quantity validation
  if (!formData.quantity || formData.quantity < 1) {
    errors.quantity = 'Quantity must be at least 1';
  } else if (formData.quantity > 10) {
    errors.quantity = 'Maximum 10 tickets per booking';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitize form input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeFormInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, 500); // Limit length
};

/**
 * Validate date
 * @param {string|Date} date - Date to validate
 * @returns {boolean} Is valid date
 */
export const isValidDate = (date) => {
  if (!date) return false;
  const dateObj = date instanceof Date ? date : new Date(date);
  return !isNaN(dateObj.getTime()) && dateObj >= new Date();
};

/**
 * Validate stadium selection
 * @param {string} stadiumId - Stadium ID
 * @param {Array} availableStadiums - Available stadiums
 * @returns {boolean} Is valid stadium
 */
export const isValidStadium = (stadiumId, availableStadiums = []) => {
  if (!stadiumId) return false;
  return availableStadiums.some(s => s.id === stadiumId);
};

/**
 * Validate zone selection
 * @param {string} zoneId - Zone ID
 * @param {Array} availableZones - Available zones
 * @returns {boolean} Is valid zone
 */
export const isValidZone = (zoneId, availableZones = []) => {
  if (!zoneId) return false;
  return availableZones.some(z => z.id === zoneId);
};

