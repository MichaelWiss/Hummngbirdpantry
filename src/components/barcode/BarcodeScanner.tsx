// BarcodeScanner Component - Professional barcode scanning with @zxing/library
// Provides real-time barcode detection with camera integration

import React, { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { X, Scan, Camera, AlertCircle } from 'lucide-react'
import type { Barcode } from '@/types'

// Add PermissionName type for navigator.permissions.query
type PermissionName = 'camera' | 'microphone' | 'geolocation' | 'notifications'

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
  const [permissionInstructions, setPermissionInstructions] = useState('')

  // Check current camera permission status
  const checkCameraPermission = async () => {
    try {
      if (!navigator.permissions) return null

      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      return result.state
    } catch (error) {
      console.warn('Permission API not supported:', error)
      return null
    }
  }

  // Initialize permission check on mount
  useEffect(() => {
    checkCameraPermission().then(state => {
      if (state === 'denied') {
        setHasPermission(false)
        setPermissionInstructions(getBrowserInstructions())
      } else if (state === 'granted') {
        setHasPermission(true)
      } else if (state === 'prompt') {
        setHasPermission(null)
      }
    })
  }, [])

  // Enhanced camera permission handling with detailed error feedback
  const requestCameraPermission = async () => {
    try {
      setIsInitializing(true)

      // Check HTTPS requirement (warn but don't block for localhost/mobile testing)
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      if (!isSecure) {
        console.warn('⚠️ Camera access works best with HTTPS. For production, ensure HTTPS is enabled.')
      }

      // Check camera API availability with better error handling
      if (!navigator.mediaDevices) {
        console.error('🔴 navigator.mediaDevices is undefined')
        console.log('User Agent:', navigator.userAgent)
        console.log('Location:', window.location.href)
        console.log('Protocol:', window.location.protocol)
        throw new Error('MEDIA_DEVICES_NOT_SUPPORTED')
      }

      if (!navigator.mediaDevices.getUserMedia) {
        console.error('🔴 getUserMedia is not available')
        console.log('Available methods:', Object.getOwnPropertyNames(navigator.mediaDevices))
        throw new Error('GET_USER_MEDIA_NOT_SUPPORTED')
      }

      // Try to enumerate devices (may not be available on all browsers)
      let cameras = []
      if (navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          cameras = devices.filter(device => device.kind === 'videoinput')
        } catch (enumerateError) {
          console.warn('⚠️ Could not enumerate devices:', enumerateError)
          // Continue without enumeration - camera might still work
        }
      }

      // If enumeration failed but getUserMedia is available, continue anyway
      // Some browsers restrict enumerateDevices until permission is granted
      if (cameras.length === 0) {
        console.warn('⚠️ Could not enumerate cameras, but proceeding with getUserMedia')
      }

      // Request camera permission with optimized constraints
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          ...(isMobile && {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          })
        }
      })

      setHasPermission(true)
      setIsInitializing(false)
      return stream

    } catch (error: any) {
      console.error('Camera permission error:', error)
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        userAgent: navigator.userAgent,
        secureContext: window.isSecureContext,
        location: window.location.href
      })
      setIsInitializing(false)

      // Handle specific error types with detailed user guidance
      if (error.name === 'NotAllowedError') {
        setHasPermission(false)
        const browserInstructions = getBrowserInstructions()
        onError(`Camera access denied. ${browserInstructions}`)
      } else if (error.message === 'MEDIA_DEVICES_NOT_SUPPORTED') {
        const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')
        if (isFirefox) {
          setHasPermission(null)
          onError('Firefox MediaDevices API issue detected. Try: 1) Refresh the page, 2) Check about:config -> media.navigator.permission.disabled, 3) Try in a new private window.')
        } else {
          setHasPermission(null)
          onError('Camera API not supported on this browser. Please update to a modern browser (Chrome 47+, Firefox 43+, Safari 11+, Edge 79+).')
        }
      } else if (error.message === 'GET_USER_MEDIA_NOT_SUPPORTED') {
        const isSafari = navigator.userAgent.toLowerCase().includes('safari') && !navigator.userAgent.toLowerCase().includes('chrome')
        const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')

        if (isSafari) {
          setHasPermission(null)
          onError('Safari camera issue detected. Try: 1) Refresh page, 2) Check Safari > Settings > Privacy > Camera, 3) Try in new tab, 4) Run testSafariCamera() in console.')
        } else if (isFirefox) {
          setHasPermission(null)
          onError('Firefox getUserMedia issue. This might be due to: 1) Insecure context, 2) Permission settings, 3) Firefox configuration. Try the Firefox test in console.')
        } else {
          setHasPermission(null)
          onError('getUserMedia API not supported on this browser. Please update to a modern browser that supports camera access.')
        }
      } else if (error.name === 'NotFoundError') {
        setHasPermission(null)
        onError('No camera found on this device. Please ensure your device has a working camera.')
      } else if (error.name === 'NotSupportedError') {
        setHasPermission(null)
        onError('Camera not supported on this browser. Please try a different browser or update your current one.')
      } else if (error.name === 'NotReadableError') {
        setHasPermission(null)
        onError('Camera is being used by another application. Please close other apps using the camera and try again.')
      } else if (error.name === 'OverconstrainedError') {
        setHasPermission(false)
        onError('Camera constraints not supported. Trying with basic settings...')
        // Fallback to basic constraints
        return requestBasicCameraPermission()
      } else {
        setHasPermission(false)
        onError(`Camera error: ${error.message || 'Unknown error occurred'}`)
      }

      return null
    }
  }

  // Fallback camera permission with basic constraints
  const requestBasicCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' } // Fallback to front camera
      })
      setHasPermission(true)
      return stream
    } catch (fallbackError) {
      console.error('Fallback camera permission failed:', fallbackError)
      setHasPermission(false)
      onError('Unable to access camera with any settings. Please check your device and browser settings.')
      return null
    }
  }

  // Get browser-specific permission instructions
  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase()

    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return 'Click the camera icon in the address bar and select "Allow".'
    } else if (userAgent.includes('firefox')) {
      return 'Click the camera icon (🔒) in the address bar and select "Allow" or "Allow and Remember". Try refreshing the page after allowing.'
    } else if (userAgent.includes('safari') && userAgent.includes('mobile')) {
      return 'Go to Settings > Safari > Camera and enable access for this website.'
    } else if (userAgent.includes('safari')) {
      return 'Go to Safari > Preferences > Websites > Camera and allow access.'
    } else if (userAgent.includes('edg')) {
      return 'Click the lock icon in the address bar and select "Allow" for Camera.'
    } else {
      return 'Check your browser settings to enable camera access.'
    }
  }

  // Start scanning with comprehensive checks
  const startScanning = async () => {
    if (!videoRef.current) return

    try {
      setIsScanning(true)
      setIsInitializing(true)

      // Optional HTTPS warning for user feedback
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      if (!isSecure) {
        console.warn('⚠️ Camera access works best with HTTPS. Some features may be limited.')
      }

      const stream = await requestCameraPermission()
      if (!stream) {
        setIsScanning(false)
        return
      }

      // Select the best available camera for barcode scanning
      let selectedDeviceId: string | undefined

      if (cameras.length > 0) {
        // Prefer back camera on mobile, front camera on desktop
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        const backCamera = cameras.find(camera => camera.label.toLowerCase().includes('back') || camera.label.toLowerCase().includes('rear'))
        const frontCamera = cameras.find(camera => camera.label.toLowerCase().includes('front') || camera.label.toLowerCase().includes('face'))

        if (isMobile && backCamera) {
          selectedDeviceId = backCamera.deviceId
          console.log('📷 Using back camera for barcode scanning')
        } else if (!isMobile && frontCamera) {
          selectedDeviceId = frontCamera.deviceId
          console.log('📷 Using front camera for barcode scanning')
        } else {
          selectedDeviceId = cameras[0].deviceId
          console.log('📷 Using first available camera')
        }
      }

      // Configure ZXing reader for optimal performance
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId, // Use selected camera or default
        videoRef.current,
        (result, error) => {
          if (result) {
            // Barcode detected successfully!
            const barcode = result.getText() as Barcode
            console.log('✅ Barcode detected:', barcode)
            onBarcodeDetected(barcode)
            stopScanning()
          }
          if (error && !(error instanceof NotFoundException)) {
            console.error('❌ Barcode scan error:', error)
          }
        }
      )

      setIsInitializing(false)
    } catch (error: any) {
      console.error('❌ Failed to start scanning:', error)
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        userAgent: navigator.userAgent
      })

      // Chrome-specific error handling
      if (error.name === 'NotSupportedError') {
        console.log('📷 Camera format not supported - trying alternative settings')
        onError('Camera format not supported. This is usually fixable.')
      } else if (error.name === 'NotReadableError') {
        console.log('📷 Camera busy - other app using camera')
        onError('Camera is busy. Close other camera apps (Zoom, etc.) and try again.')
      } else if (error.name === 'OverconstrainedError') {
        console.log('📷 Camera constraints too restrictive - using fallback')
        onError('Camera settings too restrictive. Using basic settings...')
      } else if (error.name === 'NotAllowedError') {
        console.log('📷 Camera permission denied')
        onError('Camera permission denied. Please click "Allow" when prompted.')
      } else {
        console.log('📷 Unknown camera error:', error)
        onError(`Camera error: ${error.message || 'Unknown error'}. Check console for details.`)
      }

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
  }, [hasPermission, isScanning, isInitializing, startScanning])

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
                  Camera Access Required
                </h4>
                <p className="text-neutral-600 mb-4 max-w-xs">
                  Camera access is needed to scan barcodes. Please follow these steps:
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-xs">
                  <p className="text-blue-800 text-sm font-medium">
                    {permissionInstructions || getBrowserInstructions()}
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={requestCameraPermission}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Camera size={18} />
                    <span>Try Again</span>
                  </button>
                  <button
                    onClick={() => {
                      // Refresh permission status
                      checkCameraPermission().then(state => {
                        if (state === 'granted') {
                          setHasPermission(true)
                        }
                      })
                    }}
                    className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Check Permission Status
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-3 rounded-lg font-medium transition-colors"
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

