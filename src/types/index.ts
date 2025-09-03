// Core type definitions for HummingbirdPantry application
// This file defines all TypeScript interfaces and types used throughout the app

// ============================================================================
// BASIC DATA TYPES
// ============================================================================

// Unique identifier type for all entities
export type ID = string & { readonly __brand: 'ID' }

// Branded types for domain safety
export type Barcode = string & { readonly __brand: 'Barcode' }
export type UserId = string & { readonly __brand: 'UserId' }
export type RecipeId = string & { readonly __brand: 'RecipeId' }

// Common status types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
export type ItemStatus = 'fresh' | 'expiring-soon' | 'expired' | 'consumed'
export type SyncStatus = 'synced' | 'pending' | 'failed'

// ============================================================================
// PANTRY ITEM TYPES
// ============================================================================

// Measurement units for quantities
export type MeasurementUnit =
  | 'pieces' | 'lbs' | 'kg' | 'oz' | 'g'
  | 'cups' | 'tbsp' | 'tsp' | 'ml' | 'l'
  | 'cans' | 'bottles' | 'packages'

// Item categories for organization
export type ItemCategory =
  | 'dairy' | 'meat' | 'produce' | 'bakery'
  | 'pantry' | 'frozen' | 'beverages' | 'snacks'
  | 'spices' | 'condiments' | 'canned' | 'other'

// Main pantry item interface
export interface PantryItem {
  // Core identification
  id: ID
  name: string

  // Categorization and organization
  category: ItemCategory
  barcode?: Barcode

  // Quantity and measurement
  quantity: number
  unit: MeasurementUnit

  // Dates and expiration
  purchaseDate: Date
  expirationDate?: Date

  // Pricing information
  price?: number
  pricePerUnit?: number

  // Additional metadata
  brand?: string
  notes?: string
  tags: string[]

  // Nutritional information (for advanced features)
  nutritionalInfo?: NutritionalData

  // Status and computed fields
  status: ItemStatus
  daysUntilExpiration?: number
  lastModified: Date
}

// Nutritional information structure
export interface NutritionalData {
  calories?: number
  protein?: number // grams
  carbs?: number   // grams
  fat?: number     // grams
  fiber?: number   // grams
  sugar?: number   // grams
  sodium?: number  // mg
  servingSize?: string
}

// ============================================================================
// SHOPPING LIST TYPES
// ============================================================================

// Shopping list item structure
export interface ShoppingItem {
  id: ID
  name: string
  category: ItemCategory

  // Quantity needed
  quantity: number
  unit: MeasurementUnit

  // Status tracking
  isCompleted: boolean
  completedAt?: Date

  // Store organization (advanced feature)
  aisle?: string
  storeSection?: string

  // Price tracking
  estimatedPrice?: number

  // Source information
  addedFrom: 'manual' | 'low-stock' | 'recipe' | 'voice'
  addedAt: Date
}

// Store layout for organization
export interface StoreLayout {
  id: string
  name: string
  sections: StoreSection[]
}

export interface StoreSection {
  id: string
  name: string
  aisle?: string
  categories: ItemCategory[]
}

// ============================================================================
// RECIPE AND MEAL PLANNING TYPES
// ============================================================================

// Recipe data structure
export interface Recipe {
  id: RecipeId
  title: string
  description?: string
  image?: string

  // Timing information
  prepTime?: number     // minutes
  cookTime?: number     // minutes
  totalTime?: number    // minutes
  servings: number

  // Ingredients and instructions
  ingredients: RecipeIngredient[]
  instructions: RecipeInstruction[]
  tags: string[]

  // Nutritional information
  nutrition?: RecipeNutrition

  // Source information
  source?: string       // URL or cookbook
  author?: string

  // User interaction
  rating?: number
  isFavorite: boolean
  lastUsed?: Date
}

export interface RecipeIngredient {
  id: string
  name: string
  quantity: number
  unit: MeasurementUnit
  notes?: string
  isOptional: boolean
}

export interface RecipeInstruction {
  id: string
  step: number
  instruction: string
  image?: string
  timer?: number // minutes
}

