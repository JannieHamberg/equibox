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

  useEffect(() => {
    fetchUserSubscription();
    fetchAvailablePlans();
  }, []);

  // Fetch the user's current subscription
  const fetchUserSubscription = async () => {
    console.log("Fetching user subscription...");
    try {
      const response = await fetch("/user/subscription", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Send cookies
      });

      console.log("Response Status (fetchUserSubscription):", response.status);

      if (response.status === 401) {
        console.log("Unauthorized - no subscription.");
        setSubscription(null);
        return;
      }

      if (response.status === 404) {
        console.log("No subscription found.");
        setSubscription(null);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response data:", errorData);
        throw new Error(errorData.message || "Failed to fetch user's subscription.");
      }

      const data = await response.json();
      console.log("Fetched subscription data:", data);
      setSubscription(data.data[0]);
    } catch (err) {
      setSubscription(null); // Ensure null if error occurs
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error fetching subscription:", err);
    }
  };

  // Fetch all available subscription plans
  const fetchAvailablePlans = async () => {
    console.log("Fetching available plans...");
    try {
      const response = await fetch("/subscriptions/prenumerationer", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", 
      });

      console.log("Response Status (fetchAvailablePlans):", response.status);

      if (!response.ok) {
        throw new Error("Failed to fetch available plans");
      }

      const data = await response.json();
      console.log("Available plans data received:", data);

      const plansWithImage = data.data.map((plan: Plan) => ({
        ...plan,
        image_url: plan.image_url || "/boxar/fallback-image.webp",
      }));

      setAvailablePlans(plansWithImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error fetching available plans:", err);
    }
  };

  const handleActivateSubscription = async (planId: number) => {
    try {
      const endpoint = subscription ? "/user/subscription/update" : "/user/subscribe";
      const method = subscription ? "PUT" : "POST";

      console.log("Payload being sent:", JSON.stringify({ plan_id: planId }));

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ plan_id: planId }),
      });

      if (!response.ok) throw new Error("Failed to process subscription");

      alert("Subscription successfully updated!");
      fetchUserSubscription(); // Refresh subscription data after update
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error(err);
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!availablePlans.length || subscription === undefined) {
    return <div>Loading data...</div>;
  }

  return (
    <div className={`mt-40 max-w-max mx-auto p-4 bg-stone-100 ${styles.shadow} ${styles.rounded}`}>
      <h1 className="text-3xl font-bold pl-6 mb-6">Mitt konto</h1>

      {!subscription ? (
        <>
          {console.log("Rendering PickSubscription component")}
          <PickSubscription
            availablePlans={availablePlans}
            onSelectPlan={(planId) => {
              handleActivateSubscription(planId);
            }}
          />
        </>
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
            <div className={`mt-4 flex space-x-4`}>
              <button
                onClick={() => console.log("Cancel Subscription")}
                className={`px-6 py-2 ${styles["btn-error"]}`}
              >
                Avsluta prenumeration
              </button>
            </div>
          </div>

          <div className={`p-6 mt-6`}>
            <h3 className={`text-xl font-bold mb-4`}>Byt prenumerationsbox</h3>
            <select
              value={""}
              onChange={() => console.log("Change Subscription")}
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
            <button onClick={() => console.log("Confirm Change")} className="btn mt-2 px-6 py-2">
              Bekfräfta
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
