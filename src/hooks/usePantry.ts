// Custom hooks for pantry management
// Provides easy-to-use interfaces for pantry store operations

import { useMemo, useCallback } from 'react'
import { usePantryStore } from '@/stores/pantry.store'
import type {
  PantryItem,
  ID,
  ItemCategory,
  MeasurementUnit,
  ItemStatus
} from '@/types'

// ============================================================================
// MAIN PANTRY HOOK
// ============================================================================

/**
 * Main hook for pantry management
 * Provides comprehensive access to pantry state and operations
 */
export const usePantry = () => {
  const store = usePantryStore()

  // Memoized computed values for performance
  const stats = useMemo(() => ({
    totalItems: store.totalItems,
    expiringSoonCount: store.expiringSoonCount,
    expiredCount: store.expiredCount,
    lowStockCount: store.lowStockCount,
    selectedCount: store.selectedItems.length
  }), [
    store.totalItems,
    store.expiringSoonCount,
    store.expiredCount,
    store.lowStockCount,
    store.selectedItems.length
  ])

  // Memoized filter helpers
  const hasActiveFilters = useMemo(() => {
    const { filters, searchQuery } = store
    return (
      filters.categories.length > 0 ||
      filters.status.length > 0 ||
      searchQuery.trim().length > 0 ||
      filters.dateRange !== undefined
    )
  }, [store.filters, store.searchQuery])

  return {
    // Core data
    items: store.items,
    filteredItems: store.filteredItems,

    // UI state
    filters: store.filters,
    sortBy: store.sortBy,
    selectedItems: store.selectedItems,
    searchQuery: store.searchQuery,

    // Status
    loading: store.loading,
    error: store.error,

    // Computed stats
    stats,
    hasActiveFilters,

    // Actions
    addItem: store.actions.addItem,
    updateItem: store.actions.updateItem,
    removeItem: store.actions.removeItem,
    bulkRemove: store.actions.bulkRemove,

    // Filtering and sorting
    setFilters: store.actions.setFilters,
    setSortBy: store.actions.setSortBy,
    setSearchQuery: store.actions.setSearchQuery,

    // Selection
    selectItem: store.actions.selectItem,
    selectItems: store.actions.selectItems,
    clearSelection: store.actions.clearSelection,

    // Utilities
    clearError: store.actions.clearError,
    resetFilters: store.actions.resetFilters,
    exportData: store.actions.exportData,
    importData: store.actions.importData
  }
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for pantry items with optimized re-renders
 * Only re-renders when items data changes
 */
export const usePantryItems = () => {
  const { items, filteredItems, loading, error } = usePantryStore()

  return useMemo(() => ({
    items,
    filteredItems,
    loading,
    error,
    itemCount: items.length,
    filteredCount: filteredItems.length
  }), [items, filteredItems, loading, error])
}

/**
 * Hook for pantry statistics
 * Provides quick access to key metrics
 */
export const usePantryStats = () => {
  const store = usePantryStore()

  return useMemo(() => ({
    total: store.totalItems,
    expiringSoon: store.expiringSoonCount,
    expired: store.expiredCount,
    lowStock: store.lowStockCount,
    categories: store.items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {} as Record<ItemCategory, number>),
    recentItems: [...store.items]
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
      .slice(0, 5)
  }), [store.totalItems, store.expiringSoonCount, store.expiredCount, store.lowStockCount, store.items])
}

/**
 * Hook for pantry filters management
 * Handles complex filtering logic
 */
export const usePantryFilters = () => {
  const { filters, setFilters, resetFilters, hasActiveFilters } = usePantry()

  // Memoized filter helpers
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.categories.length > 0) count++
    if (filters.status.length > 0) count++
    if (filters.searchQuery.trim()) count++
    if (filters.dateRange) count++
    if (filters.expiringWithinDays) count++
    return count
  }, [filters])

  // Category filter helpers
  const toggleCategory = useCallback((category: ItemCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]

    setFilters({ categories: newCategories })
  }, [filters.categories, setFilters])

  // Status filter helpers
  const toggleStatus = useCallback((status: ItemStatus) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status]

    setFilters({ status: newStatus })
  }, [filters.status, setFilters])

  return {
    filters,
    activeFiltersCount,
    hasActiveFilters,
    setFilters,
    resetFilters,

    // Category helpers
    toggleCategory,
    hasCategory: (category: ItemCategory) => filters.categories.includes(category),

    // Status helpers
    toggleStatus,
    hasStatus: (status: ItemStatus) => filters.status.includes(status)
  }
}

