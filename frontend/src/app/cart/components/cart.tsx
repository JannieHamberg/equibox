"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from '@/app/context/CartContext';

interface CartItem {
  id: number;
  title: string;
  price: number;
  description: string;
  image_url: string;
  category: string;
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { updateCartCount } = useCart();

  // Load cart items
  useEffect(() => {
    const savedCart = localStorage.getItem("shopCart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(Array.isArray(parsedCart) ? parsedCart : []);
      } catch (error) {
        console.error("Error parsing cart:", error);
        setCartItems([]);
      }
    }
  }, []);

  const handleRemoveItem = (itemId: number) => {
    const updatedCart = cartItems.filter((item) => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem("shopCart", JSON.stringify(updatedCart));
    updateCartCount(); // Update the cart count in navbar
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: cartItems }),
      });
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="container mx-auto mt-32 p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Din kundvagn</h1>
      {(!cartItems || cartItems.length === 0) ? (
        <div className="card bg-base-100 shadow-xl p-8 text-center">
          <p className="text-lg">Kundvagnen är tom</p>
        </div>
      ) : (
        <>
          <div className="card bg-base-100 shadow-xl">
            {cartItems.map((item) => (
              <div key={item.id} className="p-6 border-b last:border-b-0">
                <div className="flex items-start gap-4">
                  {item.image_url && (
                    <div className="w-24 h-24 relative">
                      <img 
                        src={item.image_url} 
                        alt={item.title}
                        className="object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                    <p className="text-lg font-medium mt-2">
                      {item.price} kr
                    </p>
                  </div>
                  <button 
                    className="btn btn-sm btn-error"
                    onClick={() => handleRemoveItem(item.id)}
                    aria-label="Ta bort produkt"
                  >
                    Ta bort
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 card bg-base-100 shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-semibold">Totalt:</span>
              <span className="text-xl font-bold">
                {cartItems.reduce((sum, item) => sum + Number(item.price), 0).toFixed(2)} kr
              </span>
            </div>
            <button 
              className="btn btn-primary w-full"
              onClick={handleCheckout}
              aria-label="Gå vidare till betalning"
            >
              Gå vidare till betalning
            </button>
          </div>
        </>
      )}
    </div>
  );
}
