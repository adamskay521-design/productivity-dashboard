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
        // dessert-table palette: cantaloupe, salmon paste, lemon posset, yellow green, powder blue
        nude: {
          50:  "#fbf4ee",
          100: "#f6e3d5",
          200: "#efc7a9",
          300: "#e9a572",
          400: "#e48135",
          500: "#ce6717",
          600: "#a55212",
          700: "#80400e",
          800: "#5a2e0c",
          900: "#391e09",
          950: "#231306",
        },
        cream: {
          50:  "#fdf9f1",
          100: "#fcf2df",
          200: "#fae5bd",
          300: "#f9d894",
          400: "#fbc760",
          500: "#feb21b",
        },
        // salmon paste accent
        drose: {
          50:  "#fbf0ef",
          100: "#f5d8d6",
          200: "#edb0ab",
          300: "#e57f76",
          400: "#dd483b",
          500: "#c82b1e",
          600: "#a02318",
          700: "#7c1b13",
          800: "#57150f",
          900: "#380e0b",
        },
        // yellow green accent
        sage: {
          50:  "#f6f5ee",
          100: "#eae7d2",
          200: "#dad2a5",
          300: "#ccc075",
          400: "#c0af49",
          500: "#a19235",
          600: "#83762b",
          700: "#645b21",
          800: "#443e18",
          900: "#2d2911",
        },
        sidebar: {
          DEFAULT: "#122021",
          active:  "#203a3c",
          text:    "#c0cdce",
        },
      },
    },
  },
  plugins: [],
};

export default config;
