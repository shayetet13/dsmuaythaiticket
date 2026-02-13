// Using Backend API (SQLite Database) instead of IndexedDB
import axios from 'axios';
import { API_URL } from '../config/api.js';

// Default data structure (fallback)
const defaultData = {
  hero: {
    image: '/images/hero/World class fighters.webp',
    fallback: '/images/hero/World class fighters.webp',
    alt: 'Muay Thai'
  },
  highlights: [],
  stadiums: [
    {
      id: 'rajadamnern',
      name: { th: 'สนามมวยราชดำเนิน', en: 'Rajadamnern Stadium' },
      location: { th: 'กรุงเทพ', en: 'Bangkok' },
      image: '/images/stadiums/rajadamnern.webp',
      schedule: { th: 'ทุกวัน / จันทร์ - อาทิตย์', en: 'EVERY DAY / MONDAY - SUNDAY' },
      scheduleDays: [1, 2, 3, 4, 5, 6, 0],
      logoBase64: null
    },
    {
      id: 'lumpinee',
      name: { th: 'สนามมวยลุมพินี', en: 'Lumpinee Stadium' },
      location: { th: 'กรุงเทพ', en: 'Bangkok' },
      image: '/images/stadiums/lumpinee.webp',
      schedule: { th: 'ทุกวันศุกร์ / เสาร์', en: 'EVERY FRIDAY / SATURDAY' },
      scheduleDays: [5, 6],
      logoBase64: null
    },
    {
      id: 'bangla',
      name: { th: 'สนามมวยบังลา', en: 'Bangla Stadium' },
      location: { th: 'ภูเก็ต', en: 'Phuket' },
      image: '/images/stadiums/bangla.webp',
      schedule: { th: 'ทุกวันพุธ / ศุกร์ / อาทิตย์', en: 'EVERY WEDNESDAY / FRIDAY / SUNDAY' },
      scheduleDays: [3, 5, 0],
      logoBase64: null
    },
    {
      id: 'patong',
      name: { th: 'สนามมวยป่าตอง', en: 'Patong Stadium' },
      location: { th: 'ภูเก็ต', en: 'Phuket' },
      image: '/images/stadiums/patong.webp',
      schedule: { th: 'ทุกวันจันทร์ / พฤหัสบดี / เสาร์', en: 'EVERY MONDAY / THURSDAY / SATURDAY' },
      scheduleDays: [1, 4, 6],
      logoBase64: null
    }
  ],
  stadiumImageSchedules: {
    rajadamnern: [],
    lumpinee: [],
    bangla: [],
    patong: []
  },
  specialMatches: [],
  upcomingFightsBackground: {
    image: '/images/upcoming-fights-bg.webp',
    fallback: '/images/hero/World class fighters.webp'
  },
  bookingBackground: {
    id: 1,
    image: '/images/hero/World class fighters.webp',
    fallback: '/images/hero/World class fighters.webp'
  }
};

// Initialize database (no-op, data is loaded from API)
export const initDb = async () => {
  // Database is initialized on backend
  return true;
};

// Get all data
export const getAllData = async () => {
  try {
    const response = await axios.get(`${API_URL}/images/all`);
    return response.data;
  } catch (error) {
    console.error('Error getting all data:', error);
    return defaultData;
  }
};

// Hero Image operations
export const getHeroImage = async () => {
  try {
    const response = await axios.get(`${API_URL}/images/hero`);
    return response.data;
  } catch (error) {
    console.error('Error getting hero image:', error);
    return defaultData.hero;
  }
};

export const updateHeroImage = async (image, alt = 'Muay Thai', fallback = null) => {
  try {
    const response = await axios.put(`${API_URL}/images/hero`, {
      image,
      alt,
      fallback: fallback || '/images/hero/World class fighters.webp'
    });
    return response.data;
  } catch (error) {
    console.error('Error updating hero image:', error);
    return null;
  }
};

// Highlights operations
export const getHighlights = async (language = 'en') => {
  try {
    const response = await axios.get(`${API_URL}/images/highlights`);
    const highlights = response.data;
    return highlights.map(h => {
      // Helper function to get the appropriate language value
      const getLanguageValue = (field) => {
        if (typeof field !== 'object') return field || '';
        
        const hasEn = field.en && field.en.trim() !== '';
        const hasTh = field.th && field.th.trim() !== '';
        
        // If only English exists, always return English
        if (hasEn && !hasTh) {
          return field.en;
        }
        // If only Thai exists, always return Thai
        if (hasTh && !hasEn) {
          return field.th;
        }
        // If both exist, return based on selected language
        if (hasEn && hasTh) {
          return field[language] || field.en || field.th || '';
        }
        // If neither exists, return empty string
        return '';
      };
      
      return {
        ...h,
        title: getLanguageValue(h.title),
        date: getLanguageValue(h.date),
        description: getLanguageValue(h.description)
      };
    });
  } catch (error) {
    console.error('Error getting highlights:', error);
    return [];
  }
};

