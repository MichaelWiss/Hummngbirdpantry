// Cache Demo Page - Interactive demonstration of offline barcode caching
// Following project CSS guidelines with CSS modules and BEM methodology

import React, { useState, useEffect } from 'react'
import { useBarcodeCache } from '@/hooks/useBarcodeCache'
import { BarcodeService } from '@/services/barcode.service'
import type { Barcode } from '@/types'
import {
  Database,
  Zap,
  Wifi,
  WifiOff,
  RefreshCw,
  Scan,
  BarChart3,
  Target,
  AlertCircle
} from 'lucide-react'

import styles from './CacheDemoPage.module.css'

// Simple demo component following project guidelines
const CacheDemoPage: React.FC = () => {
  const cache = useBarcodeCache()
  const [testBarcode, setTestBarcode] = useState('')
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  // Simulate offline mode
  useEffect(() => {
    if (isOfflineMode) {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
    } else {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
    }
  }, [isOfflineMode])

  // Handle barcode testing
  const handleTestLookup = async () => {
    if (!testBarcode.trim()) return
    try {
      await BarcodeService.lookupProductDetailed(testBarcode.trim() as Barcode)
    } catch (error) {
      console.error('Lookup test failed:', error)
    }
  }

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Database className={`${styles.headerIcon} ${styles.headerIconPrimary}`} />
          <h1 className={styles.headerTitle}>Cache Demo</h1>
        </div>
        <p className={styles.headerSubtitle}>
          Interactive demonstration of offline barcode caching technology.
          Experience instant lookups, offline functionality, and intelligent data management.
        </p>
      </div>

      {/* Cache Status Overview */}
      <div className={styles.statsGrid}>
        <div className={styles.statsCard}>
          <div className={styles.statsCardHeader}>
            <Database className={`${styles.statsCardIcon} ${styles.statsCardIconBlue}`} />
            <h3 className={styles.statsCardTitle}>Cache Entries</h3>
          </div>
          <div className={styles.statsCardValue}>
            {cache.stats?.totalEntries || 0}
          </div>
          <div className={styles.statsCardLabel}>Total cached items</div>
        </div>

        <div className={styles.statsCard}>
          <div className={styles.statsCardHeader}>
            <Zap className={`${styles.statsCardIcon} ${styles.statsCardIconYellow}`} />
            <h3 className={styles.statsCardTitle}>Hit Rate</h3>
          </div>
          <div className={styles.statsCardValue}>
            {cache.cacheHitRate}
          </div>
          <div className={styles.statsCardLabel}>Cache efficiency</div>
        </div>

        <div className={styles.statsCard}>
          <div className={styles.statsCardHeader}>
            <BarChart3 className={`${styles.statsCardIcon} ${styles.statsCardIconGreen}`} />
            <h3 className={styles.statsCardTitle}>Cache Size</h3>
          </div>
          <div className={styles.statsCardValue}>
            {cache.cacheSizeFormatted}
          </div>
          <div className={styles.statsCardLabel}>Storage used</div>
        </div>

        <div className={styles.statsCard}>
          <div className={styles.statsCardHeader}>
            <Target className={`${styles.statsCardIcon} ${styles.statsCardIconPurple}`} />
            <h3 className={styles.statsCardTitle}>Health Status</h3>
          </div>
          <div className={`${styles.healthIndicator} ${styles.healthIndicatorHealthy}`}>
            {cache.cacheHealth}
          </div>
          <div className={styles.statsCardLabel}>System status</div>
        </div>
      </div>

      {/* Interactive Testing Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Scan className={styles.cardIcon} />
          <h2 className={styles.cardTitle}>Interactive Testing</h2>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Test Barcode Lookup</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={testBarcode}
              onChange={(e) => setTestBarcode(e.target.value)}
              placeholder="Enter barcode (e.g., 123456789012)"
              className={styles.formInput}
              onKeyPress={(e) => e.key === 'Enter' && handleTestLookup()}
              style={{ flex: 1 }}
            />
            <button
              onClick={handleTestLookup}
              disabled={!testBarcode.trim()}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              Test
            </button>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={isOfflineMode}
              onChange={(e) => setIsOfflineMode(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              Simulate offline mode
              {isOfflineMode ? (
                <WifiOff style={{ width: '1rem', height: '1rem', display: 'inline', marginLeft: '0.5rem' }} />
              ) : (
                <Wifi style={{ width: '1rem', height: '1rem', display: 'inline', marginLeft: '0.5rem' }} />
              )}
            </span>
          </label>
        </div>

        <div className={styles.buttonGrid}>
          <button
            onClick={() => cache.clearCache()}
            className={`${styles.button} ${styles.buttonDanger}`}
          >
            Clear Cache
          </button>
          <button
            onClick={() => cache.refreshStats()}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            Refresh Stats
          </button>
        </div>
      </div>

      {/* Educational Content */}
      <div className={styles.educational}>
        <h2 className={styles.educationalTitle}>How Caching Works</h2>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <Zap className={`${styles.featureIcon} ${styles.featureIconInstant}`} />
            <h3 className={styles.featureTitle}>Instant Lookups</h3>
            <p className={styles.featureDescription}>
              Previously scanned barcodes load instantly from browser storage,
              providing sub-10ms response times.
            </p>
          </div>

          <div className={styles.featureCard}>
            <WifiOff className={`${styles.featureIcon} ${styles.featureIconOffline}`} />
            <h3 className={styles.featureTitle}>Offline Ready</h3>
            <p className={styles.featureDescription}>
              Cached products remain accessible even without internet connection,
              ensuring continuous functionality.
            </p>
          </div>

          <div className={styles.featureCard}>
            <RefreshCw className={`${styles.featureIcon} ${styles.featureIconSync}`} />
            <h3 className={styles.featureTitle}>Auto Sync</h3>
            <p className={styles.featureDescription}>
              Background synchronization keeps cached data fresh when online,
              maintaining data accuracy.
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {cache.hasError && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <AlertCircle className={styles.alertIcon} />
          <div className={styles.alertContent}>
            <div className={styles.alertTitle}>Cache Error</div>
            <div className={styles.alertText}>{cache.error}</div>
            <button
              onClick={() => cache.clearError()}
              className={styles.alertAction}
            >
              Dismiss Error
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CacheDemoPage
