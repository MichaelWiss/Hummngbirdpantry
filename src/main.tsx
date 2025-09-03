// Main entry point for the HummingbirdPantry React application
// This file initializes the app and renders it to the DOM

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Import global styles - this includes Tailwind CSS and custom styles
import './assets/styles/index.css'

// Get the root DOM element where the app will be rendered
const rootElement = document.getElementById('root')

// Ensure the root element exists before rendering
if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a div with id="root" in your HTML.')
}

// Create the React root and render the application
// Using React 18's createRoot API for better performance and concurrent features
const root = ReactDOM.createRoot(rootElement)

// Enable strict mode for development to catch potential issues early
// Strict mode helps identify unsafe lifecycles, legacy API usage, and other problems
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
