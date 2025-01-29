'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { CartContextType, CartItem } from '@/types/shop';

export const CartContext = createContext<CartContextType>({
  cartCount: 0,
  cartItems: [],
  updateCartCount: () => {},
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  isMinicartOpen: false,
  setIsMinicartOpen: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [isMinicartOpen, setIsMinicartOpen] = useState(false);

  useEffect(() => {
    const newCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    setCartCount(newCount);
  }, [cartItems]);

  useEffect(() => {
    const savedCart = localStorage.getItem('shopCart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCartItems(parsedCart);
    }
  }, []);

  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem('shopCart', JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = (product: CartItem & { quantity: number }) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + product.quantity
        };
        return updatedItems;
      } else {
        return [...prevItems, product];
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCartCount(0);
    localStorage.removeItem('shopCart');
  };

  const updateCartCount = () => {
    const newCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    setCartCount(newCount);
  };

  return (
    <CartContext.Provider value={{
      cartCount,
      cartItems,
      updateCartCount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isMinicartOpen,
      setIsMinicartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext); 