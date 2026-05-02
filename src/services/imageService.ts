/**
 * Image Storage Service (Step 5)
 * ---------------------------------------------------------------
 * Problem:
 *   Images were being saved as base64 `dataUrl` strings inside the
 *   same Zustand-persisted JSON blob as the rest of the business
 *   data. A few photos quickly push localStorage past its 5MB cap
 *   and bloat every export/import.
 *
 * Solution:
 *   Store image bytes in IndexedDB (which has no practical size
 *   limit and stores blobs natively), and keep only a short
 *   reference string in the main data. A reference looks like:
 *
 *     img://local/<uuid>
 *
 *   Helpers:
 *     saveImage(input)        → Promise<ref>       accepts dataUrl,
 *                                                  Blob, or File
 *     loadImage(ref)          → Promise<dataUrl?>  for <img src=...>
 *     loadImageBlob(ref)      → Promise<Blob?>
 *     deleteImage(ref)        → Promise<void>
 *     isImageRef(value)       → boolean            distinguishes new
 *                                                  refs from legacy
 *                                                  base64 dataUrls
 *     resolveImageSrc(value)  → Promise<string>    use-anywhere:
 *                                                  returns dataUrl
 *                                                  regardless of
 *                                                  input kind
 *
 * Backward compatibility:
 *   Legacy base64 `dataUrl` strings continue to work everywhere —
 *   `resolveImageSrc` passes them through unchanged and
 *   `isImageRef` returns false for them. Nothing is forcibly
 *   migrated. The Step-7 migration runner can move existing
 *   base64 content into IndexedDB opportunistically.
 *
 * Failure semantics:
 *   If IndexedDB is unavailable (private browsing, quota exceeded)
 *   the helpers surface a clear error rather than silently losing
 *   data. Callers should wrap in try/catch and fall back to the
 *   legacy base64 path if they need to tolerate failure.
 */

const DB_NAME = 'electrician-images'
const DB_VERSION = 1
const STORE_NAME = 'images'
const REF_PREFIX = 'img://local/'

// ─── IndexedDB plumbing ──────────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment.'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error ?? new Error('Failed to open image DB.'))
  })
  return dbPromise
}

function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  return openDb().then(db => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)
    let settled = false
    Promise.resolve(fn(store))
      .then(reqOrValue => {
        if (reqOrValue && typeof (reqOrValue as IDBRequest).onsuccess !== 'undefined') {
          const req = reqOrValue as IDBRequest<T>
          req.onsuccess = () => { settled = true; resolve(req.result) }
          req.onerror   = () => reject(req.error ?? new Error('IndexedDB request failed.'))
        } else {
          settled = true
          resolve(reqOrValue as T)
        }
      })
      .catch(reject)
    tx.onerror    = () => { if (!settled) reject(tx.error ?? new Error('IndexedDB transaction error.')) }
    tx.onabort    = () => { if (!settled) reject(tx.error ?? new Error('IndexedDB transaction aborted.')) }
  }))
}

// ─── Ref/dataUrl conversion ──────────────────────────────────────

function uid(): string {
  // RFC4122-ish random. Good enough for client-side refs.
  const rand = crypto.getRandomValues(new Uint8Array(16))
  rand[6] = (rand[6] & 0x0f) | 0x40
  rand[8] = (rand[8] & 0x3f) | 0x80
  const hex = Array.from(rand, b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function dataUrlToBlob(dataUrl: string): Blob {
  const m = /^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,(.*)$/.exec(dataUrl)
  if (!m) throw new Error('Not a valid data URL.')
  const mime = m[1] || 'application/octet-stream'
  const isBase64 = !!m[2]
  const payload = m[3]
  if (isBase64) {
    const bin = atob(payload)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return new Blob([bytes], { type: mime })
  }
  return new Blob([decodeURIComponent(payload)], { type: mime })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob.'))
    reader.readAsDataURL(blob)
  })
}

// ─── Public API ──────────────────────────────────────────────────

/** True if the given string is a Step-5 image reference. */
export function isImageRef(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(REF_PREFIX)
}

/** True if the given string is a legacy base64 data URL. */
export function isDataUrl(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:')
}

/** Store an image and return its reference. */
export async function saveImage(input: string | Blob | File): Promise<string> {
  const blob: Blob =
    typeof input === 'string' ? dataUrlToBlob(input) :
    input instanceof Blob     ? input :
    (() => { throw new Error('saveImage: unsupported input type.') })()

  const id = uid()
  await withStore('readwrite', store => store.put(blob, id))
  return `${REF_PREFIX}${id}`
}

/** Load an image as a data URL suitable for `<img src=...>`. */
export async function loadImage(ref: string): Promise<string | undefined> {
  if (!isImageRef(ref)) return undefined
  const id = ref.slice(REF_PREFIX.length)
  const blob = await withStore<Blob | undefined>('readonly', store => store.get(id))
  if (!blob) return undefined
  return blobToDataUrl(blob)
}

/** Load the raw Blob for the given ref. */
export async function loadImageBlob(ref: string): Promise<Blob | undefined> {
  if (!isImageRef(ref)) return undefined
  const id = ref.slice(REF_PREFIX.length)
  return withStore<Blob | undefined>('readonly', store => store.get(id))
}

/** Delete an image. No-op for non-ref strings and unknown IDs. */
export async function deleteImage(ref: string): Promise<void> {
  if (!isImageRef(ref)) return
  const id = ref.slice(REF_PREFIX.length)
  await withStore('readwrite', store => store.delete(id))
}

/**
 * Universal resolver: pass in whatever is stored on the entity
 * (ref, legacy dataUrl, or empty) and get back something safe to
 * feed an `<img src>`. Returns an empty string for nullish input.
 */
export async function resolveImageSrc(value: string | undefined | null): Promise<string> {
  if (!value) return ''
  if (isImageRef(value)) {
    const src = await loadImage(value)
    return src ?? ''
  }
  // Legacy base64 dataUrl — pass through.
  return value
}

/** List every stored image ID (for audit / orphan cleanup). */
export async function listImageIds(): Promise<string[]> {
  return withStore<string[]>('readonly', store => store.getAllKeys() as unknown as IDBRequest<string[]>)
}

/** Wipe every image. Used by the nuclear "Delete All Data" path. */
export async function clearAllImages(): Promise<void> {
  await withStore('readwrite', store => store.clear())
}
