import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaCacheReset } from '@/components/pwa-cache-reset';
import { PwaServiceWorker } from '@/components/pwa-service-worker';
import { AuthProvider } from '@/components/auth-provider';
import { CartProvider } from '@/components/cart-provider';

export const metadata: Metadata = {
  title: 'DineDo',
  description:
    'DineDo PWA for ordering, reservation, and delivery management.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PwaCacheReset />
        <PwaServiceWorker />
        <AuthProvider><CartProvider>{children}</CartProvider></AuthProvider>
      </body>
    </html>
  );
}
