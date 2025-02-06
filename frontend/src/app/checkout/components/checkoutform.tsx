'use client';

import React, { useState } from "react";
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { CheckoutFormProps } from '@/types/checkout';

export default function CheckoutForm({ 
  clientSecret, 
  email, 
  name, 
  subscriptionPlan, 
  authToken,
  paymentMethod,
  stripeCustomerId
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || !stripe || !elements) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      // Create payment method
      const cardElement = elements.getElement(CardNumberElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          email,
          name,
        },
      });

      if (methodError) {
        throw methodError;
      }

      // Create subscription with Stripe
      const subscriptionResponse = await fetch("/stripe/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          email,
          name,
          plan_id: subscriptionPlan.id,
          stripe_plan_id: subscriptionPlan.stripe_plan_id,
          payment_method: 'card',
          payment_method_id: paymentMethod.id,  
          customer_id: stripeCustomerId
        }),
      });

      const subscriptionData = await subscriptionResponse.json();
      console.log('Subscription response:', subscriptionData);

      if (!subscriptionResponse.ok) {
        throw new Error(subscriptionData.message || 'Failed to create subscription');
      }

      if (!subscriptionData.client_secret) {
        console.error('Missing client secret in response:', subscriptionData);
        throw new Error('No client secret returned from subscription creation');
      }

      // Confirm the payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        subscriptionData.client_secret,
        {
          payment_method: paymentMethod.id,
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Create subscription in custom database only after payment succeeds
        const customDbResponse = await fetch("/user/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            plan_id: subscriptionPlan.id,
            stripe_plan_id: subscriptionPlan.stripe_plan_id,
            email,
            name,
            payment_method: 'card',
            status: 'active',
            stripe_subscription_id: subscriptionData.stripe_subscription_id
          }),
        });

        if (!customDbResponse.ok) {
          const errorData = await customDbResponse.json();
          throw new Error(errorData.message || 'Failed to create subscription in database');
        }

        router.push('/subscription-success?type=card');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!subscriptionPlan) {
    return <div>Loading subscription details...</div>;
  }

  if (paymentMethod !== 'card') {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Card Number</label>
        <CardNumberElement className="p-3 border rounded" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Expiry Date</label>
          <CardExpiryElement className="p-3 border rounded" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">CVC</label>
          <CardCvcElement className="p-3 border rounded" />
        </div>
      </div>

      {errorMessage && (
        <div className="text-red-500 text-sm">{errorMessage}</div>
      )}

      <button
        type="submit"
        disabled={loading || !stripe || !elements}
        className={`w-full btn btn-primary ${loading ? 'loading' : ''}`}
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}
    