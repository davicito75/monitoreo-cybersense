import prisma from '../src/db/client';
const bcrypt = require('bcryptjs');

async function recreateAdmin() {
  try {
    // Delete existing admin
    await prisma.user.deleteMany({ where: { email: 'admin@local' } });
    console.log('Deleted existing admin user');

    // Create new admin
    const password = 'Admin123!';
    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: 'admin@local',
        passwordHash: hash,
        role: 'ADMIN',
      }
    });

    console.log('Created admin user:', user.email);
    console.log('Password: Admin123!');
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

recreateAdmin();
