/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const backendBase = backend.replace(/\/api\/v1\/?$/, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendBase}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;