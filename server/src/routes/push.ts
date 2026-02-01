import { Router } from 'express';
import { authMiddleware } from '../auth/middleware';
import prisma from '../db/client';
import webpush from '../notifications/webpush';

const router = Router();

router.use(authMiddleware);

router.post('/subscribe', async (req, res) => {
  const user = (req as any).user;
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys) return res.status(400).json({ error: 'Invalid' });

  try {
    // Atomically create or update using the DB-level unique constraint on endpoint
    // Try to update existing subscription for this user+endpoint
    const updated = await prisma.pushSubscription.updateMany({
      where: { endpoint, userId: user.id },
      data: { p256dh: keys.p256dh, auth: keys.auth }
    });

    if (updated.count && updated.count > 0) {
      const s = await prisma.pushSubscription.findFirst({ where: { endpoint, userId: user.id } });
      return res.json(s);
    }

    // Otherwise create a new one; handle race where another process created it
    try {
      const s = await prisma.pushSubscription.create({
        data: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth }
      });
      return res.json(s);
    } catch (createErr: any) {
      if (createErr?.code === 'P2002') {
        const s = await prisma.pushSubscription.findFirst({ where: { endpoint, userId: user.id } });
        return res.json(s);
      }
      throw createErr;
    }
  } catch (err) {
    console.error('Error in /subscribe', (err as any)?.stack || err);
    return res.status(500).json({ error: 'Internal' });
  }
});

router.post('/test', async (req, res) => {
  const user = (req as any).user;
  const subs = await prisma.pushSubscription.findMany({ where: { userId: user.id } });
  for (const s of subs) {
    await webpush.sendNotification(s.endpoint, s.p256dh, s.auth, { title: 'Test', body: 'This is a test' });
  }
  res.json({ ok: true });
});

export default router;
