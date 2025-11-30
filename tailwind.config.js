/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['monospace'], // Ensure monospaced font works for Admin Console
      },
    },
  },
  plugins: [
    require("tailwindcss-animate")
  ],
}