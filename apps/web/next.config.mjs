/** @type {import('next').NextConfig} */
const noStoreHeaders = [
  {
    key: 'Cache-Control',
    value: 'no-cache, no-store, max-age=0, must-revalidate',
  },
  {
    key: 'Pragma',
    value: 'no-cache',
  },
  {
    key: 'Expires',
    value: '0',
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: noStoreHeaders,
      },
      {
        source: '/manifest.webmanifest',
        headers: noStoreHeaders,
      },
      {
        source: '/:path*',
        headers: noStoreHeaders,
      },
    ];
  },
};

export default nextConfig;
