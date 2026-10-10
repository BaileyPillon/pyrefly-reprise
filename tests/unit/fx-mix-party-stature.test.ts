import { describe, expect, it } from 'vitest';
import { Object3D, Vector3 } from 'three';
import { STATURE_KEY } from '../../src/engine/PartyStature.ts';
import { cameraAt, figOf, partyPx, type Actor, type Fig, type Pose } from '../../src/engine/fx/mix/geometry.ts';
import { limitsFor } from '../../src/engine/fx/mix/clearance.ts';
import { scaleHeld, scaleTarget } from '../../src/engine/fx/mix/masters.ts';
import { atSharedHeight, planFigOf, statureOf } from '../../src/engine/fx/mix/planFig.ts';
import { viewOf } from '../../src/engine/fx/mix/scaleLock.ts';
import { Staging } from '../../src/engine/fx/mix/staging.ts';

/**
 * r3941-heights (Bailey, 2026-10-07: "Keep camera and bosses as before"): the FFX heroes are drawn at their own heights, and CHAPTER FRAMING and BOSS SCALE
 * are handed each one at the party's shared height, so the planned camera, the party floor and every colossus's size are what they were
 * (`fx/mix/planFig.ts`). Held here: the stature is read off the actor as the stage recorded it; a hero drawn k times the shared height reads back as the
 * figure at the shared height (about his ground point, not the middle of the painting's bottom edge); a figure with no stature is read exactly as before;
 * and the numbers the planners compute from the figures (the party's mean, today's rule, BOSS SCALE's factor) are the equal-height party's.
 *
 * Game case: FFX only in effect (only the stage's FFX heroes carry a stature); the planners themselves are shared plumbing.
 */

/** The ratios the stage draws (`data/ffx/party-stature.ts`); written out so a table refinement does not move what is proved here. */
const KIMAHRI = 1.304;
const YUNA = 0.911;

/**
 * A painted figure as the mix reads it: a billboard whose content quad is `h` tall, runs from 0.1 h left to 0.4 h right of the ground point and hangs 0.05 h
 * BELOW it (a long hem, a weapon tip), the way a real painting's box is not centred on the feet. Every offset is a multiple of `h`: the figure scaled about its
 * ground point. `stature` is what the stage records on the actor for a hero it drew at k times the shared height.
 */
const actor = (name: string, facing: number, x: number, z: number, h: number, stature?: number): Actor => {
  const a = new Object3D() as unknown as Actor;
  a.name = name;
  (a as unknown as { facing: number }).facing = facing;
  (a as unknown as { worldHeight: number }).worldHeight = h;
  if (stature !== undefined) a.userData[STATURE_KEY] = stature;
  a.position.set(x, 0, z);
  a.contentQuad = (out) => {
    const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    q[0].set(-h * 0.1, -h * 0.05, 0).applyMatrix4(a.matrixWorld);
    q[1].set(h * 0.4, -h * 0.05, 0).applyMatrix4(a.matrixWorld);
    q[2].set(h * 0.4, h * 0.95, 0).applyMatrix4(a.matrixWorld);
    q[3].set(-h * 0.1, h * 0.95, 0).applyMatrix4(a.matrixWorld);
    return q;
  };
  return a;
};

const SHARED = 1.75;
/** Chapter IX's stage (`scenes/cavern-stolen-fayth.ts`): Lulu, Kimahri, Yuna on their slots, Yojimbo on his; today's idle rig. */
const IDLE: Pose = { pos: new Vector3(0, 5.1, 17.6), look: new Vector3(0.6, 1.8, 0), fov: 28 };
const W = 1600;
const H = 900;

/** The party and Yojimbo; `real`: the heroes drawn at their own heights with the stature recorded, else all at the shared height (the old picture). */
const cavern = (real: boolean): { party: Actor[]; yojimbo: Actor; actors: Actor[] } => {
  const party = [
    actor('lulu', 1, -1.11, 4.95, SHARED * (real ? 0.99 : 1), real ? 0.99 : undefined),
    actor('kimahri', 1, -0.2, 4.45, SHARED * (real ? KIMAHRI : 1), real ? KIMAHRI : undefined),
    actor('yuna', 1, 1.18, 5.03, SHARED * (real ? YUNA : 1), real ? YUNA : undefined),
  ];
  const yojimbo = actor('yojimbo', -1, 2.75, -2.0, 2.55);
  return { party, yojimbo, actors: [...party, yojimbo] };
};

const near = (a: Vector3, b: Vector3): void => {
  expect(a.x).toBeCloseTo(b.x, 9);
  expect(a.y).toBeCloseTo(b.y, 9);
  expect(a.z).toBeCloseTo(b.z, 9);
};

describe('statureOf: the factor the stage drew a figure by, read off the actor', () => {
  it('is the number the stage recorded, and 1 for a figure with none or with something that is not a factor', () => {
    expect(statureOf(actor('kimahri', 1, 0, 0, 2, KIMAHRI))).toBe(KIMAHRI);
    expect(statureOf(actor('tidus', 1, 0, 0, 2))).toBe(1);
    for (const junk of [0, -1, Number.NaN, '1.3', null, undefined, {}]) {
      const a = actor('kimahri', 1, 0, 0, 2);
      a.userData[STATURE_KEY] = junk;
      expect(statureOf(a), String(junk)).toBe(1);
    }
    expect(statureOf({} as unknown as Actor)).toBe(1); // a stub with no userData at all (the older tests' figures)
  });
});

