/**
 * `src/ui/common/move-advisor.css`'s type floor — FOC-06
 * (`critic/rounds/round-08.md` #8, disclosed in
 * `critic/reviews/1b339718e023d4dd8a5868901d55ba000a9e59a9-focused.md`).
 *
 * The move advisor card is authored on the 640x360 grid `FFXBattleHud.ts` and
 * `FFX2BattleHud.ts` scale by `min(w / 640, h / 360)` (`LetterboxStage.ts`'s
 * formula) — 2.5 at 1600x900, ~2.8111 at 2000x1012, but only ~0.6094 at
 * 390x844, because a narrow, tall phone window uses *less* of that factor
 * than a 16:9 desktop one. The round-08 review measured eight rows under 12
 * effective px at the two desktop viewports (as low as 9.75px) and every row
 * collapsing further on the phone (as low as 2.38px).
 *
 * A flat px raise the way `ffx-hud-css-type-floor.test.ts` checks for FOC-04
 * cannot clear all three viewports at once here: raising the authored value
 * enough to clear 12px at the phone's ~0.61x factor would render ~4x too
 * large at the desktop's ~2.5-2.81x factor. So the fix applies the floor to
 * the *rendered* result: `move-advisor.css` publishes `--mad-fs-floor: calc(
 * 12.2px / var(--lb-scale, 1))` and every font-size is `max(authored, var(
 * --mad-fs-floor))`; both hosts publish `--lb-scale` as the same factor their
 * `layout()` multiplies the stage by. This file evaluates that arithmetic the
 * way a browser would, at the three viewports the round names.
 *
 * No jsdom: `--mad-fs-floor` is custom-property arithmetic a browser resolves
 * at layout time, not something jsdom's `getComputedStyle` resolves — this is
 * arithmetic on the sheet's own text, the same approach
 * `ffx-hud-css-type-floor.test.ts` and `pause-remake-css.test.ts` use.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHEET = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'common', 'move-advisor.css'), 'utf8');

/** The floor the round applied to this card, at every viewport it measured. */
const FLOOR_PX = 12;

/** `--mad-fs-floor`'s own numerator, which the sheet defines with a small margin over the ask. */
const FLOOR_NUMERATOR_PX = 12.2;

/** `min(w / 640, h / 360)`, `LetterboxStage.ts`'s own formula — what both hosts publish as `--lb-scale`. */
function stageScale(w: number, h: number): number {
  return Math.min(w / 640, h / 360);
}

const VIEWPORTS: ReadonlyArray<readonly [string, number, number]> = [
  ['1600x900', 1600, 900],
  ['2000x1012', 2000, 1012],
  ['390x844', 390, 844],
];

/** Every declared `font-size: max(Npx, var(--mad-fs-floor));`, with the selector block it sits in. */
function declaredSizes(sheet: string): ReadonlyArray<{ readonly selector: string; readonly px: number }> {
  const out: { selector: string; px: number }[] = [];
  for (const block of sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = block[1]!.replace(/\/\*[\s\S]*?\*\//g, '').trim().replace(/\s+/g, ' ');
    for (const decl of block[2]!.matchAll(/font-size:\s*max\(([\d.]+)px,\s*var\(--mad-fs-floor\)\);/g)) {
      out.push({ selector, px: Number.parseFloat(decl[1]!) });
    }
  }
  return out;
}

/** The rendered effective size of one declaration at a given stage scale. */
function effective(authoredPx: number, scale: number): number {
  const floorPx = FLOOR_NUMERATOR_PX / scale;
  return Math.max(authoredPx, floorPx) * scale;
}

describe('FOC-06: no move-advisor card row falls under 12 effective px, on desktop or phone', () => {
  const sizes = declaredSizes(SHEET);

  it('finds every font-size in the sheet wrapped in the floor (no bare declaration left)', () => {
    expect(sizes.length).toBeGreaterThan(10);
    const bare = [...SHEET.matchAll(/font-size:\s*[\d.]+px;/g)];
    expect(bare.map((m) => m[0])).toEqual([]);
  });

  it('names the two lowest-measured rows from the review directly', () => {
    const badge = sizes.find((s) => s.selector.includes('.mad__badge'));
    const stat = sizes.find((s) => s.selector === '.mad__stat');
    expect(badge?.px, "'GUIDE'S PICK' (.mad__badge)").toBe(3.9);
    expect(stat?.px, "the four stat chips (.mad__stat)").toBe(4.2);
  });

  it('declares --mad-fs-floor as calc(12.2px / var(--lb-scale, 1))', () => {
    expect(SHEET).toContain('--mad-fs-floor: calc(12.2px / var(--lb-scale, 1));');
  });

  for (const [label, w, h] of VIEWPORTS) {
    it(`clears ${FLOOR_PX}px effective at ${label}`, () => {
      const scale = stageScale(w, h);
      const under = sizes
        .filter((s) => effective(s.px, scale) < FLOOR_PX)
        .map((s) => `${s.selector} = ${s.px}px authored -> ${effective(s.px, scale).toFixed(2)} effective`);
      expect(under).toEqual([]);
    });
  }

  it('does not shrink a row that was already comfortably above the floor', () => {
    // .mad__stat--dmg / --heal (5.2px authored) render at 13.0px effective at
    // 1600x900 today; the floor must not clamp them down to 12.2.
    const scale = stageScale(1600, 900);
    const dmg = sizes.find((s) => s.selector === '.mad__stat--dmg');
    expect(dmg?.px, '.mad__stat--dmg').toBe(5.2);
    expect(effective(dmg!.px, scale)).toBeCloseTo(13.0, 5);
  });
});
