/**
 * Round 21, PR-0364 and PR-0347 (FFX-2 only; decided from the sources: only FFX-2 has a run-in, `research/ffx2-combat-core.md` section 1):
 * the run-in's camera truck follows half the run and Yuna, who stands at the frame's left, left it (Leblanc, 1600x900, Rikku's runs: Yuna
 * 82 and 17 % in frame at the peak, her left edge at -33 and -157 px). `fitTruck` cuts the follow back until no girl on her side is more
 * cropped at the frame's edges than at rest. The projection is a plain pinhole camera, as in `r38-stand-off.test.ts`.
 */
import { describe, expect, it } from 'vitest';
import { fitTruck, KEEP_MARGIN, planRun, TRUCK, type RunWorld } from '../../src/engine/motion/StandOff.ts';
import type { PaintedSpan, Rect, Spot } from '../../src/engine/motion/StageMotionPort.ts';

const VIEW = { w: 1600, h: 900 };
const CAM = { x: 0.5, y: 2.3, z: 8.2, f: 1100 };
const ZERO: Spot = { x: 0, y: 0, z: 0 };

function project(p: Spot, truck: Spot): { x: number; y: number } {
  const k = CAM.f / (CAM.z + truck.z - p.z);
  return { x: VIEW.w / 2 + (p.x - (CAM.x + truck.x)) * k, y: VIEW.h * 0.5 + (CAM.y + truck.y - p.y) * k };
}

/** A painted box 0.9 wide and 1.8 tall, feet at `at`, as a screen rectangle. */
function boxRect(at: Spot, truck: Spot): Rect {
  const a = project({ x: at.x - 0.45, y: at.y + 1.8, z: at.z }, truck);
  const b = project({ x: at.x + 0.45, y: at.y, z: at.z }, truck);
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
}

const girlSpan = (at: Spot): PaintedSpan => ({ x0: at.x - 0.45, x1: at.x + 0.45, y0: 0, y1: 1.8, z: at.z });
const HOME: Spot = { x: -0.75, y: 0, z: -1.5 };
const BOSS: PaintedSpan = { x0: -0.9, x1: 3.9, y0: 0, y1: 6, z: -5.8 };

/** A run world; `mates` stand where they stand and the planner must keep them in frame when `keep` is on. */
function world(mates: Spot[], o: { keep?: boolean } = {}): RunWorld {
  const keepOn = o.keep !== false;
  return {
    home: HOME,
    girl: girlSpan(HOME),
    target: BOSS,
    rectOf: (at, truck) => boxRect(at, truck),
    targetRect: (truck) => {
      const a = project({ x: BOSS.x0, y: BOSS.y1, z: BOSS.z }, truck);
      const b = project({ x: BOSS.x1, y: BOSS.y0, z: BOSS.z }, truck);
      return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
    },
    others: mates.map((m) => ({ z: m.z, rect: (truck: Spot) => boxRect(m, truck) })),
    ...(keepOn ? { keep: mates.map((m) => ({ rect: (truck: Spot) => boxRect(m, truck) })) } : {}),
    view: VIEW,
  };
}

/** Where a mate stands so that her box's left edge is `leftPx` from the frame's left at rest (z = 0.1). */
function mateAtLeft(leftPx: number): Spot {
  const z = 0.1;
  const k = CAM.f / (CAM.z - z);
  // left edge = w/2 + (x - 0.45 - CAM.x) * k
  return { x: (leftPx - VIEW.w / 2) / k + 0.45 + CAM.x, y: 0, z };
}

