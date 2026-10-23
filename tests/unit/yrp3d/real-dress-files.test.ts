/**
 * **The real dressphere files, through the real loader** (the hidden 3D Bahamut chapter, the real-models branch, FFX-2 only; `src/engine/yrp3d/dress*.ts`). These files are Bailey's own extracted models, local only
 * (`public/models-exp/yrp/dress/`, put there by `tools/yrp-dress-install.mjs`; gitignored), so every test here is **skipped when they are not on the disk**. With them, the manifest and every folder it lists run through
 * three's own `GLTFLoader` (the textures are stripped out of the files first: the loader needs a DOM for them, and nothing here looks at colour). What it pins:
 *
 * 1. **The manifest** names every folder, each has its `anims.glb` and `clipmap.json` (and `hd/anims.glb` where it says so), the three starters are the ones Chapter IV's build says, and the 29 dresspheres the three girls own
 *    in the chapter all have an HD file.
 * 2. **Each dressphere model**: the plans of its own clip map are all playable by its clips (an idle with a clip that is in the file), the scale from the extras is the girl's own (1), the weapons the manifest counts are in the
 *    file under bones, and the girl stands at her figure's height by the body alone.
 * 3. **A rig plays the poses** on the three starters' real skeletons (an attack, a cast, an item, a hit, a fall, a rise, the kneel, victory) without a NaN in any bone.
 */
import { existsSync, readFileSync } from 'node:fs';
import { Box3, type AnimationClip, type Bone, type Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { describe, expect, it } from 'vitest';

import { bevelleBuild } from '../../../src/data/ffx2/builds/bevelle.ts';
import { dressPlansFor } from '../../../src/engine/yrp3d/clipMap.ts';
import { dressFiles, parseDressIndex, type DressEntry } from '../../../src/engine/yrp3d/dress.ts';
import { PARTY_HEIGHT } from '../../../src/engine/yrp3d/layout.ts';
import { chrScaleOf } from '../../../src/engine/yrp3d/load.ts';
import { YrpModel } from '../../../src/engine/yrp3d/model.ts';

const DIR = 'public/models-exp/yrp/dress';
const have = existsSync(`${DIR}/index.json`);
const index = have ? parseDressIndex(JSON.parse(readFileSync(`${DIR}/index.json`, 'utf8'))) : null;

/** A binary glTF with its textures taken out (no DOM is needed to parse the rest). */
function stripImages(buf: Buffer): ArrayBuffer {
  const len = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + len).toString('utf8')) as Record<string, unknown> & { materials?: Array<Record<string, unknown> & { pbrMetallicRoughness?: Record<string, unknown> }> };
  delete json['images'];
  delete json['textures'];
  delete json['samplers'];
  for (const m of json.materials ?? []) {
    if (m.pbrMetallicRoughness) delete m.pbrMetallicRoughness['baseColorTexture'];
    for (const k of ['normalTexture', 'occlusionTexture', 'emissiveTexture']) delete m[k];
  }
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

/** The model of an entry as the library builds it: the base armed file, its own clip map, the scale from its extras. */
async function modelOf(e: DressEntry): Promise<{ model: YrpModel; scene: Object3D; clips: AnimationClip[]; names: string[] }> {
  const f = dressFiles(e);
  const file = await load(f.anims);
  const names = file.animations.map((c) => c.name);
  const plans = dressPlansFor(JSON.parse(readFileSync(`${DIR}/${f.clipmap}`, 'utf8')), names);
  const scene = clone(file.scene);
  return { model: new YrpModel(e.girl, scene, file.animations, PARTY_HEIGHT, 'own', { plans, chrScale: chrScaleOf(file.extras), dress: { name: e.dress, weapons: e.weapons } }), scene, clips: file.animations, names };
}

const finite = (root: Object3D): boolean => {
  root.updateMatrixWorld(true);
  let ok = true;
  root.traverse((o) => {
    if ((o as Bone).isBone && !o.matrixWorld.elements.every(Number.isFinite)) ok = false;
  });
  return ok;
};

/** The specials are not girl-sized (Floral Fallal and Machina Maw are 40 and 26 raw units tall, Full Throttle has three meshes). */
const SPECIAL = new Set(['floral-fallal', 'machina-maw', 'full-throttle']);

