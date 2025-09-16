/**
 * App - Main application component
 * Clean implementation following style.md and requirements.md
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Package, BarChart3, Scan, Plus } from 'lucide-react'

import type { ItemCategory, MeasurementUnit, Barcode } from '@/types'
import PantryView from '@/components/pantry/PantryView'
import CategoryList from '@/components/pantry/CategoryList'
import CategoryItems from '@/components/pantry/CategoryItems'
import { AddItemModal } from '@/components/pantry/AddItemModal'
import { useScanner } from '@/components/barcode/ScannerProvider'
import { processScanResult } from '@/services/scanService'
import { checkServerHealth } from '@/services/healthService'
import { useAppInitialization } from '@/hooks/useAppInitialization'

type ViewType = 'pantry' | 'categories' | 'categoryItems'

interface AddItemData {
  name?: string
  category?: ItemCategory
  quantity?: number
  unit?: MeasurementUnit
  barcode?: Barcode | ''
  notes?: string
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
        setAddItemData(result.data)
      }
      setShowAddItemModal(true)
    } catch (error) {
      console.error('Scan processing failed:', error)
      setAddItemData({ barcode: barcode as Barcode })
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
        return <CategoryList onSelect={showCategoryView} />
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
          {...(addItemData ? { initialData: addItemData } : {})}
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