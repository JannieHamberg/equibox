export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  interval: string;
  stripe_plan_id: string;
  description?: string;
}

export interface BillingDetails {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  vatNumber?: string;
}

export interface CheckoutFormProps {
  clientSecret: string | null;  // Allow null
  setClientSecret: (secret: string | null) => void;
  email: string;
  name: string;
  stripeCustomerId: string;
  subscriptionPlan: SubscriptionPlan;
  authToken: string;
  paymentMethod: 'card' | 'invoice';
}

export interface CleanupResponse {
    success: boolean;
    cleaned_subscriptions: number;
}
