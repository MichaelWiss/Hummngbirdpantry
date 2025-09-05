import React from 'react'
import { Scan } from 'lucide-react'

interface ReadyPanelProps {
  hasPermission: boolean | null
  onStart: () => void
}

export const ReadyPanel: React.FC<ReadyPanelProps> = ({ hasPermission, onStart }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="text-center">
      <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Scan className="w-10 h-10 text-primary-600" />
      </div>
      <h4 className="text-lg font-semibold text-neutral-900 mb-2">
        Ready to Scan
      </h4>
      <p className="text-neutral-600 mb-6 max-w-xs">
        {hasPermission === true ? 'Point your camera at a barcode to get started' : 'Grant camera access to begin scanning'}
      </p>
      <button
        onClick={onStart}
        className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-full font-medium text-lg shadow-lg transition-all hover:shadow-xl transform hover:scale-105"
      >
        {hasPermission === true ? 'Start Scanning' : 'Enable Camera'}
      </button>
    </div>
  </div>
)

export default ReadyPanel
