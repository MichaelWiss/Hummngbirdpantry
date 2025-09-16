/**
 * useModalManager - Custom hook for modal state management
 * Following style.md: single responsibility, reusable hook pattern
 */

import { useState, useCallback } from 'react'
import type { ItemCategory, MeasurementUnit, Barcode } from '@/types'

export interface AddItemData {
  name?: string
  category?: ItemCategory
  quantity?: number
  unit?: MeasurementUnit
  barcode?: Barcode | ''
  notes?: string
}

/**
 * Generic modal management hook following style.md patterns
 */
export function useModalManager() {
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [addItemData, setAddItemData] = useState<AddItemData | undefined>()

  const openAddItemModal = useCallback((data?: AddItemData) => {
    setAddItemData(data)
    setShowAddItemModal(true)
  }, [])

  const closeAddItemModal = useCallback(() => {
    setShowAddItemModal(false)
    setAddItemData(undefined)
  }, [])

  return {
    showAddItemModal,
    addItemData,
    openAddItemModal,
    closeAddItemModal
  }
}