// Parse date strings to Date objects
export const parseDate = (dateString, lang) => {
  // Handle Thai and English date formats
  if (lang === 'th') {
    // Format: "28 พฤศจิกายน 2025"
    const months = {
      'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3,
      'พฤษภาคม': 4, 'มิถุนายน': 5, 'กรกฎาคม': 6, 'สิงหาคม': 7,
      'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11
    };
    const parts = dateString.split(' ');
    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  } else {
    // Format: "28 November 2025"
    return new Date(dateString);
  }
};

// Helper function to check if two dates are the same day
export const isSameDay = (date1, date2) => {
  return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
};

// Format date for display
export const formatDateDisplay = (date, language) => {
  const dayNames = language === 'th'
    ? ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = language === 'th'
    ? ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  if (language === 'th') {
    return `${dayName} ${day} ${month} ${year}`;
  } else {
    return `${dayName}, ${month} ${day}, ${year}`;
  }
};

// Get relative day label (Today, Yesterday, Tomorrow, or just date)
export const getRelativeDayLabel = (date, language) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round((checkDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return language === 'th' ? 'วันนี้' : 'Today';
  } else if (diffDays === -1) {
    return language === 'th' ? 'เมื่อวาน' : 'Yesterday';
  } else if (diffDays === 1) {
    return language === 'th' ? 'พรุ่งนี้' : 'Tomorrow';
  } else {
    return null; // No label, just show date
  }
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
 * Check if the given date string (YYYY-MM-DD) is today in Thailand timezone
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
 * @returns {boolean} - True if current time is 20:30 or later Thailand time
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

