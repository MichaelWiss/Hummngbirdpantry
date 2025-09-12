// Pantry Store - Zustand-based state management for pantry inventory
// This store manages all pantry-related data and operations with persistence

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Import our comprehensive type definitions
import type {
  PantryItem,
  ID,
  ItemCategory,
  ItemStatus,
  LoadingState
} from '@/types'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// Enhanced pantry item with additional computed properties
export interface PantryItemWithMeta extends PantryItem {
  // Computed properties for UI optimization
  daysToExpiration?: number
  isExpiringSoon: boolean
  isExpired: boolean
  lastUpdated: Date
}

// Filter and sort options for pantry management
export interface PantryFilters {
  categories: ItemCategory[]
  status: ItemStatus[]
  searchQuery: string
  dateRange?: {
    start: Date
    end: Date
  }
  expiringWithinDays?: number
}

export type PantrySortOption =
  | 'name-asc' | 'name-desc'
  | 'category-asc' | 'category-desc'
  | 'date-added-asc' | 'date-added-desc'
  | 'expiration-asc' | 'expiration-desc'
  | 'quantity-asc' | 'quantity-desc'

// Main pantry store state interface
export interface PantryState {
  // Core data
  items: PantryItemWithMeta[]

  // UI state
  filters: PantryFilters
  sortBy: PantrySortOption
  selectedItems: ID[]
  searchQuery: string

  // Async state
  loading: LoadingState
  error: string | null

  // Computed properties
  filteredItems: PantryItemWithMeta[]
  totalItems: number
  expiringSoonCount: number
  expiredCount: number
  lowStockCount: number

