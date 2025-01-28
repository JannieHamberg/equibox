export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  interval: string;
  stripe_plan_id: string;
  description?: string;
}

export interface CheckoutFormProps {
  clientSecret: string;
  email: string;
  name: string;
  stripeCustomerId: string;
  subscriptionPlan: SubscriptionPlan;
  authToken: string;
}