export interface RecipeNutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

// ============================================================================
// VOICE AND SPEECH RECOGNITION TYPES
// ============================================================================

// Voice command structure
export interface VoiceCommand {
  command: string
  intent: VoiceIntent
  entities: VoiceEntity[]
  confidence: number
}

export type VoiceIntent =
  | 'add-item'
  | 'remove-item'
  | 'find-item'
  | 'check-stock'
  | 'get-recipe'
  | 'add-to-shopping'
  | 'unknown'

export interface VoiceEntity {
  type: 'item' | 'quantity' | 'category' | 'recipe'
  value: string
  confidence: number
}

// Voice recognition state
export interface VoiceState {
  isListening: boolean
  isProcessing: boolean
  transcript: string
  error?: string
  lastCommand?: VoiceCommand
}

// ============================================================================
// BARCODE CACHE TYPES
// ============================================================================

// Cache entry structure for offline storage
export interface BarcodeCacheEntry {
  barcode: Barcode
  productData: Partial<PantryItem>
  timestamp: Date
  lastAccessed: Date
  accessCount: number
  source: 'api' | 'manual' | 'mock'
  ttl?: Date // Time to live for cache expiration
}

// Cache metadata and statistics
export interface BarcodeCacheStats {
  totalEntries: number
  lastSync: Date | null
  cacheSize: number // Approximate size in bytes
  hitRate: number // Cache hit percentage
  avgLookupTime: number // Average lookup time in ms
}

// Cache configuration
export interface BarcodeCacheConfig {
  maxSize: number // Maximum cache entries
  ttl: number // Default TTL in milliseconds
  syncInterval: number // Background sync interval in ms
  enableBackgroundSync: boolean
  enableCompression: boolean
}

// Cache operation results
export interface CacheLookupResult {
  found: boolean
  data: Partial<PantryItem> | null
  source: 'cache' | 'api' | 'mock' | 'none'
  timestamp: Date
  cached: boolean
}

// ============================================================================
// CAMERA AND BARCODE TYPES
// ============================================================================

// Camera modes for different use cases
export type CameraMode = 'barcode' | 'photo' | 'receipt'

// Camera constraints for different modes
export interface CameraConstraints {
  video: {
    facingMode: 'user' | 'environment'
    width: { ideal: number; min?: number; max?: number }
    height: { ideal: number; min?: number; max?: number }
  }
  audio?: boolean
}

// Barcode scan result
export interface BarcodeResult {
  format: string
  text: string
  timestamp: Date
  confidence?: number
}

// Photo capture result
export interface PhotoResult {
  dataUrl: string
  blob: Blob
  timestamp: Date
  metadata?: {
    width: number
    height: number
    camera: string
  }
}

// ============================================================================
// CHAT AND AI ASSISTANT TYPES
// ============================================================================

// Chat message structure
export interface ChatMessage {
  id: ID
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: Date

  // Message metadata
  type: 'text' | 'voice' | 'image' | 'suggestion'
  attachments?: ChatAttachment[]

  // AI-specific metadata
  confidence?: number
  intents?: string[]
  entities?: ChatEntity[]
}

export interface ChatAttachment {
  type: 'image' | 'voice' | 'receipt'
  url: string
  metadata?: Record<string, any>
}

export interface ChatEntity {
  type: string
  value: string
  start: number
  end: number
  confidence: number
}

// Chat conversation state
export interface ChatState {
  messages: ChatMessage[]
  isTyping: boolean
  error?: string
  suggestions: ChatSuggestion[]
}

// Quick action suggestions from AI
export interface ChatSuggestion {
  id: string
  type: 'add-to-pantry' | 'add-to-shopping' | 'find-recipe' | 'check-stock'
  title: string
  description?: string
  action: () => void
  confidence: number
}

// ============================================================================
// APPLICATION STATE TYPES
// ============================================================================

// Main application state
export interface AppState {
  // Core data
  pantry: PantryState
  shopping: ShoppingState
  chat: ChatState

  // UI state
  ui: UIState

  // System state
  system: SystemState
}

