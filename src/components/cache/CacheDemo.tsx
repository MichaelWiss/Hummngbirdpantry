// Cache Demo Component - Interactive demonstration of offline barcode caching
// Shows cache statistics, manual operations, and performance metrics

import React, { useState } from 'react'
import { useBarcodeCache } from '@/hooks/useBarcodeCache'
import type { Barcode, PantryItem } from '@/types'
import { Database, Zap, Wifi, WifiOff, Trash2, RefreshCw, Search } from 'lucide-react'

const CacheDemo: React.FC = () => {
  const cache = useBarcodeCache()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ barcode: Barcode; data: Partial<PantryItem> }>>([])
  const [isSearching, setIsSearching] = useState(false)

  // Handle cache search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await cache.searchCache(searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle manual barcode caching
  const handleManualCache = async () => {
    const barcode = '999999999999' as Barcode
    const productData: Partial<PantryItem> = {
      name: 'Demo Product',
      category: 'snacks',
      brand: 'Cache Demo',
      unit: 'pieces'
    }

    try {
      await cache.cacheProduct(barcode, productData, 'manual')
      console.log('✅ Manually cached demo product')
    } catch (error) {
      console.error('❌ Failed to cache demo product:', error)
    }
  }

  // Handle cache cleanup
  const handleCleanup = async () => {
    try {
      await cache.cleanupCache()
      console.log('🧹 Cache cleanup completed')
    } catch (error) {
      console.error('❌ Cache cleanup failed:', error)
    }
  }

  // Handle force refresh stats
  const handleRefreshStats = async () => {
    await cache.refreshStats()
  }

  // Get cache health color
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Offline Cache Demo</h2>
        <p className="text-gray-600">Interactive demonstration of barcode caching system</p>
      </div>

      {/* Cache Status Overview */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Database className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-xl font-semibold text-gray-900">Cache Status</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {cache.stats?.totalEntries || 0}
            </div>
            <div className="text-sm text-gray-600">Total Entries</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {cache.cacheSizeFormatted}
            </div>
            <div className="text-sm text-gray-600">Cache Size</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {cache.cacheHitRate}
            </div>
            <div className="text-sm text-gray-600">Hit Rate</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(cache.cacheHealth)}`}>
              {cache.cacheHealth}
            </div>
            <div className="text-sm text-gray-600 mt-1">Health</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRefreshStats}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Stats
          </button>

          <button
            onClick={handleCleanup}
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Cleanup Cache
          </button>

          <button
            onClick={handleManualCache}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Database className="w-4 h-4 mr-2" />
            Add Demo Item
          </button>
        </div>
      </div>

      {/* Cache Search */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Search className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-xl font-semibold text-gray-900">Cache Search</h3>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cached products..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Search Results ({searchResults.length})</h4>
            {searchResults.slice(0, 5).map((result, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{result.data.name}</div>
                    <div className="text-sm text-gray-600">Barcode: {result.barcode}</div>
                    {result.data.brand && (
                      <div className="text-sm text-gray-600">Brand: {result.data.brand}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {result.data.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Demo */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Zap className="w-6 h-6 text-yellow-600 mr-2" />
          <h3 className="text-xl font-semibold text-gray-900">Performance Demo</h3>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Cached Lookup (Instant)</h4>
            <p className="text-sm text-gray-600 mb-3">
              Try scanning a barcode that&apos;s already cached. Notice the ⚡ instant response!
            </p>
            <div className="text-xs text-gray-500">
              Cached barcodes load in &lt;10ms vs 800ms for uncached lookups
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Offline Capability</h4>
            <p className="text-sm text-gray-600 mb-3">
              Once cached, products remain available even when offline
            </p>
            <div className="flex items-center text-sm">
              {navigator.onLine ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-green-600">Online - Full functionality</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-red-600">Offline - Cached products only</span>
                </>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Background Sync</h4>
            <p className="text-sm text-gray-600 mb-3">
              Cache automatically syncs with remote services when online
            </p>
            <div className="text-xs text-gray-500">
              Last sync: {cache.stats?.lastSync ? cache.stats.lastSync.toLocaleString() : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {cache.hasError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 font-medium">Cache Error:</div>
            <div className="ml-2 text-red-600">{cache.error}</div>
          </div>
          <button
            onClick={cache.clearError}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Initialization Status */}
      {!cache.isInitialized && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <RefreshCw className={`w-5 h-5 mr-2 ${cache.isInitializing ? 'animate-spin' : ''} text-yellow-600`} />
            <div className="text-yellow-800">
              {cache.isInitializing ? 'Initializing cache system...' : 'Cache system not initialized'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CacheDemo
