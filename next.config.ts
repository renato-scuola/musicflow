import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  devIndicators: false,
  // Rimuoviamo basePath e assetPrefix per domini personalizzati
  // basePath e assetPrefix sono necessari solo per github.io/repo-name
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
  /* config options here */
};

export default nextConfig;
