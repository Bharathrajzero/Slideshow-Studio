/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: "#0d0e11",
          text: "#f5f4f0",
          accent: "#e0562c"
        }
      }
    },
  },
  plugins: [],
}