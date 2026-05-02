/**
 * Data Provider Abstraction (Step 3)
 * ---------------------------------------------------------------
 * Purpose:
 *   Define a backend-agnostic contract for where data lives.
 *   Two implementations ship with the app:
 *     - localProvider  → reads/writes go through the Zustand store
 *                        (current behavior, synchronous under the hood,
 *                        exposed as Promises for interface uniformity).
 *     - remoteProvider → mock stub that simulates a REST/GraphQL
 *                        backend with artificial latency. Safe to
 *                        develop against; nothing actually leaves
 *                        the browser.
 *
 *   Which one is active is controlled by the `USE_REMOTE` flag
 *   below. Today: `false`. Flipping the flag (or wiring it to an
 *   env var) will later swap the entire data backend without any
 *   component needing to change.
 *
 * Why a Promise-based interface even when local is sync?
 *   A real backend is always async. If we let local callers assume
 *   sync, every call site breaks the day we flip the flag. The
 *   provider interface is async end-to-end from day one; local
 *   just resolves immediately.
 *
 * What this file does NOT do yet:
 *   - It is scaffolding. dataService's existing synchronous API is
 *     unchanged and still routes directly to the Zustand store for
 *     today's UI. The provider is exposed for code paths that want
 *     to be remote-ready (migrations, background sync, future
 *     components). Step 4+ will start migrating call sites.
 *   - It does NOT change UI behavior. Zero components import this.
 */

import type { DataProvider } from './providers/types'
import { localProvider } from './providers/localProvider'
import { remoteProvider } from './providers/remoteProvider'

/**
 * Master switch. Set to `true` to route all provider calls through
 * the mock remote provider instead of the local store.
 *
 * In a real deployment this would come from an env var, e.g.:
 *   export const USE_REMOTE = import.meta.env.VITE_USE_REMOTE === 'true'
 *
 * For now it's a hard constant so we can flip it in one place for
 * smoke-testing without any build-time coupling.
 */
export const USE_REMOTE = false

/** Resolve the active provider based on the flag. */
export function getProvider(): DataProvider {
  return USE_REMOTE ? remoteProvider : localProvider
}

// Re-export the interface + concrete providers so callers only need
// to import from this file.
export type { DataProvider } from './providers/types'
export { localProvider, remoteProvider }
