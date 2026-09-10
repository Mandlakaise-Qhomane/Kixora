/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kixora: {
          orange: '#FF7A00',
          'orange-hover': '#E56E00',
          charcoal: '#232323',
          ink: '#111111',
          void: '#0D0D0D',
          card: '#1A1A1A',
          surface: '#161616',
          border: '#2C2C2C',
          muted: '#888888',
          mist: '#F5F5F5',
          white: '#FFFFFF',
        },
        vault: {
          dark: '#111111',
          card: '#1A1A1A',
          border: '#2C2C2C',
          accent: '#FF7A00',
          gold: '#FF7A00',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 35px -5px rgba(255, 122, 0, 0.45)',
        'glow-sm': '0 0 15px -3px rgba(255, 122, 0, 0.35)',
        ring: '0 0 25px 2px rgba(255, 122, 0, 0.55), inset 0 0 15px rgba(255, 122, 0, 0.35)',
      },
    },
  },
  plugins: [],
}
