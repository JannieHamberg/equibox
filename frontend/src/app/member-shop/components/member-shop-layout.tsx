"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faList, faGrip, faInfoCircle, faCartPlus } from "@fortawesome/free-solid-svg-icons";
import { useCart } from '@/app/context/CartContext';
import { ShopProduct, Category } from '@/types/shop';
import { useRouter } from 'next/navigation';

export default function MemberShopLayout() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [allProducts, setAllProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const { updateCartCount, addToCart, setIsMinicartOpen } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const router = useRouter();

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
    addToCart({ ...product, quantity: 1 });
    updateCartCount();
    setIsMinicartOpen(true);
  };

  const openProductModal = (product: ShopProduct) => {
    setSelectedProduct(product);
    const modal = document.getElementById('product_modal') as HTMLDialogElement;
    if (modal) modal.showModal();
  };

  const handleProductClick = (productId: number) => {
    router.push(`/member-shop/product/${productId}`);
  };

  return (
    // Add overflow-x-hidden to prevent horizontal scroll
    <div className="overflow-x-hidden">
      <div className="container mx-auto px-4">
        {/* Adjust top margin to prevent navbar overlap */}
        <div className="max-w-[1280px] mx-auto mt-20 md:mt-32">
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
                >
                  <div 
                    className="relative mb-2 transition-transform duration-200 hover:scale-95"
                    onClick={() => handleCategoryClick(category.slug)}
                  >
                    <div className="relative h-[200px] bg-base-200 rounded-lg overflow-hidden">
                      <Image
                        src={category.image_url}
                        alt={category.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 200px"
                      />
                      <div className="absolute inset-0">
                        <div className="absolute top-2 left-2">
                          <span className="text-sm font-medium text-white">
                            {selectedCategory === category.slug ? 'Vald' : 'Välj'}
                          </span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-md font-bold text-white">
                            {category.title}
                          </p>
                        </div>
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
                    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                    : 'flex flex-col gap-4'
                  }
                `}>
                  {sortProducts(products, sortOrder).map((product) => (
                    <div 
                      key={product.id} 
                      className={`relative group ${
                        viewMode === 'list' 
                          ? 'flex gap-4 border-b pb-4'
                          : ''
                      }`}
                      onClick={() => handleProductClick(product.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={`relative ${
                        viewMode === 'list' 
                          ? 'w-48 flex-shrink-0'
                          : ''
                      }`}>
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className={`${
                            viewMode === 'list'
                              ? 'w-48 h-48 object-cover'
                              : 'w-full aspect-square object-cover'
                          }`}
                        />
                        {/* Info icon with tooltip - lighter grey color */}
                        <button 
                          onClick={() => openProductModal(product)}
                          className="absolute top-2 left-2 text-gray-400 hover:text-primary transition-colors tooltip"
                          data-tip="Detaljer"
                          aria-label="Product information"
                        >
                          <FontAwesomeIcon icon={faInfoCircle} className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className={`${
                        viewMode === 'list'
                          ? 'flex-1 flex flex-col justify-between'
                          : 'mt-3 space-y-1'
                      }`}>
                        <div>
                          <h3 className={`text-sm font-medium ${viewMode === 'list' ? 'text-left' : 'text-center'}`}>
                            {product.title}
                          </h3>
                          <p className={`text-sm font-medium ${viewMode === 'list' ? 'text-left' : 'text-center'}`}>
                            {product.price} kr
                          </p>
                        </div>
                        <div className={`flex ${viewMode === 'list' ? 'justify-start' : 'justify-end'} px-2`}>
                          <button 
                            onClick={() => handleAddToCart(product)}
                            className="text-base-content hover:text-primary transition-colors tooltip"
                            data-tip="Lägg i kundvagn"
                            aria-label="Add to cart"
                          >
                            <FontAwesomeIcon icon={faCartPlus} className="h-5 w-5" />
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

      {/* Product Modal */}
      <dialog id="product_modal" className="modal">
        <div className="modal-box">
          {selectedProduct && (
            <>
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.title}
                className="w-full aspect-square object-cover mb-4"
              />
              <h3 className="font-bold text-lg mb-2">{selectedProduct.title}</h3>
              <p className="py-2">{selectedProduct.description}</p>
              <p className="text-lg font-medium">{selectedProduct.price} kr</p>
              <div className="modal-action">
                <form method="dialog">
                  <button className="btn">Stäng</button>
                </form>
              </div>
            </>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
