/**
 * Migration 005: Email Verifications
 * Creates email_verifications table for email verification system
 */

export const up = (db) => {
  console.log('Running migration 005: Email Verifications');

  try {
    // Check if table already exists
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='email_verifications'").get();
    
    if (!tableInfo) {
      // Create email_verifications table
      db.exec(`
        CREATE TABLE email_verifications (
          id TEXT PRIMARY KEY,
          verification_id TEXT UNIQUE NOT NULL,
          email TEXT NOT NULL,
          booking_data TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          verified_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Created email_verifications table');
    } else {
      console.log('email_verifications table already exists, skipping creation');
    }

    // Create index on verification_id for faster lookups
    try {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_email_verifications_verification_id ON email_verifications(verification_id)`);
      console.log('Created index on verification_id');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.warn('Warning creating index:', err.message);
      }
    }

    // Create index on email for rate limiting lookups
    try {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email)`);
      console.log('Created index on email');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.warn('Warning creating index:', err.message);
      }
    }

    // Create index on expires_at for cleanup queries
    try {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at)`);
      console.log('Created index on expires_at');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.warn('Warning creating index:', err.message);
      }
    }

  } catch (err) {
    console.error('Error in migration 005:', err);
    throw err;
  }

  console.log('Migration 005: Email Verifications completed successfully');
};

export const down = (db) => {
  console.log('Rolling back migration 005: Email Verifications');

  try {
    // Drop indexes first
    try {
      db.exec(`DROP INDEX IF EXISTS idx_email_verifications_verification_id`);
      db.exec(`DROP INDEX IF EXISTS idx_email_verifications_email`);
      db.exec(`DROP INDEX IF EXISTS idx_email_verifications_expires_at`);
      console.log('Dropped indexes');
    } catch (err) {
      console.warn('Warning dropping indexes:', err.message);
    }

    // Drop table
    db.exec(`DROP TABLE IF EXISTS email_verifications`);
    console.log('Dropped email_verifications table');

  } catch (err) {
    console.error('Error rolling back migration 005:', err);
    throw err;
  }

  console.log('Migration 005: Rollback completed');
};
