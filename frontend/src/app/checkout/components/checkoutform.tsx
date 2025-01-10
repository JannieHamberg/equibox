'use client';

import React, { useState } from "react";
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";

interface CheckoutFormProps {
  clientSecret: string;
  email: string;
  name: string;
  stripeCustomerId: string;
  subscriptionPlan: {
    id: number;
    name: string;
    price: number;
    interval: string;
    stripe_plan_id: string;
    description?: string;
  };
  authToken: string;
}

export default function CheckoutForm({ clientSecret, email, name, /* stripeCustomerId, */ subscriptionPlan, authToken }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [cardholderName, setCardholderName] = useState<string>(""); // State for cardholder name
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
  
    try {
      if (!stripe || !elements) throw new Error("Stripe.js is not loaded yet.");
      if (!clientSecret) throw new Error("Client secret not available.");
  
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) throw new Error("Card Number Element is not loaded.");
  
      // Confirm card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            email, // Use email directly if it's the prop
            name: cardholderName, // Use the cardholder name from the input field
          },
        },
      });
  
      if (error || !paymentIntent) {
        throw new Error(error?.message || "Failed to confirm payment.");
      }
  
      const paymentMethodId = paymentIntent.payment_method;
      console.log("Payment Method ID:", paymentMethodId);
      console.log("stripe_plan_id:", subscriptionPlan.stripe_plan_id);

      // Directly send payment method to create subscription
      const stripeResponse = await fetch("/stripe/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          email, // Use email directly if it's the prop
          name: cardholderName, // Pass the cardholder name
          stripe_plan_id: subscriptionPlan.stripe_plan_id, // Stripe price/plan ID
          payment_method_id: paymentMethodId, // Payment method for Stripe
        }),
      });
  
      if (!stripeResponse.ok) {
        const errorData = await stripeResponse.json();
        throw new Error(`Stripe Subscription Error: ${errorData.message}`);
      }

      const { stripe_subscription_id } = await stripeResponse.json(); // debugg/capture `stripe_subscription_id`
      console.log("Stripe Subscription ID:", stripe_subscription_id);
  
      // Create subscription in the custom database
      const customDbResponse = await fetch("/user/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          plan_id: subscriptionPlan.id, // Custom database plan ID
          stripe_plan_id: subscriptionPlan.stripe_plan_id, // Stripe Price ID
          stripe_subscription_id, // Stripe Subscription ID
          email, // Use email directly
          name: name, 
          payment_method_id: paymentMethodId, 
        }),
      });
      console.log("Payload sent to /user/subscribe:", {
        plan_id: subscriptionPlan.id,
        stripe_plan_id: subscriptionPlan.stripe_plan_id,
        stripe_subscription_id,
        email,
        name,
        payment_method_id: paymentMethodId,
      });
  
      if (!customDbResponse.ok) {
        const errorData = await customDbResponse.json();
        throw new Error(`Custom Database Error: ${errorData.message}`);
      }
  
      // Redirect to the subscription success page
      router.push("/subscription-success");
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
    
      return (
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 border rounded shadow-md">
          <h2 className="text-xl font-bold mb-4 text-center">Betalningsuppgifter</h2>
    
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 ">Kortinnehavarens namn</label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              className="w-full p-0 text-left"
              placeholder="Förnamn efternamn"
              required
            />
          </div>
    
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Kortnummer</label>
            <CardNumberElement
              options={{
                style: {
                  base: {
                    fontSize: "12px",
                    color: "#32325d",
                    fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#fa755a",
                    iconColor: "#fa755a",
                  },
                },
              }}
            />
          </div>
    
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Utgångsdatum</label>
            <CardExpiryElement
              options={{
                style: {
                  base: {
                    fontSize: "12px",
                    color: "#32325d",
                    fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#fa755a",
                    iconColor: "#fa755a",
                  },
                },
              }}
            />
          </div>
    
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">CVC</label>
            <CardCvcElement
              options={{
                style: {
                  base: {
                    fontSize: "12px",
                    color: "#32325d",
                    fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#fa755a",
                    iconColor: "#fa755a",
                  },
                },
              }}
            />
          </div>
    
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
          <button disabled={loading} className={`btn btn-primary w-full ${loading ? "loading" : ""}`}>
            {loading ? "Processing..." : "Betala nu"}
          </button>
        </form>
      );
    }
    