import { initProductDB, listProducts, upsertProduct, getByBarcode, incrementQuantity, deleteProduct } from '@/services/product.service'
import { pantryApi } from '@/services/pantryApi.service'
import { enqueue } from '@/services/offlineQueue.service'
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
    // Replace local mirror with server copy (simple approach)
    // For each server item, upsert locally
    for (const item of rows) {
      await upsertProduct(item)
    }
    return rows
  }

  async upsert(item: Partial<PantryItem>): Promise<PantryItem> {
    await this.init()
    // 1) optimistic local write
    const local = await upsertProduct(item as any)
    // reflect in UI immediately
    usePantryStore.getState().actions.upsertLocal(local)
    // 2) enqueue server write; on success the next fetch will reconcile
    try {
      console.log('🔄 Attempting server upsert for:', local.name)
      await pantryApi.upsert(local)
      console.log('✅ Server upsert successful for:', local.name)
    } catch (e: any) {
      console.error('❌ Server upsert failed, enqueueing:', e.message)
      await enqueue({ method: 'POST', endpoint: '/api/products', payload: local })
    }
    return local
  }

  async update(id: string, updates: Partial<PantryItem>): Promise<void> {
    await this.init()
    // optimistic local update
    try {
      await usePantryStore.getState().actions.updateItem(id as any, updates)
    } catch {/* ignore local update errors */}
    // server update or enqueue
    try {
      console.log('🔄 Attempting server update for:', id)
      await pantryApi.update(id, updates)
      console.log('✅ Server update successful for:', id)
    } catch (e: any) {
      console.error('❌ Server update failed, enqueueing:', e.message)
      await enqueue({ method: 'PUT', endpoint: `/api/products/${id}`, payload: updates })
    }
  }

  async increment(barcode: Barcode, by: number = 1): Promise<PantryItem | null> {
    await this.init()
    // 1) optimistic local
    const updated = await incrementQuantity(barcode, by)
    if (!updated) return null
    // reflect in UI immediately
    usePantryStore.getState().actions.upsertLocal(updated)
    // 2) enqueue server increment
    try {
      console.log('🔄 Attempting server increment for:', barcode)
      await pantryApi.increment(barcode, by)
      console.log('✅ Server increment successful for:', barcode)
    } catch (e: any) {
      console.error('❌ Server increment failed, enqueueing:', e.message)
      await enqueue({ method: 'PATCH', endpoint: `/api/products/${barcode}/increment`, payload: { by } })
    }
    return updated
  }

  async remove(id: string): Promise<void> {
    await this.init()
    await deleteProduct(id as any)
    try {
      console.log('🔄 Attempting server removal for:', id)
      await pantryApi.remove(id)
      console.log('✅ Server removal successful for:', id)
    } catch (e: any) {
      console.error('❌ Server removal failed, enqueueing:', e.message)
      await enqueue({ method: 'DELETE', endpoint: `/api/products/${id}`, payload: {} })
    }
  }

  async getByBarcode(barcode: Barcode): Promise<PantryItem | null> {
    await this.init()
    return await getByBarcode(barcode)
  }
}

export const ProductRepository = new ProductRepositoryImpl()


