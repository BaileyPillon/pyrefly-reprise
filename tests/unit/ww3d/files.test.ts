/**
 * **The real model files, when they are on disk** (`public/models-exp/windwaker/*.glb`; the hidden Wind Waker chapter, FFX-2 only). The files are local only (gitignored, never committed, never shipped), so every test here is
 * skipped on a machine without them. Where they are, the contract the chapter's code is written to is read straight off the glTF's JSON chunk (no renderer, no loader):
 *
 * - each girl is one skinned mesh on a skeleton with the bones the chapter reads (the head turn, the weapons, the facing), clips named for what they are with the stance clip `idle_combat` among them, and no knock-out clip;
 * - Valefor is one static mesh with a base-colour map, no skeleton and no clips, 3.5 m tall, her body centre where the fit's anchor says;
 * - the heights are the ones `layout.ts` takes as native.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { BOSS_ANCHOR, MODEL_FILE, NATIVE_HEIGHT, WW_BOSS_ID, WW_PARTY_IDS, looksLikeGlb, type WwId } from '../../../src/engine/ww3d/layout.ts';
import { PROP_SPECS } from '../../../src/engine/ww3d/props.ts';
import { ROLE_PATTERNS, STANCE_CLIP, UNUSED_CLIPS, roleClips } from '../../../src/engine/ww3d/clips.ts';
import { AnimationClip } from 'three';

const dir = fileURLToPath(new URL('../../../public/models-exp/windwaker/', import.meta.url));
const path = (id: WwId): string => join(dir, `${MODEL_FILE[id]}.glb`);

interface Gltf {
  nodes: Array<{ name?: string; skin?: number; mesh?: number }>;
  skins?: Array<{ joints: number[] }>;
  meshes: Array<{ primitives: Array<{ attributes: Record<string, number>; material?: number }> }>;
  accessors: Array<{ min?: number[]; max?: number[]; count: number }>;
  materials?: Array<{ pbrMetallicRoughness?: { baseColorTexture?: unknown } }>;
  animations?: Array<{ name?: string }>;
}

/** The JSON chunk of a binary glTF. */
function readGltf(file: string): Gltf {
  const bytes = readFileSync(file);
  expect(looksLikeGlb(bytes)).toBe(true);
  const length = bytes.readUInt32LE(12);
  expect(bytes.toString('ascii', 16, 20)).toBe('JSON');
  return JSON.parse(bytes.toString('utf8', 20, 20 + length)) as Gltf;
}

/** The position box of the first primitive of mesh 0 (its accessor's min and max). */
function boxOf(g: Gltf): { min: number[]; max: number[] } {
  const acc = g.accessors[g.meshes[0]!.primitives[0]!.attributes['POSITION']!]!;
  return { min: acc.min!, max: acc.max! };
}

const have = (id: WwId): boolean => existsSync(path(id));

describe.skipIf(!WW_PARTY_IDS.every(have))('the three girls\' files', () => {
  const NEEDED = ['Hips', 'Spine', 'Head', 'headfront', 'LeftShoulder', 'RightShoulder', 'LeftForeArm', 'RightForeArm', 'LeftHand', 'RightHand', 'LeftUpLeg', 'RightUpLeg'];

  for (const id of WW_PARTY_IDS) {
    it(`${id}: one skinned mesh on a skeleton with the bones the chapter reads, a map, and the right height`, () => {
      const g = readGltf(path(id));
      const names = new Set(g.nodes.map((n) => n.name));
      for (const bone of NEEDED) expect(names.has(bone), `${id} has ${bone}`).toBe(true);
      expect(g.skins).toHaveLength(1);
      expect(g.skins![0]!.joints.length).toBeGreaterThanOrEqual(24);
      expect(g.nodes.filter((n) => n.mesh !== undefined)).toHaveLength(1);
      expect(g.materials?.[0]?.pbrMetallicRoughness?.baseColorTexture, 'the base-colour map the toon look keeps').toBeDefined();
      const box = boxOf(g);
      expect(box.max[1]! - box.min[1]!, `${id}'s native height`).toBeCloseTo(NATIVE_HEIGHT[id], 1);
      expect(box.min[1]!, 'the feet on y 0 in the bind pose').toBeCloseTo(0, 2);
    });

    it(`${id}: clips named for what they are, the combat stance among them, none for a knock-out, and the walk and the run left unused`, () => {
      const g = readGltf(path(id));
      const names = (g.animations ?? []).map((a) => a.name ?? '');
      for (const n of [STANCE_CLIP, 'idle', 'attack', 'hit', 'cast', 'victory']) expect(names, `${id} has ${n}`).toContain(n);
      expect(names.some((n) => ROLE_PATTERNS.ko.test(n))).toBe(false);
      // the role map the chapter makes of them
      const clips = names.map((n) => new AnimationClip(n, 1, []));
      const by = roleClips(clips);
      expect(by.get('idle')?.name).toBe(STANCE_CLIP);
      expect([...by.keys()].sort()).toEqual(['attack', 'cast', 'hit', 'idle', 'victory']);
      for (const n of names.filter((x) => UNUSED_CLIPS.test(x))) expect([...by.values()].map((c) => c.name)).not.toContain(n);
    });
  }

  it('has the hands and forearms every weapon of the specs sits on', () => {
    for (const id of WW_PARTY_IDS) {
      const names = new Set(readGltf(path(id)).nodes.map((n) => n.name));
      for (const spec of PROP_SPECS[id]) {
        expect(names.has(spec.hand), `${id} ${spec.hand}`).toBe(true);
        expect(names.has(spec.hand.replace('Hand', 'ForeArm')), `${id} forearm`).toBe(true);
      }
    }
  });
});