// Pantry-specific state
export interface PantryState {
  items: PantryItem[]
  categories: ItemCategory[]
  filters: PantryFilters
  sortBy: PantrySortOption
  selectedItems: ID[]
  loading: LoadingState
  error?: string
}

export interface PantryFilters {
  categories: ItemCategory[]
  status: ItemStatus[]
  searchQuery: string
  dateRange?: {
    start: Date
    end: Date
  }
}

export type PantrySortOption =
  | 'name-asc' | 'name-desc'
  | 'date-asc' | 'date-desc'
  | 'expiry-asc' | 'expiry-desc'
  | 'category-asc' | 'category-desc'

// Shopping list state
export interface ShoppingState {
  items: ShoppingItem[]
  storeLayout?: StoreLayout
  filters: ShoppingFilters
  sortBy: ShoppingSortOption
  selectedItems: ID[]
  loading: LoadingState
  error?: string
}

export interface ShoppingFilters {
  categories: ItemCategory[]
  completed: boolean
  storeSection?: string
}

export type ShoppingSortOption =
  | 'name-asc' | 'name-desc'
  | 'category-asc' | 'category-desc'
  | 'aisle-asc' | 'aisle-desc'

// UI state for global UI concerns
export interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  activeTab: 'pantry' | 'shopping' | 'chat' | 'analytics'
  modals: ModalState[]
  notifications: Notification[]
  loadingStates: Record<string, LoadingState>
}

export interface ModalState {
  id: string
  type: string
  props?: Record<string, any>
  isOpen: boolean
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// System state for app-wide concerns
export interface SystemState {
  isOnline: boolean
  syncStatus: SyncStatus
  lastSync?: Date
  voiceEnabled: boolean
  cameraEnabled: boolean
  permissions: PermissionsState
  settings: AppSettings
}

export interface PermissionsState {
  camera: PermissionState
  microphone: PermissionState
  notifications: PermissionState
}

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown'

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: string
  units: 'imperial' | 'metric'
  currency: string
  notifications: {
    expiringItems: boolean
    lowStock: boolean
    shoppingReminders: boolean
  }
  voice: {
    enabled: boolean
    language: string
    speed: number
    volume: number
  }
  camera: {
    defaultMode: CameraMode
    autoFocus: boolean
    flash: boolean
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T
  error?: string
  loading: boolean
  timestamp: Date
}

// Generic pagination type
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
  hasPrev: boolean
}

// Form validation types
export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface FormState<T> {
  data: T
  errors: ValidationError[]
  touched: Record<keyof T, boolean>
  isValid: boolean
  isSubmitting: boolean
}

// Event types for custom events
export interface CustomEventMap {
  'pantry:item-added': CustomEvent<PantryItem>
  'pantry:item-updated': CustomEvent<{ id: ID; updates: Partial<PantryItem> }>
  'pantry:item-deleted': CustomEvent<ID>
  'shopping:item-completed': CustomEvent<ID>
  'voice:command-recognized': CustomEvent<VoiceCommand>
  'camera:barcode-scanned': CustomEvent<BarcodeResult>
  'sync:completed': CustomEvent<{ timestamp: Date }>
}

// ============================================================================
// ACTION TYPES FOR STATE MANAGEMENT
// ============================================================================

// Generic action type for reducers
export interface Action<T = string, P = any> {
  type: T
  payload?: P
  meta?: Record<string, any>
  error?: boolean
}

// Pantry-specific actions
export type PantryAction =
  | Action<'pantry/add-item', PantryItem>
  | Action<'pantry/update-item', { id: ID; updates: Partial<PantryItem> }>
  | Action<'pantry/delete-item', ID>
  | Action<'pantry/bulk-update', { ids: ID[]; updates: Partial<PantryItem> }>
  | Action<'pantry/set-filters', Partial<PantryFilters>>
  | Action<'pantry/set-sort', PantrySortOption>
  | Action<'pantry/select-items', ID[]>

