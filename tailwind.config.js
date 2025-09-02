/** @type {import('tailwindcss').Config} */
export default {
  // Enable class-based dark mode for user preference support
  darkMode: 'class',

  // Content paths for Tailwind to scan and generate CSS
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // Include Radix UI components for proper styling
    './node_modules/@radix-ui/**/*.{js,ts,jsx,tsx}'
  ],

  // Custom theme configuration for consistent design system
  theme: {
    // Custom color palette optimized for pantry/food app
    colors: {
      // Primary brand colors - warm and inviting
      primary: {
        50: '#fef2f2',   // Light pink
        100: '#fde3e3',  // Very light pink
        200: '#fbcdcd',  // Light coral
        300: '#f7a7a7',  // Coral
        400: '#f17676',  // Medium coral
        500: '#e64c4c',  // Hummingbird red (primary)
        600: '#d32f2f',  // Darker red
        700: '#b71c1c',  // Dark red
        800: '#8b0000',  // Very dark red
        900: '#5c0000'   // Almost black red
      },

      // Neutral colors for backgrounds and text
      neutral: {
        50: '#fafafa',   // Very light gray
        100: '#f5f5f5',  // Light gray
        200: '#e5e5e5',  // Medium light gray
        300: '#d4d4d4',  // Light medium gray
        400: '#a3a3a3',  // Medium gray
        500: '#737373',  // Gray (default text)
        600: '#525252',  // Dark gray
        700: '#404040',  // Darker gray
        800: '#262626',  // Very dark gray
        900: '#171717'   // Almost black
      },

      // Semantic colors for status and feedback
      success: {
        50: '#f0fdf4',   // Light green
        500: '#22c55e',  // Green
        600: '#16a34a',  // Dark green
        700: '#15803d'   // Darker green
      },

      warning: {
        50: '#fffbeb',   // Light yellow
        500: '#f59e0b',  // Orange/yellow
        600: '#d97706',  // Dark orange
        700: '#b45309'   // Darker orange
      },

      error: {
        50: '#fef2f2',   // Light red
        500: '#ef4444',  // Red
        600: '#dc2626',  // Dark red
        700: '#b91c1c'   // Darker red
      },

      info: {
        50: '#eff6ff',   // Light blue
        500: '#3b82f6',  // Blue
        600: '#2563eb',  // Dark blue
        700: '#1d4ed8'   // Darker blue
      },

      // Special colors for food/pantry context
      food: {
        fresh: '#22c55e',      // Green for fresh items
        expiring: '#f59e0b',   // Orange for expiring soon
        expired: '#ef4444'     // Red for expired items
      }
    },

    // Extended spacing scale for consistent layouts
    spacing: {
      0: '0',
      1: '0.25rem',    // 4px
      2: '0.5rem',     // 8px
      3: '0.75rem',    // 12px
      4: '1rem',       // 16px
      5: '1.25rem',    // 20px
      6: '1.5rem',     // 24px
      8: '2rem',       // 32px
      10: '2.5rem',    // 40px
      12: '3rem',      // 48px
      16: '4rem',      // 64px
      20: '5rem',      // 80px
      24: '6rem',      // 96px
      32: '8rem',      // 128px
      40: '10rem',     // 160px
      48: '12rem',     // 192px
      56: '14rem',     // 224px
      64: '16rem'      // 256px
    },

    // Mobile-first responsive breakpoints
    screens: {
      'xs': '475px',    // Extra small devices
      'sm': '640px',    // Small tablets and large phones
      'md': '768px',    // Tablets
      'lg': '1024px',   // Small laptops
      'xl': '1280px',   // Laptops and desktops
      '2xl': '1536px'   // Large desktops
    },

    // Custom font configuration
    fontFamily: {
      sans: [
        'Inter',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'sans-serif'
      ],
      mono: [
        'JetBrains Mono',
        'Monaco',
        'Consolas',
        'Liberation Mono',
        'Courier New',
        'monospace'
      ]
    },

    // Extended font sizes for better typography hierarchy
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }]
    },

    // Custom border radius for consistent rounded corners
    borderRadius: {
      none: '0',
      sm: '0.125rem',     // 2px
      DEFAULT: '0.25rem', // 4px
      md: '0.375rem',     // 6px
      lg: '0.5rem',       // 8px
      xl: '0.75rem',      // 12px
      '2xl': '1rem',      // 16px
      '3xl': '1.5rem',    // 24px
      full: '9999px'      // Fully rounded
    },

    // Custom shadows for depth and elevation
    boxShadow: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
    },

    // Animation utilities for smooth interactions
    animation: {
      'spin-slow': 'spin 3s linear infinite',
      'bounce-slow': 'bounce 2s infinite',
      'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    },

    // Custom z-index scale for layering
    zIndex: {
      0: '0',
      10: '10',
      20: '20',
      30: '30',
      40: '40',
      50: '50',
      60: '60',
      auto: 'auto'
    }
  },

  // Plugin configuration for additional functionality
  plugins: [
    // Custom plugins can be added here for advanced features
    // Example: forms, typography, aspect-ratio plugins
  ]
}
