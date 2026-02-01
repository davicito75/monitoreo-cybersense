// Direct SQL insertion - no Prisma, no TypeScript complexity
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./server/prisma/dev.db', (err) => {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }
});

const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);

db.run(
  'INSERT OR REPLACE INTO user (email, passwordHash, role) VALUES (?, ?, ?)',
  ['admin@local', hash, 'ADMIN'],
  function(err) {
    if (err) {
      console.error('Insert error:', err);
      db.close();
      process.exit(1);
    }
    console.log('✅ User inserted');
    
    // Verify
    db.get('SELECT email, role FROM user WHERE email = ?', ['admin@local'], (err, row) => {
      if (err) {
        console.error('Query error:', err);
      } else {
        console.log('✅ Verification - User exists:', row);
      }
      db.close();
    });
  }
);
