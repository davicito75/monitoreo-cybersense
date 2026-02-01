import prisma from '../db/client';
import { request } from 'undici';

/**
 * Send Pushbullet notification to all users with configured tokens
 */
export async function broadcastPushbulletNotification(title: string, body: string): Promise<void> {
  try {
    // Get all users with Pushbullet tokens configured
    const users = await prisma.user.findMany({
      where: { pushbulletToken: { not: null } },
      select: { id: true, email: true, pushbulletToken: true },
    });

    if (users.length === 0) {
      console.log('[pushbullet-broadcast] No users with Pushbullet tokens configured');
      return;
    }

    console.log(`[pushbullet-broadcast] Sending to ${users.length} user(s):`, users.map(u => u.email).join(', '));

    // Send to each user
    for (const user of users) {
      if (!user.pushbulletToken) {
        console.log(`[pushbullet-broadcast] Skipping ${user.email} - no token`);
        continue;
      }

      try {
        console.log(`[pushbullet-broadcast] Sending to ${user.email} with token starting with ${user.pushbulletToken.substring(0, 10)}...`);

        const payload = JSON.stringify({
          type: 'note',
          title,
          body,
        });

        const response = await request('https://api.pushbullet.com/v2/pushes', {
          method: 'POST',
          headers: {
            'Access-Token': user.pushbulletToken,
            'Content-Type': 'application/json',
          },
          body: payload,
        });

        if (response.statusCode === 200) {
          console.log(`[pushbullet-broadcast] ✓ Sent to ${user.email}`);
        } else {
          const responseBody = await response.body.text();
          console.error(`[pushbullet-broadcast] ✗ Failed for ${user.email}:`, response.statusCode, responseBody);
        }
      } catch (error: any) {
        console.error(`[pushbullet-broadcast] Error sending to ${user.email}:`, error.message);
      }
    }
  } catch (error: any) {
    console.error('[pushbullet-broadcast] Error:', error.message);
  }
}

export default { broadcastPushbulletNotification };
