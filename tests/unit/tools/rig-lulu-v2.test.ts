/**
 * **Lulu's front views as format v2** (`tools/rig/subjects/lulu-v2-from-v1.mjs`; FFX only): the converter's own claims, on a synthetic rig always and on her real v1 rig when it is on this
 * disk (`D:/pyrefly-art-rigs/lulu`, read only): the part it makes shows the same pixels in the same place as the speck chain did, the keys no longer carry the hacks, and a bone dropped from the
 * middle of the skeleton renumbers everything that points at a bone.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normaliseRig } from '../../../tools/rig/rig-format.mjs';
import { keyPose, skinPart, solve } from '../../../tools/rig/rig-pose.mjs';
import { FRONTS, HACK_BONES, HIDES, convert, dropBones } from '../../../tools/rig/subjects/lulu-v2-from-v1.mjs';

const LULU = 'D:/pyrefly-art-rigs/lulu';

describe('dropBones', () => {
  it('removes bones from the middle and renumbers parents, the four-number skin and numeric bone references', () => {
    const raw = {
      bones: [{ name: 'root', parent: -1, x: 0, y: 0 }, { name: 'a', parent: 0, x: 0, y: 0 }, { name: 'gone', parent: 0, x: 0, y: 0 }, { name: 'b', parent: 1, x: 0, y: 0 }, { name: 'c', parent: 3, x: 0, y: 0 }],
      parts: [{ name: 'p', weights: [3, 1, -1, 0, 1, 0.5, 4, 0.5], bone: undefined }, { name: 'q', bone: 4 }],
      landmarks: { l: { bone: 4, x: 1, y: 2 }, m: { bone: 'b', x: 1, y: 2 } },
    };
    dropBones(raw, ['gone']);
    expect(raw.bones.map((b) => [b.name, b.parent])).toEqual([['root', -1], ['a', 0], ['b', 1], ['c', 2]]);
    expect(raw.parts[0]!.weights).toEqual([2, 1, -1, 0, 1, 0.5, 3, 0.5]);
    expect(raw.parts[1]!.bone).toBe(3);
    expect(raw.landmarks.l.bone).toBe(3);
    expect(raw.landmarks.m.bone).toBe('b');
  });

  it('refuses to drop a bone a kept bone hangs from', () => {
    const raw = { bones: [{ name: 'root', parent: -1, x: 0, y: 0 }, { name: 'a', parent: 0, x: 0, y: 0 }, { name: 'b', parent: 1, x: 0, y: 0 }], parts: [], landmarks: {} };
    expect(() => dropBones(raw, ['a'])).toThrow(/hangs from a dropped one/);
  });
});

describe.skipIf(!existsSync(`${LULU}/rig.json`))('Lulu v1 to v2 (her real rig)', () => {
  const v1 = JSON.parse(readFileSync(`${LULU}/rig.json`, 'utf8'));
  const v2 = convert(v1, LULU);

  it('is a version 2 file with one hidden part `front` (defend\'s image) and one variant `od-fury` (its own mesh), 21 bones, and no speck parts or chain bones', () => {
    expect(v2.version).toBe(2);
    expect(v2.gate).toBeUndefined(); // the gate writes its own
    expect(v2.parts.map((p: { name: string }) => p.name)).not.toContain('fdef');
    expect(v2.parts.map((p: { name: string }) => p.name)).not.toContain('fod');
    const front = v2.parts.find((p: { name: string }) => p.name === 'front');
    expect(front).toMatchObject({ hidden: true, bone: 'root', png: 'fdef.png', order: 20 });
    expect(front.variants['od-fury']).toMatchObject({ png: 'fod.png', rim: 'fod.rim.png', bone: 'root' });
    expect(front.variants['od-fury'].verts.length).toBeGreaterThan(8); // its own mesh
    expect(v2.bones.length).toBe(v1.bones.length - 4);
    for (const n of FRONTS.flatMap((f) => f.chain)) expect(v2.bones.map((b: { name: string }) => b.name)).not.toContain(n);
  });

  it('the two keys show `front`, hide the side parts it replaces, and no longer carry the hacks (chains, shell scales, swings, layers); other keys are v1\'s byte for byte', () => {
    expect(v2.keys['defend'].parts).toEqual({ front: {}, ...Object.fromEntries(HIDES.map((n) => [n, { show: false }])) });
    expect(v2.keys['od-fury'].parts.front).toEqual({ image: 'od-fury' });
    for (const k of ['defend', 'od-fury']) {
      expect(v2.keys[k].layers).toBeUndefined();
      for (const n of [...FRONTS.flatMap((f) => f.chain), ...HACK_BONES]) expect(v2.keys[k].bones[n], `${k}.${n}`).toBeUndefined();
      expect(v2.keys[k].bones.pelvis).toEqual(v1.keys[k].bones.pelvis); // what steers the head onto the front head stays
      expect(v2.keys[k].expect).toEqual(v1.keys[k].expect);
    }
    for (const k of Object.keys(v1.keys).filter((n) => !['defend', 'od-fury'].includes(n))) expect(v2.keys[k], k).toEqual(v1.keys[k]);
  });

  it('draws the same pixels in the same place: the new part, skinned through the key, lands where the speck chain put the old part (to a tenth of a pixel)', () => {
    const a = normaliseRig(v1, { dir: LULU }).rt!;
    const b = normaliseRig({ ...v2, version: 2 }, { dir: LULU }).rt!;
    for (const f of FRONTS) {
      const old = a.parts.find((p: { name: string }) => p.name === f.part);
      const k1 = solve(a, keyPose(a, a.keys[f.key])).k;
      const was = new Float64Array(old.verts.length);
      skinPart(old, k1, was);
      const front = b.parts.find((p: { name: string }) => p.name === 'front');
      const part = f.variant ? front.variants[f.variant] : front;
      const k2 = solve(b, keyPose(b, b.keys[f.key])).k;
      const now = new Float64Array(part.verts.length);
      skinPart(part, k2, now);
      expect(now.length).toBe(was.length);
      let worst = 0;
      for (let i = 0; i < now.length; i++) worst = Math.max(worst, Math.abs(now[i]! - was[i]!));
      expect(worst, f.key).toBeLessThan(0.1);
    }
  });
});