describe.skipIf(!have || !index)('the real dressphere files through the real loader', () => {
  it('has a folder for every entry with its files, the starters of Chapter IV, and an HD file for each of the 29 dresspheres the girls own in the chapter', () => {
    expect(index!.starts).toEqual({ yuna: 'white-mage', rikku: 'dark-knight', paine: 'warrior' });
    for (const e of index!.entries) {
      const f = dressFiles(e);
      expect(existsSync(`${DIR}/${f.anims}`), f.anims).toBe(true);
      expect(existsSync(`${DIR}/${f.clipmap}`), f.clipmap).toBe(true);
      if (f.hdAnims) expect(existsSync(`${DIR}/${f.hdAnims}`), f.hdAnims).toBe(true);
    }
    let owned = 0;
    for (const m of bevelleBuild.members) {
      for (const d of m.owned) {
        owned++;
        expect(index!.has(m.id as 'yuna', d), `${m.id} ${d}`).toBe(true);
        expect(index!.get(m.id as 'yuna', d)!.hd, `${m.id} ${d} has an HD file`).toBe(true);
      }
    }
    expect(owned).toBe(29);
  });

  it('every model: the plans of its own clip map are all playable by its clips, the scale is the girl\'s own, the weapons the manifest counts are in the file, and the girl stands at her figure\'s height by the body alone', async () => {
    for (const e of index!.entries) {
      const { model, scene, names } = await modelOf(e);
      const tag = `${e.girl} ${e.dress}`;
      expect(model.dress, tag).toBe(e.dress);
      expect(model.animated, `${tag}: an idle with a clip in the file`).toBe(true);
      expect(names.includes('APPEAR_00') || names.some((n) => n.startsWith('SEQ_')), tag).toBe(true);
      // every pose the clip map names is playable (the rig is built from `usable` plans, so what is left is what plays)
      const plans = dressPlansFor(JSON.parse(readFileSync(`${DIR}/${dressFiles(e).clipmap}`, 'utf8')), names);
      for (const pose of ['idle', 'hurt', 'attack', 'cast', 'victory', 'ko'] as const) expect(plans[pose], `${tag}: ${pose}`).toBeDefined();
      expect(chrScaleOf((await load(dressFiles(e).anims)).extras), tag).toBe(1);
      let weapons = 0;
      scene.traverse((o) => {
        if ((o as { isMesh?: boolean }).isMesh && !(o as { isSkinnedMesh?: boolean }).isSkinnedMesh) weapons++;
      });
      if (e.weapons === 0) expect(weapons, `${tag}: holds nothing`).toBe(0);
      else expect(weapons, `${tag}: its weapon meshes are in the file`).toBeGreaterThanOrEqual(1);
      expect(model.weaponKind, tag).toBe(e.weapons > 0 ? 'real' : 'none');
      if (!SPECIAL.has(e.dress)) {
        expect(model.trueHeight, tag).toBeGreaterThan(14);
        expect(model.trueHeight, tag).toBeLessThan(24); // a Mascot's hat makes it taller than the rest (Yuna's is 21)
        model.root.updateMatrixWorld(true);
        const box = new Box3(); // a body is many skinned meshes (hair, eyes, parts): all of them, and no weapon
        model.root.traverse((o) => {
          if ((o as { isSkinnedMesh?: boolean }).isSkinnedMesh) box.expandByObject(o);
        });
        expect(box.max.y - box.min.y, `${tag}: the body stands at her height`).toBeCloseTo(PARTY_HEIGHT, 1);
      }
      expect(finite(model.root), tag).toBe(true);
    }
  }, 300_000);

  it('plays each pose on the three starters\' real skeletons (an attack, a cast, an item, a hit, a fall, a rise, the kneel, victory) without a NaN in any bone', async () => {
    for (const girl of ['yuna', 'rikku', 'paine'] as const) {
      const e = index!.get(girl, index!.starts[girl])!;
      const { model } = await modelOf(e);
      const tag = `${girl} ${e.dress}`;
      const step = (seconds: number): void => {
        for (let t = 0; t < seconds; t += 1 / 30) model.update(1 / 30);
        expect(finite(model.root), `${tag} bone matrices`).toBe(true);
      };
      for (const kind of ['attack', 'cast', 'item'] as const) {
        model.noteOpen(kind, 0.3);
        expect(model.playing, `${tag}: the ${kind} starts (a pose with no plan would stay in the idle)`).toBe(kind);
        step(0.4);
        model.noteImpact();
        step(0.4);
        model.noteClose();
        step(3);
        expect(model.playing, `${tag} ${kind} ends in the idle`).toBe('idle');
      }
      model.notePose('hurt', false, false);
      step(0.6);
      model.notePose('idle', true, false);
      step(2);
      expect(model.playing, tag).toBe('ko');
      model.notePose('idle', false, false);
      step(2);
      model.notePose('idle', false, true);
      step(1.5);
      expect(model.playing, tag).toBe('critical');
      model.notePose('victory', false, false);
      step(1);
      model.dispose();
    }
  }, 300_000);
});