// Safari-specific camera test
const testSafariCamera = async () => {
  console.log('🧭 Safari Camera Test Starting...')
  console.log('====================================')
  console.log('🔍 SYSTEM INFO:')
  console.log('   URL:', window.location.href)
  console.log('   Protocol:', window.location.protocol)
  console.log('   Hostname:', window.location.hostname)
  console.log('   User Agent:', navigator.userAgent)
  console.log('')

  try {
    // Test 1: Check if we're in secure context
    console.log('Test 1 - Secure Context:', window.isSecureContext)
    if (!window.isSecureContext) {
      console.log('   ❌ NOT SECURE - Safari blocks camera on HTTP!')
      console.log('   💡 SOLUTION: Use HTTPS or localhost')
    }

    // Test 2: Check if we're in an iframe (Safari blocks camera in iframes)
    console.log('Test 2 - In iFrame:', window !== window.top)
    if (window !== window.top) {
      console.log('   ❌ IN IFRAME - Safari blocks camera in iframes!')
    }

    // Test 3: Check navigator.mediaDevices exists
    console.log('Test 3 - navigator.mediaDevices exists:', !!navigator.mediaDevices)
    if (!navigator.mediaDevices) {
      console.log('   ❌ MEDIA DEVICES API UNAVAILABLE')
      console.log('   💡 This is Safari\'s security policy for non-HTTPS sites')
    }

    if (!navigator.mediaDevices) {
      console.log('🚨 CRITICAL: navigator.mediaDevices is undefined!')
      console.log('   This means Safari is blocking the MediaDevices API')
      console.log('   Usually caused by:')
      console.log('   - Running on HTTP (not HTTPS)')
      console.log('   - Running on IP address (not localhost)')
      console.log('   - Browser security settings')
      console.log('')
      console.log('🔧 QUICK FIXES TO TRY:')
      console.log('   1. Use HTTPS URL instead: https://192.168.4.240:3002/')
      console.log('   2. Use localhost: http://localhost:3002/')
      console.log('   3. Safari Developer Settings:')
      console.log('      - Settings → Safari → Advanced → Experimental Features')
      console.log('      - Enable "MediaDevices API in insecure contexts"')
      console.log('   4. Try Chrome or Firefox (they\'re more permissive)')
      console.log('')
      console.log('💡 WORKAROUND: Try using Chrome on your iPhone instead!')
      console.log('   Chrome is more permissive with camera access on HTTP.')

      // Try to polyfill navigator.mediaDevices for older Safari versions
      console.log('🔄 Attempting to polyfill MediaDevices API...')
      try {
        if (!navigator.mediaDevices && navigator.webkitGetUserMedia) {
          console.log('   Found webkitGetUserMedia - creating polyfill...')
          navigator.mediaDevices = {
            getUserMedia: function(constraints) {
              return new Promise(function(resolve, reject) {
                navigator.webkitGetUserMedia(constraints, resolve, reject);
              });
            }
          } as any;
          console.log('✅ Polyfill created! Retrying test...')
          // Retry the test
          return testSafariCamera();
        }
      } catch (polyfillError) {
        console.log('❌ Polyfill failed:', polyfillError)
      }

      console.log('')
      console.log('🚨 FINAL SOLUTION: Use Chrome on iPhone')
      console.log('   1. Download Chrome from App Store')
      console.log('   2. Go to: http://192.168.4.240:3002/')
      console.log('   3. Run: testSafariCamera()')
      console.log('   4. Chrome allows camera on HTTP!')

      return { success: false, reason: 'navigator.mediaDevices undefined' }
    }

    // Test 4: Check getUserMedia exists
    console.log('Test 4 - getUserMedia exists:', !!navigator.mediaDevices.getUserMedia)

    // Test 5: Check enumerateDevices exists
    console.log('Test 5 - enumerateDevices exists:', !!navigator.mediaDevices.enumerateDevices)

    // Test 6: Check available methods
    console.log('Test 6 - Available methods:', Object.getOwnPropertyNames(navigator.mediaDevices))

    // Test 7: Try to call getUserMedia (this should trigger permission prompt)
    console.log('Test 7 - Attempting getUserMedia...')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera first for Safari
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })
      console.log('✅ getUserMedia SUCCESS!')
      console.log('   Camera access granted!')
      stream.getTracks().forEach(track => track.stop()) // Clean up
      return { success: true, camera: 'granted' }
    } catch (gumError: any) {
      console.log('❌ getUserMedia FAILED:', gumError.name, gumError.message)
      console.log('   Common Safari issues:')
      console.log('   - NotAllowedError: User denied permission')
      console.log('   - NotFoundError: No camera available')
      console.log('   - SecurityError: Not in secure context')
      return { success: false, error: gumError.name, message: gumError.message }
    }
  } catch (error) {
    console.error('🧭 Safari test failed:', error)
    return { success: false, error: 'test_failed', details: error }
  }
}

