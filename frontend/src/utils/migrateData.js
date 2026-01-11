// Migration script to move data from IndexedDB to Backend Database
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const DB_NAME = 'mticket-images-db';
const DB_VERSION = 1;
const STORE_NAME = 'images';

// Helper to get data from IndexedDB
const getIndexedDBData = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        resolve(null);
        return;
      }
      
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get('data');
      
      getRequest.onsuccess = () => {
        resolve(getRequest.result ? getRequest.result.value : null);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onupgradeneeded = () => {
      resolve(null);
    };
  });
};

// Migrate data to backend
export const migrateToBackend = async () => {
  try {
    console.log('🔄 Starting migration from IndexedDB to Backend Database...');
    
    // Get data from IndexedDB
    const data = await getIndexedDBData();
    
    if (!data) {
      console.log('ℹ️ No data found in IndexedDB');
      return { success: false, message: 'No data found in IndexedDB' };
    }
    
    console.log('✅ Data found in IndexedDB, migrating...');
    
    // Migrate Hero Image
    if (data.hero) {
      try {
        await axios.put(`${API_URL}/images/hero`, {
          image: data.hero.image,
          alt: data.hero.alt,
          fallback: data.hero.fallback
        });
        console.log('✅ Hero image migrated');
      } catch (err) {
        console.error('❌ Error migrating hero image:', err);
      }
    }
    
    // Migrate Highlights
    if (data.highlights && Array.isArray(data.highlights)) {
      try {
        for (const highlight of data.highlights) {
          await axios.post(`${API_URL}/images/highlights`, {
            title: highlight.title || { th: '', en: '' },
            date: highlight.date || { th: '', en: '' },
            image: highlight.image
          });
        }
        console.log(`✅ ${data.highlights.length} highlights migrated`);
      } catch (err) {
        console.error('❌ Error migrating highlights:', err);
      }
    }
    
    // Migrate Stadiums
    if (data.stadiums && Array.isArray(data.stadiums)) {
      try {
        for (const stadium of data.stadiums) {
          await axios.put(`${API_URL}/images/stadiums/${stadium.id}`, {
            name: stadium.name,
            location: stadium.location,
            image: stadium.image,
            schedule: stadium.schedule,
            scheduleDays: stadium.scheduleDays,
            logoBase64: stadium.logoBase64
          });
        }
        console.log(`✅ ${data.stadiums.length} stadiums migrated`);
      } catch (err) {
        console.error('❌ Error migrating stadiums:', err);
      }
    }
    
    // Migrate Stadium Image Schedules
    if (data.stadiumImageSchedules) {
      try {
        for (const [stadiumId, schedules] of Object.entries(data.stadiumImageSchedules)) {
          if (Array.isArray(schedules) && schedules.length > 0) {
            await axios.put(`${API_URL}/images/stadium-schedules/${stadiumId}`, schedules);
          }
        }
        console.log('✅ Stadium image schedules migrated');
      } catch (err) {
        console.error('❌ Error migrating stadium schedules:', err);
      }
    }
    
    // Migrate Special Matches
    if (data.specialMatches && Array.isArray(data.specialMatches)) {
      try {
        for (const match of data.specialMatches) {
          await axios.post(`${API_URL}/images/special-matches`, {
            stadiumId: match.stadiumId,
            image: match.image,
            name: match.name || '',
            date: match.date
          });
        }
        console.log(`✅ ${data.specialMatches.length} special matches migrated`);
      } catch (err) {
        console.error('❌ Error migrating special matches:', err);
      }
    }
    
    // Migrate Upcoming Fights Background
    if (data.upcomingFightsBackground) {
      try {
        await axios.put(`${API_URL}/images/upcoming-fights-background`, {
          image: data.upcomingFightsBackground.image,
          fallback: data.upcomingFightsBackground.fallback
        });
        console.log('✅ Upcoming fights background migrated');
      } catch (err) {
        console.error('❌ Error migrating upcoming fights background:', err);
      }
    }
    
    // Migrate PromptPay QR
    if (data.promptPayQr) {
      try {
        await axios.put(`${API_URL}/images/promptpay-qr`, {
          qrCode: data.promptPayQr
        });
        console.log('✅ PromptPay QR migrated');
      } catch (err) {
        console.error('❌ Error migrating PromptPay QR:', err);
      }
    }
    
    console.log('🎉 Migration completed!');
    return { success: true, message: 'Migration completed successfully' };
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    return { success: false, message: error.message };
  }
};

