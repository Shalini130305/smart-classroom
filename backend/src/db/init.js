require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getDb } = require('../config/db');

async function initDatabase() {
  try {
    console.log('🔄 Initializing SQLite database...');
    const db = await getDb();
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // SQLite node driver exec() handles multiple statements separated by semicolons
    await db.exec(schema);
    
    console.log('✅ Database schema created successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  } finally {
    process.exit(0);
  }
}

initDatabase();
