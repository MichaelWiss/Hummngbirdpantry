// Barcode Cache Service - Offline barcode caching with IndexedDB
// Provides persistent storage for barcode-to-product mappings with LRU eviction

import type {
  Barcode,
  PantryItem,
  BarcodeCacheEntry,
  BarcodeCacheStats,
  BarcodeCacheConfig,
  CacheLookupResult
} from '@/types'

// Default cache configuration
const DEFAULT_CONFIG: BarcodeCacheConfig = {
  maxSize: 1000, // Maximum 1000 cached barcodes
  ttl: 30 * 24 * 60 * 60 * 1000, // 30 days default TTL
  syncInterval: 15 * 60 * 1000, // 15 minutes sync interval
  enableBackgroundSync: true,
  enableCompression: false
}

// IndexedDB database name and version
const DB_NAME = 'HummingbirdPantryCache'
const DB_VERSION = 1
const CACHE_STORE = 'barcodeCache'
const STATS_STORE = 'cacheStats'

class BarcodeCacheService {
  private db: IDBDatabase | null = null
  private config: BarcodeCacheConfig = DEFAULT_CONFIG
  private cacheStats: BarcodeCacheStats = {
    totalEntries: 0,
    lastSync: null,
    cacheSize: 0,
    hitRate: 0,
    avgLookupTime: 0
  }

