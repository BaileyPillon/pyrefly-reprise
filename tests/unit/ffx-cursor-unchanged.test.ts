// @vitest-environment jsdom
/**
 * Test 19 of the FFX-2 Special look (step D1; game case: the target cursor is a shared FFX file, additive, absent by default, so "both games, unchanged" with the hint absent; the hint
 * itself is passed only for a Special form, which is FFX-2 only).
 *
 * The FFX cursor tests (`ui-target-cursor`, `ui-ffx-target-step-parity`, `ffx-lone-target-step`, `target-hit-pick`, `ui-ffx2-stale-reticle`, `target-group-accent`,
 * `ui-ffx2-all-target-label`, `ui-target-selection-ends`) are run UNCHANGED beside this file. This file adds: with `setOrder` absent (or given `null`) the step order equals the pin of
 * `target-cursor-order-pin.test.ts`, and with a hint the ids in it come first in its order, the rest after them by projected x.
 *
 * Removal check: drop the hint from `refreshOrder` and the hinted cases fail; let the hint leak when it is absent and the pinned case fails.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { TargetCursor, type TargetEntry } from '../../src/ui/ffx/TargetCursor.ts';

type Rect = { x: number; y: number; w: number; h: number };
const ally = (id: string): TargetEntry => ({ id, name: id, kind: 'ally' });
const rect = (x: number): Rect => ({ x, y: 300, w: 80, h: 200 });

beforeEach(() => {
  document.body.innerHTML = '';
});

/** The ids the cursor stands on: after `showSingle`, then after each of `n` steps of +1. */
function walk(entries: TargetEntry[], at: Record<string, number>, hint: readonly string[] | null | undefined, n = 4): string[] {
  const c = new TargetCursor();
  c.setProjector((id) => (at[id] === undefined ? null : rect(at[id]!)));
  if (hint !== undefined) c.setOrder(hint);
  document.body.append(c.el);
  c.showSingle(entries);
  const out = [c.activeTargetId!];
  for (let i = 0; i < n; i++) {
    c.step(1);
    out.push(c.activeTargetId!);
  }
  return out;
}

describe('with the hint absent, the order is the pinned one', () => {
  const pinned = JSON.parse(readFileSync(resolve(__dirname, '..', 'fixtures', 'specials', 'off-pins', 'target-cursor-order.json'), 'utf8')) as Record<string, { start: string; steps: string[] }>;

  it('three girls whose rectangles run against the engine\'s order: the pinned walk, with no setOrder call and with setOrder(null)', () => {
    const entries = [ally('a'), ally('b'), ally('c')];
    const at = { a: 900, b: 500, c: 100 };
    const want = [pinned['girls']!.start, ...pinned['girls']!.steps];
    expect(walk(entries, at, undefined)).toEqual(want);
    expect(walk(entries, at, null)).toEqual(want);
  });
});

describe('with a hint, the plates are cycled in the hint\'s order', () => {
  const entries = [ally('left'), ally('main'), ally('right')]; // the engine's order is not the plates' order
  const at = { main: 900, right: 500, left: 100 }; // and the projected x run the opposite way: left, right, main

  it('three entries whose projected x are in the opposite order step main, right, left, main', () => {
    expect(walk(entries, at, undefined, 3)).toEqual(['left', 'right', 'main', 'left']); // the cursor's own rule
    expect(walk(entries, at, ['main', 'right', 'left'], 3)).toEqual(['main', 'right', 'left', 'main']);
  });

  it('step(-1) walks the hint backwards', () => {
    const c = new TargetCursor();
    c.setProjector((id) => rect(at[id as keyof typeof at]));
    c.setOrder(['main', 'right', 'left']);
    document.body.append(c.el);
    c.showSingle(entries);
    c.step(-1);
    expect(c.activeTargetId).toBe('left');
    c.step(-1);
    expect(c.activeTargetId).toBe('right');
  });

  it('ids not in the hint come after the hinted ones, in projected x order', () => {
    const more = [ally('b'), ...entries, ally('a')];
    const where = { ...at, a: 50, b: 2000 };
    expect(walk(more, where, ['main', 'right', 'left'], 5)).toEqual(['main', 'right', 'left', 'a', 'b', 'main']);
  });

  it('a hint naming ids that are not candidates changes nothing for the rest', () => {
    expect(walk(entries, at, ['nobody', 'main'], 3)).toEqual(['main', 'left', 'right', 'main']);
  });

  it('setOrder(null) puts back the cursor\'s own order', () => {
    const c = new TargetCursor();
    c.setProjector((id) => rect(at[id as keyof typeof at]));
    c.setOrder(['main', 'right', 'left']);
    c.setOrder(null);
    document.body.append(c.el);
    c.showSingle(entries);
    expect(c.activeTargetId).toBe('left');
  });
});
