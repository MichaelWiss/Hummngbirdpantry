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
          // Try with progressive fallback for camera constraints
          let stream: MediaStream | null = null
          const constraints = [
            // First try: Ideal back camera with high resolution
            {
              video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 }
              }
            },
            // Fallback 1: Any back camera
            {
              video: {
                facingMode: { ideal: 'environment' }
              }
            },
            // Fallback 2: Any camera
            {
              video: true
            }
          ]
          
          for (let i = 0; i < constraints.length; i++) {
            try {
              stream = await navigator.mediaDevices.getUserMedia(constraints[i])
              break
            } catch (constraintError) {
              if (i === constraints.length - 1) {
                // All constraints failed, throw the last error
                throw constraintError
              }
            }
          }
          
          if (!stream) {
            throw new Error('Failed to get camera stream with any constraints')
          }
          
          console.log('✅ Got media stream:', stream)
          
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
      
      // Use continuous scanning with proper callback
      reader.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
        if (result) {
          const barcode = result.getText().trim()
          if (barcode) {
            // Stop scanning immediately when barcode found
            setIsScanning(false)
            if (readerRef.current) {
              readerRef.current.reset()
              readerRef.current = null
            }
            onBarcodeDetected(barcode)
            return
          }
        } else if (error && !(error instanceof NotFoundException)) {
          // Log non-routine errors
          console.warn('Scan error:', error)
        }
        // NotFoundException is normal during scanning - ignore it
      })
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
    <div 
      className="fixed inset-0 bg-black z-50 flex flex-col"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'black',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div 
        className="flex justify-between items-center p-4 bg-black/80 text-white"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white'
        }}
      >
        <h2 
          className="text-lg font-semibold"
          style={{ fontSize: '1.125rem', fontWeight: '600' }}
        >
          Scan Barcode
        </h2>
        <button
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-white/20 transition-colors"
          style={{
            padding: '0.5rem',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Camera viewport */}
      <div 
        className="flex-1 relative"
        style={{
          flex: 1,
          position: 'relative'
        }}
      >
        {isInitializing && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/80 text-white"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white'
            }}
          >
            <div 
              className="text-center"
              style={{ textAlign: 'center' }}
            >
              <Camera size={48} className="mx-auto mb-4 animate-pulse" />
              <p>Initializing camera...</p>
            </div>
          </div>
        )}

        {hasPermission === false && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/80 text-white"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white'
            }}
          >
            <div 
              className="text-center p-6"
              style={{ textAlign: 'center', padding: '1.5rem' }}
            >
              <Camera size={48} className="mx-auto mb-4" />
              <p className="mb-4">Camera access is required to scan barcodes</p>
              <button
                onClick={handlePermissionRequest}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Grant Permission
              </button>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          playsInline
          muted
        />

        {/* Scanning overlay */}
        {isScanning && (
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div 
              className="w-64 h-64 border-2 border-white/50 rounded-lg relative"
              style={{
                width: '16rem',
                height: '16rem',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '0.5rem',
                position: 'relative'
              }}
            >
              <div 
                className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-400 rounded-tl-lg"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '2rem',
                  height: '2rem',
                  borderTop: '4px solid #4ade80',
                  borderLeft: '4px solid #4ade80',
                  borderTopLeftRadius: '0.5rem'
                }}
              />
              <div 
                className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-400 rounded-tr-lg"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '2rem',
                  height: '2rem',
                  borderTop: '4px solid #4ade80',
                  borderRight: '4px solid #4ade80',
                  borderTopRightRadius: '0.5rem'
                }}
              />
              <div 
                className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-400 rounded-bl-lg"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '2rem',
                  height: '2rem',
                  borderBottom: '4px solid #4ade80',
                  borderLeft: '4px solid #4ade80',
                  borderBottomLeftRadius: '0.5rem'
                }}
              />
              <div 
                className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-400 rounded-br-lg"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '2rem',
                  height: '2rem',
                  borderBottom: '4px solid #4ade80',
                  borderRight: '4px solid #4ade80',
                  borderBottomRightRadius: '0.5rem'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div 
        className="p-4 bg-black/80 text-white text-center"
        style={{
          padding: '1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <p 
          className="text-sm"
          style={{ fontSize: '0.875rem' }}
        >
          Position barcode within the frame
        </p>
      </div>
    </div>
  )
})

// Add display name for debugging
BarcodeScanner.displayName = 'BarcodeScanner'

export default BarcodeScanner