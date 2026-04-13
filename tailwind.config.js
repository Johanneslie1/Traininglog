/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'bg-quaternary': 'var(--color-bg-quaternary)',
        'accent-primary': 'var(--color-accent-primary)',
        'accent-secondary': 'var(--color-accent-secondary)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'text-muted': 'var(--color-text-muted)',
        'text-inverse': 'var(--color-text-inverse)',
        'border': 'var(--color-border)',
        'border-hover': 'var(--color-border-hover)',
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
        },
        // Status Indicator colors
        'status-heart-bg': 'var(--color-status-heart-bg)',
        'status-heart-text': 'var(--color-status-heart-text)',
        'status-heart-border': 'var(--color-status-heart-border)',
        'status-intensity-bg': 'var(--color-status-intensity-bg)',
        'status-intensity-text': 'var(--color-status-intensity-text)',
        'status-intensity-border': 'var(--color-status-intensity-border)',
        'status-performance-bg': 'var(--color-status-performance-bg)',
        'status-performance-text': 'var(--color-status-performance-text)',
        'status-performance-border': 'var(--color-status-performance-border)',
        // Data field colors
        'data-field-bg': 'var(--color-data-field-bg)',
        'data-field-text': 'var(--color-data-field-text)',
        'data-field-label': 'var(--color-data-field-label)',
        // Activity Type Colors (Centralized)
        'activity-resistance': 'var(--color-activity-resistance)',
        'activity-resistance-bg': 'var(--color-activity-resistance-bg)',
        'activity-sport': 'var(--color-activity-sport)',
        'activity-sport-bg': 'var(--color-activity-sport-bg)',
        'activity-stretching': 'var(--color-activity-stretching)',
        'activity-stretching-bg': 'var(--color-activity-stretching-bg)',
        'activity-endurance': 'var(--color-activity-endurance)',
        'activity-endurance-bg': 'var(--color-activity-endurance-bg)',
        'activity-speed': 'var(--color-activity-speed)',
        'activity-speed-bg': 'var(--color-activity-speed-bg)',
        'activity-other': 'var(--color-activity-other)',
        'activity-other-bg': 'var(--color-activity-other-bg)',
        // Full Accent Scale
        accent: {
          50: 'var(--color-accent-50)',
          100: 'var(--color-accent-100)',
          200: 'var(--color-accent-200)',
          300: 'var(--color-accent-300)',
          400: 'var(--color-accent-400)',
          500: 'var(--color-accent-500)',
          600: 'var(--color-accent-600)',
          700: 'var(--color-accent-700)',
          800: 'var(--color-accent-800)',
          900: 'var(--color-accent-900)',
          DEFAULT: 'var(--color-accent-primary)',
          hover: 'var(--color-accent-hover)',
          active: 'var(--color-accent-active)',
        },
        // Focus Colors
        'focus-ring': 'var(--color-focus-ring)',
        'focus-bg': 'var(--color-focus-bg)',
        // Expanded Status Colors
        'success-bg': 'var(--color-success-bg)',
        'success-border': 'var(--color-success-border)',
        'success-text': 'var(--color-success-text)',
        'error-bg': 'var(--color-error-bg)',
        'error-border': 'var(--color-error-border)',
        'error-text': 'var(--color-error-text)',
        'warning-bg': 'var(--color-warning-bg)',
        'warning-border': 'var(--color-warning-border)',
        'warning-text': 'var(--color-warning-text)',
        'info-bg': 'var(--color-info-bg)',
        'info-border': 'var(--color-info-border)',
        'info-text': 'var(--color-info-text)',
        // Performance Trend Colors
        'trend-improving': 'var(--color-trend-improving)',
        'trend-improving-bg': 'var(--color-trend-improving-bg)',
        'trend-plateau': 'var(--color-trend-plateau)',
        'trend-plateau-bg': 'var(--color-trend-plateau-bg)',
        'trend-declining': 'var(--color-trend-declining)',
        'trend-declining-bg': 'var(--color-trend-declining-bg)',
        'trend-neutral': 'var(--color-trend-neutral)',
        'trend-neutral-bg': 'var(--color-trend-neutral-bg)',
        // Achievement Colors
        'achievement-gold': 'var(--color-achievement-gold)',
        'achievement-gold-bg': 'var(--color-achievement-gold-bg)',
        'achievement-silver': 'var(--color-achievement-silver)',
        'achievement-bronze': 'var(--color-achievement-bronze)',
      },
      // Brand Gradients
      backgroundImage: {
        'gradient-brand-hero': 'var(--gradient-brand-hero)',
        'gradient-brand-button': 'var(--gradient-brand-button)',
        'gradient-achievement': 'var(--gradient-achievement)',
      },
      // Professional typography scale
      fontSize: {
        'display-lg': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],      // 48px - Hero/Dashboard
        'display-md': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],   // 36px - Page titles
        'display-sm': ['1.875rem', { lineHeight: '1.2', fontWeight: '600' }],  // 30px - Section headers
        'heading-lg': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],    // 24px - Card titles
        'heading-md': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],   // 20px - Subheadings
        'heading-sm': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],  // 18px - Small headers
        'body-lg': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],         // 16px - Main content
        'body-md': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],     // 14px - Secondary text
        'body-sm': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],      // 12px - Captions
        'label': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],       // 14px - Form labels
        'button': ['0.875rem', { lineHeight: '1', fontWeight: '600' }],        // 14px - Buttons
      },
      // Extended spacing for consistent layouts
      spacing: {
        'safe': 'env(safe-area-inset-bottom)', // iOS safe area
        'nav': '4rem',   // 64px - Navigation height
        'header': '3.5rem', // 56px - Header height
        '18': '4.5rem',  // 72px
        '22': '5.5rem',  // 88px
      },
      // Border radius scale
      borderRadius: {
        'xl': '1rem',    // 16px
        '2xl': '1.5rem', // 24px
      },
      // Box shadows for elevation
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-lg': '0 0 30px rgba(139, 92, 246, 0.5)',
      },
      // Add animation classes
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.5s ease-in-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
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
    // Activity type colors
    'bg-activity-resistance',
    'bg-activity-sport',
    'bg-activity-stretching',
    'bg-activity-endurance',
    'bg-activity-speed',
    'bg-activity-other',
    'text-activity-resistance',
    'text-activity-sport',
    'text-activity-stretching',
    'text-activity-endurance',
    'text-activity-speed',
    'text-activity-other',
    {
      pattern: /bg-(theme|status|difficulty|activity|accent|trend|achievement)-*/,
      variants: ['hover', 'focus', 'active'],
    },
  ],
}
