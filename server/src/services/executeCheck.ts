import prisma from '../db/client';
import { httpCheck, tcpCheck, dnsCheck, pingCheck, mssqlCheck } from './checks';
import { checkMaintenanceStatus } from '../controllers/maintenance';
import notifications from '../notifications/webpush';
import pushbulletBroadcast from '../notifications/pushbulletBroadcast';

/**
 * Execute a check for a single monitor
 * This function is used by both the traditional scheduler and Vercel Cron
 */
export async function executeCheck(m: any) {
    if (m.isPaused || m.paused) return;

    // Check if monitor is in maintenance window
    const inMaintenance = await checkMaintenanceStatus(m.id);
    if (inMaintenance) return;

    let res: any = { status: 'DOWN', error: 'unknown' };
    try {
        const t = (m.type || '').toString().toLowerCase();
        if (t === 'http') {
            res = await httpCheck(m.urlOrHost, m.timeoutMs, m.expectedStatus, m.contentRegex);
        } else if (t === 'tcp') {
            res = await tcpCheck(m.urlOrHost, m.port || 80, m.timeoutMs);
        } else if (t === 'dns') {
            res = await dnsCheck(m.urlOrHost, m.timeoutMs);
        } else if (t === 'ping') {
            res = await pingCheck(m.urlOrHost, m.timeoutMs);
        } else if (t === 'mssql') {
            res = await mssqlCheck(
                m.urlOrHost,
                m.port || 1433,
                m.mssqlUsername || undefined,
                m.mssqlPassword || undefined,
                m.mssqlDatabase || undefined,
                m.mssqlQuery || undefined,
                m.timeoutMs
            );
        } else {
            // unknown type: mark as DOWN with explicit error
            res = { status: 'DOWN', error: `unknown monitor type: ${m.type}` };
        }
    } catch (e: any) {
        res = { status: 'DOWN', error: e.message };
    }

    const created = await prisma.check.create({
        data: {
            monitorId: m.id,
            status: res.status,
            latencyMs: res.latencyMs || null,
            error: res.error || null
        }
    });

    // Update SSL info if available (only for HTTP monitors)
    if (res.sslCertExpiry !== undefined) {
        try {
            await prisma.monitor.update({
                where: { id: m.id },
                data: {
                    sslCertExpiry: res.sslCertExpiry,
                    sslDaysUntilExpiry: res.sslDaysUntilExpiry,
                    sslIssuer: res.sslIssuer,
                    sslValid: res.sslValid
                }
            });
        } catch (updateError: any) {
            console.error(`Failed to update SSL info for monitor ${m.id}:`, updateError.message);
        }

        // Send alert if certificate expires soon
        if (res.sslDaysUntilExpiry !== null && res.sslDaysUntilExpiry !== undefined) {
            const days = res.sslDaysUntilExpiry;
            // Alert on 30, 15, 7, 3, 1 days before expiry
            if ([30, 15, 7, 3, 1].includes(days)) {
                await pushbulletBroadcast.broadcastPushbulletNotification(
                    `⚠️ SSL Certificate Expiring Soon: ${m.name}`,
                    `The SSL certificate for "${m.name}" (${m.urlOrHost}) will expire in ${days} day(s). Issuer: ${res.sslIssuer || 'Unknown'}. Expiry: ${res.sslCertExpiry?.toLocaleDateString()}`
                );
            } else if (days <= 0) {
                await pushbulletBroadcast.broadcastPushbulletNotification(
                    `❌ SSL Certificate EXPIRED: ${m.name}`,
                    `The SSL certificate for "${m.name}" (${m.urlOrHost}) has EXPIRED. Immediate action required!`
                );
            }
        }
    }

    // check consecutive fails
    const recent = await prisma.check.findMany({
        where: { monitorId: m.id },
        orderBy: { createdAt: 'desc' },
        take: m.retries || 1
    });
    const fails = recent.filter((r: any) => r.status !== 'UP').length;

    if (fails >= (m.retries || 1)) {
        // if no open incident, create it and notify
        const open = await prisma.incident.findFirst({ where: { monitorId: m.id, endedAt: null } });
        if (!open) {
            await prisma.incident.create({
                data: {
                    monitorId: m.id,
                    startedAt: created.createdAt,
                    status: 'OPEN'
                }
            });
            if (m.notifyOnDown) {
                // Web Push notifications
                const subs = await prisma.pushSubscription.findMany();
                for (const s of subs) {
                    notifications.sendNotification(
                        s.endpoint,
                        s.p256dh,
                        s.auth,
                        { title: `${m.name} is DOWN`, body: `Monitor ${m.name} reported DOWN` }
                    );
                }
                // Pushbullet notifications to all users with tokens
                await pushbulletBroadcast.broadcastPushbulletNotification(
                    `🔴 ${m.name} is DOWN`,
                    `Monitor "${m.name}" (${m.urlOrHost}) is currently DOWN. Error: ${res.error || 'Unknown'}`
                );
            }
        }
    } else {
        // if we have an open incident and now enough UPs, close it
        const open = await prisma.incident.findFirst({ where: { monitorId: m.id, endedAt: null } });
        if (open && res.status === 'UP') {
            await prisma.incident.update({
                where: { id: open.id },
                data: { endedAt: created.createdAt, status: 'RESOLVED' }
            });
            // Web Push notifications
            const subs = await prisma.pushSubscription.findMany();
            for (const s of subs) {
                notifications.sendNotification(
                    s.endpoint,
                    s.p256dh,
                    s.auth,
                    { title: `${m.name} is UP`, body: `Monitor ${m.name} recovered` }
                );
            }
            // Pushbullet notifications to all users with tokens
            await pushbulletBroadcast.broadcastPushbulletNotification(
                `✅ ${m.name} is UP`,
                `Monitor "${m.name}" (${m.urlOrHost}) has recovered and is now UP. Latency: ${res.latencyMs || 'N/A'}ms`
            );
        }
    }

    return created;
}
