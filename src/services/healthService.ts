/**
 * Health Service - Simple server connectivity monitoring
 */

import { getApiBaseUrl } from './apiClient'

interface HealthStatus {
  isHealthy: boolean
  hasApi: boolean
}

/**
 * Check if server and database are available
 * Following requirements.md: surface failures immediately
 */
export const checkServerHealth = async (): Promise<HealthStatus> => {
  const baseUrl = getApiBaseUrl()
  
  if (!baseUrl) {
    return { isHealthy: false, hasApi: false }
  }

  try {
    const response = await fetch(`${baseUrl}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) {
      return { isHealthy: false, hasApi: true }
    }

    const data = await response.json()
    
    // If server provides dbOk field, use it
    if (data?.dbOk !== undefined) {
      return { isHealthy: !!data.dbOk, hasApi: true }
    }

    // Otherwise test database via products endpoint
    if (data?.ok) {
      const dbTest = await fetch(`${baseUrl}/api/products?limit=1`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(3000)
      })
      return { isHealthy: dbTest.ok, hasApi: true }
    }

    return { isHealthy: false, hasApi: true }
  } catch {
    return { isHealthy: false, hasApi: true }
  }
}