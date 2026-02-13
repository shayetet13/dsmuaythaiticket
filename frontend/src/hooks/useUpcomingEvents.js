/**
 * Custom Hook: useUpcomingEvents
 * Fetches upcoming events from backend API instead of computing on frontend
 */

import { useState, useEffect } from 'react';
import { getAllUpcomingEvents, getUpcomingEvents } from '../services/api';

/**
 * Hook to get all upcoming events for all stadiums
 */
export const useAllUpcomingEvents = () => {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await getAllUpcomingEvents();
        setEvents(data.events);
        setError(null);
      } catch (err) {
        console.error('Error fetching upcoming events:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading, error };
};

/**
 * Hook to get upcoming events for a specific stadium
 * @param {string} stadiumId - Stadium ID
 * @param {number} limit - Maximum number of events
 */
export const useStadiumEvents = (stadiumId, limit = 4) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stadiumId) {
      setLoading(false);
      return;
    }

    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await getUpcomingEvents(stadiumId, limit);
        setEvents(data.events || []);
        setError(null);
      } catch (err) {
        console.error(`Error fetching events for ${stadiumId}:`, err);
        setError(err.message);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [stadiumId, limit]);

  return { events, loading, error };
};

