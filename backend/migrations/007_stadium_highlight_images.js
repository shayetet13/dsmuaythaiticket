/**
 * Migration 007: Stadium Highlight Images
 * Creates stadium_highlight_images table for per-stadium image-only highlights (unlimited)
 */

export const up = (db) => {
  console.log('Running migration 007: Stadium Highlight Images');

  db.exec(`
    CREATE TABLE IF NOT EXISTS stadium_highlight_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stadium_id TEXT NOT NULL,
      image TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stadium_id) REFERENCES stadiums(id)
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_stadium_highlight_images_stadium ON stadium_highlight_images(stadium_id)`);

  console.log('Migration 007: Stadium Highlight Images completed successfully');
};

export const down = (db) => {
  console.log('Rolling back migration 007: Stadium Highlight Images');

  db.exec('DROP TABLE IF EXISTS stadium_highlight_images');

  console.log('Migration 007: Rollback completed');
};
