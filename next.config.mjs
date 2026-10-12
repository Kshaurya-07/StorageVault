/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next.js from bundling server-only MTProto & DB libraries with webpack
  experimental: {
    serverComponentsExternalPackages: ["telegram", "@prisma/client", "bcryptjs"],
  },
  webpack: (config, { isServer }) => {
    // Exclude optional native addons from webpack bundling
    config.externals = [...(config.externals || []), "bufferutil", "utf-8-validate"];

    if (!isServer) {
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
        bufferutil: false,
        "utf-8-validate": false,
      };
    }
    return config;
  },
  reactStrictMode: true,
};

export default nextConfig;
