import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database connection
const db = new Database(path.join(__dirname, 'tickets.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export const initDatabase = async () => {
  // Create bookings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      stadium_id TEXT NOT NULL,
      stadium_name TEXT NOT NULL,
      date TEXT NOT NULL,
      zone_id TEXT,
      zone_name TEXT,
      ticket_id TEXT,
      ticket_type TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      total_price INTEGER NOT NULL,
      status TEXT NOT NULL,
      booking_date TEXT NOT NULL,
      ticket_number TEXT UNIQUE NOT NULL,
      payment_start_time TEXT,
      payment_time TEXT,
      payment_slip TEXT,
      payment_verification TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create regular_tickets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS regular_tickets (
      id TEXT PRIMARY KEY,
      stadium_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      day_of_week INTEGER,
      match_id INTEGER,
      match_name TEXT,
      days TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stadium_id) REFERENCES stadiums(id)
    )
  `);

  // Add day_of_week column to existing regular_tickets table if it doesn't exist
  try {
    db.exec(`ALTER TABLE regular_tickets ADD COLUMN day_of_week INTEGER`);
  } catch (err) {
    // Column already exists, ignore error
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding day_of_week column:', err.message);
    }
  }

  // Add match_id column to existing regular_tickets table if it doesn't exist
  try {
    db.exec(`ALTER TABLE regular_tickets ADD COLUMN match_id INTEGER`);
  } catch (err) {
    // Column already exists, ignore error
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding match_id column:', err.message);
    }
  }

  // Add match_name column to existing regular_tickets table if it doesn't exist
  try {
    db.exec(`ALTER TABLE regular_tickets ADD COLUMN match_name TEXT`);
  } catch (err) {
    // Column already exists, ignore error
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding match_name column:', err.message);
    }
  }

  // Add days column to existing regular_tickets table if it doesn't exist
  try {
    db.exec(`ALTER TABLE regular_tickets ADD COLUMN days TEXT`);
  } catch (err) {
    // Column already exists, ignore error
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding days column:', err.message);
    }
  }

  // Add detail column to existing regular_tickets table if it doesn't exist
  try {
    db.exec(`ALTER TABLE regular_tickets ADD COLUMN detail TEXT`);
  } catch (err) {
    // Column already exists, ignore error
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding detail column:', err.message);
    }
  }

  // Add display_order column to existing regular_tickets table if it doesn't exist
  try {
    db.exec(`ALTER TABLE regular_tickets ADD COLUMN display_order INTEGER DEFAULT 0`);
  } catch (err) {
    // Column already exists, ignore error
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding display_order column:', err.message);
    }
  }

  // Create special_tickets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS special_tickets (
      id TEXT PRIMARY KEY,
      stadium_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stadium_id) REFERENCES stadiums(id)
    )
  `);

  // Add detail column to existing special_tickets table if it doesn't exist
  try {
    db.exec(`ALTER TABLE special_tickets ADD COLUMN detail TEXT`);
  } catch (err) {
    // Column already exists, ignore error
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding detail column to special_tickets:', err.message);
    }
  }

  // Add display_order column to existing special_tickets table if it doesn't exist
  try {
    db.exec(`ALTER TABLE special_tickets ADD COLUMN display_order INTEGER DEFAULT 0`);
  } catch (err) {
    // Column already exists, ignore error
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding display_order column to special_tickets:', err.message);
    }
  }

  // Create discount_tickets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS discount_tickets (
      id TEXT PRIMARY KEY,
      stadium_id TEXT NOT NULL,
      base_ticket_id TEXT NOT NULL,
      base_ticket_type TEXT NOT NULL CHECK(base_ticket_type IN ('regular', 'special')),
      discount_price REAL NOT NULL,
      day_of_month INTEGER NOT NULL CHECK(day_of_month >= 1 AND day_of_month <= 31),
      month INTEGER NOT NULL CHECK(month >= 1 AND month <= 12),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stadium_id) REFERENCES stadiums(id)
    )
  `);

  // Create stadiums table (for reference)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stadiums (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL
    )
  `);

  // Create stadium_ticket_type_details table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stadium_ticket_type_details (
      stadium_id TEXT PRIMARY KEY,
      detail TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stadium_id) REFERENCES stadiums(id)
    )
  `);

  // Create hero_images table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hero_images (
      id INTEGER PRIMARY KEY,
      image TEXT NOT NULL,
      alt TEXT,
      fallback TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create highlights table
  db.exec(`
    CREATE TABLE IF NOT EXISTS highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_th TEXT,
      title_en TEXT,
      date_th TEXT,
      date_en TEXT,
      description_th TEXT,
      description_en TEXT,
      image TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add description columns to highlights table if they don't exist
  try {
    db.exec(`ALTER TABLE highlights ADD COLUMN description_th TEXT`);
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding description_th column:', err.message);
    }
  }
  try {
    db.exec(`ALTER TABLE highlights ADD COLUMN description_en TEXT`);
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding description_en column:', err.message);
    }
  }

  // Add columns to stadiums table if they don't exist
  try {
    db.exec(`ALTER TABLE stadiums ADD COLUMN image TEXT`);
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding image column:', err.message);
    }
  }
  try {
    db.exec(`ALTER TABLE stadiums ADD COLUMN schedule_th TEXT`);
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding schedule_th column:', err.message);
    }
  }
  try {
    db.exec(`ALTER TABLE stadiums ADD COLUMN schedule_en TEXT`);
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding schedule_en column:', err.message);
    }
  }
  try {
    db.exec(`ALTER TABLE stadiums ADD COLUMN schedule_days TEXT`);
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding schedule_days column:', err.message);
    }
  }
  try {
    db.exec(`ALTER TABLE stadiums ADD COLUMN logo_base64 TEXT`);
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding logo_base64 column:', err.message);
    }
  }
  try {
    db.exec(`ALTER TABLE stadiums ADD COLUMN payment_image TEXT`);
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding payment_image column:', err.message);
    }
  }

  // Create stadium_image_schedules table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stadium_image_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stadium_id TEXT NOT NULL,
      image TEXT NOT NULL,
      name TEXT,
      days TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stadium_id) REFERENCES stadiums(id)
    )
  `);

  // Create special_matches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS special_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stadium_id TEXT NOT NULL,
      image TEXT NOT NULL,
      name TEXT,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stadium_id) REFERENCES stadiums(id)
    )
  `);

  // Create daily_images table
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stadium_id TEXT NOT NULL,
      image TEXT NOT NULL,
      name TEXT,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stadium_id) REFERENCES stadiums(id)
    )
  `);

  // Create upcoming_fights_background table
  db.exec(`
    CREATE TABLE IF NOT EXISTS upcoming_fights_background (
      id INTEGER PRIMARY KEY,
      image TEXT NOT NULL,
      fallback TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create email_verifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id TEXT PRIMARY KEY,
      verification_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      booking_data TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      verified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create promptpay_qr table
  db.exec(`
    CREATE TABLE IF NOT EXISTS promptpay_qr (
      id INTEGER PRIMARY KEY,
      qr_code TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create news_popup_images table
  db.exec(`
    CREATE TABLE IF NOT EXISTS news_popup_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create ticket_quantities_by_date table - สำหรับแยกจำนวนตั๋วตามวัน
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_quantities_by_date (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stadium_id TEXT NOT NULL,
      ticket_id TEXT NOT NULL,
      ticket_type TEXT NOT NULL,
      date TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      initial_quantity INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(stadium_id, ticket_id, ticket_type, date),
      FOREIGN KEY (stadium_id) REFERENCES stadiums(id)
    )
  `);

  // Create booking_videos table - สำหรับเก็บวิดีโอที่แสดงในหน้า booking
  db.exec(`
    CREATE TABLE IF NOT EXISTS booking_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stadium_id TEXT NOT NULL,
      video_url TEXT NOT NULL,
      title TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stadium_id) REFERENCES stadiums(id)
    )
  `);

  // Create booking_background table - สำหรับเก็บพื้นหลังหน้า booking
  db.exec(`
    CREATE TABLE IF NOT EXISTS booking_background (
      id INTEGER PRIMARY KEY,
      image TEXT NOT NULL,
      fallback TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add stadium_id column to existing booking_videos table if it doesn't exist
  try {
    db.exec(`ALTER TABLE booking_videos ADD COLUMN stadium_id TEXT`);
  } catch (err) {
    // Column already exists, ignore error
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding stadium_id column:', err.message);
    }
  }

  // Insert default stadiums if not exists
  const insertStadium = db.prepare(`
    INSERT OR IGNORE INTO stadiums (id, name, location) 
    VALUES (?, ?, ?)
  `);
  
  insertStadium.run('rajadamnern', 'Rajadamnern Stadium', 'Bangkok');
  insertStadium.run('lumpinee', 'Lumpinee Stadium', 'Bangkok');
  insertStadium.run('bangla', 'Bangla Boxing Stadium', 'Phuket');
  insertStadium.run('patong', 'Patong Stadium', 'Phuket');

  // Insert default hero image if not exists (use actual hero image path)
  const insertHero = db.prepare(`
    INSERT OR IGNORE INTO hero_images (id, image, alt, fallback)
    VALUES (1, '/images/hero/World class fighters.webp', 'Muay Thai', '/images/hero/World class fighters.webp')
  `);
  insertHero.run();

  // Insert default upcoming fights background if not exists
  const insertBackground = db.prepare(`
    INSERT OR IGNORE INTO upcoming_fights_background (id, image, fallback)
    VALUES (1, '/images/upcoming-fights-bg.webp', '/images/hero/World class fighters.webp')
  `);
  insertBackground.run();

  // Insert default booking background if not exists
  const insertBookingBackground = db.prepare(`
    INSERT OR IGNORE INTO booking_background (id, image, fallback)
    VALUES (1, '/images/hero/World class fighters.webp', '/images/hero/World class fighters.webp')
  `);
  insertBookingBackground.run();

  console.log('✅ Database initialized successfully');
  
  // Run pending migrations automatically
  try {
    const { default: MigrationManager } = await import('./migrations/migrationManager.js');
    const dbPath = path.join(__dirname, 'tickets.db');
    const manager = new MigrationManager(dbPath);
    await manager.runPendingMigrations();
    manager.close();
  } catch (err) {
    console.warn('⚠️ Warning: Could not run migrations:', err.message);
    // Don't throw - allow server to start even if migrations fail
  }
};

