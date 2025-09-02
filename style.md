# HummingbirdPantry - Code Style Guide

## Overview
This document outlines the coding conventions and best practices for the HummingbirdPantry project. The app is built with React, TypeScript, and modern web APIs, featuring advanced capabilities like voice recognition, barcode scanning, and PWA functionality.

## General Principles

### Code Quality
- **Readability First**: Code should be self-documenting and easy to understand
- **Mobile-First**: Optimize for iPhone with touch interactions and performance
- **Accessibility**: WCAG 2.1 AA compliance with keyboard and screen reader support
- **Progressive Enhancement**: Core features work without advanced APIs
- **Privacy-First**: Local processing for voice and camera data
- **Performance**: Optimized for mobile devices with efficient resource usage

### Development Philosophy
- **TypeScript Strict**: 100% type coverage with strict mode enabled
- **Component-Driven**: Reusable, composable UI components
- **Custom Hooks**: Extract complex logic into reusable hooks
- **Test-Driven**: Comprehensive testing for reliability
- **Documentation**: Self-documenting code with clear APIs

### Naming Conventions

#### Files and Directories
- **Components**: PascalCase (e.g., `PantryItem.tsx`, `BarcodeScanner.tsx`)
- **Custom Hooks**: camelCase with `use` prefix (e.g., `useVoiceRecognition.ts`, `useCamera.ts`)
- **Utilities**: camelCase with descriptive names (e.g., `barcodeLookup.ts`, `voiceUtils.ts`)
- **Types**: PascalCase with descriptive names (e.g., `PantryItem.ts`, `VoiceCommand.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_CATEGORIES.ts`, `VOICE_COMMANDS.ts`)
- **Directories**: kebab-case (e.g., `components/`, `hooks/`, `utils/`, `types/`)

#### Advanced Naming Patterns
- **API Services**: `*.service.ts` (e.g., `recipeApi.service.ts`)
- **Store/State**: `*.store.ts` or `*.slice.ts`
- **Tests**: `*.test.ts`, `*.spec.ts`, `*.e2e.ts`
- **Stories**: `*.stories.tsx` for Storybook components
- **Barrel Exports**: `index.ts` files for clean imports

#### Examples
```typescript
// Advanced Components
const BarcodeScanner = () => { ... }
const VoiceInterface = () => { ... }
const PhotoRecognition = () => { ... }

// Custom Hooks
const useVoiceRecognition = () => { ... }
const useCamera = () => { ... }
const useOfflineSync = () => { ... }

// API Services
const recipeApi = { ... }
const barcodeLookupService = { ... }

// Type Definitions
interface VoiceCommand {
  command: string
  action: () => void
}

type CameraMode = 'barcode' | 'photo' | 'receipt'

// Constants
const VOICE_COMMANDS = {
  ADD_ITEM: 'add item',
  SCAN_BARCODE: 'scan barcode'
} as const

const CAMERA_CONSTRAINTS = {
  video: {
    facingMode: 'environment',
    width: { ideal: 1280 }
  }
} as const
```

## TypeScript Guidelines

### Type Definitions
- **Interfaces**: Use for object shapes and component props
- **Types**: Use for unions, primitives, and complex types
- **Generics**: Use when creating reusable components/utilities
- **Enums**: Use for fixed sets of related constants
- **Mapped Types**: Use for transforming existing types

```typescript
// Enhanced type definitions
interface PantryItem {
  id: string
  name: string
  barcode?: string
  category: ItemCategory
  quantity: number
  unit: MeasurementUnit
  expirationDate?: Date
  purchaseDate: Date
  price?: number
  nutritionalInfo?: NutritionalData
  tags: string[]
}

// Union types for better type safety
type ItemStatus = 'fresh' | 'expiring-soon' | 'expired' | 'consumed'
type CameraMode = 'barcode' | 'photo' | 'receipt'
type VoiceCommandType = 'add-item' | 'scan-barcode' | 'find-recipe'

// Generic utility types
type ApiResponse<T> = {
  data: T
  error?: string
  loading: boolean
}

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Advanced generics for hooks
const useApi = <T>(
  endpoint: string,
  options?: RequestInit
): ApiResponse<T> => { ... }
```

### Type Safety & Advanced Patterns
- **Strict Mode**: Enable all strict TypeScript settings
- **No `any`**: Use `unknown` for truly unknown types, avoid `any`
- **Discriminated Unions**: Use for type-safe state management
- **Branded Types**: For domain-specific type safety
- **Template Literal Types**: For advanced string manipulation

