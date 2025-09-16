/**
 * API Service - Unified service layer
 * Following style.md: single responsibility, clean error handling
 * Following requirements.md: Neon-first with immediate error surfacing
 */

import type { PantryItem, Barcode, ItemCategory } from '@/types'
import { getApiBaseUrl } from './apiClient'

interface ApiResponse<T> {
  data?: T
  error?: string
}

interface ProductData {
  name: string
  category: ItemCategory
  brand?: string
}

class ApiService {
  private baseUrl: string | undefined

  constructor() {
    this.baseUrl = getApiBaseUrl()
  }

  /**
   * Get all pantry items from server
   */
  async getAllItems(): Promise<ApiResponse<PantryItem[]>> {
    if (!this.baseUrl) {
      return { error: 'API not configured' }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/products`, {
        cache: 'no-store'
      })

      if (!response.ok) {
        return { error: `Server error: ${response.status}` }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: `Network error: ${error instanceof Error ? error.message : 'Unknown'}` }
    }
  }

  /**
   * Get item by barcode
   */
  async getItemByBarcode(barcode: Barcode): Promise<ApiResponse<PantryItem>> {
    if (!this.baseUrl) {
      return { error: 'API not configured' }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/products/${barcode}`, {
        cache: 'no-store'
      })

      if (response.status === 404) {
        return { error: 'Item not found' }
      }

      if (!response.ok) {
        return { error: `Server error: ${response.status}` }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: `Network error: ${error instanceof Error ? error.message : 'Unknown'}` }
    }
  }

  /**
   * Create new item
   */
  async createItem(item: Omit<PantryItem, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<PantryItem>> {
    if (!this.baseUrl) {
      return { error: 'API not configured' }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })

      if (!response.ok) {
        return { error: `Server error: ${response.status}` }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: `Network error: ${error instanceof Error ? error.message : 'Unknown'}` }
    }
  }

  /**
   * Update existing item
   */
  async updateItem(id: string, updates: Partial<PantryItem>): Promise<ApiResponse<PantryItem>> {
    if (!this.baseUrl) {
      return { error: 'API not configured' }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        return { error: `Server error: ${response.status}` }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: `Network error: ${error instanceof Error ? error.message : 'Unknown'}` }
    }
  }

  /**
   * Increment item quantity
   */
  async incrementItem(barcode: Barcode, amount: number = 1): Promise<ApiResponse<PantryItem>> {
    if (!this.baseUrl) {
      return { error: 'API not configured' }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/products/${barcode}/increment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      })

      if (response.status === 404) {
        return { error: 'Item not found' }
      }

      if (!response.ok) {
        return { error: `Server error: ${response.status}` }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: `Network error: ${error instanceof Error ? error.message : 'Unknown'}` }
    }
  }

  /**
   * Delete item
   */
  async deleteItem(id: string): Promise<ApiResponse<boolean>> {
    if (!this.baseUrl) {
      return { error: 'API not configured' }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/products/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        return { error: `Server error: ${response.status}` }
      }

      return { data: true }
    } catch (error) {
      return { error: `Network error: ${error instanceof Error ? error.message : 'Unknown'}` }
    }
  }

  /**
   * Lookup product from Open Food Facts
   */
  async lookupProduct(barcode: Barcode): Promise<ApiResponse<ProductData>> {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
      
      if (!response.ok) {
        return { error: 'Product lookup failed' }
      }

      const data = await response.json()
      
      if (data.status === 0) {
        return { error: 'Product not found' }
      }

      const product = data.product
      return {
        data: {
          name: product.product_name || product.product_name_en || 'Unknown Product',
          category: this.mapCategory(product.categories),
          brand: product.brands
        }
      }
    } catch (error) {
      return { error: `Lookup error: ${error instanceof Error ? error.message : 'Unknown'}` }
    }
  }

  /**
   * Map Open Food Facts category to our categories
   */
  private mapCategory(categories: string): ItemCategory {
    if (!categories) return 'other'
    
    const cat = categories.toLowerCase()
    
    if (cat.includes('dairy') || cat.includes('milk') || cat.includes('cheese')) return 'dairy'
    if (cat.includes('meat') || cat.includes('poultry') || cat.includes('fish')) return 'meat'
    if (cat.includes('fruit') || cat.includes('vegetable')) return 'produce'
    if (cat.includes('bread') || cat.includes('pasta') || cat.includes('cereal')) return 'bakery'
    if (cat.includes('snack') || cat.includes('candy') || cat.includes('chocolate')) return 'snacks'
    if (cat.includes('beverage') || cat.includes('drink') || cat.includes('juice')) return 'beverages'
    if (cat.includes('spice') || cat.includes('condiment') || cat.includes('sauce')) return 'condiments'
    
    return 'other'
  }
}

// Export singleton instance
export const apiService = new ApiService()