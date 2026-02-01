import { PrismaClient } from '@prisma/client';
// @ts-ignore
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const password = 'Admin123!';
  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email: 'admin@local' } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: 'admin@local',
        passwordHash: hash,
        role: 'ADMIN'
      }
    });
    console.log('Seeded admin@local');
  } else {
    console.log('Admin exists');
  }

  // sample monitor
  const m = await prisma.monitor.create({
    data: {
      name: 'Example HTTP',
      type: 'HTTP',
      urlOrHost: 'https://example.com',
      intervalSec: 60,
      timeoutMs: 5000,
      expectedStatus: 200
    }
  });
  console.log('Created sample monitor', m.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