```typescript
// Discriminated unions for actions
type PantryAction =
  | { type: 'ADD_ITEM'; payload: PantryItem }
  | { type: 'UPDATE_ITEM'; payload: { id: string; updates: Partial<PantryItem> } }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'BULK_UPDATE'; payload: { ids: string[]; updates: Partial<PantryItem> } }

// Branded types for type safety
type UserId = string & { readonly __brand: 'UserId' }
type Barcode = string & { readonly __brand: 'Barcode' }

// Template literal types for API endpoints
type ApiEndpoint = `/${'pantry' | 'shopping' | 'recipes'}/${string}`

// Utility types for common patterns
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}
```

## React Guidelines

### Component Structure
- **Functional Components**: Prefer functional components with hooks
- **Single Responsibility**: Each component should have one clear purpose
- **Compound Components**: Use for complex UI patterns
- **Forward Refs**: For imperative APIs and DOM access
- **Error Boundaries**: Wrap feature areas for graceful error handling

```typescript
// Enhanced component with compound pattern
interface VoiceInputProps {
  onResult: (transcript: string) => void
  onError: (error: string) => void
  children: React.ReactNode
}

const VoiceInput: React.FC<VoiceInputProps> & {
  Button: React.FC<VoiceButtonProps>
  Status: React.FC<VoiceStatusProps>
} = ({ children, ...props }) => {
  // Compound component implementation
}

// Forward ref for camera access
const CameraView = React.forwardRef<HTMLVideoElement>((props, ref) => {
  return <video ref={ref} {...props} />
})
```

### Advanced Hooks Patterns
- **Custom Hooks**: Extract reusable logic into custom hooks
- **Hook Composition**: Combine multiple hooks for complex behavior
- **Hook Dependencies**: Include all dependencies in useEffect/useCallback
- **Error Handling**: Handle async errors gracefully

```typescript
// Advanced custom hook with error handling
const useVoiceRecognition = (options: VoiceOptions = {}) => {
  const [state, dispatch] = useReducer(voiceReducer, initialState)

  const startRecognition = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recognition = new webkitSpeechRecognition()

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        dispatch({ type: 'RECOGNITION_SUCCESS', payload: transcript })
      }

      recognition.onerror = (error) => {
        dispatch({ type: 'RECOGNITION_ERROR', payload: error.error })
      }

      recognition.start()
      dispatch({ type: 'RECOGNITION_START' })
    } catch (error) {
      dispatch({ type: 'PERMISSION_DENIED', payload: error.message })
    }
  }, [options])

  return { ...state, startRecognition }
}

// Hook composition for camera features
const useCamera = (mode: CameraMode) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream>()

  const startCamera = useCallback(async () => {
    try {
      const constraints = CAMERA_CONSTRAINTS[mode]
      stream.current = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream.current
      }
    } catch (error) {
      console.error('Camera access failed:', error)
    }
  }, [mode])

  const stopCamera = useCallback(() => {
    stream.current?.getTracks().forEach(track => track.stop())
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  return { videoRef, startCamera, stopCamera }
}
```

### State Management
- **Context + useReducer**: Use for global state management
- **Zustand**: Consider for complex state with middleware
- **Local State**: Use useState for component-specific state
- **Optimistic Updates**: Update UI immediately, rollback on error

```typescript
// Enhanced reducer with error handling
type PantryAction =
  | { type: 'ADD_ITEM_START'; payload: Omit<PantryItem, 'id'> }
  | { type: 'ADD_ITEM_SUCCESS'; payload: PantryItem }
  | { type: 'ADD_ITEM_ERROR'; payload: string }
  | { type: 'UPDATE_ITEM'; payload: { id: string; updates: Partial<PantryItem> } }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'BULK_UPDATE'; payload: { ids: string[]; updates: Partial<PantryItem> } }

const pantryReducer = (state: PantryState, action: PantryAction): PantryState => {
  switch (action.type) {
    case 'ADD_ITEM_START':
      return {
        ...state,
        loading: true,
        optimisticItems: [...state.items, { ...action.payload, id: 'temp' }]
      }
    case 'ADD_ITEM_SUCCESS':
      return {
        ...state,
        loading: false,
        items: state.items.map(item =>
          item.id === 'temp' ? action.payload : item
        ),
        optimisticItems: undefined
      }
    case 'ADD_ITEM_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
        items: state.optimisticItems || state.items,
        optimisticItems: undefined
      }
    // ... other cases
  }
}
```

