"use client";

import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartPlus } from "@fortawesome/free-solid-svg-icons";
import { useCart } from '@/app/context/CartContext';
import { ShopProduct } from '@/types/shop';

interface RelatedProductsProps {
  products: ShopProduct[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  const { addToCart, setIsMinicartOpen } = useCart();

  const handleAddToCart = (product: ShopProduct) => {
    addToCart({ ...product, quantity: 1 });
    setIsMinicartOpen(true);
  };

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold mb-8">Du kanske också gillar</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.slice(0, 4).map((product) => (
          <div key={product.id} className="group relative">
            <div className="relative aspect-square mb-2">
              <Image
                src={product.image_url}
                alt={product.title}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <div className="text-sm space-y-1">
              <h3 className="font-medium">{product.title}</h3>
              <div className="flex justify-between items-center">
                <p className="font-bold">{product.price} kr</p>
                <button 
                  onClick={() => handleAddToCart(product)}
                  className="rounded-full bg-white p-1.5 hover:scale-110 transition-transform"
                >
                  <FontAwesomeIcon icon={faCartPlus} className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 