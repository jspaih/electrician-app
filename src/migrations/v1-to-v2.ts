/**
 * v1 → v2: baseline bump.
 *
 * v1 is "the persisted state before we introduced the migration
 * system." No actual data transformation is needed — we just mark
 * the state as v2 so future migrations can chain from a known
 * starting point.
 *
 * This migration is intentionally a no-op on the data. It exists
 * so the runner has a pipeline entry for apps that were installed
 * before Step 7 shipped.
 */

import type { Migration } from './index'

const v1ToV2: Migration = {
  from: 1,
  to:   2,
  label: 'v1-to-v2 (baseline)',
  run() {
    // No data transformation. Idempotent by definition.
  },
}

export default v1ToV2
