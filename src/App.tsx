// Main App component for HummingbirdPantry
// This component serves as the root of our React application

import React from 'react'
import { Package, ShoppingCart, BarChart3, Scan, Plus, Database } from 'lucide-react'

// Import pantry components
import PantryView from '@/components/pantry/PantryView'
import BarcodeScanner from '@/components/barcode/BarcodeScanner'
import AddItemModal from '@/components/pantry/AddItemModal'
import CacheDemoPage from '@/components/cache/CacheDemoPage'

// Main App component - Simple One-Column Mobile Layout
const App: React.FC = () => {
  const [showBarcodeScanner, setShowBarcodeScanner] = React.useState(false)
  const [showAddItemModal, setShowAddItemModal] = React.useState(false)
  const [currentView, setCurrentView] = React.useState<'pantry' | 'demo'>('pantry')

  // Initialize barcode cache on app startup
  React.useEffect(() => {
    const initializeCache = async () => {
      try {
        // Import cache services dynamically to avoid circular dependencies
        const { BarcodeService } = await import('@/services/barcode.service')
        const { initializeBackgroundSync } = await import('@/services/backgroundSync.service')

        // Initialize cache system
        await BarcodeService.initializeCache()
        console.log('🚀 App initialized with barcode cache support')

        // Initialize background sync
        await initializeBackgroundSync()
        console.log('🔄 Background sync service started')

      } catch (error) {
        console.error('❌ Failed to initialize cache system:', error)
        // Continue app initialization even if cache fails
      }
    }

    initializeCache()
  }, [])

  // Camera diagnostic function (no console needed)
  const runCameraDiagnostic = async () => {
    const results = []
    const debugInfo = []

    try {
      // Browser detection
      const userAgent = navigator.userAgent
      const isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edg')
      const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome')
      const isFirefox = userAgent.includes('Firefox')

      results.push(`🌐 Browser: ${isChrome ? 'Chrome' : isSafari ? 'Safari' : isFirefox ? 'Firefox' : 'Unknown'}`)
      results.push(`📱 User Agent: ${userAgent.substring(0, 50)}...`)

      debugInfo.push(`Full UA: ${userAgent}`)
      debugInfo.push(`HTTPS: ${location.protocol === 'https:'}`)
      debugInfo.push(`Host: ${location.hostname}`)

      // Check navigator existence
      if (typeof navigator === 'undefined') {
        results.push('❌ navigator is undefined')
        debugInfo.push('navigator object missing')
      } else {
        results.push('✅ navigator exists')

        // Check MediaDevices existence
        if (!navigator.mediaDevices) {
          results.push('❌ navigator.mediaDevices is undefined')

          // Check if it's Safari blocking it
          if (isSafari) {
            results.push('🎯 This is expected in Safari on HTTP')
            debugInfo.push('Safari HTTP restriction detected')
          } else {
            results.push('🎯 Unexpected - should be available in Chrome')
            debugInfo.push('navigator properties:', Object.getOwnPropertyNames(navigator))
          }
        } else {
          results.push('✅ navigator.mediaDevices exists')

          // Check getUserMedia
          if (!navigator.mediaDevices.getUserMedia) {
            results.push('❌ getUserMedia method missing')
            debugInfo.push('Available methods:', Object.getOwnPropertyNames(navigator.mediaDevices))
          } else {
            results.push('✅ getUserMedia method available')
          }
        }
      }

      // Try to proceed with other checks even if MediaDevices fails
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Check permissions
        if (navigator.permissions) {
          try {
            const result = await navigator.permissions.query({ name: 'camera' as any })
            results.push(`🔐 Camera permission: ${result.state}`)
          } catch (e) {
            results.push('⚠️ Permission check failed')
            debugInfo.push(`Permission error: ${e}`)
          }
        }

        // Test getUserMedia
        try {
          results.push('🎥 Testing camera access...')
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
          })
          results.push('✅ Camera access successful!')
          results.push(`📊 Video tracks: ${stream.getVideoTracks().length}`)
          stream.getTracks().forEach(track => track.stop())
        } catch (e: any) {
          results.push(`❌ Camera access failed: ${e.name}`)
          results.push(`📝 Error: ${e.message}`)
          debugInfo.push(`Camera error details: ${e}`)
        }
      }

    } catch (error: any) {
      results.push(`❌ Diagnostic crashed: ${error.message}`)
      debugInfo.push(`Crash details: ${error}`)
    }

    // Show results in alert
    const message = 'CAMERA DIAGNOSTIC RESULTS:\n\n' + results.join('\n')
    alert(message)

    // Show debug info if there were issues
    if (debugInfo.length > 0) {
      setTimeout(() => {
        const debugMessage = 'DEBUG INFO:\n\n' + debugInfo.join('\n')
        alert(debugMessage)
      }, 500)
    }

    // Also log to console for debugging
    console.log('Camera Diagnostic Results:', results)
    console.log('Debug Info:', debugInfo)
  }

  // Modal trigger functions (inline in navigation)

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200">
      {/* Simple Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-neutral-900 md:bg-gradient-to-r md:from-primary-600 md:to-primary-700 md:bg-clip-text md:text-transparent">
              HummingbirdPantry
            </h1>
            <p className="text-neutral-600 mt-1 text-sm">Smart Pantry Management</p>
          </div>
        </div>
      </header>

      {/* One-Column Layout - Full Width on Mobile, Contained on Desktop */}
      <main className="w-full px-0 sm:px-4 sm:max-w-7xl sm:mx-auto lg:px-8 py-8">
        {currentView === 'pantry' ? (
          <PantryView />
        ) : (
          <CacheDemoPage />
        )}
      </main>

      {/* Modals */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onBarcodeDetected={async (barcode) => {
            console.log('Barcode scanned from main app:', barcode)
            alert(`Barcode scanned: ${barcode}\n\nThis would normally auto-fill an add item form or quick-add the item.`)
            setShowBarcodeScanner(false)
          }}
          onError={(error) => {
            console.error('Barcode scanner error:', error)
            alert(`Scanner error: ${error}`)
            setShowBarcodeScanner(false)
          }}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {showAddItemModal && (
        <AddItemModal
          onClose={() => setShowAddItemModal(false)}
        />
      )}

      {/* Mobile Bottom Navigation - Clear and Readable */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-lg z-40">
        <div className="grid grid-cols-5 gap-0">
          {/* Pantry - Active State */}
          <button
            onClick={() => setCurrentView('pantry')}
            className={`flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              currentView === 'pantry'
                ? 'bg-primary-50 border-t-2 border-primary-500'
                : 'hover:bg-neutral-50'
            }`}
          >
            <Package size={20} className={currentView === 'pantry' ? 'text-primary-600 mb-1' : 'text-neutral-600 mb-1'} />
            <span className={`text-xs font-medium ${currentView === 'pantry' ? 'text-primary-700' : 'text-neutral-700'}`}>
              Pantry
            </span>
          </button>

          {/* Scan Barcode */}
          <button
            onClick={() => setShowBarcodeScanner(true)}
            className="flex flex-col items-center justify-center py-3 px-2 hover:bg-neutral-50 transition-colors"
          >
            <Scan size={20} className="text-neutral-600 mb-1" />
            <span className="text-xs font-medium text-neutral-700">Scan</span>
          </button>

          {/* Add Item */}
          <button
            onClick={() => setShowAddItemModal(true)}
            className="flex flex-col items-center justify-center py-3 px-2 hover:bg-neutral-50 transition-colors"
          >
            <Plus size={20} className="text-neutral-600 mb-1" />
            <span className="text-xs font-medium text-neutral-700">Add</span>
          </button>

          {/* Shopping List */}
          <button className="flex flex-col items-center justify-center py-3 px-2 hover:bg-neutral-50 transition-colors">
            <ShoppingCart size={20} className="text-neutral-600 mb-1" />
            <span className="text-xs font-medium text-neutral-700">Shop</span>
          </button>

          {/* Camera Test */}
          <button
            onClick={runCameraDiagnostic}
            className="flex flex-col items-center justify-center py-3 px-2 hover:bg-neutral-50 transition-colors"
          >
            <Scan size={20} className="text-neutral-600 mb-1" />
            <span className="text-xs font-medium text-neutral-700">Test</span>
          </button>

          {/* Cache Demo */}
          <button
            onClick={() => setCurrentView('demo')}
            className={`flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              currentView === 'demo'
                ? 'bg-blue-50 border-t-2 border-blue-500'
                : 'hover:bg-neutral-50'
            }`}
          >
            <Database size={20} className={currentView === 'demo' ? 'text-blue-600 mb-1' : 'text-neutral-600 mb-1'} />
            <span className={`text-xs font-medium ${currentView === 'demo' ? 'text-blue-700' : 'text-neutral-700'}`}>
              Demo
            </span>
          </button>
        </div>
      </nav>

      {/* Desktop Navigation - Clean Horizontal Bar */}
      <nav className="hidden md:flex fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-neutral-200 rounded-full shadow-lg px-6 py-3 z-40">
        <div className="flex space-x-8">
          <button
            onClick={() => setCurrentView('pantry')}
            className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'pantry'
                ? 'bg-primary-50 text-primary-700'
                : 'hover:bg-neutral-50 text-neutral-600'
            }`}
          >
            <Package size={20} />
            <span className="text-xs font-medium">Pantry</span>
          </button>

          <button
            onClick={() => setShowBarcodeScanner(true)}
            className="flex flex-col items-center space-y-1 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600"
          >
            <Scan size={20} />
            <span className="text-xs font-medium">Scan</span>
          </button>

          <button
            onClick={() => setShowAddItemModal(true)}
            className="flex flex-col items-center space-y-1 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600"
          >
            <Plus size={20} />
            <span className="text-xs font-medium">Add</span>
          </button>

          <button
            onClick={() => setCurrentView('demo')}
            className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'demo'
                ? 'bg-blue-50 text-blue-700'
                : 'hover:bg-neutral-50 text-neutral-600'
            }`}
          >
            <Database size={20} />
            <span className="text-xs font-medium">Demo</span>
          </button>

          <button className="flex flex-col items-center space-y-1 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600">
            <ShoppingCart size={20} />
            <span className="text-xs font-medium">Shop</span>
          </button>

          <button className="flex flex-col items-center space-y-1 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600">
            <BarChart3 size={20} />
            <span className="text-xs font-medium">Stats</span>
          </button>
        </div>
      </nav>

      {/* Add bottom padding on mobile to account for navigation bar */}
      <div className="pb-20 md:pb-0"></div>

      {/* Footer - Hidden on mobile, shown on desktop */}
      <footer className="hidden md:block bg-white border-t border-neutral-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-neutral-500">
            <p>HummingbirdPantry - Smart Pantry Management</p>
            <p className="mt-1">Built with React, TypeScript, and Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
