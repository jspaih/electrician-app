/**
 * Safe Backup System (Step 1)
 * ---------------------------------------------------------------
 * Responsibilities:
 *   1. backupData()            → snapshot ALL localStorage into a
 *                                downloadable, timestamped JSON file.
 *   2. createBackupSnapshot()  → same snapshot as an in-memory object
 *                                (used by safeMigrate, no download).
 *   3. restoreData(json)       → validate + restore a snapshot into
 *                                localStorage. Refuses malformed input.
 *   4. safeMigrate(fn)         → wraps a migration in auto-backup +
 *                                auto-rollback on throw.
 *
 * Design rules:
 *   - Capture EVERYTHING in localStorage, not just the Zustand key.
 *     A partial backup is worse than none for a live business system.
 *   - Include a schema version so future restores can adapt.
 *   - Zero UI changes. Pure service module — safe to import anywhere.
 *   - No dependency on the Zustand store; this must work even if the
 *     store fails to hydrate.
 */

export const BACKUP_SCHEMA_VERSION = 1

export interface BackupSnapshot {
  schemaVersion: number
  createdAt: string        // ISO timestamp
  appVersion?: string      // optional, for future use
  userAgent?: string
  localStorage: Record<string, string>
}

/** Build an in-memory snapshot of every localStorage key/value. */
export function createBackupSnapshot(appVersion?: string): BackupSnapshot {
  const data: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key === null) continue
    const value = localStorage.getItem(key)
    if (value === null) continue
    data[key] = value
  }

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    appVersion,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    localStorage: data,
  }
}

/** Format a Date into a filename-safe timestamp: YYYY-MM-DD_HH-mm-ss */
function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
  )
}

/**
 * Download the full localStorage state as a JSON file.
 * Returns the snapshot that was exported (useful for tests/logging).
 */
export function backupData(options?: { filenamePrefix?: string; appVersion?: string }): BackupSnapshot {
  const snapshot = createBackupSnapshot(options?.appVersion)
  const prefix = options?.filenamePrefix ?? 'electrician-backup'
  const filename = `${prefix}_${formatTimestamp(new Date())}.json`

  const json = JSON.stringify(snapshot, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // Release the blob URL on the next tick so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  return snapshot
}

/**
 * Validate that an unknown value looks like a BackupSnapshot.
 * Returns a typed snapshot or throws a descriptive error.
 */
export function validateSnapshot(input: unknown): BackupSnapshot {
  if (!input || typeof input !== 'object') {
    throw new Error('Backup file is not a valid JSON object.')
  }
  const obj = input as Record<string, unknown>

  if (typeof obj.schemaVersion !== 'number') {
    throw new Error('Backup is missing "schemaVersion".')
  }
  if (typeof obj.createdAt !== 'string') {
    throw new Error('Backup is missing "createdAt".')
  }
  if (!obj.localStorage || typeof obj.localStorage !== 'object') {
    throw new Error('Backup is missing "localStorage" payload.')
  }

  const entries = obj.localStorage as Record<string, unknown>
  for (const [k, v] of Object.entries(entries)) {
    if (typeof k !== 'string' || typeof v !== 'string') {
      throw new Error(`Backup contains invalid entry for key "${k}": value must be a string.`)
    }
  }

  if (obj.schemaVersion > BACKUP_SCHEMA_VERSION) {
    throw new Error(
      `Backup schema v${obj.schemaVersion} is newer than this app supports (v${BACKUP_SCHEMA_VERSION}). ` +
      `Update the app before restoring.`,
    )
  }

  return {
    schemaVersion: obj.schemaVersion,
    createdAt: obj.createdAt,
    appVersion: typeof obj.appVersion === 'string' ? obj.appVersion : undefined,
    userAgent: typeof obj.userAgent === 'string' ? obj.userAgent : undefined,
    localStorage: entries as Record<string, string>,
  }
}

/**
 * Restore a snapshot into localStorage.
 *
 * Accepts either:
 *   - a JSON string (e.g. read from an uploaded file)
 *   - a parsed object / BackupSnapshot
 *
 * Behavior:
 *   - A safety snapshot of the CURRENT localStorage is taken first and
 *     held in memory; if the restore fails mid-way, it is rolled back.
 *   - On success, localStorage is fully replaced with the snapshot's
 *     contents (matching the original export: everything is restored).
 *
 * The caller is responsible for reloading the page afterwards if the
 * app has already hydrated state from localStorage.
 */
export function restoreData(input: string | object): BackupSnapshot {
  let parsed: unknown
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input)
    } catch (e) {
      throw new Error('Backup file is not valid JSON.')
    }
  } else {
    parsed = input
  }

  const snapshot = validateSnapshot(parsed)

  // Take a pre-restore safety snapshot so we can roll back on failure.
  const safety = createBackupSnapshot()

  try {
    localStorage.clear()
    for (const [key, value] of Object.entries(snapshot.localStorage)) {
      localStorage.setItem(key, value)
    }
    return snapshot
  } catch (err) {
    // Roll back to the pre-restore state.
    try {
      localStorage.clear()
      for (const [key, value] of Object.entries(safety.localStorage)) {
        localStorage.setItem(key, value)
      }
    } catch {
      // If rollback itself fails, we can't do anything safer in the
      // browser; surface the original error to the caller.
    }
    throw err instanceof Error
      ? new Error(`Restore failed and was rolled back: ${err.message}`)
      : new Error('Restore failed and was rolled back.')
  }
}

/**
 * Run a migration function with an automatic in-memory backup taken
 * beforehand. If the migration throws, localStorage is rolled back to
 * the pre-migration state and the error is re-thrown.
 *
 * Usage:
 *   safeMigrate(() => {
 *     // migration code that mutates localStorage / the store
 *   }, { label: 'v1-to-v2' })
 */
export function safeMigrate<T>(
  fn: () => T,
  options?: { label?: string; downloadBackup?: boolean },
): T {
  const label = options?.label ?? 'migration'

  // Always take an in-memory safety snapshot.
  const safety = createBackupSnapshot()

  // Optionally also download a user-visible backup file before migrating.
  if (options?.downloadBackup) {
    try {
      backupData({ filenamePrefix: `pre-${label}` })
    } catch {
      // If the download fails (e.g. headless env), continue — the
      // in-memory safety snapshot is still in place.
    }
  }

  try {
    return fn()
  } catch (err) {
    // Roll back.
    try {
      localStorage.clear()
      for (const [key, value] of Object.entries(safety.localStorage)) {
        localStorage.setItem(key, value)
      }
    } catch {
      // Swallow rollback errors; re-throw original below.
    }
    throw err instanceof Error
      ? new Error(`Migration "${label}" failed and was rolled back: ${err.message}`)
      : new Error(`Migration "${label}" failed and was rolled back.`)
  }
}
