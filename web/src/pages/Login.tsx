import React, { useState } from 'react';
import axios from 'axios';
import { registerPush } from '../api';
import { useContext } from 'react';
import IntlContext from '../contexts/IntlContext';

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('admin@local');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useContext(IntlContext);

  async function submit(e: any) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
    } catch (err: any) {
      console.error('Login failed', err);
      const resp = err?.response;
      if (resp && resp.status === 401) {
        setError(t('login.error.invalid'));
      } else if (resp && resp.data && resp.data.error) {
        setError(String(resp.data.error));
      } else {
        setError(t('login.error.generic') || 'Error al iniciar sesión. Intenta nuevamente.');
      }
      setIsSubmitting(false);
      return;
    }
    // register service worker
    if ('serviceWorker' in navigator) {
      try {
        // register and wait until service worker is active/ready
        await navigator.serviceWorker.register('/sw.js');
        const reg = await navigator.serviceWorker.ready;
        console.log('SW registered and ready', reg);

        // Attempt to auto-subscribe to Push notifications
        try {
          // request notification permission if needed
          if ('Notification' in window && Notification.permission !== 'granted') {
            await Notification.requestPermission();
          }
          if (Notification.permission === 'granted' && 'PushManager' in window) {
            // fetch VAPID public key exposed by the server
            const keyRes = await fetch('/api/vapidPublicKey');
            if (keyRes.ok) {
              const { publicKey } = await keyRes.json();
              // If server returns publicKey === null, push is intentionally disabled
              if (publicKey === null) {
                console.log('[push] Push disabled by server (publicKey=null) — skipping auto-subscribe');
              } else if (publicKey) {
                function urlBase64ToUint8Array(base64String: string) {
                  const padding = '='.repeat((4 - base64String.length % 4) % 4);
                  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
                  const rawData = atob(base64);
                  const outputArray = new Uint8Array(rawData.length);
                  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
                  return outputArray;
                }

                const appKey = urlBase64ToUint8Array(publicKey);
                console.log('[push] VAPID publicKey length:', publicKey.length);
                console.log('[push] applicationServerKey bytes:', appKey.length);

                // retry wrapper for subscribe to handle transient push service errors
                async function trySubscribe(retries = 2) {
                  for (let attempt = 1; attempt <= retries; attempt++) {
                    try {
                      const existing = await reg.pushManager.getSubscription();
                      if (existing) {
                        console.log('[push] existing subscription found, sending to server');
                        await registerPush(existing);
                        console.log('[push] existing subscription sent');
                        return existing;
                      }

                      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
                      try {
                        await registerPush(sub);
                        console.log('[push] Push subscription sent to server');
                      } catch (err) {
                        console.warn('[push] Failed to register push on server', err);
                      }
                      return sub;
                    } catch (err: any) {
                      // Log detailed error fields to help debugging the push-service error
                      console.warn(`[push] subscribe attempt ${attempt} failed`, err?.name, err?.message);
                      if (err && err.stack) console.warn(err.stack);
                      // If last attempt, rethrow so outer handler can decide
                      if (attempt === retries) throw err;
                      // small backoff before retrying
                      await new Promise((r) => setTimeout(r, 1000 * attempt));
                    }
                  }
                }

                try {
                  await trySubscribe(2);
                } catch (innerErr: any) {
                  console.warn('[push] Auto-subscribe failed', innerErr?.name, innerErr?.message, innerErr);
                  // Helpful diagnostics for common issues
                  if (innerErr?.name === 'AbortError' && innerErr?.message?.includes('push service')) {
                    console.warn('[push] Push service error (AbortError). Possible causes: running in an "ephemeral"/incognito profile, push not supported by this browser/profile, or a malformed VAPID key. Confirm you are running in a regular (non-incognito) browser profile and that the VAPID key on the server is correct.');
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('Auto-subscribe failed', e);
        }
      } catch (e) {
        console.warn('SW reg failed', e);
      }
    }
    onLogin();
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md bg-white shadow rounded p-6">
      <h2 className="text-xl font-semibold mb-4">{t('login.title')}</h2>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <div className="mb-3">
        <label className="block text-sm text-gray-600">{t('login.email')}</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" />
      </div>
      <div className="mb-4">
        <label className="block text-sm text-gray-600">{t('login.password')}</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full border px-3 py-2 rounded" />
      </div>
      <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded flex items-center justify-center">
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
            {t('login.button')}...
          </>
        ) : t('login.button')}
      </button>
    </form>
  );
}
