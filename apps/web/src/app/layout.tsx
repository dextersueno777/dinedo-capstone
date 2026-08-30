import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaServiceWorker } from '@/components/pwa-service-worker';
import { AuthProvider } from '@/components/auth-provider';

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
        <PwaServiceWorker />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