export const updateHighlight = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/images/highlights/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating highlight:', error);
    return null;
  }
};

export const addHighlight = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/images/highlights`, data);
    return response.data;
  } catch (error) {
    console.error('Error adding highlight:', error);
    return null;
  }
};

export const deleteHighlight = async (id) => {
  try {
    await axios.delete(`${API_URL}/images/highlights/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting highlight:', error);
    return false;
  }
};

// Stadiums operations
export const getStadiums = async (language = 'en') => {
  try {
    const response = await axios.get(`${API_URL}/images/stadiums`);
    const stadiums = response.data;
    return stadiums.map(s => ({
      id: s.id,
      name: s.name[language] || s.name.en || s.name.th,
      location: s.location[language] || s.location.en || s.location.th,
      image: s.image,
      schedule: s.schedule ? s.schedule[language] : '',
      scheduleDays: s.scheduleDays || [],
      logoBase64: s.logoBase64 || null,
      paymentImage: s.paymentImage || null
    }));
  } catch (error) {
    console.error('Error getting stadiums:', error);
    return defaultData.stadiums.map(s => ({
      id: s.id,
      name: s.name[language],
      location: s.location[language],
      image: s.image,
      schedule: s.schedule[language],
      scheduleDays: s.scheduleDays,
      logoBase64: s.logoBase64,
      paymentImage: null
    }));
  }
};

export const addStadium = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/images/stadiums`, data);
    return response.data;
  } catch (error) {
    console.error('Error adding stadium:', error);
    return null;
  }
};

export const updateStadium = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/images/stadiums/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating stadium:', error);
    return null;
  }
};

export const deleteStadium = async (id) => {
  try {
    await axios.delete(`${API_URL}/images/stadiums/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting stadium:', error);
    return false;
  }
};

// Stadium Image Schedules operations
export const getStadiumImageSchedules = async () => {
  try {
    const response = await axios.get(`${API_URL}/images/stadium-schedules`);
    return response.data;
  } catch (error) {
    console.error('Error getting stadium image schedules:', error);
    return defaultData.stadiumImageSchedules;
  }
};

export const updateStadiumImageSchedules = async (stadiumId, schedules) => {
  try {
    const response = await axios.put(`${API_URL}/images/stadium-schedules/${stadiumId}`, schedules);
    return response.data;
  } catch (error) {
    console.error('Error updating stadium image schedules:', error);
    return null;
  }
};

// Special Matches operations
export const getSpecialMatches = async () => {
  try {
    const response = await axios.get(`${API_URL}/images/special-matches`);
    return response.data;
  } catch (error) {
    console.error('Error getting special matches:', error);
    return [];
  }
};

export const addSpecialMatch = async (matchData) => {
  try {
    const response = await axios.post(`${API_URL}/images/special-matches`, matchData);
    return response.data;
  } catch (error) {
    console.error('Error adding special match:', error);
    return null;
  }
};

export const updateSpecialMatch = async (id, matchData) => {
  try {
    const response = await axios.put(`${API_URL}/images/special-matches/${id}`, matchData);
    return response.data;
  } catch (error) {
    console.error('Error updating special match:', error);
    return null;
  }
};