// Hero Images operations
export const getHeroImage = () => {
  const stmt = db.prepare('SELECT * FROM hero_images WHERE id = 1');
  const hero = stmt.get();
  return hero || { id: 1, image: '/images/hero/World class fighters.webp', alt: 'Muay Thai', fallback: '/images/hero/World class fighters.webp' };
};

export const updateHeroImage = (image, alt, fallback) => {
  const stmt = db.prepare(`
    INSERT INTO hero_images (id, image, alt, fallback, updated_at)
    VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      image = excluded.image,
      alt = excluded.alt,
      fallback = excluded.fallback,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(image, alt || 'Muay Thai', fallback || '/images/hero/World class fighters.webp');
  return getHeroImage();
};

// Highlights operations
export const getHighlights = () => {
  const stmt = db.prepare('SELECT * FROM highlights ORDER BY created_at DESC');
  const highlights = stmt.all();
  return highlights.map(h => ({
    id: h.id,
    title: { th: h.title_th || '', en: h.title_en || '' },
    date: { th: h.date_th || '', en: h.date_en || '' },
    description: { th: h.description_th || '', en: h.description_en || '' },
    image: h.image
  }));
};

export const createHighlight = (highlight) => {
  const stmt = db.prepare(`
    INSERT INTO highlights (title_th, title_en, date_th, date_en, description_th, description_en, image)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    highlight.title?.th || '',
    highlight.title?.en || '',
    highlight.date?.th || '',
    highlight.date?.en || '',
    highlight.description?.th || '',
    highlight.description?.en || '',
    highlight.image
  );
  return { id: result.lastInsertRowid, ...highlight };
};

