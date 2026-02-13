/**
 * Format helpers - Shared utility functions for formatting data
 * Prevents code duplication across components
 */

/**
 * Format date string to localized date display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} language - 'th' or 'en'
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, language = 'en') => {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

/**
 * Format date and time string
 * @param {string} dateString - Date in ISO format
 * @param {string} language - 'th' or 'en'
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateString, language = 'en') => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleString(language === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} language - 'th' or 'en'
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, language = 'en') => {
  return new Intl.NumberFormat(language === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: 'THB'
  }).format(amount);
};

/**
 * Get match name based on stadium and day of week
 * @param {string} stadiumId - Stadium ID
 * @param {number} dayOfWeek - Day of week (0 = Sunday, 6 = Saturday)
 * @param {string|null} dateStr - Optional date string for special matches
 * @param {Object} stadiumImageSchedules - Stadium image schedules
 * @param {Array} specialMatches - Array of special matches
 * @param {Array} dailyImages - Array of daily images
 * @returns {string} Match name
 */
export const getMatchName = (
  stadiumId, 
  dayOfWeek, 
  dateStr = null, 
  stadiumImageSchedules = {}, 
  specialMatches = [],
  dailyImages = []
) => {
  // First, check for special matches (exact date match)
  if (specialMatches && specialMatches.length > 0 && dateStr) {
    const specialMatch = specialMatches.find(match => 
      match.stadiumId === stadiumId && match.date === dateStr
    );
    if (specialMatch && specialMatch.name) {
      return specialMatch.name;
    }
  }

  // Second, check for daily images (exact date match, links to regular tickets)
  if (dailyImages && dailyImages.length > 0 && dateStr) {
    const dailyImage = dailyImages.find(img => 
      img.stadiumId === stadiumId && img.date === dateStr
    );
    if (dailyImage && dailyImage.name) {
      return dailyImage.name;
    }
  }

  // Third, check for scheduled images with names (day of week match)
  const schedules = stadiumImageSchedules[stadiumId] || [];
  if (schedules.length > 0) {
    const matchingSchedules = schedules.filter(schedule => 
      schedule.days && schedule.days.includes(dayOfWeek) && schedule.name
    );
    if (matchingSchedules.length > 0) {
      return matchingSchedules[0].name;
    }
  }

  // Fallback to default names
  const matchSchedule = {
    rajadamnern: {
      0: 'KIATPETCH MUAY THAI',  // Sunday
      1: 'RAJADAMNERN KNOCKOUT', // Monday
      2: 'RAJADAMNERN KNOCKOUT', // Tuesday
      3: 'NEW POWER MUAY THAI',  // Wednesday
      4: 'PETHYINDEE MUAY THAI', // Thursday
      5: 'RAJADAMNERN KNOCKOUT', // Friday
      6: 'RWS – MUAY THAI'       // Saturday
    },
    lumpinee: {
      5: 'ONE LUMPINEE',         // Friday
      6: 'ONE FIGHT NIGHT'       // Saturday
    },
    bangla: {
      0: 'MUAY THAI BANGLA PHUKET', // Sunday
      3: 'MUAY THAI BANGLA PHUKET', // Wednesday
      5: 'MUAY THAI BANGLA PHUKET'  // Friday
    },
    patong: {
      1: 'MUAY THAI PATONG PHUKET', // Monday
      4: 'MUAY THAI PATONG PHUKET', // Thursday
      6: 'MUAY THAI PATONG PHUKET'  // Saturday
    }
  };

  return matchSchedule[stadiumId]?.[dayOfWeek] || '';
};

/**
 * Get day name in Thai
 * @param {number} dayOfWeek - Day of week (0 = Sunday, 6 = Saturday)
 * @returns {string} Day name in Thai
 */
export const getDayName = (dayOfWeek) => {
  const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  return dayNames[dayOfWeek] || '';
};

/**
 * Get stadium name from stadiums array
 * @param {string} stadiumId - Stadium ID
 * @param {Array} stadiums - Array of stadium objects
 * @returns {string} Stadium name or ID if not found
 */
export const getStadiumName = (stadiumId, stadiums = []) => {
  if (!stadiums || !Array.isArray(stadiums)) return stadiumId;
  const stadium = stadiums.find(s => s && s.id === stadiumId);
  if (!stadium) return stadiumId;
  
  // Handle both string and object name formats
  if (typeof stadium.name === 'string') {
    return stadium.name;
  }
  if (typeof stadium.name === 'object') {
    return stadium.name.en || stadium.name.th || stadiumId;
  }
  return stadiumId;
};
