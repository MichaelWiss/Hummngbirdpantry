/**
 * Scan Service - Clean implementation of requirements.md pipeline
 * Local → Server → OFF → Manual
 */

import type { Barcode, ItemCategory, MeasurementUnit } from '@/types'
import { getApiBaseUrl } from './apiClient'

interface ScanResult {
  type: 'increment' | 'add-form'
  data?: {
    barcode: Barcode
    name?: string
    category?: ItemCategory
    unit?: MeasurementUnit
    brand?: string
  }
}

/**
 * Process scanned barcode following requirements pipeline
 * Returns action to take: increment existing item or show add form
 */
export const processScanResult = async (barcode: string): Promise<ScanResult> => {
  const typedBarcode = barcode as Barcode
  const baseUrl = getApiBaseUrl()
  
  if (!baseUrl) {
    return {
      type: 'add-form',
      data: { barcode: typedBarcode }
    }
  }

  try {
    // Step 1: Try to increment existing item on server
    const { ProductRepository } = await import('./ProductRepository')
    await ProductRepository.increment(typedBarcode, 1)
    return { type: 'increment' }
  } catch {
    // Item not found on server, continue to lookup
  }

  try {
    // Step 2: Get product info from Open Food Facts
    const { lookupProductByBarcode } = await import('./productLookup')
    const productData = await lookupProductByBarcode(typedBarcode)
    
    if (productData) {
      return {
        type: 'add-form',
        data: {
          barcode: typedBarcode,
          name: productData.name,
          category: productData.category,
          unit: 'pieces' as MeasurementUnit,
          ...(productData.brand && { brand: productData.brand })
        }
      }
    }
  } catch {
    // OFF lookup failed, continue to manual
  }

  // Step 3: Manual entry with barcode prefilled
  return {
    type: 'add-form',
    data: { barcode: typedBarcode }
  }
}