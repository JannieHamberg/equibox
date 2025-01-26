"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';

export default function HeroHome() {
  // Background images array
  const images = [
    "./hero/hero-image-box-1.webp",
    "./hero/hero-image-box-2.webp",
    "./hero/hero-image-box-3.webp",
    "./hero/hero-image-box-4.webp",
    "./hero/hero-image-box-5.webp",
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="mt-24 relative flex w-full bg-base-100 overflow-hidden">
      {/* Right: Slideshow Section */}
      <div
        className="relative w-full md:w-3/5 h-[400px] md:h-[500px] lg:h-[700px] bg-cover bg-center lg:bg-right ml-auto"
        style={{
          backgroundImage: `url(${images[currentImageIndex]})`,
          transition: "background-image 0.5s ease-in-out",
        }}
      >
        {/* Overlay for Darken Effect */}
        <div className="absolute inset-0 bg-black opacity-20"></div>
      </div>

      {/* Left: Text Section */}
      <div className="absolute z-10 bottom-4 left-4 md:top-1/2 md:-translate-y-1/2 md:left-8 lg:left-48 w-[85%] md:w-1/2 lg:w-1/3 bg-stone-100 shadow-lg p-4 md:p-12 lg:px-20 lg:py-24">
        <div className="max-w-[280px] md:max-w-sm text-left ">
          <p className="text-xs md:text-sm uppercase text-gray-500 mb-2">Join the Club</p>
          <h1 className="text-lg md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-4 leading-tight">
            Prenumerationsboxen för hästälskare – direkt till din dörr!
          </h1>
          <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-6">
            Utforska nya produkter och överraskningar för dig och din häst varje månad.
          </p>
          <Link 
            href="/signup" 
            className="cta-btn px-4 md:px-6 py-2 text-sm md:text-base font-semibold text-white bg-black hover:bg-gray-800 inline-block mb-2 md:mb-0"
          >
            Prenumerera
          </Link>
        </div>
      </div>
    </section>
  );
}
