import { request } from 'undici';

const PUSHBULLET_ENABLED = (process.env.PUSHBULLET_ENABLED || 'false').toLowerCase() === 'true';
const PUSHBULLET_TOKEN = process.env.PUSHBULLET_TOKEN || '';

/**
 * Initialize Pushbullet service.
 * Logs configuration status.
 */
export function init(): void {
  if (!PUSHBULLET_ENABLED) {
    console.log('[pushbullet] disabled by PUSHBULLET_ENABLED=false');
    return;
  }

  if (!PUSHBULLET_TOKEN) {
    console.warn('[pushbullet] PUSHBULLET_TOKEN not configured; notifications will fail');
    return;
  }

  console.log('[pushbullet] configured and enabled');
}

/**
 * Send a push notification via Pushbullet.
 * @param title - Notification title
 * @param body - Notification body/message
 */
export async function sendNotification(title: string, body: string): Promise<void> {
  if (!PUSHBULLET_ENABLED) {
    console.log('[pushbullet] send skipped (PUSHBULLET_ENABLED=false)');
    return;
  }

  if (!PUSHBULLET_TOKEN) {
    console.warn('[pushbullet] cannot send notification: PUSHBULLET_TOKEN not set');
    return;
  }

  try {
    console.log('[pushbullet] sending notification:', title);
    
    const payload = JSON.stringify({
      type: 'note',
      title,
      body,
    });

    const response = await request('https://api.pushbullet.com/v2/pushes', {
      method: 'POST',
      headers: {
        'Access-Token': PUSHBULLET_TOKEN,
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    if (response.statusCode === 200) {
      console.log('[pushbullet] notification sent successfully');
    } else {
      const responseBody = await response.body.text();
      console.error('[pushbullet] failed to send notification:', response.statusCode, responseBody);
    }
  } catch (error: any) {
    console.error('[pushbullet] error sending notification:', error.message);
  }
}

export default { init, sendNotification };