describe.skipIf(!have(WW_BOSS_ID))('Valefor\'s file', () => {
  it('is one static mesh with a map, no skeleton and no clips, 3.5 m tall, with her body centre inside the box the fit anchors on', () => {
    const g = readGltf(path(WW_BOSS_ID));
    expect(g.skins ?? []).toHaveLength(0);
    expect(g.animations ?? []).toHaveLength(0);
    expect(g.nodes.filter((n) => n.mesh !== undefined)).toHaveLength(1);
    expect(g.materials?.[0]?.pbrMetallicRoughness?.baseColorTexture).toBeDefined();
    const box = boxOf(g);
    expect(box.max[1]! - box.min[1]!).toBeCloseTo(NATIVE_HEIGHT[WW_BOSS_ID], 1);
    expect(box.min[1]!).toBeCloseTo(0, 2);
    expect(box.max[0]! - box.min[0]!).toBeGreaterThan(6); // the wings spread
    // the anchor (x, z) is inside the footprint, not at the wings' box centre (which is where a plain fit would have put her)
    expect(BOSS_ANCHOR[0]).toBeGreaterThan(box.min[0]!);
    expect(BOSS_ANCHOR[0]).toBeLessThan(box.max[0]!);
    expect(BOSS_ANCHOR[1]).toBeGreaterThan(box.min[2]!);
    expect(BOSS_ANCHOR[1]).toBeLessThan(box.max[2]!);
    expect(Math.abs(BOSS_ANCHOR[0] - (box.min[0]! + box.max[0]!) / 2)).toBeGreaterThan(0.3);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// The real files through the real code
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/** The file with its pictures taken out of the JSON (no decoder in Node): the geometry, the skeleton and the clips are the real ones. */
function stripImages(bytes: Buffer): ArrayBuffer {
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength)) as Record<string, unknown> & { materials?: Array<{ pbrMetallicRoughness?: Record<string, unknown> }> };
  delete json['images'];
  delete json['textures'];
  delete json['samplers'];
  for (const m of json.materials ?? []) if (m.pbrMetallicRoughness) delete m.pbrMetallicRoughness['baseColorTexture'];
  const text = Buffer.from(JSON.stringify(json), 'utf8');
  const padded = Buffer.concat([text, Buffer.alloc((4 - (text.length % 4)) % 4, 0x20)]);
  const rest = bytes.subarray(20 + jsonLength); // the BIN chunk, untouched
  const header = Buffer.alloc(20);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + padded.length + rest.length, 8);
  header.writeUInt32LE(padded.length, 12);
  header.write('JSON', 16, 'ascii');
  const out = Buffer.concat([header, padded, rest]);
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
}

describe.skipIf(!([...WW_PARTY_IDS, WW_BOSS_ID] as WwId[]).every(have))('the real cast through the real model code', () => {
  it('fits, measures, attaches the weapons, finds the strike of each attack and the clips\' pelvis corrections, with no warnings', async () => {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const { clone } = await import('three/addons/utils/SkeletonUtils.js');
    const { Box3, Vector3 } = await import('three');
    const { loadWwModels } = await import('../../../src/engine/ww3d/model.ts');
    const { createToonUniforms } = await import('../../../src/engine/ww3d/toon.ts');
    const { WORLD_HEIGHT, PARTY_SLOTS } = await import('../../../src/engine/ww3d/layout.ts');
    const { TARGET_POSITION } = await import('../../../src/engine/ww3d/camera.ts');
    const { windowsOfClips, roleClips: rc } = await import('../../../src/engine/ww3d/clips.ts');
    const warnings: string[] = [];
    const models = await loadWwModels({
      base: '/',
      dir: 'models-exp/windwaker',
      heights: WORLD_HEIGHT,
      context: { uniforms: createToonUniforms(), camera: TARGET_POSITION },
      warn: (m) => warnings.push(m),
      io: {
        fetchBytes: async (url) => {
          const file = join(dir, url.split('/').pop()!);
          return existsSync(file) ? stripImages(readFileSync(file)) : null;
        },
        parse: async (bytes) => {
          const gltf = await new GLTFLoader().parseAsync(bytes, '');
          return { scene: gltf.scene, animations: gltf.animations };
        },
        clone: async (scene) => clone(scene),
      },
    });
    expect(warnings).toEqual([]);
    expect(models.capsules).toEqual([]);
    for (const id of WW_PARTY_IDS) {
      const m = models.models.get(id)!;
      expect(m.source, id).toBe('own');
      expect(m.animated, id).toBe(true);
      expect(m.turnsHead, id).toBe(true);
      expect(m.weapons, id).toHaveLength(PROP_SPECS[id].length);
      expect(m.stanceYaw, `${id}'s stance was measured`).not.toBeNull();
      expect(Number.isFinite(m.stanceYaw!)).toBe(true);
      // the body stands on the floor at its world height (the weapons are not part of the box: they hang on the hands)
      m.update(0.016);
      const body = m.root.getObjectByProperty('isSkinnedMesh', true)!;
      m.root.updateMatrixWorld(true);
      const box = new Box3().setFromObject(body, true);
      expect(box.min.y, `${id}'s feet`).toBeGreaterThan(-0.12);
      expect(box.min.y, `${id}'s feet`).toBeLessThan(0.12);
      expect(box.max.y, `${id}'s head`).toBeGreaterThan(WORLD_HEIGHT[id] * 0.7);
      expect(box.max.y, `${id}'s head`).toBeLessThan(WORLD_HEIGHT[id] * 1.08);
      // the head turn, the yaw and the weapons' aim run on the real skeleton
      m.setYaw(m.bodyYawAt(PARTY_SLOTS[WW_PARTY_IDS.indexOf(id)]!));
      m.update(0.016);
      m.aimWeapons(new Vector3(4, 2.2, -3.3));
      for (const w of m.weapons) expect((w.userData['aimed'] as { applied: number }).applied).toBeGreaterThan(0);
      // an attack on the beat plays and comes back
      m.noteOpen('attack', 0.3, 1);
      m.update(0.016);
      expect(m.playing, id).toBe('attack');
      for (let i = 0; i < 600; i++) m.update(0.016);
      expect(m.playing, id).toBe('idle');
    }
    // the strike of each girl's attack lies inside its clip, after the wind-up, and the window is about a second
    const parsed = await new GLTFLoader().parseAsync(stripImages(readFileSync(path('yuna'))), '');
    const yuna = windowsOfClips(rc(parsed.animations)).attack!;
    expect(yuna.shot!).toBeGreaterThan(0.3);
    expect(yuna.shot!).toBeLessThan(parsed.animations.find((a) => a.name === 'attack')!.duration);
    expect(yuna.end - yuna.start).toBeGreaterThan(0.4);
    expect(yuna.end - yuna.start).toBeLessThan(1.5);
    // Valefor: the wing flap is on her programs, she hovers, and her mouth is above her chest
    const v = models.models.get(WW_BOSS_ID)!;
    expect(v.flap).not.toBeNull();
    v.update(0.5);
    expect(v.height).toBeCloseTo(WORLD_HEIGHT[WW_BOSS_ID], 6);
    models.dispose();
  }, 60_000);
});
