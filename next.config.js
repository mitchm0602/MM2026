/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from external domains if you add team logos later
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'a.espncdn.com' },
      { protocol: 'https', hostname: '**.espncdn.com' },
    ],
  },
};

module.exports = nextConfig;
