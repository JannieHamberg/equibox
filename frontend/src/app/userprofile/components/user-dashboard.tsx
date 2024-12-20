"use client";
import styles from "../userprofile.module.css";
import { useEffect, useState } from "react";
import LogoutButton from "./logout-btn";
import PickSubscription from "./pick-subscription"; // Import the PickSubscription component

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
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserSubscription();
    fetchAvailablePlans();
  }, []);

  // Fetch the user's current subscription
  const fetchUserSubscription = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Användaren är inte inloggad.");
      }
  
      const response = await fetch("/user/subscription", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (response.status === 404) {
        console.log("Ingen prenumeration hittades på användaren."); 
        setSubscription(null); // No subscription, let the PickSubscription component show
        return;
      }
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error("Misslyckades att hämta användarens prenumeration.");
      }
  
      const data = await response.json();
      console.log("Subscription data:", data);
      setSubscription(data.data[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error(err);
    }
  };
  
  
  // Fetch all available subscription plans
  const fetchAvailablePlans = async () => {
    try {
      const response = await fetch("/subscriptions/prenumerationer", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) throw new Error("Failed to fetch available plans");
  
      const data = await response.json();
      console.log("Available plans data:", data);
  
      // Map over the data to ensure image_url exists
      const plansWithImage = data.data.map((plan: any) => ({
        ...plan,
        image_url: plan.image_url || "default_image_url_here", /* TODO: add default iamge url */
      }));
  
      setAvailablePlans(plansWithImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error(err);
    }
  };
  
  const handleActivateSubscription = async (planId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("User is not logged in");
      }

      const response = await fetch("/user/subscription/update", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan_id: planId }),
      });

      if (!response.ok) throw new Error("Failed to activate subscription");

      alert("Subscription activated successfully!");
      fetchUserSubscription(); 
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error(err);
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!availablePlans.length) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`mt-40 max-w-screen-md mx-auto p-4 bg-stone-100 ${styles.shadow} ${styles.rounded}`}>
      <h1 className="text-3xl font-bold pl-6 mb-6">Mitt konto</h1>

      {/* Render PickSubscription if no active subscription */}
      {!subscription ? (
        <PickSubscription
          availablePlans={availablePlans}
          onSelectPlan={handleActivateSubscription}
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
