/**
 * usePantryData Hook - Clean read-only pantry data access
 * Following style.md: single responsibility, clean computed values
 * Following requirements.md: UI state derivation from server data
 */

import { useMemo } from 'react'
import { usePantryStore } from '@/stores/pantry.store'

/**
 * Read-only hook for pantry data and computed stats
 */
export const usePantryData = () => {
  const store = usePantryStore()
  const { items, searchQuery, selectedCategory } = store
  const { getFilteredItems, setSearchQuery } = store.actions

  // Compute stats from items
  const stats = useMemo(() => {
    const now = new Date()
    const filteredItems = getFilteredItems()
    
    return {
      total: items.length,
      filtered: filteredItems.length,
      expiringSoon: items.filter(item => {
        if (!item.expirationDate) return false
        const daysUntilExpiration = Math.ceil((item.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiration > 0 && daysUntilExpiration <= 3
      }).length,
      expired: items.filter(item => {
        if (!item.expirationDate) return false
        return item.expirationDate < now
      }).length,
      lowStock: items.filter(item => item.quantity <= 2).length
    }
  }, [items, getFilteredItems])

  // Get filtered items for display
  const filteredItems = usePantryStore((state) => {
    return state.items.filter((item) => {
      const matchesSearch = state.searchQuery === '' || item.name.toLowerCase().includes(state.searchQuery.toLowerCase())
      const matchesCategory = state.selectedCategory === 'all' || item.category === state.selectedCategory
      return matchesSearch && matchesCategory
    })
  })

  return {
    // Raw data
    items,
    filteredItems,
    
    // Computed stats
    stats,
    
    // UI state
    searchQuery,
    selectedCategory,
    
    // Loading state (always false since we're client-only now)
    loading: false,
    error: null,
    
    // Actions
    setSearchQuery,
    clearError: () => {} // No-op since we don't have errors in the clean store
  }
}

/**
 * Hook for pantry statistics only
 */
export const usePantryStats = () => {
  const { stats } = usePantryData()
  return stats
}