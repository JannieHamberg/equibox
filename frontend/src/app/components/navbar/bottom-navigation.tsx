"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faHome, faShoppingBag, faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { useCart } from '@/app/context/CartContext';

export default function BottomNavigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { cartCount } = useCart();

  // Function to check login status
  const checkLoginStatus = () => {
    const token = sessionStorage.getItem("authToken");
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const isTokenExpired = payload.exp * 1000 < Date.now();
      return !isTokenExpired;
    } catch (err) {
      console.error("Invalid token", err);
      return false;
    }
  };

  useEffect(() => {
    setIsLoggedIn(checkLoginStatus());
  }, []);

  return (
    <div className="btm-nav md:hidden z-50">
      <Link href="/" className="text-base-content">
        <FontAwesomeIcon icon={faHome} className="h-5 w-5 text-base-content" />
        <span className="btm-nav-label text-base-content">Hem</span>
      </Link>
      
      <Link href="/member-shop" className="text-base-content">
        <FontAwesomeIcon icon={faShoppingBag} className="h-5 w-5 text-base-content" />
        <span className="btm-nav-label text-base-content">Shop</span>
      </Link>

      <Link href="/cart" className="text-base-content relative">
        <FontAwesomeIcon icon={faShoppingCart} className="h-5 w-5 text-base-content" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-primary text-primary-content rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {cartCount}
          </span>
        )}
        <span className="btm-nav-label text-base-content">Varukorg</span>
      </Link>

      <Link href={isLoggedIn ? "/userprofile" : "/login"} className="text-base-content">
        <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-base-content" />
        <span className="btm-nav-label text-base-content">Konto</span>
      </Link>
    </div>
  );
} 