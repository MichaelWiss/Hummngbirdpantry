/**
 * Pantry Store - Clean state management
 * Following style.md: single responsibility, no mixed concerns
 * Following requirements.md: UI state only, server operations via hooks
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { PantryItem, ID, ItemCategory } from '@/types'

// UI-only state interface
interface PantryState {
  items: PantryItem[]
  searchQuery: string
  selectedCategory: ItemCategory | 'all'
  sortBy: 'name' | 'quantity' | 'lastModified'
  sortOrder: 'asc' | 'desc'
}

// UI-only actions interface
interface PantryActions {
  // Local state management (no server calls)
  replaceAll: (items: PantryItem[]) => void
  upsertLocal: (item: PantryItem) => void
  removeLocal: (id: ID) => void
  
  // UI state management
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: ItemCategory | 'all') => void
  setSortBy: (sortBy: PantryState['sortBy']) => void
  setSortOrder: (order: PantryState['sortOrder']) => void
  
  // Utilities
  clearAll: () => void
  getFilteredItems: () => PantryItem[]
}

interface PantryStore extends PantryState {
  actions: PantryActions
}

// Clean store implementation
export const usePantryStore = create<PantryStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      items: [],
      searchQuery: '',
      selectedCategory: 'all',
      sortBy: 'name',
      sortOrder: 'asc',

      actions: {
        // Replace all items (used by data loading)
        replaceAll: (items) =>
          set((state) => {
            state.items = items
          }),

        // Add or update single item (used by mutations)
        upsertLocal: (item) =>
          set((state) => {
            const existingIndex = state.items.findIndex(i => i.id === item.id)
            if (existingIndex >= 0) {
              state.items[existingIndex] = item
            } else {
              state.items.push(item)
            }
          }),

        // Remove item from local state
        removeLocal: (id) =>
          set((state) => {
            state.items = state.items.filter(item => item.id !== id)
          }),

        // UI state setters
        setSearchQuery: (query) =>
          set((state) => {
            state.searchQuery = query
          }),

        setSelectedCategory: (category) =>
          set((state) => {
            state.selectedCategory = category
          }),

        setSortBy: (sortBy) =>
          set((state) => {
            state.sortBy = sortBy
          }),

        setSortOrder: (order) =>
          set((state) => {
            state.sortOrder = order
          }),

        // Clear all data
        clearAll: () =>
          set((state) => {
            state.items = []
            state.searchQuery = ''
            state.selectedCategory = 'all'
          }),

        // Get filtered and sorted items
        getFilteredItems: () => {
          const state = get()
          let filtered = [...state.items]

          // Apply search filter
          if (state.searchQuery.trim()) {
            const query = state.searchQuery.toLowerCase()
            filtered = filtered.filter(item =>
              item.name.toLowerCase().includes(query) ||
              item.brand?.toLowerCase().includes(query) ||
              item.notes?.toLowerCase().includes(query)
            )
          }

          // Apply category filter
          if (state.selectedCategory !== 'all') {
            filtered = filtered.filter(item => item.category === state.selectedCategory)
          }

          // Apply sorting
          filtered.sort((a, b) => {
            let aValue: any
            let bValue: any

            switch (state.sortBy) {
              case 'name':
                aValue = a.name.toLowerCase()
                bValue = b.name.toLowerCase()
                break
              case 'quantity':
                aValue = a.quantity
                bValue = b.quantity
                break
              case 'lastModified':
                aValue = a.lastModified?.getTime() ?? 0
                bValue = b.lastModified?.getTime() ?? 0
                break
              default:
                return 0
            }

            if (aValue < bValue) return state.sortOrder === 'asc' ? -1 : 1
            if (aValue > bValue) return state.sortOrder === 'asc' ? 1 : -1
            return 0
          })

          return filtered
        }
      }
    })),
    {
      name: 'hummingbird-pantry-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        searchQuery: state.searchQuery,
        selectedCategory: state.selectedCategory,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      })
    }
  )
)