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
    brand: row.brand ?? undefined,
    category: (row.category as ItemCategory) ?? 'other',
    quantity: row.quantity ?? 0,
    unit: (row.unit as MeasurementUnit) ?? 'pieces',
    barcode: (row.barcode || undefined) as Barcode | undefined,
    purchaseDate: row.purchase_date ? new Date(row.purchase_date) : new Date(),
    lastModified: row.last_modified ? new Date(row.last_modified) : new Date(),
    notes: row.notes ?? undefined,
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
    const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
    if (!base) return []
    const res = await fetch(new URL('/api/products', base).toString(), { method: 'GET' })
    if (!res.ok) throw new Error(`GET /api/products failed: ${res.status}`)
    const rows = (await res.json()) as ServerProduct[]
    return rows.map(toClient)
  },

  async upsert(partial: Partial<PantryItem>): Promise<PantryItem> {
    const payload = toServer(partial)
    const data = await apiClient.post('/api/products', payload)
    return toClient(data as ServerProduct)
  },

  async increment(barcode: Barcode, by: number = 1): Promise<PantryItem | null> {
    const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
    if (!base) return null
    const res = await fetch(new URL(`/api/products/${barcode}/increment`, base).toString(), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ by })
    })
    if (!res.ok) throw new Error(`PATCH /api/products/:barcode/increment failed: ${res.status}`)
    const row = (await res.json()) as ServerProduct
    return toClient(row)
  },

  async remove(id: string): Promise<void> {
    const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
    if (!base) return
    const res = await fetch(new URL(`/api/products/${id}`, base).toString(), { method: 'DELETE' })
    if (!res.ok) throw new Error(`DELETE /api/products/:id failed: ${res.status}`)
  }
}


