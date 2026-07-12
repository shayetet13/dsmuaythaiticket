/**
 * Migration 008: Stadium Descriptions (คำบรรยาย)
 * Creates stadium_descriptions table for per-stadium text content with styling
 * Fields: h1, h2, h3, paragraphs (JSON), font size/family/color, background color, images (JSON)
 */

export const up = (db) => {
  console.log('Running migration 008: Stadium Descriptions');

  db.exec(`
    CREATE TABLE IF NOT EXISTS stadium_descriptions (
      stadium_id TEXT PRIMARY KEY,
      h1 TEXT,
      h2 TEXT,
      h3 TEXT,
      paragraphs TEXT,
      font_size TEXT DEFAULT '16px',
      font_family TEXT DEFAULT 'inherit',
      font_color TEXT DEFAULT '#d1d5db',
      background_color TEXT DEFAULT '#111827',
      images TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stadium_id) REFERENCES stadiums(id)
    )
  `);

  // Insert default Rajadamnern description
  const defaultDesc = db.prepare(`
    INSERT OR IGNORE INTO stadium_descriptions (
      stadium_id, h1, h2, h3, paragraphs, font_size, font_family, font_color, background_color, images
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  defaultDesc.run(
    'rajadamnern',
    'IMMERSE IN MUAY THAI LIKE NEVER BEFORE',
    "AT THE WORLD'S FIRST",
    'MUAY THAI STADIUM',
    JSON.stringify([
      "Rajadamnern Stadium is the ultimate destination to experience Muay Thai, offering a one of a kind experience that blends the sport's electrifying excitement with its rich cultural heritage, brought to life by the Muay Thai immersive experience, the largest dome projection in any stadium that will take you through a 1,000 years journey of Muay Thai like never before. It's the purest, most authentic way to experience Muay Thai. The only way to experience Muay Thai.",
      "It's where you can dive deep into Muay Thai history and cultural significance while sitting on the edge of your seat during thrilling fights and top-tier entertainment. Immerse yourself in Muay Thai at the world's first Muay Thai stadium, it's a once in a lifetime experience you can't miss."
    ]),
    '16px',
    'inherit',
    '#d1d5db',
    '#111827',
    '[]'
  );

  console.log('Migration 008: Stadium Descriptions completed successfully');
};

export const down = (db) => {
  console.log('Rolling back migration 008: Stadium Descriptions');

  db.exec('DROP TABLE IF EXISTS stadium_descriptions');

  console.log('Migration 008: Rollback completed');
};
