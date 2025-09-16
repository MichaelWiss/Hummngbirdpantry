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

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeDetected,
  onError,
  onClose
}) => {
  // Essential state only
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  
  // Scanner refs
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Clean camera initialization
  const initializeCamera = useCallback(async () => {
    if (isInitializing) return
    
    setIsInitializing(true)
    
    try {
      // Simple camera constraints - no complex fallbacks
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      setHasPermission(true)
      setIsInitializing(false)
    } catch (error) {
      setIsInitializing(false)
      setHasPermission(false)
      
      const errorMessage = error instanceof Error ? error.message : 'Camera access failed'
      
      if (errorMessage.includes('NotAllowedError')) {
        onError('Camera permission denied. Please enable camera access.')
      } else if (errorMessage.includes('NotFoundError')) {
        onError('No camera found. Please connect a camera.')
      } else {
        onError('Camera initialization failed. Please try again.')
      }
    }
  }, [isInitializing, onError])

  // Clean scanning logic
  const startScanning = useCallback(() => {
    if (!videoRef.current || !streamRef.current || isScanning) return
    
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
      
      // Continue scanning
      if (isScanning && streamRef.current) {
        requestAnimationFrame(scan)
      }
    }
    
    scan()
  }, [isScanning, onBarcodeDetected])

  // Cleanup function
  const cleanup = useCallback(() => {
    setIsScanning(false)
    
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
  }, [])

  // Initialize on mount
  useEffect(() => {
    initializeCamera()
    return cleanup
  }, [initializeCamera, cleanup])

  // Start scanning when camera is ready
  useEffect(() => {
    if (hasPermission && !isInitializing && !isScanning) {
      startScanning()
    }
  }, [hasPermission, isInitializing, isScanning, startScanning])

  // Handle close
  const handleClose = useCallback(() => {
    cleanup()
    onClose()
  }, [cleanup, onClose])

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
                onClick={initializeCamera}
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
}

export default BarcodeScanner