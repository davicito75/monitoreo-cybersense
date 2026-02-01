// Setup complete database with all initial data
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./server/prisma/dev.db', (err) => {
  if (err) {
    console.error('DB Error:', err.message);
    process.exit(1);
  }
});

// Create admin user
const adminPassword = 'admin123';
const adminHash = bcrypt.hashSync(adminPassword, 10);

db.run(
  'INSERT INTO user (email, passwordHash, role) VALUES (?, ?, ?)',
  ['admin@local', adminHash, 'ADMIN'],
  function(err) {
    if (err) {
      console.error('❌ Error creating admin:', err.message);
      process.exit(1);
    }
    console.log('✅ Admin user created: admin@local / admin123');
    
    // Create monitors
    const monitors = [
      {
        name: 'SQL 14.183',
        type: 'MSSQL',
        urlOrHost: '172.16.14.183',
        mssqlDatabase: 'master',
        mssqlQuery: 'SELECT @@VERSION',
        intervalSec: 60,
        timeoutMs: 5000,
        expectedStatus: null
      },
      {
        name: 'Serviciosweb/Tramites',
        type: 'HTTP',
        urlOrHost: 'https://tramites.munistgo.cl',
        intervalSec: 60,
        timeoutMs: 5000,
        expectedStatus: 200
      }
    ];
    
    let monitorCount = 0;
    monitors.forEach((m, idx) => {
      db.run(
        `INSERT INTO monitor 
         (name, type, urlOrHost, mssqlDatabase, mssqlQuery, expectedStatus, intervalSec, timeoutMs, notifyOnDown, isPaused, displayOrder, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          m.name,
          m.type,
          m.urlOrHost,
          m.mssqlDatabase || null,
          m.mssqlQuery || null,
          m.expectedStatus || null,
          m.intervalSec,
          m.timeoutMs,
          1, // notifyOnDown
          0, // isPaused
          idx, // displayOrder
          new Date().toISOString()
        ],
        function(err) {
          if (err) {
            console.error(`❌ Error creating ${m.name}:`, err.message);
          } else {
            console.log(`✅ Monitor created: ${m.name}`);
            monitorCount++;
            
            if (monitorCount === monitors.length) {
              // Verify all data
              db.all('SELECT COUNT(*) as count FROM user', (err, rows) => {
                console.log(`✅ Total users: ${rows[0].count}`);
              });
              db.all('SELECT id, name, type FROM monitor ORDER BY displayOrder', (err, rows) => {
                console.log(`✅ Total monitors: ${rows.length}`);
                rows.forEach(r => console.log(`   - [${r.id}] ${r.name} (${r.type})`));
                db.close();
                process.exit(0);
              });
            }
          }
        }
      );
    });
  }
);
