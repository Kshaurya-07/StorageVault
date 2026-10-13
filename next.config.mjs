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
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Blocks clickjacking: vault pages are never embeddable.
          { key: "X-Frame-Options", value: "DENY" },
          // Stops MIME sniffing attacks (e.g. an uploaded file served as HTML).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Minimal referrer leakage.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Lock down powerful browser features the vault doesn't use.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Enforce HTTPS once deployed behind TLS.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
