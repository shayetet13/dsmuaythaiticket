// Using IndexedDB for large data storage (can store much more than localStorage)
// IndexedDB can store several GB of data, perfect for high-quality images

// Default data structure
const defaultData = {
  hero: {
    image: '/images/hero/_RMS0100.jpg',
    fallback: '/images/highlights/World class fighters.jpg',
    alt: 'Muay Thai'
  },
  highlights: [
    {
      id: 1,
      title: { th: 'การต่อสู้แห่งปี 2025', en: 'Fight of the Year 2025' },
      date: { th: '15 มกราคม 2025', en: 'January 15, 2025' },
      image: '/images/highlights/World class fighters.jpg'
    },
    {
      id: 2,
      title: { th: 'ชัยชนะอันน่าทึ่ง', en: 'Amazing Victory' },
      date: { th: '22 มกราคม 2025', en: 'January 22, 2025' },
      image: '/images/highlights/_DSC5122.jpg'
    },
    {
      id: 3,
      title: { th: 'การชกที่ยอดเยี่ยม', en: 'Excellent Fight' },
      date: { th: '29 มกราคม 2025', en: 'January 29, 2025' },
      image: '/images/highlights/_NPX0152-2.jpg'
    },
    {
      id: 4,
      title: { th: 'การชกที่ดุเดือด', en: 'Intense Battle' },
      date: { th: '5 กุมภาพันธ์ 2025', en: 'February 5, 2025' },
      image: '/images/highlights/_RMS0100.jpg'
    },
    {
      id: 5,
      title: { th: 'ชัยชนะแบบ KO', en: 'Knockout Victory' },
      date: { th: '12 กุมภาพันธ์ 2025', en: 'February 12, 2025' },
      image: '/images/highlights/DSC_9319.jpg'
    },
    {
      id: 6,
      title: { th: 'การชกที่สมบูรณ์แบบ', en: 'Perfect Fight' },
      date: { th: '19 กุมภาพันธ์ 2025', en: 'February 19, 2025' },
      image: '/images/highlights/NPX_5549.JPG'
    },
    {
      id: 7,
      title: { th: 'การแข่งขันระดับโลก', en: 'World Class Championship' },
      date: { th: '26 กุมภาพันธ์ 2025', en: 'February 26, 2025' },
      image: '/images/highlights/OTA_COVER.jpg'
    },
    {
      id: 8,
      title: { th: 'การชกที่ตื่นเต้น', en: 'Thrilling Match' },
      date: { th: '5 มีนาคม 2025', en: 'March 5, 2025' },
      image: '/images/highlights/BOAT2132 3.jpg'
    },
    {
      id: 9,
      title: { th: 'การแข่งขันพิเศษ', en: 'Special Event' },
      date: { th: '12 มีนาคม 2025', en: 'March 12, 2025' },
      image: '/images/highlights/20230930-NPX_3584.jpg'
    },
    {
      id: 10,
      title: { th: 'การชกที่ยิ่งใหญ่', en: 'Grand Fight' },
      date: { th: '19 มีนาคม 2025', en: 'March 19, 2025' },
      image: '/images/highlights/aow4.jpg'
    },
    {
      id: 11,
      title: { th: 'การแข่งขันสำคัญ', en: 'Major Championship' },
      date: { th: '26 มีนาคม 2025', en: 'March 26, 2025' },
      image: '/images/highlights/MEMO0026.jpg'
    },
    {
      id: 12,
      title: { th: 'การชกที่โดดเด่น', en: 'Outstanding Fight' },
      date: { th: '2 เมษายน 2025', en: 'April 2, 2025' },
      image: '/images/highlights/P7012865 (1).jpg'
    },
    {
      id: 13,
      title: { th: 'การแข่งขันระดับสูง', en: 'Elite Competition' },
      date: { th: '9 เมษายน 2025', en: 'April 9, 2025' },
      image: '/images/highlights/RWS (125 of 220).jpg'
    },
    {
      id: 14,
      title: { th: 'การชกที่เข้มข้น', en: 'Intense Match' },
      date: { th: '16 เมษายน 2025', en: 'April 16, 2025' },
      image: '/images/highlights/RWS (131 of 220).jpg'
    },
    {
      id: 15,
      title: { th: 'การแข่งขันสุดพิเศษ', en: 'Ultimate Championship' },
      date: { th: '23 เมษายน 2025', en: 'April 23, 2025' },
      image: '/images/highlights/S__89981064.jpg'
    }
  ],
  stadiums: [
    {
      id: 'rajadamnern',
      name: { th: 'สนามมวยราชดำเนิน', en: 'Rajadamnern Stadium' },
      location: { th: 'กรุงเทพ', en: 'Bangkok' },
      image: '/images/stadiums/rajadamnern.jpg',
      schedule: { th: 'ทุกวัน / จันทร์ - อาทิตย์', en: 'EVERY DAY / MONDAY - SUNDAY' },
      scheduleDays: [1, 2, 3, 4, 5, 6, 0], // Monday to Sunday
      logoBase64: null
    },
    {
      id: 'lumpinee',
      name: { th: 'สนามมวยลุมพินี', en: 'Lumpinee Stadium' },
      location: { th: 'กรุงเทพ', en: 'Bangkok' },
      image: '/images/stadiums/lumpinee.jpg',
      schedule: { th: 'ทุกวันศุกร์ / เสาร์', en: 'EVERY FRIDAY / SATURDAY' },
      scheduleDays: [5, 6], // Friday, Saturday
      logoBase64: null
    },
    {
      id: 'bangla',
      name: { th: 'สนามมวยบังลา', en: 'Bangla Stadium' },
      location: { th: 'ภูเก็ต', en: 'Phuket' },
      image: '/images/stadiums/bangla.jpg',
      schedule: { th: 'ทุกวันพุธ / ศุกร์ / อาทิตย์', en: 'EVERY WEDNESDAY / FRIDAY / SUNDAY' },
      scheduleDays: [3, 5, 0], // Wednesday, Friday, Sunday
      logoBase64: null
    },
    {
      id: 'patong',
      name: { th: 'สนามมวยป่าตอง', en: 'Patong Stadium' },
      location: { th: 'ภูเก็ต', en: 'Phuket' },
      image: '/images/stadiums/patong.jpg',
      schedule: { th: 'ทุกวันจันทร์ / พฤหัสบดี / เสาร์', en: 'EVERY MONDAY / THURSDAY / SATURDAY' },
      scheduleDays: [1, 4, 6], // Monday, Thursday, Saturday
      logoBase64: null
    }
  ],
  weeklyFights: {
    monday: { image: '', logos: [] },
    tuesday: { image: '', logos: [] },
    wednesday: { image: '', logos: [] },
    thursday: { image: '', logos: [] },
    friday: { image: '', logos: [] },
    saturday: { image: '', logos: [] },
    sunday: { image: '', logos: [] }
  },
  stadiumImageSchedules: {
    rajadamnern: [],
    lumpinee: [],
    bangla: [],
    patong: []
  },
  specialMatches: [],
  promptPayQr: null
};

