#!/usr/bin/env node
/**
 * Database Migration CLI
 * Usage:
 *   node migrate.js up      - Run pending migrations
 *   node migrate.js down    - Rollback last migration
 *   node migrate.js status  - Show migration status
 */

import path from 'path';
import { fileURLToPath } from 'url';
import MigrationManager from './migrations/migrationManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'tickets.db');

async function main() {
  const command = process.argv[2] || 'status';
  const manager = new MigrationManager(DB_PATH);

  try {
    switch (command) {
      case 'up':
        console.log('🚀 Running migrations...\n');
        await manager.runPendingMigrations();
        break;

      case 'down':
        console.log('⏪ Rolling back last migration...\n');
        await manager.rollbackLastMigration();
        break;

      case 'status':
        console.log('📊 Migration Status:\n');
        const status = await manager.getStatus();
        console.log(`Total migrations: ${status.total}`);
        console.log(`Executed: ${status.executed}`);
        console.log(`Pending: ${status.pending}\n`);
        
        if (status.migrations.length > 0) {
          console.log('Migrations:');
          status.migrations.forEach(m => {
            const icon = m.status === 'executed' ? '✅' : '⏳';
            console.log(`  ${icon} ${m.name} (${m.status})`);
          });
        }
        break;

      default:
        console.log('Usage:');
        console.log('  node migrate.js up      - Run pending migrations');
        console.log('  node migrate.js down    - Rollback last migration');
        console.log('  node migrate.js status  - Show migration status');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    manager.close();
  }
}

main();

