import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api.js';

/**
 * Custom hook to fetch available tickets for a stadium and date
 * @param {string} stadiumId - Stadium ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} - { regularTickets, specialTickets, loading, error }
 */
export const useAvailableTickets = (stadiumId, date) => {
  const [availableTickets, setAvailableTickets] = useState({
    regularTickets: [],
    specialTickets: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch if both stadiumId and date are provided
    if (!stadiumId || !date) {
      setAvailableTickets({ regularTickets: [], specialTickets: [] });
      setLoading(false);
      setError(null);
      return;
    }

    const fetchAvailableTickets = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_URL}/tickets/available`, {
          params: { stadiumId, date }
        });

        if (response.data.success) {
          setAvailableTickets({
            regularTickets: response.data.regularTickets || [],
            specialTickets: response.data.specialTickets || []
          });
        } else {
          throw new Error(response.data.error || 'Failed to fetch available tickets');
        }
      } catch (err) {
        console.error('Error fetching available tickets:', err);
        setError(err.message);
        setAvailableTickets({ regularTickets: [], specialTickets: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableTickets();
  }, [stadiumId, date]);

  return { ...availableTickets, loading, error };
};

/**
 * Check if a date has available tickets
 * @param {string} stadiumId - Stadium ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<boolean>} - True if tickets are available
 */
export const checkTicketAvailability = async (stadiumId, date) => {
  if (!stadiumId || !date) return false;
  
  try {
    const response = await axios.get(`${API_URL}/tickets/check-availability`, {
      params: { stadiumId, date }
    });

    return response.data.success && response.data.isAvailable;
  } catch (err) {
    console.error('Error checking ticket availability:', err);
    return false;
  }
};

