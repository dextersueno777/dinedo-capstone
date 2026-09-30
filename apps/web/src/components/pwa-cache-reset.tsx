'use client';

import { useEffect } from 'react';

const RELOAD_GUARD_KEY = 'dinedo-pwa-cache-cleanup-reloaded-v4';

export function PwaCacheReset() {
  useEffect(() => {
    async function cleanOldPwaCache() {
      try {
        let foundOldCache = false;

        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();

          if (registrations.length > 0) {
            foundOldCache = true;
          }

          await Promise.all(
            registrations.map((registration) => registration.unregister()),
          );
        }

        if ('caches' in window) {
          const cacheNames = await caches.keys();

          if (cacheNames.length > 0) {
            foundOldCache = true;
          }

          await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }

        const url = new URL(window.location.href);
        const forceReset = url.searchParams.has('reset') || url.searchParams.has('bust');

        if ((foundOldCache || forceReset) && sessionStorage.getItem(RELOAD_GUARD_KEY) !== 'done') {
          sessionStorage.setItem(RELOAD_GUARD_KEY, 'done');
          window.location.reload();
        }
      } catch {
        sessionStorage.setItem(RELOAD_GUARD_KEY, 'done');
      }
    }

    cleanOldPwaCache();
  }, []);

  return null;
}
