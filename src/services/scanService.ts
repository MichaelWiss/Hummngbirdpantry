/**
 * Scan Service - Clean implementation of requirements.md pipeline
 * Local → Server → OFF → Manual
 */

import type { Barcode, ItemCategory, MeasurementUnit } from '@/types'
import { apiService } from './api.service'

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

  try {
    // Step 1: Try to increment existing item on server
    const incrementResult = await apiService.incrementItem(typedBarcode, 1)
    if (incrementResult.data) {
      return { type: 'increment' }
    }
  } catch {
    // Item not found on server, continue to lookup
  }

  try {
    // Step 2: Get product info from Open Food Facts
    const lookupResult = await apiService.lookupProduct(typedBarcode)
    
    if (lookupResult.data) {
      return {
        type: 'add-form',
        data: {
          barcode: typedBarcode,
          name: lookupResult.data.name,
          category: lookupResult.data.category,
          unit: 'pieces' as MeasurementUnit,
          ...(lookupResult.data.brand && { brand: lookupResult.data.brand })
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