// Firefox-specific camera test
const testFirefoxCamera = async () => {
  console.log('🦊 Firefox Camera Test Starting...')

  try {
    // Test 1: Check if we're in secure context
    console.log('Test 1 - Secure Context:', window.isSecureContext)

    // Test 2: Check navigator.mediaDevices exists
    console.log('Test 2 - navigator.mediaDevices exists:', !!navigator.mediaDevices)

    if (navigator.mediaDevices) {
      // Test 3: Check getUserMedia exists
      console.log('Test 3 - getUserMedia exists:', !!navigator.mediaDevices.getUserMedia)

      // Test 4: Check enumerateDevices exists
      console.log('Test 4 - enumerateDevices exists:', !!navigator.mediaDevices.enumerateDevices)

      // Test 5: Try to call getUserMedia (this should trigger permission prompt)
      console.log('Test 5 - Attempting getUserMedia...')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        console.log('✅ getUserMedia SUCCESS!')
        stream.getTracks().forEach(track => track.stop()) // Clean up
      } catch (gumError: any) {
        console.log('❌ getUserMedia FAILED:', gumError.name, gumError.message)
      }
    }
  } catch (error) {
    console.error('🦊 Firefox test failed:', error)
  }
}

// Safari-specific camera test (available in console as testSafariCamera())
if (typeof window !== 'undefined') {
  (window as any).testSafariCamera = testSafariCamera
}

