import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Brand: Telegram blue accent — primary actions, active states, focus.
        brand: {
          200: "#A8DFFA",
          300: "#7CD3F7",
          400: "#54BDEF",
          500: "#2AABEE",
          600: "#1D99D6",
          700: "#1780B3",
        },
        // Ink: deep blue-black app surfaces (page -> elevated).
        ink: {
          950: "#060A10",
          900: "#0A0F16",
          850: "#0D141D",
          800: "#111927",
          750: "#16202E",
          700: "#1D2A40",
        },
        // Semantic file-category colors (icons, badges, charts).
        cat: {
          document: "#38BDF8",
          image: "#34D399",
          video: "#A78BFA",
          audio: "#FBBF24",
          archive: "#94A3B8",
          other: "#9CA3AF",
        },
        vault: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },
        // Non-standard intermediate neutrals used across the UI.
        // Defined here so neutral-750/850 resolve to real classes.
        neutral: {
          750: "#2e2e2e",
          850: "#1c1c1c",
        },
        charcoal: {
          DEFAULT: "#121212",
          surface: "#171717",
          border: "#262626",
        },
        graphite: {
          DEFAULT: "#1f1f1f",
          light: "#2d2d2d",
          dark: "#141414",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glow-gradient":
          "conic-gradient(from 180deg at 50% 50%, #ffffff 0deg, #404040 180deg, #ffffff 360deg)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fade-in 0.25s ease-out",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
