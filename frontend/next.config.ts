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
        source: "/subscriptions/prenumerationer", // Proxy local route
        destination: "https://backend.equibox.se/wp-json/equibox/v1/subscription_plans", // Actual API endpoint
      },
      {
        source: "/user/subscription", 
        destination: "https://backend.equibox.se/wp-json/equibox/v1/subscriptions", 
    },
    {
        source: "/user/subscription/update", 
        destination: "https://backend.equibox.se/wp-json/equibox/v1/subscriptions/update",
    },
    {
        source: "/user/subscription/cancel", 
        destination: "https://backend.equibox.se/wp-json/equibox/v1/subscriptions/cancel", 
    },
    {
      source: "/register", 
      destination: "https://backend.equibox.se/wp-json/equibox/v1/register",
    },
 
    ];
  },
};

export default nextConfig;
