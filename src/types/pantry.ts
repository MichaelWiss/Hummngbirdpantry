// Pantry-related type definitions
import type { 
  ID, 
  Barcode, 
  ItemStatus, 
  LoadingState, 
  ItemCategory, 
  MeasurementUnit,
  Action
} from './core'

// ============================================================================
// PANTRY ITEM TYPES
// ============================================================================

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
// PANTRY STATE TYPES
// ============================================================================

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
  | 'quantity-asc' | 'quantity-desc'
  | 'date-asc' | 'date-desc'
  | 'expiry-asc' | 'expiry-desc'
  | 'category-asc' | 'category-desc'

// ============================================================================
// PANTRY ACTION TYPES
// ============================================================================

// Pantry-specific actions
export type PantryAction =
  | Action<'pantry/add-item', PantryItem>
  | Action<'pantry/update-item', { id: ID; updates: Partial<PantryItem> }>
  | Action<'pantry/delete-item', ID>
  | Action<'pantry/bulk-update', { ids: ID[]; updates: Partial<PantryItem> }>
  | Action<'pantry/set-filters', Partial<PantryFilters>>
  | Action<'pantry/set-sort', PantrySortOption>
  | Action<'pantry/select-items', ID[]>

// ============================================================================
// PANTRY HOOK TYPES
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