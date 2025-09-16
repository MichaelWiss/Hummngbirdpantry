// Shopping-related type definitions
import type { 
  ID, 
  LoadingState, 
  ItemCategory, 
  MeasurementUnit,
  Action
} from './core'

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
// SHOPPING STATE TYPES
// ============================================================================

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

// ============================================================================
// SHOPPING ACTION TYPES
// ============================================================================

// Shopping-specific actions
export type ShoppingAction =
  | Action<'shopping/add-item', ShoppingItem>
  | Action<'shopping/update-item', { id: ID; updates: Partial<ShoppingItem> }>
  | Action<'shopping/delete-item', ID>
  | Action<'shopping/toggle-completed', ID>
  | Action<'shopping/clear-completed', void>
  | Action<'shopping/set-filters', Partial<ShoppingFilters>>
  | Action<'shopping/set-sort', ShoppingSortOption>