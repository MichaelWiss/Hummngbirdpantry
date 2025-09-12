// BarcodeScanner Component - Professional barcode scanning with @zxing/library
// Provides real-time barcode detection with camera integration

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { X, Scan, Camera } from 'lucide-react'
import CameraViewport from './ui/CameraViewport'
import ScannerOverlay from './ui/ScannerOverlay'
import InsecureContextBanner from './ui/InsecureContextBanner'
import ReadyPanel from './ui/ReadyPanel'
import PermissionPanel from './ui/PermissionPanel'
import type { Barcode } from '@/types'
// Simplified baseline: direct getUserMedia + continuous decode; prior layered logic removed for stability.

type PermissionName = 'camera' | 'microphone' | 'geolocation' | 'notifications'
interface BarcodeScannerProps { onBarcodeDetected: (barcode: Barcode) => void; onError: (error: string) => void; onClose: () => void; uiOnly?: boolean }

// Window-scoped mutex to ensure only one scanner overlay is open
declare global { interface Window { __HB_SCANNER_OPEN__?: boolean } }

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onBarcodeDetected, onError, onClose, uiOnly = false }) => {
  // Prevent double overlays by using a mutex and bailing out if already open
  if (typeof window !== 'undefined') {
    if (window.__HB_SCANNER_OPEN__) {
      try { onClose() } catch {/* ignore */}
      return null
    }
    window.__HB_SCANNER_OPEN__ = true
  }
  useEffect(() => {
    return () => { if (typeof window !== 'undefined') window.__HB_SCANNER_OPEN__ = false }
  }, [])

  const autoStartedRef = React.useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recentResultsRef = useRef<{ text: string; ts: number }[]>([])
  const acceptedRef = useRef(false)

  // --- UPC/EAN normalization and checksum validation helpers ---
  const isDigitsOnly = (s: string) => /^\d+$/.test(s)
  const digitAt = (code: string, index: number) => code.charCodeAt(index) - 48
  const checksumEAN13 = (code: string) => {
    if (code.length !== 13 || !isDigitsOnly(code)) return false
    const check = digitAt(code, 12)
    let sum = 0
    for (let i = 0; i < 12; i++) {
      const weight = (i % 2 === 0) ? 1 : 3 // positions 0..11
      sum += digitAt(code, i) * weight
    }
    const calc = (10 - (sum % 10)) % 10
    return calc === check
  }
  const checksumUPCA = (code: string) => {
    if (code.length !== 12 || !isDigitsOnly(code)) return false
    const check = digitAt(code, 11)
    let sum = 0
    for (let i = 0; i < 11; i++) {
      const weight = (i % 2 === 0) ? 3 : 1 // UPC-A uses 3 for odd positions (0-based)
      sum += digitAt(code, i) * weight
    }
    const calc = (10 - (sum % 10)) % 10
    return calc === check
  }
  const checksumEAN8 = (code: string) => {
    if (code.length !== 8 || !isDigitsOnly(code)) return false
    const check = digitAt(code, 7)
    let sum = 0
    for (let i = 0; i < 7; i++) {
      const weight = (i % 2 === 0) ? 3 : 1 // positions 0..6
      sum += digitAt(code, i) * weight
    }
    const calc = (10 - (sum % 10)) % 10
    return calc === check
  }
  const normalizeAndValidateBarcode = (raw: string): { normalized: string; valid: boolean } => {
    const trimmed = raw.trim()
    if (isDigitsOnly(trimmed)) {
      // numeric-only symbologies (retain leading zeros)
      if (trimmed.length === 13) return { normalized: trimmed, valid: checksumEAN13(trimmed) }
      if (trimmed.length === 12) return { normalized: trimmed, valid: checksumUPCA(trimmed) }
      if (trimmed.length === 8) return { normalized: trimmed, valid: checksumEAN8(trimmed) }
      // other numeric lengths: pass through as-is
      return { normalized: trimmed, valid: true }
    }
    // non-numeric (Code128/QR etc.): pass through
    return { normalized: trimmed, valid: true }
  }
  // (selectingRef removed; no longer needed in simplified flow)
  const [permissionInstructions, setPermissionInstructions] = useState('')
  const [needsSecureContext, setNeedsSecureContext] = useState(false)
  const [userGestureRequested, setUserGestureRequested] = useState(false)

  // Scanner behavior feature flags (tune without code churn)
  const flagsRef = React.useRef({ autoStartOnGrant: true, verboseDebug: !!(import.meta as any).env?.DEV })

  const checkCameraPermission = async () => {
    try {
      if (!navigator.permissions) return null
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      return result.state
    } catch {
      return null
    }
  }

  useEffect(() => {
    const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(location.hostname)
    const insecure = !window.isSecureContext && !isLocalHost
    if (insecure) setNeedsSecureContext(true)
    checkCameraPermission().then(state => {
      if (state === 'denied') { setHasPermission(false); setPermissionInstructions(getBrowserInstructions()) }
      else if (state === 'granted') setHasPermission(true)
      else if (state === 'prompt') setHasPermission(null)
    })
  }, [])

  const requestCameraPermission = async () => {
    if (uiOnly) {
      return null
    }
    try {
      setIsInitializing(true)
      const isSecure = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname)
      if (!isSecure) console.warn('⚠️ Camera access works best with HTTPS.')
      const ua = navigator.userAgent.toLowerCase()
      const isSafari = ua.includes('safari') && !ua.includes('chrome')
      const isLocal = ['localhost', '127.0.0.1', '::1'].includes(location.hostname)
      if (isSafari && !window.isSecureContext && !isLocal) {
        onError('iOS Safari blocks camera on HTTP. Use HTTPS (export VITE_USE_HTTPS=1).')
        setIsInitializing(false)
        return null
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('MEDIA_DEVICES_NOT_SUPPORTED')
      }
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          ...(isMobile && { width: { ideal: 1280, max: 1920 }, height: { ideal: 720, max: 1080 } })
        }
      })
      setHasPermission(true)
      setIsInitializing(false)
      return stream
    } catch (error: any) {
      setIsInitializing(false)
      if (error.message === 'MEDIA_DEVICES_NOT_SUPPORTED') {
        onError('Camera API not supported. Update your browser.')
      } else if (error.name === 'NotAllowedError') {
        setHasPermission(false)
        onError(`Camera access denied. ${getBrowserInstructions()}`)
      } else {
        onError(`Camera error: ${error.message || 'Unknown'}`)
      }
      return null
    }
  }

  const getBrowserInstructions = () => {
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('chrome') && !ua.includes('edg')) return 'Click the camera icon in the address bar and Allow.'
    if (ua.includes('firefox')) return 'Click the lock/camera icon in the address bar and Allow.'
    if (ua.includes('safari') && ua.includes('mobile')) return 'Settings > Safari > Camera: Allow.'
    if (ua.includes('safari')) return 'Safari > Settings > Websites > Camera: Allow.'
    if (ua.includes('edg')) return 'Click the lock icon then Allow camera.'
    return 'Enable camera permission in your browser settings.'
  }

  const startScanning = useCallback(async () => {
    if (uiOnly) return
    if (isScanning || isInitializing) return
    if (!videoRef.current) return
    setIsInitializing(true)
    try {
      const primaryConstraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      }
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(primaryConstraints)
      } catch (err: any) {
        if (err?.name === 'OverconstrainedError') {
          console.warn('[BarcodeScanner] OverconstrainedError: retrying 640x480@15')
          const fallbackConstraints: MediaStreamConstraints = {
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 15, max: 15 }
            }
          }
          stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints)
        } else {
          throw err
        }
      }
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await new Promise<void>(res => {
        const v = videoRef.current!
        v.addEventListener('loadedmetadata', () => res(), { once: true })
        setTimeout(() => res(), 800)
      })
      if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader()
      const reader = readerRef.current
      setIsScanning(true)
      setIsInitializing(false)
      recentResultsRef.current = []
      acceptedRef.current = false
      reader.decodeFromVideoElementContinuously(videoRef.current!, (result, err) => {
        if (result) {
          if (acceptedRef.current) return
          const text = result.getText()
          const now = Date.now()
          recentResultsRef.current = recentResultsRef.current
            .filter(r => now - r.ts <= 600)
            .concat({ text, ts: now })
          const count = recentResultsRef.current.filter(r => r.text === text).length
          if (count >= 2) {
            acceptedRef.current = true
            // normalize & validate common numeric symbologies (UPC/EAN)
            const { normalized, valid } = normalizeAndValidateBarcode(text)
            if (isDigitsOnly(normalized) && !valid) {
              // invalid checksum; keep scanning and prompt user
              acceptedRef.current = false
              recentResultsRef.current = []
              onError('Invalid barcode read (checksum failed). Hold steady and try again.')
              return
            }
            // defer stopping to after callback to avoid hook order issues
            try { onBarcodeDetected(normalized as Barcode) } catch {/* ignore */}
            setTimeout(() => { try { stopScanning() } catch {/* ignore */} }, 0)
          }
        } else if (err && !(err instanceof NotFoundException)) {
          if ((err as any)?.name === 'IndexSizeError') return
          onError((err as any)?.message || 'Decode error')
        }
      })
    } catch (e: any) {
      setIsInitializing(false)
      if (e?.name === 'NotAllowedError') {
        setHasPermission(false)
        onError(`Camera access denied. ${getBrowserInstructions()}`)
      } else {
        onError(`Camera error: ${e?.message || 'Unknown'}`)
      }
    }
  }, [uiOnly, isScanning, isInitializing, onBarcodeDetected, onError])

  const stopScanning = useCallback(() => {
    setIsScanning(false)
    setIsInitializing(false)
    try { readerRef.current?.reset() } catch {/* ignore */}
    const v = videoRef.current
    const s = v?.srcObject as MediaStream | null
    if (s) s.getTracks().forEach(t => { try { t.stop() } catch {/* ignore */} })
    if (v) v.srcObject = null
    streamRef.current = null
  }, [])

  // Ensure cleanup on unmount (including HMR disposals)
  useEffect(() => {
    return () => { try { stopScanning() } catch {/* ignore */} }
  }, [stopScanning])

  // zxingError hook removed in simplified version

  // Auto-start if permission already granted (restores previous UX)
  useEffect(() => {
    if (!flagsRef.current.autoStartOnGrant) return
    if (uiOnly) return
    if (autoStartedRef.current) return
    if (hasPermission === true) {
      autoStartedRef.current = true
      if (flagsRef.current.verboseDebug) console.debug('[BarcodeScanner] autoStartOnGrant (baseline)')
      startScanning()
    }
  }, [uiOnly, hasPermission, startScanning])

  // Release start guard when scanner becomes active or initialization ends
  // Start guard logic removed
  // Dev diagnostics (guarded against StrictMode duplicate mount)
  // Diagnostics module removed for baseline

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" data-testid="barcode-scanner-modal">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="flex items-center space-x-2">
            <Scan className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-neutral-900">Scan Barcode</h3>
          </div>
          <button onClick={() => { stopScanning(); onClose() }} className="text-neutral-400 hover:text-neutral-600 text-2xl transition-colors" data-testid="close-scanner-btn">
            <X size={24} />
          </button>
        </div>
        <div className="relative aspect-square bg-neutral-900" data-testid="camera-container">
          <CameraViewport videoRef={videoRef} />
          <ScannerOverlay isScanning={hasPermission === true && isScanning} isInitializing={isInitializing} />
          {hasPermission === false && !isScanning && (
            <PermissionPanel
              instructions={permissionInstructions || getBrowserInstructions()}
              onRequest={requestCameraPermission}
              onClose={onClose}
              onRefresh={() => { checkCameraPermission().then(state => { if (state === 'granted') setHasPermission(true) }) }}
              data-testid="permission-panel"
            />
          )}
          {needsSecureContext && <InsecureContextBanner onDismiss={() => setNeedsSecureContext(false)} />}
          {!needsSecureContext && !isScanning && hasPermission !== false && !isInitializing && (
            <ReadyPanel
              hasPermission={hasPermission}
              onStart={() => {
                setUserGestureRequested(true)
                if (!uiOnly) startScanning()
              }}
              data-testid="ready-panel"
            />
          )}
          {hasPermission === null && !isInitializing && !isScanning && userGestureRequested && !needsSecureContext && (
            <div className="absolute inset-0 flex items-center justify-center p-8" data-testid="no-permission-prompt">
              <div className="text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-neutral-600" />
                </div>
                <h4 className="text-xl font-semibold text-neutral-900 mb-2">Camera Required</h4>
                <p className="text-neutral-600 mb-6 max-w-xs">Barcode scanning requires camera access. Please ensure your device has a camera.</p>
                <button onClick={requestCameraPermission} className="w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors" data-testid="try-again-btn">Try Again</button>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-neutral-50">
          <div className="flex space-x-3">
            <button onClick={stopScanning} disabled={!isScanning} className="flex-1 bg-neutral-200 hover:bg-neutral-300 disabled:bg-neutral-100 text-neutral-700 disabled:text-neutral-400 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2" data-testid="stop-scan-btn">
              <X size={18} /><span>Stop</span>
            </button>
            <button onClick={() => { stopScanning(); onClose() }} className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-3 rounded-lg font-medium transition-colors" data-testid="close-btn">Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BarcodeScanner
