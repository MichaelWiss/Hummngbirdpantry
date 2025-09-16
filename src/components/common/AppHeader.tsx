/**
 * AppHeader - Single responsibility header component
 * Following style.md: functional component with clear purpose
 */

import React from 'react'

interface AppHeaderProps {
  title?: string
  subtitle?: string
}

/**
 * Application header component
 * Follows style.md: single responsibility principle
 */
export const AppHeader = React.memo<AppHeaderProps>(({ 
  title = 'HummingbirdPantry', 
  subtitle = 'Smart Pantry Management' 
}) => {
  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-neutral-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-neutral-900 md:bg-gradient-to-r md:from-primary-600 md:to-primary-700 md:bg-clip-text md:text-transparent">
            {title}
          </h1>
          <p className="text-neutral-600 mt-1 text-sm">{subtitle}</p>
        </div>
      </div>
    </header>
  )
})

AppHeader.displayName = 'AppHeader'