// Barcode Service - Product lookup and barcode utilities
// Provides product information lookup by barcode with offline caching and API integration

import type {
  Barcode,
  PantryItem,
  ItemCategory,
  CacheLookupResult
} from '@/types'
import {
  barcodeCache,
  cacheBarcode,
  lookupCachedBarcode,
  isBarcodeCached
} from './barcodeCache.service'

// Mock barcode database (replace with real API in production)
// This represents common products you'd find in a pantry
const BARCODE_DATABASE: Record<string, Partial<PantryItem>> = {
  // Dairy products
  '123456789012': {
    name: 'Organic Whole Milk',
    category: 'dairy',
    unit: 'bottles',
    brand: 'Organic Farms'
  },
  '123456789013': {
    name: 'Greek Yogurt',
    category: 'dairy',
    unit: 'cups',
    brand: 'Chobani'
  },

  // Produce
  '234567890123': {
    name: 'Bananas',
    category: 'produce',
    unit: 'pieces',
    brand: 'Fresh Farms'
  },
  '234567890124': {
    name: 'Organic Apples',
    category: 'produce',
    unit: 'pieces',
    brand: 'Apple Orchard'
  },

  // Bakery
  '345678901234': {
    name: 'Whole Wheat Bread',
    category: 'bakery',
    unit: 'loaves',
    brand: 'Artisan Bakery'
  },
  '345678901235': {
    name: 'Sourdough Bread',
    category: 'bakery',
    unit: 'loaves',
    brand: 'Artisan Bakery'
  },

  // Pantry staples
  '456789012345': {
    name: 'Extra Virgin Olive Oil',
    category: 'pantry',
    unit: 'bottles',
    brand: 'Mediterranean Gold'
  },
  '456789012346': {
    name: 'Organic Brown Rice',
    category: 'pantry',
    unit: 'lbs',
    brand: 'Nature\'s Best'
  },

  // Canned goods
  '567890123456': {
    name: 'Black Beans',
    category: 'canned',
    unit: 'cans',
    brand: 'Organic Valley'
  },
  '567890123457': {
    name: 'Diced Tomatoes',
    category: 'canned',
    unit: 'cans',
    brand: 'Hunt\'s'
  },

  // Snacks
  '678901234567': {
    name: 'Dark Chocolate',
    category: 'snacks',
    unit: 'bars',
    brand: 'Ghirardelli'
  },
  '678901234568': {
    name: 'Almonds',
    category: 'snacks',
    unit: 'lbs',
    brand: 'Blue Diamond'
  }
}

export class BarcodeService {
  // Enhanced lookup with offline caching
  static async lookupProduct(barcode: Barcode): Promise<Partial<PantryItem> | null> {
    const startTime = performance.now()

    try {
      // Step 1: Check cache first (instant results)
      console.log(`🔍 Looking up barcode ${barcode}...`)

      if (await isBarcodeCached(barcode)) {
        const cacheResult = await lookupCachedBarcode(barcode)

        if (cacheResult.found && cacheResult.data) {
          const lookupTime = performance.now() - startTime
          console.log(`⚡ Cache hit for ${barcode} (${lookupTime.toFixed(2)}ms):`, cacheResult.data.name)
          return cacheResult.data
        }
      }

      // Step 2: Check mock database (simulates API call)
      console.log(`🔄 Cache miss, checking database for ${barcode}...`)

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800))

      const product = BARCODE_DATABASE[barcode]

      if (product) {
        // Step 3: Cache successful lookup for future use
        try {
          await cacheBarcode(barcode, product, 'mock')
          console.log(`💾 Cached barcode ${barcode} from mock database`)
        } catch (cacheError) {
          console.warn('⚠️ Failed to cache barcode:', cacheError)
        }

        const lookupTime = performance.now() - startTime
        console.log(`✅ Product found for barcode ${barcode} (${lookupTime.toFixed(2)}ms):`, product.name)
        return product
      }

