/**
 * App - Main application component
 * Clean implementation following style.md and requirements.md
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Package, BarChart3, Scan, Plus } from 'lucide-react'

import type { ItemCategory } from '@/types'
import PantryView from '@/components/pantry/PantryView'
import CategoryList from '@/components/pantry/CategoryList'
import CategoryItems from '@/components/pantry/CategoryItems'
import AddItemModal from '@/components/pantry/AddItemModal'
import { useScanner } from '@/components/barcode/ScannerProvider'
import { processScanResult } from '@/services/scanService'
import { checkServerHealth } from '@/services/healthService'
import { useAppInitialization } from '@/hooks/useAppInitialization'

type ViewType = 'pantry' | 'categories' | 'categoryItems'

interface AddItemData {
  name?: string
  category?: ItemCategory
  quantity?: number
  barcode?: string
  brand?: string
}

const App: React.FC = () => {
  // Clean state management
  const [currentView, setCurrentView] = useState<ViewType>('pantry')
  const [activeCategory, setActiveCategory] = useState<ItemCategory | null>(null)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null)
  const [addItemData, setAddItemData] = useState<AddItemData | undefined>()

  // Initialize app and check server health
  useAppInitialization()

  // Scanner integration
  const scannerCtx = useScanner()

  // Clean scan handler following requirements pipeline
  const handleScanResult = useCallback(async (barcode: string) => {
    try {
      const result = await processScanResult(barcode)
      
      if (result.type === 'increment') {
        // Item incremented successfully, scanner will close automatically
        return
      }
      
      // Show add form with data
      if (result.data) {
        setAddItemData({
          name: result.data.name,
          category: result.data.category,
          quantity: result.data.quantity || 1,
          barcode: result.data.barcode,
          brand: result.data.brand
        })
      }
      setShowAddItemModal(true)
    } catch (error) {
      console.error('Scan processing failed:', error)
      setAddItemData({ barcode })
      setShowAddItemModal(true)
    }
  }, [])

  // Open scanner
  const openScanner = useCallback(() => {
    if (scannerCtx) {
      scannerCtx.open(handleScanResult)
    }
  }, [scannerCtx, handleScanResult])

  // Check server health on mount
  useEffect(() => {
    checkServerHealth().then(health => {
      setServerHealthy(health.isHealthy)
    })
  }, [])

  // Navigation handlers
  const showCategoryView = useCallback((category: ItemCategory) => {
    setActiveCategory(category)
    setCurrentView('categoryItems')
  }, [])

  const showAddItemForm = useCallback(() => {
    setAddItemData(undefined)
    setShowAddItemModal(true)
  }, [])

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'categories':
        return <CategoryList />
      case 'categoryItems':
        return activeCategory ? (
          <CategoryItems
            category={activeCategory}
            onBack={() => setCurrentView('categories')}
          />
        ) : null
      default:
        return <PantryView />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200">
      {/* Server status banner */}
      {serverHealthy === false && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="text-red-800 text-sm text-center">
            ⚠️ Server unreachable - data may not sync across devices
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-neutral-900 md:bg-gradient-to-r md:from-primary-600 md:to-primary-700 md:bg-clip-text md:text-transparent">
              HummingbirdPantry
            </h1>
            <p className="text-neutral-600 mt-1 text-sm">Smart Pantry Management</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentView()}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-neutral-200 px-4 py-2">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => setCurrentView('pantry')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              currentView === 'pantry' 
                ? 'text-primary-600 bg-primary-50' 
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Package size={20} />
            <span className="text-xs mt-1">Pantry</span>
          </button>

          <button
            onClick={() => setCurrentView('categories')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              currentView === 'categories' 
                ? 'text-primary-600 bg-primary-50' 
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <BarChart3 size={20} />
            <span className="text-xs mt-1">Categories</span>
          </button>

          <button
            onClick={openScanner}
            className="flex flex-col items-center py-2 px-3 rounded-lg text-primary-600 bg-primary-100 hover:bg-primary-200 transition-colors"
          >
            <Scan size={24} />
            <span className="text-xs mt-1">Scan</span>
          </button>

          <button
            onClick={showAddItemForm}
            className="flex flex-col items-center py-2 px-3 rounded-lg text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <Plus size={20} />
            <span className="text-xs mt-1">Add</span>
          </button>
        </div>
      </nav>

      {/* Add item modal */}
      {showAddItemModal && (
        <AddItemModal
          initialData={addItemData as any}
          onClose={() => {
            setShowAddItemModal(false)
            setAddItemData(undefined)
          }}
        />
      )}
    </div>
  )
}

