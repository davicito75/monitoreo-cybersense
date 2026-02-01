import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('[App] Service Worker registered:', registration);

        // Check for updates periodically (every 60 seconds)
        const updateInterval = setInterval(() => {
          registration.update().catch((error) => {
            console.warn('[App] Service Worker update check failed:', error);
          });
        }, 60000);

        // Listen for controller change (new service worker activated)
        navigator.serviceWorker.oncontrollerchange = () => {
          console.log('[App] New Service Worker activated');
          // Optionally reload the page to use new SW
          // window.location.reload();
        };

        return () => clearInterval(updateInterval);
      }).catch((error) => {
        console.warn('[App] Service Worker registration failed:', error);
      });
    }
  }, []);
}

export function clearServiceWorkerCache() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_CACHE',
    });
  }
}

export function skipServiceWorkerWaiting() {
  const registration = navigator.serviceWorker.controller;
  if (registration) {
    registration.postMessage({
      type: 'SKIP_WAITING',
    });
  }
}