### Voice & Camera APIs
- **Permission Handling**: Request permissions gracefully
- **Error Recovery**: Handle permission denials and hardware issues
- **Resource Management**: Clean up streams and recognition instances
- **Privacy**: Process data locally, don't send to external servers

```typescript
// Voice API error handling
const useVoiceErrorHandler = (error: SpeechRecognitionErrorEvent) => {
  switch (error.error) {
    case 'no-speech':
      return 'No speech detected. Please try again.'
    case 'audio-capture':
      return 'Microphone access denied. Please check permissions.'
    case 'network':
      return 'Network error. Voice features require internet connection.'
    default:
      return 'Voice recognition failed. Please try again.'
  }
}

// Camera API with fallback
const useCameraWithFallback = () => {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const cameras = devices.filter(device => device.kind === 'videoinput')
        setHasCamera(cameras.length > 0)
      })
      .catch(() => setHasCamera(false))
  }, [])

  return hasCamera
}
```

## File Organization

### Enhanced Directory Structure
```
src/
├── components/              # Reusable UI components
│   ├── common/             # Shared components (Button, Modal, etc.)
│   ├── pantry/             # Pantry-specific components
│   ├── shopping/           # Shopping list components
│   ├── chat/               # Chat interface components
│   ├── analytics/          # Dashboard and analytics components
│   ├── voice/              # Voice recognition components
│   └── camera/             # Camera and barcode components
├── hooks/                  # Custom React hooks
│   ├── usePantry.ts        # Pantry management hooks
│   ├── useVoice.ts         # Voice recognition hooks
│   ├── useCamera.ts        # Camera access hooks
│   ├── useOffline.ts       # Offline functionality hooks
│   └── useAnalytics.ts     # Analytics and insights hooks
├── context/                # React context providers
│   ├── PantryContext.tsx   # Main app state
│   ├── ThemeContext.tsx    # Theme management
│   └── VoiceContext.tsx    # Voice state management
├── services/               # External API services
│   ├── barcode.service.ts  # Barcode lookup APIs
│   ├── recipe.service.ts   # Recipe APIs
│   └── storage.service.ts  # Data persistence
├── utils/                  # Utility functions
│   ├── date.utils.ts       # Date manipulation
│   ├── voice.utils.ts      # Voice processing
│   ├── camera.utils.ts     # Camera utilities
│   └── validation.utils.ts # Input validation
├── types/                  # TypeScript type definitions
│   ├── pantry.types.ts     # Pantry-related types
│   ├── voice.types.ts      # Voice recognition types
│   ├── camera.types.ts     # Camera API types
│   └── api.types.ts        # External API types
├── constants/              # Application constants
│   ├── voice.constants.ts  # Voice commands
│   ├── camera.constants.ts # Camera settings
│   └── api.constants.ts    # API endpoints
├── stores/                 # State management (Zustand)
│   ├── pantry.store.ts     # Pantry state
│   ├── settings.store.ts   # User preferences
│   └── offline.store.ts    # Offline queue
├── lib/                    # Third-party integrations
│   ├── voice/              # Voice recognition library wrappers
│   ├── camera/             # Camera API wrappers
│   └── pwa/                # PWA utilities
├── test/                   # Test utilities and mocks
│   ├── mocks/              # API and browser mocks
│   ├── utils/              # Test utilities
│   └── fixtures/           # Test data
└── assets/                 # Images, icons, styles
    ├── icons/              # Custom icons
    ├── images/             # Static images
    └── styles/             # Global styles and themes
```

### Import Organization
- **Group Imports**: Group related imports together
- **Absolute Imports**: Use @ alias for src directory
- **Barrel Exports**: Use index.ts files for clean imports
- **Feature-Based**: Group by feature, not technical layer

```typescript
// Feature-based imports (preferred)
import { PantryItem, usePantryStats } from '@/pantry'
import { VoiceInput, useVoiceRecognition } from '@/voice'
import { CameraView, useCamera } from '@/camera'

// Technical layer imports (when needed)
import { formatDate } from '@/utils/date'
import { apiClient } from '@/services/api'
import type { PantryItem } from '@/types/pantry'

// External library imports
import { useCallback, useEffect } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { Tabs, TabsContent } from '@radix-ui/react-tabs'
```

## Component Library Standards

