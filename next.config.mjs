/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next.js from bundling server-only MTProto & DB libraries with webpack
  experimental: {
    serverComponentsExternalPackages: ["telegram", "@prisma/client", "bcryptjs"],
  },
  eslint: {
    // Avoid build failure from linter warnings during production deploy
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude optional native addons from server webpack bundling
      config.externals = [...(config.externals || []), "bufferutil", "utf-8-validate"];
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        dns: false,
        child_process: false,
        os: false,
        path: false,
        zlib: false,
      };
    }
    return config;
  },
  reactStrictMode: true,
};

export default nextConfig;
