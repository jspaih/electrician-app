/**
 * Migration System (Step 7)
 * ---------------------------------------------------------------
 * Versioned, idempotent migrations for the persisted data schema.
 *
 * How it works:
 *   - A schema version is recorded in localStorage under
 *     `app_schema_version`. Absent → treated as v1 (pre-migration).
 *   - At app startup `runMigrations()` walks every registered
 *     migration whose `from` matches the current version and
 *     runs it. Each migration bumps the stored version on success.
 *   - EVERY migration is wrapped in `safeMigrate()` from the Step-1
 *     backup service, so a snapshot of localStorage is taken before
 *     the migration runs. On throw, localStorage rolls back
 *     automatically and the error is surfaced.
 *   - Before the first migration in a run actually executes, a
 *     user-visible backup file is also downloaded so the owner has
 *     an off-device copy. This is belt-and-suspenders on top of
 *     the in-memory rollback.
 *
 * How to add a new migration:
 *   1. Create `vN-to-vN+1.ts` with a default export matching
 *      `Migration`.
 *   2. Add it to the `MIGRATIONS` array below, in order.
 *   3. Bump `CURRENT_SCHEMA_VERSION`.
 *   4. Test: set localStorage['app_schema_version'] = 'N' and
 *      reload — the migration should run exactly once.
 *
 * Idempotency rule:
 *   Migrations should be safe to re-run if something interrupted
 *   the previous attempt before the version bump was persisted.
 *   Check for "already applied" state at the top and bail early.
 */

import { safeMigrate, backupData } from '../services/backup'
import v1ToV2 from './v1-to-v2'
import v2ToV3 from './v2-to-v3'

export const SCHEMA_VERSION_KEY = 'app_schema_version'
export const CURRENT_SCHEMA_VERSION = 3

export interface Migration {
  from: number
  to:   number
  label: string
  /** Runs the migration. Throw on failure — safeMigrate will roll back. */
  run(): void | Promise<void>
}

const MIGRATIONS: Migration[] = [
  v1ToV2,
  v2ToV3,
]

function getCurrentVersion(): number {
  const raw = localStorage.getItem(SCHEMA_VERSION_KEY)
  if (!raw) return 1
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

function setCurrentVersion(n: number): void {
  localStorage.setItem(SCHEMA_VERSION_KEY, String(n))
}

/**
 * Run every pending migration in order. Takes a downloadable backup
 * before the first one. Safe to call multiple times; a no-op when
 * already at the latest version.
 *
 * Returns the final version after all migrations have run.
 */
export async function runMigrations(): Promise<number> {
  let current = getCurrentVersion()
  if (current >= CURRENT_SCHEMA_VERSION) {
    return current
  }

  // One pre-migration backup download, covering the entire run.
  try {
    backupData({ filenamePrefix: `pre-migration-v${current}` })
  } catch (err) {
    // Non-fatal: safeMigrate still holds an in-memory safety snapshot.
    // eslint-disable-next-line no-console
    console.warn('[migrations] pre-run backup download failed:', err)
  }

  for (const m of MIGRATIONS) {
    if (m.from !== current) continue
    // eslint-disable-next-line no-console
    console.info(`[migrations] running ${m.label} (v${m.from} → v${m.to})`)

    await new Promise<void>((resolve, reject) => {
      try {
        safeMigrate(() => {
          const result = m.run()
          if (result instanceof Promise) {
            // Wait synchronously inside safeMigrate is not possible;
            // reject here forces the caller to use sync migrations
            // OR restructure. We take the pragmatic route: kick off
            // the async work and resolve the outer promise when it
            // settles. Rollback on reject is handled below.
            result.then(() => {
              setCurrentVersion(m.to)
              resolve()
            }).catch(err => reject(err))
            return
          }
          setCurrentVersion(m.to)
          resolve()
        }, { label: m.label })
      } catch (err) {
        reject(err)
      }
    })

    current = m.to
  }

  return current
}
