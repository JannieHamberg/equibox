"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faList, faGrip } from "@fortawesome/free-solid-svg-icons";
import { useCart } from '@/app/context/CartContext';

interface ShopProduct {
  id: number;
  image_url: string;
  title: string;
  description: string;
  price: number;
  category: string;
  created_at: string;
}

interface Category {
  title: string;
  slug: string;
  image_url: string; 
}

export default function MemberShopLayout() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [allProducts, setAllProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const { updateCartCount } = useCart();

  // Fetch categories 
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("https://backend.equibox.se/wp-json/membershop/v1/categories");
        if (!res.ok) {
          throw new Error(`Error fetching categories: ${res.status}`);
        }
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products when category or price changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const url = new URL("https://backend.equibox.se/wp-json/membershop/v1/filtered-products");
        
        if (selectedCategory) {
          url.searchParams.append("category", selectedCategory);
        }
        
        // Price range parameters
        url.searchParams.append("min_price", priceRange.min.toString());
        url.searchParams.append("max_price", priceRange.max.toString());

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Error fetching products: ${res.status}`);
        }
        const data = await res.json();
        
        // Store all products when no category is selected
        if (!selectedCategory) {
          setAllProducts(data);
        }
        
        const filteredData = data.filter((product: ShopProduct) => 
          product.price >= priceRange.min && 
          product.price <= priceRange.max
        );
        
        setProducts(filteredData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, priceRange]);

  // Handle category click
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  // Reset filters function
  const resetFilters = () => {
    setSelectedCategory(null);
    setPriceRange({ min: 0, max: 1000 });
  };

  // count products per category
  const getProductCountForCategory = (categorySlug: string) => {
    return allProducts.filter(product => product.category === categorySlug).length;
  };

  // price filtering
  const handlePriceChange = (value: number) => {
    setPriceRange(prev => ({ ...prev, max: value }));
  };

  const sortProducts = (products: ShopProduct[], order: string) => {
    return [...products].sort((a, b) => {
      switch (order) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        default:
          return 0;
      }
    });
  };

  const handleAddToCart = (product: ShopProduct) => {
    const existingCart = localStorage.getItem('shopCart');
    const cartItems = existingCart ? JSON.parse(existingCart) : [];
    cartItems.push(product);
    localStorage.setItem('shopCart', JSON.stringify(cartItems));
    updateCartCount();
    alert('Produkt tillagd i kundvagnen!');
  };

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-[1280px] mx-auto mt-32">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-12 text-base-content">
          Välkommen till medlemsbutiken
        </h1>

        {/* Categories Section */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-12">
            {categories.map((category, index) => (
              <div
                key={index}
                className="text-center cursor-pointer"
                onClick={() => handleCategoryClick(category.slug)}
              >
                <div className="relative h-[200px] mb-2 bg-base-200 rounded-lg overflow-hidden">
                  <Image
                    src={category.image_url}
                    alt={category.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 200px"
                  />
                  <div className="absolute inset-0 ">
                    <div className="absolute top-2 left-2">
                      <span className="text-sm font-medium text-white">Välj</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-md font-bold text-white">
                        {category.title}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-base-content">
                  {getProductCountForCategory(category.slug)} produkter
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Filter and products layout */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full md:w-64 space-y-4">
            <button 
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:underline mb-4 block"
            >
              Återställ filter
            </button>

            {/* Filter section
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" defaultChecked />
              <div className="collapse-title font-medium">Rabatt</div>
              <div className="collapse-content">
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Endast på Rea</span>
                    <input type="checkbox" className="checkbox" />
                  </label>
                </div>
              </div>
            </div>
            */}

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" defaultChecked />
              <div className="collapse-title font-medium">Pris</div>
              <div className="collapse-content">
                <div className="form-control">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="100"
                    value={priceRange.max}
                    onChange={(e) => handlePriceChange(Number(e.target.value))}
                    className="range"
                  />
                  <div className="flex justify-between text-xs px-2">
                    <span>0 kr</span>
                    <span>{priceRange.max} kr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Area */}
          <div className="flex-1">
            {/* View toggle and sort */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-base-200' : ''}`}
                  aria-label="Grid view"
                >
                  <FontAwesomeIcon icon={faGrip} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-base-200' : ''}`}
                  aria-label="List view"
                >
                  <FontAwesomeIcon icon={faList} />
                </button>
              </div>
              <select 
                className="select select-bordered select-sm"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="newest">Datum, nyast först</option>
                <option value="oldest">Datum, äldst först</option>
                <option value="price-asc">Pris, lägst först</option>
                <option value="price-desc">Pris, högst först</option>
              </select>
            </div>

            {loading ? (
              <p className="text-center text-lg">Laddar produkter...</p>
            ) : products.length > 0 ? (
              <div className={`
                ${viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                  : 'flex flex-col gap-4'
                }
              `}>
                {sortProducts(products, sortOrder).map((product) => (
                  <div 
                    key={product.id} 
                    className={`
                      bg-base-100 shadow-xl rounded-lg overflow-hidden flex flex-col
                      ${viewMode === 'list' ? 'flex-row' : ''}
                    `}
                  >
                    <div className={`
                      ${viewMode === 'list' ? 'w-1/3' : 'w-full'}
                    `}>
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <div className={`
                      p-4 flex flex-col justify-between h-full
                      ${viewMode === 'list' ? 'w-2/3' : 'w-full'}
                    `}>
                      <div>
                        <h3 className="text-lg font-semibold">{product.title}</h3>
                        <p className="text-gray-600 mt-2">{product.description}</p>
                      </div>
                      <div className="mt-auto">
                        <p className="text-lg font-bold mb-2">{product.price} kr</p>
                        <button 
                          onClick={() => handleAddToCart(product)}
                          className="btn btn-primary btn-sm"
                        >
                          Lägg i kundvagn
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-lg">Inga produkter tillgängliga.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
