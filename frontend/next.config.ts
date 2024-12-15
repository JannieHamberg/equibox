import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
