/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        secondary: "#EC4899",
        dark: "#0F172A",
      },
    },
  },
  plugins: [],
  darkMode: "class",
}
