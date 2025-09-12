// Background Sync Service - Automatic synchronization of cached barcode data
// Handles online/offline state management and background data synchronization

import { BarcodeService } from './barcode.service'
import { barcodeCache } from './barcodeCache.service'
import { dequeueAll, removeById, update } from './offlineQueue.service'
import { apiClient } from './apiClient'
import type { BarcodeCacheConfig } from '@/types'

class BackgroundSyncService {
  private syncInterval: ReturnType<typeof setInterval> | null = null
  private isOnline: boolean = navigator.onLine
  private config: BarcodeCacheConfig
  private pendingSyncs: Set<string> = new Set()
  private isProcessingQueue: boolean = false

  constructor(config: BarcodeCacheConfig) {
    this.config = config
    this.setupEventListeners()
  }

  // Initialize background sync
  async initialize(): Promise<void> {
    console.log('🔄 Initializing background sync service...')

    // Wait for cache readiness (with timeout fallback) to avoid early 'Cache not initialized' noise
    try {
      if (!barcodeCache.isReady()) {
        const abort = new Promise(res => setTimeout(res, 1500))
        await Promise.race([barcodeCache.whenReady(), abort])
      }
    } catch {/* ignore */}

    if (this.config.enableBackgroundSync) {
      this.startPeriodicSync()
    }

    // Perform initial sync if online
    if (this.isOnline) {
      await this.performFullSync()
      // Process any queued offline actions after initial sync
      try { await this.processQueue() } catch (e) { console.warn('⚠️ Queue flush at init failed:', e) }
    }

    console.log('✅ Background sync service initialized')
  }

