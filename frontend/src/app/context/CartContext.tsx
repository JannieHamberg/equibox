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
  isMinicartOpen: false,
  setIsMinicartOpen: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [isMinicartOpen, setIsMinicartOpen] = useState(false);

  const addToCart = (product: CartItem) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1, cartId: `${product.id}-${Date.now()}` }];
    });
    updateCartCount();
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    updateCartCount();
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
    updateCartCount();
  };

  const updateCartCount = () => {
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
    localStorage.setItem('shopCart', JSON.stringify(cartItems));
  };

  useEffect(() => {
    const savedCart = localStorage.getItem('shopCart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCartItems(parsedCart);
      setCartCount(parsedCart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0));
    }
  }, []);

  return (
    <CartContext.Provider value={{
      cartCount,
      cartItems,
      updateCartCount,
      addToCart,
      removeFromCart,
      updateQuantity,
      isMinicartOpen,
      setIsMinicartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext); 