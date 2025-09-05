// Test environment setup for Vitest + React Testing Library
// This file configures the testing environment with necessary mocks and utilities

import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { server } from './mocks/server'

// ============================================================================
// JEST-DOM MATCHERS EXTENSION
// ============================================================================

// Extend Vitest's expect with jest-dom matchers for better assertions
// This adds methods like toBeInTheDocument, toHaveClass, etc.
expect.extend(matchers)

// ============================================================================
// CLEANUP AFTER EACH TEST
// ============================================================================

// Automatically clean up after each test to prevent test pollution
// This removes any mounted components and clears the DOM
afterEach(() => {
  cleanup()

  // Reset all mocks after each test
  vi.clearAllMocks()

  // Clear localStorage between tests
  localStorage.clear()

  // Clear sessionStorage between tests
  sessionStorage.clear()
})

// ============================================================================
// MOCK SERVICE WORKER SETUP
// ============================================================================

// Start MSW (Mock Service Worker) for API mocking
// This intercepts network requests during tests
beforeAll(() => {
  server.listen({
    // Prevent MSW from throwing errors on unhandled requests
    onUnhandledRequest: 'warn'
  })
})

// Reset request handlers after each test to ensure clean state
afterEach(() => {
  server.resetHandlers()
})

// Clean up MSW after all tests are done
afterAll(() => {
  server.close()
})

// ============================================================================
// BROWSER API MOCKS
// ============================================================================

// Mock the Web Speech API for voice recognition tests
Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    continuous: false,
    interimResults: false,
    lang: 'en-US',
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
    onstart: null,
    onend: null,
    onerror: null,
    onresult: null
  }))
})

// Mock the Speech Synthesis API for voice output tests
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn().mockReturnValue([]),
    pending: false,
    speaking: false,
    paused: false
  }
})

// Mock MediaDevices API for camera tests
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    enumerateDevices: vi.fn().mockResolvedValue([
      {
        deviceId: 'camera-1',
        kind: 'videoinput',
        label: 'Mock Camera'
      }
    ]),
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn().mockReturnValue([
        {
          stop: vi.fn(),
          kind: 'video'
        }
      ]),
      getVideoTracks: vi.fn().mockReturnValue([
        {
          getSettings: vi.fn().mockReturnValue({
            width: 1920,
            height: 1080
          })
        }
      ])
    })
  }
})

// Mock Permissions API for permission tests
Object.defineProperty(navigator, 'permissions', {
  writable: true,
  value: {
    query: vi.fn().mockImplementation((permission) => {
      const state = permission.name === 'camera' ? 'granted' : 'prompt'
      return Promise.resolve({ state })
    })
  }
})

// Mock IndexedDB for storage tests
const mockIndexedDB = {
  open: vi.fn().mockReturnValue({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      createObjectStore: vi.fn(),
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          put: vi.fn(),
          get: vi.fn(),
          delete: vi.fn()
        })
      })
    }
  })
}

Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: mockIndexedDB
})

// ============================================================================
// CUSTOM TEST UTILITIES
// ============================================================================

// Custom render function with providers for testing
import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Custom render function that includes necessary providers
const customRender = (
  ui: React.ReactElement,
  options: Omit<RenderOptions, 'wrapper'> = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(BrowserRouter, null, children)
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

// Re-export everything from testing-library
export * from '@testing-library/react'

// Override render with our custom version
export { customRender as render }

// ============================================================================
// GLOBAL TEST HELPERS
// ============================================================================

// Helper to create mock pantry items for tests
export const createMockPantryItem = (overrides = {}) => ({
  id: 'test-id' as any,
  name: 'Test Item',
  category: 'pantry' as const,
  quantity: 1,
  unit: 'pieces' as const,
  purchaseDate: new Date(),
  status: 'fresh' as const,
  tags: [],
  lastModified: new Date(),
  ...overrides
})

// Helper to create mock shopping items for tests
export const createMockShoppingItem = (overrides = {}) => ({
  id: 'test-shopping-id' as any,
  name: 'Test Shopping Item',
  category: 'pantry' as const,
  quantity: 1,
  unit: 'pieces' as const,
  isCompleted: false,
  addedFrom: 'manual' as const,
  addedAt: new Date(),
  ...overrides
})

// Helper to wait for async operations in tests
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Helper to mock console methods during tests
export const mockConsole = () => {
  const originalConsole = { ...console }
  const mockMethods = ['log', 'warn', 'error', 'info'] as const

  mockMethods.forEach(method => {
    vi.spyOn(console, method).mockImplementation(() => {})
  })

  return {
    restore: () => {
      mockMethods.forEach(() => {
        vi.restoreAllMocks()
      })
    },
    originalConsole
  }
}

// ============================================================================
// PERFORMANCE TESTING UTILITIES
// ============================================================================

// Helper to measure component render performance
export const measureRenderPerformance = async (
  component: React.ComponentType,
  props = {},
  iterations = 100
) => {
  const startTime = performance.now()

  for (let i = 0; i < iterations; i++) {
    customRender(React.createElement(component, props))
  }

  const endTime = performance.now()
  const averageRenderTime = (endTime - startTime) / iterations

  return {
    totalTime: endTime - startTime,
    averageRenderTime,
    iterations
  }
}

// ============================================================================
// ACCESSIBILITY TESTING HELPERS
// ============================================================================

// Helper to check if element has proper accessibility attributes
export const checkAccessibility = (element: HTMLElement) => {
  const issues = []

  // Check for alt text on images
  const images = element.querySelectorAll('img')
  images.forEach(img => {
    if (!img.alt && !img.getAttribute('aria-label')) {
      issues.push(`Image missing alt text: ${img.src}`)
    }
  })

  // Check for labels on form inputs
  const inputs = element.querySelectorAll('input, select, textarea')
  inputs.forEach(input => {
    const id = input.id
    const label = element.querySelector(`label[for="${id}"]`)
    if (!label && !input.getAttribute('aria-label')) {
      issues.push(`Input missing label: ${input.name || input.type}`)
    }
  })

  return issues
}

// ============================================================================
// VISUAL REGRESSION TESTING SETUP
// ============================================================================

// Mock for visual regression testing (if using tools like Chromatic)
export const mockVisualRegression = () => {
  // This would integrate with visual testing tools
  return {
    capture: vi.fn(),
    compare: vi.fn().mockResolvedValue({ pass: true })
  }
}
