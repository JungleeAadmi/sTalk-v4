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
        // This allows us to change the color instantly using JS
        primary: 'var(--primary-color)', 
        'primary-hover': 'var(--primary-hover)',
      }
    },
  },
  plugins: [],
}
