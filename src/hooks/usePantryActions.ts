/**
 * usePantryActions - Clean implementation
 * Following style.md: single responsibility, clean error handling
 * Following requirements.md: Neon-first with immediate error surfacing
 */

import { useCallback } from 'react'
import { apiService } from '@/services/api.service'
import { usePantryStore } from '@/stores/pantry.store'
import type { PantryItem, ID, ItemCategory, MeasurementUnit, Barcode } from '@/types'

export const usePantryActions = () => {
  // Create item with validation
  const create = useCallback(async (itemData: {
    name: string
    category: ItemCategory
    quantity: number
    unit: MeasurementUnit
    barcode?: string
    brand?: string
    notes?: string
  }) => {
    // Basic validation
    if (!itemData.name.trim()) {
      throw new Error('Item name is required')
    }
    if (itemData.quantity <= 0) {
      throw new Error('Quantity must be greater than 0')
    }

    // Build the item data with proper optional field handling
    const itemToCreate: Omit<PantryItem, 'id' | 'created_at' | 'updated_at'> = {
      name: itemData.name.trim(),
      category: itemData.category,
      quantity: Math.max(1, Math.floor(itemData.quantity)),
      unit: itemData.unit,
      purchaseDate: new Date(),
      lastModified: new Date(),
      status: 'fresh',
      tags: [],
      ...(itemData.barcode && { barcode: itemData.barcode as Barcode }),
      ...(itemData.brand && { brand: itemData.brand }),
      ...(itemData.notes && { notes: itemData.notes })
    }

    const result = await apiService.createItem(itemToCreate)

    if (result.error) {
      throw new Error(result.error)
    }

    // Update store with new item
    if (result.data) {
      usePantryStore.getState().actions.upsertLocal(result.data)
    }

    return result.data
  }, [])

  // Update existing item
  const update = useCallback(async (id: ID, updates: Partial<PantryItem>) => {
    const result = await apiService.updateItem(id, updates)
    
    if (result.error) {
      throw new Error(result.error)
    }

    // Update store with updated item
    if (result.data) {
      usePantryStore.getState().actions.upsertLocal(result.data)
    }

    return result.data
  }, [])

  // Remove item
  const remove = useCallback(async (id: ID) => {
    const result = await apiService.deleteItem(id)
    
    if (result.error) {
      throw new Error(result.error)
    }

    // Remove from store
    try {
      usePantryStore.getState().actions.removeLocal(id)
    } catch {
      // Ignore UI remove errors
    }
  }, [])

  // Increment item quantity
  const increment = useCallback(async (barcode: string, by: number = 1) => {
    const result = await apiService.incrementItem(barcode as Barcode, by)
    
    if (result.error) {
      throw new Error(result.error)
    }

    // Update store with incremented item
    if (result.data) {
      usePantryStore.getState().actions.upsertLocal(result.data)
    }

    return result.data
  }, [])

  // Bulk remove operations
  const bulkRemove = useCallback(async (ids: ID[]) => {
    if (ids.length === 0) return

    const errors: string[] = []
    
    for (const id of ids) {
      try {
        await remove(id)
      } catch (error) {
        errors.push(`Failed to remove ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (errors.length > 0) {
      throw new Error(`Bulk removal completed with errors: ${errors.join('; ')}`)
    }
  }, [remove])

  return {
    create,
    update,
    remove,
    increment,
    bulkRemove
  }
}