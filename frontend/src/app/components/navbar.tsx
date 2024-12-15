"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart, faUser } from "@fortawesome/free-solid-svg-icons";

export default function CustomNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative overflow-x-hidden">
      {/* Navbar */}
      <div className="navbar bg-gray-800 text-white fixed top-0 w-full z-10">
        <div className="flex-1">
          <a className="text-xl font-bold">Equibox</a>
        </div>
        <div className="flex gap-4 items-center">
          {/* User Profile Icon */}
          <FontAwesomeIcon
            icon={faUser}
            className="h-5 w-5 text-white cursor-pointer"
          />

          {/* Shopping Cart Icon */}
          <FontAwesomeIcon
            icon={faShoppingCart}
            className="h-5 w-5 text-white cursor-pointer"
          />

          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setIsOpen(true)} 
            className="btn btn-ghost text-2xl"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Right-Side Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full bg-gray-900 text-white w-64 transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out z-20`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)} 
          className="text-2xl text-white p-2"
        >
          ✕
        </button>

        {/* Sidebar Content */}
        <ul className="p-8">
          <li className="py-4 text-2xl">
            <a href="#" className="hover:text-gray-400">Startsida</a>
          </li>
          <li className="text-2xl py-4">
            <a href="#" className="hover:text-gray-400">Välj en box</a>
          </li>
          <li className="text-2xl py-4">
            <a href="#" className="hover:text-gray-400">Om Equibox</a>
          </li>
          <li className="text-2xl py-4">
            <a href="#" className="hover:text-gray-400">Support</a>
          </li>
        </ul>

        {/* Icons Sidebar */}
        <div className="mt-8 flex flex-col gap-4 px-8">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-white" />
            <span>Mitt konto</span>
          </div>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faShoppingCart}
              className="h-5 w-5 text-white"
            />
            <span>Kundvagn</span>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setIsOpen(false)} // Closes sidebar when clicking outside
        ></div>
      )}
    </div>
  );
}
