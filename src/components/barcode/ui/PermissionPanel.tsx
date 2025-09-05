import React from 'react'
import { AlertCircle, Camera } from 'lucide-react'

interface PermissionPanelProps {
  instructions: string
  onRequest: () => void
  onClose: () => void
  onRefresh: () => void
}

export const PermissionPanel: React.FC<PermissionPanelProps> = ({ instructions, onRequest, onClose, onRefresh }) => (
  <div className="absolute inset-0 flex items-center justify-center p-8">
    <div className="text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h4 className="text-xl font-semibold text-neutral-900 mb-2">
        Camera Access Required
      </h4>
      <p className="text-neutral-600 mb-4 max-w-xs">
        Camera access is needed to scan barcodes. Please follow these steps:
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-xs">
        <p className="text-blue-800 text-sm font-medium">
          {instructions}
        </p>
      </div>
      <div className="space-y-3">
        <button
          onClick={onRequest}
          className="w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <Camera size={18} />
          <span>Try Again</span>
        </button>
        <button
          onClick={onRefresh}
          className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-3 rounded-lg font-medium transition-colors"
        >
          Check Permission Status
        </button>
        <button
          onClick={onClose}
          className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-3 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)

export default PermissionPanel
