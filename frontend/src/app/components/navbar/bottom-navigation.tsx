"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faHome, faShoppingBag } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

export default function BottomNavigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
      <Link href="/" className="text-gray-900">
        <FontAwesomeIcon icon={faHome} className="h-5 w-5" />
        <span className="btm-nav-label">Hem</span>
      </Link>
      
      <Link href="/member-shop" className="text-gray-900">
        <FontAwesomeIcon icon={faShoppingBag} className="h-5 w-5" />
        <span className="btm-nav-label">Member Shop</span>
      </Link>

      <Link href={isLoggedIn ? "/userprofile" : "/login"} className="text-gray-900">
        <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
        <span className="btm-nav-label">Konto</span>
      </Link>
    </div>
  );
} 