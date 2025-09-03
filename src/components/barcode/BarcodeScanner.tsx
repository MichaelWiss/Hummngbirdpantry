// BarcodeScanner Component - Professional barcode scanning with @zxing/library
// Provides real-time barcode detection with camera integration

import React, { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { X, Scan, Camera, AlertCircle } from 'lucide-react'
import type { Barcode } from '@/types'

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: Barcode) => void
  onError: (error: string) => void
  onClose: () => void
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeDetected,
  onError,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [codeReader] = useState(() => new BrowserMultiFormatReader())

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      setIsInitializing(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      setHasPermission(true)
      setIsInitializing(false)
      return stream
    } catch (error) {
      console.error('Camera permission denied:', error)
      setHasPermission(false)
      setIsInitializing(false)
      onError('Camera permission is required for barcode scanning')
      return null
    }
  }

  // Start scanning
  const startScanning = async () => {
    if (!videoRef.current) return

    try {
      setIsScanning(true)
      setIsInitializing(true)

      const stream = await requestCameraPermission()
      if (!stream) {
        setIsScanning(false)
        return
      }

      // Configure ZXing reader for optimal performance
      await codeReader.decodeFromVideoDevice(
        undefined, // Use default camera
        videoRef.current,
        (result, error) => {
          if (result) {
            // Barcode detected successfully!
            const barcode = result.getText() as Barcode
            console.log('Barcode detected:', barcode)
            onBarcodeDetected(barcode)
            stopScanning()
          }
          if (error && !(error instanceof NotFoundException)) {
            console.error('Barcode scan error:', error)
          }
        }
      )

      setIsInitializing(false)
    } catch (error) {
      console.error('Failed to start scanning:', error)
      onError('Failed to start camera. Please try again.')
      setIsScanning(false)
      setIsInitializing(false)
    }
  }

  // Stop scanning
  const stopScanning = () => {
    setIsScanning(false)
    setIsInitializing(false)
    codeReader.reset()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      codeReader.reset()
    }
  }, [codeReader])

  // Auto-start scanning when permissions are granted
  useEffect(() => {
    if (hasPermission === true && !isScanning && !isInitializing) {
      startScanning()
    }
  }, [hasPermission, isScanning, isInitializing])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="flex items-center space-x-2">
            <Scan className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-neutral-900">
              Scan Barcode
            </h3>
          </div>
          <button
            onClick={() => {
              stopScanning()
              onClose()
            }}
            className="text-neutral-400 hover:text-neutral-600 text-2xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Camera View Container */}
        <div className="relative aspect-square bg-neutral-900">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Scanning overlay */}
          {isScanning && (
            <div className="absolute inset-0">
              {/* Scanning frame */}
              <div className="absolute inset-8 border-2 border-primary-500 rounded-lg">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-48 h-32 border-2 border-white rounded-lg opacity-50"></div>
                </div>
              </div>

              {/* Scanning animation */}
              <div className="absolute inset-8 border-2 border-transparent rounded-lg">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary-500 animate-pulse rounded-t-lg"></div>
              </div>

              {/* Status indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  {isInitializing ? 'Initializing...' : 'Scanning...'}
                </div>
              </div>
            </div>
          )}

          {/* Permission states */}
          {hasPermission === false && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h4 className="text-xl font-semibold text-neutral-900 mb-2">
                  Camera Access Needed
                </h4>
                <p className="text-neutral-600 mb-6 max-w-xs">
                  Please allow camera access to scan barcodes. This helps us identify products quickly.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={requestCameraPermission}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Camera size={18} />
                    <span>Grant Permission</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Initial state - ready to scan */}
          {!isScanning && hasPermission === true && !isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scan className="w-10 h-10 text-primary-600" />
                </div>
                <h4 className="text-lg font-semibold text-neutral-900 mb-2">
                  Ready to Scan
                </h4>
                <p className="text-neutral-600 mb-6 max-w-xs">
                  Point your camera at a barcode to get started
                </p>
                <button
                  onClick={startScanning}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-full font-medium text-lg shadow-lg transition-all hover:shadow-xl transform hover:scale-105"
                >
                  Start Scanning
                </button>
              </div>
            </div>
          )}

          {/* Initializing state */}
          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                </div>
                <h4 className="text-lg font-semibold text-neutral-900 mb-2">
                  Setting up camera...
                </h4>
                <p className="text-neutral-600">
                  Please wait while we prepare the scanner
                </p>
              </div>
            </div>
          )}

          {/* Camera unavailable */}
          {hasPermission === null && !isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-neutral-600" />
                </div>
                <h4 className="text-xl font-semibold text-neutral-900 mb-2">
                  Camera Required
                </h4>
                <p className="text-neutral-600 mb-6 max-w-xs">
                  Barcode scanning requires camera access. Please ensure your device has a camera.
                </p>
                <button
                  onClick={requestCameraPermission}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50">
          <div className="flex space-x-3">
            <button
              onClick={stopScanning}
              disabled={!isScanning}
              className="flex-1 bg-neutral-200 hover:bg-neutral-300 disabled:bg-neutral-100 text-neutral-700 disabled:text-neutral-400 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <X size={18} />
              <span>Stop</span>
            </button>
            <button
              onClick={() => {
                stopScanning()
                onClose()
              }}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BarcodeScanner