### Radix UI + Tailwind Integration
- **Base Components**: Use Radix UI primitives for accessibility
- **Styling**: Tailwind CSS for responsive design
- **Custom Variants**: Extend with custom component variants
- **Design System**: Consistent spacing, colors, and typography

```typescript
// Component with Radix UI + Tailwind
import { Button as RadixButton } from '@radix-ui/react-button'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        danger: 'bg-red-600 text-white hover:bg-red-700'
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
)

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode
  onClick?: () => void
}

const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  children,
  onClick,
  ...props
}) => {
  return (
    <RadixButton
      className={buttonVariants({ variant, size })}
      onClick={onClick}
      {...props}
    >
      {children}
    </RadixButton>
  )
}
```

## PWA Development Standards

### Service Worker Implementation
- **Caching Strategy**: Network-first for dynamic content, cache-first for static
- **Offline Support**: Handle offline scenarios gracefully
- **Background Sync**: Queue actions for when connectivity returns
- **Push Notifications**: Optional user consent for alerts

```typescript
// Service worker registration
const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('SW registered:', registration)
    } catch (error) {
      console.log('SW registration failed')
    }
  }
}

// Background sync for offline actions
const queueOfflineAction = async (action: OfflineAction) => {
  const cache = await caches.open('offline-queue')
  await cache.put(new Request(`/queue/${Date.now()}`), new Response(JSON.stringify(action)))
}
```

### Web App Manifest
- **Icons**: Multiple sizes for different devices
- **Theme Colors**: Match app theme and system preferences
- **Display Mode**: Standalone for app-like experience
- **Orientation**: Portrait-primary for mobile optimization

## Styling Guidelines

### CSS Modules
- **Scoped Styles**: Use CSS modules for component-specific styles
- **BEM Methodology**: Block Element Modifier naming convention
- **Variables**: Use CSS custom properties for colors and spacing

```css
/* Good: BEM with CSS modules */
.pantryItem {
  display: flex;
  padding: var(--spacing-md);
}

.pantryItem__name {
  font-weight: 600;
}

.pantryItem__quantity--low {
  color: var(--color-warning);
}
```

### Responsive Design
- **Mobile First**: Design for mobile, enhance for larger screens
- **Breakpoint Variables**: Use consistent breakpoint values
- **Flexible Units**: Use rem/em for scalable layouts

## Error Handling

### Error Boundaries
- **React Error Boundaries**: Wrap components that might throw errors
- **Graceful Degradation**: Handle errors without breaking the app
- **User Feedback**: Provide clear error messages to users

### Async Operations
- **Loading States**: Show loading indicators during async operations
- **Error States**: Handle and display async errors appropriately
- **Retry Logic**: Implement retry mechanisms for failed requests

## Testing Guidelines

### Comprehensive Testing Strategy
- **Unit Tests**: Test individual functions and hooks
- **Integration Tests**: Test component interactions and API calls
- **E2E Tests**: Test complete user workflows
- **Visual Tests**: Ensure UI consistency across devices

### Unit Tests with Vitest
- **Test Files**: Place next to implementation files
- **Naming**: `.test.ts` or `.spec.ts` suffix
- **Coverage**: Aim for 85%+ code coverage
- **Mock Strategy**: Mock external APIs and browser APIs

```typescript
// Hook testing example
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePantryStats } from '@/hooks/usePantry'

describe('usePantryStats', () => {
  it('should calculate correct statistics', () => {
    const mockItems: PantryItem[] = [
      { id: '1', name: 'Milk', quantity: 1, category: 'dairy' },
      { id: '2', name: 'Bread', quantity: 2, category: 'bakery' }
    ]

    const { result } = renderHook(() => usePantryStats(mockItems))

    expect(result.current).toEqual({
      total: 2,
      byCategory: {
        dairy: 1,
        bakery: 1
      },
      lowStock: []
    })
  })
})
```

### Integration Tests
- **Component Integration**: Test component interactions
- **API Integration**: Test service layer with real APIs
- **State Integration**: Test Context + hooks together

```typescript
// Integration test example
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PantryProvider } from '@/context/PantryContext'
import { PantryView } from '@/components/pantry/PantryView'

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <PantryProvider>
      {component}
    </PantryProvider>
  )
}

describe('PantryView Integration', () => {
  it('should add item and update list', async () => {
    renderWithProvider(<PantryView />)

    const addButton = screen.getByRole('button', { name: /add item/i })
    fireEvent.click(addButton)

    const nameInput = screen.getByLabelText(/item name/i)
    const quantityInput = screen.getByLabelText(/quantity/i)

    fireEvent.change(nameInput, { target: { value: 'Apples' } })
    fireEvent.change(quantityInput, { target: { value: '5' } })

    const submitButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Apples')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })
})
```

