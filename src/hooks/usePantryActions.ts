// usePantryActions Hook - Write-only pantry operations
// Follows style.md principles: Single Responsibility, Clean separation of concerns

import { useCallback } from 'react'
import type { PantryItem, ID, ItemCategory, MeasurementUnit } from '@/types'

/**
 * Write-only hook for pantry operations
 * All writes go through ProductRepository (Neon-first)
 */
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

    const { ProductRepository } = await import('@/services/ProductRepository')
    return await ProductRepository.upsert({
      name: itemData.name.trim(),
      category: itemData.category,
      quantity: Math.max(1, Math.floor(itemData.quantity)),
      unit: itemData.unit,
      ...(itemData.barcode ? { barcode: itemData.barcode } : {}),
      ...(itemData.brand ? { brand: itemData.brand } : {}),
      ...(itemData.notes ? { notes: itemData.notes } : {}),
      purchaseDate: new Date(),
      status: 'fresh',
      tags: []
    } as any)
  }, [])

  // Update existing item
  const update = useCallback(async (id: ID, updates: Partial<PantryItem>) => {
    const { ProductRepository } = await import('@/services/ProductRepository')
    return await ProductRepository.update(id, updates)
  }, [])

  // Remove item
  const remove = useCallback(async (id: ID) => {
    const { ProductRepository } = await import('@/services/ProductRepository')
    return await ProductRepository.remove(id)
  }, [])

  // Increment item quantity
  const increment = useCallback(async (barcode: string, by: number = 1) => {
    const { ProductRepository } = await import('@/services/ProductRepository')
    return await ProductRepository.increment(barcode as any, by)
  }, [])

  // Bulk operations
  const bulkRemove = useCallback(async (ids: ID[]) => {
    if (ids.length === 0) return
    
    const { ProductRepository } = await import('@/services/ProductRepository')
    for (const id of ids) {
      await ProductRepository.remove(id)
    }
  }, [])

  return {
    // Core operations (all Neon-first)
    create,
    update,
    remove,
    increment,
    bulkRemove
  }
}
