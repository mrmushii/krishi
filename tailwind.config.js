/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'farmlink': {
          'dark': '#1e293b',      // Dark blue (slate-800)
          'darker': '#0f172a',    // Very dark blue (slate-900)
          'light': '#334155',     // Lighter dark blue (slate-700)
          'orange': '#f97316',    // Orange accent
          'orange-hover': '#ea580c', // Orange hover
        }
      }
    },
  },
  plugins: [],
}

