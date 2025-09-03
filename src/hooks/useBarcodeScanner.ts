// useBarcodeScanner Hook - Manages barcode scanning state and operations
// Provides comprehensive barcode scanning functionality with error handling

import { useState, useCallback } from 'react'
import { usePantry } from '@/hooks/usePantry'
import { BarcodeService } from '@/services/barcode.service'
import type { Barcode, PantryItem } from '@/types'

interface BarcodeScannerState {
  isScanning: boolean
  lastScanned: Barcode | null
  error: string | null
  isLookingUp: boolean
  lookupResult: {
    found: boolean
    productData: Partial<PantryItem> | null
  } | null
}

export const useBarcodeScanner = () => {
  const { addItem } = usePantry()

  const [state, setState] = useState<BarcodeScannerState>({
    isScanning: false,
    lastScanned: null,
    error: null,
    isLookingUp: false,
    lookupResult: null
  })

  // Handle successful barcode detection with enhanced caching
  const onBarcodeDetected = useCallback(async (barcode: Barcode) => {
    console.log('🔍 Barcode detected:', barcode)

    setState(prev => ({
      ...prev,
      isScanning: false,
      lastScanned: barcode,
      error: null,
      isLookingUp: true,
      lookupResult: null
    }))

    try {
      // Validate barcode format
      if (!BarcodeService.isValidBarcode(barcode)) {
        throw new Error('Invalid barcode format detected')
      }

      // Use detailed lookup with source information
      const lookupResult = await BarcodeService.lookupProductDetailed(barcode)

      if (lookupResult.found && lookupResult.data) {
        // Product found - store result with source info
        setState(prev => ({
          ...prev,
          isLookingUp: false,
          lookupResult: {
            found: true,
            productData: lookupResult.data
          }
        }))

        const sourceIcon = lookupResult.cached ? '⚡' : lookupResult.source === 'api' ? '🌐' : '📦'
        console.log(`${sourceIcon} Product found (${lookupResult.source}):`, lookupResult.data.name)

        return {
          barcode,
          productData: lookupResult.data,
          found: true,
          source: lookupResult.source,
          cached: lookupResult.cached,
          lookupTime: performance.now()
        }
      } else {
        // Product not found - still store the barcode for manual entry
        setState(prev => ({
          ...prev,
          isLookingUp: false,
          lookupResult: {
            found: false,
            productData: null
          }
        }))

        console.log('❌ Product not found for barcode:', barcode)
        return {
          barcode,
          productData: null,
          found: false,
          source: 'none',
          cached: false,
          lookupTime: performance.now()
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process barcode'
      console.error('Barcode processing error:', error)

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLookingUp: false
      }))

      throw error
    }
  }, [])

  // Quick add scanned item to pantry
  const quickAddScannedItem = useCallback(async (
    barcode: Barcode,
    productData: Partial<PantryItem>,
    quantity: number = 1
  ) => {
    try {
      console.log('⚡ Quick adding scanned item:', productData.name)

      await addItem({
        name: productData.name || 'Unknown Product',
        category: productData.category || 'other',
        quantity,
        unit: productData.unit || 'pieces',
        barcode,
        brand: productData.brand
      })

      // Clear state after successful addition
      setState(prev => ({
        ...prev,
        lastScanned: null,
        error: null,
        lookupResult: null
      }))

      console.log('✅ Item added successfully via barcode scan')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item'
      console.error('Quick add error:', error)

      setState(prev => ({
        ...prev,
        error: errorMessage
      }))

      throw error
    }
  }, [addItem])

  // Add scanned item with custom details
  const addScannedItemWithDetails = useCallback(async (
    barcode: Barcode,
    customData: {
      name?: string
      category?: ItemCategory
      quantity?: number
      unit?: MeasurementUnit
      notes?: string
    }
  ) => {
    try {
      console.log('📝 Adding scanned item with custom details')

      await addItem({
        name: customData.name || 'Scanned Product',
        category: customData.category || 'other',
        quantity: customData.quantity || 1,
        unit: customData.unit || 'pieces',
        barcode,
        notes: customData.notes
      })

      // Clear state after successful addition
      setState(prev => ({
        ...prev,
        lastScanned: null,
        error: null,
        lookupResult: null
      }))

      console.log('✅ Custom item added successfully')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add custom item'
      console.error('Custom add error:', error)

      setState(prev => ({
        ...prev,
        error: errorMessage
      }))

      throw error
    }
  }, [addItem])

  // Start scanning
  const startScanning = useCallback(() => {
    console.log('📷 Starting barcode scanner')

    setState(prev => ({
      ...prev,
      isScanning: true,
      error: null,
      lookupResult: null
    }))
  }, [])

  // Stop scanning
  const stopScanning = useCallback(() => {
    console.log('🛑 Stopping barcode scanner')

    setState(prev => ({
      ...prev,
      isScanning: false
    }))
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }))
  }, [])

  // Clear last scanned result
  const clearLastScanned = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastScanned: null,
      lookupResult: null
    }))
  }, [])

  // Reset all state
  const reset = useCallback(() => {
    console.log('🔄 Resetting barcode scanner state')

    setState({
      isScanning: false,
      lastScanned: null,
      error: null,
      isLookingUp: false,
      lookupResult: null
    })
  }, [])

  // Get barcode format information
  const getBarcodeInfo = useCallback((barcode: Barcode) => {
    return BarcodeService.getBarcodeFormat(barcode)
  }, [])

  // Check if barcode is known
  const isKnownBarcode = useCallback((barcode: Barcode) => {
    return BarcodeService.isKnownBarcode(barcode)
  }, [])

  return {
    // State
    ...state,

    // Actions
    onBarcodeDetected,
    quickAddScannedItem,
    addScannedItemWithDetails,
    startScanning,
    stopScanning,
    clearError,
    clearLastScanned,
    reset,

    // Helpers
    hasLastScanned: !!state.lastScanned,
    canQuickAdd: !!state.lookupResult?.found,
    hasError: !!state.error,
    getBarcodeInfo,
    isKnownBarcode,

    // Computed
    lastScannedInfo: state.lastScanned ? {
      barcode: state.lastScanned,
      ...BarcodeService.getBarcodeFormat(state.lastScanned),
      isKnown: BarcodeService.isKnownBarcode(state.lastScanned)
    } : null,

    productInfo: state.lookupResult?.productData || null
  }
}
