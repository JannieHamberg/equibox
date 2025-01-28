'use client';

import { useCart } from '@/app/context/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faTimes, faCartPlus } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ShopProduct, CartItem } from '@/types/shop';

export default function Minicart() {
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    isMinicartOpen, 
    setIsMinicartOpen,
    addToCart
  } = useCart();

  const [recommendedProducts, setRecommendedProducts] = useState<ShopProduct[]>([]);
  
  // Fetch some random products to show as recommendations
  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      try {
        const response = await fetch('https://backend.equibox.se/wp-json/membershop/v1/products?per_page=4');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setRecommendedProducts(data);
      } catch (error) {
        console.error('Error fetching recommended products:', error);
        setRecommendedProducts([]);
      }
    };
    
    fetchRecommendedProducts();
  }, []);

  if (!isMinicartOpen) return null;

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50"
      onClick={() => setIsMinicartOpen(false)}
    >
      <div 
        className="absolute right-0 top-0 h-full w-96 bg-base-100 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-bold">Din varukorg</h2>
            <button 
              onClick={() => setIsMinicartOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.map((item, index: number) => (
              <div key={`${item.id}-${index}`} className="flex gap-4 mb-4 pb-4 border-b">
                <Image
                  src={item.image_url}
                  alt={item.title}
                  width={80}
                  height={80}
                  className="object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm">{item.price} kr</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="text-gray-500 hover:text-primary"
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="text-gray-500 hover:text-primary"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 mt-8 border-t">
            <h3 className="font-bold mb-4">Titta även på</h3>
            <div className="overflow-x-auto flex gap-2 pb-2">
              {recommendedProducts && recommendedProducts.length > 0 && recommendedProducts.map((product) => (
                <div key={product.id} className="flex-none w-[calc(50%-4px)]">
                  <Image
                    src={product.image_url}
                    alt={product.title}
                    width={200}
                    height={200}
                    className="w-full aspect-square object-cover mb-2"
                  />
                  <p className="font-medium truncate">{product.title}</p>
                  <p className="text-sm mb-1">{product.price} kr</p>
                  <button 
                    onClick={() => {
                      addToCart({ ...product, quantity: 1 });
                    }}
                    className="text-gray-600 hover:text-primary transition-colors"
                    aria-label="Lägg i kundvagn"
                  >
                    <FontAwesomeIcon icon={faCartPlus} className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t">
            <div className="flex justify-between mb-4">
              <span className="font-bold">Totalt:</span>
              <span className="font-bold">{total} kr</span>
            </div>
            <Link
              href="/cart"
              className="btn btn-primary w-full mb-2"
              onClick={() => setIsMinicartOpen(false)}
            >
              Till kassan
            </Link>
            <button
              onClick={() => setIsMinicartOpen(false)}
              className="btn btn-ghost w-full"
            >
              Fortsätt handla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 