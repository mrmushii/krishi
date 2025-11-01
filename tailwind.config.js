/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deshbazar': {
          'primary': '#2E7D32',      // Fresh Green - main buttons, CTAs
          'primary-dark': '#1B5E20', // Darker green for hover
          'secondary': '#F5E6C5',    // Warm Sand - backgrounds, cards
          'accent': '#4FC3F7',       // Sky Blue - icons, links, badges
          'accent-dark': '#0288D1',  // Darker blue for hover
          'text': '#3E2723',         // Dark Brown - body text, headings
          'text-light': '#6D4C41',   // Lighter brown for secondary text
        }
      }
    },
  },
  plugins: [],
}

