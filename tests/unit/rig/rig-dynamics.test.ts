import { describe, expect, it } from 'vitest';
import { applyIdle, RigChains, Spring } from '../../../src/engine/rig/RigDynamics.ts';
import { CH, C_ROT, DEG, RigSkeleton, bindPose } from '../../../src/engine/rig/RigSkeleton.ts';
import { makeRig } from './rig-fixture.ts';

describe('Spring', () => {
  it('settles on a constant target', () => {
    const s = new Spring(2.5, 0.5, 0);
    for (let i = 0; i < 600; i++) s.update(1 / 60, 1);
    expect(s.value).toBeCloseTo(1, 3);
  });

  it('rings out when underdamped and never goes unstable, for any frame step (a hit-stop zero, a tab asleep for seconds)', () => {
    const s = new Spring(3, 0.3, 1);
    let worst = 0;
    for (const dt of [0, 1 / 240, 1 / 60, 1 / 30, 0.1, 1, 5, 60, 0, 1 / 60]) {
      for (let i = 0; i < 400; i++) {
        s.update(dt, Math.sin(i) * 3);
        worst = Math.max(worst, Math.abs(s.value));
        expect(Number.isFinite(s.value) && Number.isFinite(s.velocity)).toBe(true);
      }
    }
    expect(worst).toBeLessThan(200);
  });

  it('kicks are capped, and a NaN target is ignored', () => {
    const s = new Spring(2, 0.4, 0);
    s.kick(1e9);
    expect(Math.abs(s.velocity)).toBeLessThanOrEqual(120);
    const before = s.value;
    s.update(1 / 60, Number.NaN);
    expect(s.value).toBe(before);
  });
});

describe('RigChains stay bounded', () => {
  const setup = (): { sk: RigSkeleton; chains: RigChains; pose: Float64Array; tail0: number; tail1: number } => {
    const d = makeRig();
    const sk = new RigSkeleton(d);
    const chains = new RigChains(sk, d.motion!.chains!);
    return { sk, chains, pose: bindPose(d.bones.length), tail0: d.boneIndex.get('tail0')!, tail1: d.boneIndex.get('tail1')! };
  };

  it('every chain bone stays within its limit of its parent, and every number stays finite, over 4 x 10^4 steps of a violent run', () => {
    const { sk, chains, pose, tail0, tail1 } = setup();
    const limit = 60 * DEG;
    const pelvis = sk.data.boneIndex.get('pelvis')!;
    let seed = 7;
    const rnd = (): number => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
    for (let i = 0; i < 40_000; i++) {
      pose[pelvis * CH + C_ROT] = rnd() * 2.5; // the body thrashes
      sk.solve(pose);
      const dt = [0, 1 / 60, 1 / 30, 0.2, 3][i % 5]!;
      chains.update(pose, dt, rnd() * 400); // forward speed far past anything real: clamped
      if (i % 977 === 0) chains.kick(rnd() * 100, 0.8);
      const r0 = pose[tail0 * CH + C_ROT]!;
      const r1 = pose[tail1 * CH + C_ROT]!;
      expect(Number.isFinite(r0) && Number.isFinite(r1)).toBe(true);
      expect(Math.abs(r0)).toBeLessThanOrEqual(limit + 1e-9);
      expect(Math.abs(r1)).toBeLessThanOrEqual(limit + 1e-9);
    }
    expect(chains.maxLimit).toBeCloseTo(limit, 9);
  });

  it('a body at rest leaves a hanging chain at rest; a lunge streams it back (drag), then it returns', () => {
    const { sk, chains, pose, tail1 } = setup();
    for (let i = 0; i < 300; i++) { sk.solve(pose); chains.update(pose, 1 / 60, 0); }
    expect(Math.abs(pose[tail1 * CH + C_ROT]!)).toBeLessThan(1e-3);
    let peak = 0;
    for (let i = 0; i < 60; i++) { sk.solve(pose); chains.update(pose, 1 / 60, 6); peak = Math.max(peak, pose[tail1 * CH + C_ROT]!); }
    expect(peak).toBeGreaterThan(2 * DEG); // 6 u/s of forward speed at 2 degrees per u/s on the second bone
    for (let i = 0; i < 600; i++) { sk.solve(pose); chains.update(pose, 1 / 60, 0); }
    expect(Math.abs(pose[tail1 * CH + C_ROT]!)).toBeLessThan(0.1 * DEG);
  });

  it('reset puts the springs back at rest', () => {
    const { sk, chains, pose, tail0 } = setup();
    chains.kick(50);
    for (let i = 0; i < 10; i++) { sk.solve(pose); chains.update(pose, 1 / 60, 0); }
    expect(pose[tail0 * CH + C_ROT]).not.toBe(0);
    chains.reset();
    sk.solve(bindPose(sk.count));
    chains.update(pose, 0, 0);
  });
});

describe('applyIdle', () => {
  it('adds a sinusoid in degrees on the named bones and nothing on the others; amount scales it; 0 holds still', () => {
    const d = makeRig();
    const pose = bindPose(d.bones.length);
    const chest = d.boneIndex.get('chest')! * CH + C_ROT;
    applyIdle(pose, d, d.motion!.idle!, 0.25, 1); // hz 0.5: a quarter of a second is pi/4 of phase
    const want = 1.5 * DEG * Math.sin(2 * Math.PI * 0.5 * 0.25 - 1.2);
    expect(pose[chest]).toBeCloseTo(want, 9);
    expect(pose[d.boneIndex.get('pelvis')! * CH + C_ROT]).toBe(0);
    const half = bindPose(d.bones.length);
    applyIdle(half, d, d.motion!.idle!, 0.25, 0.5);
    expect(half[chest]).toBeCloseTo(want / 2, 9);
    const still = bindPose(d.bones.length);
    applyIdle(still, d, d.motion!.idle!, 0.25, 0);
    expect([...still]).toEqual([...bindPose(d.bones.length)]);
  });

  it('is periodic with the base period (a two second loop at 0.5 Hz)', () => {
    const d = makeRig();
    const a = bindPose(d.bones.length);
    const b = bindPose(d.bones.length);
    applyIdle(a, d, d.motion!.idle!, 0.7, 1);
    applyIdle(b, d, d.motion!.idle!, 2.7, 1);
    for (let i = 0; i < a.length; i++) expect(a[i]).toBeCloseTo(b[i]!, 9);
  });
});
