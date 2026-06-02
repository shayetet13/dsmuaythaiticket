export function up(db) {
  // Create payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER,
      order_no TEXT,
      reference_no TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      qr_code_image TEXT,
      expire_date TEXT,
      order_datetime TEXT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      product_detail TEXT,
      merchant_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    )
  `);

  // Create index for faster lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payments_reference_no ON payments(reference_no);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
  `);

  // Check if payment_id column already exists in bookings table
  const tableInfo = db.prepare("PRAGMA table_info(bookings)").all();
  const hasPaymentId = tableInfo.some(col => col.name === 'payment_id');

  if (!hasPaymentId) {
    // Add payment_id column to bookings table
    db.exec(`
      ALTER TABLE bookings ADD COLUMN payment_id INTEGER REFERENCES payments(id);
    `);
  }

  console.log('Migration 002_payments_schema: UP completed');
}

export function down(db) {
  db.exec(`DROP TABLE IF EXISTS payments`);
  console.log('Migration 002_payments_schema: DOWN completed');
}

