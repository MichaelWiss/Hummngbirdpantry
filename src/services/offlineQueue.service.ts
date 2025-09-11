import { openDatabase, tx, type DBHandle } from '@/services/db/indexeddb'

export interface OfflineAction {
  id: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  endpoint: string
  payload: any
  createdAt: number
  retries: number
  lastError?: string
}

const DB_NAME = 'HummingbirdPantry'
const DB_VERSION = 1
const QUEUE_STORE = 'offlineQueue'

let dbHandle: DBHandle | null = null

export const initOfflineQueue = async () => {
  if (dbHandle) return dbHandle
  dbHandle = await openDatabase({
    dbName: DB_NAME,
    version: DB_VERSION,
    stores: [
      {
        name: QUEUE_STORE,
        keyPath: 'id',
        indexes: [ { name: 'createdAt', keyPath: 'createdAt' } ]
      }
    ]
  })
  return dbHandle
}

const uuid = () => crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`

export const enqueue = async (action: Omit<OfflineAction, 'id' | 'createdAt' | 'retries'>) => {
  const handle = await initOfflineQueue()
  const entry: OfflineAction = {
    id: uuid(),
    createdAt: Date.now(),
    retries: 0,
    ...action
  }
  await tx(handle, QUEUE_STORE, 'readwrite', (store) => { store.put(entry); return true })
  return entry
}

export const dequeueAll = async (): Promise<OfflineAction[]> => {
  const handle = await initOfflineQueue()
  return tx(handle, QUEUE_STORE, 'readwrite', (store) => {
    return new Promise<OfflineAction[]>((resolve) => {
      const req = store.getAll()
      req.onsuccess = () => {
        const list = (req as any).result as OfflineAction[]
        resolve(list || [])
      }
      req.onerror = () => resolve([])
    })
  })
}

export const removeById = async (id: string) => {
  const handle = await initOfflineQueue()
  await tx(handle, QUEUE_STORE, 'readwrite', (store) => { store.delete(id); return true })
}

export const update = async (action: OfflineAction) => {
  const handle = await initOfflineQueue()
  await tx(handle, QUEUE_STORE, 'readwrite', (store) => { store.put(action); return true })
}


