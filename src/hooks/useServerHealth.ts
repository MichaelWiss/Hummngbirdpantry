/**
 * useServerHealth - Custom hook for server health monitoring
 * Following style.md: single responsibility, async error handling
 */

import { useState, useEffect } from 'react'
import { checkServerHealth } from '@/services'

/**
 * Hook for monitoring server connectivity
 * Follows style.md pattern: handle async errors gracefully
 */
export function useServerHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  useEffect(() => {
    let mounted = true

    const checkHealth = async () => {
      try {
        const health = await checkServerHealth()
        if (mounted) {
          setIsHealthy(health.isHealthy)
          setLastCheck(new Date())
        }
      } catch (error) {
        if (mounted) {
          setIsHealthy(false)
          setLastCheck(new Date())
        }
        console.error('Health check failed:', error)
      }
    }

    checkHealth()

    return () => {
      mounted = false
    }
  }, [])

  return {
    isHealthy,
    lastCheck,
    isUnknown: isHealthy === null
  }
}