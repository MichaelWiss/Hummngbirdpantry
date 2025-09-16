/**
 * BarcodeScanner - Clean barcode scanning component
 * Following style.md: essential functionality only, proper TypeScript
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { X, Camera } from 'lucide-react'

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void
  onError: (error: string) => void
  onClose: () => void
}

const BarcodeScanner = React.memo<BarcodeScannerProps>(({
  onBarcodeDetected,
  onError,
  onClose
}) => {
  // Essential state only
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isInitializing, setIsInitializing] = useState(true) // Start as true
  
  // Scanner refs
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const initializingRef = useRef(false) // Prevent multiple initializations

  // Initialize on mount only
  useEffect(() => {
    let mounted = true
    const currentVideo = videoRef.current // Capture ref for cleanup
    
    const init = async () => {
      if (mounted && !initializingRef.current) {
        initializingRef.current = true // Set flag to prevent multiple initializations
        
        try {
          console.log('🎥 Starting camera initialization...')
          console.log('📱 Navigator mediaDevices available:', !!navigator.mediaDevices)
          console.log('🔒 Secure context:', window.isSecureContext)
          
          // Direct camera initialization to avoid callback dependencies
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 }
            }
          })
          
          console.log('✅ Got media stream:', stream)
          console.log('🎬 Stream tracks:', stream.getTracks().map(t => ({
            kind: t.kind,
            label: t.label,
            enabled: t.enabled,
            readyState: t.readyState
          })))
          
          if (!mounted) {
            console.log('❌ Component unmounted, stopping stream')
            stream.getTracks().forEach(track => track.stop())
            return
          }
          
          streamRef.current = stream
          
          if (videoRef.current) {
            console.log('📺 Setting video srcObject and playing...')
            videoRef.current.srcObject = stream
            await videoRef.current.play()
            console.log('▶️ Video playing successfully')
          }
          
          setHasPermission(true)
          setIsInitializing(false)
          console.log('✅ Camera initialization complete')
        } catch (error) {
          console.error('❌ Camera initialization failed:', error)
          if (mounted) {
            setIsInitializing(false)
            setHasPermission(false)
            
            const errorMessage = error instanceof Error ? error.message : 'Camera access failed'
            console.log('🔍 Error details:', {
              name: error instanceof Error ? error.name : 'Unknown',
              message: errorMessage,
              stack: error instanceof Error ? error.stack : undefined
            })
            
            if (errorMessage.includes('NotAllowedError') || (error as any)?.name === 'NotAllowedError') {
              onError('Camera permission denied. Please enable camera access.')
            } else if (errorMessage.includes('NotFoundError') || (error as any)?.name === 'NotFoundError') {
              onError('No camera found. Please connect a camera.')
            } else if (errorMessage.includes('NotReadableError') || (error as any)?.name === 'NotReadableError') {
              onError('Camera is already in use by another application.')
            } else if (errorMessage.includes('OverconstrainedError') || (error as any)?.name === 'OverconstrainedError') {
              onError('Camera does not support the requested settings.')
            } else {
              onError(`Camera initialization failed: ${errorMessage}`)
            }
          }
        } finally {
          // Always reset the flag when initialization completes
          if (mounted) {
            initializingRef.current = false
          }
        }
      }
    }
    
    init()
    
    return () => {
      mounted = false
      // Cleanup
      if (readerRef.current) {
        readerRef.current.reset()
        readerRef.current = null
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      if (currentVideo) {
        currentVideo.srcObject = null
      }
      
      setIsScanning(false)
      initializingRef.current = false
    }
  }, [onError]) // Only onError dependency needed

  // Start scanning when camera is ready
  useEffect(() => {
    if (hasPermission && !isInitializing && !isScanning) {
      // Inline scanning logic to avoid callback dependency loop
      if (!videoRef.current || !streamRef.current) return
      
      setIsScanning(true)
      
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader
      
      const scan = async () => {
        try {
          const result = await reader.decodeOnceFromVideoDevice(undefined, videoRef.current!)
          
          if (result) {
            const barcode = result.getText().trim()
            if (barcode) {
              onBarcodeDetected(barcode)
              return // Success - let parent handle closing
            }
          }
        } catch (error) {
          // Ignore NotFoundException - normal during scanning
          if (!(error instanceof NotFoundException)) {
            console.warn('Scan error:', error)
          }
        }
        
        // Continue scanning if still active
        if (readerRef.current && streamRef.current) {
          requestAnimationFrame(scan)
        }
      }
      
      scan()
    }
  }, [hasPermission, isInitializing, isScanning, onBarcodeDetected])

  // Handle close with inline cleanup
  const handleClose = useCallback(() => {
    // Inline cleanup logic
    setIsScanning(false)
    initializingRef.current = false
    
    if (readerRef.current) {
      readerRef.current.reset()
      readerRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    onClose()
  }, [onClose])

  // Handle permission request
  const handlePermissionRequest = useCallback(() => {
    // Reset states and trigger re-initialization
    setHasPermission(null)
    setIsInitializing(true)
    initializingRef.current = false
  }, [])

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/80 text-white">
        <h2 className="text-lg font-semibold">Scan Barcode</h2>
        <button
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-white/20 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Camera viewport */}
      <div className="flex-1 relative">
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
            <div className="text-center">
              <Camera size={48} className="mx-auto mb-4 animate-pulse" />
              <p>Initializing camera...</p>
            </div>
          </div>
        )}

        {hasPermission === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
            <div className="text-center p-6">
              <Camera size={48} className="mx-auto mb-4" />
              <p className="mb-4">Camera access is required to scan barcodes</p>
              <button
                onClick={handlePermissionRequest}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Grant Permission
              </button>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scanning overlay */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-400 rounded-br-lg" />
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-black/80 text-white text-center">
        <p className="text-sm">Position barcode within the frame</p>
      </div>
    </div>
  )
})

// Add display name for debugging
BarcodeScanner.displayName = 'BarcodeScanner'

export default BarcodeScanner