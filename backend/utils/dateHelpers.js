/**
 * Date Helper Functions
 * Centralized date parsing and manipulation
 */

/**
 * Parse date string (YYYY-MM-DD) to Date object
 * Uses noon time to avoid timezone issues
 */
export const parseDateString = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

/**
 * Get day of week from date string
 * @returns {number} 0-6 (Sunday-Saturday)
 */
export const getDayOfWeek = (dateString) => {
  return parseDateString(dateString).getDay();
};

/**
 * Format date for display
 */
export const formatDateForDisplay = (dateString, language = 'en') => {
  const date = parseDateString(dateString);
  
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  const locale = language === 'th' ? 'th-TH' : 'en-US';
  return date.toLocaleDateString(locale, options);
};

/**
 * Check if date is in the past
 */
export const isDateInPast = (dateString) => {
  const date = parseDateString(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date < today;
};

/**
 * Check if date is within range
 */
export const isDateInRange = (dateString, startDate, endDate) => {
  const date = parseDateString(dateString);
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);
  
  return date >= start && date <= end;
};

/**
 * Get dates for next N days
 */
export const getUpcomingDates = (count = 7) => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    dates.push(`${year}-${month}-${day}`);
  }
  
  return dates;
};

/**
 * Compare two date strings
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export const compareDates = (dateString1, dateString2) => {
  const date1 = parseDateString(dateString1);
  const date2 = parseDateString(dateString2);
  
  if (date1 < date2) return -1;
  if (date1 > date2) return 1;
  return 0;
};

/**
 * Get current time in Thailand timezone (UTC+7)
 * @returns {Date} Current date/time in Thailand timezone
 */
export const getCurrentThailandTime = () => {
  const now = new Date();
  // Get Thailand time components using Intl API
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year').value);
  const month = parseInt(parts.find(p => p.type === 'month').value) - 1; // Month is 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day').value);
  const hour = parseInt(parts.find(p => p.type === 'hour').value);
  const minute = parseInt(parts.find(p => p.type === 'minute').value);
  const second = parseInt(parts.find(p => p.type === 'second').value);
  
  return new Date(year, month, day, hour, minute, second);
};

/**
 * Check if the given date is today in Thailand timezone
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean} - True if the date is today
 */
export const isTodayInThailand = (dateString) => {
  const currentThailandTime = getCurrentThailandTime();
  const [year, month, day] = dateString.split('-').map(Number);
  
  return (
    currentThailandTime.getFullYear() === year &&
    currentThailandTime.getMonth() + 1 === month &&
    currentThailandTime.getDate() === day
  );
};

/**
 * Check if current time in Thailand has passed 20:30 (8:30 PM)
 * @returns {boolean} - True if current time is after 20:30 Thailand time
 */
export const isAfter5PMThailand = () => {
  const currentThailandTime = getCurrentThailandTime();
  const hours = currentThailandTime.getHours();
  const minutes = currentThailandTime.getMinutes();
  
  // Check if time is 20:30 or later (8:30 PM or later)
  return hours > 20 || (hours === 20 && minutes >= 30);
};

/**
 * Check if tickets can be purchased for a specific date
 * Tickets cannot be purchased for today's date after 20:30 Thailand time
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean} - True if tickets can be purchased (false if past 20:30 for today)
 */
export const canPurchaseTicketsForDate = (dateString) => {
  // If it's today, check if current time is before 20:30
  if (isTodayInThailand(dateString)) {
    return !isAfter5PMThailand();
  }
  
  // For future dates, always allow purchase
  return true;
};

