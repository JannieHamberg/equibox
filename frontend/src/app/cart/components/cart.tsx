"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SubscriptionItem {
  id: number;
  name: string;
  price: number;
  interval: string;
  stripe_plan_id: string;
  description?: string;
  image_url?: string;
}

export default function Cart() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<SubscriptionItem[]>([]);

  // Load cart items from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const handleRemoveItem = (itemId: number) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

/*   const handleAddSubscription = (subscription: SubscriptionItem) => {
   
    setCartItems([subscription]);
  }; */

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    const subscriptionPlan = cartItems[0];
    console.log('Storing plan data:', subscriptionPlan); // Debug log
    
    sessionStorage.setItem('subscriptionPlan', JSON.stringify({
      id: subscriptionPlan.id,
      name: subscriptionPlan.name,
      price: subscriptionPlan.price,
      interval: subscriptionPlan.interval,
      stripe_plan_id: subscriptionPlan.stripe_plan_id,
      description: subscriptionPlan.description
    }));
    
    router.push('/checkout');
  };

  return (
    <div className="container mx-auto mt-32 p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Subscription Box</h1>
      {cartItems.length === 0 ? (
        <div className="card bg-base-100 shadow-xl p-8 text-center">
          <p className="text-lg">No subscription box selected</p>
        </div>
      ) : (
        <>
          <div className="card bg-base-100 shadow-xl">
            {cartItems.map((item) => (
              <div key={item.id} className="p-6">
                <div className="flex items-start gap-4">
                  {item.image_url && (
                    <div className="w-24 h-24 relative">
                    {/*   <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="object-cover rounded-lg"
                      /> */}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{item.name}</h3>
                    <p className="text-gray-600">{item.description}</p>
                    <p className="text-lg font-medium mt-2">
                      {item.price} SEK / {item.interval}
                    </p>
                  </div>
                  <button 
                    className="btn btn-sm btn-error"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 card bg-base-100 shadow-xl p-6">
            <button 
              className="btn btn-primary w-full"
              onClick={handleCheckout}
            >
              Subscribe Now
            </button>
          </div>
        </>
      )}
    </div>
  );
}
