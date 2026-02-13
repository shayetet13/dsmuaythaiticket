/**
 * Migration 003: Payment Images and Special Ticket Images
 * Adds support for multiple payment images with day assignments
 * Adds image support to special tickets
 */

export const up = (db) => {
  console.log('Running migration 003: Payment Images and Special Ticket Images');

  // Create stadium_payment_images table for multiple payment images with day assignments
  db.exec(`
    CREATE TABLE IF NOT EXISTS stadium_payment_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stadium_id TEXT NOT NULL,
      image TEXT NOT NULL,
      days TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stadium_id) REFERENCES stadiums(id)
    )
  `);

  // Add image column to special_tickets table if it doesn't exist
  try {
    db.exec(`ALTER TABLE special_tickets ADD COLUMN image TEXT`);
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding image column to special_tickets:', err.message);
    }
  }

  // Migrate existing payment_image from stadiums table to stadium_payment_images
  // Only if payment_image exists and is not null
  try {
    // Check if stadiums table has payment_image column
    const tableInfo = db.prepare("PRAGMA table_info(stadiums)").all();
    const hasPaymentImageColumn = tableInfo.some(col => col.name === 'payment_image');
    
    if (hasPaymentImageColumn) {
      const stadiumsWithPaymentImage = db.prepare(`
        SELECT id, payment_image 
        FROM stadiums 
        WHERE payment_image IS NOT NULL AND payment_image != ''
      `).all();

      if (stadiumsWithPaymentImage.length > 0) {
        const insertStmt = db.prepare(`
          INSERT INTO stadium_payment_images (stadium_id, image, days)
          VALUES (?, ?, ?)
        `);

        // Get schedule_days for each stadium
        for (const stadium of stadiumsWithPaymentImage) {
          try {
            const extended = db.prepare(`
              SELECT schedule_days 
              FROM stadiums_extended 
              WHERE id = ?
            `).get(stadium.id);

            const scheduleDays = extended?.schedule_days 
              ? JSON.parse(extended.schedule_days) 
              : [0, 1, 2, 3, 4, 5, 6]; // Default to all days if not found

            insertStmt.run(
              stadium.id,
              stadium.payment_image,
              JSON.stringify(scheduleDays)
            );
          } catch (err) {
            console.warn(`Warning migrating payment image for stadium ${stadium.id}:`, err.message);
          }
        }

        console.log(`Migrated ${stadiumsWithPaymentImage.length} payment image(s) to new table`);
      }
    }
  } catch (err) {
    console.warn('Warning migrating payment images:', err.message);
  }

  console.log('Migration 003: Payment Images and Special Ticket Images completed successfully');
};

export const down = (db) => {
  console.log('Rolling back migration 003: Payment Images and Special Ticket Images');

  // Drop stadium_payment_images table
  db.exec('DROP TABLE IF EXISTS stadium_payment_images');

  // Note: We don't remove the image column from special_tickets as it might contain data
  // If needed, manually remove: ALTER TABLE special_tickets DROP COLUMN image;

  console.log('Migration 003: Rollback completed');
};
