/**
 * useScannerIntegration - Custom hook for barcode scanner integration
 * Following style.md: extract complex logic, error handling, hook composition
 */

import { useCallback } from 'react'
import { useScanner } from '@/components/barcode'
import { processScanResult } from '@/services'
import type { Barcode } from '@/types'
import type { AddItemData } from './useModalManager'

interface ScannerIntegrationProps {
  onScanSuccess: (data?: AddItemData) => void
  onScanError: (error: string, barcode?: Barcode) => void
}

/**
 * Hook composition for scanner functionality
 * Follows style.md pattern: combine multiple hooks for complex behavior
 */
export function useScannerIntegration({ onScanSuccess, onScanError }: ScannerIntegrationProps) {
  const scannerCtx = useScanner()

  const handleScanResult = useCallback(async (barcode: string) => {
    try {
      const result = await processScanResult(barcode)
      
      if (result.type === 'increment') {
        // Item incremented successfully, scanner will close automatically
        onScanSuccess()
        return
      }
      
      // Show add form with data
      onScanSuccess(result.data)
    } catch (error) {
      console.error('Scan processing failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Scan processing failed'
      onScanError(errorMessage, barcode as Barcode)
    }
  }, [onScanSuccess, onScanError])

  const openScanner = useCallback(() => {
    if (scannerCtx) {
      scannerCtx.open(handleScanResult)
    } else {
      onScanError('Scanner not available')
    }
  }, [scannerCtx, handleScanResult, onScanError])

  return {
    openScanner,
    isScannerAvailable: !!scannerCtx
  }
}