import React from 'react'

interface ScannerOverlayProps {
  isScanning: boolean
  isInitializing: boolean
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({ isScanning, isInitializing }) => {
  if (!isScanning) return null
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-8 border-2 border-primary-500 rounded-lg">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-48 h-32 border-2 border-white rounded-lg opacity-50" />
        </div>
      </div>
      <div className="absolute inset-8 border-2 border-transparent rounded-lg">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary-500 animate-pulse rounded-t-lg" />
      </div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          {isInitializing ? 'Initializing...' : 'Scanning...'}
        </div>
      </div>
    </div>
  )
}

export default ScannerOverlay