  // Setup online/offline event listeners
  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))

    // Also listen for visibility changes to sync when app becomes visible
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
  }

  // Handle coming online
  private async handleOnline(): Promise<void> {
    console.log('🌐 Device came online')
    this.isOnline = true

    // Perform immediate sync when coming online
    await this.performFullSync()
    // Process any queued offline actions
    try { await this.processQueue() } catch (e) { console.warn('⚠️ Queue flush on online failed:', e) }

    // Restart periodic sync
    if (this.config.enableBackgroundSync) {
      this.startPeriodicSync()
    }
  }

  // Handle going offline
  private handleOffline(): void {
    console.log('📴 Device went offline')
    this.isOnline = false

    // Stop periodic sync
    this.stopPeriodicSync()

    // Mark all pending syncs as failed
    this.pendingSyncs.clear()
  }

  // Handle visibility change (app becomes active)
  private async handleVisibilityChange(): Promise<void> {
    if (document.visibilityState === 'visible' && this.isOnline) {
      console.log('👁️ App became visible, checking for sync...')
      await this.performIncrementalSync()
    }
  }

  // Start periodic background sync
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    console.log(`⏰ Starting periodic sync every ${this.config.syncInterval / 1000}s`)

    this.syncInterval = setInterval(async () => {
      if (this.isOnline) {
        await this.performIncrementalSync()
        try { await this.processQueue() } catch (e) { console.warn('⚠️ Queue flush on interval failed:', e) }
      }
    }, this.config.syncInterval)
  }

  // Stop periodic sync
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      console.log('⏹️ Stopping periodic sync')
      clearInterval(this.syncInterval as any)
      this.syncInterval = null
    }
  }

  // Perform full synchronization of all cached data
  private async performFullSync(): Promise<void> {
    if (!this.isOnline) {
      console.log('⚠️ Skipping full sync - device offline')
      return
    }

    console.log('🔄 Starting full cache synchronization...')

    try {
      if (!barcodeCache.isReady()) {
        console.log('⚠️ Skipping full sync - cache not ready')
        return
      }
      const cachedBarcodes = await BarcodeService.getCachedBarcodes()
      console.log(`📊 Found ${cachedBarcodes.length} cached barcodes to sync`)

      let synced = 0
      let failed = 0

      // Process in batches to avoid overwhelming the API
      const batchSize = 10
      for (let i = 0; i < cachedBarcodes.length; i += batchSize) {
        const batch = cachedBarcodes.slice(i, i + batchSize)

        await Promise.allSettled(
          batch.map(async (barcode) => {
            try {
              await this.syncBarcode(barcode)
              synced++
            } catch (error) {
              console.warn(`⚠️ Failed to sync barcode ${barcode}:`, error)
              failed++
            }
          })
        )

        // Small delay between batches
        if (i + batchSize < cachedBarcodes.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      console.log(`✅ Full sync completed: ${synced} synced, ${failed} failed`)

      // Update last sync timestamp
      await this.updateLastSyncTime()

    } catch (error) {
      console.error('❌ Full sync failed:', error)
    }
  }

  // Perform incremental sync (recently accessed items)
  private async performIncrementalSync(): Promise<void> {
    if (!this.isOnline) {
      console.log('⚠️ Skipping incremental sync - device offline')
      return
    }

    try {
      const stats = await BarcodeService.getCacheStats()
      if (!stats || stats.totalEntries === 0) {
        return // No cache data to sync
      }

      console.log('🔄 Performing incremental cache sync...')

      // Get recently accessed barcodes
      const recentBarcodes = await this.getRecentlyAccessedBarcodes()

      if (recentBarcodes.length === 0) {
        console.log('📭 No recently accessed barcodes to sync')
        return
      }

      console.log(`📊 Syncing ${recentBarcodes.length} recently accessed barcodes`)

      let synced = 0
      let failed = 0

      await Promise.allSettled(
        recentBarcodes.map(async (barcode) => {
          try {
            await this.syncBarcode(barcode)
            synced++
          } catch (error) {
            console.warn(`⚠️ Failed to sync barcode ${barcode}:`, error)
            failed++
          }
        })
      )

      console.log(`✅ Incremental sync completed: ${synced} synced, ${failed} failed`)

      // Process any queued offline actions
      await this.processQueue()

    } catch (error) {
      console.error('❌ Incremental sync failed:', error)
    }
  }

  // Sync individual barcode with remote service
  private async syncBarcode(barcode: string): Promise<void> {
    if (this.pendingSyncs.has(barcode)) {
      return // Already syncing
    }

    this.pendingSyncs.add(barcode)

    try {
      // Get current cached data
      const isCached = await BarcodeService.isBarcodeCached(barcode as any)
      if (!isCached) {
        return // No longer cached
      }

      // In a real implementation, this would call a remote API
      // For now, we'll simulate API validation
      const mockApiResponse = await this.simulateApiLookup()

      if (mockApiResponse) {
        // Update cache with fresh data from API
        await BarcodeService.cacheProduct(
          barcode as any,
          mockApiResponse,
          'api'
        )
        console.log(`🔄 Synced barcode ${barcode} with API`)
      }

    } finally {
      this.pendingSyncs.delete(barcode)
    }
  }

  // Process offline queue (products upserts, etc.)
  async processQueue(): Promise<void> {
    if (!this.isOnline) return
    if (this.isProcessingQueue) return
    this.isProcessingQueue = true

    const actions = await dequeueAll()
    if (actions.length === 0) return

    console.log(`📤 Processing ${actions.length} queued offline actions`)

    let processed = 0
    let succeeded = 0
    let failed = 0

    const now = Date.now()
    for (const action of actions) {
      try {
        // Skip actions that have exceeded max retries
        if (action.retries >= 5) {
          console.warn(`⚠️ Skipping action ${action.id} - exceeded max retries (${action.retries})`)
          await removeById(action.id) // Remove permanently
          failed++
          continue
        }

        // Exponential backoff using nextAttemptAt (ms); if absent, compute from retries
        const nextAttemptAt = (action as any).nextAttemptAt as number | undefined
        if (nextAttemptAt && nextAttemptAt > now) {
          continue
        }

        // Use the original HTTP method when flushing queued actions
        await apiClient.request(action.method, action.endpoint, action.payload)
        await removeById(action.id)
        succeeded++
      } catch (e: any) {
        action.retries += 1
        action.lastError = e?.message || 'Unknown'
        // compute nextAttemptAt: 1m, 5m, 15m, 60m, 360m
        const delays = [60_000, 300_000, 900_000, 3_600_000, 21_600_000]
        const idx = Math.min(action.retries - 1, delays.length - 1)
        ;(action as any).nextAttemptAt = Date.now() + delays[idx]
        console.warn(`⚠️ Failed to process queued action ${action.id} (attempt ${action.retries}):`, e?.message)
        await update(action)
        failed++
      }
      processed++
    }

    console.log(`✅ Queue processing completed: ${succeeded} succeeded, ${failed} failed, ${processed} total`)
    this.isProcessingQueue = false
  }

  // Get recently accessed barcodes
  private async getRecentlyAccessedBarcodes(): Promise<string[]> {
    try {
      // This would require extending the cache service to support date queries
      // For now, return a sample of cached barcodes
      const allBarcodes = await BarcodeService.getCachedBarcodes()
      return allBarcodes.slice(0, Math.min(20, allBarcodes.length)) // Limit to 20
    } catch (error) {
      console.error('❌ Failed to get recently accessed barcodes:', error)
      return []
    }
  }

  // Simulate API lookup (replace with real API call)
  private async simulateApiLookup(): Promise<any | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200))

    // Simulate occasional API failures (10% failure rate)
    if (Math.random() < 0.1) {
      throw new Error('API temporarily unavailable')
    }

    // For demo purposes, return null (no API data available)
    // In a real implementation, this would call your barcode lookup API
    return null
  }

  // Update last sync timestamp
  private async updateLastSyncTime(): Promise<void> {
    try {
      // This would update a sync metadata store
      // For now, we'll just log it
      console.log(`📅 Last sync completed at ${new Date().toISOString()}`)
    } catch (error) {
      console.warn('⚠️ Failed to update sync timestamp:', error)
    }
  }

  // Force immediate sync
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline')
    }

    console.log('🔄 Force sync requested...')
    await this.performFullSync()
  }

  // Get sync status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.pendingSyncs.size > 0,
      pendingSyncs: this.pendingSyncs.size,
      nextSyncIn: this.syncInterval ? this.config.syncInterval : null
    }
  }

  // Cleanup and stop service
  destroy(): void {
    console.log('🛑 Destroying background sync service')

    this.stopPeriodicSync()

    window.removeEventListener('online', this.handleOnline.bind(this))
    window.removeEventListener('offline', this.handleOffline.bind(this))
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))

    this.pendingSyncs.clear()
  }
}

// Create and export singleton instance
const defaultConfig: BarcodeCacheConfig = {
  maxSize: 1000,
  ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
  syncInterval: 15 * 60 * 1000, // 15 minutes
  enableBackgroundSync: true,
  enableCompression: false
}

export const backgroundSync = new BackgroundSyncService(defaultConfig)

// Helper functions
export const initializeBackgroundSync = () => backgroundSync.initialize()
export const forceSync = () => backgroundSync.forceSync()
export const getSyncStatus = () => backgroundSync.getSyncStatus()
export const destroyBackgroundSync = () => backgroundSync.destroy()
