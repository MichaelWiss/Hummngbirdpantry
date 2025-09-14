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

  const open = React.useCallback((onDetected: (code: Barcode) => void) => {
    if (openingRef.current || visible) return
    openingRef.current = true
    onDetectedRef.current = onDetected
    setVisible(true)
    // release opening latch next tick
    setTimeout(() => { openingRef.current = false }, 0)
  }, [visible])

  const close = React.useCallback(() => {
    setVisible(false)
    onDetectedRef.current = null
  }, [])

  return (
    <ScannerContext.Provider value={{ open, close }}>
      {children}
      {visible && (
        <BarcodeScanner
          onBarcodeDetected={(b) => { try { onDetectedRef.current?.(b) } finally { setVisible(false) } }}
          onError={() => setVisible(false)}
          onClose={() => setVisible(false)}
        />
      )}
    </ScannerContext.Provider>
  )
}


