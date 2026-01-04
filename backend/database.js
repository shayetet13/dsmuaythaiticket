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
export const initDatabase = () => {
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stadium_id) REFERENCES stadiums(id)
    )
  `);

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

  // Create stadiums table (for reference)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stadiums (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL
    )
  `);

  // Insert default stadiums if not exists
  const insertStadium = db.prepare(`
    INSERT OR IGNORE INTO stadiums (id, name, location) 
    VALUES (?, ?, ?)
  `);
  
  insertStadium.run('rajadamnern', 'Rajadamnern Stadium', 'Bangkok');
  insertStadium.run('lumpinee', 'Lumpinee Stadium', 'Bangkok');
  insertStadium.run('bangla', 'Bangla Boxing Stadium', 'Phuket');
  insertStadium.run('patong', 'Patong Stadium', 'Phuket');

  console.log('✅ Database initialized successfully');
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
  const stmt = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC');
  const bookings = stmt.all();
  return bookings.map(booking => ({
    ...booking,
    paymentVerification: booking.payment_verification ? JSON.parse(booking.payment_verification) : null
  }));
};

export const getBookingById = (id) => {
  const stmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
  const booking = stmt.get(id);
  if (booking) {
    return {
      ...booking,
      paymentVerification: booking.payment_verification ? JSON.parse(booking.payment_verification) : null
    };
  }
  return null;
};

// Regular tickets operations
export const getRegularTickets = (stadiumId) => {
  const stmt = db.prepare('SELECT * FROM regular_tickets WHERE stadium_id = ? ORDER BY created_at ASC');
  return stmt.all(stadiumId);
};

export const createRegularTicket = (stadiumId, ticket) => {
  const stmt = db.prepare(`
    INSERT INTO regular_tickets (id, stadium_id, name, price, quantity)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(ticket.id, stadiumId, ticket.name, ticket.price, ticket.quantity || 0);
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
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(stadiumId, ticketId);
  
  const stmt = db.prepare(`
    UPDATE regular_tickets 
    SET ${fields.join(', ')} 
    WHERE stadium_id = ? AND id = ?
  `);
  
  stmt.run(...values);
  
  const getStmt = db.prepare('SELECT * FROM regular_tickets WHERE stadium_id = ? AND id = ?');
  return getStmt.get(stadiumId, ticketId);
};

export const deleteRegularTicket = (stadiumId, ticketId) => {
  const stmt = db.prepare('DELETE FROM regular_tickets WHERE stadium_id = ? AND id = ?');
  return stmt.run(stadiumId, ticketId);
};

// Special tickets operations
export const getSpecialTickets = (stadiumId) => {
  const stmt = db.prepare('SELECT * FROM special_tickets WHERE stadium_id = ? ORDER BY date ASC, created_at ASC');
  return stmt.all(stadiumId);
};

export const createSpecialTicket = (stadiumId, ticket) => {
  const stmt = db.prepare(`
    INSERT INTO special_tickets (id, stadium_id, name, price, quantity, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(ticket.id, stadiumId, ticket.name, ticket.price, ticket.quantity || 0, ticket.date);
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

// Deduct ticket quantity when booking is confirmed
export const deductTicketQuantity = (stadiumId, ticketId, ticketType, quantity) => {
  const table = ticketType === 'regular' ? 'regular_tickets' : 'special_tickets';
  const stmt = db.prepare(`
    UPDATE ${table} 
    SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP 
    WHERE stadium_id = ? AND id = ? AND quantity >= ?
  `);
  const result = stmt.run(quantity, stadiumId, ticketId, quantity);
  return result.changes > 0;
};

export default db;

