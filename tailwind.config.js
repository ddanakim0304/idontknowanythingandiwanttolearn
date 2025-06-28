/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'warm-bg': '#F9F9F6',
        'primary-blue': '#5E9BFF',
        'primary-blue-hover': '#4A8AFF',
        'primary-blue-light': '#E8F2FF',
      },
      borderRadius: {
        'custom': '12px',
      },
      boxShadow: {
        'gentle': '0 3px 10px rgba(0,0,0,0.06)',
        'gentle-hover': '0 6px 20px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};