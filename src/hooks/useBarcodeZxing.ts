// useBarcodeZxing - low-level ZXing wrapper hook
// Responsibilities:
//  - Manage BrowserMultiFormatReader instance lifecycle
//  - Provide start/stop controls given an HTMLVideoElement
//  - Enumerate and heuristically choose best camera (prefers back camera on mobile)
//  - Emit decoded barcode text once then auto-stop (single-shot semantics like existing impl)
//  - Surface minimal state for UI orchestration
//
// This hook purposefully does NOT handle permissions (handled by useCameraPermissions)
// nor product lookup (handled by useBarcodeScanner). It can be unit-tested with
// mocks for navigator.mediaDevices & the ZXing reader.

import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, NotFoundException, Result } from '@zxing/library'
import type { Barcode } from '@/types'

export interface UseBarcodeZxingState {
  isActive: boolean
  isInitializing: boolean
  lastResult: Barcode | null
  error: string | null
}

export interface UseBarcodeZxingApi extends UseBarcodeZxingState {
  start: (videoEl: HTMLVideoElement, opts?: { deviceId?: string; continuous?: boolean }) => Promise<void>
  stop: () => void
  listVideoInputDevices: () => Promise<MediaDeviceInfo[]>
  pickBestDeviceId: (devices: MediaDeviceInfo[]) => string | null
}

interface InternalRefs {
  reader: BrowserMultiFormatReader | null
  video: HTMLVideoElement | null
  mounted: boolean
  continuous: boolean
}

export const useBarcodeZxing = (onDetected?: (barcode: Barcode, result: Result) => void, onDecodeError?: (err: unknown) => void): UseBarcodeZxingApi => {
  const [isActive, setIsActive] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [lastResult, setLastResult] = useState<Barcode | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refs = useRef<InternalRefs>({
    reader: null,
    video: null,
    mounted: true,
    continuous: false
  })

  // Lazy init reader
  const ensureReader = () => {
    if (!refs.current.reader) {
      refs.current.reader = new BrowserMultiFormatReader()
    }
    return refs.current.reader
  }

  const listVideoInputDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    if (!navigator.mediaDevices?.enumerateDevices) return []
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter(d => d.kind === 'videoinput')
    } catch (e) {
      console.warn('[useBarcodeZxing] enumerateDevices failed', e)
      return []
    }
  }, [])

  const pickBestDeviceId = useCallback((devices: MediaDeviceInfo[]): string | null => {
    if (!devices.length) return null
    const ua = navigator.userAgent.toLowerCase()
    const isMobile = /android|iphone|ipad|ipod|webos|iemobile|opera mini/i.test(ua)
    // Prefer labels containing back/rear on mobile
    if (isMobile) {
      const back = devices.find(d => /back|rear/.test(d.label.toLowerCase()))
      if (back) return back.deviceId || null
    }
    // Otherwise just first device
    const first = devices[0]
    return first?.deviceId || null
  }, [])

  const stop = useCallback(() => {
    setIsActive(false)
    setIsInitializing(false)
    const r = refs.current.reader
    if (r) {
      try { r.reset() } catch {/* ignore */}
    }
  }, [])

  const start = useCallback(async (videoEl: HTMLVideoElement, opts?: { deviceId?: string; continuous?: boolean }) => {
    if (!videoEl) return
    // If already active, stop first to reset state
    if (isActive) stop()
    setError(null)
    setIsInitializing(true)
    refs.current.video = videoEl
    refs.current.continuous = !!opts?.continuous

    const reader = ensureReader()
    try {
      // If deviceId not provided attempt enumeration (non-fatal)
  let deviceId: string | null = opts?.deviceId ?? null
      if (!deviceId) {
        const devices = await listVideoInputDevices()
        deviceId = pickBestDeviceId(devices)
      }

      let initialized = false
      const markInitialized = () => {
        if (!initialized) {
          initialized = true
          setIsInitializing(false)
          setIsActive(true)
        }
      }
      // canplay indicates the video element has enough data to begin playing
      const canPlayHandler = () => { if ((import.meta as any).env?.DEV) console.debug('[useBarcodeZxing] video canplay'); markInitialized() }
      videoEl.addEventListener('canplay', canPlayHandler, { once: true })
      // Safety timeout if canplay never fires (some Safari cases)
  const initTimeout = setTimeout(() => {
        if (!initialized) {
          if ((import.meta as any).env?.DEV) console.debug('[useBarcodeZxing] init timeout fallback')
          markInitialized()
        }
      }, 2500)

  await reader.decodeFromVideoDevice(deviceId, videoEl, (result, err) => {
        if (result) {
          const text = result.getText() as Barcode
          setLastResult(text)
          onDetected?.(text, result)
          if (!refs.current.continuous) {
            // Auto stop single shot
            stop()
          }
        } else if (err) {
          // Ignore expected transient cases
          if (err instanceof NotFoundException) {
            return
          }
          // Some browsers throw IndexSizeError during early canvas read while dimensions 0
          if ((err as any)?.name === 'IndexSizeError') {
            if ((import.meta as any).env?.DEV) console.debug('[useBarcodeZxing] transient IndexSizeError ignored')
            return
          }
          onDecodeError?.(err)
        }
      })

      if (!refs.current.mounted) {
        // Component unmounted during async
        try { reader.reset() } catch {/* ignore */}
        return
      }
  // If detection hasn't already set active state ensure we mark it
  markInitialized()
  try { clearTimeout(initTimeout) } catch {/* ignore */}
    } catch (e: any) {
      console.error('[useBarcodeZxing] start failed', e)
      setError(e?.message || 'Failed to start scanner')
      setIsInitializing(false)
      setIsActive(false)
      try { reader.reset() } catch {/* ignore */}
    }
  }, [isActive, listVideoInputDevices, onDetected, onDecodeError, pickBestDeviceId, stop])

  // Cleanup on unmount
  useEffect(() => {
    const snapshot = refs.current
    return () => {
      snapshot.mounted = false
      try { snapshot.reader?.reset() } catch {/* ignore */}
    }
  }, [])

  return {
    isActive,
    isInitializing,
    lastResult,
    error,
    start,
    stop,
    listVideoInputDevices,
    pickBestDeviceId
  }
}

export default useBarcodeZxing