// Shopping-specific actions
export type ShoppingAction =
  | Action<'shopping/add-item', ShoppingItem>
  | Action<'shopping/update-item', { id: ID; updates: Partial<ShoppingItem> }>
  | Action<'shopping/delete-item', ID>
  | Action<'shopping/toggle-completed', ID>
  | Action<'shopping/bulk-complete', ID[]>
  | Action<'shopping/set-filters', Partial<ShoppingFilters>>
  | Action<'shopping/set-store-layout', StoreLayout>

// Chat-specific actions
export type ChatAction =
  | Action<'chat/send-message', Omit<ChatMessage, 'id' | 'timestamp'>>
  | Action<'chat/receive-message', ChatMessage>
  | Action<'chat/add-suggestion', ChatSuggestion>
  | Action<'chat/clear-messages'>
  | Action<'chat/set-typing', boolean>

// UI actions
export type UIAction =
  | Action<'ui/set-theme', 'light' | 'dark' | 'system'>
  | Action<'ui/toggle-sidebar'>
  | Action<'ui/set-active-tab', UIState['activeTab']>
  | Action<'ui/open-modal', Omit<ModalState, 'isOpen'>>
  | Action<'ui/close-modal', string>
  | Action<'ui/add-notification', Omit<Notification, 'id'>>
  | Action<'ui/remove-notification', string>

// System actions
export type SystemAction =
  | Action<'system/set-online', boolean>
  | Action<'system/set-sync-status', SyncStatus>
  | Action<'system/update-permissions', Partial<PermissionsState>>
  | Action<'system/update-settings', Partial<AppSettings>>

// Combined action type for the root reducer
export type AppAction =
  | PantryAction
  | ShoppingAction
  | ChatAction
  | UIAction
  | SystemAction

// ============================================================================
// HOOK TYPES
// ============================================================================

// Custom hook return types for better TypeScript support
export interface UsePantryReturn {
  items: PantryItem[]
  filteredItems: PantryItem[]
  addItem: (item: Omit<PantryItem, 'id' | 'status' | 'lastModified'>) => Promise<void>
  updateItem: (id: ID, updates: Partial<PantryItem>) => Promise<void>
  deleteItem: (id: ID) => Promise<void>
  bulkUpdate: (ids: ID[], updates: Partial<PantryItem>) => Promise<void>
  setFilters: (filters: Partial<PantryFilters>) => void
  setSortBy: (sort: PantrySortOption) => void
  loading: LoadingState
  error?: string
}

export interface UseVoiceReturn {
  isListening: boolean
  transcript: string
  startListening: () => Promise<void>
  stopListening: () => void
  error?: string
  lastCommand?: VoiceCommand
  supported: boolean
}

export interface UseCameraReturn {
  isActive: boolean
  mode: CameraMode
  startCamera: (mode?: CameraMode) => Promise<void>
  stopCamera: () => void
  capturePhoto: () => Promise<PhotoResult>
  scanBarcode: () => Promise<BarcodeResult>
  error?: string
  supported: boolean
  permissions: {
    camera: PermissionState
    microphone: PermissionState
  }
}

export interface UseChatReturn {
  messages: ChatMessage[]
  isTyping: boolean
  suggestions: ChatSuggestion[]
  sendMessage: (content: string, type?: ChatMessage['type']) => Promise<void>
  addAttachment: (attachment: ChatAttachment) => void
  clearMessages: () => void
  error?: string
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

// API service interfaces for external integrations
export interface BarcodeService {
  lookup(barcode: Barcode): Promise<PantryItem | null>
  search(query: string): Promise<PantryItem[]>
}

export interface RecipeService {
  searchRecipes(ingredients: string[]): Promise<Recipe[]>
  getRecipe(id: RecipeId): Promise<Recipe>
  getRecipeByIngredients(ingredients: string[]): Promise<Recipe[]>
}

export interface StorageService {
  save<T>(key: string, data: T): Promise<void>
  load<T>(key: string): Promise<T | null>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
}

// Export default types for convenience
export type {
  PantryItem as Item,
  ShoppingItem as ShoppingListItem,
  ChatMessage as Message,
  Recipe as Meal,
  VoiceCommand as SpeechCommand,
  CameraMode as ScanMode
}
