/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backendPort = process.env.KHMERDUB_PORT || '8080';
    return [
      {
        source: '/api/:path*',
        destination: `http://127.0.0.1:${backendPort}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
