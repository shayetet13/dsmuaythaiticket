import apiClient from './client';

/**
 * Booking Service
 * Handles all booking-related API calls
 */
class BookingService {
  /**
   * Create a new booking
   * @param {Object} bookingData - Booking data
   * @returns {Promise} Booking response
   */
  async createBooking(bookingData) {
    try {
      const response = await apiClient.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create booking');
    }
  }

  /**
   * Get all bookings (admin only)
   * @returns {Promise} List of bookings
   */
  async getAllBookings() {
    try {
      const response = await apiClient.get('/bookings');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch bookings');
    }
  }

  /**
   * Get booking by ID
   * @param {string} bookingId - Booking ID
   * @returns {Promise} Booking data
   */
  async getBookingById(bookingId) {
    try {
      const response = await apiClient.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch booking');
    }
  }

  /**
   * Get all stadiums
   * @returns {Promise} List of stadiums
   */
  async getStadiums() {
    try {
      const response = await apiClient.get('/stadiums');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch stadiums');
    }
  }

  /**
   * Get all zones
   * @returns {Promise} List of zones
   */
  async getZones() {
    try {
      const response = await apiClient.get('/zones');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch zones');
    }
  }

  /**
   * Health check
   * @returns {Promise} Health status
   */
  async healthCheck() {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Health check failed');
    }
  }

  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @param {string} defaultMessage - Default error message
   * @returns {Error} Formatted error
   */
  handleError(error, defaultMessage) {
    if (error.response) {
      // Server responded with error
      return new Error(
        error.response.data?.message || 
        error.response.data?.error || 
        defaultMessage
      );
    } else if (error.request) {
      // Request made but no response
      return new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || defaultMessage);
    }
  }
}

// Export singleton instance
export default new BookingService();

