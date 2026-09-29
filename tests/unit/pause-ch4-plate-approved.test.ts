/**
 * The Chapter IV pause plate is the painting on its approved tile (r29-plate,
 * D-257, PR-0242; FFX-2 only: Chapter IV, Bahamut, is an FFX-2 chapter).
 *
 * PR-0242: "the Chapter IV pause hero plate is a different painting from its
 * approved tile". The approved tile is `docs/screenshots/concept/pause-ch4.png`
 * ("Hero plate, chapter 4" in `docs/target/targets.json`). The registry
 * `docs/target/approved-hashes.json` (`pause:plates`) records the hash of the
 * file behind it, and it was wrong for `ch4-ffx2-bahamut` until 2026-09-29.
 *
 * `public/art/` is gitignored and local only, so the byte check runs only where
 * the art exists (the main tree, or a worktree with the art junction); it is a
 * skip, not a failure, on a bare checkout. What always runs: the chapter's
 * `heroArt` still names this plate, and the registry pins the restored hash.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PNG = 'public/art/pause/ch4-ffx2-bahamut.png';
const WEBP = 'public/art/pause/ch4-ffx2-bahamut.2x.webp';

/** The 1x painting on the approved tile: pixel-identical to docs/screenshots/concept/pause-ch4.png. */
const APPROVED_PNG_SHA256 = '79047d2f7c0294d9ec1bd21733b4d07d97378811c8d9fc4c6be8c6d2ed6e072e';
/** The 'ch4-b v2' render that replaced it in error (still the FFX-era alias ch4-bahamut.png). */
const WRONG_PNG_SHA256 = '4f5b14994f6ebb42eadec4c2f2c5f7f21d60b5db0a36d23bd3834d22c2b61494';
const WRONG_WEBP_SHA256 = 'ece2de6d0c58e6686ea65d6fc20ab299b589909ae8d25ba02a7e6fa0d21211f7';

interface HashSet {
  readonly [file: string]: { readonly sha256: string };
}

function registry(): HashSet {
  const raw = JSON.parse(readFileSync(join(ROOT, 'docs/target/approved-hashes.json'), 'utf8')) as {
    sets: Record<string, HashSet>;
  };
  return raw.sets['pause:plates'] as HashSet;
}

const sha = (rel: string): string => createHash('sha256').update(readFileSync(join(ROOT, rel))).digest('hex');

describe('Chapter IV pause plate matches its approved tile (FFX-2 only)', () => {
  it('the chapter still shows the ch4-ffx2-bahamut plate on the pause CHAPTER tab', () => {
    const meta = readFileSync(join(ROOT, 'src/data/chapter-meta.ts'), 'utf8');
    expect(meta).toContain("heroArt: 'pause/ch4-ffx2-bahamut'");
  });

  it('the registry pins the tile painting, not the replaced render', () => {
    const set = registry();
    expect(set[PNG]?.sha256).toBe(APPROVED_PNG_SHA256);
    expect(set[PNG]?.sha256).not.toBe(WRONG_PNG_SHA256);
    expect(set[WEBP]?.sha256).not.toBe(WRONG_WEBP_SHA256);
  });

  it.skipIf(!existsSync(join(ROOT, PNG)))('the plate on disk is the tile painting (1x byte-exact, 2x not the old render)', () => {
    expect(sha(PNG)).toBe(APPROVED_PNG_SHA256);
    expect(sha(PNG)).toBe(registry()[PNG]?.sha256);
    if (existsSync(join(ROOT, WEBP))) {
      expect(sha(WEBP)).not.toBe(WRONG_WEBP_SHA256);
      expect(sha(WEBP)).toBe(registry()[WEBP]?.sha256);
    }
  });
});
