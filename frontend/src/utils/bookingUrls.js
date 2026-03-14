/**
 * URL helpers for stadium and booking pages
 * Uses /{stadiumId}-stadium-ticket format (e.g. /rajadamnern-stadium-ticket)
 */

const STADIUM_SUFFIX = '-stadium-ticket';

export const getStadiumPageUrl = (stadiumId) => {
  if (!stadiumId) return '/';
  return `/${stadiumId}${STADIUM_SUFFIX}`;
};

export const getBookingPageUrl = (stadiumId, params = {}) => {
  if (!stadiumId) return '/';
  const searchParams = new URLSearchParams();
  if (params.date) searchParams.set('date', params.date);
  if (params.step) searchParams.set('step', params.step);
  if (params.ticket) searchParams.set('ticket', params.ticket);
  if (params.zone) searchParams.set('zone', params.zone);
  const query = searchParams.toString();
  return `/${stadiumId}${STADIUM_SUFFIX}${query ? `?${query}` : ''}`;
};

export const parseStadiumIdFromPath = (pathname) => {
  const segment = pathname.split('/')[1]?.split('?')[0]?.split('#')[0];
  if (segment && segment.endsWith(STADIUM_SUFFIX)) {
    return segment.slice(0, -STADIUM_SUFFIX.length);
  }
  return null;
};

export const isStadiumSlug = (slug) => slug && typeof slug === 'string' && slug.endsWith(STADIUM_SUFFIX);

/** Province ticket page URL: /muaythai-ticket-bangkok, /muaythai-ticket-phuket */
export const getProvinceTicketPageUrl = (provinceId) => {
  if (!provinceId) return '/';
  return `/muaythai-ticket-${provinceId}`;
};
