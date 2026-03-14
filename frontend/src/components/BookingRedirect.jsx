import { Navigate, useSearchParams } from 'react-router-dom';
import { getBookingPageUrl } from '../utils/bookingUrls';

/**
 * Redirects /booking to new URL format for backward compatibility
 * /booking?stadium=rajadamnern&date=xxx&step=payment -> /rajadamnern-stadium-ticket?date=xxx&step=payment
 * /booking (no params) -> /
 */
const BookingRedirect = () => {
  const [searchParams] = useSearchParams();
  const stadium = searchParams.get('stadium');
  const date = searchParams.get('date');
  const step = searchParams.get('step');
  const ticket = searchParams.get('ticket');
  const zone = searchParams.get('zone');

  if (stadium) {
    const url = getBookingPageUrl(stadium, { date, step, ticket, zone });
    return <Navigate to={url} replace />;
  }

  return <Navigate to="/" replace />;
};

export default BookingRedirect;