/**
 * Hook for pantry search functionality
 * Handles search input and debouncing
 */
export const usePantrySearch = (debounceMs: number = 300) => {
  const { searchQuery, setSearchQuery, filteredItems } = usePantry()

  // Debounced search (simplified - in production you'd use a proper debounce hook)
  const debouncedSetSearch = useCallback(
    (query: string) => {
      const timeoutId = setTimeout(() => setSearchQuery(query), debounceMs)
      return () => clearTimeout(timeoutId)
    },
    [setSearchQuery, debounceMs]
  )

  return {
    searchQuery,
    setSearchQuery,
    debouncedSetSearch,
    resultsCount: filteredItems.length,
    hasResults: filteredItems.length > 0
  }
}

/**
 * Hook for pantry item operations
 * Provides CRUD operations with optimistic updates
 */
export const usePantryItemOperations = () => {
  const { addItem, updateItem, removeItem, bulkRemove, loading, error } = usePantry()

  // Create item helper with validation
  const createItem = useCallback(async (itemData: {
    name: string
    category: ItemCategory
    quantity: number
    unit: MeasurementUnit
    expirationDate?: Date
    purchaseDate?: Date
    notes?: string
  }) => {
    // Basic validation
    if (!itemData.name.trim()) {
      throw new Error('Item name is required')
    }

    if (itemData.quantity <= 0) {
      throw new Error('Quantity must be greater than 0')
    }

    const newItem = {
      ...itemData,
      purchaseDate: itemData.purchaseDate || new Date(),
      notes: itemData.notes || '',
      status: 'fresh' as const,
      tags: []
    }

    await addItem(newItem)
  }, [addItem])

  // Update item helper
  const modifyItem = useCallback(async (id: ID, updates: Partial<PantryItem>) => {
    await updateItem(id, updates)
  }, [updateItem])

  // Delete item helper
  const deleteItem = useCallback(async (id: ID) => {
    await removeItem(id)
  }, [removeItem])

  // Bulk operations
  const deleteSelected = useCallback(async (selectedIds: ID[]) => {
    if (selectedIds.length === 0) return
    await bulkRemove(selectedIds)
  }, [bulkRemove])

  return {
    // Operations
    createItem,
    modifyItem,
    deleteItem,
    deleteSelected,

    // Status
    loading,
    error,

    // Helpers
    canCreate: !loading,
    canUpdate: !loading,
    canDelete: !loading
  }
}

/**
 * Hook for pantry data export/import
 * Handles file operations and error handling
 */
export const usePantryData = () => {
  const { exportData, importData, loading, error } = usePantry()

  const exportToFile = useCallback(async (filename: string = 'pantry-data.json') => {
    try {
      const data = await exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
      throw err
    }
  }, [exportData])

  const importFromFile = useCallback(async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          if (!content) throw new Error('File is empty')

          await importData(content)
          resolve()
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [importData])

  return {
    exportToFile,
    importFromFile,
    loading,
    error
  }
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for pantry item by ID
 * Useful for detail views and editing
 */
export const usePantryItem = (id: ID | null) => {
  const { items, loading, error } = usePantry()

  const item = useMemo(() => {
    if (!id) return null
    return items.find(item => item.id === id) || null
  }, [items, id])

  return {
    item,
    loading,
    error,
    exists: !!item
  }
}

/**
 * Hook for pantry items by category
 * Useful for category-specific views
 */
export const usePantryItemsByCategory = (category: ItemCategory | null) => {
  const { items, loading, error } = usePantry()

  const categoryItems = useMemo(() => {
    if (!category) return []
    return items.filter(item => item.category === category)
  }, [items, category])

  return {
    items: categoryItems,
    count: categoryItems.length,
    loading,
    error
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  PantryItem,
  ID,
  ItemCategory,
  MeasurementUnit,
  ItemStatus
} from '@/types'
