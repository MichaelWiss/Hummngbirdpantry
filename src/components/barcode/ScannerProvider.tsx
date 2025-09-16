import React from 'react'
import BarcodeScanner from '@/components/barcode/BarcodeScanner'
import type { Barcode } from '@/types'

interface ScannerContextValue {
  open: (onDetected: (code: Barcode) => void) => void
  close: () => void
}

const ScannerContext = React.createContext<ScannerContextValue | null>(null)

export const useScanner = () => {
  const ctx = React.useContext(ScannerContext)
  if (!ctx) throw new Error('useScanner must be used within ScannerProvider')
  return ctx
}

export const ScannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = React.useState(false)
  const openingRef = React.useRef(false)
  const onDetectedRef = React.useRef<((code: Barcode) => void) | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)

  const open = React.useCallback(async (onDetected: (code: Barcode) => void) => {
    if (openingRef.current || visible) return
    openingRef.current = true
    try {
      // Let BarcodeScanner handle getUserMedia to avoid stream conflicts
      onDetectedRef.current = onDetected
      setVisible(true)
    } catch (e) {
      console.error('ScannerProvider.open failed:', e)
    } finally {
      // release opening latch next tick
      setTimeout(() => { openingRef.current = false }, 0)
    }
  }, [visible])

  const close = React.useCallback(() => {
    setVisible(false)
    onDetectedRef.current = null
    // BarcodeScanner handles its own stream cleanup
    streamRef.current = null
  }, [])

  return (
    <ScannerContext.Provider value={{ open, close }}>
      {children}
      {visible && (
        <BarcodeScanner
          startOnMount={true}
          onBarcodeDetected={(b) => { 
            try { 
              console.log('[ScannerProvider] Barcode detected:', b)
              onDetectedRef.current?.(b) 
            } catch (e) {
              console.error('[ScannerProvider] Callback error:', e)
            }
            // Don't close immediately - let the callback complete first
            setTimeout(() => close(), 100)
          }}
          onError={() => close()}
          onClose={() => close()}
        />
      )}
    </ScannerContext.Provider>
  )
}


