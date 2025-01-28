"use client";
import React from "react";
import { useCart } from '@/app/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const router = useRouter();

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckoutAsync = async () => {
    if (cartItems.length === 0) return;
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems }),
      });
      
      const { url } = await response.json();
      router.push(url);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="container mx-auto mt-32 p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Din kundvagn</h1>
      
      {cartItems.length === 0 ? (
        <div className="card bg-base-100 shadow-xl p-8 text-center">
          <p className="text-lg">Kundvagnen är tom</p>
          <Link href="/member-shop" className="btn btn-primary mt-4">
            Fortsätt handla
          </Link>
        </div>
      ) : (
        <>
          <div className="card bg-base-100 shadow-xl">
            {cartItems.map((item) => (
              <div key={item.id} className="p-6 border-b last:border-b-0">
                <div className="flex items-start gap-4">
                  {item.image_url && (
                    <div className="w-24 h-24 relative">
                      <Image 
                        src={item.image_url} 
                        alt={item.title}
                        width={500}
                        height={300}
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                    <p className="text-lg font-medium mt-2">
                      {item.price} kr
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="btn btn-sm btn-ghost"
                      >
                        <FontAwesomeIcon icon={faMinus} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="btn btn-sm btn-ghost"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-red-500"
                    aria-label="Ta bort"
                  >
                    <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 card bg-base-100 shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-semibold">Totalt:</span>
              <span className="text-xl font-bold">
                {total} kr
              </span>
            </div>
            <button 
              className="btn btn-primary w-full mb-4 transform-none hover:scale-100"
              onClick={handleCheckoutAsync}
            >
              Gå vidare till betalning
            </button>
            <Link href="/member-shop" className="btn btn-ghost w-full transform-none hover:scale-100">
              Fortsätt handla
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
