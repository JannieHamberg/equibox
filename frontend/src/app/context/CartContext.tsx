'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface CartContextType {
  cartCount: number;
  updateCartCount: () => void;
}

const CartContext = createContext<CartContextType>({
  cartCount: 0,
  updateCartCount: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0);

  const updateCartCount = () => {
    const cart = localStorage.getItem('shopCart');
    const cartItems = cart ? JSON.parse(cart) : [];
    setCartCount(cartItems.length);
  };

  useEffect(() => {
    updateCartCount();
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, updateCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext); 