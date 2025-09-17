/**
 * App - Main application component
 * Refactored following style.md: single responsibility, component composition
 */

import React, { Suspense, lazy } from 'react'

// Architecture hooks following style.md patterns
import { 
  useAppNavigation, 
  useModalManager, 
  useScannerIntegration,
  useServerHealth,
  useAppInitialization
} from '@/hooks'

// Composed UI components following style.md patterns
import {
  AppHeader,
  BottomNavigation,
  ErrorBoundary,
  ServerStatusBanner,
  ViewRouter
} from '@/components/common'

// Lazy load heavy components for better performance
const AddItemModal = lazy(() => import('@/components/pantry/AddItemModal').then(module => ({ default: module.AddItemModal })))

/**
 * Main App component - now follows single responsibility principle
 * Only responsible for composing top-level layout and coordinating hooks
 */
const App: React.FC = () => {
  // Initialize app
  useAppInitialization()

  // Compose hooks following style.md hook composition pattern
  const navigation = useAppNavigation()
  const modals = useModalManager()
  const serverHealth = useServerHealth()
  
  // Scanner integration with proper error handling
  const scanner = useScannerIntegration({
    onScanSuccess: (data) => modals.openAddItemModal(data),
    onScanError: (error, barcode) => {
      console.error('Scanner error:', error)
      modals.openAddItemModal(barcode ? { barcode } : undefined)
    }
  })

  return (
    <ErrorBoundary featureArea="application">
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200">
        <ServerStatusBanner isHealthy={serverHealth.isHealthy} />
        
        <AppHeader />
        
        <ViewRouter
          currentView={navigation.currentView}
          activeCategory={navigation.activeCategory}
          onCategorySelect={navigation.navigateToCategory}
          onBack={navigation.navigateBack}
        />

        <BottomNavigation
          currentView={navigation.currentView}
          onNavigate={navigation.navigateToView}
          onScan={scanner.openScanner}
          onAdd={() => modals.openAddItemModal()}
        />

        {/* Modal with error boundary and suspense */}
        {modals.showAddItemModal && (
          <ErrorBoundary featureArea="add item modal">
            <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded-lg">Loading...</div>
            </div>}>
                            <AddItemModal
                {...(modals.addItemData ? { initialData: modals.addItemData } : {})}
                onClose={modals.closeAddItemModal}
                onOpenScanner={scanner.openScanner}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App