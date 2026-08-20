/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // vea-frontend/src/index.css'teki --color-brand-* ile birebir mirror
      // edilmeli — tek gerçek kaynak orada, buraya elle senkron kalınacak.
      colors: {
        brand: {
          50: "#faf6f1",
          100: "#f3e9dd",
          200: "#e5d0b8",
          300: "#d3b28c",
          400: "#bb8f62",
          500: "#9c6f45",
          600: "#7d5636",
          700: "#61432b",
          800: "#493323",
          900: "#33241a",
          950: "#1f1610",
        },
      },
    },
  },
  plugins: [],
};
