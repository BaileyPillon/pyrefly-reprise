/**
 * r3941-heights (Bailey, 2026-10-07: "Keep camera and bosses as before"): on an upright phone the master is refitted at each battle start until the
 * whole fight fits one slice (A-12, `ShotRules.fitPhone` through `FrameFit.fitRigToSlice`), and that refit read the party's live quads, so a taller
 * Kimahri or Wakka stood the camera farther back and a shorter Yuna or Rikku let it come nearer. The refit now reads each hero at the party's shared
 * height (`FitSubject.shared`, `engine/SharedHeight.ts`), so the phone's camera is where it was; a push that must not cut a head (A-11) still reads
 * the figure as drawn.
 *
 * Game case: FFX only in effect (only the stage's FFX heroes carry a stature); `FrameFit` is shared plumbing and a figure with no stature is untouched.
 */
import { describe, expect, it } from 'vitest';
import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { fitRigToSlice, frameFit, type FitSubject } from '../../../src/engine/FrameFit.ts';
import { STATURE_KEY } from '../../../src/engine/PartyStature.ts';

/** What the hero's shared height is in each scenario: 4 makes the refit RAISE the camera on its pedestal to clear the phone HUD's top band; 6 makes it STAND BACK as well. */
const SCENES = [{ name: 'raises the camera', shared: 4 }, { name: 'stands the camera back', shared: 6 }] as const;
const live = new PerspectiveCamera(40, 16 / 9, 0.1, 200);

/** A hero as the stage draws him: the shared figure scaled by `k` about his ground point (a billboard centred on his feet, the way a painting is), with `k` recorded when it is not 1. */
function hero(k: number, shared = 4, x = 0): FitSubject['actor'] {
  const o = new Object3D();
  o.position.set(x, 0, 0);
  if (k !== 1) o.userData[STATURE_KEY] = k;
  const h = shared * k;
  return Object.assign(o, {
    contentQuad(out?: [Vector3, Vector3, Vector3, Vector3]) {
      const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
      q[0].set(x - 0.3 * h, -0.05 * h, 0);
      q[1].set(x + 0.3 * h, -0.05 * h, 0);
      q[2].set(x + 0.3 * h, 0.95 * h, 0);
      q[3].set(x - 0.3 * h, 0.95 * h, 0);
      return q;
    },
  }) as unknown as FitSubject['actor'];
}

const rig = (): { position: Vector3; lookAt: Vector3 } => ({ position: new Vector3(0, 1, 12), lookAt: new Vector3(0, 1, 0) });

/** The rig the refit leaves for a party of one hero drawn at `k` (read at the shared height or as drawn). */
const refit = (k: number, read: 'shared' | 'drawn', height = 4, top = 0.3): { position: Vector3; lookAt: Vector3 } => {
  const r = rig();
  fitRigToSlice(live, r, 0.5, [{ actor: hero(k, height), min: 1, ...(read === 'shared' ? { shared: true } : {}) }], top);
  return r;
};

describe('the phone refit (A-12) places the camera for the party at the shared height', () => {
  for (const s of SCENES) {
    it(`leaves the camera where it was for a hero drawn taller (Kimahri x1.304) or shorter (Yuna x0.911), where the old fit ${s.name}`, () => {
      const old = refit(1, 'shared', s.shared);
      const bare = rig();
      expect(old.position.distanceTo(bare.position), 'the refit does move the rig, so there is something to compare').toBeGreaterThan(0.5);
      for (const k of [1.304, 1.201, 1.062, 0.99, 0.911]) {
        const r = refit(k, 'shared', s.shared);
        expect(r.position.x, `x ${k}`).toBeCloseTo(old.position.x, 9);
        expect(r.position.y, `y ${k}`).toBeCloseTo(old.position.y, 9);
        expect(r.position.z, `z ${k}`).toBeCloseTo(old.position.z, 9);
        expect(r.lookAt.y, `look ${k}`).toBeCloseTo(old.lookAt.y, 9);
      }
    });
  }

  it('would have moved it, read as drawn: a taller hero lifts the camera higher or stands it farther back, a shorter one less (what this change stops)', () => {
    for (const s of SCENES) {
      const old = refit(1, 'shared', s.shared);
      const taller = refit(1.304, 'drawn', s.shared);
      const shorter = refit(0.911, 'drawn', s.shared);
      expect(taller.position.y + taller.position.z, s.name).toBeGreaterThan(old.position.y + old.position.z + 0.5);
      expect(shorter.position.y + shorter.position.z, s.name).toBeLessThan(old.position.y + old.position.z - 0.2);
    }
  });

  it('is exactly the old fit for a figure with no stature, shared or not (Tidus, FFX-2, a fiend, ?stature=off)', () => {
    for (const s of SCENES) {
      const a = refit(1, 'shared', s.shared);
      const b = refit(1, 'drawn', s.shared);
      expect(a.position.toArray(), s.name).toEqual(b.position.toArray());
      expect(a.lookAt.toArray(), s.name).toEqual(b.lookAt.toArray());
    }
  });

  it("a push that must not cut a head still reads the figure as drawn (A-11 is not told to ignore the stature)", () => {
    const r = { position: new Vector3(0, 1, 12), lookAt: new Vector3(0, 1, 0) };
    const tall = frameFit(live, r, 0.5, [{ actor: hero(1.304), min: 1 }]);
    const normal = frameFit(live, r, 0.5, [{ actor: hero(1), min: 1 }]);
    expect(tall.worst).toBeLessThan(normal.worst + 1e-9);
    expect(tall.push).toBeLessThanOrEqual(normal.push + 1e-9);
  });
});
