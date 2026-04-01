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
        // Prospera Brand Colors
        prospera: {
          bg: '#F7F5F2',
          surface: '#FFFFFF',
          'surface-alt': '#F1EEE8',
          border: '#E7E1D8',
          'text-primary': '#111111',
          'text-secondary': '#6B6B6B',
          gold: '#D4AF37',
          'gold-hover': '#B8911E',
          'gold-soft': '#F3E7B8',
          navy: '#0F172A',
          blue: '#3B82F6',
          green: '#166534',
          success: '#166534',
          'success-soft': '#DCFCE7',
          warning: '#B54708',
          'warning-soft': '#FEF0C7',
          danger: '#B42318',
          'danger-soft': '#FEE4E2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'prospera': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'prospera-lg': '0 4px 6px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