export const updateHighlight = (id, highlight) => {
  const stmt = db.prepare(`
    UPDATE highlights 
    SET title_th = ?, title_en = ?, date_th = ?, date_en = ?, description_th = ?, description_en = ?, image = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(
    highlight.title?.th || '',
    highlight.title?.en || '',
    highlight.date?.th || '',
    highlight.date?.en || '',
    highlight.description?.th || '',
    highlight.description?.en || '',
    highlight.image,
    id
  );
  const getStmt = db.prepare('SELECT * FROM highlights WHERE id = ?');
  const h = getStmt.get(id);
  return {
    id: h.id,
    title: { th: h.title_th || '', en: h.title_en || '' },
    date: { th: h.date_th || '', en: h.date_en || '' },
    description: { th: h.description_th || '', en: h.description_en || '' },
    image: h.image
  };
};

export const deleteHighlight = (id) => {
  const stmt = db.prepare('DELETE FROM highlights WHERE id = ?');
  return stmt.run(id);
};

// Stadiums operations (extended)
export const getStadiumsExtended = () => {
  const stmt = db.prepare('SELECT * FROM stadiums');
  const stadiums = stmt.all();
  return stadiums.map(s => ({
    id: s.id,
    name: { th: s.name || '', en: s.name || '' },
    location: { th: s.location || '', en: s.location || '' },
    image: s.image || '',
    schedule: { th: s.schedule_th || '', en: s.schedule_en || '' },
    scheduleDays: s.schedule_days ? JSON.parse(s.schedule_days) : [],
    logoBase64: s.logo_base64 || null,
    paymentImage: s.payment_image || null
  }));
};

export const createStadiumExtended = (data) => {
  const { id, name, location, image, schedule, scheduleDays, logoBase64, paymentImage } = data;
  
  if (!id || !name) {
    throw new Error('Stadium id and name are required');
  }
  
  const nameValue = typeof name === 'object' ? (name.en || name.th || '') : name;
  const locationValue = typeof location === 'object' ? (location.en || location.th || '') : location;
  const imageValue = image || '';
  const scheduleTh = schedule?.th || '';
  const scheduleEn = schedule?.en || '';
  const scheduleDaysValue = scheduleDays ? JSON.stringify(scheduleDays) : null;
  
  const stmt = db.prepare(`
    INSERT INTO stadiums (id, name, location, image, schedule_th, schedule_en, schedule_days, logo_base64, payment_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    nameValue,
    locationValue,
    imageValue,
    scheduleTh,
    scheduleEn,
    scheduleDaysValue,
    logoBase64 || null,
    paymentImage || null
  );
  
  const getStmt = db.prepare('SELECT * FROM stadiums WHERE id = ?');
  const s = getStmt.get(id);
  return {
    id: s.id,
    name: { th: s.name || '', en: s.name || '' },
    location: { th: s.location || '', en: s.location || '' },
    image: s.image || '',
    schedule: { th: s.schedule_th || '', en: s.schedule_en || '' },
    scheduleDays: s.schedule_days ? JSON.parse(s.schedule_days) : [],
    logoBase64: s.logo_base64 || null,
    paymentImage: s.payment_image || null
  };
};

export const updateStadiumExtended = (id, data) => {
  const fields = [];
  const values = [];
  
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(typeof data.name === 'object' ? (data.name.en || data.name.th || '') : data.name);
  }
  if (data.location !== undefined) {
    fields.push('location = ?');
    values.push(typeof data.location === 'object' ? (data.location.en || data.location.th || '') : data.location);
  }
  if (data.image !== undefined) {
    fields.push('image = ?');
    values.push(data.image);
  }
  if (data.schedule !== undefined) {
    fields.push('schedule_th = ?');
    fields.push('schedule_en = ?');
    values.push(data.schedule?.th || '');
    values.push(data.schedule?.en || '');
  }
  if (data.scheduleDays !== undefined) {
    fields.push('schedule_days = ?');
    values.push(JSON.stringify(data.scheduleDays));
  }
  if (data.logoBase64 !== undefined) {
    fields.push('logo_base64 = ?');
    values.push(data.logoBase64);
  }
  if (data.paymentImage !== undefined) {
    fields.push('payment_image = ?');
    values.push(data.paymentImage);
  }
  
  if (fields.length > 0) {
    values.push(id);
    const stmt = db.prepare(`UPDATE stadiums SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }
  
  const getStmt = db.prepare('SELECT * FROM stadiums WHERE id = ?');
  const s = getStmt.get(id);
  return {
    id: s.id,
    name: { th: s.name || '', en: s.name || '' },
    location: { th: s.location || '', en: s.location || '' },
    image: s.image || '',
    schedule: { th: s.schedule_th || '', en: s.schedule_en || '' },
    scheduleDays: s.schedule_days ? JSON.parse(s.schedule_days) : [],
    logoBase64: s.logo_base64 || null,
    paymentImage: s.payment_image || null
  };
};

export const deleteStadiumExtended = (id) => {
  const stmt = db.prepare('DELETE FROM stadiums WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

// Stadium Image Schedules operations
export const getStadiumImageSchedules = () => {
  const stmt = db.prepare('SELECT * FROM stadium_image_schedules ORDER BY created_at ASC');
  const schedules = stmt.all();
  
  // Get all stadiums from database to build result object dynamically
  const allStadiums = getStadiumsExtended();
  const result = {};
  
  // Initialize result object with all stadiums
  allStadiums.forEach(stadium => {
    result[stadium.id] = [];
  });
  
  // Populate schedules
  schedules.forEach(s => {
    if (result[s.stadium_id]) {
      result[s.stadium_id].push({
        id: s.id,
        image: s.image,
        name: s.name || '',
        days: s.days ? JSON.parse(s.days) : []
      });
    }
  });
  
  return result;
};

export const updateStadiumImageSchedules = (stadiumId, schedules) => {
  // Delete existing schedules for this stadium
  const deleteStmt = db.prepare('DELETE FROM stadium_image_schedules WHERE stadium_id = ?');
  deleteStmt.run(stadiumId);
  
  // Insert new schedules
  const insertStmt = db.prepare(`
    INSERT INTO stadium_image_schedules (stadium_id, image, name, days)
    VALUES (?, ?, ?, ?)
  `);
  
  schedules.forEach(schedule => {
    insertStmt.run(
      stadiumId,
      schedule.image,
      schedule.name || '',
      JSON.stringify(schedule.days || [])
    );
  });
  
  return getStadiumImageSchedules()[stadiumId];
};

// Special Matches operations
export const getSpecialMatches = () => {
  const stmt = db.prepare('SELECT * FROM special_matches ORDER BY date ASC, created_at ASC');
  const matches = stmt.all();
  
  // Check for linked special tickets
  const ticketStmt = db.prepare('SELECT COUNT(*) as count FROM special_tickets WHERE stadium_id = ? AND date = ?');
  
  return matches.map(m => {
    const ticketCount = ticketStmt.get(m.stadium_id, m.date);
    return {
      id: m.id,
      stadiumId: m.stadium_id,
      image: m.image,
      name: m.name || '',
      date: m.date,
      hasLinkedTickets: ticketCount.count > 0
    };
  });
};

export const createSpecialMatch = (match) => {
  const stmt = db.prepare(`
    INSERT INTO special_matches (stadium_id, image, name, date)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(
    match.stadiumId,
    match.image,
    match.name || '',
    match.date
  );
  return { id: result.lastInsertRowid, ...match };
};

export const updateSpecialMatch = (id, match) => {
  const stmt = db.prepare(`
    UPDATE special_matches 
    SET stadium_id = ?, image = ?, name = ?, date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(
    match.stadiumId,
    match.image,
    match.name || '',
    match.date,
    id
  );
  const getStmt = db.prepare('SELECT * FROM special_matches WHERE id = ?');
  const m = getStmt.get(id);
  return {
    id: m.id,
    stadiumId: m.stadium_id,
    image: m.image,
    name: m.name || '',
    date: m.date
  };
};

export const deleteSpecialMatch = (id) => {
  const stmt = db.prepare('DELETE FROM special_matches WHERE id = ?');
  return stmt.run(id);
};

// Daily Images operations
export const getDailyImages = () => {
  const stmt = db.prepare('SELECT * FROM daily_images ORDER BY date ASC, created_at ASC');
  const images = stmt.all();
  
  // Check for linked regular tickets based on day of week
  // We need to check if there are regular tickets for the day of week of the date
  const getDayOfWeek = (dateStr) => {
    const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone issues
    return date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  };
  
  return images.map(img => {
    const dayOfWeek = getDayOfWeek(img.date);
    
    // Check by parsing days JSON properly and verify quantity > 0
    const allTickets = db.prepare('SELECT id, days FROM regular_tickets WHERE stadium_id = ?').all(img.stadium_id);
    let hasLinkedTickets = false;
    
    for (const ticket of allTickets) {
      if (ticket.days) {
        try {
          const days = JSON.parse(ticket.days);
          if (Array.isArray(days) && days.includes(dayOfWeek)) {
            // Check if ticket has quantity > 0 for this date
            const quantity = getTicketQuantityByDate(img.stadium_id, ticket.id, 'regular', img.date);
            if (quantity > 0) {
              hasLinkedTickets = true;
              break;
            }
          }
        } catch (e) {
          // Invalid JSON, skip
        }
      }
    }
    
    return {
      id: img.id,
      stadiumId: img.stadium_id,
      image: img.image,
      name: img.name || '',
      date: img.date,
      hasLinkedTickets: hasLinkedTickets
    };
  });
};

export const createDailyImage = (image) => {
  const stmt = db.prepare(`
    INSERT INTO daily_images (stadium_id, image, name, date)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(
    image.stadiumId,
    image.image,
    image.name || '',
    image.date
  );
  return { id: result.lastInsertRowid, ...image };
};

export const updateDailyImage = (id, image) => {
  const stmt = db.prepare(`
    UPDATE daily_images 
    SET stadium_id = ?, image = ?, name = ?, date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(
    image.stadiumId,
    image.image,
    image.name || '',
    image.date,
    id
  );
  const getStmt = db.prepare('SELECT * FROM daily_images WHERE id = ?');
  const img = getStmt.get(id);
  return {
    id: img.id,
    stadiumId: img.stadium_id,
    image: img.image,
    name: img.name || '',
    date: img.date
  };
};

export const deleteDailyImage = (id) => {
  const stmt = db.prepare('DELETE FROM daily_images WHERE id = ?');
  return stmt.run(id);
};

// Upcoming Fights Background operations
export const getUpcomingFightsBackground = () => {
  const stmt = db.prepare('SELECT * FROM upcoming_fights_background WHERE id = 1');
  const bg = stmt.get();
  return bg || { 
    id: 1, 
    image: '/images/upcoming-fights-bg.webp', 
    fallback: '/images/hero/World class fighters.webp' 
  };
};

export const updateUpcomingFightsBackground = (image, fallback) => {
  const stmt = db.prepare(`
    INSERT INTO upcoming_fights_background (id, image, fallback, updated_at)
    VALUES (1, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      image = excluded.image,
      fallback = excluded.fallback,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(image, fallback || '/images/hero/World class fighters.webp');
  return getUpcomingFightsBackground();
};

// Booking Background operations
export const getBookingBackground = () => {
  const stmt = db.prepare('SELECT * FROM booking_background WHERE id = 1');
  const bg = stmt.get();
  return bg || { 
    id: 1, 
    image: '/images/hero/World class fighters.webp', 
    fallback: '/images/hero/World class fighters.webp' 
  };
};

export const updateBookingBackground = (image, fallback) => {
  const stmt = db.prepare(`
    INSERT INTO booking_background (id, image, fallback, updated_at)
    VALUES (1, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      image = excluded.image,
      fallback = excluded.fallback,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(image, fallback || '/images/hero/World class fighters.webp');
  return getBookingBackground();
};

// PromptPay QR operations
export const getPromptPayQr = () => {
  const stmt = db.prepare('SELECT * FROM promptpay_qr WHERE id = 1');
  const qr = stmt.get();
  return qr ? qr.qr_code : null;
};

export const updatePromptPayQr = (qrCode) => {
  const stmt = db.prepare(`
    INSERT INTO promptpay_qr (id, qr_code, updated_at)
    VALUES (1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      qr_code = excluded.qr_code,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(qrCode);
  return getPromptPayQr();
};

// Booking operations
export const createBooking = (booking) => {
  const stmt = db.prepare(`
    INSERT INTO bookings (
      id, stadium_id, stadium_name, date, zone_id, zone_name,
      ticket_id, ticket_type, name, email, phone, quantity,
      total_price, status, booking_date, ticket_number,
      payment_start_time, payment_time, payment_slip, payment_verification
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return stmt.run(
    booking.id,
    booking.stadiumId,
    booking.stadium,
    booking.date,
    booking.zoneId || null,
    booking.zone || null,
    booking.ticketId || null,
    booking.ticketType || null,
    booking.name,
    booking.email,
    booking.phone,
    booking.quantity,
    booking.totalPrice,
    booking.status,
    booking.bookingDate,
    booking.ticketNumber,
    booking.paymentStartTime || null,
    booking.paymentTime || null,
    booking.paymentSlip || null,
    booking.paymentVerification ? JSON.stringify(booking.paymentVerification) : null
  );
};

export const getAllBookings = () => {
  // Get all bookings first
  const bookingsStmt = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC');
  const bookings = bookingsStmt.all();
  
  // Get all payments
  const paymentsStmt = db.prepare('SELECT * FROM payments');
  const payments = paymentsStmt.all();
  
  // Create a map of payments by customer_email and reference_no
  const paymentMap = {};
  payments.forEach(payment => {
    if (payment.customer_email) {
      paymentMap[payment.customer_email] = payment;
    }
    if (payment.reference_no) {
      paymentMap[payment.reference_no] = payment;
    }
  });
  
  // Merge bookings with payments
  return bookings.map(booking => {
    // Try to find payment by email or ticket_number
    const payment = paymentMap[booking.email] || paymentMap[booking.ticket_number] || null;
    
    return {
      ...booking,
      paymentVerification: booking.payment_verification ? JSON.parse(booking.payment_verification) : null,
      referenceNo: payment?.reference_no || booking.ticket_number, // ใช้ reference_no จาก payment หรือ ticket_number
      payment_reference_no: payment?.reference_no || null,
      payment_order_no: payment?.order_no || null,
      payment_status: payment?.status || null,
      payment_amount: payment?.amount || null
    };
  });
};

export const getBookingById = (id) => {
  const stmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
  const booking = stmt.get(id);
  
  if (!booking) {
    return null;
  }
  
  // Try to find payment by email or ticket_number
  const paymentByEmail = db.prepare('SELECT * FROM payments WHERE customer_email = ? LIMIT 1');
  const paymentByRef = db.prepare('SELECT * FROM payments WHERE reference_no = ? LIMIT 1');
  
  const payment = paymentByEmail.get(booking.email) || paymentByRef.get(booking.ticket_number) || null;
  
  return {
    ...booking,
    paymentVerification: booking.payment_verification ? JSON.parse(booking.payment_verification) : null,
    referenceNo: payment?.reference_no || booking.ticket_number, // ใช้ reference_no จาก payment หรือ ticket_number
    payment_reference_no: payment?.reference_no || null,
    payment_order_no: payment?.order_no || null,
    payment_status: payment?.status || null,
    payment_amount: payment?.amount || null,
    payment_qr_code: payment?.qr_code_image || null,
    payment_expire_date: payment?.expire_date || null,
    payment_order_datetime: payment?.order_datetime || null
  };
};

// Regular tickets operations
export const getRegularTickets = (stadiumId) => {
  const stmt = db.prepare('SELECT * FROM regular_tickets WHERE stadium_id = ? ORDER BY display_order ASC, created_at ASC');
  const tickets = stmt.all(stadiumId);
  // Parse days JSON string to array
  return tickets.map(ticket => ({
    ...ticket,
    days: ticket.days ? JSON.parse(ticket.days) : null,
    display_order: ticket.display_order || 0
  }));
};

export const createRegularTicket = (stadiumId, ticket) => {
  // Get max display_order for this stadium to set new ticket order
  const maxOrderStmt = db.prepare('SELECT MAX(display_order) as max_order FROM regular_tickets WHERE stadium_id = ?');
  const maxOrderResult = maxOrderStmt.get(stadiumId);
  const nextOrder = (maxOrderResult?.max_order ?? -1) + 1;
  
  const stmt = db.prepare(`
    INSERT INTO regular_tickets (id, stadium_id, name, price, quantity, day_of_week, match_id, match_name, days, detail, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    ticket.id, 
    stadiumId, 
    ticket.name, 
    ticket.price, 
    ticket.quantity || 0, 
    ticket.day_of_week !== undefined ? ticket.day_of_week : null,
    ticket.match_id !== undefined ? ticket.match_id : null,
    ticket.match_name || null,
    ticket.days ? JSON.stringify(ticket.days) : null,
    ticket.detail || null,
    ticket.display_order !== undefined ? ticket.display_order : nextOrder
  );
  return ticket;
};

export const updateRegularTicket = (stadiumId, ticketId, updates) => {
  const fields = [];
  const values = [];
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.price !== undefined) {
    fields.push('price = ?');
    values.push(updates.price);
  }
  if (updates.quantity !== undefined) {
    fields.push('quantity = ?');
    values.push(updates.quantity);
  }
  if (updates.day_of_week !== undefined) {
    fields.push('day_of_week = ?');
    values.push(updates.day_of_week !== null ? updates.day_of_week : null);
  }
  if (updates.match_id !== undefined) {
    fields.push('match_id = ?');
    values.push(updates.match_id !== null ? updates.match_id : null);
  }
  if (updates.match_name !== undefined) {
    fields.push('match_name = ?');
    values.push(updates.match_name || null);
  }
  if (updates.days !== undefined) {
    fields.push('days = ?');
    values.push(updates.days ? JSON.stringify(updates.days) : null);
  }
  if (updates.detail !== undefined) {
    fields.push('detail = ?');
    values.push(updates.detail || null);
  }
  if (updates.display_order !== undefined) {
    fields.push('display_order = ?');
    values.push(updates.display_order !== null && updates.display_order !== undefined ? parseInt(updates.display_order) : 0);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(stadiumId, ticketId);
  
  const stmt = db.prepare(`
    UPDATE regular_tickets 
    SET ${fields.join(', ')} 
    WHERE stadium_id = ? AND id = ?
  `);
  
  stmt.run(...values);
  
  const getStmt = db.prepare('SELECT * FROM regular_tickets WHERE stadium_id = ? AND id = ?');
  const ticket = getStmt.get(stadiumId, ticketId);
  if (ticket && ticket.days) {
    ticket.days = JSON.parse(ticket.days);
  }
  return ticket;
};

export const deleteRegularTicket = (stadiumId, ticketId) => {
  const stmt = db.prepare('DELETE FROM regular_tickets WHERE stadium_id = ? AND id = ?');
  return stmt.run(stadiumId, ticketId);
};

// Special tickets operations
export const getSpecialTickets = (stadiumId) => {
  const stmt = db.prepare('SELECT * FROM special_tickets WHERE stadium_id = ? ORDER BY display_order ASC, date ASC, created_at ASC');
  const tickets = stmt.all(stadiumId);
  
  // Check for linked special matches
  const matchStmt = db.prepare('SELECT COUNT(*) as count FROM special_matches WHERE stadium_id = ? AND date = ?');
  
  return tickets.map(t => {
    const matchCount = matchStmt.get(t.stadium_id, t.date);
    return {
      ...t,
      hasLinkedMatch: matchCount.count > 0,
      display_order: t.display_order || 0
    };
  });
};

export const createSpecialTicket = (stadiumId, ticket) => {
  // Get max display_order for this stadium to set new ticket order
  const maxOrderStmt = db.prepare('SELECT MAX(display_order) as max_order FROM special_tickets WHERE stadium_id = ?');
  const maxOrderResult = maxOrderStmt.get(stadiumId);
  const nextOrder = (maxOrderResult?.max_order ?? -1) + 1;
  
  const stmt = db.prepare(`
    INSERT INTO special_tickets (id, stadium_id, name, price, quantity, date, image, detail, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(ticket.id, stadiumId, ticket.name, ticket.price, ticket.quantity || 0, ticket.date, ticket.image || null, ticket.detail || null, ticket.display_order !== undefined ? ticket.display_order : nextOrder);
  return ticket;
};

export const updateSpecialTicket = (stadiumId, ticketId, updates) => {
  const fields = [];
  const values = [];
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.price !== undefined) {
    fields.push('price = ?');
    values.push(updates.price);
  }
  if (updates.quantity !== undefined) {
    fields.push('quantity = ?');
    values.push(updates.quantity);
  }
  if (updates.date !== undefined) {
    fields.push('date = ?');
    values.push(updates.date);
  }
  if (updates.image !== undefined) {
    fields.push('image = ?');
    values.push(updates.image || null);
  }
  if (updates.detail !== undefined) {
    fields.push('detail = ?');
    values.push(updates.detail || null);
  }
  if (updates.display_order !== undefined) {
    fields.push('display_order = ?');
    values.push(updates.display_order !== null && updates.display_order !== undefined ? parseInt(updates.display_order) : 0);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(stadiumId, ticketId);
  
  const stmt = db.prepare(`
    UPDATE special_tickets 
    SET ${fields.join(', ')} 
    WHERE stadium_id = ? AND id = ?
  `);
  
  stmt.run(...values);
  
  const getStmt = db.prepare('SELECT * FROM special_tickets WHERE stadium_id = ? AND id = ?');
  return getStmt.get(stadiumId, ticketId);
};

export const deleteSpecialTicket = (stadiumId, ticketId) => {
  const stmt = db.prepare('DELETE FROM special_tickets WHERE stadium_id = ? AND id = ?');
  return stmt.run(stadiumId, ticketId);
};

// Discount tickets operations
export const getDiscountTickets = (stadiumId) => {
  const stmt = db.prepare('SELECT * FROM discount_tickets WHERE stadium_id = ? ORDER BY month ASC, day_of_month ASC');
  return stmt.all(stadiumId);
};

export const getDiscountTicketForDate = (stadiumId, ticketId, ticketType, date) => {
  // Parse date to get day and month
  const [year, month, day] = date.split('-').map(Number);
  
  const stmt = db.prepare(`
    SELECT * FROM discount_tickets 
    WHERE stadium_id = ? 
      AND base_ticket_id = ? 
      AND base_ticket_type = ? 
      AND day_of_month = ? 
      AND month = ?
  `);
  return stmt.get(stadiumId, ticketId, ticketType, day, month);
};

export const createDiscountTicket = (stadiumId, discountTicket) => {
  const stmt = db.prepare(`
    INSERT INTO discount_tickets (id, stadium_id, base_ticket_id, base_ticket_type, discount_price, day_of_month, month)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    discountTicket.id,
    stadiumId,
    discountTicket.base_ticket_id,
    discountTicket.base_ticket_type,
    discountTicket.discount_price,
    discountTicket.day_of_month,
    discountTicket.month
  );
  return discountTicket;
};

export const updateDiscountTicket = (stadiumId, discountTicketId, updates) => {
  const fields = [];
  const values = [];
  
  if (updates.base_ticket_id !== undefined) {
    fields.push('base_ticket_id = ?');
    values.push(updates.base_ticket_id);
  }
  if (updates.base_ticket_type !== undefined) {
    fields.push('base_ticket_type = ?');
    values.push(updates.base_ticket_type);
  }
  if (updates.discount_price !== undefined) {
    fields.push('discount_price = ?');
    values.push(updates.discount_price);
  }
  if (updates.day_of_month !== undefined) {
    fields.push('day_of_month = ?');
    values.push(updates.day_of_month);
  }
  if (updates.month !== undefined) {
    fields.push('month = ?');
    values.push(updates.month);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(stadiumId, discountTicketId);
  
  const stmt = db.prepare(`
    UPDATE discount_tickets 
    SET ${fields.join(', ')} 
    WHERE stadium_id = ? AND id = ?
  `);
  
  stmt.run(...values);
  
  const getStmt = db.prepare('SELECT * FROM discount_tickets WHERE stadium_id = ? AND id = ?');
  return getStmt.get(stadiumId, discountTicketId);
};

export const deleteDiscountTicket = (stadiumId, discountTicketId) => {
  const stmt = db.prepare('DELETE FROM discount_tickets WHERE stadium_id = ? AND id = ?');
  return stmt.run(stadiumId, discountTicketId);
};

// Stadium Payment Images operations
export const getStadiumPaymentImages = (stadiumId) => {
  const stmt = db.prepare('SELECT * FROM stadium_payment_images WHERE stadium_id = ? ORDER BY created_at ASC');
  const images = stmt.all(stadiumId);
  return images.map(img => ({
    ...img,
    days: img.days ? JSON.parse(img.days) : []
  }));
};

export const createStadiumPaymentImage = (stadiumId, imageData) => {
  const stmt = db.prepare(`
    INSERT INTO stadium_payment_images (stadium_id, image, days)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(
    stadiumId,
    imageData.image,
    JSON.stringify(imageData.days || [])
  );
  return {
    id: result.lastInsertRowid,
    stadium_id: stadiumId,
    image: imageData.image,
    days: imageData.days || []
  };
};

export const updateStadiumPaymentImage = (id, imageData) => {
  const fields = [];
  const values = [];
  
  if (imageData.image !== undefined) {
    fields.push('image = ?');
    values.push(imageData.image);
  }
  if (imageData.days !== undefined) {
    fields.push('days = ?');
    values.push(JSON.stringify(imageData.days || []));
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE stadium_payment_images 
    SET ${fields.join(', ')} 
    WHERE id = ?
  `);
  
  stmt.run(...values);
  
  const getStmt = db.prepare('SELECT * FROM stadium_payment_images WHERE id = ?');
  const img = getStmt.get(id);
  return {
    ...img,
    days: img.days ? JSON.parse(img.days) : []
  };
};

export const deleteStadiumPaymentImage = (id) => {
  const stmt = db.prepare('DELETE FROM stadium_payment_images WHERE id = ?');
  return stmt.run(id);
};

// ============================================================
// Stadium Ticket Type Detail Operations
// ============================================================

/**
 * Get ticket type detail for a stadium
 * @param {string} stadiumId - Stadium ID
 * @returns {Object|null} Ticket type detail object or null if not found
 */
export const getStadiumTicketTypeDetail = (stadiumId) => {
  const stmt = db.prepare('SELECT * FROM stadium_ticket_type_details WHERE stadium_id = ?');
  const result = stmt.get(stadiumId);
  return result || null;
};

/**
 * Create or update ticket type detail for a stadium
 * @param {string} stadiumId - Stadium ID
 * @param {string} detail - Ticket type detail text
 * @returns {Object} Created or updated ticket type detail
 */
export const upsertStadiumTicketTypeDetail = (stadiumId, detail) => {
  const existingStmt = db.prepare('SELECT * FROM stadium_ticket_type_details WHERE stadium_id = ?');
  const existing = existingStmt.get(stadiumId);
  
  if (existing) {
    // Update existing
    const updateStmt = db.prepare(`
      UPDATE stadium_ticket_type_details 
      SET detail = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE stadium_id = ?
    `);
    updateStmt.run(detail || null, stadiumId);
  } else {
    // Insert new
    const insertStmt = db.prepare(`
      INSERT INTO stadium_ticket_type_details (stadium_id, detail) 
      VALUES (?, ?)
    `);
    insertStmt.run(stadiumId, detail || null);
  }
  
  const getStmt = db.prepare('SELECT * FROM stadium_ticket_type_details WHERE stadium_id = ?');
  return getStmt.get(stadiumId);
};

// Deduct ticket quantity when booking is confirmed
// date: YYYY-MM-DD format
export const deductTicketQuantity = (stadiumId, ticketId, ticketType, quantity, date = null) => {
  // ถ้ามี date ให้ใช้ระบบแยกจำนวนตั๋วตามวัน
  if (date) {
    // ตรวจสอบว่ามี record สำหรับวันนี้หรือยัง
    const checkStmt = db.prepare(`
      SELECT quantity, initial_quantity 
      FROM ticket_quantities_by_date 
      WHERE stadium_id = ? AND ticket_id = ? AND ticket_type = ? AND date = ?
    `);
    const existing = checkStmt.get(stadiumId, ticketId, ticketType, date);
    
    if (existing) {
      // มี record แล้ว - หักจำนวน
      if (existing.quantity < quantity) {
        return false; // ไม่พอ
      }
      const updateStmt = db.prepare(`
        UPDATE ticket_quantities_by_date 
        SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP 
        WHERE stadium_id = ? AND ticket_id = ? AND ticket_type = ? AND date = ? AND quantity >= ?
      `);
      const result = updateStmt.run(quantity, stadiumId, ticketId, ticketType, date, quantity);
      return result.changes > 0;
    } else {
      // ยังไม่มี record - ต้องดึง initial_quantity จากตารางหลัก
      const table = ticketType === 'regular' ? 'regular_tickets' : 'special_tickets';
      const getInitialStmt = db.prepare(`SELECT quantity FROM ${table} WHERE stadium_id = ? AND id = ?`);
      const ticket = getInitialStmt.get(stadiumId, ticketId);
      
      if (!ticket || ticket.quantity < quantity) {
        return false; // ไม่พอ
      }
      
      // สร้าง record ใหม่ด้วย initial_quantity และหักจำนวน
      const insertStmt = db.prepare(`
        INSERT INTO ticket_quantities_by_date (stadium_id, ticket_id, ticket_type, date, quantity, initial_quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const remainingQuantity = ticket.quantity - quantity;
      insertStmt.run(stadiumId, ticketId, ticketType, date, remainingQuantity, ticket.quantity);
      return true;
    }
  } else {
    // Legacy: ไม่มี date - ใช้ระบบเดิม (หักจากตารางหลัก)
    const table = ticketType === 'regular' ? 'regular_tickets' : 'special_tickets';
    const stmt = db.prepare(`
      UPDATE ${table} 
      SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP 
      WHERE stadium_id = ? AND id = ? AND quantity >= ?
    `);
    const result = stmt.run(quantity, stadiumId, ticketId, quantity);
    return result.changes > 0;
  }
};

// Get ticket quantity for a specific date
export const getTicketQuantityByDate = (stadiumId, ticketId, ticketType, date) => {
  const stmt = db.prepare(`
    SELECT quantity, initial_quantity, enabled
    FROM ticket_quantities_by_date 
    WHERE stadium_id = ? AND ticket_id = ? AND ticket_type = ? AND date = ?
  `);
  const result = stmt.get(stadiumId, ticketId, ticketType, date);
  
  if (result) {
    // If ticket is disabled, return 0
    if (result.enabled === 0) {
      return 0;
    }
    return result.quantity;
  }
  
  // ถ้ายังไม่มี record ให้ดึงจากตารางหลัก
  const table = ticketType === 'regular' ? 'regular_tickets' : 'special_tickets';
  const getStmt = db.prepare(`SELECT quantity FROM ${table} WHERE stadium_id = ? AND id = ?`);
  const ticket = getStmt.get(stadiumId, ticketId);
  return ticket ? ticket.quantity : 0;
};

// Check if a ticket is enabled for a specific date
export const isTicketEnabledForDate = (stadiumId, ticketId, ticketType, date) => {
  const stmt = db.prepare(`
    SELECT enabled
    FROM ticket_quantities_by_date 
    WHERE stadium_id = ? AND ticket_id = ? AND ticket_type = ? AND date = ?
  `);
  const result = stmt.get(stadiumId, ticketId, ticketType, date);
  
  // If no override exists, ticket is enabled by default
  if (!result) {
    return true;
  }
  
  return result.enabled === 1;
};

// Get ticket price override for a specific date
export const getTicketPriceForDate = (stadiumId, ticketId, ticketType, date, defaultPrice) => {
  // First check for discount ticket
  const discountTicket = getDiscountTicketForDate(stadiumId, ticketId, ticketType, date);
  if (discountTicket) {
    return discountTicket.discount_price;
  }
  
  // Then check for price override from ticket_quantities_by_date
  const stmt = db.prepare(`
    SELECT price_override
    FROM ticket_quantities_by_date 
    WHERE stadium_id = ? AND ticket_id = ? AND ticket_type = ? AND date = ?
  `);
  const result = stmt.get(stadiumId, ticketId, ticketType, date);
  
  if (result && result.price_override !== null && result.price_override !== undefined) {
    return result.price_override;
  }
  
  return defaultPrice;
};

// Get discount information for a ticket on a specific date
export const getDiscountInfoForDate = (stadiumId, ticketId, ticketType, date, defaultPrice) => {
  const discountTicket = getDiscountTicketForDate(stadiumId, ticketId, ticketType, date);
  if (discountTicket) {
    return {
      hasDiscount: true,
      originalPrice: defaultPrice,
      discountPrice: discountTicket.discount_price,
      discountAmount: defaultPrice - discountTicket.discount_price
    };
  }
  return {
    hasDiscount: false,
    originalPrice: defaultPrice,
    discountPrice: defaultPrice,
    discountAmount: 0
  };
};

// Get ticket name override for a specific date
export const getTicketNameForDate = (stadiumId, ticketId, ticketType, date, defaultName) => {
  const stmt = db.prepare(`
    SELECT name_override
    FROM ticket_quantities_by_date 
    WHERE stadium_id = ? AND ticket_id = ? AND ticket_type = ? AND date = ?
  `);
  const result = stmt.get(stadiumId, ticketId, ticketType, date);
  
  if (result && result.name_override) {
    return result.name_override;
  }
  
  return defaultName;
};

// Reset ticket quantities for a specific date (ใช้ initial_quantity)
export const resetTicketQuantityForDate = (stadiumId, ticketId, ticketType, date) => {
  const stmt = db.prepare(`
    UPDATE ticket_quantities_by_date 
    SET quantity = initial_quantity, updated_at = CURRENT_TIMESTAMP 
    WHERE stadium_id = ? AND ticket_id = ? AND ticket_type = ? AND date = ?
  `);
  return stmt.run(stadiumId, ticketId, ticketType, date);
};

// Reset all ticket quantities for dates that have passed (รีเซ็ตตั๋วของวันที่ผ่านไปแล้ว)
export const resetExpiredTicketQuantities = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  const stmt = db.prepare(`
    UPDATE ticket_quantities_by_date 
    SET quantity = initial_quantity, updated_at = CURRENT_TIMESTAMP 
    WHERE date < ? AND quantity < initial_quantity
  `);
  const result = stmt.run(todayStr);
  return result.changes;
};

// Get tickets for a specific date with overrides
export const getTicketsForDate = (stadiumId, date) => {
  // Clean date string (remove any trailing characters like :1)
  const cleanDate = date.split(':')[0].trim();
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    throw new Error(`Invalid date format: ${date} (cleaned: ${cleanDate}). Expected YYYY-MM-DD`);
  }
  
  // Parse date string to avoid timezone issues (YYYY-MM-DD format)
  const [year, month, day] = cleanDate.split('-').map(Number);
  
  // Validate parsed date components
  if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid date components: year=${year}, month=${month}, day=${day}`);
  }
  
  const dateObj = new Date(year, month - 1, day, 12, 0, 0); // Use noon to avoid timezone issues
  const dayOfWeek = dateObj.getDay();
  
  // Get all regular tickets for this stadium
  let allRegularTickets = [];
  try {
    const regularTicketsStmt = db.prepare(`
      SELECT rt.*, 
             tqd.quantity as date_quantity,
             tqd.name_override,
             tqd.price_override,
             tqd.enabled as date_enabled,
             tqd.id as date_override_id
      FROM regular_tickets rt
      LEFT JOIN ticket_quantities_by_date tqd 
        ON rt.id = tqd.ticket_id 
        AND tqd.stadium_id = rt.stadium_id 
        AND tqd.ticket_type = 'regular' 
        AND tqd.date = ?
      WHERE rt.stadium_id = ?
    `);
    
    allRegularTickets = regularTicketsStmt.all(cleanDate, stadiumId);
  } catch (err) {
    console.error(`[getTicketsForDate] Error querying regular tickets:`, err);
    throw new Error(`Failed to query regular tickets: ${err.message}`);
  }
  
  // Filter by day of week
  const regularTickets = allRegularTickets.map(ticket => {
    // Parse days if it's a string
    let ticketDays = ticket.days;
    if (typeof ticketDays === 'string') {
      try {
        ticketDays = ticketDays ? JSON.parse(ticketDays) : null;
      } catch (e) {
        ticketDays = null;
      }
    }
    
    // Only include if days includes this day of week
    if (!ticketDays || !Array.isArray(ticketDays) || !ticketDays.includes(dayOfWeek)) {
      return null;
    }
    
    // Check for discount ticket
    const discountInfo = getDiscountInfoForDate(stadiumId, ticket.id, 'regular', cleanDate, ticket.price);
    const finalPrice = discountInfo.hasDiscount ? discountInfo.discountPrice : 
                       (ticket.price_override !== null && ticket.price_override !== undefined ? ticket.price_override : ticket.price);
    
    return {
      id: ticket.id,
      ticket_type: 'regular',
      name: ticket.name_override || ticket.name,
      price: finalPrice,
      quantity: ticket.date_quantity !== null && ticket.date_quantity !== undefined ? ticket.date_quantity : ticket.quantity,
      enabled: ticket.date_enabled !== null && ticket.date_enabled !== undefined ? ticket.date_enabled === 1 : true,
      date_override_id: ticket.date_override_id,
      original_name: ticket.name,
      original_price: ticket.price,
      original_quantity: ticket.quantity,
      discountInfo: discountInfo.hasDiscount ? {
        hasDiscount: true,
        originalPrice: discountInfo.originalPrice,
        discountPrice: discountInfo.discountPrice,
        discountAmount: discountInfo.discountAmount
      } : null
    };
  }).filter(t => t !== null);
  
  // Get special tickets for this date
  let specialTickets = [];
  try {
    const specialTicketsStmt = db.prepare(`
      SELECT st.*,
             tqd.quantity as date_quantity,
             tqd.name_override,
             tqd.price_override,
             tqd.enabled as date_enabled,
             tqd.id as date_override_id
      FROM special_tickets st
      LEFT JOIN ticket_quantities_by_date tqd 
        ON st.id = tqd.ticket_id 
        AND tqd.stadium_id = st.stadium_id 
        AND tqd.ticket_type = 'special' 
        AND tqd.date = ?
      WHERE st.stadium_id = ? AND st.date = ?
    `);
    
    const specialTicketsData = specialTicketsStmt.all(cleanDate, stadiumId, cleanDate);
    specialTickets = specialTicketsData.map(ticket => {
      // Check for discount ticket
      const discountInfo = getDiscountInfoForDate(stadiumId, ticket.id, 'special', cleanDate, ticket.price);
      const finalPrice = discountInfo.hasDiscount ? discountInfo.discountPrice : 
                         (ticket.price_override !== null && ticket.price_override !== undefined ? ticket.price_override : ticket.price);
      
      return {
        id: ticket.id,
        ticket_type: 'special',
        name: ticket.name_override || ticket.name,
        price: finalPrice,
        quantity: ticket.date_quantity !== null && ticket.date_quantity !== undefined ? ticket.date_quantity : ticket.quantity,
        enabled: ticket.date_enabled !== null && ticket.date_enabled !== undefined ? ticket.date_enabled === 1 : true,
        date_override_id: ticket.date_override_id,
        original_name: ticket.name,
        original_price: ticket.price,
        original_quantity: ticket.quantity,
        image: ticket.image,
        discountInfo: discountInfo.hasDiscount ? {
          hasDiscount: true,
          originalPrice: discountInfo.originalPrice,
          discountPrice: discountInfo.discountPrice,
          discountAmount: discountInfo.discountAmount
        } : null
      };
    });
  } catch (err) {
    console.error(`[getTicketsForDate] Error querying special tickets:`, err);
    throw new Error(`Failed to query special tickets: ${err.message}`);
  }
  
  return {
    regularTickets,
    specialTickets
  };
};

// Update ticket for a specific date (name, price, quantity, enabled)
export const updateTicketForDate = (stadiumId, ticketId, ticketType, date, updates) => {
  // Check if record exists
  const checkStmt = db.prepare(`
    SELECT id FROM ticket_quantities_by_date 
    WHERE stadium_id = ? AND ticket_id = ? AND ticket_type = ? AND date = ?
  `);
  const existing = checkStmt.get(stadiumId, ticketId, ticketType, date);
  
  if (existing) {
    // Update existing record
    const fields = [];
    const values = [];
    
    if (updates.name_override !== undefined) {
      fields.push('name_override = ?');
      values.push(updates.name_override || null);
    }
    if (updates.price_override !== undefined) {
      fields.push('price_override = ?');
      values.push(updates.price_override !== null ? updates.price_override : null);
    }
    if (updates.quantity !== undefined) {
      fields.push('quantity = ?');
      values.push(updates.quantity);
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(updates.enabled ? 1 : 0);
    }
    
    if (fields.length === 0) {
      return null;
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(stadiumId, ticketId, ticketType, date);
    
    const updateStmt = db.prepare(`
      UPDATE ticket_quantities_by_date 
      SET ${fields.join(', ')} 
      WHERE stadium_id = ? AND ticket_id = ? AND ticket_type = ? AND date = ?
    `);
    updateStmt.run(...values);
    
    // Return updated record
    const getStmt = db.prepare(`
      SELECT * FROM ticket_quantities_by_date 
      WHERE stadium_id = ? AND ticket_id = ? AND ticket_type = ? AND date = ?
    `);
    return getStmt.get(stadiumId, ticketId, ticketType, date);
  } else {
    // Create new record - need to get base ticket info first
    const table = ticketType === 'regular' ? 'regular_tickets' : 'special_tickets';
    const getTicketStmt = db.prepare(`SELECT * FROM ${table} WHERE stadium_id = ? AND id = ?`);
    const baseTicket = getTicketStmt.get(stadiumId, ticketId);
    
    if (!baseTicket) {
      return null;
    }
    
    const insertStmt = db.prepare(`
      INSERT INTO ticket_quantities_by_date 
        (stadium_id, ticket_id, ticket_type, date, quantity, initial_quantity, 
         name_override, price_override, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const quantity = updates.quantity !== undefined ? updates.quantity : baseTicket.quantity;
    const enabled = updates.enabled !== undefined ? (updates.enabled ? 1 : 0) : 1;
    
    insertStmt.run(
      stadiumId,
      ticketId,
      ticketType,
      date,
      quantity,
      baseTicket.quantity,
      updates.name_override || null,
      updates.price_override !== undefined ? updates.price_override : null,
      enabled
    );
    
    // Return created record
    const getStmt = db.prepare(`
      SELECT * FROM ticket_quantities_by_date 
      WHERE stadium_id = ? AND ticket_id = ? AND ticket_type = ? AND date = ?
    `);
    return getStmt.get(stadiumId, ticketId, ticketType, date);
  }
};

// Check if tickets are enabled for a specific date
export const areTicketsEnabledForDate = (stadiumId, date) => {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM ticket_quantities_by_date 
    WHERE stadium_id = ? AND date = ? AND enabled = 0
  `);
  const result = stmt.get(stadiumId, date);
  // If any ticket is disabled, return false
  // If no records exist or all are enabled, return true
  return result.count === 0;
};

// News Popup Images operations
export const getNewsPopupImages = () => {
  const stmt = db.prepare('SELECT * FROM news_popup_images ORDER BY display_order ASC, created_at ASC LIMIT 5');
  return stmt.all();
};

export const createNewsPopupImage = (image, displayOrder = 0) => {
  const stmt = db.prepare(`
    INSERT INTO news_popup_images (image, display_order)
    VALUES (?, ?)
  `);
  const result = stmt.run(image, displayOrder);
  const getStmt = db.prepare('SELECT * FROM news_popup_images WHERE id = ?');
  return getStmt.get(result.lastInsertRowid);
};

export const updateNewsPopupImage = (id, updates) => {
  const fields = [];
  const values = [];
  
  if (updates.image !== undefined) {
    fields.push('image = ?');
    values.push(updates.image);
  }
  if (updates.display_order !== undefined) {
    fields.push('display_order = ?');
    values.push(updates.display_order);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE news_popup_images 
    SET ${fields.join(', ')} 
    WHERE id = ?
  `);
  stmt.run(...values);
  
  const getStmt = db.prepare('SELECT * FROM news_popup_images WHERE id = ?');
  return getStmt.get(id);
};

export const deleteNewsPopupImage = (id) => {
  const stmt = db.prepare('DELETE FROM news_popup_images WHERE id = ?');
  return stmt.run(id);
};

// Booking Videos operations
export const getBookingVideos = (stadiumId) => {
  if (!stadiumId) {
    console.log('[DB] getBookingVideos: No stadiumId provided');
    return [];
  }
  const stmt = db.prepare('SELECT * FROM booking_videos WHERE stadium_id = ? AND is_active = 1 ORDER BY display_order ASC, created_at ASC');
  const videos = stmt.all(stadiumId);
  console.log(`[DB] getBookingVideos for stadium ${stadiumId}: Found ${videos.length} videos`);
  return videos;
};

export const getAllBookingVideos = (stadiumId = null) => {
  if (stadiumId) {
    const stmt = db.prepare('SELECT * FROM booking_videos WHERE stadium_id = ? ORDER BY display_order ASC, created_at ASC');
    return stmt.all(stadiumId);
  }
  const stmt = db.prepare('SELECT * FROM booking_videos ORDER BY display_order ASC, created_at ASC');
  return stmt.all();
};

export const createBookingVideo = (videoData) => {
  if (!videoData.stadium_id) {
    throw new Error('stadium_id is required');
  }
  const stmt = db.prepare(`
    INSERT INTO booking_videos (stadium_id, video_url, title, display_order, is_active)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    videoData.stadium_id,
    videoData.video_url,
    videoData.title || null,
    videoData.display_order || 0,
    videoData.is_active !== undefined ? videoData.is_active : 1
  );
  const getStmt = db.prepare('SELECT * FROM booking_videos WHERE id = ?');
  return getStmt.get(result.lastInsertRowid);
};

export const updateBookingVideo = (id, videoData) => {
  const fields = [];
  const values = [];
  
  if (videoData.stadium_id !== undefined) {
    fields.push('stadium_id = ?');
    values.push(videoData.stadium_id);
  }
  if (videoData.video_url !== undefined) {
    fields.push('video_url = ?');
    values.push(videoData.video_url);
  }
  if (videoData.title !== undefined) {
    fields.push('title = ?');
    values.push(videoData.title);
  }
  if (videoData.display_order !== undefined) {
    fields.push('display_order = ?');
    values.push(videoData.display_order);
  }
  if (videoData.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(videoData.is_active);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE booking_videos 
    SET ${fields.join(', ')} 
    WHERE id = ?
  `);
  stmt.run(...values);
  
  const getStmt = db.prepare('SELECT * FROM booking_videos WHERE id = ?');
  return getStmt.get(id);
};

export const deleteBookingVideo = (id) => {
  const stmt = db.prepare('DELETE FROM booking_videos WHERE id = ?');
  return stmt.run(id);
};

// ============================================================
// Email Verification Operations
// ============================================================

/**
 * Create email verification record
 * @param {Object} verificationData - { id, verificationId, email, bookingData, expiresAt }
 * @returns {Object} Created verification record
 */
export const createEmailVerification = (verificationData) => {
  const { id, verificationId, email, bookingData, expiresAt } = verificationData;

  if (!id || !verificationId || !email || !bookingData || !expiresAt) {
    throw new Error('Missing required fields for email verification');
  }

  const stmt = db.prepare(`
    INSERT INTO email_verifications (id, verification_id, email, booking_data, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    verificationId,
    email,
    JSON.stringify(bookingData),
    expiresAt
  );

  return getEmailVerificationById(verificationId);
};

/**
 * Get email verification by verification ID
 * @param {string} verificationId - Verification ID
 * @returns {Object|null} Verification record or null
 */
export const getEmailVerificationById = (verificationId) => {
  const stmt = db.prepare('SELECT * FROM email_verifications WHERE verification_id = ?');
  const result = stmt.get(verificationId);

  if (result) {
    // Parse booking_data JSON
    try {
      result.booking_data = JSON.parse(result.booking_data);
    } catch (e) {
      console.warn('[Database] Failed to parse booking_data JSON:', e);
      result.booking_data = null;
    }
  }

  return result || null;
};

/**
 * Check if verification has been used
 * @param {string} verificationId - Verification ID
 * @returns {boolean} True if already verified
 */
export const isVerificationUsed = (verificationId) => {
  const verification = getEmailVerificationById(verificationId);
  return verification ? verification.verified_at !== null : false;
};

/**
 * Verify email verification (mark as used)
 * @param {string} verificationId - Verification ID
 * @param {string} email - Email to verify (must match)
 * @returns {Object} Updated verification record
 * @throws {Error} If verification not found, already used, or email doesn't match
 */
export const verifyEmailVerification = (verificationId, email) => {
  const verification = getEmailVerificationById(verificationId);

  if (!verification) {
    throw new Error('Verification not found');
  }

  if (verification.verified_at !== null) {
    throw new Error('Verification already used');
  }

  if (verification.email !== email) {
    throw new Error('Email mismatch');
  }

  // Check if expired
  const now = new Date();
  const expiresAt = new Date(verification.expires_at);
  if (now > expiresAt) {
    throw new Error('Verification expired');
  }

  // Mark as verified
  const stmt = db.prepare(`
    UPDATE email_verifications
    SET verified_at = CURRENT_TIMESTAMP
    WHERE verification_id = ?
  `);

  stmt.run(verificationId);

  return getEmailVerificationById(verificationId);
};

/**
 * Delete expired verifications
 * @returns {number} Number of deleted records
 */
export const deleteExpiredVerifications = () => {
  const stmt = db.prepare(`
    DELETE FROM email_verifications
    WHERE expires_at < CURRENT_TIMESTAMP
  `);

  const result = stmt.run();
  return result.changes;
};

export default db;

