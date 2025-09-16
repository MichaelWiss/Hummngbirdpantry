/**
 * useAppNavigation - Custom hook for app navigation logic
 * Following style.md: single responsibility, custom hook extraction
 */

import { useState, useCallback } from 'react'
import type { ItemCategory } from '@/types'

export type ViewType = 'pantry' | 'categories' | 'categoryItems'

interface NavigationState {
  currentView: ViewType
  activeCategory: ItemCategory | null
}

/**
 * Custom hook for managing app navigation state
 * Follows style.md pattern: extract reusable logic into custom hooks
 */
export function useAppNavigation() {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentView: 'pantry',
    activeCategory: null
  })

  const navigateToView = useCallback((view: ViewType) => {
    setNavigationState(prev => ({
      ...prev,
      currentView: view,
      // Reset category when navigating away from category items
      activeCategory: view === 'categoryItems' ? prev.activeCategory : null
    }))
  }, [])

  const navigateToCategory = useCallback((category: ItemCategory) => {
    setNavigationState({
      currentView: 'categoryItems',
      activeCategory: category
    })
  }, [])

  const navigateBack = useCallback(() => {
    setNavigationState(prev => {
      switch (prev.currentView) {
        case 'categoryItems':
          return { ...prev, currentView: 'categories', activeCategory: null }
        default:
          return { ...prev, currentView: 'pantry', activeCategory: null }
      }
    })
  }, [])

  return {
    currentView: navigationState.currentView,
    activeCategory: navigationState.activeCategory,
    navigateToView,
    navigateToCategory,
    navigateBack
  }
}