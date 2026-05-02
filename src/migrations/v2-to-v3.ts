/**
 * v2 → v3: image ref migration (opt-in / non-destructive).
 *
 * v2 stores image bytes as base64 `dataUrl` strings on
 * PhotoAttachment.dataUrl and Payment.attachments[]. v3's preferred
 * representation is an IndexedDB-backed `img://local/<uuid>`
 * reference (see services/imageService.ts).
 *
 * This migration does NOT rewrite existing records. Rewriting them
 * requires async I/O (IndexedDB), which is awkward inside a
 * synchronous safeMigrate wrapper, and — more importantly — the
 * app is fully backward compatible with legacy base64 strings
 * (resolveImageSrc handles both). So the safest move is to flag
 * the schema as v3 and let new saves use the new format while
 * old records continue to work as-is.
 *
 * A future migration (or a background "optimize storage" tool in
 * Settings) can do the actual byte-moving when it's safe to block.
 */

import type { Migration } from './index'

const v2ToV3: Migration = {
  from: 2,
  to:   3,
  label: 'v2-to-v3 (image refs)',
  run() {
    // No-op transformation. The imageService handles both legacy
    // base64 and new refs at read time. This bump signals that
    // new writes *should* use saveImage() going forward.
  },
}

export default v2ToV3
