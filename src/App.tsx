// Main App component for HummingbirdPantry
// This component serves as the root of our React application

import React from 'react'
import type { ItemCategory, MeasurementUnit, Barcode } from '@/types'
import { Package, ShoppingCart, BarChart3, Scan, Plus } from 'lucide-react'

// Import pantry components
import PantryView from '@/components/pantry/PantryView'
import CategoryList from '@/components/pantry/CategoryList'
import CategoryItems from '@/components/pantry/CategoryItems'
import { useScanner } from '@/components/barcode/ScannerProvider'
import { getApiBaseUrl } from '@/services/apiClient'
import AddItemModal from '@/components/pantry/AddItemModal'
// Removed demo page from navigation

// Main App component - Simple One-Column Mobile Layout
const App: React.FC = () => {
  const [showAddItemModal, setShowAddItemModal] = React.useState(false)
  const [currentView, setCurrentView] = React.useState<'pantry' | 'categories' | 'categoryItems'>('pantry')
  const [activeCategory, setActiveCategory] = React.useState<ItemCategory | null>(null)
  const [dbOk, setDbOk] = React.useState<boolean | null>(null)
  const [addItemInitialData, setAddItemInitialData] = React.useState<Partial<{
    name: string
    category: ItemCategory
    quantity: number
    unit: MeasurementUnit
    barcode: Barcode | ''
    notes: string
  }> | undefined>(undefined)

  const scannerCtx = (() => { try { return (useScanner as any)() } catch { return null } })()
  const openScanner = React.useCallback(() => {
    if (scannerCtx) {
      scannerCtx.open(async (barcode: Barcode) => {
        // Clean, server-first flow
        try {
          const baseUrl = getApiBaseUrl()
          const { ProductRepository } = await import('@/services/ProductRepository')
          
          // Try server increment first (for existing items)
          if (baseUrl && dbOk === true) {
            try {
              await ProductRepository.increment(barcode, 1)
              console.log('✅ Incremented existing item')
              return // Success - close scanner
            } catch (err) {
              console.log('ℹ️ Item not found on server, opening form with prefill')
            }
          } else if (baseUrl && dbOk === false) {
            console.log('⚠️ Server unreachable, opening form with prefill')
          }

          // Not found - open form with OFF prefill
          const { lookupProductByBarcode } = await import('@/services/productLookup')
          const productData = await lookupProductByBarcode(barcode)
          
          if (productData) {
            const initialData = {
              barcode,
              name: productData.name,
              category: productData.category,
              quantity: 1,
              unit: 'pieces' as MeasurementUnit,
              ...(productData.brand ? { brand: productData.brand } : {})
            }
            console.log('🔄 App: Setting initial data with product:', initialData)
            setAddItemInitialData(initialData)
          } else {
            console.log('🔄 App: Setting initial data with barcode only:', { barcode })
            setAddItemInitialData({ barcode })
          }
          
          setShowAddItemModal(true)
        } catch (e) {
          console.error('Scanner pipeline failed:', e)
          setAddItemInitialData({ barcode })
          setShowAddItemModal(true)
        }
      })
    }
  }, [scannerCtx, dbOk])

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
    const initializeApp = async () => {
      try {
        // Import services dynamically to avoid circular dependencies
        const { ProductRepository } = await import('@/services/ProductRepository')
        const { usePantryStore } = await import('@/stores/pantry.store')

        console.log('🚀 App initializing...')

        // Check API connectivity first with enhanced monitoring
        const baseUrl = getApiBaseUrl()
        if (!baseUrl) {
          console.error('❌ VITE_API_BASE_URL not configured - running in local-only mode')
          setDbOk(false)
        } else {
          const checkHealthWithRetry = async (maxAttempts = 3): Promise<boolean> => {
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
              try {
                const healthCheck = await fetch(`${baseUrl}/health`, { 
                  cache: 'no-store',
                  signal: AbortSignal.timeout(5000) // 5s timeout
                })
                if (healthCheck.ok) {
                  const j = await healthCheck.json()
                  
                  // Production-quality health check
                  if (j?.dbOk !== undefined) {
                    // Server provides dbOk field (preferred)
                    const isHealthy = !!j.dbOk
                    if (isHealthy) {
                      console.log('✅ API server + DB connected:', baseUrl)
                    } else {
                      console.error('❌ API server reachable but DB not connected')
                    }
                    return isHealthy
                  } else if (j?.ok) {
                    // Server doesn't provide dbOk - test database connectivity ourselves
                    console.log('ℹ️ Server missing dbOk field, testing database connectivity...')
                    try {
                      const dbTest = await fetch(`${baseUrl}/api/products?limit=1`, {
                        cache: 'no-store',
                        signal: AbortSignal.timeout(3000)
                      })
                      if (dbTest.ok) {
                        console.log('✅ API server + DB connected (verified via products endpoint):', baseUrl)
                        return true
                      } else {
                        console.error('❌ Database test failed:', dbTest.status)
                        return false
                      }
                    } catch (dbError) {
                      console.error('❌ Database connectivity test failed:', (dbError as Error).message)
                      return false
                    }
                  } else {
                    console.error('❌ Invalid health response:', j)
                    return false
                  }
                } else {
                  throw new Error(`HTTP ${healthCheck.status}`)
                }
              } catch (healthError) {
                if (attempt < maxAttempts) {
                  const delay = 1000 * attempt // 1s, 2s, 3s
                  console.warn(`Health check attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms:`, (healthError as Error).message)
                  await new Promise(resolve => setTimeout(resolve, delay))
                } else {
                  console.error('❌ API server unreachable after retries:', healthError)
                  return false
                }
              }
            }
            return false
          }
          
          const isHealthy = await checkHealthWithRetry()
          setDbOk(isHealthy)
        }

        // Hydrate pantry from Neon first, fallback to local mirror
        await ProductRepository.init()
        if (getApiBaseUrl()) {
          try {
            const serverItems = await ProductRepository.fetchFromServer()
            usePantryStore.getState().actions.replaceAll(serverItems)
            console.log(`🔄 Loaded ${serverItems.length} items from server (authoritative)`)          
          } catch (e: any) {
            console.error('❌ Server fetch failed; falling back to local mirror:', e)
            if (e?.message?.includes('API base URL not configured')) {
              console.error('   → Check VITE_API_BASE_URL environment variable')
            } else if (e?.message?.includes('failed: 4')) {
              console.error('   → Check CORS configuration on server')
            }
            const localItems = await ProductRepository.hydrateFromLocal()
            usePantryStore.getState().actions.replaceAll(localItems)
            console.log(`📦 Loaded ${localItems.length} items from local storage (fallback)`)          
          }
        } else {
          const localItems = await ProductRepository.hydrateFromLocal()
          usePantryStore.getState().actions.replaceAll(localItems)
          console.log(`📦 Loaded ${localItems.length} items from local storage (no server configured)`)        
        }

      } catch (error) {
        console.error('❌ Failed to initialize app:', error)
        // Continue app initialization even if hydration fails
      }
    }

    initializeApp()
  }, [])

  // Periodic health monitoring (every 30 seconds)
  React.useEffect(() => {
    if (!getApiBaseUrl()) return
    
    const monitorHealth = async () => {
      try {
        const baseUrl = getApiBaseUrl()
        if (!baseUrl) return
        
        const healthCheck = await fetch(`${baseUrl}/health`, { 
          cache: 'no-store',
          signal: AbortSignal.timeout(3000) // 3s timeout for background checks
        })
        
        if (healthCheck.ok) {
          const j = await healthCheck.json()
          
          // Production-quality background health check
          if (j?.dbOk !== undefined) {
            // Server provides dbOk field
            const isHealthy = !!j.dbOk
            setDbOk(isHealthy)
            if (!isHealthy) {
              console.warn('⚠️ Background health check: DB not connected')
            }
          } else if (j?.ok) {
            // Server doesn't provide dbOk - quick database test
            try {
              const dbTest = await fetch(`${baseUrl}/api/products?limit=1`, {
                cache: 'no-store', 
                signal: AbortSignal.timeout(2000) // Shorter timeout for background
              })
              const isHealthy = dbTest.ok
              setDbOk(isHealthy)
              if (!isHealthy) {
                console.warn('⚠️ Background health check: DB test failed')
              }
            } catch {
              setDbOk(false)
              console.warn('⚠️ Background health check: DB test error')
            }
          } else {
            setDbOk(false)
            console.warn('⚠️ Background health check: Invalid response')
          }
        } else {
          setDbOk(false)
          console.warn('⚠️ Background health check failed:', healthCheck.status)
        }
      } catch (error) {
        setDbOk(false)
        console.warn('⚠️ Background health check error:', (error as Error).message)
      }
    }
    
    const interval = setInterval(monitorHealth, 30000) // Check every 30s
    return () => clearInterval(interval)
  }, [])

  // Camera diagnostic function removed (unused)

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

      {/* Enhanced Neon connectivity banner */}
      {dbOk === false && (
        <div className="fixed top-0 inset-x-0 z-50">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
              <div>
                <strong>Neon database not reachable.</strong> Changes will not persist until connection is restored.
                <div className="text-xs mt-1 text-red-600">Check your internet connection or try again later.</div>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="text-red-800 hover:text-red-900 underline text-xs ml-4"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
      {dbOk === null && (
        <div className="fixed top-0 inset-x-0 z-50">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 text-sm">
              <strong>Checking Neon database connection...</strong>
            </div>
          </div>
        </div>
      )}
      {/* Legacy scanner fallback removed; ScannerProvider is the single render path */}

      {showAddItemModal && (
        <AddItemModal
          onClose={() => { setShowAddItemModal(false); setAddItemInitialData(undefined) }}
          onOpenScanner={openScanner}
          {...(addItemInitialData ? { initialData: addItemInitialData } : {})}
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
            onClick={openScanner}
            className="flex flex-col items-center justify-center py-3 px-2 hover:bg-neutral-50 transition-colors"
          >
            <Scan size={20} className="text-neutral-600 mb-1" />
            <span className="text-xs font-medium text-neutral-700">Scan</span>
          </button>

          {/* Add Item */}
          <button
            onClick={() => { if (showAddItemModal) return; setShowAddItemModal(true) }}
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
            onClick={openScanner}
            className="flex flex-col items-center space-y-1 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600"
          >
            <Scan size={20} />
            <span className="text-xs font-medium">Scan</span>
          </button>

          <button
            onClick={() => { if (showAddItemModal) return; setShowAddItemModal(true) }}
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
