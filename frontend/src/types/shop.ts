export interface ShopProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  image_url: string;
  category: string;
  created_at: string;
}

export interface Category {
  title: string;
  slug: string;
  image_url: string;
}

export interface CartItem extends ShopProduct {
  quantity: number;
}

export interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  isMinicartOpen: boolean;
  setIsMinicartOpen: (isOpen: boolean) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  updateCartCount: () => void;
} 