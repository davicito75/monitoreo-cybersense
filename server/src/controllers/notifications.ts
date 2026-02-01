import { Request, Response } from 'express';
import prisma from '../db/client';

export async function getNotificationConfig(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can access' });
    }

    // Get or create default config
    let config = await prisma.notificationConfig.findFirst();
    if (!config) {
      config = await prisma.notificationConfig.create({
        data: {
          pushEnabled: true,
          notifyOnDown: true,
          notifyOnUp: true,
          notifyOnSlowResponse: true,
          notifyOnSSLExpiry: true,
          sslExpiryDays: 30,
          soundEnabled: true,
          badgeEnabled: true,
          quietHoursEnabled: false,
          pushbulletEnabled: false,
        },
      });
    }

    res.json(config);
  } catch (e: any) {
    console.error('[notifications] getConfig Error:', e);
    res.status(500).json({ error: e.message });
  }
}

export async function updateNotificationConfig(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can access' });
    }

    const {
      pushEnabled,
      notifyOnDown,
      notifyOnUp,
      notifyOnSlowResponse,
      notifyOnSSLExpiry,
      sslExpiryDays,
      soundEnabled,
      badgeEnabled,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      pushbulletEnabled,
      pushbulletToken,
    } = req.body;

    // Get existing config or create default
    let config = await prisma.notificationConfig.findFirst();
    if (!config) {
      config = await prisma.notificationConfig.create({
        data: {
          pushEnabled: pushEnabled !== undefined ? pushEnabled : true,
          notifyOnDown: notifyOnDown !== undefined ? notifyOnDown : true,
          notifyOnUp: notifyOnUp !== undefined ? notifyOnUp : true,
          notifyOnSlowResponse: notifyOnSlowResponse !== undefined ? notifyOnSlowResponse : true,
          notifyOnSSLExpiry: notifyOnSSLExpiry !== undefined ? notifyOnSSLExpiry : true,
          sslExpiryDays: sslExpiryDays || 30,
          soundEnabled: soundEnabled !== undefined ? soundEnabled : true,
          badgeEnabled: badgeEnabled !== undefined ? badgeEnabled : true,
          quietHoursEnabled: quietHoursEnabled !== undefined ? quietHoursEnabled : false,
          quietHoursStart,
          quietHoursEnd,
          pushbulletEnabled: pushbulletEnabled !== undefined ? pushbulletEnabled : false,
          pushbulletToken,
        },
      });
    } else {
      config = await prisma.notificationConfig.update({
        where: { id: config.id },
        data: {
          ...(pushEnabled !== undefined && { pushEnabled }),
          ...(notifyOnDown !== undefined && { notifyOnDown }),
          ...(notifyOnUp !== undefined && { notifyOnUp }),
          ...(notifyOnSlowResponse !== undefined && { notifyOnSlowResponse }),
          ...(notifyOnSSLExpiry !== undefined && { notifyOnSSLExpiry }),
          ...(sslExpiryDays && { sslExpiryDays }),
          ...(soundEnabled !== undefined && { soundEnabled }),
          ...(badgeEnabled !== undefined && { badgeEnabled }),
          ...(quietHoursEnabled !== undefined && { quietHoursEnabled }),
          ...(quietHoursStart && { quietHoursStart }),
          ...(quietHoursEnd && { quietHoursEnd }),
          ...(pushbulletEnabled !== undefined && { pushbulletEnabled }),
          ...(pushbulletToken && { pushbulletToken }),
        },
      });
    }

    res.json({
      message: 'Notification config updated',
      config,
    });
  } catch (e: any) {
    console.error('[notifications] updateConfig Error:', e);
    res.status(500).json({ error: e.message });
  }
}
