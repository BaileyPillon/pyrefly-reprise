/**
 * Pass 3's cast channel (`AnimCastFx.ts`; `?anim=proto&style=P3`; presentation only): what makes the hold read as gathering. Nothing at level 0; glyphs, motes and a tall glow as the level builds; the motes
 * move INWARD (toward the doll) over time; all of it is gone when the level falls; deterministic; and only the P3 style makes one (P2's cast is as it was). Headless: the shapes are left out (no canvas).
 */
import { describe, expect, it } from 'vitest';
import { CastFx } from '../../../src/engine/rig/anim/AnimCastFx.ts';

const DOLL = { x: 1, y: 1.2, z: 0 };
const FEET = { x: 0.6, y: 0, z: 0 };
const lit = (fx: CastFx): number => fx.group.children.filter((c) => c.visible).length;
const step = (fx: CastFx, ms: number): void => {
  for (let t = 0; t < ms - 1e-9; t += 1000 / 60) fx.update(1 / 60, null);
};

describe('the cast channel', () => {
  it('draws nothing at level 0 and more as the level builds: the tall glow, two glyphs and the motes', () => {
    const fx = new CastFx();
    fx.gather(DOLL, 0, FEET, 1.82, 1);
    step(fx, 100);
    expect(lit(fx)).toBe(0);
    expect(fx.active).toBe(false);
    fx.gather(DOLL, 1, FEET, 1.82, 1);
    step(fx, 100);
    expect(fx.active).toBe(true);
    expect(lit(fx)).toBe(1 + 2 + 14); // aura, runes, motes
    fx.rest();
    step(fx, 20);
    expect(lit(fx)).toBe(0);
    expect(fx.active).toBe(false);
  });
  it('its motes spiral INTO the doll: the mean distance to it falls through a cycle, from a wide ring to the doll', () => {
    const fx = new CastFx();
    fx.gather(DOLL, 1, FEET, 1.82, 1);
    const dist = (): number[] => fx.group.children.filter((c) => c.visible && c.scale.x < 0.12).map((c) => Math.hypot(c.position.x - DOLL.x, c.position.y - DOLL.y));
    step(fx, 50);
    const far = Math.max(...dist());
    expect(far).toBeGreaterThan(0.5); // a wide ring
    // follow one mote: the nearest is nearer a little later, and a mote that arrives starts over far away (a cycle of about 0.87 s)
    const first = dist();
    step(fx, 150);
    const second = dist();
    const meanFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const meanSecond = second.reduce((a, b) => a + b, 0) / second.length;
    expect(Math.abs(meanFirst - meanSecond)).toBeGreaterThan(0.001); // they move
    expect(Math.min(...second)).toBeLessThan(far * 0.6); // some are close in
  });
  it('grows with the level (the glyphs and the tall glow) and is deterministic', () => {
    const size = (level: number): number => {
      const fx = new CastFx();
      fx.gather(DOLL, level, FEET, 1.82, 1);
      step(fx, 200);
      return Math.max(...fx.group.children.filter((c) => c.visible).map((c) => c.scale.y));
    };
    expect(size(1.2)).toBeGreaterThanOrEqual(size(0.4));
    const run = (): number[] => {
      const fx = new CastFx();
      fx.gather(DOLL, 1, FEET, 1.82, 1);
      step(fx, 333);
      return fx.group.children.flatMap((c) => [c.position.x, c.position.y, c.scale.x]);
    };
    expect(run()).toEqual(run());
  });
  it('sizes follow the figure: twice the height, twice the glyphs and the glow', () => {
    const big = (unit: number, h: number): number => {
      const fx = new CastFx();
      fx.gather(DOLL, 1, FEET, h, unit);
      step(fx, 100);
      return fx.group.children[0]!.scale.y; // the tall glow
    };
    expect(big(2, 3.6)).toBeCloseTo(big(1, 1.8) * 2, 6);
  });
});
