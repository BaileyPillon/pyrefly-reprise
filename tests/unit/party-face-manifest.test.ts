/**
 * Every shipped party build's face resolves to a painted portrait — the
 * regression guard for LIVE-A2-1 (`critic/reviews/fd0ae96-live.json`,
 * `docs/handoff/fix3-ffx2-hud-prep.md`).
 *
 * The bug was a lookup-key gap, not a missing painting: Rikku's and Paine's
 * Chapter 4 party-prep tiles showed a letter monogram while the very same
 * assets rendered fine elsewhere, because the prep roster, the Results ledger
 * and the chapter-select dossier each asked only "does
 * `portraits/<build-member-id>.png` exist?" — right for FFX, where a
 * guardian's `portraitKey` *is* her one painted file, but the wrong question
 * for FFX-2, where the fleet's actual likeness can be named `<id>-x2` or live
 * only as the head of her current dressphere's full-body painting. This test
 * does not import `partyFaceHtml` — it mirrors its candidate order against
 * `public/art/manifest.json` directly, so it is pinning the *contract*
 * (every shipped member must have somewhere real for that ladder to land),
 * not re-running the implementation against itself.
 *
 * `public/art/` is gitignored (AGENTS.md map), so this reads whatever the
 * local art fleet has actually produced — the same assumption
 * `ui-portrait-face-crop.test.ts` already makes for the measured-crop table.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../src/data/encounters.ts';

interface Manifest {
  portraits: string[];
  subjects: Record<string, { states: string[] }>;
}

const ROOT = resolve(__dirname, '../..');
const manifest = JSON.parse(readFileSync(resolve(ROOT, 'public/art/manifest.json'), 'utf8')) as Manifest;

/**
 * The same ladder `ui/common/partyFace.ts`'s `partyFaceHtml` climbs:
 * FFX asks only the plain portrait; FFX-2 tries the per-dressphere portrait,
 * then the dressphere-agnostic `-x2` likeness, then the plain portrait, and
 * finally falls back to the head of the current dressphere's own idle
 * painting (the body-crop layer `faceLayersHtml` draws behind the portrait).
 */
function resolvedCandidate(id: string, dressphere: string | undefined): string | null {
  const tries = dressphere ? [`${id}-${dressphere}`, `${id}-x2`, id] : [id];
  const portrait = tries.find((c) => manifest.portraits.includes(c));
  if (portrait) return `portraits/${portrait}.png`;
  if (dressphere && (manifest.subjects[`${id}-${dressphere}`]?.states ?? []).includes('idle')) {
    return `characters/${id}-${dressphere}/idle.png`;
  }
  return null;
}

describe('every shipped party build resolves to a painted portrait', () => {
  for (const chapter of CHAPTERS) {
    const build = chapter.buildRef;

    if (build.game === 'ffx') {
      for (const m of build.members) {
        it(`${chapter.id}: ${m.name} (${m.id}) has a painted portrait`, () => {
          expect(resolvedCandidate(m.id, undefined), `${m.id} in public/art/manifest.json`).not.toBeNull();
        });
      }
    } else {
      for (const m of build.members) {
        it(`${chapter.id}: ${m.name} (${m.id}, ${m.currentDressphere}) has a painted portrait`, () => {
          expect(
            resolvedCandidate(m.id, m.currentDressphere),
            `${m.id}-${m.currentDressphere} (nor -x2, nor plain ${m.id}, nor its idle painting) in public/art/manifest.json`,
          ).not.toBeNull();
        });
      }
    }
  }
});
