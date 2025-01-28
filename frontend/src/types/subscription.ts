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
  name: string;
  price: number;
  interval: string;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
}
