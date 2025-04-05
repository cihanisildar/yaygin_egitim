import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ["mongoose"],
  },
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
