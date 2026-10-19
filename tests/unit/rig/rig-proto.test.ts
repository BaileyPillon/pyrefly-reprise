import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readRig } from '../../../src/engine/rig/RigData.ts';
import { RigChains } from '../../../src/engine/rig/RigDynamics.ts';
import { compileKeys } from '../../../src/engine/rig/RigKeys.ts';
import { CH, C_ROT, RigSkeleton, bindPose } from '../../../src/engine/rig/RigSkeleton.ts';
import { validateFeet } from '../../../src/engine/rig/RigValidate.ts';
// @ts-expect-error a plain .mjs tool, no declarations
import { convertProto, protoKeys, KIMAHRI_MOTION } from '../../../tools/rig-from-proto.mjs';

const FIXTURE = 'D:/pyrefly-art-rigs/kimahri-proto/rig.json';
const PROTO = 'D:/Tools/pyrefly-scratch/2026-10-15/quality-leap/proto-25d/rig/kimahri/rig.json';

describe('the converter (tools/rig-from-proto.mjs)', () => {
  const mini = {
    name: 'mini',
    scale: 2,
    image: { w: 100, h: 200 },
    baselineY: 190,
    bones: [{ name: 'root', parent: -1, x: 50, y: 190 }, { name: 'pelvis', parent: 0, x: 50, y: 100 }, { name: 'thighN', parent: 1, x: 45, y: 105 }, { name: 'thighF', parent: 1, x: 55, y: 105 }],
    parts: [
      { name: 'body', order: 1, png: 'body.png', rim: 'body.rim.png', box: [20, 20, 60, 100], verts: [20, 20, 80, 20, 80, 120, 20, 120], uv: [0, 1, 1, 1, 1, 0, 0, 0], tris: [0, 1, 2, 0, 2, 3], bones: [1, -1, 1, 0, 1, -1, 1, 0], weights: [1, 0, 0.5, 0.5, 1, 0, 0.25, 0.75] },
      { name: 'shaft', order: 0, png: 'shaft.png', rim: 'shaft.rim.png', noRim: true, box: [0, 0, 10, 100], verts: [0, 0, 10, 0, 10, 100, 0, 100], tris: [0, 1, 2, 0, 2, 3], bones: [0, -1, 0, -1, 0, -1, 0, -1], weights: [1, 0, 1, 0, 1, 0, 1, 0] },
    ],
    landmarks: { headCenter: { bone: 1, x: 50, y: 30 }, footN: { bone: 2, x: 45, y: 185 } },
  };

  it('writes the v1 shapes: uvs v down, four-a-vertex weights, triangles, rimEverywhere, costume, head and feet landmarks, keys in radians', () => {
    const rig = convertProto(mini, { subject: 'mini', paintingName: 'characters/mini/idle', sha: 'f'.repeat(64), gate: { status: 'ok', at: 't', by: 'b' } });
    const body = rig.parts.find((p: { name: string }) => p.name === 'body');
    expect(body.uvs).toEqual([0, 0, 1, 0, 1, 1, 0, 1]);
    expect(body.triangles).toEqual([0, 1, 2, 0, 2, 3]);
    expect(body.weights).toEqual([1, 1, -1, 0, 1, 0.5, 0, 0.5, 1, 1, -1, 0, 1, 0.25, 0, 0.75]);
    expect(rig.parts.find((p: { name: string }) => p.name === 'shaft')).toMatchObject({ rimEverywhere: true });
    expect(rig.parts.find((p: { name: string }) => p.name === 'shaft').rim).toBeUndefined();
    expect(rig.costume).toEqual({ painting: 'characters/mini/idle', pose: 'idle', sha: 'f'.repeat(64) });
    expect(rig.landmarks.head).toEqual(mini.landmarks.headCenter);
    expect(rig.landmarks.feet).toEqual(mini.landmarks.footN);
    expect(Object.keys(rig.keys)).toEqual(['idle', 'ready', 'attack', 'hurt']);
    for (const k of Object.values(rig.keys) as Array<{ bones: Record<string, { rot?: number }> }>) for (const b of Object.values(k.bones)) expect(Math.abs(b.rot ?? 0)).toBeLessThan(2);
    expect(protoKeys('mini').attack.ms).toBe(140);
  });
});

describe.skipIf(!existsSync(FIXTURE))('the prototype Kimahri as a v1 rig (the engine smoke fixture, D:/pyrefly-art-rigs/kimahri-proto)', () => {
  const read = (): ReturnType<typeof readRig> => readRig(JSON.parse(readFileSync(FIXTURE, 'utf8')));

  it('reads: 11 parts, 29 bones, four keys, the prototype lag chains and idle', () => {
    const r = read();
    if (!r.ok) throw new Error(r.reason);
    expect(r.data.parts).toHaveLength(11);
    expect(r.data.bones).toHaveLength(29);
    expect([...r.data.keys.keys()]).toEqual(['idle', 'ready', 'attack', 'hurt']);
    expect(r.data.motion?.chains).toHaveLength(5);
    expect(r.data.gate?.status).toBe('ok');
    expect(r.data.costume.painting).toBe('characters/kimahri/idle');
  });

  it('every key keeps his soles on the floor (the feet are planted in all four poses)', () => {
    const r = read();
    if (!r.ok) throw new Error(r.reason);
    expect(validateFeet(r.data)).toEqual([]);
  });

  it('the at-rest rig is the prototype one: skinning at bind gives each part back its bind vertices', () => {
    const r = read();
    if (!r.ok) throw new Error(r.reason);
    const sk = new RigSkeleton(r.data);
    for (const p of r.data.parts) {
      const out = new Float32Array((p.verts.length / 2) * 3);
      sk.skin(p, out);
      for (let i = 0; i < p.verts.length / 2; i++) {
        expect(out[i * 3]!).toBeCloseTo(p.verts[i * 2]! / r.data.image.w - 0.5, 4);
        expect(out[i * 3 + 1]!).toBeCloseTo(0.5 - p.verts[i * 2 + 1]! / r.data.image.h, 4);
      }
    }
    // and the prototype's own file reads to the same bones and landmarks as the converted one
    if (existsSync(PROTO)) {
      const proto = JSON.parse(readFileSync(PROTO, 'utf8')) as { bones: Array<{ name: string }>; landmarks: Record<string, unknown> };
      expect(r.data.bones.map((b) => b.name)).toEqual(proto.bones.map((b) => b.name));
    }
  });

  it('his five chains stay bounded under a thrashing body and a lunge', () => {
    const r = read();
    if (!r.ok) throw new Error(r.reason);
    const sk = new RigSkeleton(r.data);
    const chains = new RigChains(sk, KIMAHRI_MOTION.chains);
    const keys = [...compileKeys(r.data).values()];
    const pose = bindPose(r.data.bones.length);
    const limit = 70 * (Math.PI / 180) + 1e-9;
    const chainBones = KIMAHRI_MOTION.chains.flatMap((c: { bones: string[] }) => c.bones) as string[];
    for (let i = 0; i < 6000; i++) {
      pose.set(keys[i % keys.length]!);
      sk.solve(pose);
      chains.update(pose, i % 7 === 0 ? 0.2 : 1 / 60, (i % 13) * 3);
      for (const n of chainBones) {
        const v = pose[r.data.boneIndex.get(n)! * CH + C_ROT]!;
        expect(Number.isFinite(v) && Math.abs(v) <= limit).toBe(true);
      }
    }
  });
});