// Firefox-specific camera test (available in console as testFirefoxCamera())
if (typeof window !== 'undefined') {
  (window as any).testFirefoxCamera = testFirefoxCamera
}

// Chrome camera diagnostic (available in console as diagnoseChromeCamera())
if (typeof window !== 'undefined') {
  (window as any).diagnoseChromeCamera = async () => {
    console.log('🔧 CHROME CAMERA DIAGNOSTIC')
    console.log('===========================')
    console.log('')

    // Basic checks
    console.log('📱 Basic API Check:')
    console.log(`   navigator.mediaDevices: ${!!navigator.mediaDevices}`)
    console.log(`   getUserMedia: ${!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)}`)
    console.log('')

    // Permission check
    console.log('🔐 Permission Check:')
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
        console.log(`   Camera permission: ${result.state}`)
      } catch (e) {
        console.log(`   Permission check failed: ${e}`)
      }
    } else {
      console.log('   Permissions API not available')
    }
    console.log('')

    // Camera enumeration
    console.log('📷 Camera Enumeration:')
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cameras = devices.filter(d => d.kind === 'videoinput')
        console.log(`   Cameras found: ${cameras.length}`)
        cameras.forEach((cam, i) => {
          console.log(`   Camera ${i + 1}: ${cam.label || 'Unnamed'} (${cam.deviceId.slice(0, 8)}...)`)
        })
      } catch (e) {
        console.log(`   Camera enumeration failed: ${e}`)
      }
    } else {
      console.log('   enumerateDevices not available')
    }
    console.log('')

    // Test getUserMedia
    console.log('🎥 Testing getUserMedia:')
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        console.log('   Attempting getUserMedia...')
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        })
        console.log('   ✅ getUserMedia SUCCESS!')
        console.log(`   Stream tracks: ${stream.getTracks().length}`)
        stream.getTracks().forEach(track => track.stop())
      } catch (e: any) {
        console.log(`   ❌ getUserMedia FAILED: ${e.name} - ${e.message}`)
        console.log(`   Error details:`, e)
      }
    } else {
      console.log('   ❌ getUserMedia not available')
    }
    console.log('')

    console.log('💡 TROUBLESHOOTING:')
    console.log('   1. Make sure no other apps are using the camera')
    console.log('   2. Try refreshing the page')
    console.log('   3. Check Chrome camera permissions')
    console.log('   4. Try different camera if multiple available')
  }
}

