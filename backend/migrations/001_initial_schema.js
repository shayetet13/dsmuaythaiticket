/**
 * Migration 001: Initial Schema
 * Creates all base tables for the Muay Thai Ticket system
 */

export const up = (db) => {
  console.log('Running migration 001: Initial Schema');

  // Bookings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      stadium TEXT NOT NULL,
      date TEXT NOT NULL,
      zone TEXT,
      ticket_id TEXT,
      ticket_type TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      payment_start_time TEXT,
      payment_time TEXT,
      payment_slip TEXT,
      payment_date_time TEXT,
      time_diff TEXT,
      created_at TEXT NOT NULL,
      status TEXT DEFAULT 'pending'
    )
  `);

  // Regular tickets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS regular_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stadium_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      match_id TEXT,
      match_name TEXT,
      days TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Special tickets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS special_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stadium_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      date TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Hero image table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hero_image (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      image TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Highlights table
  db.exec(`
    CREATE TABLE IF NOT EXISTS highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      image TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Stadiums extended table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stadiums_extended (
      id TEXT PRIMARY KEY,
      schedule_days TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Stadium image schedules table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stadium_image_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stadium_id TEXT NOT NULL,
      image TEXT NOT NULL,
      days TEXT,
      name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Special matches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS special_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stadium_id TEXT NOT NULL,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      image TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Upcoming fights background table
  db.exec(`
    CREATE TABLE IF NOT EXISTS upcoming_fights_background (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      image TEXT NOT NULL,
      fallback TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // PromptPay QR table
  db.exec(`
    CREATE TABLE IF NOT EXISTS promptpay_qr (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      qr_image TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Migration 001: Initial Schema completed successfully');
};

export const down = (db) => {
  console.log('Rolling back migration 001: Initial Schema');

  db.exec('DROP TABLE IF EXISTS bookings');
  db.exec('DROP TABLE IF EXISTS regular_tickets');
  db.exec('DROP TABLE IF EXISTS special_tickets');
  db.exec('DROP TABLE IF EXISTS hero_image');
  db.exec('DROP TABLE IF EXISTS highlights');
  db.exec('DROP TABLE IF EXISTS stadiums_extended');
  db.exec('DROP TABLE IF EXISTS stadium_image_schedules');
  db.exec('DROP TABLE IF EXISTS special_matches');
  db.exec('DROP TABLE IF EXISTS upcoming_fights_background');
  db.exec('DROP TABLE IF EXISTS promptpay_qr');

  console.log('Migration 001: Rollback completed');
};

