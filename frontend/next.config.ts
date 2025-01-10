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
      // subscription plans / "products"
      {
        source: "/subscriptions/prenumerationer", // Proxy local route
        destination: "https://backend.equibox.se/wp-json/equibox/v1/subscription_plans", // Actual API endpoint
      },
      // create subscription
      {
        source: "/user/subscribe", 
        destination: "https://backend.equibox.se/wp-json/equibox/v1/subscribe", 
      }, 
      // subscriptions table linking subscription plans to users, use thus endpoint to get subscription plan for a user
      {
        source: "/user/subscription", 
        destination: "https://backend.equibox.se/wp-json/equibox/v1/subscriptions", 
      },
      // Handle Stripe webhook events
      {
        source: "/stripe/subscription-webhook",
        destination: "https://backend.equibox.se/wp-json/equibox/v1/stripe-webhook",
      },
      {
        source: "/user/subscription/update", 
        destination: "https://backend.equibox.se/wp-json/equibox/v1/subscriptions/update",
      },
      {
        source: "/user/subscription/cancel", 
        destination: "https://backend.equibox.se/wp-json/equibox/v1/subscriptions/cancel", 
      },
      // register user
      {
        source: "/register", 
        destination: "https://backend.equibox.se/wp-json/equibox/v1/register",
      },
      {
        source: "/api/get_nonce",
        destination: "https://backend.equibox.se/wp-json/equibox/v1/get_nonce", 
      },
      {
        source: "/stripe/create-client-secret", 
        destination: "https://backend.equibox.se/wp-json/stripe/v1/create-client-secret", 
      },
      {
        // Create or retrieve a customer
        source: "/stripe/customers",
        destination: "https://api.stripe.com/v1/customers",
      },
      {
        // Create a subscription
        source: "/stripe/subscriptions",
        destination: "https://api.stripe.com/v1/subscriptions",
      },
      {
        // Retrieve a subscription
        source: "/stripe/subscriptions/:id",
        destination: "https://api.stripe.com/v1/subscriptions/:id",
      },
      {
        // Cancel a subscription
        source: "/stripe/subscriptions/:id/cancel",
        destination: "https://api.stripe.com/v1/subscriptions/:id",
      },
      {
        // Attach a payment method
        source: "/stripe/payment-methods/:id/attach",
        destination: "https://api.stripe.com/v1/payment_methods/:id/attach",
      },
      {
        source: "/stripe/get-customer-id",
        destination: "https://backend.equibox.se/wp-json/stripe/v1/get-customer-id",
      },
      {
        source: "/stripe/get-or-create-customer",
        destination: "https://backend.equibox.se/wp-json/stripe/v1/get-or-create-customer",
      },
      {
          // Create a subscription in stripe
          source: "/stripe/create-subscription", 
          destination: "https://backend.equibox.se/wp-json/stripe/v1/create-subscription",
        },
    
      
      

    ];
  },
};

export default nextConfig;
