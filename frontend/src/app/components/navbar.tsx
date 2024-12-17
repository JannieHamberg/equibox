"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart, faUser } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

export default function CustomNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative overflow-x-hidden">

        {/* Top Bar */}
      <div className="bg-gray-800 text-white text-sm py-2 px-8 flex justify-between items-center w-full fixed top-0 z-20">
        <div>
          <span>Minishoppen - kommer snart!</span>
        </div>
        <div>
          <span>Prenumerera på vårt nyhetsbrev och få 20% rabatt första månaden!</span>
        </div>
      </div>
      
      {/* Navbar */}
      <div  className="navbar  bg-white fixed top-8 w-full z-10 px-8">
        <div className="flex items-center justify-between w-full">
          {/* Left Side: Logo */}
          <a href="/" className="flex items-center">
            <Image
              src="/small-nav-logo-gray.svg"
              alt="Equibox Logo"
              width={150}
              height={100}
              priority
              className="h-auto w-auto"
            />
          </a>

          {/* Right Side: Icons */}
          <div className="flex text-gray-900 gap-4 items-center">
            {/* User Profile Icon */}
            <FontAwesomeIcon
              icon={faUser}
              className="h-5 w-5  cursor-pointer"
            />

            {/* Shopping Cart Icon */}
            <FontAwesomeIcon
              icon={faShoppingCart}
              className="h-5 w-5  cursor-pointer"
            />

            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="btn btn-ghost  text-2xl"
              id="btn-nav"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Right-Side Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full bg-white  w-64 transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out z-20`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="text-2xl  pl-4 pt-2"
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

        {/* Icons Sidebar */}
        <div className="mt-8 flex flex-col gap-4 px-8">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faUser} className="h-5 w-5 " />
            <span>Mitt konto</span>
          </div>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faShoppingCart}
              className="h-5 w-5 "
            />
            <span>Kundvagn</span>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0  bg-opacity-50 z-20"
          onClick={() => setIsOpen(false)} // Closes sidebar when clicking outside
        ></div>
      )}
    </div>
  );
}
