/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#1B4332",
        deep: "#102C22",
        leaf: "#40916C",
        sage: "#DDE9D9",
        sand: "#F4F1DE",
        clay: "#D4A373"
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["Space Mono", "monospace"]
      },
      boxShadow: {
        soft: "0 12px 35px rgba(27,67,50,.07)"
      }
    }
  },
  plugins: []
};
