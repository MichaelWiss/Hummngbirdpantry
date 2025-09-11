import { openDatabase, tx, type DBHandle } from '@/services/db/indexeddb'
import type { PantryItem, Barcode, ID, ItemCategory, MeasurementUnit } from '@/types'

const DB_NAME = 'HummingbirdPantry'
const DB_VERSION = 1
const PRODUCTS_STORE = 'products'

let dbHandle: DBHandle | null = null

export const initProductDB = async () => {
  if (dbHandle) return dbHandle
  dbHandle = await openDatabase({
    dbName: DB_NAME,
    version: DB_VERSION,
    stores: [
      {
        name: PRODUCTS_STORE,
        keyPath: 'id',
        indexes: [
          { name: 'barcode', keyPath: 'barcode', options: { unique: true } }
        ]
      }
    ]
  })
  return dbHandle
}

const uuid = (): ID => (crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`) as ID

export const getByBarcode = async (barcode: Barcode): Promise<PantryItem | null> => {
  const handle = await initProductDB()
  if (handle.mode === 'memory') {
    const store = handle.memory.get(PRODUCTS_STORE)!
    for (const v of store.values()) if (v.barcode === barcode) return v
    return null
  }
  return tx(handle, PRODUCTS_STORE, 'readonly', (store) => {
    return new Promise<PantryItem | null>((resolve) => {
      const idx = store.index('barcode')
      const req = idx.get(barcode)
      req.onsuccess = () => resolve((req as any).result || null)
      req.onerror = () => resolve(null)
    })
  })
}

export const upsertProduct = async (partial: Partial<PantryItem> & {
  name: string
  category: ItemCategory
  quantity: number
  unit: MeasurementUnit
  barcode?: Barcode
}): Promise<PantryItem> => {
  const handle = await initProductDB()
  const now = new Date()
  const item: PantryItem = {
    id: (partial.id as ID) || uuid(),
    name: partial.name,
    category: partial.category,
    barcode: partial.barcode,
    quantity: partial.quantity,
    unit: partial.unit,
    purchaseDate: partial.purchaseDate || now,
    expirationDate: partial.expirationDate,
    price: partial.price,
    pricePerUnit: partial.pricePerUnit,
    brand: partial.brand,
    notes: partial.notes || '',
    tags: partial.tags || [],
    nutritionalInfo: partial.nutritionalInfo,
    status: partial.status || 'fresh',
    daysUntilExpiration: partial.daysUntilExpiration,
    lastModified: now
  }

  await tx(handle, PRODUCTS_STORE, 'readwrite', (store) => {
    store.put(item)
    return true
  })

  return item
}

export const listProducts = async (): Promise<PantryItem[]> => {
  const handle = await initProductDB()
  if (handle.mode === 'memory') {
    return Array.from(handle.memory.get(PRODUCTS_STORE)!.values())
  }
  return tx(handle, PRODUCTS_STORE, 'readonly', (store) => {
    return new Promise<PantryItem[]>((resolve) => {
      const req = store.getAll()
      req.onsuccess = () => resolve((req as any).result || [])
      req.onerror = () => resolve([])
    })
  })
}

export const deleteProduct = async (id: ID): Promise<void> => {
  const handle = await initProductDB()
  await tx(handle, PRODUCTS_STORE, 'readwrite', (store) => {
    store.delete(id)
    return true
  })
}

export const incrementQuantity = async (barcode: Barcode, by: number = 1): Promise<PantryItem | null> => {
  const existing = await getByBarcode(barcode)
  if (!existing) return null
  const updated = { ...existing, quantity: Math.max(0, (existing.quantity || 0) + by), lastModified: new Date() }
  await upsertProduct(updated)
  return updated
}