// Comprehensive Safari camera debugging utility
if (typeof window !== 'undefined') {
  (window as any).debugSafariCamera = async () => {
    console.log('🔧 SAFARI CAMERA DEBUG UTILITY')
    console.log('==============================')
    console.log('')

    // System Information
    console.log('📊 SYSTEM INFORMATION:')
    console.log(`   URL: ${window.location.href}`)
    console.log(`   Protocol: ${window.location.protocol}`)
    console.log(`   Hostname: ${window.location.hostname}`)
    console.log(`   Secure Context: ${window.isSecureContext}`)
    console.log(`   In iFrame: ${window !== window.top}`)
    console.log(`   User Agent: ${navigator.userAgent}`)
    console.log('')

    // Safari Detection
    const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')
    console.log('🎯 SAFARI DETECTION:')
    console.log(`   Is Safari: ${isSafari}`)
    if (isSafari) {
      const version = navigator.userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown'
      console.log(`   Safari Version: ${version}`)
      console.log(`   MediaDevices Expected: ✅ (Safari ${version} supports it)`)
    }
    console.log('')

    // MediaDevices API Status
    console.log('📷 MEDIA DEVICES API:')
    console.log(`   navigator.mediaDevices: ${!!navigator.mediaDevices}`)
    if (navigator.mediaDevices) {
      console.log(`   getUserMedia: ${!!navigator.mediaDevices.getUserMedia}`)
      console.log(`   enumerateDevices: ${!!navigator.mediaDevices.enumerateDevices}`)
    } else {
      console.log('   ❌ CRITICAL: MediaDevices API is completely blocked!')
    }
    console.log('')

    // Permission Status
    console.log('🔐 PERMISSION STATUS:')
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
        console.log(`   Camera Permission: ${result.state}`)
      } catch (error) {
        console.log(`   Permission Check Failed: ${error}`)
      }
    } else {
      console.log('   Permissions API: Not available')
    }
    console.log('')

    // Root Cause Analysis
    console.log('🔍 ROOT CAUSE ANALYSIS:')
    if (!window.isSecureContext) {
      console.log('   ❌ NOT SECURE CONTEXT')
      console.log('   Safari blocks MediaDevices API on HTTP!')
      console.log('   SOLUTION: Use HTTPS or localhost')
    } else if (!navigator.mediaDevices) {
      console.log('   ❌ MEDIA DEVICES API BLOCKED')
      console.log('   This should not happen on modern Safari with HTTPS')
      console.log('   POSSIBLE CAUSES:')
      console.log('   - Content Security Policy blocking')
      console.log('   - Browser extension interference')
      console.log('   - Safari privacy settings')
    } else {
      console.log('   ✅ API AVAILABLE - Permission issue')
      console.log('   Try granting camera permission when prompted')
    }
    console.log('')

    // Action Plan
    console.log('🚀 ACTION PLAN:')
    if (!window.isSecureContext) {
      console.log('   1. Use HTTPS URL instead of HTTP')
      console.log('   2. Or access via localhost: http://localhost:3002/')
      console.log('   3. Accept any security warnings')
    } else if (!navigator.mediaDevices) {
      console.log('   1. Check Safari privacy settings')
      console.log('   2. Disable any privacy extensions')
      console.log('   3. Try Safari in private browsing mode')
      console.log('   4. Clear Safari website data')
    } else {
      console.log('   1. When camera prompt appears, click "Allow"')
      console.log('   2. Check Safari camera permissions in Settings')
      console.log('   3. Try refreshing the page')
    }
    console.log('')

    // Quick Test
    console.log('🧪 QUICK TEST:')
    console.log('   Run the following in console:')
    console.log('   testSafariCamera()')
  }
}

