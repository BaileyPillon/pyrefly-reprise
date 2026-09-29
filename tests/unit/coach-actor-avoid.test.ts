/**
 * PR-0237 (critic round 15), both games: a first-time coach line covered the
 * fighters' faces or weapons. Numbers are measured headless before the fix,
 * FFX Chapter I at 1600x900 with the intent slab open: the line sat at
 * [556, 378, 956, 523] and covered 68,835 px of fighter, 46,162 of it in the
 * face band. After the fix, measured the same way: 0 at 1600x900, 2560x1080 and
 * FFX-2 Chapter IV at 1600x900 and 2000x1012; 877 px (no face) at 2000x1012.
 */
import { describe, expect, it } from 'vitest';
import { actorCost, placeOffActors } from '../../src/ui/coach/coachActorAvoid.ts';

const stage = { left: 0, top: 0, right: 1600, bottom: 900 };
const mark = { left: 556, top: 378, right: 956, bottom: 523 };
// Tidus, Kimahri and Yuna standing under the line, roughly as painted at 1600x900.
const party = [
  { left: 500, top: 440, right: 640, bottom: 760 },
  { left: 600, top: 400, right: 740, bottom: 700 },
  { left: 720, top: 430, right: 860, bottom: 780 },
];
const panels = [
  { left: 60, top: 440, right: 540, bottom: 840 }, // command stack
  { left: 395, top: 40, right: 775, bottom: 360 }, // intent slab
  { left: 1000, top: 640, right: 1560, bottom: 880 }, // party status
  { left: 1330, top: 120, right: 1560, bottom: 500 }, // turn list
];

describe('placeOffActors', () => {
  it('moves a line that covers faces to a panel-clear place that covers none', () => {
    expect(actorCost(mark, party)).toBeGreaterThan(0);
    const moved = placeOffActors(mark, party, panels, stage);
    expect(moved).not.toBeNull();
    expect(actorCost(moved!, party)).toBe(0);
    for (const p of panels) {
      const clear = moved!.right <= p.left || p.right <= moved!.left || moved!.bottom <= p.top || p.bottom <= moved!.top;
      expect(clear).toBe(true);
    }
    expect(moved!.right - moved!.left).toBe(400);
  });

  it('leaves a line alone when it covers no fighter (so it settles)', () => {
    expect(placeOffActors({ left: 900, top: 380, right: 1300, bottom: 520 }, party, panels, stage)).toBeNull();
  });

  it('weights the face band above the body', () => {
    const a = { left: 0, top: 0, right: 100, bottom: 300 };
    expect(actorCost({ left: 0, top: 0, right: 100, bottom: 50 }, [a])).toBeGreaterThan(actorCost({ left: 0, top: 250, right: 100, bottom: 300 }, [a]));
  });
});