export const deleteSpecialMatch = async (id) => {
  try {
    await axios.delete(`${API_URL}/images/special-matches/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting special match:', error);
    return false;
  }
};

// Daily Images operations
export const getDailyImages = async () => {
  try {
    const response = await axios.get(`${API_URL}/images/daily-images`);
    return response.data;
  } catch (error) {
    console.error('Error getting daily images:', error);
    return [];
  }
};

export const addDailyImage = async (imageData) => {
  try {
    const response = await axios.post(`${API_URL}/images/daily-images`, imageData);
    return response.data;
  } catch (error) {
    console.error('Error adding daily image:', error);
    return null;
  }
};

export const updateDailyImage = async (id, imageData) => {
  try {
    const response = await axios.put(`${API_URL}/images/daily-images/${id}`, imageData);
    return response.data;
  } catch (error) {
    console.error('Error updating daily image:', error);
    return null;
  }
};

export const deleteDailyImage = async (id) => {
  try {
    await axios.delete(`${API_URL}/images/daily-images/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting daily image:', error);
    return false;
  }
};

// Upcoming Fights Background operations
export const getUpcomingFightsBackground = async () => {
  try {
    const response = await axios.get(`${API_URL}/images/upcoming-fights-background`);
    return response.data;
  } catch (error) {
    console.error('Error getting upcoming fights background:', error);
    return defaultData.upcomingFightsBackground;
  }
};

export const updateUpcomingFightsBackground = async (image, fallback = null) => {
  try {
    const response = await axios.put(`${API_URL}/images/upcoming-fights-background`, {
      image,
      fallback: fallback || defaultData.upcomingFightsBackground.fallback
    });
    return response.data;
  } catch (error) {
    console.error('Error updating upcoming fights background:', error);
    return null;
  }
};

// Booking Background operations
export const getBookingBackground = async () => {
  try {
    const response = await axios.get(`${API_URL}/images/booking-background`);
    return response.data;
  } catch (error) {
    console.error('Error getting booking background:', error);
    return {
      id: 1,
      image: '/images/hero/World class fighters.webp',
      fallback: '/images/hero/World class fighters.webp'
    };
  }
};

export const updateBookingBackground = async (image, fallback = null) => {
  try {
    const response = await axios.put(`${API_URL}/images/booking-background`, {
      image,
      fallback: fallback || '/images/hero/World class fighters.webp'
    });
    return response.data;
  } catch (error) {
    console.error('Error updating booking background:', error);
    return null;
  }
};

// Weekly Fights operations (deprecated - kept for compatibility)
export const getWeeklyFights = async () => {
  return {
    monday: { image: '', logos: [] },
    tuesday: { image: '', logos: [] },
    wednesday: { image: '', logos: [] },
    thursday: { image: '', logos: [] },
    friday: { image: '', logos: [] },
    saturday: { image: '', logos: [] },
    sunday: { image: '', logos: [] }
  };
};

export const updateWeeklyFight = async (day, data) => {
  // Deprecated - no longer used
  return null;
};

// Weekly Match Names operations (deprecated - kept for compatibility)
export const getWeeklyMatchNames = async () => {
  return {
    monday: { name: '' },
    tuesday: { name: '' },
    wednesday: { name: '' },
    thursday: { name: '' },
    friday: { name: '' },
    saturday: { name: '' },
    sunday: { name: '' }
  };
};

export const updateWeeklyMatchName = async (day, name) => {
  // Deprecated - no longer used
  return null;
};

export const updateWeeklyFightWithName = async (day, data) => {
  // Deprecated - no longer used
  return null;
};

// PromptPay QR operations
export const getPromptPayQr = async () => {
  try {
    const response = await axios.get(`${API_URL}/images/promptpay-qr`);
    return response.data.promptPayQr;
  } catch (error) {
    console.error('Error getting PromptPay QR:', error);
    return null;
  }
};

export const updatePromptPayQr = async (qrCode) => {
  try {
    const response = await axios.put(`${API_URL}/images/promptpay-qr`, { qrCode });
    return response.data.promptPayQr;
  } catch (error) {
    console.error('Error updating PromptPay QR:', error);
    return null;
  }
};

// News Popup Images operations
export const getNewsPopupImages = async () => {
  try {
    const response = await axios.get(`${API_URL}/images/news-popup`);
    return response.data;
  } catch (error) {
    console.error('Error getting news popup images:', error);
    return [];
  }
};

export const addNewsPopupImage = async (image, displayOrder = 0) => {
  try {
    const response = await axios.post(`${API_URL}/images/news-popup`, {
      image,
      displayOrder
    });
    return response.data;
  } catch (error) {
    console.error('Error adding news popup image:', error);
    return null;
  }
};

export const updateNewsPopupImage = async (id, image, displayOrder) => {
  try {
    const response = await axios.put(`${API_URL}/images/news-popup/${id}`, {
      image,
      displayOrder
    });
    return response.data;
  } catch (error) {
    console.error('Error updating news popup image:', error);
    return null;
  }
};

export const deleteNewsPopupImage = async (id) => {
  try {
    await axios.delete(`${API_URL}/images/news-popup/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting news popup image:', error);
    return false;
  }
};
