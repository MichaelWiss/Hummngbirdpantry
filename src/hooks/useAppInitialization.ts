/**
 * App Initialization Hook - Clean server-first data loading
 * Following requirements.md: Neon as source of truth
 * Following style.md: single responsibility, clean error handling
 */

import { useEffect } from 'react'
import { apiService } from '@/services/api.service'
import { usePantryStore } from '@/stores/pantry.store'

export const useAppInitialization = (): void => {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Server-first loading
        const result = await apiService.getAllItems()
        
        if (result.data) {
          // Success: use server data as source of truth
          usePantryStore.getState().actions.replaceAll(result.data)
        } else {
          // Server failed: surface error immediately (requirements.md compliance)
          console.warn('Failed to load from server:', result.error)
          // Initialize with empty state rather than masking the error
          usePantryStore.getState().actions.replaceAll([])
        }
      } catch (error) {
        console.error('App initialization failed:', error)
        // Initialize with empty state
        usePantryStore.getState().actions.replaceAll([])
      }
    }

    initializeApp()
  }, [])
}