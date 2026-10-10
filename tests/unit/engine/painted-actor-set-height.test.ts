/**
 * **The real actor, told a new height (`PaintedActor.setWorldHeight`; FFX only, Chapter II's Lady Yunalesca; branch r3943-int).**
 *
 * The stage calls it at a form change when the scene names a height for the painting going out or the one coming in (`SceneStaging.formHeights`, `stage-form-heights.test.ts` is the stage's half).
 * This test builds the REAL actor (the head-lock fixture's real pose records and registration rows) at the stage's boss height and holds what the swap asks of it:
 *
 * - the figure is the new height (`height`), every plane is the ratio times what it was, and the feet stay on the ground line;
 * - the contact shadow and the turn ring take the radii they are given, and **going back to the first height gives the first numbers bit for bit**: planes, shadow and ring, which is what keeps
 *   Yunalesca's second and third forms exactly as they were;
 * - a height equal to the current one, and a radius for a mark the actor does not have, change nothing.
 *
 * **Game case: FFX only** [AGENTS.md rule 14] (the actor is shared plumbing; only Chapter II's scene names a per-form height).
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { Mesh } from 'three';
import { POSES, PaintedActor, painting, reset, slotOf, type Actor } from './head-lock-fixture.ts';

afterEach(reset);

const SHARED = 4.1;
const FIRST = 2.577;

type Scale = { height: number; width: number; offsetY: number; anchorY: number; unitsPerPixel: number };
const planeOf = (a: Actor, pose: string): Scale => {
  a.setPose(pose, { immediate: true, force: true });
  return (slotOf(a, pose) as unknown as { scale: Scale }).scale;
};
const marks = (a: Actor): { shadow: Mesh; ring: Mesh } => a as unknown as { shadow: Mesh; ring: Mesh } & Record<string, never>;

/** A boss-like actor: enemy side, a contact shadow and a turn ring at the stage's boss radii, life off so a frame is the same frame. */
function boss(worldHeight: number): Actor {
  const a = new PaintedActor({
    name: 'yunalesca',
    worldHeight,
    side: 'enemy',
    breathe: false,
    sway: false,
    life: false,
    interimYaw: false,
    shadow: { radius: 1.5 },
    turnRing: { radius: 1.7 },
  });
  a.adoptPoses(Object.fromEntries(POSES.map((p) => [p, painting('yuna', p)])), 'idle');
  a.position.set(2.8, 0, -4);
  return a;
}

/** The shadow's drawn radius after one update (the ring's drawn radius pulses with the actor's clock, so its authored radius is read instead). */
function drawnShadow(a: Actor): number {
  a.update(1 / 60);
  return (a as unknown as { shadow: Mesh }).shadow.scale.x;
}

/** The radii the stage authored the marks at: the numbers the actor draws them from. */
const authored = (a: Actor): { shadow: number; ring: number } => {
  const m = a as unknown as { shadowBaseRadius: number; ringBaseRadius: number };
  return { shadow: m.shadowBaseRadius, ring: m.ringBaseRadius };
};

describe('PaintedActor.setWorldHeight', () => {
  it('stands the figure at the new height: every plane the ratio of what it was, the feet on the ground line', () => {
    const a = boss(SHARED);
    const before = POSES.map((p) => ({ ...planeOf(a, p) }));
    a.setWorldHeight(FIRST, { shadow: 1.5 * (FIRST / SHARED), ring: 1.7 * (FIRST / SHARED) });
    expect(a.height).toBe(FIRST);
    POSES.forEach((p, i) => {
      const s = planeOf(a, p);
      expect(s.height / before[i]!.height, `${p} plane height`).toBeCloseTo(FIRST / SHARED, 9);
      expect(s.width / before[i]!.width, `${p} plane width`).toBeCloseTo(FIRST / SHARED, 9);
      expect(s.offsetY + s.height / 2 - s.anchorY * s.unitsPerPixel, `${p} feet`).toBeCloseTo(0, 9);
    });
  });

  it('puts the contact shadow and the turn ring at the radii it is given', () => {
    const a = boss(SHARED);
    expect(authored(a)).toEqual({ shadow: 1.5, ring: 1.7 });
    const was = drawnShadow(a);
    expect(was).toBeGreaterThan(1.4);
    a.setWorldHeight(FIRST, { shadow: 1.5 * (FIRST / SHARED), ring: 1.7 * (FIRST / SHARED) });
    expect(authored(a).shadow).toBeCloseTo(1.5 * (FIRST / SHARED), 12);
    expect(authored(a).ring).toBeCloseTo(1.7 * (FIRST / SHARED), 12);
    expect(drawnShadow(a) / was).toBeCloseTo(FIRST / SHARED, 4); // the drawn shadow follows (the squash of the first frame is the same one)
  });

  it('going back to the first height and its radii gives the first numbers bit for bit: the planes, the shadow and the ring', () => {
    const a = boss(SHARED);
    const planes = POSES.map((p) => ({ ...planeOf(a, p) }));
    const radii = authored(a);
    const shadowDrawn = drawnShadow(a);
    a.setWorldHeight(FIRST, { shadow: 1.5 * (FIRST / SHARED), ring: 1.7 * (FIRST / SHARED) });
    POSES.forEach((p) => planeOf(a, p));
    a.setWorldHeight(SHARED, { shadow: 1.5, ring: 1.7 });
    expect(a.height).toBe(SHARED);
    POSES.forEach((p, i) => {
      const s = planeOf(a, p);
      for (const k of ['height', 'width', 'offsetY', 'anchorY', 'unitsPerPixel'] as const) expect(Object.is(s[k], planes[i]![k]), `${p} ${k}`).toBe(true);
    });
    const back = authored(a);
    expect(Object.is(back.shadow, radii.shadow)).toBe(true);
    expect(Object.is(back.ring, radii.ring)).toBe(true);
    expect(drawnShadow(a)).toBeCloseTo(shadowDrawn, 4); // the same blob once the first height's frame has been drawn again
  });

  it('changes nothing for a height equal to the current one, and ignores a radius for a mark the actor does not have', () => {
    const a = boss(SHARED);
    const planes = POSES.map((p) => ({ ...planeOf(a, p) }));
    a.setWorldHeight(SHARED);
    POSES.forEach((p, i) => expect(planeOf(a, p)).toEqual(planes[i]));
    const bare = new PaintedActor({ name: 'bare', worldHeight: SHARED, side: 'enemy', breathe: false, sway: false, life: false, interimYaw: false, shadow: false, turnRing: false });
    bare.adoptPoses(Object.fromEntries(POSES.map((p) => [p, painting('yuna', p)])), 'idle');
    expect(() => bare.setWorldHeight(FIRST, { shadow: 1, ring: 1 })).not.toThrow();
    expect(bare.height).toBe(FIRST);
    expect(marks(bare).shadow ?? null).toBeNull();
  });
});
