"use client";
import styles from "../userprofile.module.css";
import { useEffect, useState } from "react";
import LogoutButton from "./logout-btn";
import PickSubscription from "./pick-subscription";

interface Subscription {
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

interface Plan {
  id: number;
  stripe_plan_id: string;
  name: string;
  price: number;
  interval: string;
  description: string;
  image_url: string;
}

export default function UserDashboard() {
  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null); // Track selected plan

  useEffect(() => {
    fetchUserSubscription();
    fetchAvailablePlans();
  }, []);

  const fetchUserSubscription = async () => {
    console.log("Fetching user subscription...");
    const token = sessionStorage.getItem("authToken");
    console.log("Current auth token:", token);

    try {
      const response = await fetch("/user/subscription", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
      });

      console.log("Response Status:", response.status);
      console.log("Response Headers:", Object.fromEntries(response.headers));

      if (response.status === 401 || response.status === 404) {
        console.log("No subscription found or unauthorized");
        setSubscription(null);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user's subscription.");
      }

      const data = await response.json();
      console.log("Fetched subscription data:", data);
      setSubscription(data.data[0]);
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const fetchAvailablePlans = async () => {
    console.log("Fetching available plans...");
    const token = sessionStorage.getItem("authToken");
    
    try {
      const response = await fetch("/subscriptions/prenumerationer", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      console.log("Plans Response Status:", response.status);

      if (!response.ok) {
        throw new Error("Failed to fetch available plans");
      }

      const data = await response.json();
      console.log("Available plans data received:", data);

      setAvailablePlans(
        data.data.map((plan: Plan) => ({
          ...plan,
          stripe_plan_id: plan.stripe_plan_id, 
          image_url: plan.image_url || "/boxar/fallback-image.webp",
        }))
      );
    } catch (err) {
      console.error("Error fetching plans with details:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlanId) {
      alert("Välj en prenumerationsbox först.");
      return;
    }

    try {
      const endpoint = subscription ? "/user/subscription/update" : "/user/subscribe";
      const method = subscription ? "PUT" : "POST";

      console.log("Payload being sent:", JSON.stringify({ plan_id: selectedPlanId }));

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ plan_id: selectedPlanId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process subscription.");
      }

      alert("Subscription successfully updated!");
      fetchUserSubscription(); // Refresh subscription data
    } catch (err) {
      console.error("Error confirming subscription:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!availablePlans.length || subscription === undefined) {
    return <div>Loading data...</div>;
  }

  return (
    <div className= "mt-40 max-w-max mx-auto p-4 bg-base-100 shadow-2xl rounded-lg">
       <h1 className="text-3xl font-bold pl-6 mb-2 md:mb-6">Mitt konto</h1>

      {subscription === null ? (
        <PickSubscription
          availablePlans={availablePlans}
          onSelectPlan={(planId) => setSelectedPlanId(planId)}
        />
      ) : (
        <div>
          <div className="p-6">
            <h2 className={styles.title}>{subscription.name}</h2>
            <p className={styles.description}>{subscription.description}</p>
            <p className={styles.price}>
              {subscription.price} SEK /{" "}
              {subscription.interval === "monthly" ? "månadsvis" : subscription.interval}
            </p>
            <p className={styles.status}>
              Status: {subscription.status === "active" ? "aktiv" : subscription.status}
            </p>
          </div>

          <div className={`p-6 mt-6`}>
            <h3 className={`text-xl font-bold mb-4`}>Byt prenumerationsbox</h3>
            <select
              value={selectedPlanId || ""}
              onChange={(e) => setSelectedPlanId(Number(e.target.value))}
              className={`border p-2 rounded w-full`}
            >
              <option value="" disabled>
                Välj en annan prenumerationsbox
              </option>
              {availablePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {plan.price} SEK / {plan.interval}
                </option>
              ))}
            </select>
            <button onClick={handleConfirmSubscription} className="btn mt-2 px-6 py-2" aria-label="Bekräfta prenumeration">
              Bekräfta
            </button>
          </div>
          <div className="flex justify-end">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}
