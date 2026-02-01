import { Request, Response } from 'express';
import prisma from '../db/client';

export async function listIncidents(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Number(req.query.pageSize) || 15);
  const monitorId = req.query.monitorId ? Number(req.query.monitorId) : undefined;
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'No user' });

  const whereClauses: string[] = [];
  const params: any[] = [];
  if (monitorId) {
    whereClauses.push('monitor_id = ?');
    params.push(monitorId);
  }

  // If not admin, restrict to assigned monitors via user_monitor table
  if (user.role !== 'ADMIN') {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS user_monitor (
        user_id INTEGER NOT NULL,
        monitor_id INTEGER NOT NULL,
        PRIMARY KEY (user_id, monitor_id)
      );
    `);
    whereClauses.push('monitor_id IN (SELECT monitor_id FROM user_monitor WHERE user_id = ?)');
    params.push(user.id);
  }

  const whereSql = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';
  // Build a Prisma where object instead of raw SQL to avoid column name issues
  const where: any = {};
  if (monitorId) where.monitorId = monitorId;

  if (user.role !== 'ADMIN') {
    // load assigned monitor ids from UserMonitor model (explicit model)
  const assigned: any[] = await (prisma as any)['userMonitor'].findMany({ where: { userId: user.id }, select: { monitorId: true } });
  const assignedIds = assigned.map((a: any) => a.monitorId);
    if (assignedIds.length === 0) {
      return res.json({ page, pageSize, total: 0, items: [] });
    }
    // if monitorId filter present, ensure it intersects
    if (where.monitorId) {
      if (!assignedIds.includes(where.monitorId)) return res.json({ page, pageSize, total: 0, items: [] });
    } else {
      where.monitorId = { in: assignedIds };
    }
  }

  const total = await prisma.incident.count({ where });

  const items = await prisma.incident.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    take: pageSize,
    skip: (page - 1) * pageSize,
    include: { 
      monitor: {
        include: {
          checks: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    },
  });

  res.json({ page, pageSize, total, items });
}

export default { listIncidents };
