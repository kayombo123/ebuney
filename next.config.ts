import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "grxyvzpapamomhfipjfk.supabase.co",
        pathname: "/storage/**",
      },
    ],
  },
  // Provide default env vars during build if not set
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grxyvzpapamomhfipjfk.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_-9yj6Ybd0hiu0KwvHmD1lg_wZzlkoIX',
  },
};

export default nextConfig;