  // Actions
  actions: {
    // CRUD operations
    addItem: (item: Omit<PantryItem, 'id' | 'lastModified' | 'status' | 'purchaseDate' | 'tags'>) => Promise<void>
    replaceAll: (items: PantryItem[]) => void
    upsertLocal: (item: PantryItem) => void
    updateItem: (id: ID, updates: Partial<PantryItem>) => Promise<void>
    removeItem: (id: ID) => Promise<void>
    bulkRemove: (ids: ID[]) => Promise<void>

    // Selection and filtering
    setFilters: (filters: Partial<PantryFilters>) => void
    setSortBy: (sortBy: PantrySortOption) => void
    setSearchQuery: (query: string) => void
    selectItem: (id: ID) => void
    selectItems: (ids: ID[]) => void
    clearSelection: () => void

    // Utility actions
    clearError: () => void
    resetFilters: () => void
    exportData: () => Promise<string>
    importData: (jsonData: string) => Promise<void>
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Generate unique IDs for pantry items
const generateId = (): ID => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as ID
}

// Calculate expiration status and metadata
const calculateExpirationMeta = (item: PantryItem): {
  daysToExpiration?: number
  isExpiringSoon: boolean
  isExpired: boolean
} => {
  if (!item.expirationDate) {
    return {
      isExpiringSoon: false,
      isExpired: false
    }
  }

  const now = new Date()
  const expiration = new Date(item.expirationDate)
  const diffTime = expiration.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return {
    daysToExpiration: diffDays,
    isExpiringSoon: diffDays >= 0 && diffDays <= 7, // Expiring within 7 days
    isExpired: diffDays < 0
  }
}

// ============================================================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================================================

export const usePantryStore = create<PantryState>()(
  // Immer middleware for immutable state updates
  immer(
    // Persist middleware for automatic localStorage sync
    persist(
      (set, get) => ({
        // INITIAL STATE
        items: [],
        filters: {
          categories: [],
          status: [],
          searchQuery: '',
          expiringWithinDays: 7
        },
        sortBy: 'name-asc',
        selectedItems: [],
        searchQuery: '',
        loading: 'idle',
        error: null,

        // COMPUTED PROPERTIES
        get filteredItems() {
          const state = get()
          let filtered = [...state.items]

          // Apply search filter
          if (state.searchQuery.trim()) {
            const query = state.searchQuery.toLowerCase()
            filtered = filtered.filter(item =>
              item.name.toLowerCase().includes(query) ||
              item.brand?.toLowerCase().includes(query) ||
              item.category.toLowerCase().includes(query)
            )
          }

          // Apply category filter
          if (state.filters.categories.length > 0) {
            filtered = filtered.filter(item =>
              state.filters.categories.includes(item.category)
            )
          }

          // Apply status filter
          if (state.filters.status.length > 0) {
            filtered = filtered.filter(item =>
              state.filters.status.includes(item.status)
            )
          }

          // Apply date range filter
          if (state.filters.dateRange) {
            filtered = filtered.filter(item => {
              const itemDate = new Date(item.purchaseDate)
              return itemDate >= state.filters.dateRange!.start &&
                     itemDate <= state.filters.dateRange!.end
            })
          }

          // Apply expiration filter
          if (typeof state.filters.expiringWithinDays === 'number' && state.filters.expiringWithinDays > 0) {
            filtered = filtered.filter(item =>
              item.daysToExpiration !== undefined &&
              item.daysToExpiration <= state.filters.expiringWithinDays &&
              item.daysToExpiration >= 0
            )
          }

          return filtered
        },

        get totalItems() {
          return get().items.length
        },

        get expiringSoonCount() {
          return get().items.filter(item => item.isExpiringSoon).length
        },

        get expiredCount() {
          return get().items.filter(item => item.isExpired).length
        },

        get lowStockCount() {
          // Consider low stock as quantity <= 1
          return get().items.filter(item => item.quantity <= 1).length
        },

        // ACTIONS
        actions: {
          // ADD ITEM
          addItem: async (itemData) => {
            set({ loading: 'loading', error: null })

            try {
              const newItem: PantryItemWithMeta = {
                ...itemData,
                id: generateId(),
                status: 'fresh',
                purchaseDate: new Date(),
                tags: [],
                lastModified: new Date(),
                ...calculateExpirationMeta(itemData as PantryItem),
                isExpiringSoon: (itemData as PantryItem).expirationDate ? calculateExpirationMeta(itemData as PantryItem).isExpiringSoon : false,
                isExpired: (itemData as PantryItem).expirationDate ? calculateExpirationMeta(itemData as PantryItem).isExpired : false,
                lastUpdated: new Date()
              } as PantryItemWithMeta

              set(state => {
                state.items.push(newItem)
                state.loading = 'success'
              })

              // Simulate API delay for realistic UX
              await new Promise(resolve => setTimeout(resolve, 300))

            } catch (error) {
              set({
                loading: 'error',
                error: error instanceof Error ? error.message : 'Failed to add item'
              })
            }
          },
          replaceAll: (items) => {
            set(state => {
              state.items = items.map(i => ({
                ...i,
                ...calculateExpirationMeta(i as PantryItem),
                lastModified: i.lastModified || new Date(),
                isExpiringSoon: i.expirationDate ? calculateExpirationMeta(i as PantryItem).isExpiringSoon : false,
                isExpired: i.expirationDate ? calculateExpirationMeta(i as PantryItem).isExpired : false,
                lastUpdated: new Date()
              }))
            })
          },
          upsertLocal: (item) => {
            set(state => {
              const idx = state.items.findIndex(x => x.id === item.id)
              const enriched = {
                ...item,
                ...calculateExpirationMeta(item as PantryItem),
                lastModified: new Date(),
                isExpiringSoon: item.expirationDate ? calculateExpirationMeta(item as PantryItem).isExpiringSoon : false,
                isExpired: item.expirationDate ? calculateExpirationMeta(item as PantryItem).isExpired : false,
                lastUpdated: new Date()
              }
              if (idx >= 0) state.items[idx] = enriched as any
              else state.items.push(enriched as any)
            })
          },

          // UPDATE ITEM
          updateItem: async (id, updates) => {
            set({ loading: 'loading', error: null })

            try {
              set(state => {
                const itemIndex = state.items.findIndex(item => item.id === id)
                if (itemIndex === -1) {
                  throw new Error('Item not found')
                }

                // Update the item
                const target = state.items[itemIndex]!
                Object.assign(target, {
                  ...updates,
                  lastModified: new Date()
                })

                // Recalculate expiration metadata if expiration date changed
                if (updates.expirationDate !== undefined) {
                  const updatedItem = state.items[itemIndex]!
                  const expirationMeta = calculateExpirationMeta(updatedItem)
                  Object.assign(updatedItem, expirationMeta)
                }

                ;(state.items[itemIndex] as any).lastUpdated = new Date()
                state.loading = 'success'
              })

              await new Promise(resolve => setTimeout(resolve, 200))

            } catch (error) {
              set({
                loading: 'error',
                error: error instanceof Error ? error.message : 'Failed to update item'
              })
            }
          },

          // REMOVE ITEM
          removeItem: async (id) => {
            set({ loading: 'loading', error: null })

            try {
              set(state => {
                const itemIndex = state.items.findIndex(item => item.id === id)
                if (itemIndex === -1) {
                  throw new Error('Item not found')
                }

                state.items.splice(itemIndex, 1)
                state.loading = 'success'
              })

              await new Promise(resolve => setTimeout(resolve, 200))

            } catch (error) {
              set({
                loading: 'error',
                error: error instanceof Error ? error.message : 'Failed to remove item'
              })
            }
          },

          // BULK REMOVE ITEMS
          bulkRemove: async (ids) => {
            set({ loading: 'loading', error: null })

            try {
              set(state => {
                // Remove all items with matching IDs
                state.items = state.items.filter(item => !ids.includes(item.id))
                state.selectedItems = state.selectedItems.filter(id => !ids.includes(id))
                state.loading = 'success'
              })

              await new Promise(resolve => setTimeout(resolve, 300))

            } catch (error) {
              set({
                loading: 'error',
                error: error instanceof Error ? error.message : 'Failed to remove items'
              })
            }
          },

          // FILTERING ACTIONS
          setFilters: (newFilters) => {
            set(state => {
              state.filters = { ...state.filters, ...newFilters }
            })
          },

          setSortBy: (sortBy) => {
            set({ sortBy })
          },

          setSearchQuery: (query) => {
            set({ searchQuery: query })
          },

          // SELECTION ACTIONS
          selectItem: (id) => {
            set(state => {
              const index = state.selectedItems.indexOf(id)
              if (index === -1) {
                state.selectedItems.push(id)
              } else {
                state.selectedItems.splice(index, 1)
              }
            })
          },

          selectItems: (ids) => {
            set({ selectedItems: ids })
          },

          clearSelection: () => {
            set({ selectedItems: [] })
          },

          // UTILITY ACTIONS
          clearError: () => {
            set({ error: null })
          },

          resetFilters: () => {
            set(state => {
              state.filters = {
                categories: [],
                status: [],
                searchQuery: '',
                expiringWithinDays: 7
              }
              state.searchQuery = ''
              state.selectedItems = []
            })
          },

          // EXPORT DATA
          exportData: async () => {
            try {
              const state = get()
              const exportData = {
                items: state.items,
                exportDate: new Date().toISOString(),
                version: '1.0'
              }
              return JSON.stringify(exportData, null, 2)
            } catch (error) {
              throw new Error('Failed to export data')
            }
          },

          // IMPORT DATA
          importData: async (jsonData) => {
            try {
              const importData = JSON.parse(jsonData)

              if (!importData.items || !Array.isArray(importData.items)) {
                throw new Error('Invalid import data format')
              }

              set(state => {
                // Merge imported items with existing ones, avoiding duplicates
                const existingIds = new Set(state.items.map(item => item.id))
                const newItems = importData.items
                  .filter((item: any) => !existingIds.has(item.id))
                  .map((item: any) => ({
                    ...item,
                    ...calculateExpirationMeta(item),
                    lastModified: new Date()
                  }))

                state.items.push(...newItems)
              })

            } catch (error) {
              throw new Error('Failed to import data: ' + (error as Error).message)
            }
          }
        }
      }),

      // PERSISTENCE CONFIGURATION
      {
        name: 'pantry-store', // localStorage key
        storage: createJSONStorage(() => localStorage),

        // Version for migration support
        version: 1,

        // Only persist essential data, not computed properties or loading states
        partialize: (state) => ({
          items: state.items,
          filters: state.filters,
          sortBy: state.sortBy,
          selectedItems: state.selectedItems,
          searchQuery: state.searchQuery
        }),

        // Migration function for future schema changes
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Migration from version 0 to 1
            return {
              ...persistedState,
              items: persistedState.items.map((item: any) => ({
                ...item,
                ...calculateExpirationMeta(item),
                lastModified: new Date()
              }))
            }
          }
          return persistedState
        }
      }
    )
  )
)

// ============================================================================
// CUSTOM HOOKS FOR EASY CONSUMPTION
// ============================================================================

// Main hook for pantry store access
export const usePantry = () => {
  const store = usePantryStore()
  return {
    // State
    ...store,

    // Computed getters (not persisted)
    filteredItems: store.filteredItems,
    totalItems: store.totalItems,
    expiringSoonCount: store.expiringSoonCount,
    expiredCount: store.expiredCount,
    lowStockCount: store.lowStockCount,

    // Actions
    ...store.actions
  }
}

// Specific hooks for common use cases
export const usePantryItems = () => {
  const { items, filteredItems, loading, error } = usePantryStore()
  return { items, filteredItems, loading, error }
}

export const usePantryActions = () => {
  const { actions } = usePantryStore()
  return actions
}

export const usePantryStats = () => {
  const { totalItems, expiringSoonCount, expiredCount, lowStockCount } = usePantryStore()
  return { totalItems, expiringSoonCount, expiredCount, lowStockCount }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// (Removed self re-exports to avoid conflicts)
