"use client"; // Must be at the top of the file

import { useEffect, useState } from 'react';

interface Prenumerationer {
  id: number;
  name: string;
  price: number;
  interval: string;
  description: string;
}

export default function Prenumerationer() {
  const [plans, setPlans] = useState<Prenumerationer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/subscriptions/prenumerationer'); // Proxy Route
        if (!response.ok) throw new Error('Failed to fetch subscription plans');
        const data = await response.json();
        setPlans(data.data);
      } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred");
        }
    }
    
    };

    fetchPlans();
  }, []);

  if (error) return <div>Error: {error}</div>;

  return (
    <div className='mt-12 mb-10'>
      <h1>Subscription Plans</h1>
      <ul>
        {plans.map((plan) => (
          <li key={plan.id}>
            {plan.name} - {plan.price} SEK ({plan.interval})
          </li>
        ))}
      </ul>
    </div>
  );
}