### E2E Tests with Playwright
- **Critical Paths**: Test complete user journeys
- **Cross-browser**: Test on different browsers
- **Mobile Simulation**: Test touch interactions

```typescript
// E2E test example
import { test, expect } from '@playwright/test'

test('complete shopping workflow', async ({ page }) => {
  await page.goto('/')

  // Add item via voice (simulated)
  await page.click('[data-testid="voice-input-button"]')
  await page.fill('[data-testid="voice-simulator"]', 'add milk to shopping list')
  await page.click('[data-testid="voice-submit"]')

  // Verify item was added
  await expect(page.locator('text=Milk')).toBeVisible()

  // Mark as purchased
  await page.click('[data-testid="mark-purchased"]')

  // Verify moved to completed
  await expect(page.locator('[data-testid="completed-items"]')).toContainText('Milk')
})
```

### API Testing
- **Service Layer**: Test API calls and error handling
- **Mock Responses**: Use MSW for consistent API testing
- **Rate Limiting**: Test API rate limit scenarios

```typescript
// API service testing
import { describe, it, expect, vi } from 'vitest'
import { rest } from 'msw'
import { server } from '@/test/mocks/server'
import { barcodeLookupService } from '@/services/barcode.service'

describe('barcodeLookupService', () => {
  it('should return product data for valid barcode', async () => {
    const mockResponse = {
      name: 'Organic Milk',
      brand: 'Local Dairy',
      category: 'dairy'
    }

    server.use(
      rest.get('/api/barcode/:code', (req, res, ctx) => {
        return res(ctx.json(mockResponse))
      })
    )

    const result = await barcodeLookupService.lookup('123456789')
    expect(result).toEqual(mockResponse)
  })

  it('should handle API errors gracefully', async () => {
    server.use(
      rest.get('/api/barcode/:code', (req, res, ctx) => {
        return res(ctx.status(404))
      })
    )

    await expect(
      barcodeLookupService.lookup('invalid')
    ).rejects.toThrow('Barcode not found')
  })
})
```

## Performance Best Practices

### Mobile-First Performance
- **Bundle Size**: Keep initial bundle under 200KB (gzipped)
- **First Paint**: Achieve <2 second initial load on mobile
- **Runtime Performance**: Maintain 60fps for all interactions
- **Memory Usage**: Efficient garbage collection and memory management

### React Performance Optimization
- **Memoization Strategy**: Use React.memo for expensive components
- **useMemo/useCallback**: For expensive computations and event handlers
- **Virtual Scrolling**: For lists >100 items using react-window
- **Code Splitting**: Route-based and component-based lazy loading

```typescript
// Smart memoization example
const PantryItem = React.memo<PantryItemProps>(({
  item,
  onEdit,
  onDelete
}) => {
  const handleEdit = useCallback(() => {
    onEdit(item)
  }, [onEdit, item.id]) // Only recreate if dependencies change

  const expirationStatus = useMemo(() => {
    return calculateExpirationStatus(item.expirationDate)
  }, [item.expirationDate])

  return (
    <div className="pantry-item">
      <h3>{item.name}</h3>
      <span className={`expiration ${expirationStatus}`}>
        {expirationStatus}
      </span>
      <button onClick={handleEdit}>Edit</button>
      <button onClick={() => onDelete(item.id)}>Delete</button>
    </div>
  )
})

// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window'

const PantryList: React.FC<{ items: PantryItem[] }> = ({ items }) => {
  const ItemRenderer = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const item = items[index]
    return (
      <div style={style}>
        <PantryItem key={item.id} item={item} />
      </div>
    )
  }

  return (
    <List
      height={400}
      itemCount={items.length}
      itemSize={50}
    >
      {ItemRenderer}
    </List>
  )
}
```

### Bundle Optimization
- **Tree Shaking**: Automatic removal of unused code
- **Dynamic Imports**: Lazy load feature modules
- **Asset Optimization**: WebP images, font subsetting
- **Service Worker**: Cache static assets efficiently

