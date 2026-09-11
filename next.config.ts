import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://bdc-lyrics.vercel.app/api/v1',
    NEXT_API_BASE_URL: process.env.NEXT_API_BASE_URL || 'https://bdc-lyrics.vercel.app/api/v1',
  },
};

export default nextConfig;
