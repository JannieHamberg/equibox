"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./checkoutform";
import SubscriptionBreadcrumbs from "@/app/components/subscription-breadcrumbs";
import { SubscriptionPlan } from '@/types/checkout';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function Checkout() {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [authToken, setAuthToken] = useState<string>("");
  const [stripeCustomerId, setStripeCustomerId] = useState<string | { id: string }>(""); 

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'invoice'>('card');
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    vatNumber: '' // Optional, for business customers
  });
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const customerId = typeof stripeCustomerId === 'object' ? stripeCustomerId.id : stripeCustomerId;

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
        alert("Du måste logga in för att fortsätta.");
        router.push("/login");
        return;
      }

      setUserEmail(email);
      setUserName(name);
      setAuthToken(token);
      console.log("Auth Token set in state:", token);

      const planData = sessionStorage.getItem("subscriptionPlan");
      if (!planData) {
        alert("Ingen prenumerationsplan hittad. Omdirigerar...");
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
          alert("Misslyckades att hämta Stripe kundinformation. Försök igen.");
          return;
        }
        console.log("Stripe Customer ID:", customerId);
        setStripeCustomerId(customerId);
      })();
    }
  }, [authToken, userEmail, userName]);
  

  const handleSubmit = async () => {
    if (isProcessing) return; // Prevent duplicate submissions
    setIsProcessing(true);
    setError(null);

    try {
      if (!subscriptionPlan) {
        throw new Error("No subscription plan selected");
      }

      console.log("🚀 Checking customerId before submitting:");
      console.log("Customer ID:", customerId);
  
      if (!customerId) {
        console.error("❌ Missing customer ID! Checkout cannot proceed.");
        return;
      }  

        //  Debug logs to verify data before making requests
        console.log("🚀 Submitting checkout with:");
        console.log("Email:", userEmail);
        console.log("Name:", userName);
        console.log("Customer ID:", customerId);
        console.log("Plan ID:", subscriptionPlan.stripe_plan_id);
        console.log("Payment Method:", paymentMethod);

      // Cleanup subscriptions once, before any new subscription creation
      try {
        const cleanupResponse = await fetch("/stripe/cleanup-subscriptions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
         /*    customer_id: stripeCustomerId, */
            customer_id: customerId,
            plan_id: subscriptionPlan.stripe_plan_id
          }),
        });

        if (!cleanupResponse.ok) {
          console.error('Failed to cleanup subscriptions');
        }
      } catch (error) {
        console.error('Error cleaning up subscriptions:', error);
      }

      if (paymentMethod === 'invoice') {
        // Validate billing details before proceeding
        if (!billingDetails.name.trim()) {
          setError("Billing name is required.");
          return;
        }
        if (!billingDetails.address.trim()) {
          setError("Billing address is required.");
          return;
        }
        if (!billingDetails.city.trim()) {
          setError("Billing city is required.");
          return;
        }
        if (!billingDetails.postalCode.trim() || !/^\d{4,6}$/.test(billingDetails.postalCode)) {
          setError("Valid postal code is required.");
          return;
        }
        if (billingDetails.vatNumber && !/^[A-Za-z0-9-]+$/.test(billingDetails.vatNumber)) {
          setError("VAT number format is incorrect.");
          return;
        }

        // Create Stripe subscription for invoice
        const response = await fetch("/stripe/create-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            email: userEmail,
            name: userName,
            stripe_plan_id: subscriptionPlan.stripe_plan_id,
            payment_method: 'invoice',
            billing_details: billingDetails,
            customer_id: customerId,
            create_in_db: true,
            plan_id: subscriptionPlan.id
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to create subscription');
        }

        router.push('/subscription-success?type=invoice');
      } else {
        // For card payments, create client secret and let CheckoutForm handle the rest
        const setupResponse = await fetch("/stripe/create-client-secret", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            email: userEmail,
            name: userName,
            amount: subscriptionPlan.price * 100,
            customer_id: customerId,
            force_new: true
          }),
        });

        const setupData = await setupResponse.json();
        if (!setupResponse.ok) {
          throw new Error(setupData.message || 'Failed to setup payment');
        }

        setClientSecret(setupData.clientSecret);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!subscriptionPlan) {
    return <p>Loading subscription plan...</p>;
  }

  console.log("Rendering Checkout");
  console.log("clientSecret:", clientSecret);
  console.log("authToken:", authToken);
  console.log("stripeCustomerId:", stripeCustomerId);

  /* const customerId = typeof stripeCustomerId === 'object' ? stripeCustomerId.id : stripeCustomerId; */

  return (
    <>
      <SubscriptionBreadcrumbs />
      <div className="container mx-auto px-4">
        <div className="max-w-[1280px] mx-auto mt-16">
          <h1 className="text-lg md:text-3xl font-bold mb-6 text-left md:text-center">Prenumerera på Equibox</h1>
  
          <div className="max-w-[600px] mx-auto">
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
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Betalningsalternativ</h3>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="radio"
                    />
                    <span>Betala med kort</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="invoice"
                      checked={paymentMethod === 'invoice'}
                      onChange={() => setPaymentMethod('invoice')}
                      className="radio"
                    />
                    <span>Betala med faktura</span>
                  </label>
                </div>

                {paymentMethod === 'invoice' && (
                  <div className="mt-4 space-y-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={billingDetails.name}
                      onChange={(e) => setBillingDetails({...billingDetails, name: e.target.value})}
                      className="input input-bordered w-full"
                    />
                    <input
                      type="text"
                      placeholder="Address"
                      value={billingDetails.address}
                      onChange={(e) => setBillingDetails({...billingDetails, address: e.target.value})}
                      className="input input-bordered w-full"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="City"
                        value={billingDetails.city}
                        onChange={(e) => setBillingDetails({...billingDetails, city: e.target.value})}
                        className="input input-bordered"
                      />
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={billingDetails.postalCode}
                        onChange={(e) => setBillingDetails({...billingDetails, postalCode: e.target.value})}
                        className="input input-bordered"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="VAT Number (optional)"
                      value={billingDetails.vatNumber}
                      onChange={(e) => setBillingDetails({...billingDetails, vatNumber: e.target.value})}
                      className="input input-bordered w-full"
                    />
                  </div>
                )}

                {paymentMethod === 'card' && clientSecret && subscriptionPlan ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm
                      clientSecret={clientSecret}
                      email={userEmail}
                      name={userName}
                      stripeCustomerId={customerId}
                      subscriptionPlan={subscriptionPlan}
                      authToken={authToken}
                     setClientSecret={setClientSecret}
                      paymentMethod={paymentMethod}
                    />
                  </Elements>
                ) : (
                  <button 
                    onClick={handleSubmit}
                    className={`btn btn-primary w-full mt-4 ${isProcessing ? 'loading' : ''}`}
                    disabled={!subscriptionPlan || isProcessing}
                  >
                    {isProcessing 
                      ? 'Processing...' 
                      : paymentMethod === 'card' 
                        ? 'Proceed to Card Payment' 
                        : 'Send Invoice'
                    }
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

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