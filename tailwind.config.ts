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
        // Monochrome Brand tokens (strictly white/grayscale — ZERO blue)
        brand: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#ffffff",
          600: "#e5e5e5",
          700: "#737373",
        },
        // Monochrome Ink surfaces (pure black -> dark charcoal)
        ink: {
          950: "#000000",
          900: "#0a0a0a",
          850: "#111111",
          800: "#171717",
          750: "#1f1f1f",
          700: "#262626",
        },
        // Monochrome semantic file-category tokens
        cat: {
          document: "#ffffff",
          image: "#e5e5e5",
          video: "#d4d4d4",
          audio: "#a3a3a3",
          archive: "#737373",
          other: "#525252",
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
