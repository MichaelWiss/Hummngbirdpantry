// Camera and barcode-related type definitions
import type { 
  Barcode,
  PermissionState
} from './core'
import type { PantryItem } from './pantry'

// ============================================================================
// BARCODE CACHE TYPES
// ============================================================================

// Cache entry structure for offline storage
export interface BarcodeCacheEntry {
  barcode: Barcode
  productData: Partial<PantryItem>
  timestamp: Date
  lastAccessed: Date
  accessCount: number
  source: 'api' | 'manual' | 'mock'
  ttl?: Date // Time to live for cache expiration
}

// Cache metadata and statistics
export interface BarcodeCacheStats {
  totalEntries: number
  lastSync: Date | null
  cacheSize: number // Approximate size in bytes
  hitRate: number // Cache hit percentage
  avgLookupTime: number // Average lookup time in ms
}

// Cache configuration
export interface BarcodeCacheConfig {
  maxSize: number // Maximum cache entries
  ttl: number // Default TTL in milliseconds
  syncInterval: number // Background sync interval in ms
  enableBackgroundSync: boolean
  enableCompression: boolean
}

// Cache operation results
export interface CacheLookupResult {
  found: boolean
  data: Partial<PantryItem> | null
  source: 'cache' | 'api' | 'mock' | 'none'
  timestamp: Date
  cached: boolean
}

// ============================================================================
// CAMERA AND BARCODE TYPES
// ============================================================================

// Camera modes for different use cases
export type CameraMode = 'barcode' | 'photo' | 'receipt'

// Camera constraints for different modes
export interface CameraConstraints {
  video: {
    facingMode: 'user' | 'environment'
    width: { ideal: number; min?: number; max?: number }
    height: { ideal: number; min?: number; max?: number }
  }
  audio?: boolean
}

// Barcode scan result
export interface BarcodeResult {
  format: string
  text: string
  timestamp: Date
  confidence?: number
}

// Photo capture result
export interface PhotoResult {
  dataUrl: string
  blob: Blob
  timestamp: Date
  metadata?: {
    width: number
    height: number
    camera: string
  }
}

// ============================================================================
// CAMERA HOOK TYPES
// ============================================================================

export interface UseCameraReturn {
  isActive: boolean
  mode: CameraMode
  startCamera: (mode?: CameraMode) => Promise<void>
  stopCamera: () => void
  capturePhoto: () => Promise<PhotoResult>
  scanBarcode: () => Promise<BarcodeResult>
  error?: string
  supported: boolean
  permissions: {
    camera: PermissionState
    microphone: PermissionState
  }
}