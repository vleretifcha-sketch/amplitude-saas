import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
  outputFileTracingIncludes: {
    '*': ['./node_modules/@swc/helpers/**/*'],
  },
};

export default nextConfig;