export default App
        </div>
      </header>

      {/* One-Column Layout - Full Width on Mobile, Contained on Desktop */}
      <main className="w-full px-0 sm:px-4 sm:max-w-7xl sm:mx-auto lg:px-8 py-8">
        {currentView === 'pantry' && <PantryView />}
        {currentView === 'categories' && (
          <CategoryList onSelect={(cat) => { setActiveCategory(cat); setCurrentView('categoryItems') }} />
        )}
        {currentView === 'categoryItems' && activeCategory && (
          <CategoryItems category={activeCategory} onBack={() => setCurrentView('categories')} />
        )}
        {/* demo view removed */}
      </main>

      {/* Enhanced Neon connectivity banner */}
      {dbOk === false && (
        <div className="fixed top-0 inset-x-0 z-50">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
              <div>
                <strong>Neon database not reachable.</strong> Changes will not persist until connection is restored.
                <div className="text-xs mt-1 text-red-600">Check your internet connection or try again later.</div>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="text-red-800 hover:text-red-900 underline text-xs ml-4"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
      {dbOk === null && (
        <div className="fixed top-0 inset-x-0 z-50">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 text-sm">
              <strong>Checking Neon database connection...</strong>
            </div>
          </div>
        </div>
      )}
      {/* Legacy scanner fallback removed; ScannerProvider is the single render path */}

      {showAddItemModal && (
        <AddItemModal
          onClose={() => { setShowAddItemModal(false); setAddItemInitialData(undefined) }}
          onOpenScanner={openScanner}
          {...(addItemInitialData ? { initialData: addItemInitialData } : {})}
        />
      )}

      {/* Mobile Bottom Navigation - Clear and Readable */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-lg z-40">
        <div className="grid grid-cols-5 gap-0">
          {/* Pantry - Active State */}
          <button
            onClick={() => setCurrentView('pantry')}
            className={`flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              currentView === 'pantry'
                ? 'bg-primary-50 border-t-2 border-primary-500'
                : 'hover:bg-neutral-50'
            }`}
          >
            <Package size={20} className={currentView === 'pantry' ? 'text-primary-600 mb-1' : 'text-neutral-600 mb-1'} />
            <span className={`text-xs font-medium ${currentView === 'pantry' ? 'text-primary-700' : 'text-neutral-700'}`}>
              Pantry
            </span>
          </button>

          {/* Scan Barcode */}
          <button
            onClick={openScanner}
            className="flex flex-col items-center justify-center py-3 px-2 hover:bg-neutral-50 transition-colors"
          >
            <Scan size={20} className="text-neutral-600 mb-1" />
            <span className="text-xs font-medium text-neutral-700">Scan</span>
          </button>

          {/* Add Item */}
          <button
            onClick={() => { if (showAddItemModal) return; setShowAddItemModal(true) }}
            className="flex flex-col items-center justify-center py-3 px-2 hover:bg-neutral-50 transition-colors"
          >
            <Plus size={20} className="text-neutral-600 mb-1" />
            <span className="text-xs font-medium text-neutral-700">Add</span>
          </button>

          {/* Shopping List */}
          <button className="flex flex-col items-center justify-center py-3 px-2 hover:bg-neutral-50 transition-colors">
            <ShoppingCart size={20} className="text-neutral-600 mb-1" />
            <span className="text-xs font-medium text-neutral-700">Shop</span>
          </button>

          {/* Categories */}
          <button
            onClick={() => setCurrentView('categories')}
            className={`flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              currentView === 'categories' ? 'bg-primary-50 border-t-2 border-primary-500' : 'hover:bg-neutral-50'
            }`}
          >
            <BarChart3 size={20} className={currentView === 'categories' ? 'text-primary-600 mb-1' : 'text-neutral-600 mb-1'} />
            <span className={`text-xs font-medium ${currentView === 'categories' ? 'text-primary-700' : 'text-neutral-700'}`}>Categories</span>
          </button>
        </div>
      </nav>

      {/* Desktop Navigation - Clean Horizontal Bar */}
      <nav className="hidden md:flex fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-neutral-200 rounded-full shadow-lg px-6 py-3 z-40">
        <div className="flex space-x-8">
          <button
            onClick={() => setCurrentView('pantry')}
            className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'pantry'
                ? 'bg-primary-50 text-primary-700'
                : 'hover:bg-neutral-50 text-neutral-600'
            }`}
          >
            <Package size={20} />
            <span className="text-xs font-medium">Pantry</span>
          </button>

          <button
            onClick={openScanner}
            className="flex flex-col items-center space-y-1 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600"
          >
            <Scan size={20} />
            <span className="text-xs font-medium">Scan</span>
          </button>

          <button
            onClick={() => { if (showAddItemModal) return; setShowAddItemModal(true) }}
            className="flex flex-col items-center space-y-1 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600"
          >
            <Plus size={20} />
            <span className="text-xs font-medium">Add</span>
          </button>

          {/* demo button removed */}

          <button className="flex flex-col items-center space-y-1 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600">
            <ShoppingCart size={20} />
            <span className="text-xs font-medium">Shop</span>
          </button>

          <button className="flex flex-col items-center space-y-1 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600">
            <BarChart3 size={20} />
            <span className="text-xs font-medium">Stats</span>
          </button>
        </div>
      </nav>

      {/* Add bottom padding on mobile to account for navigation bar */}
      <div className="pb-20 md:pb-0"></div>

      {/* Footer - Hidden on mobile, shown on desktop */}
      <footer className="hidden md:block bg-white border-t border-neutral-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-neutral-500">
            <p>HummingbirdPantry - Smart Pantry Management</p>
            <p className="mt-1">Built with React, TypeScript, and Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
