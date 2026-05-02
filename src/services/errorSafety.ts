/**
 * Error Safety Layer (Step 8)
 * ---------------------------------------------------------------
 * Centralized error reporting + emergency recovery utilities.
 *
 * The idea is simple: data operations should NEVER silently
 * corrupt state. Every mutation already flows through the `guard`
 * wrapper in dataService — this module extends that wrapper with:
 *
 *   1. A single `reportError(context, err)` entry point that all
 *      catch blocks call. One place to hook up logging, toasts,
 *      or Sentry later.
 *   2. `emergencyRestore(file)` — last-resort recovery: wipe
 *      everything and restore from a user-provided backup file.
 *      Meant for the "something is badly wrong" scenario.
 *   3. `installGlobalHandlers()` — catches unhandled errors and
 *      promise rejections at the window level so a stray bug in
 *      any component doesn't slip past unnoticed.
 *
 * What this module does NOT do:
 *   - Does not change any existing catch behavior. The guards in
 *     dataService still rethrow; this just gives them a proper
 *     reporter to call.
 *   - Does not auto-wipe data. Emergency restore is opt-in and
 *     user-initiated.
 *   - Does not add UI. Settings can wire a button to
 *     `emergencyRestore` later; for now the function is exported
 *     for DevTools / console use by the owner.
 */

import { restoreData, createBackupSnapshot } from './backup'

export interface ErrorRecord {
  timestamp: string
  context: string
  message: string
  stack?: string
}

// In-memory ring buffer of the last N errors. Used for diagnostics
// without burdening localStorage (which may already be the thing
// that's broken).
const MAX_ERRORS = 50
const errorLog: ErrorRecord[] = []

/** Append an error to the ring buffer + console. */
export function reportError(context: string, err: unknown): void {
  const record: ErrorRecord = {
    timestamp: new Date().toISOString(),
    context,
    message: err instanceof Error ? err.message : String(err),
    stack:   err instanceof Error ? err.stack   : undefined,
  }
  errorLog.push(record)
  if (errorLog.length > MAX_ERRORS) errorLog.shift()
  // eslint-disable-next-line no-console
  console.error(`[${context}]`, err)
}

/** Read-only snapshot of the in-memory error log. */
export function getErrorLog(): ReadonlyArray<ErrorRecord> {
  return errorLog.slice()
}

/** Clear the error log (does not touch data). */
export function clearErrorLog(): void {
  errorLog.length = 0
}

/**
 * Safe wrapper: runs `fn`, on throw reports + returns `fallback`.
 * Use at call sites where we'd rather degrade gracefully than
 * bubble up (reads, derived calculations). Writes should still
 * rethrow so the caller knows the operation didn't land.
 */
export function safeRead<T>(context: string, fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch (err) {
    reportError(context, err)
    return fallback
  }
}

/**
 * Last-resort recovery. Accepts a backup file (as text or File) and
 * restores it over whatever's currently in localStorage. A safety
 * snapshot is still taken by restoreData(), so even this can be
 * rolled back if the provided file turns out to be corrupt.
 *
 * Caller is responsible for reloading the page afterwards.
 */
export async function emergencyRestore(source: string | File | Blob): Promise<void> {
  const text = typeof source === 'string'
    ? source
    : await source.text()
  restoreData(text)
}

/**
 * Dump the current localStorage as a plain object (for debugging
 * / email-to-support). Uses the same snapshot shape as backup.ts
 * so the result can be fed back into restoreData() if needed.
 */
export function diagnosticsSnapshot() {
  return createBackupSnapshot()
}

/**
 * Install window-level handlers so unhandled errors and rejected
 * promises are captured. Idempotent.
 */
let globalHandlersInstalled = false
export function installGlobalHandlers(): void {
  if (globalHandlersInstalled) return
  globalHandlersInstalled = true

  if (typeof window === 'undefined') return

  window.addEventListener('error', event => {
    reportError('window.onerror', event.error ?? event.message)
  })
  window.addEventListener('unhandledrejection', event => {
    reportError('unhandledrejection', event.reason)
  })
}

// Expose on the window in dev for owner console access. Harmless
// in prod; purely a convenience binding.
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__electricianDiagnostics = {
    getErrorLog,
    clearErrorLog,
    diagnosticsSnapshot,
    emergencyRestore,
  }
}