  // Initialize IndexedDB database
  async initialize(config?: Partial<BarcodeCacheConfig>): Promise<void> {
    if (config) {
      this.config = { ...DEFAULT_CONFIG, ...config }
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('❌ Failed to open barcode cache database')
        reject(new Error('Failed to initialize barcode cache'))
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ Barcode cache database initialized')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create cache store
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          const cacheStore = db.createObjectStore(CACHE_STORE, { keyPath: 'barcode' })
          cacheStore.createIndex('lastAccessed', 'lastAccessed', { unique: false })
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false })
          cacheStore.createIndex('source', 'source', { unique: false })
        }

        // Create stats store
        if (!db.objectStoreNames.contains(STATS_STORE)) {
          db.createObjectStore(STATS_STORE, { keyPath: 'id' })
        }
      }
    })
  }

  // Store barcode-product mapping in cache
  async store(
    barcode: Barcode,
    productData: Partial<PantryItem>,
    source: BarcodeCacheEntry['source'] = 'api'
  ): Promise<void> {
    if (!this.db) {
      throw new Error('Cache not initialized')
    }

    const entry: BarcodeCacheEntry = {
      barcode,
      productData,
      timestamp: new Date(),
      lastAccessed: new Date(),
      accessCount: 1,
      source,
      ttl: new Date(Date.now() + this.config.ttl)
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readwrite')
      const store = transaction.objectStore(CACHE_STORE)

      const request = store.put(entry)

      request.onsuccess = () => {
        console.log(`💾 Cached barcode ${barcode} (${source})`)
        this.updateStats()
        resolve()
      }

      request.onerror = () => {
        console.error('❌ Failed to store barcode in cache')
        reject(new Error('Failed to cache barcode'))
      }
    })
  }

  // Lookup barcode in cache
  async lookup(barcode: Barcode): Promise<CacheLookupResult> {
    if (!this.db) {
      throw new Error('Cache not initialized')
    }

    const startTime = performance.now()

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readwrite')
      const store = transaction.objectStore(CACHE_STORE)

      const request = store.get(barcode)

      request.onsuccess = () => {
        const entry: BarcodeCacheEntry | undefined = request.result

        if (entry) {
          // Check if entry is expired
          if (entry.ttl && entry.ttl < new Date()) {
            // Remove expired entry
            this.delete(barcode)
            resolve({
              found: false,
              data: null,
              source: 'none',
              timestamp: new Date(),
              cached: false
            })
            return
          }

          // Update access statistics
          entry.lastAccessed = new Date()
          entry.accessCount++

          // Save updated entry
          store.put(entry)

          const lookupTime = performance.now() - startTime

          console.log(`✅ Cache hit for barcode ${barcode} (${lookupTime.toFixed(2)}ms)`)

          resolve({
            found: true,
            data: entry.productData,
            source: 'cache',
            timestamp: entry.timestamp,
            cached: true
          })
        } else {
          resolve({
            found: false,
            data: null,
            source: 'none',
            timestamp: new Date(),
            cached: false
          })
        }
      }

      request.onerror = () => {
        console.error('❌ Cache lookup failed')
        resolve({
          found: false,
          data: null,
          source: 'none',
          timestamp: new Date(),
          cached: false
        })
      }
    })
  }

  // Delete barcode from cache
  async delete(barcode: Barcode): Promise<void> {
    if (!this.db) {
      throw new Error('Cache not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readwrite')
      const store = transaction.objectStore(CACHE_STORE)

      const request = store.delete(barcode)

      request.onsuccess = () => {
        console.log(`🗑️ Removed barcode ${barcode} from cache`)
        this.updateStats()
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to delete from cache'))
      }
    })
  }

  // Clear entire cache
  async clear(): Promise<void> {
    if (!this.db) {
      throw new Error('Cache not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readwrite')
      const store = transaction.objectStore(CACHE_STORE)

      const request = store.clear()

      request.onsuccess = () => {
        console.log('🧹 Cache cleared')
        this.updateStats()
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to clear cache'))
      }
    })
  }

  // Get cache statistics
  async getStats(): Promise<BarcodeCacheStats> {
    if (!this.db) {
      throw new Error('Cache not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readonly')
      const store = transaction.objectStore(CACHE_STORE)

      const request = store.getAll()

      request.onsuccess = () => {
        const entries: BarcodeCacheEntry[] = request.result

        let totalSize = 0
        entries.forEach(entry => {
          totalSize += JSON.stringify(entry).length
        })

        this.cacheStats = {
          ...this.cacheStats,
          totalEntries: entries.length,
          cacheSize: totalSize
        }

        resolve(this.cacheStats)
      }

      request.onerror = () => {
        reject(new Error('Failed to get cache statistics'))
      }
    })
  }

  // Get all cached barcodes
  async getAllBarcodes(): Promise<Barcode[]> {
    if (!this.db) {
      throw new Error('Cache not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readonly')
      const store = transaction.objectStore(CACHE_STORE)

      const request = store.getAllKeys()

      request.onsuccess = () => {
        const barcodes = request.result as Barcode[]
        resolve(barcodes)
      }

      request.onerror = () => {
        reject(new Error('Failed to get cached barcodes'))
      }
    })
  }

  // Clean up expired entries and enforce max size
  async cleanup(): Promise<void> {
    if (!this.db) {
      throw new Error('Cache not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readwrite')
      const store = transaction.objectStore(CACHE_STORE)

      const request = store.getAll()

      request.onsuccess = () => {
        const entries: BarcodeCacheEntry[] = request.result
        const now = new Date()
        let deletions = 0

        // Remove expired entries
        entries.forEach(entry => {
          if (entry.ttl && entry.ttl < now) {
            store.delete(entry.barcode)
            deletions++
          }
        })

        // If still over max size, remove least recently used
        if (entries.length - deletions > this.config.maxSize) {
          const sorted = entries
            .filter(entry => !entry.ttl || entry.ttl >= now)
            .sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime())

          const toRemove = sorted.slice(0, (entries.length - deletions) - this.config.maxSize)
          toRemove.forEach(entry => {
            store.delete(entry.barcode)
            deletions++
          })
        }

        transaction.oncomplete = () => {
          if (deletions > 0) {
            console.log(`🧹 Cache cleanup: removed ${deletions} entries`)
          }
          this.updateStats()
          resolve()
        }

        transaction.onerror = () => {
          reject(new Error('Cache cleanup failed'))
        }
      }

      request.onerror = () => {
        reject(new Error('Failed to access cache for cleanup'))
      }
    })
  }

  // Check if barcode is cached
  async isCached(barcode: Barcode): Promise<boolean> {
    if (!this.db) {
      return false
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readonly')
      const store = transaction.objectStore(CACHE_STORE)

      const request = store.get(barcode)

      request.onsuccess = () => {
        const entry: BarcodeCacheEntry | undefined = request.result
        const isValid = entry && (!entry.ttl || entry.ttl >= new Date())
        resolve(!!isValid)
      }

      request.onerror = () => {
        resolve(false)
      }
    })
  }

  // Search cache by product name or brand
  async search(query: string): Promise<Array<{ barcode: Barcode; data: Partial<PantryItem> }>> {
    if (!this.db) {
      throw new Error('Cache not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readonly')
      const store = transaction.objectStore(CACHE_STORE)

      const request = store.getAll()

      request.onsuccess = () => {
        const entries: BarcodeCacheEntry[] = request.result
        const lowercaseQuery = query.toLowerCase()

        const results = entries
          .filter(entry => {
            const name = entry.productData.name?.toLowerCase() || ''
            const brand = entry.productData.brand?.toLowerCase() || ''
            return name.includes(lowercaseQuery) || brand.includes(lowercaseQuery)
          })
          .map(entry => ({
            barcode: entry.barcode,
            data: entry.productData
          }))

        resolve(results)
      }

      request.onerror = () => {
        reject(new Error('Cache search failed'))
      }
    })
  }

  // Update cache statistics
  private async updateStats(): Promise<void> {
    try {
      this.cacheStats = await this.getStats()
    } catch (error) {
      console.warn('Failed to update cache statistics:', error)
    }
  }

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      console.log('🔒 Barcode cache database closed')
    }
  }

  // Export cache data (for backup/sync)
  async export(): Promise<BarcodeCacheEntry[]> {
    if (!this.db) {
      throw new Error('Cache not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readonly')
      const store = transaction.objectStore(CACHE_STORE)

      const request = store.getAll()

      request.onsuccess = () => {
        const entries: BarcodeCacheEntry[] = request.result
        resolve(entries)
      }

      request.onerror = () => {
        reject(new Error('Failed to export cache data'))
      }
    })
  }

  // Import cache data (for restore/sync)
  async import(entries: BarcodeCacheEntry[]): Promise<void> {
    if (!this.db) {
      throw new Error('Cache not initialized')
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readwrite')
      const store = transaction.objectStore(CACHE_STORE)

      let completed = 0
      const total = entries.length

      if (total === 0) {
        resolve()
        return
      }

      entries.forEach(entry => {
        const request = store.put(entry)

        request.onsuccess = () => {
          completed++
          if (completed === total) {
            console.log(`📥 Imported ${total} cache entries`)
            this.updateStats()
            resolve()
          }
        }

        request.onerror = () => {
          console.error('❌ Failed to import cache entry:', entry.barcode)
          completed++
          if (completed === total) {
            resolve()
          }
        }
      })
    })
  }
}

// Export singleton instance
export const barcodeCache = new BarcodeCacheService()

// Helper functions for common operations
export const initializeCache = (config?: Partial<BarcodeCacheConfig>) =>
  barcodeCache.initialize(config)

export const cacheBarcode = (
  barcode: Barcode,
  productData: Partial<PantryItem>,
  source: BarcodeCacheEntry['source'] = 'api'
) => barcodeCache.store(barcode, productData, source)

export const lookupCachedBarcode = (barcode: Barcode) =>
  barcodeCache.lookup(barcode)

export const isBarcodeCached = (barcode: Barcode) =>
  barcodeCache.isCached(barcode)

export const clearBarcodeCache = () =>
  barcodeCache.clear()

export const getCacheStats = () =>
  barcodeCache.getStats()

export const cleanupCache = () =>
  barcodeCache.cleanup()
