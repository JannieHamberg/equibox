"use client";

import { useEffect, useState } from "react";
import ProductDetails from "../../components/product-details";
import { ShopProduct } from '@/types/shop';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ProductPage() {
  const params = useParams();
  const id = params?.id as string;
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        // Fetch all products and find the specific one
        const response = await fetch('https://backend.equibox.se/wp-json/membershop/v1/products');
        if (!response.ok) throw new Error('Products not found');
        const data = await response.json();
        
        // Find the specific product by ID
        const foundProduct = data.find((p: ShopProduct) => p.id.toString() === id);
        if (!foundProduct) throw new Error('Product not found');
        
        setProduct(foundProduct);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) return <div className="mt-32 text-center">Loading...</div>;
  if (!product) return <div className="mt-32 text-center">Product not found</div>;
  return (
    <div className="container mx-auto px-4">
      {/* Breadcrumbs */}
      <div className="text-sm breadcrumbs mt-20 md:mt-32">
        <ul>
          <li><Link href="/">Hem</Link></li>
          <li><Link href="/member-shop">Medlemsbutik</Link></li>
          <li>{product?.title || 'Produkt'}</li>
        </ul>
      </div>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : !product ? (
        <div className="text-center">Product not found</div>
      ) : (
        <ProductDetails product={product} />
      )}
    </div>
  );
} 