/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Original primary colors
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
          DEFAULT: '#8b5cf6', // Add default value
        },
        // Gymkeeper specific colors - available for all color utilities (bg, text, border, ring)
        gymkeeper: {
          dark: '#1a1a1a',
          light: '#2d2d2d',
          'purple-darker': '#2a1f42',
          'purple': '#8B5CF6',
          'purple-light': '#A78BFA',
          DEFAULT: '#8B5CF6', // Add default value
        },
        // Theme system colors using CSS variables
        theme: {
          'bg-primary': 'var(--color-bg-primary)',
          'bg-secondary': 'var(--color-bg-secondary)',
          'bg-tertiary': 'var(--color-bg-tertiary)',
          'accent-primary': 'var(--color-accent-primary)',
          'accent-secondary': 'var(--color-accent-secondary)',
          'text-primary': 'var(--color-text-primary)',
          'text-secondary': 'var(--color-text-secondary)',
          'text-tertiary': 'var(--color-text-tertiary)',
          'border': 'var(--color-border)',
          DEFAULT: 'var(--color-bg-primary)',
        },
        // Status colors
        status: {
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          error: 'var(--color-error)',
          info: 'var(--color-info)',
        },
        // Difficulty colors
        difficulty: {
          warmup: 'var(--color-warmup)',
          easy: 'var(--color-easy)',
          normal: 'var(--color-normal)',
          hard: 'var(--color-hard)',
          failure: 'var(--color-failure)',
          drop: 'var(--color-drop)',
        }
      },
      // Add animation classes
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      // Ring configurations
      ringWidth: {
        DEFAULT: '2px',
      },
      ringColor: {
        DEFAULT: 'var(--color-accent-primary)',
      },
    },
  },
  plugins: [],
  // Safelist specifically required classes
  safelist: [
    'bg-gymkeeper-dark',
    'bg-gymkeeper-light',
    'bg-gymkeeper-purple',
    'bg-gymkeeper-purple-light',
    'bg-gymkeeper-purple-darker',
    'text-gymkeeper-purple',
    'ring-gymkeeper-purple',
    'focus:ring-gymkeeper-purple',
    {
      pattern: /bg-(theme|status|difficulty)-*/,
      variants: ['hover', 'focus', 'active'],
    },
  ],
}
