import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      colors: {
        // warm chocolate + amber + caramel palette
        nude: {
          50:  "#fef8ee",
          100: "#fce8c8",
          200: "#f0c890",
          300: "#e0a858",
          400: "#c88830",
          500: "#b07020",
          600: "#925810",
          700: "#744208",
          800: "#562e04",
          900: "#381e03",
          950: "#271403",
        },
        cream: {
          50:  "#fef9f2",
          100: "#faf1e2",
          200: "#f0dec8",
          300: "#e0c2a0",
          400: "#c8a070",
          500: "#a87848",
        },
        // deep burgundy-mauve
        drose: {
          50:  "#f8f0ee",
          100: "#f2e0dc",
          200: "#e4c0b8",
          300: "#cc9080",
          400: "#b06858",
          500: "#924848",
          600: "#783838",
          700: "#5e2828",
          800: "#451a1a",
          900: "#2e1010",
        },
        // warm olive-sage
        sage: {
          50:  "#f0f5ee",
          100: "#d5e8d0",
          200: "#a8d0a0",
          300: "#7ab578",
          400: "#629860",
          500: "#4e7a4c",
          600: "#3c603a",
          700: "#2d4828",
          800: "#1e3018",
          900: "#101e0e",
        },
        sidebar: {
          DEFAULT: "#1a0d05",
          active:  "#38200f",
          text:    "#c8a878",
        },
      },
    },
  },
  plugins: [],
};

export default config;
