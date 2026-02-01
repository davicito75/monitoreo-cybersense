import { Request, Response } from 'express';
import prisma from '../db/client';

export async function createLog(req: Request, res: Response) {
  const { message, details, userId } = req.body || {};

  // Ensure table exists (simple sqlite)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS client_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      message TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    await prisma.$executeRawUnsafe('INSERT INTO client_log (user_id, message, details) VALUES (?, ?, ?);', userId || null, message || '', details ? JSON.stringify(details) : null);
  } catch (e) {
    console.error('Failed to insert client log', e);
  }

  console.log('Client log:', { userId, message, details });
  res.json({ ok: true });
}

export default { createLog };