      // Step 4: Product not found anywhere
      const lookupTime = performance.now() - startTime
      console.log(`❌ No product found for barcode ${barcode} (${lookupTime.toFixed(2)}ms)`)
      return null

    } catch (error) {
      const lookupTime = performance.now() - startTime
      console.error(`💥 Lookup failed for barcode ${barcode} (${lookupTime.toFixed(2)}ms):`, error)

      // Try fallback to mock database even on error
      const product = BARCODE_DATABASE[barcode]
      if (product) {
        console.log(`🔄 Fallback success for ${barcode}:`, product.name)
        return product
      }

      throw error
    }
  }

  // Get detailed lookup result with source information
  static async lookupProductDetailed(barcode: Barcode): Promise<CacheLookupResult> {
    const startTime = performance.now()

    try {
      // Check cache first
      if (await isBarcodeCached(barcode)) {
        const cacheResult = await lookupCachedBarcode(barcode)
        if (cacheResult.found && cacheResult.data) {
          const lookupTime = performance.now() - startTime
          console.log(`⚡ Cache hit for ${barcode} (${lookupTime.toFixed(2)}ms)`)
          return {
            ...cacheResult,
            cached: true
          }
        }
      }

      // Check mock database
      await new Promise(resolve => setTimeout(resolve, 800))
      const product = BARCODE_DATABASE[barcode]

      if (product) {
        // Cache for future use
        try {
          await cacheBarcode(barcode, product, 'mock')
        } catch (cacheError) {
          console.warn('⚠️ Failed to cache barcode:', cacheError)
        }

        const lookupTime = performance.now() - startTime
        console.log(`✅ Database hit for ${barcode} (${lookupTime.toFixed(2)}ms)`)

        return {
          found: true,
          data: product,
          source: 'mock',
          timestamp: new Date(),
          cached: false
        }
      }

      const lookupTime = performance.now() - startTime
      console.log(`❌ No product found for ${barcode} (${lookupTime.toFixed(2)}ms)`)

      return {
        found: false,
        data: null,
        source: 'none',
        timestamp: new Date(),
        cached: false
      }

    } catch (error) {
      console.error(`💥 Detailed lookup failed for ${barcode}:`, error)
      return {
        found: false,
        data: null,
        source: 'none',
        timestamp: new Date(),
        cached: false
      }
    }
  }

  // Validate barcode format
  static isValidBarcode(barcode: string): boolean {
    // Basic validation for common barcode formats
    const cleanBarcode = barcode.replace(/[^0-9]/g, '')

    // Check length for common formats
    const validLengths = [8, 12, 13, 14, 18] // EAN-8, UPC-A, EAN-13, etc.
    return validLengths.includes(cleanBarcode.length) && /^\d+$/.test(cleanBarcode)
  }

  // Get barcode format information
  static getBarcodeFormat(barcode: string): {
    format: string
    description: string
  } {
    const length = barcode.replace(/[^0-9]/g, '').length

    switch (length) {
      case 8:
        return {
          format: 'EAN-8',
          description: 'European Article Number (short version)'
        }
      case 12:
        return {
          format: 'UPC-A',
          description: 'Universal Product Code (North America)'
        }
      case 13:
        return {
          format: 'EAN-13',
          description: 'European Article Number (standard)'
        }
      case 14:
        return {
          format: 'EAN-14',
          description: 'European Article Number (packaging)'
        }
      case 18:
        return {
          format: 'EAN-18',
          description: 'European Article Number (extended)'
        }
      default:
        return {
          format: 'Unknown',
          description: 'Unrecognized barcode format'
        }
    }
  }

  // Clean and normalize barcode
  static normalizeBarcode(barcode: string): string {
    return barcode.replace(/[^0-9]/g, '')
  }

  // Generate mock barcode for testing (development only)
  static generateMockBarcode(): Barcode {
    const mockBarcodes = Object.keys(BARCODE_DATABASE)
    const randomIndex = Math.floor(Math.random() * mockBarcodes.length)
    return mockBarcodes[randomIndex] as Barcode
  }

  // Check if barcode exists in our database
  static isKnownBarcode(barcode: Barcode): boolean {
    return barcode in BARCODE_DATABASE
  }

  // Get all known barcodes (for development/testing)
  static getKnownBarcodes(): Barcode[] {
    return Object.keys(BARCODE_DATABASE) as Barcode[]
  }

  // Search products by name (for manual entry assistance)
  static searchProducts(query: string): Array<{ barcode: Barcode; product: Partial<PantryItem> }> {
    const lowercaseQuery = query.toLowerCase()

    return Object.entries(BARCODE_DATABASE)
      .filter(([, product]) =>
        product.name?.toLowerCase().includes(lowercaseQuery) ||
        product.brand?.toLowerCase().includes(lowercaseQuery)
      )
      .map(([barcode, product]) => ({
        barcode: barcode as Barcode,
        product
      }))
  }

  // Get product suggestions based on category
  static getSuggestionsByCategory(category: ItemCategory): Array<{ barcode: Barcode; product: Partial<PantryItem> }> {
    return Object.entries(BARCODE_DATABASE)
      .filter(([, product]) => product.category === category)
      .map(([barcode, product]) => ({
        barcode: barcode as Barcode,
        product
      }))
      .slice(0, 5) // Limit to 5 suggestions
  }

  // ============================================================================
  // CACHE MANAGEMENT METHODS
  // ============================================================================

  // Initialize cache system
  static async initializeCache(): Promise<void> {
    try {
      await barcodeCache.initialize()
      console.log('🚀 Barcode cache system initialized')
    } catch (error) {
      console.error('❌ Failed to initialize barcode cache:', error)
      throw error
    }
  }

  // Get cache statistics
  static async getCacheStats() {
    try {
      return await barcodeCache.getStats()
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error)
      return null
    }
  }

  // Check if barcode is cached
  static async isBarcodeCached(barcode: Barcode): Promise<boolean> {
    try {
      return await barcodeCache.isCached(barcode)
    } catch (error) {
      console.warn('⚠️ Cache check failed:', error)
      return false
    }
  }

  // Manually cache a barcode-product pair
  static async cacheProduct(
    barcode: Barcode,
    productData: Partial<PantryItem>,
    source: 'api' | 'manual' | 'mock' = 'manual'
  ): Promise<void> {
    try {
      await barcodeCache.store(barcode, productData, source)
      console.log(`💾 Manually cached barcode ${barcode}`)
    } catch (error) {
      console.error('❌ Failed to manually cache barcode:', error)
      throw error
    }
  }

  // Remove barcode from cache
  static async uncacheBarcode(barcode: Barcode): Promise<void> {
    try {
      await barcodeCache.delete(barcode)
      console.log(`🗑️ Removed barcode ${barcode} from cache`)
    } catch (error) {
      console.error('❌ Failed to remove barcode from cache:', error)
      throw error
    }
  }

  // Clear entire cache
  static async clearCache(): Promise<void> {
    try {
      await barcodeCache.clear()
      console.log('🧹 Barcode cache cleared')
    } catch (error) {
      console.error('❌ Failed to clear cache:', error)
      throw error
    }
  }

  // Cleanup expired entries
  static async cleanupCache(): Promise<void> {
    try {
      await barcodeCache.cleanup()
      console.log('🧹 Cache cleanup completed')
    } catch (error) {
      console.error('❌ Cache cleanup failed:', error)
      throw error
    }
  }

  // Get all cached barcodes
  static async getCachedBarcodes(): Promise<Barcode[]> {
    try {
      return await barcodeCache.getAllBarcodes()
    } catch (error) {
      console.error('❌ Failed to get cached barcodes:', error)
      return []
    }
  }

  // Search cached products
  static async searchCache(query: string): Promise<Array<{ barcode: Barcode; data: Partial<PantryItem> }>> {
    try {
      return await barcodeCache.search(query)
    } catch (error) {
      console.error('❌ Cache search failed:', error)
      return []
    }
  }

  // Export cache data for backup
  static async exportCache(): Promise<any[]> {
    try {
      return await barcodeCache.export()
    } catch (error) {
      console.error('❌ Failed to export cache:', error)
      return []
    }
  }

  // Import cache data from backup
  static async importCache(data: any[]): Promise<void> {
    try {
      await barcodeCache.import(data)
      console.log(`📥 Imported ${data.length} cache entries`)
    } catch (error) {
      console.error('❌ Failed to import cache:', error)
      throw error
    }
  }
}

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

// Add a new product to the mock database (for testing)
export const addMockProduct = (barcode: Barcode, product: Partial<PantryItem>) => {
  BARCODE_DATABASE[barcode] = product
  console.log(`📦 Added mock product: ${product.name} (${barcode})`)
}

// Clear all mock products (for testing)
export const clearMockDatabase = () => {
  Object.keys(BARCODE_DATABASE).forEach(key => {
    delete BARCODE_DATABASE[key]
  })
  console.log('🗑️ Mock database cleared')
}

// Populate with sample data (for development)
export const populateSampleData = () => {
  console.log('📦 Mock database populated with sample products')
  console.log(`Total products: ${Object.keys(BARCODE_DATABASE).length}`)
}
