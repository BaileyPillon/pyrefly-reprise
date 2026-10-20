/**
 * **The real files, through the real loader** (the hidden 3D Bahamut chapter, the real-models branch, FFX-2 only). These files are Bailey's own extracted models, local only (`public/models-exp/`, gitignored), so every test
 * here is **skipped when they are not on the disk**. With them, the pipeline of `src/engine/yrp3d/` runs on the real skeletons and meshes with three's own `GLTFLoader` (the textures are stripped out of the files first: the
 * loader needs a DOM for them, and nothing here looks at colour). What it pins, on the four figures:
 *
 * 1. **The scene extras** carry the `.chr` scale (1 for the girls, 4 for the game's Bahamut) and the models are skinned on `SkeletonNode_<n>` bones.
 * 2. **The hands are found by shape** on all three real girls (whose arm bones are numbered differently), a palm with finger chains on each side, out at the arms' reach, wrist before palm; and the weapons go on them with
 *    the barrel along the arm.
 * 3. **The fit**: a girl is about 16.5 tall in the game's units; the game's Bahamut at his scale is five times that (the game draws him 88 against a girl's 16.5); the AI Bahamut is 7 tall in his own units.
 * 4. **The clips**: the plans are the map's, every clip of them is in the file, and a rig plays each pose (attack, cast, item, hit, fall, rise, the kneel, victory) on the real skeleton without a NaN in any bone.
 * 5. **The two Bahamuts**: the AI one has no clips and flaps (his wings out along x, shaded in his own material); the game's one has 4 scale, his clips, a fall of four parts, and the unskinned ring of his file is taken out.
 */
import { existsSync, readFileSync } from 'node:fs';
import { Box3, Matrix4, Quaternion, Vector3, type AnimationClip, type Bone, type Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { describe, expect, it } from 'vitest';

import { plansFor } from '../../../src/engine/yrp3d/clipMap.ts';
import { chrScaleOf } from '../../../src/engine/yrp3d/load.ts';
import { PARTY_HEIGHT, YRP_PARTY_IDS, type YrpId } from '../../../src/engine/yrp3d/layout.ts';
import { YrpModel, removeStrays } from '../../../src/engine/yrp3d/model.ts';
import { attachProps, findHands, gripRotation } from '../../../src/engine/yrp3d/props.ts';

const DIR = 'public/models-exp/yrp';
const have = ['yuna', 'rikku', 'paine', 'bahamut'].every((id) => existsSync(`${DIR}/${id}.glb`) && existsSync(`${DIR}/${id}-anims.glb`)) && existsSync(`${DIR}/clipmap.json`) && existsSync(`${DIR}/bahamut-ai.glb`);

/** A binary glTF with its textures taken out (no DOM is needed to parse the rest). */
function stripImages(buf: Buffer): ArrayBuffer {
  const len = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + len).toString('utf8')) as { images?: unknown; textures?: unknown; samplers?: unknown; materials?: Array<{ pbrMetallicRoughness?: Record<string, unknown> }> };
  delete json.images;
  delete json.textures;
  delete json.samplers;
  for (const m of json.materials ?? []) if (m.pbrMetallicRoughness) delete m.pbrMetallicRoughness['baseColorTexture'];
  let js = Buffer.from(JSON.stringify(json), 'utf8');
  js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
  const rest = buf.subarray(20 + len);
  const out = Buffer.alloc(20 + js.length + rest.length);
  out.write('glTF', 0);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(js.length, 12);
  out.write('JSON', 16);
  js.copy(out, 20);
  rest.copy(out, 20 + js.length);
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
}

interface Loaded {
  scene: Object3D;
  animations: AnimationClip[];
  extras: Record<string, unknown>;
}
const cache = new Map<string, Promise<Loaded>>();
const load = (file: string): Promise<Loaded> => {
  let p = cache.get(file);
  if (!p) {
    p = new GLTFLoader().parseAsync(stripImages(readFileSync(`${DIR}/${file}`)), '').then((g) => ({ scene: g.scene, animations: g.animations, extras: g.scene.userData as Record<string, unknown> }));
    cache.set(file, p);
  }
  return p;
};
const map = have ? (JSON.parse(readFileSync(`${DIR}/clipmap.json`, 'utf8')) as unknown) : null;

/** A model of `id` from its real files: the mesh from `<id>.glb`, the clips from `<id>-anims.glb`, the plans from the map, the scale from the extras. */
async function model(id: YrpId, height = PARTY_HEIGHT): Promise<{ model: YrpModel; scene: Object3D; clips: AnimationClip[] }> {
  const mesh = await load(`${id}.glb`);
  const anims = await load(`${id}-anims.glb`);
  const scene = clone(mesh.scene);
  const plans = plansFor(id, map, anims.animations.map((c) => c.name));
  return { model: new YrpModel(id, scene, anims.animations, height, 'own', { plans, chrScale: chrScaleOf(mesh.extras) }), scene, clips: anims.animations };
}

