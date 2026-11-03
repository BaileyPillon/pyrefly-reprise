/**
 * **Valefor's whole-body life** (`src/engine/ww3d/bossMotion.ts`, `layout.ts` `BOSS_YAW_DEG`; the hidden Wind Waker chapter, FFX-2 only), pinned as pure maths: the three-quarter yaw TARGET-C shows (she was front-on in
 * phase 2, stills 21, 23, 24), the slow hover bob with a pitch and roll sway on top, and the lunge at her blows.
 */
import { describe, expect, it } from 'vitest';

import { BossMotion, LUNGE, SWAY, bossSway, lungeCurve } from '../../../src/engine/ww3d/bossMotion.ts';
import { TARGET_POSITION } from '../../../src/engine/ww3d/camera.ts';
import { BOSS_BOB, BOSS_OFF_DEG, BOSS_SPOT, BOSS_YAW_DEG, rad, yawToward } from '../../../src/engine/ww3d/layout.ts';

const deg = (r: number): number => (r * 180) / Math.PI;

describe("her yaw", () => {
  it('is three-quarter to the lens, turned toward the party: the direction to the lens, minus 50 degrees', () => {
    const toLens = deg(yawToward(BOSS_SPOT, TARGET_POSITION));
    expect(toLens).toBeCloseTo(-24.8, 0); // the lens is almost straight ahead of her, a little to the left
    expect(BOSS_YAW_DEG).toBeCloseTo(toLens - BOSS_OFF_DEG, 0); // the literal is the derivation, to the degree
    expect(BOSS_YAW_DEG, 'phase 2 had -28, which is square to the lens').toBeLessThan(-60);
    expect(BOSS_YAW_DEG).toBeGreaterThan(-90); // never past side-on: her face stays in the picture
    // off the lens by about half a right angle; toward the party is toward -x, whose bearing from her is -50 degrees
    expect(Math.abs(BOSS_YAW_DEG - toLens)).toBeGreaterThan(40);
    expect(Math.abs(BOSS_YAW_DEG - toLens)).toBeLessThan(60);
  });
});

describe('the sway', () => {
  it('stays inside its amplitudes at any time and at any activity', () => {
    for (let t = 0; t < 120; t += 0.37) {
      for (const a of [0, 0.5, 1]) {
        const k = 1 + (SWAY.activeGain - 1) * a;
        const s = bossSway(t, a);
        expect(Math.abs(s.pitch)).toBeLessThanOrEqual(rad(SWAY.pitchDeg) * k + 1e-9);
        expect(Math.abs(s.roll)).toBeLessThanOrEqual(rad(SWAY.rollDeg) * k + 1e-9);
        expect(Math.abs(s.yaw)).toBeLessThanOrEqual(rad(SWAY.yawDeg) * k + 1e-9);
        expect(Math.abs(s.bob)).toBeLessThanOrEqual(BOSS_BOB.amplitude + SWAY.bobExtra + 1e-9);
      }
    }
  });

  it('starts at rest, is slight (a few degrees), and moves: pitch, roll and bob each on their own period so the loop is long', () => {
    const s0 = bossSway(0);
    expect([s0.pitch, s0.yaw, s0.bob]).toEqual([0, 0, 0]);
    expect(deg(SWAY.pitchDeg * Math.PI / 180)).toBeLessThan(6);
    expect(SWAY.rollDeg).toBeLessThan(8);
    // different periods: the pitch and the roll are not in step
    const seen = new Set<string>();
    for (let t = 0; t < 30; t += 0.5) {
      const s = bossSway(t);
      seen.add(`${Math.sign(s.pitch)}${Math.sign(s.roll)}`);
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
    // her action swings it wider
    const peak = (a: number): number => Math.max(...Array.from({ length: 400 }, (_, i) => Math.abs(bossSway(i * 0.05, a).roll)));
    expect(peak(1)).toBeGreaterThan(peak(0) * 1.2);
  });
});

describe('the lunge', () => {
  it('draws back through the windup, thrusts at the blow, and settles to rest', () => {
    const L = 1;
    expect(lungeCurve(0, L, null)).toBeCloseTo(0, 9);
    expect(lungeCurve(0.5, L, null)).toBeLessThan(0); // drawing back
    expect(lungeCurve(L - 1e-6, L, null)).toBeCloseTo(-LUNGE.drawBack, 3);
    expect(lungeCurve(L + LUNGE.thrust, L, null)).toBeCloseTo(1, 9); // the thrust's end
    const after = (t: number): number => lungeCurve(L + LUNGE.thrust + t, L, null);
    expect(after(LUNGE.settle / 2)).toBeLessThan(1);
    expect(after(LUNGE.settle / 2)).toBeGreaterThan(0);
    expect(after(LUNGE.settle)).toBeCloseTo(0, 9);
    // a reported blow overrides the lead: the thrust starts then
    expect(lungeCurve(0.3, L, 0)).toBeCloseTo(-LUNGE.drawBack, 9);
    expect(lungeCurve(0.3, L, LUNGE.thrust)).toBeCloseTo(1, 9);
  });

  it('is a small move: a half metre along her facing and a nose-down tilt of under ten degrees at its peak', () => {
    expect(LUNGE.reach).toBeLessThanOrEqual(0.6);
    expect(LUNGE.pitchDeg).toBeLessThanOrEqual(10);
    const m = new BossMotion();
    m.open(0.5);
    let reach = 0;
    let tilt = 0;
    for (let i = 0; i < 200; i++) {
      const p = m.update(0.01);
      reach = Math.max(reach, p.forward);
      tilt = Math.max(tilt, p.pitch);
    }
    expect(reach).toBeGreaterThan(0.3);
    expect(reach).toBeLessThanOrEqual(LUNGE.reach + 1e-9);
    expect(deg(tilt)).toBeGreaterThan(5);
    expect(deg(tilt)).toBeLessThan(SWAY.pitchDeg * SWAY.activeGain + LUNGE.pitchDeg + 0.1);
  });

  it('the state follows the beats: an open starts it, an impact thrusts at once, and it is at rest again afterward, with the model scale applied', () => {
    const m = new BossMotion();
    expect(m.lunge).toBe(0);
    m.open(2);
    m.update(0.5);
    expect(m.lunge).toBeLessThan(0);
    m.impact(); // the blow lands early
    m.update(LUNGE.thrust);
    expect(m.lunge).toBeCloseTo(1, 6);
    m.update(LUNGE.settle + 0.05);
    expect(m.lunge).toBe(0);
    // a blow never reported still thrusts at the lead, then ends
    m.open(0.4);
    m.update(0.4 + LUNGE.thrust);
    expect(m.lunge).toBeCloseTo(1, 6);
    m.update(LUNGE.settle + 0.1);
    expect(m.lunge).toBe(0);
    // an impact with nothing open is ignored
    const fresh = new BossMotion();
    fresh.impact();
    expect(fresh.lunge).toBe(0);
    // scale: a figure half the native size moves half as far
    const a = new BossMotion();
    const b = new BossMotion();
    a.open(0.3);
    b.open(0.3);
    a.update(0.3 + LUNGE.thrust, 1);
    const half = b.update(0.3 + LUNGE.thrust, 0.5);
    expect(half.forward).toBeCloseTo(0.5 * LUNGE.reach, 6);
  });
});
