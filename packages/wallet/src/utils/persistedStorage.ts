import { getChromeWithThrow } from 'utilities/src/chrome/chrome'

const chrome = getChromeWithThrow()

type AreaName = keyof Pick<typeof chrome.storage, 'sync' | 'local' | 'managed' | 'session'>

type StorageArea = {
  get: (
    keys: string | string[] | Record<string, string | undefined> | null,
  ) => Promise<Record<string, string | undefined>>
  set: (items: Record<string, string>) => Promise<void>
  remove: (keys: string | string[]) => Promise<void>
  clear: () => Promise<void>
}

export const prefix = 'com.uniswap.web'
export const ENCRYPTION_KEY_STORAGE_KEY = `${prefix}.encryptionKey`

const fallbackAreas: Partial<Record<AreaName, StorageArea>> = {}
let hasLoggedMissingStorage = false

function createMemoryStorage(): StorageArea {
  const store = new Map<string, string>()

  return {
    async get(keys) {
      if (keys === null) {
        return Object.fromEntries(store.entries())
      }

      if (typeof keys === 'string') {
        return store.has(keys) ? { [keys]: store.get(keys) } : {}
      }

      if (Array.isArray(keys)) {
        return keys.reduce<Record<string, string | undefined>>((acc, key) => {
          if (store.has(key)) {
            acc[key] = store.get(key)
          }
          return acc
        }, {})
      }

      return Object.keys(keys ?? {}).reduce<Record<string, string | undefined>>((acc, key) => {
        acc[key] = store.has(key) ? store.get(key) : keys?.[key]
        return acc
      }, {})
    },
    async set(items) {
      Object.entries(items).forEach(([key, value]) => {
        store.set(key, value)
      })
    },
    async remove(keys) {
      const list = Array.isArray(keys) ? keys : [keys]
      list.forEach((key) => store.delete(key))
    },
    async clear() {
      store.clear()
    },
  }
}

function resolveStorageArea(area: AreaName): StorageArea {
  const storageArea = chrome.storage?.[area]
  if (storageArea) {
    return storageArea as StorageArea
  }

  if (!hasLoggedMissingStorage) {
    hasLoggedMissingStorage = true
    // biome-ignore lint/suspicious/noConsole: helpful when debugging jest environments
    console.warn('Missing chrome.storage area, using in-memory fallback for tests')
  }

  if (!fallbackAreas[area]) {
    fallbackAreas[area] = createMemoryStorage()
  }

  return fallbackAreas[area]!
}

/**
 * Chrome storage wrapper
 * @implements {redux-persist#Storage}
 *
 * NOTE: class avoids dependency on redux-persist by not explicity defining implements
 * */
export class PersistedStorage {
  private storage: StorageArea

  constructor(private area: AreaName = 'local') {
    this.storage = resolveStorageArea(this.area)
  }

  private get areaStorage(): StorageArea {
    const nativeStorage = chrome.storage?.[this.area]
    if (nativeStorage && this.storage !== nativeStorage) {
      this.storage = nativeStorage as StorageArea
    }
    return this.storage
  }

  async getItem(key: string): Promise<string | undefined> {
    const result = await this.areaStorage.get(key)
    const item = result[key]
    return typeof item === 'string' ? item : undefined
  }

  async getAll(): Promise<Record<string, string>> {
    const result = await this.areaStorage.get(null)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return (result as Record<string, string>) ?? {}
  }

  setItem(key: string, value: string): Promise<void> {
    return this.areaStorage.set({ [key]: value })
  }

  removeItem(key: string | string[]): Promise<void> {
    return this.areaStorage.remove(key)
  }

  clear(): Promise<void> {
    return this.areaStorage.clear()
  }
}
