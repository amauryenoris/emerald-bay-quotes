/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'emerald-primary': '#1DAA6C',
        'emerald-dark': '#158F5A',
        'emerald-light': '#4DC98F',
        'emerald-gold': '#D4AF37',
      },
    },
  },
  plugins: [],
};
