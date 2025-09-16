/**
 * BottomNavigation - Single responsibility navigation component
 * Following style.md: functional component, compound pattern
 */

import React from 'react'
import { Package, BarChart3, Scan, Plus } from 'lucide-react'
import type { ViewType } from '@/hooks/useAppNavigation'

interface BottomNavigationProps {
  currentView: ViewType
  onNavigate: (view: ViewType) => void
  onScan: () => void
  onAdd: () => void
}

/**
 * Bottom navigation bar component
 * Follows style.md: single responsibility, clear purpose
 */
export const BottomNavigation = React.memo<BottomNavigationProps>(({
  currentView,
  onNavigate,
  onScan,
  onAdd
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-neutral-200 px-4 py-2">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <NavigationButton
          icon={<Package size={20} />}
          label="Pantry"
          isActive={currentView === 'pantry'}
          onClick={() => onNavigate('pantry')}
        />

        <NavigationButton
          icon={<BarChart3 size={20} />}
          label="Categories"
          isActive={currentView === 'categories'}
          onClick={() => onNavigate('categories')}
        />

        <NavigationButton
          icon={<Scan size={24} />}
          label="Scan"
          isActive={false}
          onClick={onScan}
          variant="primary"
        />

        <NavigationButton
          icon={<Plus size={20} />}
          label="Add"
          isActive={false}
          onClick={onAdd}
        />
      </div>
    </nav>
  )
})

BottomNavigation.displayName = 'BottomNavigation'

// Sub-component for navigation buttons (compound component pattern)
interface NavigationButtonProps {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
  variant?: 'default' | 'primary'
}

const NavigationButton = React.memo<NavigationButtonProps>(({
  icon,
  label,
  isActive,
  onClick,
  variant = 'default'
}) => {
  const getButtonClasses = () => {
    if (variant === 'primary') {
      return 'flex flex-col items-center py-2 px-3 rounded-lg text-primary-600 bg-primary-100 hover:bg-primary-200 transition-colors'
    }
    
    return `flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
      isActive 
        ? 'text-primary-600 bg-primary-50' 
        : 'text-neutral-600 hover:text-neutral-900'
    }`
  }

  return (
    <button onClick={onClick} className={getButtonClasses()}>
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  )
})

NavigationButton.displayName = 'NavigationButton'