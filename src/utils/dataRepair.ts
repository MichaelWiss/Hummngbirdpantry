/**
 * Data Repair Utilities
 * Utility functions to fix data integrity issues, particularly
 * for items that might be missing required fields like status
 */

import type { PantryItem, ItemStatus } from '@/types'

/**
 * Repairs a pantry item by ensuring all required fields are present
 */
export function repairPantryItem(item: Partial<PantryItem>): PantryItem {
  const now = new Date()
  
  return {
    id: item.id || crypto.randomUUID() as any,
    name: item.name || 'Unknown Item',
    category: item.category || 'other',
    quantity: item.quantity || 1,
    unit: item.unit || 'pieces',
    purchaseDate: item.purchaseDate || now,
    lastModified: item.lastModified || now,
    status: item.status || 'fresh',
    tags: item.tags || [],
    ...(item.barcode && { barcode: item.barcode }),
    ...(item.brand && { brand: item.brand }),
    ...(item.notes && { notes: item.notes }),
    ...(item.price && { price: item.price }),
    ...(item.pricePerUnit && { pricePerUnit: item.pricePerUnit }),
    ...(item.expirationDate && { expirationDate: item.expirationDate }),
    ...(item.nutritionalInfo && { nutritionalInfo: item.nutritionalInfo }),
    ...(item.daysUntilExpiration && { daysUntilExpiration: item.daysUntilExpiration })
  } as PantryItem
}

/**
 * Repairs an array of pantry items
 */
export function repairPantryItems(items: Partial<PantryItem>[]): PantryItem[] {
  return items.map(repairPantryItem)
}

/**
 * Determines the appropriate status for an item based on expiration date
 */
export function calculateItemStatus(expirationDate?: Date): ItemStatus {
  if (!expirationDate) return 'fresh'
  
  const now = new Date()
  const diffTime = expirationDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'expired'
  if (diffDays <= 3) return 'expiring-soon'
  return 'fresh'
}

/**
 * Debug function to check for common data integrity issues
 */
export function diagnosePantryData(items: any[]): {
  totalItems: number
  missingStatus: number
  missingTags: number
  missingRequired: string[]
  issues: string[]
} {
  const issues: string[] = []
  let missingStatus = 0
  let missingTags = 0
  const missingRequired: string[] = []
  
  items.forEach((item, index) => {
    if (!item.status) {
      missingStatus++
      issues.push(`Item ${index}: missing status field`)
    }
    if (!item.tags) {
      missingTags++
      issues.push(`Item ${index}: missing tags array`)
    }
    if (!item.id) {
      missingRequired.push(`Item ${index}: missing id`)
    }
    if (!item.name) {
      missingRequired.push(`Item ${index}: missing name`)
    }
    if (!item.category) {
      missingRequired.push(`Item ${index}: missing category`)
    }
  })
  
  return {
    totalItems: items.length,
    missingStatus,
    missingTags,
    missingRequired,
    issues
  }
}