import { decryptFromStorage, encryptForStorage, getEncryptionStatus } from './encryptionManager'

type CachedWorkspaceData = {
  workspaceId: string
  lastUpdatedAt: string
  risks: unknown[]
  categories: string[]
}

type StoredRecord = {
  key: string
  updatedAt: string
  encrypted: boolean
  payload: string
}

const DB_NAME = 'easy-risk-register'
const DB_VERSION = 1
const STORE_NAME = 'offline_cache_v1'

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'))
  }

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
  })
}

function readRecord(db: IDBDatabase, key: string): Promise<StoredRecord | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(key)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'))
    req.onsuccess = () => resolve((req.result as StoredRecord | undefined) ?? null)
  })
}

function writeRecord(db: IDBDatabase, record: StoredRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(record)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB write failed'))
    req.onsuccess = () => resolve()
  })
}

function keyForWorkspace(workspaceId: string) {
  return `workspace:${workspaceId}`
}

async function encodePayload(data: CachedWorkspaceData): Promise<{ encrypted: boolean; payload: string }> {
  const json = JSON.stringify(data)
  const status = getEncryptionStatus()
  if (!status.enabled) return { encrypted: false, payload: json }
  if (!status.unlocked) {
    throw new Error('Encryption locked')
  }

  const encrypted = await encryptForStorage(json)
  return { encrypted: true, payload: encrypted }
}

async function decodePayload(record: StoredRecord): Promise<CachedWorkspaceData | null> {
  try {
    const raw = record.encrypted ? await decryptFromStorage(record.payload) : record.payload
    const parsed = JSON.parse(raw) as any
    if (!parsed || typeof parsed !== 'object') return null
    if (typeof parsed.workspaceId !== 'string' || !parsed.workspaceId.trim()) return null
    if (typeof parsed.lastUpdatedAt !== 'string' || !parsed.lastUpdatedAt.trim()) return null
    if (!Array.isArray(parsed.risks)) return null
    const categories = Array.isArray(parsed.categories)
      ? parsed.categories.filter((c: unknown) => typeof c === 'string' && c.trim())
      : []
    return {
      workspaceId: parsed.workspaceId,
      lastUpdatedAt: parsed.lastUpdatedAt,
      risks: parsed.risks,
      categories,
    }
  } catch {
    return null
  }
}

export async function saveWorkspaceOfflineCache(params: {
  workspaceId: string
  lastUpdatedAt: string
  risks: unknown[]
  categories: string[]
}): Promise<void> {
  const db = await openDb()
  const key = keyForWorkspace(params.workspaceId)
  const { encrypted, payload } = await encodePayload({
    workspaceId: params.workspaceId,
    lastUpdatedAt: params.lastUpdatedAt,
    risks: params.risks,
    categories: params.categories,
  })

  await writeRecord(db, {
    key,
    updatedAt: new Date().toISOString(),
    encrypted,
    payload,
  })
}

export async function loadWorkspaceOfflineCache(workspaceId: string): Promise<CachedWorkspaceData | null> {
  const db = await openDb()
  const record = await readRecord(db, keyForWorkspace(workspaceId))
  if (!record) return null
  const decoded = await decodePayload(record)
  if (!decoded) return null
  if (decoded.workspaceId !== workspaceId) return null
  return decoded
}

