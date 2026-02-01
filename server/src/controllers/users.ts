import { Request, Response } from 'express';
import prisma from '../db/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export async function listUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, createdAt: true } });
  res.json(users);
}

export async function assignMonitors(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { monitorIds } = req.body;
  if (!Array.isArray(monitorIds)) return res.status(400).json({ error: 'monitorIds must be an array' });
  // Validate monitorIds exist
  const uniqueIds = Array.from(new Set(monitorIds.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n))));
  if (uniqueIds.length === 0) {
    // allow empty assignment (clears all)
  } else {
    const existing = await prisma.monitor.findMany({ where: { id: { in: uniqueIds } }, select: { id: true } });
    const existingIds = new Set(existing.map((m: any) => m.id));
    const missing = uniqueIds.filter((n: number) => !existingIds.has(n));
    if (missing.length > 0) {
      // Log warning and persist an admin action log for auditing
      const adminUser = (req as any).user;
      console.warn(`assignMonitors: attempted to assign missing monitorIds to user ${id}:`, missing);

      // Ensure audit table exists
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS admin_action_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          admin_user_id INTEGER,
          target_user_id INTEGER,
          action TEXT,
          details TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      try {
        await prisma.$executeRawUnsafe(
          'INSERT INTO admin_action_log (admin_user_id, target_user_id, action, details) VALUES (?, ?, ?, ?);',
          adminUser?.id || null,
          id,
          'assignMonitors_invalid_ids',
          JSON.stringify({ missing })
        );
      } catch (e) {
        console.error('Failed to write admin_action_log', e);
      }

      return res.status(400).json({ error: 'Some monitorIds do not exist', missing });
    }
  }

  // Ensure user_monitor table exists (simple raw SQL, SQLite syntax)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS user_monitor (
      user_id INTEGER NOT NULL,
      monitor_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, monitor_id)
    );
  `);

  // Replace assignments in a transaction: delete existing and insert new
  await prisma.$transaction(async (tx: any) => {
    await tx.$executeRawUnsafe('DELETE FROM user_monitor WHERE user_id = ?;', id);
    for (const mid of uniqueIds) {
      await tx.$executeRawUnsafe('INSERT OR IGNORE INTO user_monitor (user_id, monitor_id) VALUES (?, ?);', id, mid);
    }
  });

  res.json({ ok: true });
}

export async function getAssignedMonitors(req: Request, res: Response) {
  const id = Number(req.params.id);
  // Ensure table exists (for backwards compatibility)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS user_monitor (
      user_id INTEGER NOT NULL,
      monitor_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, monitor_id)
    );
  `);
  const rows: any[] = await prisma.$queryRawUnsafe('SELECT monitor_id FROM user_monitor WHERE user_id = ?;', id);
  res.json(rows.map((r) => r.monitor_id));
}

export async function createUser(req: Request, res: Response) {
  const schema = z.object({ email: z.string().email(), password: z.string().min(8), role: z.enum(['ADMIN', 'READ_ONLY']).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid', details: parsed.error.issues });
  const { email, password, role } = parsed.data;
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash: hash, role: role || 'READ_ONLY' } });
  res.json({ id: user.id, email: user.email, role: user.role });
}

export async function updateUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const schema = z.object({ email: z.string().email().optional(), password: z.string().min(8).optional(), role: z.enum(['ADMIN', 'READ_ONLY']).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid', details: parsed.error.issues });
  const { email, password, role } = parsed.data;
  const data: any = {};
  if (email) data.email = email;
  if (role) data.role = role;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.update({ where: { id }, data });
  res.json({ id: user.id, email: user.email, role: user.role });
}

export async function deleteUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  
  // Protect admin@local account from deletion
  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.email === 'admin@local') {
    return res.status(403).json({ error: 'Cannot delete admin@local account' });
  }
  
  await prisma.user.delete({ where: { id } });
  res.json({ ok: true });
}
