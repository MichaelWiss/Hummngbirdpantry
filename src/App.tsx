// Main App component for HummingbirdPantry
// This component serves as the root of our React application

import React from 'react'
import type { ItemCategory, MeasurementUnit, Barcode } from '@/types'
import { Package, ShoppingCart, BarChart3, Scan, Plus } from 'lucide-react'

// Import pantry components
import PantryView from '@/components/pantry/PantryView'
import CategoryList from '@/components/pantry/CategoryList'
import CategoryItems from '@/components/pantry/CategoryItems'
import BarcodeScanner from '@/components/barcode/BarcodeScanner'
import AddItemModal from '@/components/pantry/AddItemModal'
// Removed demo page from navigation

// Main App component - Simple One-Column Mobile Layout
const App: React.FC = () => {
  const [showBarcodeScanner, setShowBarcodeScanner] = React.useState(false)
  const [showAddItemModal, setShowAddItemModal] = React.useState(false)
  const [currentView, setCurrentView] = React.useState<'pantry' | 'categories' | 'categoryItems'>('pantry')
  const [activeCategory, setActiveCategory] = React.useState<ItemCategory | null>(null)
  const [addItemInitialData, setAddItemInitialData] = React.useState<Partial<{
    name: string
    category: ItemCategory
    quantity: number
    unit: MeasurementUnit
    barcode: Barcode | ''
    notes: string
  }> | undefined>(undefined)

  // Dev-only: filter a benign ZXing / video element warning that can appear once during
  // stream handoff ("Trying to play video that is already playing."). This prevents
  // log noise without hiding other warnings. Guarded so we don't wrap multiple times
  // on Vite HMR / React Fast Refresh.
  React.useEffect(() => {
    if (!(import.meta as any).env?.DEV) return
    const c: any = console as any
    if (c._hbWarnPatched) return
    c._hbWarnPatched = true
    const originalWarn = console.warn
    console.warn = (...args: any[]) => {
      try {
        const first = args[0]
        if (typeof first === 'string') {
          if (/Trying to play video that is already playing/i.test(first)) return
        }
      } catch { /* ignore filter errors */ }
      originalWarn(...args)
    }
  }, [])

  // Initialize barcode cache on app startup
  const initRunRef = React.useRef(false)
  React.useEffect(() => {
    if (initRunRef.current) return
    initRunRef.current = true
    const initializeCache = async () => {
      try {
        // Import cache services dynamically to avoid circular dependencies
        const { BarcodeService } = await import('@/services/barcode.service')
        const { initializeBackgroundSync } = await import('@/services/backgroundSync.service')
        const { ProductRepository } = await import('@/services/ProductRepository')
        const { usePantryStore } = await import('@/stores/pantry.store')

        // Initialize cache system
        await BarcodeService.initializeCache()
        console.log('🚀 App initialized with barcode cache support')

        // Initialize background sync
        await initializeBackgroundSync()
        console.log('🔄 Background sync service started')

        // Hydrate pantry from local mirror, then server
        await ProductRepository.init()
        const localItems = await ProductRepository.hydrateFromLocal()
        usePantryStore.getState().actions.replaceAll(localItems)
        try {
          const serverItems = await ProductRepository.fetchFromServer()
          if (serverItems.length) {
            usePantryStore.getState().actions.replaceAll(serverItems)
          }
        } catch {/* ignore server fetch errors */}

      } catch (error) {
        console.error('❌ Failed to initialize cache system:', error)
        // Continue app initialization even if cache fails
      }
    }

    initializeCache()
  }, [])

  // Camera diagnostic function (no console needed)
  const runCameraDiagnostic = async () => {
  const results: string[] = []
  const debugInfo: string[] = []

    try {
      // Browser detection
      const userAgent = navigator.userAgent
      const isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edg')
      const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome')
      const isFirefox = userAgent.includes('Firefox')

      results.push(`🌐 Browser: ${isChrome ? 'Chrome (iOS uses WebKit)' : isSafari ? 'Safari' : isFirefox ? 'Firefox (iOS uses WebKit)' : 'Unknown'}`)
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
            results.push('🎯 iOS WebKit blocks camera on HTTP/LAN IP')
            debugInfo.push('Safari HTTP restriction detected')
          } else {
            results.push('🎯 On iOS, Chrome uses WebKit; secure context required')
            debugInfo.push('navigator properties: ' + Object.getOwnPropertyNames(navigator).join(','))
          }
        } else {
          results.push('✅ navigator.mediaDevices exists')

          // Check getUserMedia
          if (!navigator.mediaDevices.getUserMedia) {
            results.push('❌ getUserMedia method missing')
            debugInfo.push('Available methods: ' + Object.getOwnPropertyNames(navigator.mediaDevices).join(','))
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
        {currentView === 'pantry' && <PantryView />}
        {currentView === 'categories' && (
          <CategoryList onSelect={(cat) => { setActiveCategory(cat); setCurrentView('categoryItems') }} />
        )}
        {currentView === 'categoryItems' && activeCategory && (
          <CategoryItems category={activeCategory} onBack={() => setCurrentView('categories')} />
        )}
        {/* demo view removed */}
      </main>

      {/* Modals */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onBarcodeDetected={async (barcode) => {
            try {
              const { ProductRepository } = await import('@/services/ProductRepository')
              const { fetchProductByBarcode } = await import('@/services/openFoodFacts.service')
              const current = await ProductRepository.getByBarcode(barcode)
              setShowBarcodeScanner(false)
              if (current) {
                try {
                  await ProductRepository.increment(barcode, 1)
                  // Optionally enqueue server sync
                  if ((import.meta as any).env?.VITE_API_BASE_URL) {
                    const { enqueue } = await import('@/services/offlineQueue.service')
                    await enqueue({ method: 'POST', endpoint: '/api/products', payload: { ...current, quantity: current.quantity + 1 } })
                  }
                } catch (e) { console.warn('Local update failed (still usable):', e) }
                console.log(`Updated quantity: ${current.name} (+1)`) 
                return
              }
              const off = await fetchProductByBarcode(barcode)
              if (off.found && off.data) {
                const init = {
                  name: off.data.name!,
                  category: off.data.category as ItemCategory,
                  quantity: 1,
                  unit: 'pieces' as MeasurementUnit,
                  barcode
                }
                setAddItemInitialData(init)
                if ((import.meta as any).env?.VITE_API_BASE_URL) {
                  const { enqueue } = await import('@/services/offlineQueue.service')
                  await enqueue({ method: 'POST', endpoint: '/api/products', payload: init })
                }
                setShowAddItemModal(true)
              } else {
                setAddItemInitialData({ barcode })
                setShowAddItemModal(true)
              }
            } catch (e) {
              console.error('Post-scan handling failed:', e)
            }
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
          onClose={() => { setShowAddItemModal(false); setAddItemInitialData(undefined) }}
          onOpenScanner={() => setShowBarcodeScanner(true)}
          initialData={addItemInitialData}
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
            onClick={() => { setShowAddItemModal(false); setShowBarcodeScanner(true) }}
            className="flex flex-col items-center justify-center py-3 px-2 hover:bg-neutral-50 transition-colors"
          >
            <Scan size={20} className="text-neutral-600 mb-1" />
            <span className="text-xs font-medium text-neutral-700">Scan</span>
          </button>

          {/* Add Item */}
          <button
            onClick={() => { setShowBarcodeScanner(false); setShowAddItemModal(true) }}
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

          {/* Categories */}
          <button
            onClick={() => setCurrentView('categories')}
            className={`flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              currentView === 'categories' ? 'bg-primary-50 border-t-2 border-primary-500' : 'hover:bg-neutral-50'
            }`}
          >
            <BarChart3 size={20} className={currentView === 'categories' ? 'text-primary-600 mb-1' : 'text-neutral-600 mb-1'} />
            <span className={`text-xs font-medium ${currentView === 'categories' ? 'text-primary-700' : 'text-neutral-700'}`}>Categories</span>
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
            onClick={() => { setShowAddItemModal(false); setShowBarcodeScanner(true) }}
            className="flex flex-col items-center space-y-1 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600"
          >
            <Scan size={20} />
            <span className="text-xs font-medium">Scan</span>
          </button>

          <button
            onClick={() => { setShowBarcodeScanner(false); setShowAddItemModal(true) }}
            className="flex flex-col items-center space-y-1 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600"
          >
            <Plus size={20} />
            <span className="text-xs font-medium">Add</span>
          </button>

          {/* demo button removed */}

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
