import { openDB } from 'idb'

const DB_NAME = 'dashboard-db'
const DB_VERSION = 1

const STORES = ['meta', 'metrics', 'dailyAccounts', 'processed', 'clinicData', 'other'] as const
type StoreName = typeof STORES[number]

let dbPromise: Promise<any> | null = null

async function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        STORES.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store)
          }
        })
      }
    })
  }
  return dbPromise
}

export async function saveDashboardChunks(chunks: Partial<Record<StoreName, any>>) {
  const db = await getDb()
  const tx = db.transaction(STORES, 'readwrite')
  for (const store of STORES) {
    if (store in chunks) {
      await tx.objectStore(store).put(chunks[store], 'data')
    }
  }
  await tx.done
}

export async function loadAllDashboardChunks(): Promise<Partial<Record<StoreName, any>>> {
  const db = await getDb()
  const tx = db.transaction(STORES, 'readonly')
  const result: Partial<Record<StoreName, any>> = {}
  for (const store of STORES) {
    result[store] = await tx.objectStore(store).get('data')
  }
  await tx.done
  return result
}

export async function clearDashboardChunks() {
  const db = await getDb()
  const tx = db.transaction(STORES, 'readwrite')
  await Promise.all(STORES.map(store => tx.objectStore(store).clear()))
  await tx.done
}


