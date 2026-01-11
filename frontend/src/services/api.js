/**
 * API Service
 * Centralized API calls to backend
 * ✅ MCP Compliant: Uses centralized config
 */

import { API_URL } from '../config/api.js';

const API_BASE_URL = API_URL;

/**
 * Generic API call function
 */
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// ============================================================
// Ticket APIs
// ============================================================

/**
 * Check if tickets are available for a specific date
 * @param {string} stadiumId - Stadium ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} - Availability information
 */
export const checkTicketAvailability = async (stadiumId, date) => {
  return apiCall(`/tickets/check-availability?stadiumId=${stadiumId}&date=${date}`);
};

/**
 * Get available tickets for a specific date
 * @param {string} stadiumId - Stadium ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} - Available tickets
 */
export const getAvailableTickets = async (stadiumId, date) => {
  return apiCall(`/tickets/available?stadiumId=${stadiumId}&date=${date}`);
};

/**
 * Get ticket configuration for a stadium
 * @param {string} stadiumId - Stadium ID
 * @returns {Promise<Object>} - Ticket configuration
 */
export const getTicketConfig = async (stadiumId) => {
  return apiCall(`/tickets/config?stadiumId=${stadiumId}`);
};

// ============================================================
// Event APIs
// ============================================================

/**
 * Get upcoming events for a stadium
 * @param {string} stadiumId - Stadium ID
 * @param {number} limit - Maximum number of events
 * @returns {Promise<Object>} - Upcoming events
 */
export const getUpcomingEvents = async (stadiumId, limit = 4) => {
  return apiCall(`/events/upcoming?stadiumId=${stadiumId}&limit=${limit}`);
};

/**
 * Get upcoming events for all stadiums
 * @returns {Promise<Object>} - All upcoming events
 */
export const getAllUpcomingEvents = async () => {
  return apiCall('/events/all-upcoming');
};

// ============================================================
// Booking APIs
// ============================================================

/**
 * Create a new booking
 * @param {Object} bookingData - Booking information
 * @returns {Promise<Object>} - Created booking
 */
export const createBooking = async (bookingData) => {
  return apiCall('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });
};

/**
 * Get booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} - Booking information
 */
export const getBookingById = async (bookingId) => {
  return apiCall(`/bookings/${bookingId}`);
};

// ============================================================
// Stadium APIs
// ============================================================

/**
 * Get all stadiums
 * @returns {Promise<Array>} - List of stadiums
 */
export const getStadiums = async () => {
  return apiCall('/stadiums');
};

/**
 * Get all zones
 * @returns {Promise<Array>} - List of zones
 */
export const getZones = async () => {
  return apiCall('/zones');
};

export default {
  checkTicketAvailability,
  getAvailableTickets,
  getTicketConfig,
  getUpcomingEvents,
  getAllUpcomingEvents,
  createBooking,
  getBookingById,
  getStadiums,
  getZones,
};

