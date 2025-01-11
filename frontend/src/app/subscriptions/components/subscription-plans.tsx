"use client";

import styles from "../subscriptions.module.css";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from 'framer-motion';

interface Prenumerationer {
  id: number;
  stripe_plan_id: string;
  name: string;
  price: number;
  interval: string;
  description: string;
  image_url: string;
  product_id: number;
}

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState<Prenumerationer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch("/subscriptions/prenumerationer"); 
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
    <motion.section
      className="py-16 "
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2 }}
      viewport={{ once: true, margin: "-200px" }}
    >
      <div className="container mx-auto px-4 pt-10 bg-base-300 shadow-2xl rounded-lg pb-14">
        <h2 className="text-3xl font-semibold text-center mb-12">
          VÅRA BOXAR
        </h2>
        <div className="flex justify-center items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`card bg-base-100 shadow-xl ${styles.cardNoRadius} ${styles.cardCustom} max-w-sm`}>
                <figure>
                  <Image
                    src={plan.image_url || '/boxar/fallback-image.webp'}
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
                    {plan.price} SEK / månadsvis
                  </p>
                  <div className="card-actions justify-end">
                    <button className="btn" aria-label="Detaljer">Detaljer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
