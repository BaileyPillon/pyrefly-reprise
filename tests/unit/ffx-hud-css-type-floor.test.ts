/**
 * `src/ui/ffx/ffx-hud.css`'s in-stage type floor — FOC-04
 * (`critic/reviews/5e92289f9cc5a1d1bd0f65e9c00ebddeacdc40d1-focused.json`).
 *
 * The battle HUD is authored on the 640x360 grid `LetterboxStage.ts` scales by
 * `min(w / 640, h / 360)`, which is exactly 2.5 at 1600x900 (the review's own
 * measurement viewport, and CHK-003's) and ~2.811 at 2000x1012. FE-001 floored
 * the front-end's own `.fe-*` chrome at 14px desktop / 12px phone this release
 * (`tests/unit/frontend-css-type-floor.test.ts`); CHK-003 asks the same
 * question of the in-stage HUD and got two "no"s: the OD / Overdrive gauge
 * label (`.ffx-stat__od em`, 4.4px) measured 11.0px effective, and the Sensor
 * panel's "I hide" toggle (`.ffx-sensor__toggle`, 4.6px) measured 11.5px —
 * both under the 12px floor the review applied to this surface.
 *
 * Both are raised to 4.9px here (12.25px effective at 1600x900, the same small
 * margin `strategy-guide.css` keeps above its own 5.6px-required floor with
 * 5.7). This sweeps every `font-size` in the sheet rather than only the two
 * named selectors, so a later addition cannot quietly reintroduce the same
 * defect a third time.
 *
 * `src/ui/ffx2/ffx2-hud.css` is out of scope: it has at least one comparably
 * small label of its own (`.ffx2-status-chip i`, a stack-count superscript,
 * 4.5px) that this review did not measure or evidence, so AGENTS.md hard rule
 * 6 keeps it out of this pass rather than tuning a number nobody asked about.
 *
 * No jsdom: this is arithmetic on the sheet's own text, the same approach
 * `pause-remake-css.test.ts` and `strategy-guide-chip-and-type.test.ts` use,
 * for the same reason — `--lb-scale` arithmetic is resolved by a browser at
 * layout time, not by jsdom's `getComputedStyle`.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHEET = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'ffx', 'ffx-hud.css'), 'utf8');

/** The floor CHK-003 measured this surface against, at the review's own viewport. */
const FLOOR_PX = 12;

/** `min(w / 640, h / 360)`, `LetterboxStage.ts`'s own formula. */
function stageScale(w: number, h: number): number {
  return Math.min(w / 640, h / 360);
}

const VIEWPORTS: ReadonlyArray<readonly [string, number, number]> = [
  ['1600x900', 1600, 900],
  ['2000x1012', 2000, 1012],
];

/** Every declared `font-size: Npx`, with the selector block it sits in. */
function declaredSizes(sheet: string): ReadonlyArray<{ readonly selector: string; readonly px: number }> {
  const out: { selector: string; px: number }[] = [];
  for (const block of sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = block[1]!.replace(/\/\*[\s\S]*?\*\//g, '').trim().replace(/\s+/g, ' ');
    for (const decl of block[2]!.matchAll(/font-size:\s*([\d.]+)px/g)) {
      out.push({ selector, px: Number.parseFloat(decl[1]!) });
    }
  }
  return out;
}

describe('FOC-04: no in-stage HUD label falls under 12 effective px', () => {
  const sizes = declaredSizes(SHEET);

  it('finds the two labels this repair touched, among others', () => {
    expect(sizes.length).toBeGreaterThan(10);
    expect(sizes.some((s) => s.selector.includes('.ffx-stat__od em'))).toBe(true);
    expect(sizes.some((s) => s.selector.includes('.ffx-sensor__toggle'))).toBe(true);
  });

  for (const [label, w, h] of VIEWPORTS) {
    it(`clears ${FLOOR_PX}px effective at ${label}`, () => {
      const scale = stageScale(w, h);
      const under = sizes
        .filter((s) => s.px * scale < FLOOR_PX)
        .map((s) => `${s.selector} = ${s.px}px -> ${(s.px * scale).toFixed(2)} effective`);
      expect(under).toEqual([]);
    });
  }

  it('names the two repaired declarations directly, so a revert is caught even if the sweep above changes', () => {
    const od = sizes.find((s) => s.selector.includes('.ffx-stat__od em'));
    const sensorToggle = sizes.find((s) => s.selector === '.ffx-sensor__toggle');
    expect(od?.px, '.ffx-stat__od em').toBeGreaterThanOrEqual(4.8);
    expect(sensorToggle?.px, '.ffx-sensor__toggle').toBeGreaterThanOrEqual(4.8);
  });
});
