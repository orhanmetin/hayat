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
        primary: {
          DEFAULT: '#5f7a61',
          light: '#7a9a7c',
          dark: '#445645',
          hover: '#526b54',
        },
        accent: {
          gold: '#d4af37',
          purple: '#8b5cf6',
          success: '#10b981',
        },
        bg: {
          light: '#f7f9f6',
          dark: '#121813',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        quote: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      borderRadius: {
        lg: '1.25rem',
        md: '0.85rem',
        sm: '0.5rem',
      },
    },
  },
  plugins: [],
}
