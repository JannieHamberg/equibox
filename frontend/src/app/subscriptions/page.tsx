"use client"; 

import Image from 'next/image';


import { useEffect, useState } from 'react';

interface Prenumerationer {
  id: number;
  name: string;
  price: number;
  interval: string;
  description: string;
  image_url: string;
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
    <div className='pl-20'>
      <h1>Subscription Plans</h1>
      <ul>
  {plans.map((plan) => (
    <li key={plan.id}>
      <h2>{plan.name}</h2>
      <p>{plan.description}</p>
      {plan.image_url && (
        <img
          src={plan.image_url} // Ensure `image_url` is defined
          alt={plan.name}
          width={200}
          height={100}
          style={{ objectFit: 'contain' }}
        />
      )}
    </li>
  ))}
</ul>

    </div>
  );
}
