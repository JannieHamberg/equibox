"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import Link from "next/link";
import styles from "./navbar.module.css";
import UserIcon from "./user-profile-icon";

export default function CustomNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  // Fetch WooCommerce cart data
  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("/cart/items", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setCartCount(data.items_count || 0); // Update cart count
        } else {
          console.error("Failed to fetch cart data:", response.statusText);
          setCartCount(0);
        }
      } catch (error) {
        console.error("Error fetching cart data:", error);
        setCartCount(0);
      }
    };

    fetchCartData();

    // Event listener for cart updates
    const handleCartUpdate = () => fetchCartData();
    window.addEventListener("cart-updated", handleCartUpdate);

    // Cleanup listener
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, []);
  
  // Slideshow text for the top bar
  const topBarTexts = [
    "Minishoppen - kommer snart!",
    "Prenumerera på vårt nyhetsbrev och få 20% rabatt första månaden!",
    "Lansering våren 2025 – Förboka din box nu!",
  ];

  // Automatic text change every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % topBarTexts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [topBarTexts.length]);

  return (
    <div className="relative overflow-x-hidden">
      {/* Top Bar: Slideshow Text */}
      <div className="bg-black text-white text-sm py-2 px-8 flex justify-center items-center w-full fixed top-0 z-40">
        <span className="animate-fade-in">{topBarTexts[currentTextIndex]}</span>
      </div>

      {/* Navbar */}
      <div
        className={`navbar ${styles["navbar-shadow"]} bg-white fixed top-8 w-full z-40 px-8`}
      >
        <div className="flex items-center justify-between w-full">
          {/* Left Side: Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/small-nav-logo-gray.svg"
              alt="Equibox Logo"
              width={150}
              height={100}
              priority
              className="h-auto w-auto"
            />
          </Link>

          {/* Right Side: Icons */}
          <div className="flex text-gray-900 gap-4 items-center">
            {/* User Profile Icon */}
            <UserIcon />

            {/* Shopping Cart Icon */}
            <Link href="/cart">
              <div className="relative">
                <FontAwesomeIcon
                  icon={faShoppingCart}
                  className="h-6 w-6 text-gray-900 cursor-pointer"
                />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs px-1">
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>

            {/* Sidebar Toggle Button */}
            <label className="btn-circle swap swap-rotate">
              <input
                type="checkbox"
                checked={isOpen}
                onChange={() => setIsOpen((prev) => !prev)}
              />
              {/* Hamburger Icon */}
              <svg
                className="swap-off fill-current"
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 512 512"
              >
                <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
              </svg>
              {/* Close Icon */}
              <svg
                className="swap-on fill-current"
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 512 512"
              >
                <polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49" />
              </svg>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}