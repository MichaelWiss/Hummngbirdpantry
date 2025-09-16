/**
 * Scan Service - Clean implementation of requirements.md pipeline
 * Local → Server → OFF → Manual
 */

import type { Barcode, ItemCategory, MeasurementUnit } from '@/types'
import { apiService } from './api.service'

interface ScanResult {
  type: 'add-form'
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
 * Always returns add-form to show autofill data for every scan
 */
export const processScanResult = async (barcode: string): Promise<ScanResult> => {
  const typedBarcode = barcode as Barcode

  try {
    // Step 1: Get product info from Open Food Facts
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

  // Step 2: Manual entry with barcode prefilled
  return {
    type: 'add-form',
    data: { barcode: typedBarcode }
  }
}