describe('the run-in truck keeps the girls on her side in the frame (PR-0364)', () => {
  it('is the whole follow, half the run and a small lift, when nobody is near an edge (as before)', () => {
    const t = fitTruck(world([mateAtLeft(300)]), 2);
    expect(t).toEqual({ x: 2 * TRUCK.follow, y: TRUCK.lift, z: 0 });
  });

  it('is the whole follow when no one is given to keep (a world built before the rule)', () => {
    const t = fitTruck(world([mateAtLeft(5)], { keep: false }), 2);
    expect(t.x).toBeCloseTo(1, 9);
  });

  it('cuts the follow back until the girl at the left edge is as whole as at rest, never past it', () => {
    const mate = mateAtLeft(120); // 120 px from the edge at rest
    const dx = 3; // the whole follow is 1.5 units: about 245 px of camera slide, so she would be 125 px outside the frame
    const full = boxRect(mate, { x: dx * TRUCK.follow, y: TRUCK.lift, z: 0 });
    expect(full.x).toBeLessThan(0);
    const t = fitTruck(world([mate]), dx);
    expect(t.x).toBeLessThan(dx * TRUCK.follow);
    expect(t.x).toBeGreaterThan(0); // some of the follow is kept: the run is still followed
    const r = boxRect(mate, t);
    expect(r.x).toBeGreaterThanOrEqual(Math.min(boxRect(mate, ZERO).x, VIEW.w * KEEP_MARGIN) - 0.5);
    // and the lift is cut by the same fraction
    expect(t.y / TRUCK.lift).toBeCloseTo(t.x / (dx * TRUCK.follow), 6);
  });

  it('takes the largest step that holds, not a smaller one', () => {
    const mate = mateAtLeft(120);
    const dx = 3;
    const t = fitTruck(world([mate]), dx);
    const frac = t.x / (dx * TRUCK.follow);
    const steps = [1, 0.8, 0.6, 0.4, 0.25, 0.12, 0];
    const at = steps.findIndex((x) => Math.abs(x - frac) < 1e-9);
    expect(at).toBeGreaterThanOrEqual(0); // one of the steps, not a free value
    const next = steps[at - 1];
    if (next !== undefined) {
      const bigger = boxRect(mate, { x: dx * TRUCK.follow * next, y: TRUCK.lift * next, z: 0 });
      expect(bigger.x).toBeLessThan(Math.min(boxRect(mate, ZERO).x, VIEW.w * KEEP_MARGIN) - 0.5); // the next larger step crops her
    }
  });

  it('holds the camera still when a girl is flush with the edge at rest: any slide to the right would crop her more', () => {
    expect(fitTruck(world([mateAtLeft(1)]), 2)).toEqual(ZERO);
  });

  it('holds a girl who is already cropped at rest to what she shows, never worse', () => {
    const mate = mateAtLeft(-30); // 30 px of her box is already outside the frame
    const t = fitTruck(world([mate]), 2);
    expect(boxRect(mate, t).x).toBeGreaterThanOrEqual(boxRect(mate, ZERO).x - 0.5);
  });

  it('ignores a figure that is not on the field (no rectangle) and counts the rest', () => {
    const w = world([mateAtLeft(120)]);
    const ghost = { rect: () => null };
    const t = fitTruck({ ...w, keep: [ghost, ...(w.keep ?? [])] }, 3);
    expect(t.x).toBeLessThan(3 * TRUCK.follow);
  });

  it('the planned run carries the fitted truck, and the stop is scored under it (Rikku runs, Yuna stands at the left)', () => {
    const yuna: Spot = mateAtLeft(110);
    const mates: Spot[] = [yuna, { x: -1.5, y: 0, z: 0.1 }];
    const kept = planRun(world(mates))!;
    const free = planRun(world(mates, { keep: false }))!;
    expect(free.truck.x).toBeCloseTo((free.spot.x - HOME.x) * TRUCK.follow, 6); // before: half the run, whatever it did to her
    const crop = boxRect(yuna, free.truck);
    expect(crop.x).toBeLessThan(0); // and it took Yuna out of the frame (the round-21 finding)
    const r = boxRect(yuna, kept.truck);
    expect(r.x).toBeGreaterThanOrEqual(Math.min(boxRect(yuna, ZERO).x, VIEW.w * KEEP_MARGIN) - 0.5);
    expect(kept.truck.x).toBeLessThanOrEqual((kept.spot.x - HOME.x) * TRUCK.follow + 1e-9);
  });
});
