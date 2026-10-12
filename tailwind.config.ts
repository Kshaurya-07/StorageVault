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
        vault: {
          50: "#f0f4ff",
          100: "#dbe4fe",
          200: "#bfd0fd",
          300: "#93b3fb",
          400: "#608bf7",
          500: "#3b63f0",
          600: "#2745e4",
          700: "#1e33d0",
          800: "#1d2ca8",
          900: "#1c2885",
          950: "#0b0f2a",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glow-gradient":
          "conic-gradient(from 180deg at 50% 50%, #2563eb 0deg, #7c3aed 180deg, #2563eb 360deg)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
