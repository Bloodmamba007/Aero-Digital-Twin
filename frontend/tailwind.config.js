/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tactical: {
          950: '#070b12',
          900: '#0c1322',
          850: '#111b2f',
          800: '#16243d',
          700: '#203456',
          border: '#1e293b',
          accent: '#06b6d4',
          radar: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444'
        }
      },
      fontFamily: {
        mono: ['Courier New', 'Consolas', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
