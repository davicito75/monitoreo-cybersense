import { Request, Response } from 'express';
import prisma from '../db/client';

/**
 * Get user's Pushbullet configuration
 */
export async function getUserPushbulletConfig(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, pushbulletToken: true },
    });

    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      pushbulletToken: userRecord.pushbulletToken || null,
      configured: !!userRecord.pushbulletToken,
    });
  } catch (e: any) {
    console.error('[userNotifications] getPushbulletConfig Error:', e);
    res.status(500).json({ error: e.message });
  }
}

/**
 * Update user's Pushbullet token
 */
export async function updateUserPushbulletToken(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { pushbulletToken } = req.body;

    // Validate token format (basic check)
    if (pushbulletToken && typeof pushbulletToken !== 'string') {
      return res.status(400).json({ error: 'Invalid token format' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        pushbulletToken: pushbulletToken || null,
      },
      select: { id: true, email: true, pushbulletToken: true },
    });

    console.log(`[userNotifications] Updated pushbullet token for ${updatedUser.email}:`, !!updatedUser.pushbulletToken);

    res.json({
      message: 'Pushbullet token updated',
      pushbulletToken: updatedUser.pushbulletToken || null,
      configured: !!updatedUser.pushbulletToken,
    });
  } catch (e: any) {
    console.error('[userNotifications] updatePushbulletToken Error:', e);
    res.status(500).json({ error: e.message });
  }
}

export default { getUserPushbulletConfig, updateUserPushbulletToken };
