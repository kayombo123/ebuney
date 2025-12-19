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
  // For Cloudflare Pages, we need to allow the build to continue
  // even if some pages fail during static generation
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
