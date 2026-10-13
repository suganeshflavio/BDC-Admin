import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.1.50:3003/api/v1',
    NEXT_API_BASE_URL: process.env.NEXT_API_BASE_URL || 'http://192.168.1.50:3003/api/v1',
  },
};

export default nextConfig;
