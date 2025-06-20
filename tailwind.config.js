/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        gymkeeper: {
          dark: '#0e0e0e',
          darker: '#0a0a0a',
          light: '#1a1a1a',
          purple: {
            light: '#9d4edd',
            DEFAULT: '#7b2cbf',
            dark: '#5a189a',
            darker: '#3c096c',
            gradient: {
              start: '#5a189a',
              end: '#7b2cbf',
            }
          }
        }
      },
      backgroundImage: {
        'purple-gradient': 'linear-gradient(to right, #5a189a, #7b2cbf)',
      }
    },
  },
  plugins: [],
}
