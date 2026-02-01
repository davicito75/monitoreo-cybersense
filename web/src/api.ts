import axios from 'axios';

export function authHeader() {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// Global interceptor: handle 401 (session expired / unauthorized) centrally
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem('token');
      } catch (e) {}
      // persist an audit log about the session expiry
      // Removed sendBeacon to reduce rate limit issues
      // dispatch a dedicated 401 event so the UI can show a friendly toast + modal
      try {
        if (typeof window !== 'undefined' && window?.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('app-global-401', { detail: 'Sesión expirada, por favor inicia sesión de nuevo' }));
        }
      } catch (e) {}
      // do not redirect here immediately; UI will handle a 2s wait and modal-based redirect
      return Promise.reject(new Error('Sesión expirada, por favor inicia sesión de nuevo'));
    }
    return Promise.reject(err);
  }
);

export async function registerPush(subscription: PushSubscription) {
  const keys = subscription.getKey ? {
    p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
    auth: arrayBufferToBase64(subscription.getKey('auth')!)
  } : (subscription as any).keys;
  await axios.post('/api/push/subscribe', { endpoint: subscription.endpoint, keys }, { headers: authHeader() });
}

function arrayBufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
