/**
 * Migration 006: Stadium Highlights
 * Creates stadium_highlights table for per-stadium fight highlights selection
 */

export const up = (db) => {
  console.log('Running migration 006: Stadium Highlights');

  db.exec(`
    CREATE TABLE IF NOT EXISTS stadium_highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stadium_id TEXT NOT NULL,
      highlight_id INTEGER NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stadium_id) REFERENCES stadiums(id),
      FOREIGN KEY (highlight_id) REFERENCES highlights(id),
      UNIQUE(stadium_id, highlight_id)
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_stadium_highlights_stadium ON stadium_highlights(stadium_id)`);

  console.log('Migration 006: Stadium Highlights completed successfully');
};

export const down = (db) => {
  console.log('Rolling back migration 006: Stadium Highlights');

  db.exec('DROP TABLE IF EXISTS stadium_highlights');

  console.log('Migration 006: Rollback completed');
};
