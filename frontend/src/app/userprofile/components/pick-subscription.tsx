"use client";
import Image from "next/image";
import { useState } from "react";

interface Plan {
  id: number;
  name: string;
  price: number;
  interval: string;
  description: string;
  image_url: string;
}

interface PickSubscriptionProps {
  availablePlans: Plan[];
  onSelectPlan: (planId: number) => void;
}

export default function PickSubscription({ availablePlans, onSelectPlan }: PickSubscriptionProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const handleActivate = async () => {
    if (selectedPlanId) {
      try {
        onSelectPlan(selectedPlanId);
        // Redirect to WooCommerce with the selected plan ID
        const response = await fetch(`/woocommerce/add-to-cart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ planId: selectedPlanId }),
        });
  
        if (!response.ok) throw new Error("Failed to add plan to WooCommerce cart.");
  
        // Redirect to checkout
        window.location.href = "/checkout";
      } catch (error) {
        console.error(error);
        alert("An error occurred while processing your subscription.");
      }
    } else {
      alert("Välj en prenumerationsbox.");
    }
  };

  return (
<div className="mt-16 w-full  mx-auto p-4">
  <h1 className="text-3xl font-bold mb-8 text-center">Välj en prenumerationsbox</h1>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {availablePlans.map((plan) => (
      <div
        key={plan.id}
        className={`card bg-base-100 shadow-xl w-full ${
          selectedPlanId === plan.id ? "border-2 border-slate-700" : ""
        }`}
        onClick={() => setSelectedPlanId(plan.id)}
      >
        <figure>
        <Image
          src={plan.image_url} 
          alt={plan.name}       
          width={300}           
          height={200}         
          className="w-full h-48 object-contain" 
        />
      </figure>
        <div className="card-body">
          <h2 className="card-title">{plan.name}</h2>
          <p>{plan.description}</p>
          <p className="font-bold text-sm">
            {plan.price} SEK / {plan.interval === "monthly" ? "månadsvis" : plan.interval}
          </p>
          <div className="card-actions justify-end">
            <button
              className={`btn w-full ${selectedPlanId === plan.id ? "btn-neutral" : "btn-outline"}`}
            >
              {selectedPlanId === plan.id ? "Vald" : "Välj"}
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
  <div className="mt-8 text-end">
    <button onClick={handleActivate} className="btn btn-neutral">
      Bekräfta prenumeration
    </button>
  </div>
</div>

  );
}
