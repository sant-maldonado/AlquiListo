/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        ink: '#1F2421',
        forest: {
          DEFAULT: '#2D6A4F',
          dark: '#1B4332',
          light: '#52A37C',
        },
        terracotta: {
          DEFAULT: '#E07A5F',
          dark: '#C45A3E',
        },
        line: '#D8D2C4',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
