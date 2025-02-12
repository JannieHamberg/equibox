"use client";
import styles from "../userprofile.module.css";
import { useEffect, useState } from "react";
import LogoutButton from "./logout-btn";
import PickSubscription from "./pick-subscription";
import { Subscription, SubscriptionPlan, StripeSubscription, SubscriptionWithUserDetails, SubscriptionStatus } from '@/types/subscription';
import Link from 'next/link';
import UpdateSubscription from "./update-subscription";
import { useRouter } from "next/navigation";

export default function UserDashboard() {
  console.log("Rendering UserDashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionWithUserDetails | null | undefined>(undefined);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchUserSubscription(),
          fetchAvailablePlans()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for both URL param and direct navigation from checkout
      const urlParams = new URLSearchParams(window.location.search);
      const checkoutSuccess = urlParams.get('checkout_success') === 'true';
      const fromCheckout = sessionStorage.getItem('fromCheckout') === 'true';

      if (checkoutSuccess || fromCheckout) {
        console.log('Detected successful checkout, refreshing subscription data');
        fetchUserSubscription();
        // Clean up
        sessionStorage.removeItem('fromCheckout');
        if (checkoutSuccess) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, []);

  const fetchUserSubscription = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/user/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response Status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('No subscription found or unauthorized');
          setSubscription(null);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('DEBUG - Full subscription data:', data);

      if (data.success && data.data && data.data.length > 0) {
        const sortedSubscriptions = data.data
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // First try to find an active subscription
        const activeSubscription = sortedSubscriptions.find((sub: SubscriptionWithUserDetails) => sub.status === 'active');
        // If no active subscription, then look for canceled one
        const canceledSubscription = !activeSubscription ? 
          sortedSubscriptions.find((sub: SubscriptionWithUserDetails) => sub.status === 'canceled') : null;
        // Use active first, then canceled, then most recent
        const latestSubscription = activeSubscription || canceledSubscription || sortedSubscriptions[0];

        console.log('Latest subscription:', latestSubscription);
        setSubscription(latestSubscription || null);
      } else {
        setSubscription(null);
      }

    } catch (error) {
      console.error('Error fetching subscription:', error);
      setError('Ett fel uppstod vid hämtning av prenumerationsdata.');
      setSubscription(null);
    } finally {
      setIsLoading(false);
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
        data.data.map((plan: SubscriptionPlan) => ({
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

  const handleConfirmSubscription = async (planId: number) => {
    try {
      const endpoint = subscription ? "/user/subscription/update" : "/user/subscribe";
      const method = subscription ? "PUT" : "POST";

      const selectedPlan = availablePlans.find(plan => plan.id === planId);
      if (!selectedPlan) {
        throw new Error("Selected plan not found");
      }

      const payload = {
        plan_id: planId,
        stripe_plan_id: selectedPlan.stripe_plan_id,
        email: subscription?.email,    // Use email from existing subscription
        name: subscription?.name       // Use name from existing subscription
      };

      console.log("Payload being sent:", JSON.stringify(payload));

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process subscription.");
      }

      alert("Prenumerationen har uppdaterats!");
      await fetchUserSubscription(); // Refresh subscription data
    } catch (err) {
      console.error("Error confirming subscription:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Är du säker på att du vill avsluta din prenumeration?')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('authToken');
      console.log('Current subscription:', subscription);
      
      if (!token || !subscription?.stripe_subscription_id) {
        console.error('Missing data:', {
          token: !!token,
          subscriptionId: subscription?.stripe_subscription_id
        });
        throw new Error('Missing required data for cancellation');
      }

      const response = await fetch('/user/subscription/cancel', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription_id: subscription.stripe_subscription_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          setError(errorData.message || 'Kunde inte avsluta prenumerationen - kontrollera status.');
          await fetchUserSubscription();
          return;
        }
        throw new Error(errorData.message || 'Failed to cancel subscription');
      }

      const data = await response.json();
      console.log('Cancel response:', data);

      // Immediately fetch updated subscription data
      await fetchUserSubscription();
      
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setError('Ett fel uppstod vid avslutning av prenumerationen.');
    }
  };

  const isNewUser = subscription === null || subscription === undefined;

  // Show initial loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Then show error if any
  if (error) {
    return <div>Error: {error}</div>;
  }

  // Check if data is actually available
  if (!availablePlans.length || subscription === undefined) {
    return <div>Loading data...</div>;
  }

  return (
    <div className="mt-40 max-w-3xl mx-auto p-4 bg-base-100 shadow-2xl rounded-lg">
      <h1 className="text-3xl font-bold pl-6 mb-2 md:mb-6">Mitt konto</h1>

      {isNewUser ? (
        <div>
          <PickSubscription
            availablePlans={availablePlans}
            onSelectPlan={(planId) => {
              const selectedPlan = availablePlans.find(plan => plan.id === planId);
              if (selectedPlan) {
                // New user flow
                const userEmail = sessionStorage.getItem("userEmail");
                const userName = sessionStorage.getItem("userName");
                
                if (!userEmail || !userName) {
                  alert("Kunde inte hitta användarinformation. Försök logga in igen.");
                  router.push("/login");
                  return;
                }

                sessionStorage.setItem("subscriptionPlan", JSON.stringify({
                  ...selectedPlan,
                  userEmail,
                  userName
                }));
                router.push("/checkout");
              } else {
                alert("Kunde inte hitta den valda prenumerationsplanen. Försök igen.");
              }
            }}
          />
        </div>
      ) : (
        <div>
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <div className="mb-6">
                <h2 className="card-title mb-2 flex flex-col">
                  <div className="font-bold">Din prenumerationsbox:</div>
                  <div className="font-normal">{subscription.name}</div>
                </h2>
                <p className="text-base-content/70">{subscription.description}</p>
              </div>

              <div className="stats bg-base-100 shadow">
                <div className="stat">
                  <div className="stat-title">Pris</div>
                  <div className="stat-value text-lg">
                    {subscription.price} SEK
                  </div>
                  <div className="stat-desc">
                    {subscription.interval === "monthly" ? "månadsvis" : subscription.interval}
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-title">Status</div>
                  <div className={`stat-value text-lg ${
                    subscription.status === ('active' as SubscriptionStatus) ? 'text-green-500' :
                    subscription.status === ('canceled' as SubscriptionStatus) ? 'text-red-500' :
                    subscription.status === ('incomplete' as SubscriptionStatus) ? 'text-yellow-500' : ''
                  }`}>
                    {subscription.status === ('active' as SubscriptionStatus) ? 'Aktiv' : 
                     subscription.status === ('canceled' as SubscriptionStatus) ? 'Avslutad' :
                     subscription.status === ('incomplete' as SubscriptionStatus) ? 'Ofullständig' : 
                     subscription.status}
                  </div>
                </div>
              </div>

              {subscription.status === 'active' && (
                <>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <button
                      onClick={() => setShowPlans(!showPlans)}
                      className="btn btn-primary"
                    >
                      {showPlans ? 'Stäng' : 'Ändra prenumeration'}
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      className="btn-error text-red-500"
                    >
                      Avsluta prenumeration
                    </button>
                  </div>
                  
                  {showPlans && (
                    <div className="mt-4">
                      <UpdateSubscription 
                        availablePlans={availablePlans}
                        onSelectPlan={(planId) => {
                          if (window.confirm('Är du säker på att du vill ändra din prenumeration?')) {
                            handleConfirmSubscription(planId);
                            setShowPlans(false);
                          }
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <div className="flex-shrink-0">
              <LogoutButton />
            </div>
          </div>

          {subscription?.status === 'canceled' && (
            <div className="mt-6">
              <p className="text-gray-600 mb-4">Din prenumeration är avslutad.</p>
              <PickSubscription
                availablePlans={availablePlans}
                onSelectPlan={(planId) => {
                  const selectedPlan = availablePlans.find(plan => plan.id === planId);
                  if (selectedPlan && subscription) {
                    const typedSubscription = subscription as SubscriptionWithUserDetails;
                    sessionStorage.setItem("subscriptionPlan", JSON.stringify({
                      ...selectedPlan,
                      userEmail: typedSubscription.email,
                      userName: typedSubscription.name
                    }));
                    router.push("/checkout");
                  }
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
