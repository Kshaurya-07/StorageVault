import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next.js from bundling server-only MTProto & DB libraries with webpack
  experimental: {
    serverComponentsExternalPackages: ["telegram", "@prisma/client", "bcryptjs"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Explicitly guarantee @ alias resolution across all operating systems
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
    };

    if (isServer) {
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
