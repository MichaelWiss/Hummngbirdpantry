import React from 'react'
import { AlertCircle } from 'lucide-react'

interface InsecureContextBannerProps {
  onDismiss: () => void
}

export const InsecureContextBanner: React.FC<InsecureContextBannerProps> = ({ onDismiss }) => (
  <div className="absolute inset-0 flex items-center justify-center p-6 bg-neutral-900/80">
    <div className="text-center max-w-xs">
      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-yellow-600" />
      </div>
      <h4 className="text-lg font-semibold text-neutral-50 mb-2">Secure Connection Needed</h4>
      <p className="text-neutral-200 text-sm mb-4">Camera access requires HTTPS (or localhost). Restart dev with: <span className="font-mono">VITE_USE_HTTPS=1 npm run dev</span></p>
      <p className="text-neutral-300 text-xs mb-4">Then open the https:// version of this page on this device.</p>
      <button onClick={onDismiss} className="w-full bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg text-sm">Dismiss</button>
    </div>
  </div>
)

export default InsecureContextBanner
