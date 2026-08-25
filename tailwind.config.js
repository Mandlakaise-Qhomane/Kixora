/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          dark: '#0a0a0a',
          card: '#121212',
          border: '#222222',
          accent: '#00F0FF',
          gold: '#FFD700',
        }
      }
    },
  },
  plugins: [],
}
