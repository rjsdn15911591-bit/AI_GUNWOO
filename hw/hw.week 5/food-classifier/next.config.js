const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/storage\.googleapis\.com\/tfjs-models\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'tfjs-models-cache',
        expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      urlPattern: /^https:\/\/www\.gstatic\.com\/firebasejs\/.*/,
      handler: 'CacheFirst',
      options: { cacheName: 'tfjs-deps-cache' },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
