/**
 * Event Service
 * Business logic for event generation and management
 */

import { getStadiumImageSchedules, getSpecialMatches, getDailyImages } from '../database.js';
import { hasAvailableTickets, getTicketConfig } from './ticketService.js';
import { convertPathToWebP } from './imageService.js';

/**
 * Default images for each stadium
 * Note: These paths will be converted to WebP format when used
 */
const defaultImages = {
  rajadamnern: [
    '/images/highlights/RWS (125 of 220).jpg',
    '/images/highlights/RWS (131 of 220).jpg',
    '/images/highlights/_DSC5122.jpg',
    '/images/hero/World class fighters.webp'
  ],
  lumpinee: [
    '/images/highlights/OTA_COVER.jpg',
    '/images/highlights/DSC_9319.jpg',
    '/images/highlights/MEMO0026.jpg',
    '/images/highlights/BOAT2132 3.jpg'
  ],
  bangla: [
    '/images/highlights/aow4.jpg',
    '/images/hero/World class fighters.webp',
    '/images/highlights/_NPX0152-2.jpg',
    '/images/highlights/20230930-NPX_3584.jpg'
  ],
  patong: [
    '/images/highlights/P7012865 (1).jpg',
    '/images/highlights/S__89981064.jpg',
    '/images/highlights/NPX_5549.JPG',
    '/images/hero/World class fighters.webp'
  ]
};

/**
 * Get event name based on stadium and day of week
 */
const getEventName = (stadiumId, dayOfWeek, dateStr, stadiumImageSchedules, specialMatches, dailyImages) => {
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
  if (stadiumId === 'rajadamnern') {
    const rajadamnernNames = {
      1: 'Rajadamnern Knockout',
      2: 'Rajadamnern Knockout',
      3: 'New Power Muay Thai',
      4: 'Petchyindee Muay Thai',
      5: 'Rajadamnern Knockout',
      6: 'RWS - Muay Thai',
      0: 'Kiatpetch Muay Thai'
    };
    return rajadamnernNames[dayOfWeek] || 'Rajadamnern Event';
  } else if (stadiumId === 'lumpinee') {
    return 'ONE LUMPINEE';
  } else if (stadiumId === 'bangla') {
    return 'MUAY THAI BANGLA PHUKET';
  } else if (stadiumId === 'patong') {
    return 'MUAY THAI PATONG PHUKET';
  }
  return `${stadiumId.charAt(0).toUpperCase() + stadiumId.slice(1)} Event`;
};

/**
 * Get image for an event based on date, stadium, and day of week
 */
const getEventImage = (stadiumId, dateStr, dayOfWeek, index, stadiumImageSchedules, specialMatches, dailyImages) => {
  // First, check for special matches (exact date match)
  if (specialMatches && specialMatches.length > 0 && dateStr) {
    const specialMatch = specialMatches.find(match => 
      match.stadiumId === stadiumId && match.date === dateStr
    );
    if (specialMatch && specialMatch.image) {
      // Convert to WebP if it's a file path (not base64)
      if (!specialMatch.image.startsWith('data:')) {
        return convertPathToWebP(specialMatch.image);
      }
      return specialMatch.image;
    }
  }

  // Second, check for daily images (exact date match, links to regular tickets)
  if (dailyImages && dailyImages.length > 0 && dateStr) {
    const dailyImage = dailyImages.find(img => 
      img.stadiumId === stadiumId && img.date === dateStr
    );
    if (dailyImage && dailyImage.image) {
      // Convert to WebP if it's a file path (not base64)
      if (!dailyImage.image.startsWith('data:')) {
        return convertPathToWebP(dailyImage.image);
      }
      return dailyImage.image;
    }
  }

  // Third, check for scheduled images (day of week match)
  const schedules = stadiumImageSchedules[stadiumId] || [];
  if (schedules.length > 0) {
    const matchingSchedules = schedules.filter(schedule => 
      schedule.days && schedule.days.includes(dayOfWeek)
    );
    if (matchingSchedules.length > 0) {
      const scheduleIndex = index % matchingSchedules.length;
      const imagePath = matchingSchedules[scheduleIndex].image;
      
      // Convert to WebP if it's a file path (not base64)
      if (imagePath && !imagePath.startsWith('data:')) {
        return convertPathToWebP(imagePath);
      }
      
      return imagePath;
    }
  }

  // Fallback to default images (convert to WebP if not already)
  const defaultStadiumImages = defaultImages[stadiumId] || [`/images/stadiums/${stadiumId}.jpg`];
  const imagePath = defaultStadiumImages[index % defaultStadiumImages.length];
  
  // Convert path to WebP format (if it's a file path, not base64)
  if (imagePath && !imagePath.startsWith('data:')) {
    return convertPathToWebP(imagePath);
  }
  
  return imagePath;
};

