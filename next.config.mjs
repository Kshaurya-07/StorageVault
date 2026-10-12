/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["telegram", "@prisma/client", "bcryptjs"],
  },
  reactStrictMode: true,
};

export default nextConfig;