const DB_NAME = 'mticket-images-db';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const STORAGE_KEY = 'mticket-images-db'; // For localStorage migration

let dbInstance = null;

// Initialize IndexedDB
const initIndexedDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
};

// Get database instance (async)
const getDb = async () => {
  if (!dbInstance) {
    await initIndexedDB();
  }
  return dbInstance;
};

// Save data to IndexedDB
const saveData = async (data) => {
  try {
    const db = await getDb();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise((resolve, reject) => {
      const request = store.put({ key: 'data', value: data, updatedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    return true;
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
    throw error;
  }
};

// Get data from IndexedDB
const getData = async () => {
  try {
    const db = await getDb();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get('data');
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting from IndexedDB:', error);
    return null;
  }
};

// Migrate data from localStorage to IndexedDB
const migrateFromLocalStorage = async () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      await saveData(data);
      console.log('Migrated data from localStorage to IndexedDB');
      // Optionally clear localStorage after migration (commented out for safety)
      // localStorage.removeItem(STORAGE_KEY);
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error migrating from localStorage:', error);
    return null;
  }
};

// Initialize database with default data if needed
export const initDb = async () => {
  try {
    await getDb();
    const existingData = await getData();
    
    if (!existingData) {
      // Try to migrate from localStorage first
      const migratedData = await migrateFromLocalStorage();
      if (migratedData) {
        return; // Migration successful
      }
      
      // No existing data, use defaults
      await saveData(defaultData);
      console.log('IndexedDB initialized with default data');
    }
  } catch (error) {
    console.error('Error initializing IndexedDB:', error);
  }
};

// Get all data (for admin - raw data with both languages)
export const getAllData = async () => {
  try {
    const data = await getData();
    return data || defaultData;
  } catch (error) {
    console.error('Error getting all data:', error);
    return defaultData;
  }
};

// Get hero image
export const getHeroImage = async () => {
  try {
    const data = await getAllData();
    const hero = data.hero || defaultData.hero;
    return {
      image: hero.image,
      fallback: hero.fallback || '/images/highlights/World class fighters.jpg',
      alt: hero.alt || 'Muay Thai'
    };
  } catch (error) {
    console.error('Error getting hero image:', error);
    return defaultData.hero;
  }
};

// Update hero image
export const updateHeroImage = async (image, alt = 'Muay Thai') => {
  try {
    const data = await getAllData();
    data.hero = { ...data.hero, image, alt };
    await saveData(data);
    return data.hero;
  } catch (error) {
    console.error('Error updating hero image:', error);
    return null;
  }
};

// Get highlights
export const getHighlights = async (language = 'en') => {
  try {
    const data = await getAllData();
    return (data.highlights || []).map(highlight => ({
      id: highlight.id,
      title: highlight.title[language],
      date: highlight.date[language],
      image: highlight.image
    }));
  } catch (error) {
    console.error('Error getting highlights:', error);
    return [];
  }
};

// Update highlight
export const updateHighlight = async (id, data) => {
  try {
    const dbData = await getAllData();
    const index = dbData.highlights.findIndex(h => h.id === id);
    if (index !== -1) {
      dbData.highlights[index] = { ...dbData.highlights[index], ...data };
      await saveData(dbData);
      return dbData.highlights[index];
    }
    return null;
  } catch (error) {
    console.error('Error updating highlight:', error);
    return null;
  }
};

// Add highlight
export const addHighlight = async (data) => {
  try {
    const dbData = await getAllData();
    const newId = Math.max(...dbData.highlights.map(h => h.id), 0) + 1;
    const newHighlight = { id: newId, ...data };
    dbData.highlights.push(newHighlight);
    await saveData(dbData);
    return newHighlight;
  } catch (error) {
    console.error('Error adding highlight:', error);
    return null;
  }
};

// Delete highlight
export const deleteHighlight = async (id) => {
  try {
    const dbData = await getAllData();
    dbData.highlights = dbData.highlights.filter(h => h.id !== id);
    await saveData(dbData);
    return true;
  } catch (error) {
    console.error('Error deleting highlight:', error);
    return false;
  }
};

// Get stadiums
export const getStadiums = async (language = 'en') => {
  try {
    const data = await getAllData();
    return (data.stadiums || []).map(stadium => ({
      id: stadium.id,
      name: stadium.name[language],
      location: stadium.location[language],
      image: stadium.image,
      schedule: stadium.schedule ? stadium.schedule[language] : '',
      scheduleDays: stadium.scheduleDays || [],
      logoBase64: stadium.logoBase64 || null
    }));
  } catch (error) {
    console.error('Error getting stadiums:', error);
    return [];
  }
};

// Update stadium
export const updateStadium = async (id, data) => {
  try {
    const dbData = await getAllData();
    const index = dbData.stadiums.findIndex(s => s.id === id);
    if (index !== -1) {
      dbData.stadiums[index] = { ...dbData.stadiums[index], ...data };
      await saveData(dbData);
      return dbData.stadiums[index];
    }
    return null;
  } catch (error) {
    console.error('Error updating stadium:', error);
    return null;
  }
};

// Get weekly fights
export const getWeeklyFights = async () => {
  try {
    const data = await getAllData();
    return data.weeklyFights || defaultData.weeklyFights;
  } catch (error) {
    console.error('Error getting weekly fights:', error);
    return defaultData.weeklyFights;
  }
};

// Update weekly fight by day
export const updateWeeklyFight = async (day, data) => {
  try {
    const dbData = await getAllData();
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!validDays.includes(day)) {
      console.error('Invalid day:', day);
      return null;
    }
    
    if (!dbData.weeklyFights) {
      dbData.weeklyFights = defaultData.weeklyFights;
    }
    
    dbData.weeklyFights[day] = { ...dbData.weeklyFights[day], ...data };
    await saveData(dbData);
    return dbData.weeklyFights[day];
  } catch (error) {
    console.error('Error updating weekly fight:', error);
    return null;
  }
};

// Get fights (deprecated - ใช้ getWeeklyFights แทน)
export const getFights = async (language = 'en') => {
  // For backward compatibility, return empty array
  return [];
};

// Update fight (deprecated - ใช้ updateWeeklyFight แทน)
export const updateFight = async (id, data) => {
  return null;
};

// Add fight (deprecated - ใช้ updateWeeklyFight แทน)
export const addFight = async (data) => {
  return null;
};

// Delete fight (deprecated - ใช้ updateWeeklyFight แทน)
export const deleteFight = async (id) => {
  return false;
};

// Get PromptPay QR Code
export const getPromptPayQr = async () => {
  try {
    const data = await getAllData();
    return data.promptPayQr || null;
  } catch (error) {
    console.error('Error getting PromptPay QR:', error);
    return null;
  }
};

// Update PromptPay QR Code
export const updatePromptPayQr = async (qrImageBase64) => {
  try {
    const data = await getAllData();
    data.promptPayQr = qrImageBase64;
    await saveData(data);
    return data.promptPayQr;
  } catch (error) {
    console.error('Error updating PromptPay QR:', error);
    return null;
  }
};

// Get stadium image schedules
export const getStadiumImageSchedules = async () => {
  try {
    const data = await getAllData();
    return data.stadiumImageSchedules || defaultData.stadiumImageSchedules;
  } catch (error) {
    console.error('Error getting stadium image schedules:', error);
    return defaultData.stadiumImageSchedules;
  }
};

// Update stadium image schedules
export const updateStadiumImageSchedules = async (stadiumId, schedules) => {
  try {
    const data = await getAllData();
    if (!data.stadiumImageSchedules) {
      data.stadiumImageSchedules = { ...defaultData.stadiumImageSchedules };
    }
    data.stadiumImageSchedules[stadiumId] = schedules;
    await saveData(data);
    return data.stadiumImageSchedules[stadiumId];
  } catch (error) {
    console.error('Error updating stadium image schedules:', error);
    return null;
  }
};

// Get special matches
export const getSpecialMatches = async () => {
  try {
    const data = await getAllData();
    return data.specialMatches || [];
  } catch (error) {
    console.error('Error getting special matches:', error);
    return [];
  }
};

// Add special match
export const addSpecialMatch = async (matchData) => {
  try {
    const data = await getAllData();
    if (!data.specialMatches) {
      data.specialMatches = [];
    }
    const newId = Math.max(...data.specialMatches.map(m => m.id || 0), 0) + 1;
    const newMatch = { id: newId, ...matchData };
    data.specialMatches.push(newMatch);
    await saveData(data);
    return newMatch;
  } catch (error) {
    console.error('Error adding special match:', error);
    return null;
  }
};

// Update special match
export const updateSpecialMatch = async (id, matchData) => {
  try {
    const data = await getAllData();
    if (!data.specialMatches) {
      data.specialMatches = [];
    }
    const index = data.specialMatches.findIndex(m => m.id === id);
    if (index !== -1) {
      data.specialMatches[index] = { ...data.specialMatches[index], ...matchData };
      await saveData(data);
      return data.specialMatches[index];
    }
    return null;
  } catch (error) {
    console.error('Error updating special match:', error);
    return null;
  }
};

// Delete special match
export const deleteSpecialMatch = async (id) => {
  try {
    const data = await getAllData();
    if (!data.specialMatches) {
      data.specialMatches = [];
    }
    data.specialMatches = data.specialMatches.filter(m => m.id !== id);
    await saveData(data);
    return true;
  } catch (error) {
    console.error('Error deleting special match:', error);
    return false;
  }
};