/**
 * Get upcoming events for a stadium
 * @param {string} stadiumId - Stadium ID
 * @param {Array} scheduleDays - Days when events are scheduled [0-6]
 * @param {number} limit - Maximum number of events to return
 * @returns {Array} - Upcoming events
 */
export const getStadiumEvents = (stadiumId, scheduleDays = [0, 1, 2, 3, 4, 5, 6], limit = 4) => {
  const events = [];
  
  // Get current date in Thailand timezone (UTC+7)
  const now = new Date();
  const thailandOffset = 7 * 60; // UTC+7 in minutes
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const today = new Date(utc + (thailandOffset * 60000));
  
  // Get ticket config
  const ticketConfig = getTicketConfig(stadiumId);
  
  // Get stadium image schedules and special matches
  const allSchedules = getStadiumImageSchedules();
  const stadiumImageSchedules = {};
  allSchedules.forEach(schedule => {
    if (!stadiumImageSchedules[schedule.stadium_id]) {
      stadiumImageSchedules[schedule.stadium_id] = [];
    }
    stadiumImageSchedules[schedule.stadium_id].push({
      image: schedule.image,
      days: typeof schedule.days === 'string' ? JSON.parse(schedule.days) : schedule.days,
      name: schedule.name
    });
  });
  
  const allSpecialMatches = getSpecialMatches();
  const specialMatches = allSpecialMatches.filter(m => m.stadiumId === stadiumId);
  const allDailyImages = getDailyImages();
  const dailyImages = allDailyImages.filter(img => img.stadiumId === stadiumId);
  
  // Get next events starting from today
  const upcomingDates = [];
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  
  for (let i = 0; i <= 28 && upcomingDates.length < limit; i++) {
    const checkDate = new Date(todayYear, todayMonth, todayDay + i, 12, 0, 0);
    const dayOfWeek = checkDate.getDay();
    
    if (scheduleDays.includes(dayOfWeek)) {
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const eventName = getEventName(stadiumId, dayOfWeek, dateStr, stadiumImageSchedules, specialMatches, dailyImages);
      const isSoldOut = !hasAvailableTickets(dateStr, stadiumId, ticketConfig);
      
      events.push({
        id: `${stadiumId}-${dateStr}`,
        name: eventName,
        date: dateStr,
        image: getEventImage(stadiumId, dateStr, dayOfWeek, upcomingDates.length, stadiumImageSchedules, specialMatches, dailyImages),
        price: null,
        priceRange: null,
        stadiumId: stadiumId,
        isSoldOut: isSoldOut
      });
      
      upcomingDates.push({ date: checkDate, dayOfWeek: dayOfWeek });
    }
  }
  
  // Sort by date
  return events.sort((a, b) => {
    try {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    } catch (e) {
      return 0;
    }
  }).slice(0, limit);
};

/**
 * Get upcoming events for all stadiums
 * @param {Array} stadiums - Array of stadium objects with id and scheduleDays
 * @returns {Object} - Events grouped by stadium ID
 */
export const getAllUpcomingEvents = (stadiums) => {
  const events = {};
  
  stadiums.forEach(stadium => {
    const scheduleDays = stadium.scheduleDays || [0, 1, 2, 3, 4, 5, 6];
    events[stadium.id] = getStadiumEvents(stadium.id, scheduleDays, 4);
  });
  
  return events;
};

