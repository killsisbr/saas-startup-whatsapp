/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@prisma/client'],
  allowedDevOrigins: ['127.0.0.1', '192.168.3.215', 'localhost'],
};

export default nextConfig;
