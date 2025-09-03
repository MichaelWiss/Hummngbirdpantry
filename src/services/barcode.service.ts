// Barcode Service - Product lookup and barcode utilities
// Provides product information lookup by barcode with mock data and API integration points

import type { Barcode, PantryItem, ItemCategory, MeasurementUnit } from '@/types'

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
  // Lookup product by barcode
  static async lookupProduct(barcode: Barcode): Promise<Partial<PantryItem> | null> {
    // Simulate API delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 800))

    const product = BARCODE_DATABASE[barcode]

    if (product) {
      console.log(`✅ Product found for barcode ${barcode}:`, product.name)
      return product
    }

    console.log(`❌ No product found for barcode ${barcode}`)
    return null
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
      .filter(([_, product]) =>
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
      .filter(([_, product]) => product.category === category)
      .map(([barcode, product]) => ({
        barcode: barcode as Barcode,
        product
      }))
      .slice(0, 5) // Limit to 5 suggestions
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
