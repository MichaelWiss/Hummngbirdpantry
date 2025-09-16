/**
 * ServerStatusBanner - Single responsibility component for server status
 * Following style.md: functional component with single purpose
 */

import React from 'react'

interface ServerStatusBannerProps {
  isHealthy: boolean | null
}

/**
 * Server status banner component
 * Follows style.md: each component should have one clear purpose
 */
export const ServerStatusBanner = React.memo<ServerStatusBannerProps>(({ isHealthy }) => {
  // Only show banner when server is unhealthy
  if (isHealthy !== false) return null

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-3">
      <div className="text-red-800 text-sm text-center">
        ⚠️ Server unreachable - data may not sync across devices
      </div>
    </div>
  )
})

ServerStatusBanner.displayName = 'ServerStatusBanner'