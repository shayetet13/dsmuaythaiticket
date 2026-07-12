import React from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { useDatabase } from '../hooks/useDatabase';
import { isStadiumSlug, parseStadiumIdFromPath } from '../utils/bookingUrls';
import StadiumUpcomingPage from './StadiumUpcomingPage';
import BookingPage from './BookingPage';

/**
 * Handles routes like /rajadamnern-stadium-ticket and /rajadamnern-stadium-ticket?date=xxx&step=payment
 * Renders StadiumUpcomingPage (upcoming fights) or BookingPage (booking flow) based on URL params
 */
const StadiumSlugHandler = () => {
  const { stadiumSlug } = useParams();
  const [searchParams] = useSearchParams();
  const { stadiums, dbLoaded } = useDatabase('en'); // language not critical for validation

  if (!stadiumSlug || !isStadiumSlug(stadiumSlug)) {
    return <Navigate to="/" replace />;
  }

  const stadiumId = parseStadiumIdFromPath(`/${stadiumSlug}`);
  if (!stadiumId) {
    return <Navigate to="/" replace />;
  }

  const stadiumExists = dbLoaded && stadiums.some(s => s && s.id === stadiumId);
  if (dbLoaded && !stadiumExists) {
    return <Navigate to="/" replace />;
  }

  const step = searchParams.get('step');
  const date = searchParams.get('date');
  const hasBookingParams = step === 'stadium' || step === 'date' || step === 'payment' || step === 'zone' || date;

  if (hasBookingParams) {
    return <BookingPage stadiumIdFromPath={stadiumId} />;
  }

  return <StadiumUpcomingPage stadiumIdFromPath={stadiumId} />;
};

export default StadiumSlugHandler;
