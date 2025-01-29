import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      scale: {
        '95': '0.95',
        '98': '0.98',
      },
    },
  },
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#D2A047",
          "secondary": "#161F48",
          "accent": "#E1C582",
          "neutral": "#252525",
          "base-100": "#ffffff",
          "base-200": "#f5f5f5",
          "base-300": "#F0EEE6",
          "base-content": "#252525",
        },
        dark: {
          "primary": "#D2A047",
          "secondary": "#284574",
          "accent": "#E1C582",
          "neutral": "#1f1f1f",
          "base-100": "#2C2C2C",
          "base-200": "#1a1a1a",
          "base-300": "#262626",
          "base-content": "#e1e1e1",
        },
      },
    ],
  },
  plugins: [require('daisyui')],
} satisfies Config;