describe('planFigOf: a hero drawn at his own height reads as the figure at the shared height', () => {
  it('gives back, to the digit, the figure the planners were always handed (feet, height, half width, every corner of the quad)', () => {
    for (const k of [KIMAHRI, YUNA, 1.062, 0.99]) {
      const real = actor('hero', 1, -0.2, 4.45, SHARED * k, k);
      const old = actor('hero', 1, -0.2, 4.45, SHARED);
      const got = planFigOf(real);
      const want = figOf(old);
      near(got.feet, want.feet);
      expect(got.h).toBeCloseTo(want.h, 9);
      expect(got.halfW).toBeCloseTo(want.halfW, 9);
      got.quad!.forEach((v, i) => near(v, want.quad![i]!));
    }
  });

  it("scales about the figure's ground point, not the middle of its bottom edge (a painting hangs below and beside its feet)", () => {
    const real = actor('kimahri', 1, 3, -2, SHARED * KIMAHRI, KIMAHRI);
    const f = planFigOf(real);
    // the ground point (3, 0, -2) stays where it is; the quad's bottom edge sits 0.05 of the SHARED height below it, not 0.05 of the drawn one
    expect(f.quad![0]!.y).toBeCloseTo(-0.05 * SHARED, 9);
    expect(f.quad![0]!.x).toBeCloseTo(3 - 0.1 * SHARED, 9);
    expect(f.quad![1]!.x).toBeCloseTo(3 + 0.4 * SHARED, 9);
  });

  it("is exactly figOf for a figure with no stature: Tidus, FFX-2's girls, an aeon, a fiend, ?stature=off", () => {
    for (const a of [actor('tidus', 1, 0, 0, SHARED), actor('yojimbo', -1, 2.75, -2, 2.55)]) {
      const got = planFigOf(a);
      const want = figOf(a);
      near(got.feet, want.feet);
      expect(got.h).toBe(want.h);
      expect(got.halfW).toBe(want.halfW);
      got.quad!.forEach((v, i) => near(v, want.quad![i]!));
    }
  });

  it("brings a lying body's footprint back too, and leaves a figure of stature 1 as the same object", () => {
    const g = new Vector3(2, 0, 3);
    const f: Fig = {
      feet: new Vector3(2.5, -0.1, 3),
      h: 2.4,
      halfW: 0.6,
      enemy: false,
      id: 'kimahri',
      quad: [new Vector3(2, -0.1, 3), new Vector3(3, -0.1, 3), new Vector3(3, 2.3, 3), new Vector3(2, 2.3, 3)],
      down: [new Vector3(2, 0, 3), new Vector3(5, 0, 3), new Vector3(5, 0, 4), new Vector3(2, 0, 4)],
    };
    const back = atSharedHeight(f, g, 1.5);
    expect(back.down![1]!.x).toBeCloseTo(2 + 3 / 1.5, 12);
    expect(back.down![2]!.z).toBeCloseTo(3 + 1 / 1.5, 12);
    expect(back.h).toBeCloseTo(1.6, 12);
    expect(atSharedHeight(f, g, 1)).toBe(f);
  });
});

describe('what the planners compute: the equal-height party, whatever the heroes are drawn at', () => {
  const cam = cameraAt(IDLE, W / H);

  it("the party's mean height on screen (today's party height, the floor under it) is the old picture's, where the live figures would have moved it", () => {
    const old = cavern(false).party.map(figOf);
    const real = cavern(true).party;
    const planned = partyPx(real.map(planFigOf), cam, W, H);
    expect(planned).toBeCloseTo(partyPx(old, cam, W, H), 6);
    expect(Math.abs(partyPx(real.map(figOf), cam, W, H) / partyPx(old, cam, W, H) - 1)).toBeGreaterThan(0.02); // the drawn party really is taller: planFigOf is doing the work
  });

  it("today's rule (the floor, the overlap and boss-cover limits) is the old one's", () => {
    const field = { W, H, view: { l: 0, r: W, t: 0, b: H }, panels: [{ l: 0, r: W, t: 0, b: 120 }] };
    const old = cavern(false);
    const real = cavern(true);
    const a = limitsFor([...old.party, old.yojimbo].map(figOf), IDLE, field);
    const b = limitsFor([...real.party, real.yojimbo].map(planFigOf), IDLE, field);
    expect(b.todayPx).toBeCloseTo(a.todayPx, 6);
    expect(b.rule.floorPx).toBeCloseTo(a.rule.floorPx, 6);
    expect(b.rule.overlapMax).toBeCloseTo(a.rule.overlapMax, 9);
    expect(b.rule.bossCoverMax).toBeCloseTo(a.rule.bossCoverMax, 9);
  });

  it("BOSS SCALE's factor for a colossus (the party's mean in angular size) is the old one, step by step", () => {
    for (const frac of [1, 0.7, 0.35]) {
      const factor = (real: boolean): number => {
        const { actors, yojimbo } = cavern(real);
        yojimbo.name = 'evrae'; // a sized colossus (Natus's BOSS SCALE entry is retired: r3942-giants-ffx)
        const staging = new Staging();
        staging.planScale(actors, IDLE.pos, scaleTarget, frac);
        return staging.plan.get(yojimbo)?.k ?? 1;
      };
      expect(factor(true), `step ${frac}`).toBeCloseTo(factor(false), 9);
      expect(factor(false), `step ${frac} grows`).toBeGreaterThan(1);
    }
  });

  it("BOSS SCALE's held size (Yojimbo's 1.15 times the party, read off the picture) is the old one", () => {
    const factor = (real: boolean): number => {
      const { actors, yojimbo } = cavern(real);
      const staging = new Staging();
      staging.planScale(actors, IDLE.pos, scaleTarget, 0, { held: scaleHeld, view: viewOf(IDLE, { width: W, height: H }) });
      return staging.plan.get(yojimbo)?.k ?? 1;
    };
    expect(factor(true)).toBeCloseTo(factor(false), 9);
  });
});
