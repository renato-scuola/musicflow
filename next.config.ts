import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const isGitHubPages = process.env.GITHUB_ACTIONS;

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  devIndicators: false,
  basePath: isProd && isGitHubPages ? '/musicflow' : '',
  assetPrefix: isProd && isGitHubPages ? '/musicflow/' : '',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
  /* config options here */
};

export default nextConfig;
