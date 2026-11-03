/**
 * THE FIXES THE REVIEW OF `origin/r72` (5414a04af) ASKED FOR (both games; records, comments and a canvas read: no number of a fight changes).
 *
 * The review found no critical or major defect in the branch itself, one integration blocker and a few minors. What is pinned here:
 *  - the three scratch-folder names the lanes left in comments (FlipFit.ts, SkyGrade.ts, hudf1-chapters.css) are gone, and none of the files the three lanes added or rewrote names a drive path or the scratch folder
 *    (a comment is stripped by the minifier, but the gate's scan is the second line of defence and a name in a comment is a name on the next copy-paste into a string);
 *  - `docs/CONTRACT-CHANGES.md` carries the lane's entry (`returnFit`, `setReturnFit`, `layProneFigures(..., dt)`, `SlideEase`);
 *  - the handoff's J-ONE-1 row and its Chapter I row say that the knock-out slide eases in the booth pair outside the default mode, by design, so a browser read there is not a "defect of the merge";
 *  - the integration blocker's half that lives in the test directory: the hold-reason guard (`hold-reasons-no-local-paths.test.ts`) reads `SKY_TODAY_HOLDS` too, and does not require a `real` row for Braska's chapter
 *    (the row is gone: `motion/FlipFit.ts` fits the flip instead). The canvas read of `FlipFit` is in `booth-b4-r72-flip-fit.test.ts`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PIECE_HOLDS } from '../../src/engine/motion/PieceHolds.ts';
import { SKY_TODAY_HOLDS } from '../../src/engine/motion/PieceHoldsSky.ts';
import { findLocalPaths } from '../../tools/dist-local-paths.mjs';

const read = (p: string): string => readFileSync(resolve(p), 'utf8');

/** The source files the three lanes added or rewrote for release 72 (the comments are not shipped, but they are copied). */
const R72_FILES = [
  'src/engine/motion/FlipFit.ts',
  'src/engine/motion/SlideEase.ts',
  'src/engine/motion/PieceHoldsSky.ts',
  'src/engine/look/pro/SkyGrade.ts',
  'src/ui/hudf1/hudf1-chapters.css',
  'src/ui/ffx/hudAvoidSelectors.ts',
];

describe('the files the release-72 lanes added name no folder of the build machine, in code or in a comment', () => {
  for (const file of R72_FILES) {
    it(file, () => {
      const text = read(file);
      expect(findLocalPaths(text).map((h: { kind: string }) => h.kind), 'a drive-letter or user-profile path').toEqual([]);
      expect(/pyrefly-scratch/i.test(text), 'the scratch folder by name').toBe(false);
    });
  }
});

describe('docs/CONTRACT-CHANGES.md records the lane (the shared plumbing the actor layer and the stage carry for both games)', () => {
  const log = read('docs/CONTRACT-CHANGES.md');
  const at = log.indexOf('Lane r72');
  const entry = at < 0 ? '' : log.slice(at, log.indexOf('\n## ', at + 1) < 0 ? undefined : log.indexOf('\n## ', at + 1));

  it('has an entry for the lane, above the older ones', () => {
    expect(at).toBeGreaterThan(0);
    expect(log.indexOf('Lane budgets-2')).toBeGreaterThan(at);
  });

  it('names the four additions and the game case of each', () => {
    for (const name of ['StrikePlan.returnFit', 'StrikeRun.setReturnFit', 'layProneFigures', 'SlideEase', 'FlipFit']) expect(entry, name).toContain(name);
    expect(entry).toMatch(/FFX only/);
    expect(entry).toMatch(/BOTH games/);
    expect(entry).toMatch(/No contract file changes/);
  });
});

describe('the handoff does not call the by-design slide ease in the booth pair "a defect of the merge" (r72 review, minor)', () => {
  const note = read('docs/handoff/r72.md');
  const row = (key: string): string => note.split('\n').find((l) => l.includes(key)) ?? '';

  it('J-ONE-1 limits "a defect of the merge" to the default mode and names the words where the ease shows', () => {
    const j = row('| **J-ONE-1**');
    expect(j).toMatch(/in the default mode \(the pack's `real-snappy` curves, REDUCE MOTION off/);
    expect(j).toMatch(/Outside the default the knock-out slide eases by design/);
    expect(j).toMatch(/`\?curves=new`/);
    expect(j).toMatch(/no real knock-out row/);
    expect(j).toMatch(/final place equals release 71's/);
  });

  it('section 9 maps each finding to its fix and says what is not fixed (the three disclosed conditions)', () => {
    const at = note.indexOf('## 9. The review of `origin/r72`');
    expect(at).toBeGreaterThan(note.indexOf('## 8. Open questions'));
    const nine = note.slice(at);
    for (const word of ['PieceHolds.ts', 'SKY_TODAY_HOLDS', 'canvasHeight', 'CONTRACT-CHANGES', 'Scratch-folder', 'J-ONE-1', 'Not fixed here']) expect(nine, word).toContain(word);
    for (const word of ['IX and XII are back on offline proof only', 'CHK-027 run', 'bar no real clip can meet']) expect(nine, word).toContain(word);
  });

  it("the Chapter I row of the per-chapter table says the same instead of 'nothing'", () => {
    const r = row('| I | `seymour-flux`');
    expect(r).toMatch(/invisible in the default real-snappy/);
    expect(r).toMatch(/`\?curves=new`/);
  });
});

describe('Braska\'s chapter has no `real` row any more, so no guard may require one', () => {
  it('PIECE_HOLDS has no `real` row for braskas-final-aeon (the flip is fitted, not held)', () => {
    expect(PIECE_HOLDS['braskas-final-aeon']?.real).toBeUndefined();
  });

  it('the three kept `real` holds are the ones the handoff names: VIII, XVIII and the Mirror Aeons', () => {
    const holders = Object.entries(PIECE_HOLDS).filter(([, rows]) => rows.real !== undefined).map(([id]) => id).sort();
    expect(holders).toEqual(['evrae-airship', 'mirror-aeons', 'sin-face', 'sin-fins-core']); // r74-fins added Chapter XVII, on the same deck
  });

  it('SKY_TODAY_HOLDS (shipped text, like PIECE_HOLDS) is Chapter XI only, with its two reasons', () => {
    expect(Object.keys(SKY_TODAY_HOLDS)).toEqual(['ffx2-fallen-aeons']);
    expect(Object.keys(SKY_TODAY_HOLDS['ffx2-fallen-aeons']!).sort()).toEqual(['arena', 'hd2d']);
  });
});
