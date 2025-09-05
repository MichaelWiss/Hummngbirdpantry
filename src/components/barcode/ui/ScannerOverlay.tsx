import React from 'react'

interface ScannerOverlayProps {
  isScanning: boolean
  isInitializing: boolean
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({ isScanning, isInitializing }) => {
  if (!isScanning) return null
  return (
    <div className="absolute inset-0 pointer-events-none" data-testid="scanner-overlay">
      <div className="absolute inset-8 rounded-lg overflow-hidden">
        {/* Single border layer (previous inner focus frame removed to avoid double-border illusion) */}
        <div className="absolute inset-0 border-2 border-primary-500 rounded-lg" />
        {/* Animated scan bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-primary-500 animate-pulse rounded-t" />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          {isInitializing ? 'Initializing...' : 'Scanning...'}
        </div>
      </div>
    </div>
  )
}

export default ScannerOverlay
