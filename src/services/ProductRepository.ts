import { initProductDB, listProducts, upsertProduct, getByBarcode, incrementQuantity, deleteProduct } from '@/services/product.service'
import { pantryApi } from '@/services/pantryApi.service'
import type { PantryItem, Barcode } from '@/types'
import { usePantryStore } from '@/stores/pantry.store'

class ProductRepositoryImpl {
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return
    await initProductDB()
    this.initialized = true
  }

  async hydrateFromLocal(): Promise<PantryItem[]> {
    await this.init()
    return await listProducts()
  }

  async fetchFromServer(): Promise<PantryItem[]> {
    console.log('🔄 Fetching all items from server...')
    const rows = await pantryApi.getAll()
    console.log(`✅ Fetched ${rows.length} items from server`)
    // Replace local mirror with server copy: clear missing locals
    const local = await listProducts()
    const serverIds = new Set(rows.map(r => r.id))
    // delete locals not on server
    for (const li of local) {
      if (!serverIds.has(li.id)) {
        try { await deleteProduct(li.id as any) } catch { /* ignore */ }
      }
    }
    // upsert all server items
    for (const item of rows) {
      await upsertProduct(item)
    }
    return rows
  }

  async upsert(item: Partial<PantryItem>): Promise<PantryItem> {
    await this.init()
    // Neon-first: write to server, reconcile from response
    const serverItem = await pantryApi.upsert(item)
    // persist confirmed row locally and reflect in UI
    const persisted = await upsertProduct(serverItem)
    usePantryStore.getState().actions.upsertLocal(persisted)
    return persisted
  }

  async update(id: string, updates: Partial<PantryItem>): Promise<void> {
    await this.init()
    // Neon-first: update on server, reconcile from response
    const serverItem = await pantryApi.update(id, updates)
    const persisted = await upsertProduct(serverItem)
    usePantryStore.getState().actions.upsertLocal(persisted)
  }

  async increment(barcode: Barcode, by: number = 1): Promise<PantryItem | null> {
    await this.init()
    // Neon-first: increment on server, reconcile from response
    const serverItem = await pantryApi.increment(barcode, by)
    if (!serverItem) return null
    const persisted = await upsertProduct(serverItem)
    usePantryStore.getState().actions.upsertLocal(persisted)
    return persisted
  }

  async remove(id: string): Promise<void> {
    await this.init()
    // Neon-first: delete on server first, then locally
    await pantryApi.remove(id)
    await deleteProduct(id as any)
    try { await usePantryStore.getState().actions.removeItem(id as any) } catch { /* ignore UI remove errors */ }
  }

  async getByBarcode(barcode: Barcode): Promise<PantryItem | null> {
    await this.init()
    return await getByBarcode(barcode)
  }
}

export const ProductRepository = new ProductRepositoryImpl()


