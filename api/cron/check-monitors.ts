import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../server/src/db/client';
import { executeCheck } from '../../server/src/services/checks';
import pLimit from 'p-limit';

/**
 * Vercel Cron Job endpoint
 * Executes checks for all active monitors
 * 
 * Configured in vercel.json to run every minute
 * Protected with CRON_SECRET environment variable
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.authorization;
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
        console.error('[CRON] CRON_SECRET not configured');
        return res.status(500).json({ error: 'Cron not configured' });
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
        console.error('[CRON] Unauthorized access attempt');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const startTime = Date.now();
    console.log('[CRON] Starting monitor checks...');

    try {
        // Get all active monitors
        const monitors = await prisma.monitor.findMany({
            where: {
                active: true,
                paused: false
            },
            include: {
                tags: true
            }
        });

        if (monitors.length === 0) {
            console.log('[CRON] No active monitors found');
            return res.status(200).json({
                success: true,
                monitorsChecked: 0,
                duration: Date.now() - startTime
            });
        }

        console.log(`[CRON] Found ${monitors.length} active monitors`);

        // Limit concurrency to avoid overwhelming the database and external services
        const limit = pLimit(10);

        // Execute checks in parallel with concurrency limit
        const checkPromises = monitors.map(monitor =>
            limit(async () => {
                try {
                    await executeCheck(monitor);
                    return { id: monitor.id, success: true };
                } catch (error) {
                    console.error(`[CRON] Error checking monitor ${monitor.id}:`, error);
                    return { id: monitor.id, success: false, error: String(error) };
                }
            })
        );

        const results = await Promise.all(checkPromises);
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        const duration = Date.now() - startTime;
        console.log(`[CRON] Completed: ${successCount} success, ${failCount} failed, ${duration}ms`);

        // Warn if approaching Vercel's 10s timeout
        if (duration > 8000) {
            console.warn(`[CRON] WARNING: Execution took ${duration}ms (close to 10s timeout)`);
        }

        return res.status(200).json({
            success: true,
            monitorsChecked: monitors.length,
            successCount,
            failCount,
            duration
        });

    } catch (error) {
        console.error('[CRON] Fatal error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: String(error)
        });
    }
}
