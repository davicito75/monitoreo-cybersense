import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  errorFormat: 'pretty',
  log: ['error', 'warn'],
});

export default prisma;
