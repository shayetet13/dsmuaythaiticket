/**
 * Migration 004: Daily Ticket Adjustments
 * Adds support for adjusting ticket name, price, quantity, and enabled status per date
 */

export const up = (db) => {
  console.log('Running migration 004: Daily Ticket Adjustments');

  // Add enabled, name_override, and price_override columns to ticket_quantities_by_date table
  try {
    // Check if columns already exist
    const tableInfo = db.prepare("PRAGMA table_info(ticket_quantities_by_date)").all();
    const columnNames = tableInfo.map(col => col.name);

    if (!columnNames.includes('enabled')) {
      db.exec(`ALTER TABLE ticket_quantities_by_date ADD COLUMN enabled INTEGER DEFAULT 1`);
      console.log('Added enabled column to ticket_quantities_by_date');
    }

    if (!columnNames.includes('name_override')) {
      db.exec(`ALTER TABLE ticket_quantities_by_date ADD COLUMN name_override TEXT`);
      console.log('Added name_override column to ticket_quantities_by_date');
    }

    if (!columnNames.includes('price_override')) {
      db.exec(`ALTER TABLE ticket_quantities_by_date ADD COLUMN price_override REAL`);
      console.log('Added price_override column to ticket_quantities_by_date');
    }

    // Set all existing records to enabled = 1 (true)
    db.exec(`UPDATE ticket_quantities_by_date SET enabled = 1 WHERE enabled IS NULL`);

  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.warn('Warning adding columns to ticket_quantities_by_date:', err.message);
      throw err;
    }
  }

  console.log('Migration 004: Daily Ticket Adjustments completed successfully');
};

export const down = (db) => {
  console.log('Rolling back migration 004: Daily Ticket Adjustments');

  // Note: SQLite doesn't support DROP COLUMN directly
  // We would need to recreate the table, but that's risky with existing data
  // So we'll just log a warning
  console.warn('Rollback not fully supported - columns would need manual removal');
  console.log('Migration 004: Rollback completed (columns remain)');
};
