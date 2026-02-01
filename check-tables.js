const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/prisma/dev.db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error:', err.message);
  } else if (!tables || tables.length === 0) {
    console.log('❌ No tables found!');
  } else {
    console.log('✅ Tables found:', tables.map(t => t.name).join(', '));
  }
  db.close();
});
