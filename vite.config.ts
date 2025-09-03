import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// Vite configuration for React + TypeScript development and production builds
export default defineConfig(({ mode }) => ({
  // React plugin with fast refresh for development
  plugins: [
    // React fast refresh for hot module replacement
    react({
      // Enable React Fast Refresh for better development experience
      fastRefresh: true,
      // Use SWC for faster compilation (optional)
      jsxRuntime: 'automatic'
    }),

    // Bundle analyzer for production builds (only in analyze mode)
    mode === 'analyze' && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),

  // Path aliases for clean imports matching TypeScript paths
  resolve: {
    alias: {
      // Core application aliases
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/types': resolve(__dirname, './src/types'),
      '@/context': resolve(__dirname, './src/context'),
      '@/services': resolve(__dirname, './src/services'),
      '@/constants': resolve(__dirname, './src/constants'),
      '@/stores': resolve(__dirname, './src/stores'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/assets': resolve(__dirname, './src/assets'),
      '@/test': resolve(__dirname, './src/test')
    }
  },

  // Development server configuration optimized for mobile development and camera access
  server: {
    // Port for development server
    port: 3002,

    // Automatically open browser (disabled for mobile development)
    open: false,

    // Host configuration for mobile testing - bind to all interfaces
    host: '0.0.0.0',

    // HTTPS for camera and microphone APIs (optional for development)
    https: mode === 'production',

    // CORS configuration for external API development
    cors: true,

    // Additional headers for development
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    },

    // Proxy configuration for API development (if needed)
    proxy: {
      // Example: proxy API calls during development
      // '/api': 'http://localhost:3001'
    }
  },

  // Production build configuration optimized for performance
  build: {
    // Output directory
    outDir: 'dist',

    // Generate source maps for debugging (disable in production for smaller bundles)
    sourcemap: mode === 'development',

    // Target modern browsers for smaller bundles
    target: 'es2022',

    // Minimum chunk size for code splitting
    minify: 'esbuild',

    // Code splitting configuration for better caching
    rollupOptions: {
      output: {
        // Manual chunks for better caching strategies
        manualChunks: {
          // Vendor chunks for third-party libraries
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-tabs', '@radix-ui/react-dialog'],
          'utils-vendor': ['date-fns', 'clsx'],

          // Feature-specific chunks for better caching
          'barcode-vendor': ['@zxing/library'],
          'voice-vendor': [], // Web Speech API is native

          // Large utility libraries
          'virtual-scroll': ['react-window']
        },

        // Naming pattern for chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },

    // Bundle size warnings and limits
    chunkSizeWarningLimit: 1000,

    // Optimize dependencies for faster builds
    commonjsOptions: {
      include: [/node_modules/]
    }
  },

  // CSS configuration for Tailwind and PostCSS
  css: {
    // PostCSS configuration
    postcss: './postcss.config.js',

    // CSS modules configuration
    modules: {
      // Generate scoped class names for components
      localsConvention: 'camelCaseOnly'
    },

    // Development CSS sourcemaps
    devSourcemap: true
  },

  // Dependency optimization for faster development
  optimizeDeps: {
    // Pre-bundle these dependencies for faster dev server startup
    include: [
      'react',
      'react-dom',
      '@radix-ui/react-tabs',
      '@radix-ui/react-dialog',
      'date-fns',
      'clsx',
      'lucide-react'
    ],

    // Exclude large libraries from pre-bundling if they cause issues
    exclude: [
      '@zxing/library' // Large library, bundle only when needed
    ]
  },

  // Environment variables configuration
  envPrefix: 'VITE_',

  // Preview server configuration (for testing production builds)
  preview: {
    port: 4173,
    host: true,
    cors: true
  },

  // Test configuration (integrated with Vitest)
  test: {
    // Use jsdom for DOM simulation in tests
    environment: 'jsdom',

    // Setup file for test configuration
    setupFiles: ['./src/test/setup.ts'],

    // Global test functions (describe, it, expect)
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        'dist/',
        '**/*.config.*'
      ]
    }
  }
}))