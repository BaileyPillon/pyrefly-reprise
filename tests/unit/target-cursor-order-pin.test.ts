// @vitest-environment jsdom
/**
 * The OFF pin of `TargetCursor.setOrder` (step D1 of the FFX-2 Special look; game case: the cursor is a shared FFX file, additive, absent by default, so this pin is "both games, unchanged").
 *
 * Step D1 adds an optional order hint to the cursor. With the hint absent the cycling order is what it always was: candidates sorted by their projected x, ties and unprojectable
 * candidates in engine order. Pinned in `tests/fixtures/specials/off-pins/target-cursor-order.json`: for four fixed sets of entries with fixed projected rectangles, the id the cursor
 * stands on after `showSingle` and after each of four `step(1)` calls, and after one `step(-1)`. A later change that reorders anything with the hint absent fails here.
 *
 * Removal check: change the sort in `refreshOrder` (or let a hint leak into it) and the sequences differ.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { TargetCursor, type TargetEntry } from '../../src/ui/ffx/TargetCursor.ts';
import { expectPinned } from './helpers/offPins.ts';

type Rect = { x: number; y: number; w: number; h: number };
const ally = (id: string): TargetEntry => ({ id, name: id, kind: 'ally' });

/** Each set: the entries in engine order and the rectangle each projects to (null: not projectable). */
const SETS: Record<string, { entries: TargetEntry[]; rects: Record<string, Rect | null> }> = {
  // three fiends, the engine's order is not left to right
  fiends: {
    entries: [{ id: 'aeon', name: 'Aeon', kind: 'enemy' }, { id: 'pagoda-c', name: 'Pagoda', kind: 'enemy', tag: 'C' }, { id: 'pagoda-b', name: 'Pagoda', kind: 'enemy', tag: 'B' }],
    rects: { aeon: { x: 1080, y: 380, w: 420, h: 520 }, 'pagoda-c': { x: 760, y: 560, w: 150, h: 330 }, 'pagoda-b': { x: 1560, y: 500, w: 130, h: 300 } },
  },
  // three girls whose rectangles are in the reverse of the engine's order
  girls: {
    entries: [ally('a'), ally('b'), ally('c')],
    rects: { a: { x: 900, y: 300, w: 80, h: 200 }, b: { x: 500, y: 300, w: 80, h: 200 }, c: { x: 100, y: 300, w: 80, h: 200 } },
  },
  // three rectangles whose centres tie to the pixel: the engine's order breaks the tie
  ties: {
    entries: [ally('t1'), ally('t2'), ally('t3'), ally('t4')],
    rects: { t1: { x: 400, y: 300, w: 60, h: 200 }, t2: { x: 400, y: 120, w: 60, h: 90 }, t3: { x: 200, y: 300, w: 60, h: 200 }, t4: { x: 400, y: 80, w: 60, h: 60 } },
  },
  // two candidates cannot be projected: pinned as the cursor orders them today
  unprojected: {
    entries: [ally('u1'), ally('u2'), ally('u3'), ally('u4')],
    rects: { u1: null, u2: { x: 700, y: 200, w: 50, h: 100 }, u3: { x: 300, y: 200, w: 50, h: 100 }, u4: null },
  },
};

beforeEach(() => {
  document.body.innerHTML = '';
});

function run(name: string): { start: string | null; steps: Array<string | null>; back: string | null } {
  const set = SETS[name]!;
  const c = new TargetCursor();
  c.setProjector((id) => set.rects[id] ?? null);
  document.body.append(c.el);
  c.showSingle(set.entries);
  const start = c.activeTargetId;
  const steps: Array<string | null> = [];
  for (let i = 0; i < 4; i++) {
    c.step(1);
    steps.push(c.activeTargetId);
  }
  c.step(-1);
  return { start, steps, back: c.activeTargetId };
}

describe('OFF pin 8: the cursor\'s cycling order with no hint', () => {
  it('showSingle then four step(1) and one step(-1) walk the pinned ids for each fixed set', () => {
    const out: Record<string, ReturnType<typeof run>> = {};
    for (const name of Object.keys(SETS)) out[name] = run(name);
    // a sanity floor on the sets themselves: the order is by projected x, not the engine's
    expect(out['girls']!.start).toBe('c');
    expect(out['fiends']!.start).toBe('pagoda-c');
    expectPinned('target-cursor-order', out);
  });

});
