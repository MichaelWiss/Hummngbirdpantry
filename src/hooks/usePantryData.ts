// usePantryData Hook - Read-only pantry data access
// Follows style.md principles: Single Responsibility, Readability First

import { useMemo } from 'react'
import { usePantryStore } from '@/stores/pantry.store'
import type { ItemCategory, ItemStatus } from '@/types'

/**
 * Read-only hook for pantry data and computed values
 * Provides clean access to pantry state without write operations
 */
export const usePantryData = () => {
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
    // Core data (read-only)
    items: store.items,
    filteredItems: store.filteredItems,
    
    // UI state (read-only)
    filters: store.filters,
    sortBy: store.sortBy,
    selectedItems: store.selectedItems,
    searchQuery: store.searchQuery,
    
    // Status (read-only)
    loading: store.loading,
    error: store.error,
    
    // Computed values
    stats,
    hasActiveFilters,
    
    // UI helpers (read-only operations)
    setFilters: store.actions.setFilters,
    setSortBy: store.actions.setSortBy,
    setSearchQuery: store.actions.setSearchQuery,
    selectItem: store.actions.selectItem,
    selectItems: store.actions.selectItems,
    clearSelection: store.actions.clearSelection,
    clearError: store.actions.clearError,
    resetFilters: store.actions.resetFilters
  }
}

/**
 * Specialized hook for pantry statistics only
 * Optimized for components that only need stats
 */
export const usePantryStats = () => {
  const { stats } = usePantryData()
  return stats
}

/**
 * Specialized hook for pantry filters
 * Optimized for filter components
 */
export const usePantryFilters = () => {
  const { 
    filters, 
    hasActiveFilters, 
    setFilters, 
    resetFilters 
  } = usePantryData()
  
  return {
    filters,
    hasActiveFilters,
    setFilters,
    resetFilters
  }
}
