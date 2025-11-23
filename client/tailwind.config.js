/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Nunito', 'sans-serif'] },
      colors: {
        primary: 'var(--primary-color)', 
        // OVERRIDE: True Neutral Greys (Zinc)
        gray: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a', // Sidebar / Header
          900: '#18181b', // Main Background
          950: '#09090b', // Deep Background
        }
      }
    },
  },
  plugins: [],
}