const finite = (root: Object3D): boolean => {
  root.updateMatrixWorld(true);
  let ok = true;
  root.traverse((o) => {
    if ((o as Bone).isBone && !o.matrixWorld.elements.every(Number.isFinite)) ok = false;
  });
  return ok;
};

describe.skipIf(!have)('the real files through the real loader', () => {
  it('carry the .chr scale in the scene extras (1 for the girls, 4 for the game\'s Bahamut) and are skinned on SkeletonNode bones', async () => {
    for (const id of YRP_PARTY_IDS) expect(chrScaleOf((await load(`${id}.glb`)).extras), id).toBe(1);
    expect(chrScaleOf((await load('bahamut.glb')).extras)).toBe(4);
    const yuna = (await load('yuna.glb')).scene;
    const names: string[] = [];
    yuna.traverse((o) => (o as Bone).isBone && names.push(o.name));
    expect(names.length).toBeGreaterThan(50);
    expect(names.every((n) => /^SkeletonNode_\d+$/.test(n))).toBe(true);
  }, 120_000);

  it.each(YRP_PARTY_IDS)('%s: the hands are found by shape in the bind pose, a palm with finger chains out on each side, and the weapons go on them with the barrel along the arm', async (id) => {
    const scene = clone((await load(`${id}.glb`)).scene); // the bind pose: before any clip has moved a bone (the model finds the hands in the constructor, before its mixer starts)
    const hands = findHands(scene);
    expect(hands.map((h) => h.side).sort()).toEqual(['left', 'right']);
    const height = new Box3().setFromObject(scene).getSize(new Vector3()).y;
    for (const h of hands) {
      const palm = h.palm.getWorldPosition(new Vector3());
      const wrist = h.wrist.getWorldPosition(new Vector3());
      expect(Math.abs(palm.x), `${id} ${h.side}`).toBeGreaterThan(height * 0.2); // out at the arm's reach in the bind pose
      expect(palm.y, `${id} ${h.side}`).toBeLessThan(wrist.y); // the arm runs out and down
      expect(Math.sign(palm.x)).toBe(h.side === 'left' ? 1 : -1);
      expect(h.palm.children.filter((c) => !(c as { isMesh?: boolean }).isMesh).length).toBeGreaterThanOrEqual(3);
      const q = gripRotation(h);
      const barrel = new Vector3(0, 0, 1).applyQuaternion(h.palm.getWorldQuaternion(new Quaternion()).multiply(q));
      expect(barrel.dot(palm.clone().sub(wrist).normalize()), `${id} ${h.side}`).toBeGreaterThan(0.999);
      const thumb = new Vector3(0, 1, 0).applyQuaternion(h.palm.getWorldQuaternion(new Quaternion()).multiply(q));
      expect(thumb.z, `${id} ${h.side}`).toBeGreaterThan(0.99); // the sight toward the thumb: forward
      expect(new Matrix4().makeRotationFromQuaternion(q).determinant()).toBeCloseTo(1, 6);
    }
    const kit = attachProps(id, scene, height);
    expect(kit.props.map((p) => p.side).sort()).toEqual(id === 'paine' ? ['right'] : ['left', 'right']);
    kit.dispose();
  }, 120_000);

  it('stands a girl at her figure\'s height, about 16.5 tall in the game\'s units, with her weapons on: Yuna two pistols, Rikku two daggers, Paine one sword', async () => {
    const counts: Record<string, number> = { yuna: 2, rikku: 2, paine: 1 };
    for (const id of YRP_PARTY_IDS) {
      const { model: m } = await model(id);
      expect(m.trueHeight, id).toBeGreaterThan(15);
      expect(m.trueHeight, id).toBeLessThan(18.5);
      m.root.updateMatrixWorld(true);
      const box = new Box3().setFromObject(m.root);
      expect(box.max.y - box.min.y, id).toBeGreaterThan(PARTY_HEIGHT - 0.05); // the body sets the scale; a weapon in the bind pose (arms out) may reach a little past it
      expect(box.max.y - box.min.y, id).toBeLessThan(PARTY_HEIGHT * 1.35);
      let props = 0;
      m.root.traverse((o) => o.name.startsWith(`prop-${id}-`) && props++);
      expect(props, id).toBe(counts[id]);
      expect(m.animated, id).toBe(true);
      expect(m.playsKo, id).toBe(true);
    }
  }, 120_000);

  it('plays every pose on the real skeleton with every bone finite: the plans are the map\'s, and each clip they name is in the file', async () => {
    for (const id of YRP_PARTY_IDS) {
      const { model: m, clips } = await model(id);
      const names = new Set(clips.map((c) => c.name));
      const plans = plansFor(id, map, [...names]);
      for (const pose of ['idle', 'idle2', 'critical', 'hurt', 'attack', 'cast', 'item', 'victory', 'ko'] as const) {
        const plan = plans[pose];
        expect(plan, `${id} ${pose}`).toBeDefined();
        for (const c of [...plan!.enter, ...(plan!.hold ? [plan!.hold] : []), ...plan!.exit]) expect(names.has(c), `${id} ${pose} ${c}`).toBe(true);
      }
      const step = (s: number): void => {
        for (let t = 0; t < s; t += 1 / 30) m.update(1 / 30);
      };
      step(0.5);
      m.noteOpen('attack', 0.25);
      step(0.4);
      expect(m.playing, id).toBe('attack');
      m.noteImpact();
      step(2);
      expect([m.playing, finite(m.root)], id).toEqual(['idle', true]);
      m.noteOpen('cast', undefined);
      step(1.5);
      m.noteClose();
      step(3);
      m.noteOpen('item', undefined);
      step(1.5);
      m.noteClose();
      step(3);
      m.notePose('hurt', false, false);
      step(1.5);
      m.notePose('idle', false, true);
      step(2);
      expect(m.playing, id).toBe('critical');
      m.notePose('idle', false, false);
      step(2);
      m.notePose('ko', true, false);
      step(4);
      expect([m.playing, m.playingClip, finite(m.root)], id).toEqual(['ko', 'DEAD_01', true]);
      m.notePose('idle', false, false);
      step(4);
      m.notePose('victory', false, false);
      step(5);
      expect([m.playing, m.playingClip, finite(m.root)], id).toEqual(['victory', 'WIN_01', true]);
    }
  }, 180_000);

  it('the game\'s Bahamut: 4x the scale, a bit over five girls tall in the game, his unskinned ring taken out, his clips with a fall of four parts, no wing flap', async () => {
    const girl = (await model('yuna')).model;
    const mesh = await load('bahamut.glb');
    const strays = removeStrays(clone(mesh.scene));
    expect(strays).toBeGreaterThanOrEqual(1); // the unskinned ring (bahamut_MeshNodeShape1, two primitives)
    const { model: boss } = await model('bahamut', 5);
    expect(boss.chrScale).toBe(4);
    const ratio = boss.trueHeight / girl.trueHeight;
    expect(ratio).toBeGreaterThan(2.5);
    expect(ratio).toBeLessThan(7);
    expect([boss.animated, boss.playsKo, boss.flaps]).toEqual([true, true, false]);
    boss.root.updateMatrixWorld(true);
    const box = new Box3().setFromObject(boss.root);
    expect(box.max.y - box.min.y).toBeCloseTo(5, 1);
    const plans = plansFor('bahamut', map, (await load('bahamut-anims.glb')).animations.map((c) => c.name));
    expect(plans.ko).toEqual({ enter: ['DEAD_00', 'DEAD_01', 'DEAD_02'], hold: 'DEAD_03', exit: [] });
    expect(plans.attack?.exit).toEqual(['ATTACK1_02', 'ATTACK1_03']);
    boss.noteOpen('attack', 0.25);
    for (let t = 0; t < 4; t += 1 / 30) boss.update(1 / 30);
    expect(finite(boss.root)).toBe(true);
  }, 180_000);

  it('the AI Bahamut: one rigid mesh in his own units, 7 tall with his wings out along x, no clips, so he flaps; fitted to the same height as the game\'s', async () => {
    const mesh = await load('bahamut-ai.glb');
    expect(mesh.animations).toHaveLength(0);
    const boss = new YrpModel('bahamut', clone(mesh.scene), [], 5, 'own', { chrScale: chrScaleOf(mesh.extras), look: 'pbr' });
    expect([boss.chrScale, boss.animated, boss.flaps, boss.meshCount]).toEqual([1, false, true, 1]);
    expect(boss.trueHeight).toBeCloseTo(7, 1);
    expect(boss.widthOverHeight).toBeGreaterThan(1.4); // the wings out
    boss.root.updateMatrixWorld(true);
    const box = new Box3().setFromObject(boss.root);
    expect(box.max.y - box.min.y).toBeCloseTo(5, 3);
    expect(boss.materials[0]!.roughness).toBeCloseTo(0.85, 2); // the file's own
    boss.setActivity(1);
    boss.update(1);
    expect(boss.flapAmplitude).toBeGreaterThan(0);
  }, 120_000);
});
