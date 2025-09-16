// Pantry View Component - Enhanced with barcode scanning
// Professional pantry management with real-time barcode scanning

import React from 'react'
// Icons are not used in this component, they were moved to the bottom navigation
import { usePantryData, usePantryStats } from '@/hooks/usePantryData'
import { usePantryActions } from '@/hooks/usePantryActions'
// Barcode scanner handled by parent App component
// import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
// Modals are handled by parent App component
// import BarcodeScanner from '@/components/barcode/BarcodeScanner'
// import AddItemModal from '@/components/pantry/AddItemModal'
import type { PantryItem } from '@/types'

// PantryItemCard Component
const PantryItemCard = ({ item }: { item: PantryItem }) => {
  const { update } = usePantryActions()

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'fresh': return 'bg-green-100 text-green-800'
      case 'expiring-soon': return 'bg-yellow-100 text-yellow-800'
      case 'expired': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const handleSubtract = () => {
    console.log('Subtract button clicked for item:', item)
    if (item.quantity > 0) {
      update(item.id, { quantity: Math.max(0, item.quantity - 1) })
        .then(() => console.log('Quantity updated successfully'))
        .catch((error) => console.error('Failed to update quantity:', error))
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
          {item.status?.replace('-', ' ') || 'fresh'}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Quantity:</span>
          <span className="font-medium">{item.quantity} {item.unit}</span>
        </div>

        <div className="flex justify-between">
          <span>Expires:</span>
          <span className="font-medium">{item.expirationDate ? formatDate(item.expirationDate) : 'N/A'}</span>
        </div>

        {item.barcode && (
          <div className="flex justify-between">
            <span>Barcode:</span>
            <span className="font-mono text-xs bg-gray-100 px-1 rounded">{item.barcode.slice(-6)}</span>
          </div>
        )}
      </div>

      <button
        onClick={handleSubtract}
        className="button button-danger"
      >
        Subtract
      </button>
    </div>
  )
}

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
    clearError
  } = usePantryData()

  const stats = usePantryStats()
  // Barcode scanner handled by parent App component
  // const barcodeScanner = useBarcodeScanner()

  // Remove conflicting local state - navigation is handled by parent App component
  // const [showAddForm, setShowAddForm] = useState(false)
  // const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)

  return (
    <div className="pantry-view space-y-6 md:space-y-8 max-w-7xl mx-auto px-4 sm:px-0 pb-16">
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
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 md:p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-5 h-5 md:w-4 md:h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-blue-800 text-base md:text-sm">Processing...</span>
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item: any) => (
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
            className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 md:px-6 md:py-3 rounded-lg font-medium text-lg md:text-base transition-colors opacity-50 cursor-not-allowed"
            disabled
            title="Use the navigation bar below to add items"
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

      {/* Barcode scanner modal handled by parent App component */}

      {/* Modals are handled by parent App component */}
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PantryView
