"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartPlus } from "@fortawesome/free-solid-svg-icons";
import { useCart } from '@/app/context/CartContext';
import { ShopProduct } from '@/types/shop';
import RelatedProducts from './related-products';

interface ProductDetailsProps {
  product: ShopProduct;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const { addToCart, setIsMinicartOpen } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<ShopProduct[]>([]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const response = await fetch('https://backend.equibox.se/wp-json/membershop/v1/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setRelatedProducts(data);
      } catch (error) {
        console.error('Error fetching related products:', error);
      }
    };

    fetchRelatedProducts();
  }, []);

  const handleAddToCart = () => {
    addToCart({ ...product, quantity: quantity });
    setIsMinicartOpen(true);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  return (
    <>
      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <div className="overflow-hidden rounded-lg bg-base-200">
          <Image
            src={product.image_url}
            alt={product.title}
            width={600}
            height={600}
            className="w-full object-contain bg-base-200 rounded-lg"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
          <p className="text-3xl font-bold mb-6">{product.price} kr</p>
          
          <div className="flex gap-4 items-center max-w-md">
            {/* Quantity Selector */}
            <div className="flex items-center gap-2">
              <button 
                onClick={decreaseQuantity}
                className="text-xl font-medium px-2 hover:text-primary transition-colors"
                disabled={quantity <= 1}
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center border-b border-base-300 focus:outline-none focus:border-primary"
                min="1"
              />
              <button 
                onClick={increaseQuantity}
                className="text-xl font-medium px-2 hover:text-primary transition-colors"
              >
                +
              </button>
            </div>

            {/* Add to Cart Button */}
            <button 
              onClick={handleAddToCart}
              className="btn btn-primary flex-1"
              aria-label="Lägg i kundvagn"
            >
              <FontAwesomeIcon icon={faCartPlus} className="mr-2" />
              Lägg i kundvagn
            </button>
          </div>

          {/* Shipping and Payment Info */}
          <div className="mt-6 bg-base-200 rounded-lg p-4 max-w-md">
            <div className="flex items-center gap-3 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>60 dagars öppet köp</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>Betala tryggt med Stripe</span>
            </div>
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>Skickas inom 2-4 arbetsdagar</span>
            </div>
          </div>
          
          <div className="space-y-4 mt-8">
            <h2 className="text-xl font-bold">Produktbeskrivning</h2>
            <p className="text-base-content/80">{product.description}</p>
          </div>
        </div>
      </div>
      
      <RelatedProducts products={relatedProducts} />
    </>
  );
} 