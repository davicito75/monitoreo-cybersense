import { Request, Response } from 'express';
import prisma from '../db/client';
import { httpCheck, tcpCheck, dnsCheck, pingCheck } from '../services/checks';
import { getMonitorPerformanceStatus } from '../services/monitorStats';
import { z } from 'zod';
import { SLA_THRESHOLDS } from '../config';

export async function listMonitors(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Number(req.query.pageSize) || 15);

  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'No user' });

  // If ADMIN, return all monitors paginated. Otherwise return only assigned monitors.
  if (user.role === 'ADMIN') {
    const [total, items] = await Promise.all([
      prisma.monitor.count(),
      prisma.monitor.findMany({
        include: { 
          checks: { take: 1, orderBy: { createdAt: 'desc' } },
          tags: { include: { tag: true } },
        },
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return res.json({ page, pageSize, total, items });
  }

  // For non-admin users, query assigned monitor IDs from user_monitor table and then paginate.
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS user_monitor (
      user_id INTEGER NOT NULL,
      monitor_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, monitor_id)
    );
  `);

  const assigned: any[] = await prisma.$queryRawUnsafe('SELECT monitor_id FROM user_monitor WHERE user_id = ? ORDER BY monitor_id DESC LIMIT ? OFFSET ?;', user.id, pageSize, (page - 1) * pageSize);
  const totalRes: any = await prisma.$queryRawUnsafe('SELECT COUNT(*) as cnt FROM user_monitor WHERE user_id = ?;', user.id);
  const total = totalRes && totalRes[0] ? Number(totalRes[0].cnt) : 0;

  const items = await prisma.monitor.findMany({
    where: { id: { in: assigned.map((r: any) => r.monitor_id) } },
    include: { 
      checks: { take: 1, orderBy: { createdAt: 'desc' } },
      tags: { include: { tag: true } },
    },
  });

  res.json({ page, pageSize, total, items });
}

export async function createMonitor(req: Request, res: Response) {
  const schema = z.object({
    name: z.string().min(1),
    type: z.enum(['http', 'tcp', 'dns', 'ping', 'mssql']).optional(),
    urlOrHost: z.string().min(1),
    port: z.number().int().positive().optional(),
    intervalSec: z.number().int().min(5).optional(),
    retries: z.number().int().min(0).optional(),
    timeoutMs: z.number().int().min(100).optional(),
    expectedStatus: z.number().int().optional(),
    contentRegex: z.string().optional(),
    notifyOnDown: z.boolean().optional(),
    isPaused: z.boolean().optional(),
    // MSSQL specific fields
    mssqlUsername: z.string().optional(),
    mssqlPassword: z.string().optional(),
    mssqlDatabase: z.string().optional(),
    mssqlQuery: z.string().optional(),
    // Tags
    tagIds: z.array(z.number()).optional(),
  });
  // Normalize type to be lowercase so clients sending 'HTTP' still validate
  const body = { ...(req.body || {}), type: req.body && req.body.type ? String(req.body.type).toLowerCase() : undefined };
  const parsed = schema.safeParse(body || {});
  if (!parsed.success) {
    console.error('[monitors] create validation failed', { body: req.body, issues: parsed.error.issues });
    return res.status(400).json({ error: 'Invalid', details: parsed.error.issues });
  }
  
  const { tagIds, ...monitorData } = parsed.data as any;
  const m = await prisma.monitor.create({ 
    data: {
      ...monitorData,
      ...(tagIds && tagIds.length > 0 && {
        tags: {
          create: tagIds.map((tagId: number) => ({ tagId })),
        },
      }),
    },
    include: { tags: { include: { tag: true } } },
  });
  
  // Run an immediate check so the UI reflects current status right after creation.
  try {
    const cfg: any = monitorData || {};
    const t = (cfg.type || 'http').toString().toLowerCase();
    let resCheck: any = { status: 'DOWN', error: 'unknown' };
    const timeoutMs = cfg.timeoutMs ?? 5000;
    if (t === 'http') {
      resCheck = await httpCheck(cfg.urlOrHost, timeoutMs, cfg.expectedStatus, cfg.contentRegex);
    } else if (t === 'tcp') {
      resCheck = await tcpCheck(cfg.urlOrHost, cfg.port || 80, timeoutMs);
    } else if (t === 'dns') {
      resCheck = await dnsCheck(cfg.urlOrHost, timeoutMs);
    } else if (t === 'ping') {
      resCheck = await pingCheck(cfg.urlOrHost, timeoutMs);
    }
    await prisma.check.create({ data: { monitorId: m.id, status: resCheck.status, latencyMs: resCheck.latencyMs || null, error: resCheck.error || null } });
  } catch (e: any) {
    console.error('[monitors] immediate check failed', e?.message || e);
  }

  // return monitor including its latest check (if created)
  const withCheck = await prisma.monitor.findUnique({ where: { id: m.id }, include: { checks: { orderBy: { createdAt: 'desc' }, take: 1 }, tags: { include: { tag: true } } } });
  res.json(withCheck || m);
}

export async function getMonitor(req: Request, res: Response) {
  const id = Number(req.params.id);
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'No user' });

  // ADMIN can access any monitor
  if (user.role !== 'ADMIN') {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS user_monitor (
        user_id INTEGER NOT NULL,
        monitor_id INTEGER NOT NULL,
        PRIMARY KEY (user_id, monitor_id)
      );
    `);
    const rows: any = await prisma.$queryRawUnsafe('SELECT 1 FROM user_monitor WHERE user_id = ? AND monitor_id = ? LIMIT 1;', user.id, id);
    if (!rows || rows.length === 0) return res.status(403).json({ error: 'Forbidden' });
  }

  const m = await prisma.monitor.findUnique({ 
    where: { id }, 
    include: { 
      checks: { orderBy: { createdAt: 'desc' }, take: 1 },
      tags: { include: { tag: true } },
    } 
  });
  if (!m) return res.status(404).json({ error: 'Not found' });
  res.json(m);
}

