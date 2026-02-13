import Database from 'better-sqlite3';

const db = new Database('./tickets.db');

console.log('=== DATABASE INSPECTION ===\n');

// Check if payments table exists
try {
  const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='payments'").get();
  
  if (tableInfo) {
    console.log('✅ payments table EXISTS\n');
    
    // Get table schema
    console.log('📋 Table Schema:');
    const schema = db.prepare("PRAGMA table_info(payments)").all();
    schema.forEach(col => {
      console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Count records
    const count = db.prepare("SELECT COUNT(*) as count FROM payments").get();
    console.log(`\n📊 Total records: ${count.count}`);
    
    // Show recent records
    if (count.count > 0) {
      console.log('\n📝 Recent 5 payments:');
      const payments = db.prepare("SELECT id, reference_no, customer_name, amount, status, created_at FROM payments ORDER BY id DESC LIMIT 5").all();
      payments.forEach(p => {
        console.log(`  [${p.id}] ${p.reference_no} - ${p.customer_name} - ฿${p.amount} - ${p.status} - ${p.created_at || 'N/A'}`);
      });
    } else {
      console.log('\n⚠️  No payment records found in database!');
    }
    
  } else {
    console.log('❌ payments table DOES NOT EXIST!');
    console.log('\n💡 Need to run migrations:');
    console.log('   npm run migrate');
  }
  
} catch (error) {
  console.error('❌ Error checking database:', error.message);
}

// List all tables
console.log('\n📚 All tables in database:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach(t => {
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${t.name}`).get();
  console.log(`  - ${t.name} (${count.count} records)`);
});

db.close();
console.log('\n✅ Database check complete!');

