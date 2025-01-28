"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import Link from "next/link";
import styles from "./navbar.module.css";
import UserIcon from "./user-profile-icon";
import ThemeToggle from "../theme-toggle";
import BottomNavigation from "./bottom-navigation";
import { useCart } from '@/app/context/CartContext';

export default function CustomNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const { cartCount } = useCart();

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
      <div className={`navbar ${styles["navbar-shadow"]} bg-white fixed top-8 w-full z-40 px-4 md:px-8`}>
        <div className="flex items-center justify-between w-full">
          {/* Left Side: Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/small-nav-logo-gray.svg"
              alt="Equibox Logo"
              width={120}
              height={80}
              priority
              className="h-auto w-auto md:w-[150px]"
            />
          </Link>

          {/* Right Side: Icons */}
          <div className="flex text-gray-900 gap-2 md:gap-4 items-center">
            {/* Hide UserIcon and CartIcon on mobile */}
            <div className="hidden md:block">
              <UserIcon />
            </div>
            <div className="hidden md:block relative">
              <Link href="/cart">
                <FontAwesomeIcon
                  icon={faShoppingCart}
                  className="h-5 w-5 md:h-6 md:w-6 text-gray-900 cursor-pointer"
                  aria-label="Member Shop kundvagn"
                />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Show ThemeToggle on all screens */}
            <ThemeToggle />

            {/* Show hamburger menu on tablet and up */}
            <div className="hidden md:block">
              <label className="btn-circle swap swap-rotate scale-75 md:scale-100">
                <input
                  type="checkbox"
                  checked={isOpen}
                  onChange={() => setIsOpen((prev) => !prev)}
                />
                {/* Hamburger Icon */}
                <svg
                  className="swap-off fill-current w-6 h-6 md:w-8 md:h-8"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  aria-label="Öppna sidomeny"
                >
                  <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
                </svg>
                {/* Close Icon */}
                <svg
                  className="swap-on fill-current w-6 h-6 md:w-8 md:h-8"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  aria-label="Stäng sidomeny"
                >
                  <polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49" />
                </svg>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Only visible on mobile */}
      <BottomNavigation />

      {/* Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-64 bg-white transform transition-transform duration-300 ease-in-out z-50 pt-20 px-8 shadow-xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-8 right-8 text-gray-900 hover:text-[var(--color-gold)] transition-colors"
          aria-label="Stäng sidomeny"
        >
          <svg
            className="w-6 h-6"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <nav className="flex flex-col gap-8">
          <Link 
            href="/" 
            className="text-xl text-gray-900 hover:text-[var(--color-gold)] transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Startsida
          </Link>
          <Link 
            href="/userprofile" 
            className="text-xl text-gray-900 hover:text-[var(--color-gold)] transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Mitt Konto
          </Link>
          <Link 
            href="/signup" 
            className="text-xl text-gray-900 hover:text-[var(--color-gold)] transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Prenumerera
          </Link>
          <Link 
            href="/member-shop" 
            className="text-xl text-gray-900 hover:text-[var(--color-gold)] transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Medlemsbutiken
          </Link>
        </nav>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
          aria-label="Stäng sidomeny"
        />
      )}
    </div>
  );
}