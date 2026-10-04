/**
 * r38-motion RUN-IN's stand-off (`motion/StandOff.ts`, FFX-2 only): where a girl stops. The projection here is a plain pinhole
 * camera, so the rules are checked as geometry (the browser pass runs the same planner on the real staging of every chapter).
 */
import { describe, expect, it } from 'vitest';
import { planRun, STAND_OFF, type RunWorld } from '../../src/engine/motion/StandOff.ts';
import type { PaintedSpan, Rect, Spot } from '../../src/engine/motion/StageMotionPort.ts';

const VIEW = { w: 1600, h: 900 };
const CAM = { x: 0.5, y: 2.3, z: 8.2, f: 1100 };

/** Pinhole: x right, y up, z toward the camera; the camera looks down -z. */
function project(p: Spot, truck: Spot): { x: number; y: number; k: number } {
  const d = CAM.z + truck.z - p.z;
  const k = CAM.f / d;
  return { x: VIEW.w / 2 + (p.x - (CAM.x + truck.x)) * k, y: VIEW.h * 0.5 + (CAM.y + truck.y - p.y) * k, k };
}

/** A painted box 0.9 wide and `h` tall, feet at `at`, as a screen rectangle. */
function boxRect(at: Spot, w: number, h: number, truck: Spot): Rect {
  const a = project({ x: at.x - w / 2, y: at.y + h, z: at.z }, truck);
  const b = project({ x: at.x + w / 2, y: at.y, z: at.z }, truck);
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
}

const girlSpan = (at: Spot): PaintedSpan => ({ x0: at.x - 0.45, x1: at.x + 0.45, y0: 0, y1: 1.8, z: at.z });

interface Scene {
  home: Spot;
  boss: PaintedSpan;
  mates: Spot[];
}

/** Bahamut's chapter, roughly: Paine at the back right of three, the boss far behind and wide. */
const BEVELLE: Scene = {
  home: { x: -0.75, y: 0, z: -1.5 },
  boss: { x0: -0.9, x1: 3.9, y0: 0, y1: 6, z: -5.8 },
  mates: [{ x: -2.2, y: 0, z: 1.45 }, { x: -1.5, y: 0, z: 0.1 }],
};

function world(s: Scene, o: { bossSpan?: PaintedSpan } = {}): RunWorld {
  const boss = o.bossSpan ?? s.boss;
  return {
    home: s.home,
    girl: girlSpan(s.home),
    target: boss,
    rectOf: (at, truck) => boxRect(at, 0.9, 1.8, truck),
    targetRect: (truck) => {
      const a = project({ x: boss.x0, y: boss.y1, z: boss.z }, truck);
      const b = project({ x: boss.x1, y: boss.y0, z: boss.z }, truck);
      return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
    },
    others: s.mates.map((m) => ({ z: m.z, rect: (truck: Spot) => boxRect(m, 0.9, 1.8, truck) })),
    view: VIEW,
  };
}

describe('the stand-off', () => {
  it('runs her toward the boss on screen, big and in frame, not into the picture', () => {
    const plan = planRun(world(BEVELLE))!;
    expect(plan.dir).toBe(1);
    expect(plan.spot.x).toBeGreaterThan(BEVELLE.home.x + 1); // a run you can see
    expect(plan.why.travelPx).toBeGreaterThan(VIEW.w * 0.1);
    expect(plan.why.scale).toBeGreaterThan(0.85); // she does not shrink into the distance
    expect(Math.abs(plan.spot.z - BEVELLE.home.z)).toBeLessThan(3.5); // and does not go deep to the boss's plane
  });

  it('never stands in the boss\'s depth slab across its painted span (the hard rule), however the scene is arranged', () => {
    for (const z of [-5.8, -3, -1.2, 0.4]) {
      const s = { ...BEVELLE, boss: { ...BEVELLE.boss, z }, home: { x: -0.75, y: 0, z: z + 1.0 } };
      const plan = planRun(world(s)); // null is the honest answer when every stop would be inside the boss: the strike then plays as today
      if (!plan) continue;
      const inSlab = Math.abs(plan.spot.z - z) < STAND_OFF.slab && plan.spot.x + 0.45 > s.boss.x0 && plan.spot.x - 0.45 < s.boss.x1;
      expect(inSlab, `boss z ${z}: stop ${JSON.stringify(plan.spot)}`).toBe(false);
    }
  });

  it('is not hidden behind a teammate who is nearer the camera where she stops', () => {
    // Rikku stands right where a run along Paine's own lane would end.
    const s: Scene = { ...BEVELLE, mates: [...BEVELLE.mates, { x: 0.9, y: 0, z: 0.2 }] };
    const plan = planRun(world(s))!;
    expect(plan.why.covered).toBeLessThan(0.15);
    // the same stop with nobody there would have been free; with her, the planner chose a place she is not covered
    const blocked = world(s);
    const r = blocked.rectOf(plan.spot, plan.truck)!;
    const rikku = boxRect({ x: 0.9, y: 0, z: 0.2 }, 0.9, 1.8, plan.truck);
    const overlap = Math.max(0, Math.min(r.x + r.w, rikku.x + rikku.w) - Math.max(r.x, rikku.x)) / r.w;
    expect(plan.spot.z > 0.2 || overlap < 0.2).toBe(true);
  });

  it('reads the boss\'s width: a wider boss lets her run further than a narrow one beside the party', () => {
    const narrow = planRun(world(BEVELLE, { bossSpan: { x0: 0.2, x1: 1.4, y0: 0, y1: 3, z: -5.8 } }))!;
    const wide = planRun(world(BEVELLE, { bossSpan: { x0: 0.2, x1: 7.4, y0: 0, y1: 6, z: -5.8 } }))!;
    expect(wide.distance).toBeGreaterThanOrEqual(narrow.distance);
    expect(narrow.spot.x).toBeLessThan(1.6); // she stops by a narrow boss, not past it
  });

  it('follows the run with a truck of half its sideways travel and a small lift, never a pan', () => {
    const plan = planRun(world(BEVELLE))!;
    expect(plan.truck.x).toBeCloseTo((plan.spot.x - BEVELLE.home.x) * 0.5, 6);
    expect(plan.truck.y).toBeCloseTo(0.1, 6);
    expect(plan.truck.z).toBe(0);
  });

  it('plans nothing, and the strike plays as today, when she cannot be placed on screen', () => {
    expect(planRun({ ...world(BEVELLE), rectOf: () => null })).toBeNull();
  });

  it('comes from the side she is on: a girl to the right of her target runs left', () => {
    const s: Scene = { home: { x: 3, y: 0, z: -1 }, boss: { x0: -1.5, x1: 0.5, y0: 0, y1: 3, z: -5 }, mates: [] };
    const plan = planRun(world(s))!;
    expect(plan.dir).toBe(-1);
    expect(plan.spot.x).toBeLessThan(s.home.x);
  });
});
