// useBarcodeCache Hook - React hook for managing offline barcode caching
// Provides cache management functionality with React state integration

import { useState, useEffect, useCallback } from 'react'
import { BarcodeService } from '@/services/barcode.service'
import type { Barcode, PantryItem, BarcodeCacheStats, CacheLookupResult } from '@/types'

interface BarcodeCacheState {
  isInitialized: boolean
  isInitializing: boolean
  stats: BarcodeCacheStats | null
  error: string | null
  lastCleanup: Date | null
}

export const useBarcodeCache = () => {
  const [state, setState] = useState<BarcodeCacheState>({
    isInitialized: false,
    isInitializing: false,
    stats: null,
    error: null,
    lastCleanup: null
  })

  // Initialize cache on mount
  useEffect(() => {
    initializeCache()
  }, [])

  // Initialize the cache system
  const initializeCache = useCallback(async () => {
    if (state.isInitialized || state.isInitializing) {
      return
    }

    setState(prev => ({ ...prev, isInitializing: true, error: null }))

    try {
      await BarcodeService.initializeCache()

      // Get initial stats
      const stats = await BarcodeService.getCacheStats()

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isInitializing: false,
        stats,
        error: null
      }))

      console.log('✅ Barcode cache initialized with React hook')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize cache'
      console.error('❌ Cache initialization failed:', error)

      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: errorMessage
      }))
    }
  }, [state.isInitialized, state.isInitializing])

  // Refresh cache statistics
  const refreshStats = useCallback(async () => {
    if (!state.isInitialized) {
      return
    }

    try {
      const stats = await BarcodeService.getCacheStats()
      setState(prev => ({ ...prev, stats, error: null }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh stats'
      console.error('❌ Stats refresh failed:', error)
      setState(prev => ({ ...prev, error: errorMessage }))
    }
  }, [state.isInitialized])

  // Check if a barcode is cached
  const isBarcodeCached = useCallback(async (barcode: Barcode): Promise<boolean> => {
    if (!state.isInitialized) {
      return false
    }

    try {
      return await BarcodeService.isBarcodeCached(barcode)
    } catch (error) {
      console.warn('⚠️ Cache check failed:', error)
      return false
    }
  }, [state.isInitialized])

  // Manually cache a product
  const cacheProduct = useCallback(async (
    barcode: Barcode,
    productData: Partial<PantryItem>,
    source: 'api' | 'manual' | 'mock' = 'manual'
  ): Promise<void> => {
    if (!state.isInitialized) {
      throw new Error('Cache not initialized')
    }

    try {
      await BarcodeService.cacheProduct(barcode, productData, source)
      await refreshStats() // Update stats after caching
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cache product'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [state.isInitialized, refreshStats])

  // Remove barcode from cache
  const uncacheBarcode = useCallback(async (barcode: Barcode): Promise<void> => {
    if (!state.isInitialized) {
      throw new Error('Cache not initialized')
    }

    try {
      await BarcodeService.uncacheBarcode(barcode)
      await refreshStats()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove from cache'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [state.isInitialized, refreshStats])

  // Clear entire cache
  const clearCache = useCallback(async (): Promise<void> => {
    if (!state.isInitialized) {
      throw new Error('Cache not initialized')
    }

    try {
      await BarcodeService.clearCache()
      await refreshStats()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear cache'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [state.isInitialized, refreshStats])

  // Run cache cleanup
  const cleanupCache = useCallback(async (): Promise<void> => {
    if (!state.isInitialized) {
      throw new Error('Cache not initialized')
    }

    try {
      await BarcodeService.cleanupCache()
      await refreshStats()
      setState(prev => ({ ...prev, lastCleanup: new Date(), error: null }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cache cleanup failed'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [state.isInitialized, refreshStats])

  // Get all cached barcodes
  const getCachedBarcodes = useCallback(async (): Promise<Barcode[]> => {
    if (!state.isInitialized) {
      return []
    }

    try {
      return await BarcodeService.getCachedBarcodes()
    } catch (error) {
      console.error('❌ Failed to get cached barcodes:', error)
      return []
    }
  }, [state.isInitialized])

  // Search cache
  const searchCache = useCallback(async (
    query: string
  ): Promise<Array<{ barcode: Barcode; data: Partial<PantryItem> }>> => {
    if (!state.isInitialized) {
      return []
    }

    try {
      return await BarcodeService.searchCache(query)
    } catch (error) {
      console.error('❌ Cache search failed:', error)
      return []
    }
  }, [state.isInitialized])

  // Export cache data
  const exportCache = useCallback(async (): Promise<any[]> => {
    if (!state.isInitialized) {
      return []
    }

    try {
      return await BarcodeService.exportCache()
    } catch (error) {
      console.error('❌ Failed to export cache:', error)
      return []
    }
  }, [state.isInitialized])

  // Import cache data
  const importCache = useCallback(async (data: any[]): Promise<void> => {
    if (!state.isInitialized) {
      throw new Error('Cache not initialized')
    }

    try {
      await BarcodeService.importCache(data)
      await refreshStats()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import cache'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [state.isInitialized, refreshStats])

  // Get cache size in human-readable format
  const getCacheSizeFormatted = useCallback((): string => {
    if (!state.stats) {
      return 'Unknown'
    }

    const bytes = state.stats.cacheSize
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [state.stats])

  // Get cache hit rate as percentage
  const getCacheHitRate = useCallback((): string => {
    if (!state.stats) {
      return '0%'
    }

    return `${(state.stats.hitRate * 100).toFixed(1)}%`
  }, [state.stats])

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Get cache health status
  const getCacheHealth = useCallback((): 'healthy' | 'warning' | 'error' => {
    if (!state.isInitialized) {
      return 'error'
    }

    if (state.error) {
      return 'error'
    }

    if (state.stats && state.stats.totalEntries > 0) {
      return 'healthy'
    }

    return 'warning'
  }, [state.isInitialized, state.error, state.stats])

  return {
    // State
    ...state,

    // Actions
    initializeCache,
    refreshStats,
    isBarcodeCached,
    cacheProduct,
    uncacheBarcode,
    clearCache,
    cleanupCache,
    getCachedBarcodes,
    searchCache,
    exportCache,
    importCache,
    clearError,

    // Computed properties
    cacheSizeFormatted: getCacheSizeFormatted(),
    cacheHitRate: getCacheHitRate(),
    cacheHealth: getCacheHealth(),

    // Helpers
    hasError: !!state.error,
    canUseCache: state.isInitialized && !state.error,
    needsCleanup: state.stats ? state.stats.totalEntries > 500 : false, // Arbitrary threshold
  }
}
