// PostCSS configuration for processing CSS with Tailwind and optimizations
export default {
  plugins: {
    // Tailwind CSS plugin - processes utility classes and generates CSS
    tailwindcss: {},

    // Autoprefixer - adds vendor prefixes for cross-browser compatibility
    // Automatically adds -webkit-, -moz-, -ms- prefixes where needed
    autoprefixer: {
      // Target modern browsers and iOS 15+ for mobile optimization
      overrideBrowserslist: [
        '> 0.2%',          // Support browsers used by more than 0.2% of users
        'not dead',        // Exclude browsers without official support
        'not op_mini all', // Exclude Opera Mini (limited CSS support)
        'iOS >= 15'        // iOS 15+ for camera and voice APIs
      ],

      // Enable flexbox bug fixes for older Safari versions
      flexbox: 'no-2009',

      // Enable grid support with fallbacks
      grid: true
    },

    // CSSNano - minifies CSS for production builds
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: [
          'default',
          {
            // Preserve important comments for debugging
            discardComments: { removeAll: true },

            // Optimize CSS for better performance
            normalizeWhitespace: true,
            mergeRules: true,
            mergeIdents: true,

            // Reduce CSS specificity conflicts
            reduceIdents: false,

            // Keep vendor prefixes that are still needed
            autoprefixer: false
          }
        ]
      }
    } : {})
  }
}
