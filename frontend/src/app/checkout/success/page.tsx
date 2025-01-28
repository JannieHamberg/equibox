'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/app/context/CartContext';

export default function CheckoutSuccess() {
  const router = useRouter();
  const { updateCartCount } = useCart();

  useEffect(() => {
    // Clear the cart after successful payment
    localStorage.removeItem('shopCart');
    updateCartCount();
  }, [updateCartCount]);

  return (
    <div className="container mx-auto mt-32 p-4 max-w-3xl">
      <div className="card bg-base-100 shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Tack för din beställning!</h1>
        <p className="mb-6">Din betalning har genomförts och ordern är bekräftad.</p>
        <button 
          onClick={() => router.push('/member-shop')}
          className="btn btn-primary"
        >
          Tillbaka till butiken
        </button>
      </div>
    </div>
  );
} 