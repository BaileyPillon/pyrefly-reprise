/**
 * FOC-06, the enemy-intent half (docs/plans/foc-06-method-check.md; iteration 2 B6): the intent
 * card had no type floor at all. It is authored in grid px under its own `--eint-scale` transform
 * (the letterbox factor), so 3.7 to 10 px authored rendered at 9 to 25 px at 1600x900 and under
 * 14 px on most rows. Every font-size is now floored on the *rendered* result, the move advisor's
 * mechanism: `max(authored, calc(14.2px / var(--eint-scale, 1)))`.
 *
 * Game case: both (the shared intent card both HUDs mount, CHK-020).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = join(HERE, '..', '..', 'src', 'ui', 'common');
const SHEETS = ['enemy-intent.css', 'enemy-intent-overflow.css', 'enemy-intent-brief-status.css'];
const FLOORED = /font-size:\s*max\(([\d.]+)px,\s*calc\(14\.2px \/ var\(--eint-scale, 1\)\)\);/g;

function scaleAt(w: number, h: number): number {
  return Math.min(w / 640, h / 360);
}

describe('FOC-06: the enemy-intent card never renders a row under 14 px', () => {
  for (const name of SHEETS) {
    const sheet = readFileSync(join(DIR, name), 'utf8');

    it(`${name}: no bare font-size is left`, () => {
      expect([...sheet.matchAll(/font-size:\s*[\d.]+px;/g)].map((m) => m[0])).toEqual([]);
    });

    it(`${name}: every floored row clears 14 px at 1280x720, 1600x900, 2000x1012 and 390x844`, () => {
      const sizes = [...sheet.matchAll(FLOORED)].map((m) => Number(m[1]));
      expect(sizes.length).toBeGreaterThan(0);
      for (const [w, h] of [[1280, 720], [1600, 900], [2000, 1012], [390, 844]] as const) {
        const s = scaleAt(w, h);
        for (const px of sizes) expect(Math.max(px, 14.2 / s) * s).toBeGreaterThanOrEqual(14);
      }
    });
  }
});
