import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  devIndicators: false,
  basePath: '/musicflow',
  assetPrefix: '/musicflow'
  /* config options here */
};

export default nextConfig;
