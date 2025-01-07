'use client';

import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
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

export default function CheckoutForm({ clientSecret, email, name, stripeCustomerId, subscriptionPlan, authToken }: CheckoutFormProps) {
    console.log('CheckoutForm rendered');
    console.log('Received authToken:', authToken);
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (!stripe || !elements) throw new Error("Stripe.js is not loaded yet.");
      if (!clientSecret) throw new Error("Client secret not available.");

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card Element is not loaded.");

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: email,
            name: name,
          },
        },
      });

      if (error || !paymentIntent) {
        throw new Error(error?.message || "Failed to confirm payment.");
      }

      const paymentMethodId = paymentIntent.payment_method;
      console.log(authToken)
      // Attach payment method to customer
      await fetch(`/stripe/payment-methods/${paymentMethodId}/attach`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`, 
          },
        body: JSON.stringify({ customer_id: stripeCustomerId }),
      });

      // Create subscription in custom database
      const response = await fetch("/user/subscribe", {
        method: "POST",
        headers: {
             "Content-Type": "application/json",
             Authorization: `Bearer ${authToken}`,
             },
        body: JSON.stringify({
          plan_id: subscriptionPlan.id, // Internal database plan ID
          stripe_plan_id: subscriptionPlan.stripe_plan_id, // Stripe Price ID
          payment_method_id: paymentMethodId,
          email: email,
          name: name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create subscription.");
      }

      // Redirect to success page
      router.push("/subscription-success");
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 border rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Payment Details</h2>
      <CardElement className="mb-4" />
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      <button disabled={loading} className={`btn btn-primary w-full ${loading ? "loading" : ""}`}>
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}
