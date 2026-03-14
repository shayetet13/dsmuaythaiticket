/**
 * Database Migration Manager
 * Handles database schema versioning and migrations
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MigrationManager {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.migrationsPath = __dirname;
    this.initMigrationTable();
  }

  /**
   * Initialize migrations tracking table
   */
  initMigrationTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Get all executed migrations
   */
  getExecutedMigrations() {
    const rows = this.db.prepare('SELECT version FROM migrations ORDER BY version').all();
    return rows.map(row => row.version);
  }

  /**
   * Get all available migration files
   */
  async getAvailableMigrations() {
    const files = fs.readdirSync(this.migrationsPath);
    const migrationFiles = files
      .filter(file => file.endsWith('.js') && file !== 'migrationManager.js')
      .sort();

    const migrations = [];
    for (const file of migrationFiles) {
      const version = file.split('_')[0];
      const name = file.replace('.js', '');
      migrations.push({ version, name, file });
    }

    return migrations;
  }

  /**
   * Run pending migrations
   */
  async runPendingMigrations() {
    const executed = this.getExecutedMigrations();
    const available = await this.getAvailableMigrations();
    const pending = available.filter(m => !executed.includes(m.version));

    if (pending.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`📦 Found ${pending.length} pending migration(s)`);

    for (const migration of pending) {
      await this.runMigration(migration);
    }

    console.log('✅ All migrations completed successfully');
  }

  /**
   * Run a single migration
   */
  async runMigration(migration) {
    console.log(`⏳ Running migration: ${migration.name}`);

    try {
      // Import migration file
      const migrationPath = path.join(this.migrationsPath, migration.file);
      const migrationModule = await import(`file://${migrationPath}`);

      // Begin transaction
      const transaction = this.db.transaction(() => {
        // Run migration
        migrationModule.up(this.db);

        // Record migration
        this.db.prepare(`
          INSERT INTO migrations (version, name)
          VALUES (?, ?)
        `).run(migration.version, migration.name);
      });

      transaction();

      console.log(`✅ Migration ${migration.name} completed`);
    } catch (error) {
      console.error(`❌ Migration ${migration.name} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Rollback last migration
   */
  async rollbackLastMigration() {
    const executed = this.getExecutedMigrations();
    
    if (executed.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const lastVersion = executed[executed.length - 1];
    const available = await this.getAvailableMigrations();
    const migration = available.find(m => m.version === lastVersion);

    if (!migration) {
      console.error(`Migration file for version ${lastVersion} not found`);
      return;
    }

    console.log(`⏳ Rolling back migration: ${migration.name}`);

    try {
      // Import migration file
      const migrationPath = path.join(this.migrationsPath, migration.file);
      const migrationModule = await import(`file://${migrationPath}`);

      // Begin transaction
      const transaction = this.db.transaction(() => {
        // Run rollback
        migrationModule.down(this.db);

        // Remove migration record
        this.db.prepare('DELETE FROM migrations WHERE version = ?').run(lastVersion);
      });

      transaction();

      console.log(`✅ Rollback of ${migration.name} completed`);
    } catch (error) {
      console.error(`❌ Rollback of ${migration.name} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getStatus() {
    const executed = this.getExecutedMigrations();
    const available = await this.getAvailableMigrations();
    const pending = available.filter(m => !executed.includes(m.version));

    return {
      total: available.length,
      executed: executed.length,
      pending: pending.length,
      migrations: available.map(m => ({
        ...m,
        status: executed.includes(m.version) ? 'executed' : 'pending'
      }))
    };
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

export default MigrationManager;

