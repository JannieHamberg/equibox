"use client";

import styles from "../subscriptions.module.css";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Prenumerationer {
  id: number;
  name: string;
  price: number;
  interval: string;
  description: string;
  image_url: string;
}

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState<Prenumerationer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch("/subscriptions/prenumerationer"); // Proxy Route
        if (!response.ok) throw new Error("Failed to fetch subscription plans");
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
    <div className="flex items-center justify-end mt-32    ">
  {/* Title Section */}
  <div className="flex-shrink-0 lg:text-left 2xl:text-center lg:w-64 2xl:w-fit">
    <h2 className="text-4xl font-bold text-gray-800">
      Våra Boxar
    </h2>
  </div>

  {/* Cards Section */}
  <div className="flex justify-end 2xl:justify-center w-full  lg:w-3/4 ">
  <div className="grid grid-cols-[repeat(auto-fit,_minmax(300px,_1fr))] gap-8 p-8 max-w-screen-xl ">

    {plans.map((plan) => (
      <div
        key={plan.id}
        className={`card bg-base-100 shadow-xl ${styles.cardNoRadius} ${styles.cardCustom}`}>
        <figure>
          <Image
            src={plan.image_url}
            alt={plan.name}
            width={300}
            height={200}
            style={{ objectFit: "cover" }}
            className="w-full"
          />
        </figure>
        <div className="card-body">
          <h2 className="card-title">{plan.name}</h2>
          <p>{plan.description}</p>
          <p className="text-lg font-semibold">
            {plan.price} SEK / {plan.interval}
          </p>
          <div className="card-actions justify-end">
            <button className="btn">Detaljer</button>
          </div>
        </div>
      </div>
    ))}
  </div>
  </div>
</div>

  );
  
  
}
