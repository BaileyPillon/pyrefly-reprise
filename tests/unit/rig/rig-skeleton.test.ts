import { describe, expect, it } from 'vitest';
import { compileKey, compileKeys, RigTransition } from '../../../src/engine/rig/RigKeys.ts';
import { CH, C_ROT, DEG, RigSkeleton, bindPose } from '../../../src/engine/rig/RigSkeleton.ts';
import { FEET_TOL, feetError, footLandmarks, validateFeet } from '../../../src/engine/rig/RigValidate.ts';
import { makeRig, makeRigFile } from './rig-fixture.ts';

describe('RigSkeleton', () => {
  it('at bind every part is the painting: skinned vertices equal the bind positions in plane coordinates', () => {
    const d = makeRig();
    const sk = new RigSkeleton(d);
    const out = new Float32Array(d.parts.find((p) => p.name === 'body')!.verts.length * 1.5);
    const body = d.parts.find((p) => p.name === 'body')!;
    sk.skin(body, out);
    for (let i = 0; i < body.verts.length / 2; i++) {
      expect(out[i * 3]!).toBeCloseTo(body.verts[i * 2]! / 400 - 0.5, 5);
      expect(out[i * 3 + 1]!).toBeCloseTo(0.5 - body.verts[i * 2 + 1]! / 800, 5);
      expect(out[i * 3 + 2]).toBe(0);
    }
  });

  it('rotates a bone about its own joint (clockwise on screen, y down) and its children follow', () => {
    const d = makeRig();
    const sk = new RigSkeleton(d);
    const pose = bindPose(d.bones.length);
    pose[d.boneIndex.get('chest')! * CH + C_ROT] = 90 * DEG; // the chest turns a quarter clockwise about (200, 300)
    sk.solve(pose);
    const head = sk.landmark('head')!; // bind (200, 160): 140 px above the chest joint; a quarter turn clockwise puts it to the right of the joint
    expect(head.x).toBeCloseTo(340, 5);
    expect(head.y).toBeCloseTo(300, 5);
    // the soles do not move
    expect(sk.landmark('footN')!.y).toBeCloseTo(770, 5);
    expect(sk.absAngle(d.boneIndex.get('head')!)).toBeCloseTo(90 * DEG, 6);
  });

  it('a vertex between two bones takes their weighted sum', () => {
    const d = makeRig();
    const sk = new RigSkeleton(d);
    const pose = bindPose(d.bones.length);
    pose[d.boneIndex.get('chest')! * CH + C_ROT] = Math.PI; // half a turn about (200, 300): a point at (140, 375) goes to (260, 225)
    sk.solve(pose);
    const body = d.parts.find((p) => p.name === 'body')!;
    const out = new Float32Array(18);
    sk.skin(body, out);
    // vertex 2 is (140, 375), half chest, half pelvis (which did not move)
    expect(out[2 * 3]!).toBeCloseTo((0.5 * 260 + 0.5 * 140) / 400 - 0.5, 5);
    expect(out[2 * 3 + 1]!).toBeCloseTo(0.5 - (0.5 * 225 + 0.5 * 375) / 800, 5);
  });

  it('the root offset of a key moves the whole figure', () => {
    const d = makeRig();
    const sk = new RigSkeleton(d);
    sk.solve(compileKey(d, { bones: {}, root: { dx: 30, dy: -50 }, source: 'x' }));
    const f = sk.landmark('footN')!;
    expect(f.x).toBeCloseTo(210, 5);
    expect(f.y).toBeCloseTo(720, 5);
  });
});

describe('feet stay planted', () => {
  it('every planted key of the fixture keeps its sole on the bind row, to the tolerance', () => {
    const d = makeRig();
    expect(footLandmarks(d).sort()).toEqual(['feet', 'footF', 'footN']);
    expect(validateFeet(d)).toEqual([]);
    for (const [name, key] of d.keys) {
      if (key.planted === false) continue;
      const e = feetError(d, compileKey(d, key), key.root?.dy ?? 0)!;
      expect(Math.abs(e), name).toBeLessThanOrEqual(FEET_TOL * d.image.h);
    }
  });

  it('a key that lifts a foot is reported, unless it says it is not planted', () => {
    const lifted = makeRigFile();
    lifted.keys['attack']!.bones['thighN'] = { rot: 0.9 };
    lifted.keys['attack']!.bones['thighF'] = { rot: 0.9 };
    const d = makeRig(lifted);
    const issues = validateFeet(d);
    expect(issues.map((i) => [i.code, i.key])).toEqual([['feet-moved', 'attack']]);
    lifted.keys['attack']!.planted = false;
    expect(validateFeet(makeRig(lifted))).toEqual([]);
  });

  it('a whole-figure lift declared as root.dy is not a moved foot', () => {
    const hop = makeRigFile();
    hop.keys['ready']!.root = { dy: -60 };
    expect(validateFeet(makeRig(hop))).toEqual([]);
  });

  it('a rig with no foot landmark is reported', () => {
    const f = makeRigFile();
    f.landmarks = { head: f.landmarks['head']! };
    expect(validateFeet(makeRig(f)).map((i) => i.code)).toEqual(['no-feet']);
  });

  it('moving between planted keys keeps the soles planted at every sample (the ease is per channel)', () => {
    const d = makeRig();
    const compiled = compileKeys(d);
    const planted = [...d.keys].filter(([, k]) => k.planted !== false).map(([n]) => n);
    const tol = FEET_TOL * d.image.h * 2.5;
    for (const a of planted) {
      for (const b of planted) {
        if (a === b) continue;
        const t = new RigTransition(d.bones.length * CH, compiled.get(a)!);
        t.retarget(compiled.get(b)!, 200);
        for (let i = 0; i < 13; i++) {
          t.step(1 / 60);
          expect(Math.abs(feetError(d, t.current)!), `${a} to ${b} at ${i}`).toBeLessThanOrEqual(tol);
        }
      }
    }
  });
});
