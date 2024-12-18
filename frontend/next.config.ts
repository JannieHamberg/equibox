import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ibb.co", // Allow images from i.ibb.co
        port: "",
        pathname: "/**", // Allow all paths
      },
    ],
  },

  // API Rewrites
  async rewrites() {
    return [
      {
        source: "/subscriptions/prenumerationer", // Local route
        destination: "https://backend.equibox.se/wp-json/equibox/v1/subscription_plans", // Actual API endpoint
      },
    ];
  },
};

export default nextConfig;
