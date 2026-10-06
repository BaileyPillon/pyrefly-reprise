/**
 * Release 39.1, B9 (FFX only: Chapter XII): the four Mortiphasm discs stand 0.30 of Seymour's height higher, so the lower pair is no longer behind the
 * party or under the enemy-intent card at the first menu. Every offset keeps its place in the grid and its gaps; nothing else moves.
 */
import { describe, expect, it } from 'vitest';
import { DISC_LAYOUT, DISC_LIFT, GARDEN_ACTOR_HEIGHTS, GARDEN_BOSS_SPOT, GARDEN_OF_PAIN_SLOTS, discPlacements } from '../../src/scenes/garden-of-pain.ts';
import { STRIP_GRID } from '../../src/ui/ffx/omnisReadoutModel.ts';

/** The O-2 composite's offsets before the lift (release 39). */
const BEFORE = [
  { dx: -0.53, dy: 0.71 },
  { dx: -0.44, dy: 0.27 },
  { dx: 0.45, dy: 0.28 },
  { dx: 0.53, dy: 0.72 },
];

describe('the discs are lifted as one grid', () => {
  it('every disc is DISC_LIFT (0.30) higher than the composite had it, and not an inch to either side', () => {
    expect(DISC_LIFT).toBe(0.3);
    DISC_LAYOUT.at.forEach((d, i) => {
      expect(d.dx).toBe(BEFORE[i]!.dx);
      expect(d.dy).toBeCloseTo(BEFORE[i]!.dy + 0.3, 10);
    });
  });

  it('keeps the gaps between discs the composite had (a pure lift) and the discs apart (no two overlap)', () => {
    const dist = (a: { dx: number; dy: number }, b: { dx: number; dy: number }): number => Math.hypot(a.dx - b.dx, a.dy - b.dy);
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        expect(dist(DISC_LAYOUT.at[i]!, DISC_LAYOUT.at[j]!)).toBeCloseTo(dist(BEFORE[i]!, BEFORE[j]!), 10);
        expect(dist(DISC_LAYOUT.at[i]!, DISC_LAYOUT.at[j]!)).toBeGreaterThanOrEqual(DISC_LAYOUT.diameter * 0.97);
      }
    }
  });

  it("keeps the strip's order: the grid still reads upper-left, upper-right, lower-left, lower-right as the discs stand", () => {
    const [ul, ur, ll, lr] = STRIP_GRID.map((i) => DISC_LAYOUT.at[i]!);
    expect(ul!.dx).toBeLessThan(0);
    expect(ll!.dx).toBeLessThan(0);
    expect(ur!.dx).toBeGreaterThan(0);
    expect(lr!.dx).toBeGreaterThan(0);
    expect(ul!.dy).toBeGreaterThan(ll!.dy);
    expect(ur!.dy).toBeGreaterThan(lr!.dy);
  });

  it("moves the discs and nothing else: his spot, his height and the party's places are as they were", () => {
    expect(GARDEN_BOSS_SPOT).toEqual([2.15, 0, -4.0]);
    expect(GARDEN_ACTOR_HEIGHTS.omnis).toBe(3.5);
    expect(GARDEN_OF_PAIN_SLOTS.party).toEqual([[-0.85, 0, 1.6], [0.22, 0, 1.55], [-0.4, 0, -1.0]]);
    const at = discPlacements();
    // the lowest disc's centre is 0.57 of his height above his feet (it was 0.27)
    expect(at[1]!.centre[1] - GARDEN_BOSS_SPOT[1]).toBeCloseTo(0.57 * 3.5, 6);
    expect(at[0]!.centre[1] - GARDEN_BOSS_SPOT[1]).toBeCloseTo(1.01 * 3.5, 6);
  });
});
