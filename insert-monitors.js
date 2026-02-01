// Insert monitors back into the database
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/prisma/dev.db', (err) => {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }
});

const monitors = [
  {
    name: 'SQL 14.183',
    type: 'MSSQL',
    urlOrHost: '14.183',
    mssqlDatabase: 'testdb',
    intervalSec: 60,
    timeoutMs: 5000
  },
  {
    name: 'Serviciosweb/Tramites',
    type: 'HTTP',
    urlOrHost: 'https://tramites.example.com',
    expectedStatus: 200,
    intervalSec: 60,
    timeoutMs: 5000
  }
];

let count = 0;
monitors.forEach((m, idx) => {
  db.run(
    `INSERT INTO monitor 
     (name, type, urlOrHost, mssqlDatabase, expectedStatus, intervalSec, timeoutMs, notifyOnDown, isPaused, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      m.name,
      m.type,
      m.urlOrHost,
      m.mssqlDatabase || null,
      m.expectedStatus || null,
      m.intervalSec,
      m.timeoutMs,
      1,
      0,
      new Date().toISOString()
    ],
    function(err) {
      if (err) {
        console.error(`Error inserting ${m.name}:`, err);
      } else {
        console.log(`✅ Monitor created: ${m.name}`);
        count++;
        if (count === monitors.length) {
          // Verify
          db.all('SELECT id, name, type FROM monitor', (err, rows) => {
            if (err) {
              console.error('Error querying:', err);
            } else {
              console.log('✅ Total monitors:', rows.length);
              rows.forEach(r => console.log(`   - [${r.id}] ${r.name} (${r.type})`));
            }
            db.close();
          });
        }
      }
    }
  );
});
