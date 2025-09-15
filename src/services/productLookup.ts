// Product Lookup Service - Simple Open Food Facts API integration
// Follows style.md principles: Single Responsibility, Clean API abstraction

import type { Barcode, ItemCategory } from '@/types'

interface ProductLookupResult {
  name: string
  category: ItemCategory
  brand?: string
}

/**
 * Maps Open Food Facts categories to our internal categories
 */
const mapCategory = (categories: string = ''): ItemCategory => {
  const categoryLower = categories.toLowerCase()
  
  if (categoryLower.includes('dairy') || categoryLower.includes('milk') || categoryLower.includes('cheese')) {
    return 'dairy'
  }
  if (categoryLower.includes('meat') || categoryLower.includes('poultry') || categoryLower.includes('fish')) {
    return 'meat'
  }
  if (categoryLower.includes('fruit') || categoryLower.includes('vegetable') || categoryLower.includes('produce')) {
    return 'produce'
  }
  if (categoryLower.includes('bread') || categoryLower.includes('bakery') || categoryLower.includes('pastries')) {
    return 'bakery'
  }
  if (categoryLower.includes('canned') || categoryLower.includes('preserved') || categoryLower.includes('jarred')) {
    return 'canned'
  }
  if (categoryLower.includes('snack') || categoryLower.includes('candy') || categoryLower.includes('chocolate')) {
    return 'snacks'
  }
  if (categoryLower.includes('beverage') || categoryLower.includes('drink') || categoryLower.includes('juice')) {
    return 'beverages'
  }
  if (categoryLower.includes('frozen')) {
    return 'frozen'
  }
  if (categoryLower.includes('spice') || categoryLower.includes('condiment') || categoryLower.includes('sauce')) {
    return 'pantry'
  }
  
  return 'other'
}

/**
 * Look up product information by barcode using Open Food Facts API
 * Returns null if product not found or API fails
 */
export const lookupProductByBarcode = async (barcode: Barcode): Promise<ProductLookupResult | null> => {
  try {
    console.log(`🔍 Looking up barcode ${barcode} via Open Food Facts...`)
    
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': 'HummingbirdPantry/1.0 (https://hummingbirdpantry.pages.dev)'
        }
      }
    )
    
    if (!response.ok) {
      console.log(`❌ OFF API returned ${response.status}`)
      return null
    }
    
    const data = await response.json()
    
    if (data.status !== 1 || !data.product) {
      console.log(`❌ Product not found in OFF database`)
      return null
    }
    
    const product = data.product
    const result: ProductLookupResult = {
      name: product.product_name || product.product_name_en || 'Unknown Product',
      category: mapCategory(product.categories || ''),
      ...(product.brands ? { brand: product.brands.split(',')[0].trim() } : {})
    }
    
    console.log(`✅ Found product via OFF:`, result.name)
    return result
    
  } catch (error) {
    console.error('❌ OFF API lookup failed:', error)
    return null
  }
}

/**
 * Validate barcode format for common retail formats
 */
export const isValidBarcode = (barcode: string): boolean => {
  const cleaned = barcode.replace(/[^0-9]/g, '')
  const validLengths = [8, 12, 13, 14] // EAN-8, UPC-A, EAN-13, EAN-14
  return validLengths.includes(cleaned.length) && /^\d+$/.test(cleaned)
}

/**
 * Normalize barcode by removing non-digits
 */
export const normalizeBarcode = (barcode: string): string => {
  return barcode.replace(/[^0-9]/g, '')
}
