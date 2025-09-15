// useScannerUI Hook - Scanner UI state only
// Follows style.md principles: Single Responsibility, UI-only concerns

import { useState, useCallback } from 'react'
import type { Barcode } from '@/types'

interface ScannerUIState {
  isOpen: boolean
  status: 'idle' | 'scanning' | 'processing' | 'success' | 'error'
  lastScanned: Barcode | null
  error: string | null
}

/**
 * UI-only hook for scanner state management
 * No business logic - pure UI state
 */
export const useScannerUI = () => {
  const [state, setState] = useState<ScannerUIState>({
    isOpen: false,
    status: 'idle',
    lastScanned: null,
    error: null
  })

  // Open scanner
  const open = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      status: 'scanning',
      error: null
    }))
  }, [])

  // Close scanner
  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      status: 'idle'
    }))
  }, [])

  // Set processing state
  const setProcessing = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'processing'
    }))
  }, [])

  // Set success state
  const setSuccess = useCallback((barcode: Barcode) => {
    setState(prev => ({
      ...prev,
      status: 'success',
      lastScanned: barcode,
      error: null
    }))
  }, [])

  // Set error state
  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      status: 'error',
      error
    }))
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      status: prev.isOpen ? 'scanning' : 'idle'
    }))
  }, [])

  // Reset all state
  const reset = useCallback(() => {
    setState({
      isOpen: false,
      status: 'idle',
      lastScanned: null,
      error: null
    })
  }, [])

  return {
    // State (read-only)
    ...state,
    
    // Actions (UI-only)
    open,
    close,
    setProcessing,
    setSuccess,
    setError,
    clearError,
    reset,
    
    // Computed helpers
    isScanning: state.status === 'scanning',
    isProcessing: state.status === 'processing',
    hasError: !!state.error,
    hasLastScanned: !!state.lastScanned
  }
}
