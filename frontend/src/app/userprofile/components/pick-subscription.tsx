"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const handleActivate = async () => {
    console.log("Selected Plan ID:", selectedPlanId);
    if (selectedPlanId) {
      try {
        const selectedPlan = availablePlans.find((plan) => plan.id === selectedPlanId);
        if (!selectedPlan) {
          alert("Vald prenumerationsbox hittades inte.");
          throw new Error("Selected plan not found");
        }
  
        // Store the selected plan details in sessionStorage
        sessionStorage.setItem("subscriptionPlan", JSON.stringify(selectedPlan));
        console.log("Subscription plan stored:", selectedPlan);
  
        // Redirect to checkout
        router.push("/checkout");
      } catch (error) {
        console.error("Error activating subscription:", error);
        alert("Ett fel uppstod när prenumerationen skulle aktiveras.");
      }
    } else {
      alert("Välj en prenumerationsbox.");
    }
  };
  
  
  

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-[1280px] mx-auto mt-32">
        <h1 className="text-3xl font-bold mb-8 text-center">Välj en prenumerationsbox</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ">
          {availablePlans.map((plan) => (
            <div
              key={plan.id}
              className={`card bg-base-100 rounded-lg  w-full ${
                selectedPlanId === plan.id ? "border-2 border-slate-700" : ""
              }`}
              onClick={() => {
                setSelectedPlanId(plan.id); // Update local state
                if (onSelectPlan) {
                  onSelectPlan(plan.id); // Notify parent only when necessary
                }
              }}
              
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
                    aria-label="Välj prenumerationsbox"
                  >
                    {selectedPlanId === plan.id ? "Vald" : "Välj"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-end">
        <button
        onClick={handleActivate}
        className={`btn btn-neutral`}
        aria-label="Bekräfta prenumeration"
        disabled={!selectedPlanId} // Disable if no plan is selected
      >
        Bekräfta prenumeration
      </button>

        </div>
      </div>
    </div>
  );
}
