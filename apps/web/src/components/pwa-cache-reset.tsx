'use client';

import { useEffect } from 'react';

const CACHE_RESET_KEY = 'dinedo-pwa-cache-reset-2026-09-30-disable-sw-v3';

export function PwaCacheReset() {
  useEffect(() => {
    async function resetOldPwaCache() {
      try {
        if (window.localStorage.getItem(CACHE_RESET_KEY) === 'done') {
          return;
        }

        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();

          await Promise.all(
            registrations.map((registration) => registration.unregister()),
          );
        }

        if ('caches' in window) {
          const cacheNames = await caches.keys();

          await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }

        window.localStorage.setItem(CACHE_RESET_KEY, 'done');
        window.location.reload();
      } catch {
        window.localStorage.setItem(CACHE_RESET_KEY, 'done');
      }
    }

    resetOldPwaCache();
  }, []);

  return null;
}
