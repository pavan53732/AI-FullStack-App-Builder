import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-3cf41c83-9ff7-40ea-84e1-05d2d86d1502.space.z.ai',
    '.space.z.ai',
    'localhost:3000',
  ],
};

export default nextConfig;
// v1773524515
