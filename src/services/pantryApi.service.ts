import { apiClient } from '@/services/apiClient'
import type { PantryItem, Barcode, ItemCategory, MeasurementUnit } from '@/types'

// Server <-> Client mappers
interface ServerProduct {
  id: string
  name: string
  brand?: string | null
  category: string
  quantity: number
  unit: string
  barcode?: string | null
  purchase_date?: string
  last_modified?: string
  notes?: string | null
}

const toClient = (row: ServerProduct): PantryItem => {
  return {
    id: row.id as any,
    name: row.name,
    ...(row.brand ? { brand: row.brand } : {}),
    category: (row.category as ItemCategory) ?? 'other',
    quantity: row.quantity ?? 0,
    unit: (row.unit as MeasurementUnit) ?? 'pieces',
    ...(row.barcode ? { barcode: row.barcode as Barcode } : {}),
    purchaseDate: row.purchase_date ? new Date(row.purchase_date) : new Date(),
    lastModified: row.last_modified ? new Date(row.last_modified) : new Date(),
    ...(row.notes ? { notes: row.notes } : {}),
    status: 'fresh',
    tags: []
  }
}

const toServer = (item: Partial<PantryItem>) => ({
  ...(item.id ? { id: item.id } : {}),
  ...(item.name ? { name: item.name } : {}),
  ...(item.brand ? { brand: item.brand } : {}),
  ...(item.category ? { category: item.category } : {}),
  ...(typeof item.quantity === 'number' ? { quantity: item.quantity } : {}),
  ...(item.unit ? { unit: item.unit } : {}),
  ...(item.barcode ? { barcode: item.barcode } : {}),
  ...(item.notes ? { notes: item.notes } : {})
})

export const pantryApi = {
  async getAll(): Promise<PantryItem[]> {
    const rows = await apiClient.get<ServerProduct[]>('/api/products')
    return (rows || []).map(toClient)
  },

  async upsert(partial: Partial<PantryItem>): Promise<PantryItem> {
    const payload = toServer(partial)
    const data = await apiClient.post('/api/products', payload)
    return toClient(data as ServerProduct)
  },

  async increment(barcode: Barcode, by: number = 1): Promise<PantryItem | null> {
    const row = await apiClient.patch(`/api/products/${barcode}/increment`, { by })
    return row ? toClient(row as ServerProduct) : null
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/api/products/${id}`)
  },

  async update(id: string, updates: Partial<PantryItem>): Promise<PantryItem> {
    const payload = toServer(updates)
    const data = await apiClient.put(`/api/products/${id}`, payload)
    return toClient(data as ServerProduct)
  }
}


