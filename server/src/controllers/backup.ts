import { Request, Response } from 'express';
import prisma from '../db/client';

export async function backupDatabase(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can backup' });
    }

    // Export all data (including historical data like checks, stats, incidents)
    const [users, monitors, checks, tags, monitorTags, incidents, monitorStats] = await Promise.all([
      prisma.user.findMany(),
      prisma.monitor.findMany(),
      prisma.check.findMany(),
      prisma.tag.findMany(),
      prisma.monitorTag.findMany(),
      prisma.incident.findMany(),
      prisma.monitorStats.findMany(),
    ]);

    const backup = {
      timestamp: new Date().toISOString(),
      version: '3.0',
      data: {
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
        })), // Don't export passwordHash for security
        monitors,
        checks,
        tags,
        monitorTags,
        incidents,
        monitorStats,
      }
    };

    res.json(backup);
  } catch (e: any) {
    console.error('[backup] Error:', e);
    res.status(500).json({ error: e.message });
  }
}

export async function restoreDatabase(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can restore' });
    }

    const { data } = req.body;
    if (!data || !data.users || !data.monitors || !data.checks) {
      return res.status(400).json({ error: 'Invalid backup format' });
    }

    // Delete existing data in correct order (respecting foreign keys)
    // Tables with onDelete: Cascade will be auto-deleted, but we need to handle others manually
    await prisma.monitorTag.deleteMany();          // onDelete: Cascade on monitor
    await prisma.tag.deleteMany();
    await prisma.maintenanceMonitor.deleteMany();  // onDelete: Cascade on monitor
    await prisma.incident.deleteMany();            // NO CASCADE - delete manually
    await prisma.check.deleteMany();               // NO CASCADE - delete manually  
    await prisma.userMonitor.deleteMany();         // NO CASCADE - delete manually
    await prisma.monitorStats.deleteMany();        // onDelete: Cascade on monitor
    await prisma.monitor.deleteMany();

    // Create monitors with their original IDs preserved
    const monitorMap: { [key: number]: number } = {}; // old ID -> new ID mapping
    const tagMap: { [key: number]: number } = {}; // old tag ID -> new tag ID mapping

    // Restore tags first (if present in backup)
    if (data.tags && Array.isArray(data.tags)) {
      for (const tag of data.tags) {
        const created = await prisma.tag.create({
          data: {
            name: tag.name,
            color: tag.color || '#3B82F6',
            createdAt: tag.createdAt ? new Date(tag.createdAt) : new Date(),
          },
        });
        tagMap[tag.id] = created.id;
      }
    }

    for (const monitor of data.monitors) {
      const created = await prisma.monitor.create({
        data: {
          name: monitor.name,
          type: monitor.type,
          urlOrHost: monitor.urlOrHost,
          port: monitor.port,
          intervalSec: monitor.intervalSec,
          retries: monitor.retries,
          timeoutMs: monitor.timeoutMs,
          expectedStatus: monitor.expectedStatus,
          contentRegex: monitor.contentRegex,
          notifyOnDown: monitor.notifyOnDown,
          isPaused: monitor.isPaused,
          mssqlUsername: monitor.mssqlUsername,
          mssqlPassword: monitor.mssqlPassword,
          mssqlDatabase: monitor.mssqlDatabase,
          mssqlQuery: monitor.mssqlQuery,
          sslCertExpiry: monitor.sslCertExpiry ? new Date(monitor.sslCertExpiry) : null,
          sslDaysUntilExpiry: monitor.sslDaysUntilExpiry,
          sslIssuer: monitor.sslIssuer,
          sslValid: monitor.sslValid,
        },
      });
      // Map old ID to new ID
      monitorMap[monitor.id] = created.id;
    }

    // Restore monitor tags (if present in backup)
    if (data.monitorTags && Array.isArray(data.monitorTags)) {
      for (const monitorTag of data.monitorTags) {
        const newMonitorId = monitorMap[monitorTag.monitorId];
        const newTagId = tagMap[monitorTag.tagId];

        if (!newMonitorId) {
          console.warn(`[restore] Skipping monitorTag for monitor ${monitorTag.monitorId} - monitor not restored`);
          continue;
        }

        if (!newTagId) {
          console.warn(`[restore] Skipping monitorTag for tag ${monitorTag.tagId} - tag not restored`);
          continue;
        }

        await prisma.monitorTag.create({
          data: {
            monitorId: newMonitorId,
            tagId: newTagId,
            createdAt: monitorTag.createdAt ? new Date(monitorTag.createdAt) : new Date(),
          },
        });
      }
    }

    // Restore checks with mapped monitor IDs
    for (const check of data.checks) {
      const newMonitorId = monitorMap[check.monitorId];
      if (!newMonitorId) {
        console.warn(`[restore] Skipping check for monitor ${check.monitorId} - monitor not restored`);
        continue;
      }

      const checkData: any = {
        monitorId: newMonitorId, // Use mapped ID
        status: check.status,
        createdAt: check.createdAt ? new Date(check.createdAt) : new Date(),
      };

      // Only add optional fields if they exist
      if (check.latencyMs !== undefined && check.latencyMs !== null) checkData.latencyMs = check.latencyMs;
      if (check.error !== undefined && check.error !== null) checkData.error = check.error;
      // Note: SSL fields are on Monitor, not Check model

      await prisma.check.create({ data: checkData });
    }

    // Restore incidents (if present in backup)
    let incidentsRestored = 0;
    if (data.incidents && Array.isArray(data.incidents)) {
      for (const incident of data.incidents) {
        const newMonitorId = monitorMap[incident.monitorId];
        if (!newMonitorId) {
          console.warn(`[restore] Skipping incident for monitor ${incident.monitorId}`);
          continue;
        }

        await prisma.incident.create({
          data: {
            monitorId: newMonitorId,
            startedAt: incident.startedAt ? new Date(incident.startedAt) : new Date(),
            endedAt: incident.endedAt ? new Date(incident.endedAt) : null,
            status: incident.status,
          },
        });
        incidentsRestored++;
      }
    }

    // Restore monitor stats (if present in backup)
    let statsRestored = 0;
    if (data.monitorStats && Array.isArray(data.monitorStats)) {
      for (const stat of data.monitorStats) {
        const newMonitorId = monitorMap[stat.monitorId];
        if (!newMonitorId) {
          console.warn(`[restore] Skipping stats for monitor ${stat.monitorId}`);
          continue;
        }

        await prisma.monitorStats.create({
          data: {
            monitorId: newMonitorId,
            date: stat.date ? new Date(stat.date) : new Date(),
            avgLatencyMs: stat.avgLatencyMs,
            minLatencyMs: stat.minLatencyMs,
            maxLatencyMs: stat.maxLatencyMs,
            upCount: stat.upCount || 0,
            downCount: stat.downCount || 0,
            totalChecks: stat.totalChecks || 0,
            uptime: stat.uptime || 0.0,
            updatedAt: stat.updatedAt ? new Date(stat.updatedAt) : new Date(),
          },
        });
        statsRestored++;
      }
    }

    res.json({
      message: 'Restore successful',
      restored: {
        monitors: data.monitors.length,
        checks: data.checks.length,
        tags: (data.tags || []).length,
        monitorTags: (data.monitorTags || []).length,
        incidents: incidentsRestored,
        monitorStats: statsRestored,
      }
    });
  } catch (e: any) {
    console.error('[restore] Error:', e);
    res.status(500).json({ error: e.message });
  }
}
