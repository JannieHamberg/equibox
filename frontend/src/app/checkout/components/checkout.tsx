"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./checkoutform";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  interval: string;
  stripe_plan_id: string;
  description?: string;
}

export default function Checkout() {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [authToken, setAuthToken] = useState<string>("");
  const [stripeCustomerId, setStripeCustomerId] = useState<string>("");

  const fetchStripeCustomerId = async (token: string, email: string, name: string) => {
    try {
      console.log("Auth Token in fetchStripeCustomerId:", token);
      const response = await fetch("/stripe/get-or-create-customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, name }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error Data from API:", errorData);
        throw new Error(errorData.message || "Failed to fetch or create Stripe customer ID.");
      }
  
      const data = await response.json();
      console.log("Setting stripeCustomerId:", data.stripe_customer_id);
      return data.stripe_customer_id;
    } catch (error) {
      console.error("Error in fetchStripeCustomerId:", error);
      return null;
    }
  };
  

  // Initialize component
  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;

      const email = sessionStorage.getItem("userEmail") || "";
      const name = sessionStorage.getItem("userName") || "";
      const token = sessionStorage.getItem("authToken") || "";

      console.log("Retrieved Token from sessionStorage:", token);
      console.log("Retrieved Email from sessionStorage:", email);
      console.log("Retrieved Name from sessionStorage:", name);

      if (!email || !name || !token) {
        alert("You must log in to proceed.");
        router.push("/login");
        return;
      }

      setUserEmail(email);
      setUserName(name);
      setAuthToken(token);
      console.log("Auth Token set in state:", token);

      const planData = sessionStorage.getItem("subscriptionPlan");
      if (!planData) {
        alert("No subscription plan found. Redirecting...");
        router.push("/userprofile");
        return;
      }
      const parsedPlan = JSON.parse(planData);
      console.log("Parsed Plan from sessionStorage:", parsedPlan); // Debug log

      setSubscriptionPlan(JSON.parse(planData));
    })();
  }, [router]);

  // Fetch Stripe Customer ID
  useEffect(() => {
    if (authToken && userEmail && userName) {
      (async () => {
        const customerId = await fetchStripeCustomerId(authToken, userEmail, userName);
        if (!customerId) {
          alert("Failed to fetch Stripe customer details. Please try again.");
          return;
        }
        console.log("Stripe Customer ID:", customerId);
        setStripeCustomerId(customerId);
      })();
    }
  }, [authToken, userEmail, userName]);
  

  const processCheckout = async () => {
    console.log("processCheckout called");

    if (!stripeCustomerId || clientSecret) {
        console.log("Skipping processCheckout. Either Stripe customer ID is missing or clientSecret is already set.");
        return; // Prevent re-fetching if clientSecret is already set
    }

    try {
        if (!subscriptionPlan) throw new Error("No subscription plan selected!");

        const paymentIntentResponse = await fetch("/stripe/create-client-secret", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                email: userEmail,
                name: userName,
                amount: subscriptionPlan.price * 100, // Amount in cents
            }),
        });

        if (!paymentIntentResponse.ok) {
            const errorData = await paymentIntentResponse.json();
            throw new Error(`Stripe Error: ${errorData.message}`);
        }

        const paymentIntent = await paymentIntentResponse.json();
        console.log("Setting clientSecret:", paymentIntent.clientSecret);
        setClientSecret(paymentIntent.clientSecret); // Only set if successfully fetched
    } catch (error) {
        console.error("Error during checkout process:", error);
        alert("An error occurred during the checkout process. Please try again.");
    }
};

  

  if (!subscriptionPlan) {
    return <p>Loading subscription plan...</p>;
  }

  console.log("Rendering Checkout");
  console.log("clientSecret:", clientSecret);
  console.log("authToken:", authToken);
  console.log("stripeCustomerId:", stripeCustomerId);

  return (
    <div className="container mx-auto mt-32 p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Prenumerera på Equibox</h1>
  
      <div className="card bg-base-100 shadow-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Subscription Summary</h2>
        <div className="space-y-2">
          <p className="text-lg">{subscriptionPlan.name}</p>
          <p className="text-gray-600">{subscriptionPlan.description}</p>
          <p className="text-lg font-semibold">
            {subscriptionPlan.price} SEK / {subscriptionPlan.interval}
          </p>
        </div>
      </div>
  
      <div className="card bg-base-100 shadow-xl p-6">
        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm
              clientSecret={clientSecret}
              email={userEmail}
              name={userName}
              stripeCustomerId={stripeCustomerId}
              subscriptionPlan={subscriptionPlan}
              authToken={authToken}
            />
            <div className="mt-10"> <p>Genom att slutföra detta steg skapas ditt abonnemang, och en faktura kommer att skickas till din e-post för betalning.
          </p>
      </div>
          </Elements>
        ) : (
          <div className="text-center p-4">
            <button onClick={processCheckout} className="btn-accent mt-4">
              Bekräfta prenumeration
            </button>
          </div>
        )}
     
       
      </div>
    </div>
  );
}  