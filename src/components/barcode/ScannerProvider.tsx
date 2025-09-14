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
      // Acquire camera stream synchronously within user gesture
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      }
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (err: any) {
        // Fallback constraints
        const fallback: MediaStreamConstraints = {
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15, max: 15 } }
        }
        streamRef.current = await navigator.mediaDevices.getUserMedia(fallback)
      }
      onDetectedRef.current = onDetected
      setVisible(true)
    } catch (e) {
      console.error('ScannerProvider.open getUserMedia failed:', e)
    } finally {
      // release opening latch next tick
      setTimeout(() => { openingRef.current = false }, 0)
    }
  }, [visible])

  const close = React.useCallback(() => {
    setVisible(false)
    onDetectedRef.current = null
    // Release camera
    const s = streamRef.current
    if (s) {
      try { s.getTracks().forEach(t => t.stop()) } catch { /* ignore */ }
    }
    streamRef.current = null
  }, [])

  return (
    <ScannerContext.Provider value={{ open, close }}>
      {children}
      {visible && (
        <BarcodeScanner
          initialStream={streamRef.current || undefined}
          startOnMount={true}
          onBarcodeDetected={(b) => { try { onDetectedRef.current?.(b) } finally { close() } }}
          onError={() => close()}
          onClose={() => close()}
        />
      )}
    </ScannerContext.Provider>
  )
}


