export interface Prenumerationer {
  id: number;
  stripe_plan_id: string;
  name: string;
  price: number;
  interval: string;
  description: string;
  image_url: string;
  product_id: number;
}

export interface SubscriptionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    name: string;
    description: string;
    price: number;
    image_url: string;
  } | null;
}

export interface Plan {
  id: number;
  name: string;
  price: number;
  interval: string;
  description: string;
  image_url: string;
}

export interface PickSubscriptionProps {
  availablePlans: Plan[];
  onSelectPlan: (planId: number) => void;
  /* isUpdating?: boolean; */
}

export interface SubscriptionPlan {
  id: number;
  stripe_plan_id: string;
  name: string;
  price: number;
  interval: string;
  description: string;
  image_url: string;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  stripe_subscription_id: string;
  name: string;
  price: number;
  interval: string;
  status: SubscriptionStatus;
  description: string;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus = 'active' | 'canceled' | 'incomplete' | 'trialing';

export interface StripeSubscription {
  id: string;
  object: 'subscription';
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  cancelled_at: number | null;
  cancellation_details: {
    comment: string | null;
    feedback: string | null;
    reason: 'cancellation_requested' | 'payment_failed' | 'payment_method_missing' | string;
  };
  current_period_end: number;
  current_period_start: number;
  customer: string;
  cancel_at_period_end: boolean;
}

export interface SubscriptionWithUserDetails extends Subscription {
  email: string;
}