// Diagnostic utility for camera troubleshooting (can be called from browser console)
if (typeof window !== 'undefined') {
  (window as any).diagnoseCamera = async () => {
    console.log('🔍 Camera Diagnostic Report')
    console.log('==========================')

    // Check HTTPS (recommended but not required)
    const isHTTPS = location.protocol === 'https:'
    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(location.hostname)
    console.log(`🔒 HTTPS/Localhost: ${isHTTPS || isLocalhost ? '✅ Recommended' : '⚠️ HTTP (may have limitations)'} (${location.protocol}//${location.hostname})`)

    // Check camera API availability
    const hasMediaDevices = !!navigator.mediaDevices
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    const hasEnumerateDevices = !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)

    console.log(`📷 MediaDevices API: ${hasMediaDevices ? '✅' : '❌'}`)
    console.log(`📷 getUserMedia: ${hasGetUserMedia ? '✅' : '❌'}`)
    console.log(`📷 enumerateDevices: ${hasEnumerateDevices ? '✅' : '❌'}`)

    // Check camera availability
    if (hasEnumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cameras = devices.filter(d => d.kind === 'videoinput')
        console.log(`📷 Cameras found: ${cameras.length}`)
        cameras.forEach((camera, i) => {
          console.log(`  ${i + 1}. ${camera.label || 'Unnamed camera'} (${camera.deviceId.slice(0, 8)}...)`)
        })
      } catch (error) {
        console.log(`📷 Camera enumeration failed: ${error}`)
      }
    } else {
      console.log(`📷 Camera enumeration: Not supported`)
    }

    // Check permission status
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
        console.log(`🔐 Permission status: ${permission.state}`)
      } else {
        console.log(`🔐 Permissions API not available`)
      }
    } catch (error) {
      console.log(`🔐 Permission check failed: ${error}`)
      if (isFirefox) {
        console.log(`🦊 Firefox permission check failed - this is common`)
        console.log(`   Try: about:config -> media.navigator.permission.disabled -> false`)
      }
    }

    // Check user agent
    const userAgent = navigator.userAgent.toLowerCase()
    let browser = 'Unknown'
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) browser = 'Chrome'
    else if (userAgent.includes('firefox')) browser = 'Firefox'
    else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      browser = 'Safari'
      const safariVersion = userAgent.match(/version\/(\d+)/i)?.[1] || 'unknown'
      console.log(`🧭 Safari detected - version check:`)
      console.log(`   Version: ${safariVersion}`)
      console.log(`   MediaDevices API should be fully supported in Safari ${safariVersion}`)
    }
    else if (userAgent.includes('edg')) browser = 'Edge'
    console.log(`🌐 Browser: ${browser}`)

    // Check mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    console.log(`📱 Mobile device: ${isMobile ? '✅' : '❌'}`)

    // Safari-specific checks
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome')
    if (isSafari) {
      console.log(`🧭 Safari detected - version check:`)
      const safariVersion = userAgent.match(/version\/(\d+)/i)?.[1] || 'unknown'
      console.log(`   Version: ${safariVersion}`)
      console.log(`   MediaDevices API should be fully supported in Safari ${safariVersion}`)

      // Safari has stricter requirements
      const isSecureContext = window.isSecureContext
      console.log(`   Secure Context: ${isSecureContext ? '✅' : '❌'}`)
      console.log(`   User Gesture Required: Safari requires user gesture for camera access`)
    console.log(`   Current Protocol: ${location.protocol}`)
    console.log(`   Is Localhost: ${['localhost', '127.0.0.1', '::1'].includes(location.hostname)}`)
    console.log(`   ⚠️ CRITICAL: Safari blocks MediaDevices API on HTTP (except localhost)`)

      if (!isSecureContext) {
        console.log(`   ⚠️ Safari requires secure context for camera access`)
        if (location.protocol === 'http:' && !['localhost', '127.0.0.1', '::1'].includes(location.hostname)) {
          console.log(`   🚨 DETECTED: You're running on HTTP with IP address ${location.hostname}`)
          console.log(`   🚨 SOLUTION: Use https:// or localhost instead`)
        }
      }

      // Check if we're in an iframe (Safari blocks camera in iframes)
      const isInIframe = window !== window.top
      console.log(`   In iFrame: ${isInIframe ? '❌ (camera blocked)' : '✅'}`)

      if (isInIframe) {
        console.log(`   ⚠️ Safari blocks camera access in iframes`)
      }
    }

    // Firefox-specific checks
    const isFirefox = userAgent.includes('firefox')
    if (isFirefox) {
      console.log(`🦊 Firefox detected - version check:`)
      const firefoxVersion = userAgent.match(/firefox\/(\d+)/i)?.[1] || 'unknown'
      console.log(`   Version: ${firefoxVersion}`)
      console.log(`   MediaDevices API should be fully supported in Firefox ${firefoxVersion}`)

      // Check if we're in a secure context
      const isSecureContext = window.isSecureContext
      console.log(`   Secure Context: ${isSecureContext ? '✅' : '❌'}`)

      if (!isSecureContext) {
        console.log(`   ⚠️ Firefox requires secure context for camera access`)
      }
    }

    console.log('\n💡 Troubleshooting tips:')
    console.log('  - Check browser camera settings')
    console.log('  - Try refreshing the page')
    console.log('  - Close other apps using the camera')
    console.log('  - For production: Use HTTPS for best compatibility')
    if (!isHTTPS && !isLocalhost) {
      console.log('  - Note: HTTP may work but has limitations on some devices')
    }
  }
}

export default BarcodeScanner
