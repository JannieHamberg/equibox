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

            {/* Sidebar Toggle Button with DaisyUI Swap */}
            <label className="btn-circle swap swap-rotate">
              {/* Checkbox to toggle state */}
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

      {/* Right-Side Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full bg-white w-64 transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out z-50 shadow-lg`}
      >
        {/* Sidebar Content */}
        <button
          onClick={() => setIsOpen(false)}
          className="text-2xl pl-4 pt-2 cursor-pointer hover:text-gray-500 transition-colors duration-200"
        >
          ✕
        </button>
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
              FAQ
            </a>
          </li>
          <li className="text-2xl py-4">
            <a href="#" className="hover:text-gray-400">
              Support
            </a>
          </li>
        </ul>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}
