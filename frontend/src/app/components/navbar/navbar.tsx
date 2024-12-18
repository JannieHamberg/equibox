"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart, faUser } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import Link from "next/link";
import styles from "./navbar.module.css";

export default function CustomNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

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

      {/* Navbar: Shadow on Hover */}
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
            <FontAwesomeIcon icon={faUser} className="h-5 w-5 cursor-pointer" />

            {/* Shopping Cart Icon */}
            <FontAwesomeIcon
              icon={faShoppingCart}
              className="h-5 w-5 cursor-pointer"
            />

            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-900 text-2xl"
              id="btn-nav"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Right-Side Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full bg-white w-64 transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out z-50 shadow-lg`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="text-2xl pl-4 pt-2 cursor-pointer hover:text-gray-500 transition-colors duration-200"
          id="btn-close"
        >
          ✕
        </button>

        {/* Sidebar Content */}
        <ul className="p-8">
          <li className="py-4 text-2xl">
            <a href="#" className="hover:text-gray-400">
              Startsida
            </a>
          </li>
          <li className="text-2xl py-4">
            <a href="#" className="hover:text-gray-400">
              Välj en box
            </a>
          </li>
          <li className="text-2xl py-4">
            <a href="#" className="hover:text-gray-400">
              Om Equibox
            </a>
          </li>
          <li className="text-2xl py-4">
            <a href="#" className="hover:text-gray-400">
              Support
            </a>
          </li>
        </ul>

        {/* Sidebar Icons */}
        <div className="mt-8 flex flex-col gap-4 px-8">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
            <span>Mitt konto</span>
          </div>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faShoppingCart} className="h-5 w-5" />
            <span>Kundvagn</span>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setIsOpen(false)} // Close sidebar when clicking outside
        ></div>
      )}
    </div>
  );
}
