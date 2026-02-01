import prisma from '../src/db/client';

async function setup() {
  try {
    // Check if SQL monitor exists
    const sqlMonitor = await prisma.monitor.findFirst({ where: { name: 'SQL 14.183' } });
    if (!sqlMonitor) {
      await prisma.monitor.create({
        data: {
          name: 'SQL 14.183',
          type: 'MSSQL',
          urlOrHost: '14.183',
          mssqlDatabase: 'master',
          mssqlQuery: 'SELECT @@VERSION',
          intervalSec: 60,
          timeoutMs: 5000,
          notifyOnDown: true,
          isPaused: false,
          displayOrder: 1
        }
      });
      console.log('✅ SQL 14.183 monitor created');
    } else {
      console.log('✅ SQL 14.183 monitor already exists');
    }

    // Check if Serviciosweb monitor exists
    const webMonitor = await prisma.monitor.findFirst({ where: { name: 'Serviciosweb/Tramites' } });
    if (!webMonitor) {
      await prisma.monitor.create({
        data: {
          name: 'Serviciosweb/Tramites',
          type: 'HTTP',
          urlOrHost: 'https://tramites.example.com',
          expectedStatus: 200,
          intervalSec: 60,
          timeoutMs: 5000,
          notifyOnDown: true,
          isPaused: false,
          displayOrder: 2
        }
      });
      console.log('✅ Serviciosweb/Tramites monitor created');
    } else {
      console.log('✅ Serviciosweb/Tramites monitor already exists');
    }

    // Verify
    const monitors = await prisma.monitor.findMany({ orderBy: { displayOrder: 'asc' } });
    console.log(`✅ Total monitors: ${monitors.length}`);
    monitors.forEach((m: any) => console.log(`   - [${m.id}] ${m.name} (${m.type})`));

    const users = await prisma.user.findMany();
    console.log(`✅ Total users: ${users.length}`);
    users.forEach((u: any) => console.log(`   - ${u.email} (${u.role})`));

    await prisma.$disconnect();
  } catch (e) {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

setup();