export async function getMonitorChecks(req: Request, res: Response) {
  const id = Number(req.params.id);
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(1000, Number(req.query.pageSize) || 15);
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'No user' });

  // ADMIN can access any monitor
  if (user.role !== 'ADMIN') {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS user_monitor (
        user_id INTEGER NOT NULL,
        monitor_id INTEGER NOT NULL,
        PRIMARY KEY (user_id, monitor_id)
      );
    `);
    const rows: any = await prisma.$queryRawUnsafe('SELECT 1 FROM user_monitor WHERE user_id = ? AND monitor_id = ? LIMIT 1;', user.id, id);
    if (!rows || rows.length === 0) return res.status(403).json({ error: 'Forbidden' });
  }

  const total = await prisma.check.count({ where: { monitorId: id } });
  const items = await prisma.check.findMany({ where: { monitorId: id }, orderBy: { createdAt: 'desc' }, take: pageSize, skip: (page - 1) * pageSize });
  res.json({ page, pageSize, total, items });
}

export async function summary(req: Request, res: Response) {
  // More accurate summary: determine status by the latest check per monitor.
  // Fetch monitors with their most recent check (take 1 ordered by createdAt desc).
  const monitors = await prisma.monitor.findMany({ include: { checks: { take: 1, orderBy: { createdAt: 'desc' } } } });

  let up = 0;
  let down = 0;
  let paused = 0;

  for (const m of monitors) {
    if (m.isPaused) {
      paused += 1;
      continue;
    }
    const last = m.checks && m.checks[0];
    if (!last) continue; // no checks yet, don't count
    if (last.status === 'UP') up += 1;
    else if (last.status === 'DOWN') down += 1;
  }

  res.json({ up, down, paused });
}

export async function uptime(req: Request, res: Response) {
  const id = Number(req.params.id);
  const days = Math.max(1, Number(req.query.days) || 30);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  // count checks for this monitor in period
  const total = await prisma.check.count({ where: { monitorId: id, createdAt: { gte: since } } });
  if (total === 0) return res.json({ uptime: null, total: 0 });
  const up = await prisma.check.count({ where: { monitorId: id, createdAt: { gte: since }, status: 'UP' } });
  const uptimePct = +(100 * (up / total)).toFixed(2);
  res.json({ uptime: uptimePct, total, days });
}

export async function slaReport(req: Request, res: Response) {
  const id = Number(req.params.id);
  const periodsParam = req.query.periods as string | undefined;
  let periods: number[] = [7, 30, 90];
  if (periodsParam) {
    const parts = periodsParam.split(',').map((p) => Number(p)).filter(Boolean);
    if (parts.length) periods = parts;
  }

  const now = Date.now();
  const results: any = {};
  for (const days of periods) {
    const since = new Date(now - days * 24 * 60 * 60 * 1000);
    const total = await prisma.check.count({ where: { monitorId: id, createdAt: { gte: since } } });
    if (total === 0) {
      results[days] = { uptime: null, total: 0, up: 0, down: 0, days };
      continue;
    }
    const up = await prisma.check.count({ where: { monitorId: id, createdAt: { gte: since }, status: 'UP' } });
    const down = total - up;
    const pct = +(100 * (up / total)).toFixed(2);
    results[days] = { uptime: pct, total, up, down, days };
  }

  res.json({ monitorId: id, report: results });
}

export async function pauseMonitor(req: Request, res: Response) {
  const id = Number(req.params.id);
  // Toggle pause state
  const current = await prisma.monitor.findUnique({ where: { id } });
  if (!current) return res.status(404).json({ error: 'Monitor not found' });
  const m = await prisma.monitor.update({ where: { id }, data: { isPaused: !current.isPaused } });
  res.json(m);
}

export async function updateMonitor(req: Request, res: Response) {
  const id = Number(req.params.id);
  const schema = z.object({
    name: z.string().min(1).optional(),
    type: z.enum(['http', 'tcp', 'dns', 'ping', 'mssql']).optional(),
    urlOrHost: z.string().min(1).optional(),
    port: z.number().int().positive().optional(),
    intervalSec: z.number().int().min(5).optional(),
    retries: z.number().int().min(0).optional(),
    timeoutMs: z.number().int().min(100).optional(),
    expectedStatus: z.number().int().optional(),
    contentRegex: z.string().optional(),
    notifyOnDown: z.boolean().optional(),
    isPaused: z.boolean().optional(),
    // MSSQL specific fields
    mssqlUsername: z.string().optional(),
    mssqlPassword: z.string().optional(),
    mssqlDatabase: z.string().optional(),
    mssqlQuery: z.string().optional(),
    // Tags
    tagIds: z.array(z.number()).optional(),
  });
  // Sanitize incoming body: only keep allowed fields, drop nulls and extras (client may send full monitor)
  const raw = req.body || {};
  const allowed = ['name', 'type', 'urlOrHost', 'port', 'intervalSec', 'retries', 'timeoutMs', 'expectedStatus', 'contentRegex', 'notifyOnDown', 'isPaused', 'mssqlUsername', 'mssqlPassword', 'mssqlDatabase', 'mssqlQuery', 'tagIds'];
  const body: any = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(raw, k)) {
      const v = (raw as any)[k];
      if (v === null || v === undefined) continue; // skip nulls (Zod optional !== null)
      body[k] = v;
    }
  }
  if (body.type) body.type = String(body.type).toLowerCase();

  const parsed = schema.safeParse(body || {});
  if (!parsed.success) {
    console.error('[monitors] update validation failed', { body: req.body, issues: parsed.error.issues });
    return res.status(400).json({ error: 'Invalid', details: parsed.error.issues });
  }

  const { tagIds, ...monitorData } = parsed.data as any;

  // Update monitor (without tags first)
  const m = await prisma.monitor.update({ 
    where: { id }, 
    data: monitorData,
    include: { tags: { include: { tag: true } } },
  });

  // Update tags separately
  if (tagIds !== undefined) {
    // Delete existing tags
    await prisma.monitorTag.deleteMany({ where: { monitorId: id } });
    
    // Create new tags if provided
    if (tagIds.length > 0) {
      for (const tagId of tagIds) {
        await prisma.monitorTag.create({
          data: { monitorId: id, tagId },
        });
      }
    }
  }

  // Fetch updated monitor with new tags
  const updated = await prisma.monitor.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });

  if (!updated) return res.status(404).json({ error: 'Monitor not found' });
  res.json(updated);
}

export async function runMonitorCheck(req: Request, res: Response) {
  const id = Number(req.params.id);
  const m = await prisma.monitor.findUnique({ where: { id } });
  if (!m) return res.status(404).json({ error: 'Not found' });
  // Simple in-memory per-monitor cooldown to avoid hammering checks from admin UI.
  // Key: monitor id, Value: timestamp of last run (ms)
  // Note: process-local only; for multi-instance deployments use Redis or similar.
  const now = Date.now();
  // Cooldown is enforced ONLY when RUN_MONITOR_COOLDOWN_SEC is defined (in seconds).
  // If the env var is not set, there will be no rate-limit (process-local).
  const cooldownSecEnv = process.env.RUN_MONITOR_COOLDOWN_SEC;
  let cooldownMs = 0;
  if (typeof cooldownSecEnv !== 'undefined') {
    const parsed = Number.parseInt(cooldownSecEnv as string, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      cooldownMs = parsed * 1000;
    } else {
      console.warn('[monitors] RUN_MONITOR_COOLDOWN_SEC is set but invalid; disabling cooldown');
      cooldownMs = 0;
    }
  }
  if (cooldownMs > 0) {
    (global as any)._monitorRunCooldown = (global as any)._monitorRunCooldown || new Map<number, number>();
    const map: Map<number, number> = (global as any)._monitorRunCooldown;
    const last = map.get(id) || 0;
    if (now - last < cooldownMs) {
      const wait = Math.ceil((cooldownMs - (now - last)) / 1000);
      return res.status(429).json({ error: 'Too many requests', retryAfterSec: wait });
    }
    map.set(id, now);
  }
  // perform check
  try {
    const t = (m.type || 'http').toString().toLowerCase();
    let resCheck: any = { status: 'DOWN', error: 'unknown' };
    const timeoutMs = (m as any).timeoutMs ?? 5000;
    if (t === 'http') {
      resCheck = await httpCheck(m.urlOrHost, timeoutMs, (m as any).expectedStatus, (m as any).contentRegex);
    } else if (t === 'tcp') {
      resCheck = await tcpCheck(m.urlOrHost, (m as any).port || 80, timeoutMs);
    } else if (t === 'dns') {
      resCheck = await dnsCheck(m.urlOrHost, timeoutMs);
    } else if (t === 'ping') {
      resCheck = await pingCheck(m.urlOrHost, timeoutMs);
    }
    await prisma.check.create({ data: { monitorId: m.id, status: resCheck.status, latencyMs: resCheck.latencyMs || null, error: resCheck.error || null } });
  } catch (e: any) {
    console.error('[monitors] runMonitorCheck failed', e?.message || e);
  }
  const withCheck = await prisma.monitor.findUnique({ where: { id: m.id }, include: { checks: { orderBy: { createdAt: 'desc' }, take: 1 } } });
  res.json(withCheck || m);
}

export async function deleteMonitor(req: Request, res: Response) {
  const id = Number(req.params.id);
  // Delete dependent records (checks, incidents) first to avoid foreign key constraint errors.
  // Use a transaction to ensure atomicity.
  await prisma.$transaction([
    prisma.check.deleteMany({ where: { monitorId: id } }),
    prisma.monitorStats.deleteMany({ where: { monitorId: id } }),
    prisma.incident.deleteMany({ where: { monitorId: id } }),
    prisma.monitor.delete({ where: { id } }),
  ]);

  res.json({ ok: true });
}

export async function getPerformanceStatus(req: Request, res: Response) {
  const id = Number(req.params.id);
  
  try {
    const performanceStatus = await getMonitorPerformanceStatus(id);
    res.json(performanceStatus);
  } catch (error) {
    console.error('Error getting performance status:', error);
    res.status(500).json({ error: 'Failed to get performance status' });
  }
}
export async function reorderMonitors(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { monitors } = req.body;
    
    if (!Array.isArray(monitors)) {
      return res.status(400).json({ error: 'monitors must be an array' });
    }

    // Update displayOrder for each monitor
    const updates = monitors.map((m, index) => 
      prisma.monitor.update({
        where: { id: m.id },
        data: { displayOrder: index },
      })
    );

    await Promise.all(updates);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error reordering monitors:', error);
    res.status(500).json({ error: 'Failed to reorder monitors' });
  }
}

/**
 * Simulate a DOWN check for testing notifications
 */
export async function testSimulateDown(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { id } = req.params;
    const monitorId = Number(id);

    if (!monitorId) {
      return res.status(400).json({ error: 'Invalid monitor ID' });
    }

    console.log(`\n[TEST-DOWN] 🧪 Starting test DOWN simulation for monitor ID: ${monitorId}`);

    // Get the monitor
    const monitor = await prisma.monitor.findUnique({
      where: { id: monitorId },
      include: { 
        tags: { include: { tag: true } },
      }
    });

    if (!monitor) {
      console.log(`[TEST-DOWN] ❌ Monitor not found: ${monitorId}`);
      return res.status(404).json({ error: 'Monitor not found' });
    }

    console.log(`[TEST-DOWN] ✓ Found monitor: "${monitor.name}" (${monitor.urlOrHost})`);

    // Create a fake DOWN check
    const check = await prisma.check.create({
      data: {
        monitorId: monitorId,
        status: 'DOWN',
        latencyMs: null,
        error: '[TEST] Simulated DOWN check for notification testing',
      },
    });

    console.log(`[TEST-DOWN] ✓ Created test CHECK with status: DOWN`);

    // Create incident if not already open
    const openIncident = await prisma.incident.findFirst({
      where: { monitorId: monitorId, endedAt: null }
    });

    if (!openIncident) {
      const newIncident = await prisma.incident.create({
        data: {
          monitorId: monitorId,
          startedAt: check.createdAt,
          status: 'OPEN',
        },
      });
      console.log(`[TEST-DOWN] ✓ Created new INCIDENT (ID: ${newIncident.id})`);
    } else {
      console.log(`[TEST-DOWN] ℹ️ Incident already open (ID: ${openIncident.id})`);
    }

    // Import notification modules to send test notifications
    const notifications = await import('../notifications/webpush');
    const pushbulletBroadcast = await import('../notifications/pushbulletBroadcast');

    console.log(`[TEST-DOWN] 📨 Sending notifications...`);

    // Send Web Push notifications
    const subs = await prisma.pushSubscription.findMany();
    console.log(`[TEST-DOWN] 📱 Found ${subs.length} Web Push subscriptions`);
    for (const s of subs) {
      notifications.default.sendNotification(
        s.endpoint,
        s.p256dh,
        s.auth,
        {
          title: `[TEST] ${monitor.name} is DOWN`,
          body: `[TEST] Simulated DOWN check - Monitor ${monitor.name} reported DOWN`,
        }
      );
    }

    // Send Pushbullet notifications
    console.log(`[TEST-DOWN] 🔔 Sending Pushbullet notifications...`);
    await pushbulletBroadcast.default.broadcastPushbulletNotification(
      `[TEST] 🔴 ${monitor.name} is DOWN`,
      `[TEST] Simulated DOWN check - Monitor "${monitor.name}" (${monitor.urlOrHost}) is currently DOWN.`
    );
    console.log(`[TEST-DOWN] ✅ Test DOWN complete!\n`);

    res.json({
      ok: true,
      message: 'Test DOWN check created. Notifications sent.',
      check,
    });
  } catch (error: any) {
    console.error(`[TEST-DOWN] ❌ Error: ${error.message}\n`, error);
    res.status(500).json({ error: error.message });
  }
}