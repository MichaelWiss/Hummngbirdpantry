/**
 * ViewRouter - Single responsibility view routing component
 * Following style.md: functional component, clear purpose
 */

import React from 'react'
import { PantryView, CategoryList, CategoryItems } from '@/components/pantry'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import type { ViewType } from '@/hooks/useAppNavigation'
import type { ItemCategory } from '@/types'

interface ViewRouterProps {
  currentView: ViewType
  activeCategory: ItemCategory | null
  onCategorySelect: (category: ItemCategory) => void
  onBack: () => void
}

/**
 * View routing component with error boundaries
 * Follows style.md: wrap feature areas for graceful error handling
 */
export const ViewRouter = React.memo<ViewRouterProps>(({
  currentView,
  activeCategory,
  onCategorySelect,
  onBack
}) => {
  const renderView = () => {
    switch (currentView) {
      case 'categories':
        return (
          <ErrorBoundary featureArea="categories">
            <CategoryList onSelect={onCategorySelect} />
          </ErrorBoundary>
        )
      
      case 'categoryItems':
        return activeCategory ? (
          <ErrorBoundary featureArea="category items">
            <CategoryItems category={activeCategory} onBack={onBack} />
          </ErrorBoundary>
        ) : null
      
      default:
        return (
          <ErrorBoundary featureArea="pantry">
            <PantryView />
          </ErrorBoundary>
        )
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {renderView()}
    </main>
  )
})

ViewRouter.displayName = 'ViewRouter'