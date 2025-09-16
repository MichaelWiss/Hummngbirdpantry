/**
 * App Initialization Hook - Clean server-first data loading
 * Following requirements.md: Neon as source of truth
 */

import { useEffect } from 'react'

export const useAppInitialization = (): void => {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Import services dynamically to avoid circular dependencies
        const { ProductRepository } = await import('@/services/ProductRepository')
        const { usePantryStore } = await import('@/stores/pantry.store')
        const { getApiBaseUrl } = await import('@/services/apiClient')

        // Initialize repository
        await ProductRepository.init()
        
        const baseUrl = getApiBaseUrl()
        if (baseUrl) {
          try {
            // Load from server first (authoritative)
            const serverItems = await ProductRepository.fetchFromServer()
            usePantryStore.getState().actions.replaceAll(serverItems)
          } catch {
            // Fallback to local storage
            const localItems = await ProductRepository.hydrateFromLocal()
            usePantryStore.getState().actions.replaceAll(localItems)
          }
        } else {
          // No server configured, use local only
          const localItems = await ProductRepository.hydrateFromLocal()
          usePantryStore.getState().actions.replaceAll(localItems)
        }
      } catch (error) {
        console.error('App initialization failed:', error)
      }
    }

    initializeApp()
  }, [])
}