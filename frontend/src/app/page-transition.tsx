'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';


export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const blackBox = {
    initial: {
      height: "100vh",
      bottom: 0,
    },
    animate: {
      height: 0,
      transition: {
        when: "afterChildren",
        duration: 1.5,
        ease: [0.87, 0, 0.13, 1],
      },
    },
  };

  const textContainer = {
    initial: {
      opacity: 1,
    },
    animate: {
      opacity: 0,
      transition: {
        duration: 0.25,
        when: "afterChildren",
      },
    },
  };

  const text = {
    initial: {
      y: 40,
    },
    animate: {
      y: 80,
      transition: {
        duration: 1.5,
        ease: [0.87, 0, 0.13, 1],
      },
    },
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <div key={pathname} className="relative">
          <motion.div
            className="fixed top-0 left-0 w-full h-full bg-[#252525] z-50 flex items-center justify-center"
            initial="initial"
            animate="animate"
            variants={blackBox}
            onAnimationStart={() => document.body.classList.add("overflow-hidden")}
            onAnimationComplete={() => document.body.classList.remove("overflow-hidden")}
          >
            <motion.svg className="absolute z-50 flex" variants={textContainer}>
              <pattern
                id="pattern"
                patternUnits="userSpaceOnUse"
                width={750}
                height={800}
                className="text-white"
              >
                <rect className="w-full h-full fill-current" />
                <motion.rect
                  variants={text}
                  className="w-full h-full text-gray-600 fill-current"
                />
              </pattern>
              <text
                className="text-4xl font-bold"
                textAnchor="middle"
                x="50%"
                y="50%"
                style={{ fill: "url(#pattern)" }}
              >
                EQUIBOX
              </text>
            </motion.svg>
          </motion.div>
        </div>
      </AnimatePresence>
      <main>{children}</main>
    </>
  );
} 