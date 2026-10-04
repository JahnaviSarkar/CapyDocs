/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFF9E3',
        primary: '#F5BAD5',
        secondary: '#BAD6FD',
        highlight: '#F7E594',
        merlot: '#570301',
        capy: '#C9996B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
