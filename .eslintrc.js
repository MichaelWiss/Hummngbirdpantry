// ESLint configuration for React + TypeScript project with accessibility focus
module.exports = {
  // Use modern ESLint flat config format
  root: true,

  // Parser for TypeScript and JSX
  parser: '@typescript-eslint/parser',

  // Parser options for modern JavaScript and TypeScript
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,        // Enable JSX parsing
      modules: true     // Enable ES modules
    },

    // TypeScript project configuration
    project: './tsconfig.json',
    tsconfigRootDir: __dirname
  },

  // Environment configuration for browser and Node.js
  env: {
    browser: true,     // Browser globals (window, document, etc.)
    es2022: true,      // Modern JavaScript features
    node: true,        // Node.js globals for config files
    jest: true         // Jest testing globals
  },

  // Global variables available in the project
  globals: {
    // Browser APIs used in the app
    navigator: 'readonly',
    window: 'readonly',
    document: 'readonly',
    console: 'readonly',

    // React testing globals
    render: 'readonly',
    screen: 'readonly',
    fireEvent: 'readonly',
    waitFor: 'readonly'
  },

  // Plugin configurations
  plugins: [
    'react',                    // React-specific linting rules
    'react-hooks',             // React hooks rules
    'react-refresh',           // React Fast Refresh rules
    '@typescript-eslint',      // TypeScript-specific rules
    'jsx-a11y'                 // Accessibility rules for JSX
  ],

  // Extended rule configurations
  extends: [
    // TypeScript recommended rules
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',

    // React recommended rules
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',

    // React Fast Refresh rules
    'plugin:react-refresh/recommended',

    // Accessibility rules (WCAG 2.1 AA compliance)
    'plugin:jsx-a11y/recommended'
  ],

  // Custom rule configurations
  rules: {
    // TypeScript-specific rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }
    ],

    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-inferrable-types': 'off',

    // React-specific rules
    'react/react-in-jsx-scope': 'off',     // Not needed with React 17+
    'react/prop-types': 'off',             // Using TypeScript for prop validation
    'react/jsx-uses-react': 'off',         // Not needed with React 17+

    // React hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // React Fast Refresh rules
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true }
    ],

    // Accessibility rules (WCAG 2.1 AA)
    'jsx-a11y/anchor-is-valid': 'off',     // False positives with React Router
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',

    // General code quality rules
    'no-console': [
      'warn',
      { allow: ['warn', 'error'] }
    ],

    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error'
  },

  // Settings for specific plugins
  settings: {
    react: {
      version: 'detect'  // Automatically detect React version
    },

    // Import resolver for path aliases
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      }
    }
  },

  // File-specific overrides
  overrides: [
    // Configuration files
    {
      files: [
        '*.config.js',
        '*.config.ts',
        'tailwind.config.js',
        'postcss.config.js'
      ],
      env: { node: true },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-console': 'off'
      }
    },

    // Test files
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: { jest: true },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'react/display-name': 'off'
      }
    },

    // Build and tooling files
    {
      files: ['vite.config.ts', 'vitest.config.ts'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ],

  // Ignore patterns
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.min.js',
    'public/',
    '.husky/'
  ]
}
