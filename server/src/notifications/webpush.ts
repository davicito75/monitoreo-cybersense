import webpush from 'web-push';

type PushPayload = Record<string, unknown>;

const PUSH_ENABLED = (process.env.PUSH_ENABLED || 'false').toLowerCase() === 'true';

/**
 * Initialize web-push with VAPID keys from env.
 * If push is disabled via PUSH_ENABLED, this becomes a no-op.
 */
export function init(): void {
  if (!PUSH_ENABLED) {
    console.log('[webpush] disabled by PUSH_ENABLED=false');
    return;
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@local';
  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    console.log('[webpush] configured');
  } else {
    console.warn('[webpush] VAPID keys not configured; push will fail');
  }
}

/**
 * Send a push notification to a subscription.
 * No-op when PUSH_ENABLED is false.
 */
export async function sendNotification(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload
): Promise<void> {
  if (!PUSH_ENABLED) {
    console.log('[webpush] send skipped (PUSH_ENABLED=false) for', endpoint);
    return;
  }

  const sub = {
    endpoint,
    keys: { p256dh, auth },
  };

  try {
    console.log('[webpush] sending notification to', endpoint);
    await webpush.sendNotification(sub as any, JSON.stringify(payload));
    console.log('[webpush] sent notification to', endpoint);
  } catch (err) {
    console.error('[webpush] Push error for endpoint', endpoint, err instanceof Error ? err.message : err);
    if (err && typeof err === 'object' && 'stack' in err) {
      // @ts-ignore
      console.error(err.stack);
    }
  }
}

// Default export kept for existing import style in the codebase
export default { init, sendNotification };