```typescript
// Dynamic imports for code splitting
const PantryView = lazy(() => import('@/components/pantry/PantryView'))
const ShoppingView = lazy(() => import('@/components/shopping/ShoppingView'))
const AnalyticsView = lazy(() => import('@/components/analytics/AnalyticsView'))

// Preload critical routes
const preloadRoute = (route: string) => {
  switch (route) {
    case '/pantry':
      import('@/components/pantry/PantryView')
      break
    case '/shopping':
      import('@/components/shopping/ShoppingView')
      break
  }
}
```

## Accessibility Standards

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 contrast ratio
- **Focus Management**: Visible focus indicators and logical tab order

```typescript
// Accessible component example
interface AccessibleButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onClick,
  disabled = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {children}
    </button>
  )
}
```

### Voice Interface Accessibility
- **Speech Feedback**: Audio confirmations for actions
- **Visual Alternatives**: Text alternatives for voice commands
- **Error Announcements**: Screen reader announcements for errors
- **Progress Feedback**: Status updates during voice processing

## Security Best Practices

### Data Privacy & Security
- **Local Processing**: Voice and camera data processed locally
- **Secure Storage**: Sensitive data encrypted in localStorage
- **API Security**: HTTPS-only for external API calls
- **Permission Management**: Transparent permission requests

```typescript
// Secure API client
class SecureApiClient {
  private baseURL: string
  private apiKey: string

  constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL
    this.apiKey = apiKey
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = new URL(endpoint, this.baseURL)

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    return response.json()
  }
}
```

### Input Validation & Sanitization
- **Type Safety**: Runtime type checking for API responses
- **Input Sanitization**: Clean user inputs before processing
- **Rate Limiting**: Prevent abuse of voice and API endpoints
- **Error Boundaries**: Graceful error handling without data leakage

## API Integration Patterns

### External Service Integration
- **Abstraction Layer**: Clean interfaces for different API providers
- **Fallback Strategy**: Multiple providers for reliability
- **Caching Layer**: Reduce API calls and improve performance
- **Error Recovery**: Retry logic and graceful degradation

```typescript
// API abstraction with fallbacks
interface RecipeApiProvider {
  searchRecipes(ingredients: string[]): Promise<Recipe[]>
  getRecipeDetails(id: string): Promise<RecipeDetails>
}

class RecipeService {
  private providers: RecipeApiProvider[] = [
    new SpoonacularApi(),
    new EdamamApi(),
    new FallbackProvider()
  ]

  async searchRecipes(ingredients: string[]): Promise<Recipe[]> {
    for (const provider of this.providers) {
      try {
        const recipes = await provider.searchRecipes(ingredients)
        // Cache successful results
        await this.cacheResults(ingredients, recipes)
        return recipes
      } catch (error) {
        console.warn(`Provider ${provider.constructor.name} failed:`, error)
      }
    }
    throw new Error('All recipe providers failed')
  }
}
```

### Barcode Integration
- **Multiple Libraries**: Support for different barcode formats
- **Camera Optimization**: Mobile-optimized scanning
- **Offline Fallback**: Manual entry when scanning fails
- **Privacy**: No barcode data sent to external servers without consent

## Documentation

### Code Comments
- **Purpose**: Explain why, not what (code should be self-explanatory)
- **JSDoc**: Use for complex functions and public APIs
- **TODO Comments**: Mark areas needing future work

```typescript
/**
 * Calculates the total value of pantry items
 * @param items - Array of pantry items
 * @param includeExpired - Whether to include expired items in calculation
 * @returns Total value in dollars
 */
const calculateTotalValue = (items: PantryItem[], includeExpired = false): number => {
  // Implementation
}
```

### README Files
- **Project README**: Overview, setup, and usage instructions
- **Component README**: For complex components or directories

## Git Workflow

### Commit Messages
- **Conventional Commits**: Use standard format
- **Clear Descriptions**: Explain what and why, not just what
- **Atomic Commits**: Each commit should be a single logical change

```
feat: add pantry item expiration tracking
fix: resolve shopping list duplicate items bug
docs: update component API documentation
```

### Branch Naming
- **Feature Branches**: `feature/add-item-modal`
- **Bug Fixes**: `fix/shopping-list-filter`
- **Documentation**: `docs/update-readme`

## Code Review Checklist

### Before Submitting
- [ ] Code follows style guidelines
- [ ] TypeScript types are properly defined
- [ ] No console.log statements in production code
- [ ] Tests pass and coverage maintained
- [ ] Documentation updated if needed

### During Review
- [ ] Code is readable and maintainable
- [ ] Proper error handling implemented
- [ ] Performance considerations addressed
- [ ] Security best practices followed
