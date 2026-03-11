/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'Cambria', 'serif'],
      },
      colors: {
        paper: {
          DEFAULT: '#FAF8F0',
          50: '#FDFCF7',
          100: '#FAF8F0',
          200: '#F5F0DC',
          300: '#EDE4C0',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
