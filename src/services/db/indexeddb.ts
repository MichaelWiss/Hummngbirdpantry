// Minimal IndexedDB helper for HummingbirdPantry
// Provides a typed, resilient wrapper with graceful in-memory fallback

export type StoreSchema = {
  name: string
  keyPath: string
  indexes?: Array<{ name: string; keyPath: string | string[]; options?: IDBIndexParameters }>
}

export interface OpenOptions {
  dbName: string
  version: number
  stores: StoreSchema[]
}

export interface DBHandle {
  mode: 'indexeddb' | 'memory'
  db?: IDBDatabase | null
  memory: Map<string, Map<any, any>>
}

export const openDatabase = async (options: OpenOptions): Promise<DBHandle> => {
  const handle: DBHandle = { mode: 'indexeddb', db: null, memory: new Map() }

  const secure = typeof window !== 'undefined' && window.isSecureContext
  const idbAvailable = typeof indexedDB !== 'undefined'
  if (!secure || !idbAvailable) {
    handle.mode = 'memory'
    for (const s of options.stores) {
      handle.memory.set(s.name, new Map())
    }
    return handle
  }

  return new Promise<DBHandle>((resolve) => {
    let request: IDBOpenDBRequest
    try {
      request = indexedDB.open(options.dbName, options.version)
    } catch {
      handle.mode = 'memory'
      for (const s of options.stores) handle.memory.set(s.name, new Map())
      resolve(handle)
      return
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      for (const store of options.stores) {
        if (!db.objectStoreNames.contains(store.name)) {
          const os = db.createObjectStore(store.name, { keyPath: store.keyPath })
          for (const idx of store.indexes || []) {
            os.createIndex(idx.name, idx.keyPath, idx.options || { unique: false })
          }
        }
      }
    }

    request.onsuccess = () => {
      handle.db = request.result
      resolve(handle)
    }

    request.onerror = () => {
      handle.mode = 'memory'
      for (const s of options.stores) handle.memory.set(s.name, new Map())
      resolve(handle)
    }
  })
}

export const tx = <T = unknown>(
  handle: DBHandle,
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => T
): Promise<T> => {
  if (handle.mode === 'memory') {
    // For memory mode, emulate basic put/get/getAll/getByIndex/delete
    const store = handle.memory.get(storeName) as Map<any, any>
    const memStore = {
      put: (value: any) => {
        const keyPath = 'id' in value ? 'id' : Object.keys(value)[0]
        store.set(value[keyPath], value)
        return { onsuccess: null as any, onerror: null as any }
      },
      get: (key: any) => ({ result: store.get(key), onsuccess: null as any, onerror: null as any }),
      getAll: () => ({ result: Array.from(store.values()), onsuccess: null as any, onerror: null as any }),
      delete: (key: any) => { store.delete(key); return { onsuccess: null as any, onerror: null as any } },
      index: (_: string) => ({
        get: (key: any) => ({ result: Array.from(store.values()).find((v: any) => v.barcode === key), onsuccess: null as any, onerror: null as any })
      })
    } as unknown as IDBObjectStore
    return Promise.resolve(run(memStore))
  }

  return new Promise<T>((resolve, reject) => {
    if (!handle.db) return reject(new Error('DB not open'))
    const transaction = handle.db.transaction([storeName], mode)
    const store = transaction.objectStore(storeName)
    try {
      const result = run(store)
      transaction.oncomplete = () => resolve(result)
      transaction.onerror = () => reject(transaction.error)
    } catch (e) {
      reject(e as any)
    }
  })
}


