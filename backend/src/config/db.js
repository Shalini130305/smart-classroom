const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let dbInstance = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = await open({
      filename: path.join(__dirname, '../../database.sqlite'),
      driver: sqlite3.Database
    });
    await dbInstance.exec('PRAGMA foreign_keys = ON');
  }
  return dbInstance;
}

const poolMock = {
  connect: async () => {
    return {
      query: async (text, params) => module.exports.query(text, params),
      release: () => {},
    };
  },
  end: async () => {
    if (dbInstance) {
      await dbInstance.close();
      dbInstance = null;
    }
  }
};

module.exports = {
  query: async (text, params = []) => {
    const db = await getDb();
    
    // Convert PostgreSQL $1, $2, $3 to SQLite ?, ?, ?
    const sqliteText = text.replace(/\$\d+/g, '?');
    
    // SQLite boolean conversion for true/false parameters
    const safeParams = params.map(p => {
      if (p === true) return 1;
      if (p === false) return 0;
      return p;
    });

    try {
      if (sqliteText.trim().toUpperCase().startsWith('SELECT') || sqliteText.includes('RETURNING')) {
        const rows = await db.all(sqliteText, safeParams);
        return { rows: rows || [], rowCount: rows ? rows.length : 0 };
      } else {
        const result = await db.run(sqliteText, safeParams);
        return { rows: [], rowCount: result.changes };
      }
    } catch (err) {
      console.error('SQL Error:', err.message);
      console.error('Query:', sqliteText);
      console.error('Params:', safeParams);
      throw err;
    }
  },
  pool: poolMock,
  getDb
};
