/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        saffron: "#C4561E",
        gold: "#E8952A",
        "vastu-green": "#2A8C5A",
        indigo: "#1A2A6C",
        cream: "#FAF7F2",
        "warm-gray": "#8B7355",
        danger: "#A02020",
        warning: "#B5741E",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "sans-serif"],
        display: ["'Yatra One'", "'Tiro Devanagari Sanskrit'", "Georgia", "serif"],
      },
      boxShadow: {
        vastu: "0 2px 12px rgba(196, 86, 30, 0.08)",
      },
      borderColor: {
        vastu: "rgba(196, 86, 30, 0.15)",
      }
    },
  },
  plugins: [],
}
