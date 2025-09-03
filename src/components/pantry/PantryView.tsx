// Pantry View Component - Enhanced with barcode scanning
// Professional pantry management with real-time barcode scanning

import React, { useState } from 'react'
import { Scan, Plus } from 'lucide-react'
import { usePantry, usePantryStats } from '@/hooks/usePantry'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import BarcodeScanner from '@/components/barcode/BarcodeScanner'
import AddItemModal from '@/components/pantry/AddItemModal'
import type { ItemCategory, MeasurementUnit } from '@/types'

// ============================================================================
// MAIN PANTRY VIEW COMPONENT
// ============================================================================

const PantryView: React.FC = () => {
  // Use our custom pantry hooks
  const {
    filteredItems,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    addItem,
    clearError
  } = usePantry()

  const stats = usePantryStats()
  const barcodeScanner = useBarcodeScanner()

  // Local state for modals
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto px-4 sm:px-0">
      {/* Page Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 mb-2">My Pantry</h2>
        <p className="text-neutral-600">Manage your inventory with smart organization</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 md:p-4 rounded-lg border border-neutral-200">
          <div className="text-3xl md:text-2xl font-bold text-primary-600">{stats.total}</div>
          <div className="text-base md:text-sm text-neutral-600">Total Items</div>
        </div>

        <div className="bg-white p-6 md:p-4 rounded-lg border border-neutral-200">
          <div className="text-3xl md:text-2xl font-bold text-expiring">{stats.expiringSoon}</div>
          <div className="text-base md:text-sm text-neutral-600">Expiring Soon</div>
        </div>

        <div className="bg-white p-6 md:p-4 rounded-lg border border-neutral-200">
          <div className="text-3xl md:text-2xl font-bold text-expired">{stats.expired}</div>
          <div className="text-base md:text-sm text-neutral-600">Expired</div>
        </div>

        <div className="bg-white p-6 md:p-4 rounded-lg border border-neutral-200">
          <div className="text-3xl md:text-2xl font-bold text-organic">{stats.lowStock}</div>
          <div className="text-base md:text-sm text-neutral-600">Low Stock</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 md:p-4 rounded-lg border border-neutral-200">
        <input
          type="text"
          placeholder="Search pantry items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 md:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">⚠️</span>
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading === 'loading' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 md:p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-5 h-5 md:w-4 md:h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-blue-800 text-base md:text-sm">Processing...</span>
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <PantryItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && searchQuery === '' && (
        <div className="text-center py-16 md:py-12">
          <div className="text-7xl md:text-6xl mb-6">📦</div>
          <h3 className="text-2xl md:text-xl font-semibold text-neutral-900 mb-4">
            Your pantry is empty
          </h3>
          <p className="text-lg md:text-base text-neutral-600 mb-8">
            Start by adding your first pantry item
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 md:px-6 md:py-3 rounded-lg font-medium text-lg md:text-base transition-colors"
          >
            Add Your First Item
          </button>
        </div>
      )}

      {/* No Search Results */}
      {filteredItems.length === 0 && searchQuery !== '' && (
        <div className="text-center py-16 md:py-12">
          <div className="text-6xl md:text-4xl mb-6">🔍</div>
          <h3 className="text-2xl md:text-xl font-semibold text-neutral-900 mb-4">
            No items found
          </h3>
          <p className="text-lg md:text-base text-neutral-600">
            Try adjusting your search query
          </p>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onBarcodeDetected={async (barcode) => {
            try {
              console.log('🔍 Barcode scanned from main view:', barcode)
              const result = await barcodeScanner.onBarcodeDetected(barcode)

              if (result.found && result.productData) {
                // Quick add with confirmation
                const confirmed = confirm(
                  `Add "${result.productData.name}" to your pantry?`
                )

                if (confirmed) {
                  await barcodeScanner.quickAddScannedItem(
                    result.barcode,
                    result.productData,
                    1
                  )
                  console.log('✅ Item added via barcode scan')
                } else {
                  // User cancelled - open manual add form with barcode pre-filled
                  setShowAddForm(true)
                }
              } else {
                // Product not found - open manual add form
                console.log('⚠️ Product not found, opening manual add form')
                setShowAddForm(true)
              }

              setShowBarcodeScanner(false)
            } catch (error) {
              console.error('❌ Barcode processing error:', error)
              alert('Failed to process barcode. Please try again.')
            }
          }}
          onError={(error) => {
            console.error('❌ Scanner error:', error)
            alert(`Scanner error: ${error}`)
            setShowBarcodeScanner(false)
          }}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {/* Add Item Modal */}
      {showAddForm && (
        <AddItemModal
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PantryView
