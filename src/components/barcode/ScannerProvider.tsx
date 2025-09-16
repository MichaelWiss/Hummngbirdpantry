/**
 * Scanner Provider - Clean scanner context management
 * Following style.md: simple provider pattern without over-engineering
 */

import React, { createContext, useContext, useState, useCallback } from 'react'
import BarcodeScanner from './BarcodeScanner'

interface ScannerContextType {
  isOpen: boolean
  open: (onResult: (barcode: string) => void) => void
  close: () => void
}

const ScannerContext = createContext<ScannerContextType | null>(null)

export const useScanner = (): ScannerContextType | null => {
  return useContext(ScannerContext)
}

interface ScannerProviderProps {
  children: React.ReactNode
}

export const ScannerProvider: React.FC<ScannerProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [onResult, setOnResult] = useState<((barcode: string) => void) | null>(null)
  const [error, setError] = useState<string | null>(null)

  const open = useCallback((resultCallback: (barcode: string) => void) => {
    if (isOpen) {
      console.warn('🚫 Scanner already open, ignoring duplicate open request')
      return // Single-flight guard as per requirements.md
    }
    
    console.log('📷 Opening scanner modal...')
    setOnResult(() => resultCallback)
    setError(null)
    setIsOpen(true)
  }, [isOpen])

  const close = useCallback(() => {
    setIsOpen(false)
    setOnResult(null)
    setError(null)
  }, [])

  const handleBarcodeDetected = useCallback((barcode: string) => {
    if (onResult) {
      onResult(barcode)
    }
    close()
  }, [onResult, close])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    // Don't auto-close on error - let user try again or manually close
  }, [])

  const contextValue: ScannerContextType = {
    isOpen,
    open,
    close
  }

  return (
    <ScannerContext.Provider value={contextValue}>
      {children}
      {isOpen && (
        <>
          {console.log('🎬 Rendering BarcodeScanner modal')}
          <BarcodeScanner
            onBarcodeDetected={handleBarcodeDetected}
            onError={handleError}
            onClose={close}
          />
        </>
      )}
      {error && (
        <div className="fixed top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 z-50">
          <div className="text-red-800 text-sm">
            ⚠️ {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </ScannerContext.Provider>
  )
}