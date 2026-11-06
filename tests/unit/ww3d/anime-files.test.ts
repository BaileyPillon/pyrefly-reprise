/**
 * **The anime chapter's real girls, when they are on disk** (`public/models-exp/windwaker/anime/{yuna,rikku,paine}.glb`: the LOD1 files of the Meshy toon cast, 2048 px, about 20k triangles, **after the part-2 proportion pass**: a smaller head and longer legs
 * baked in by `tools/anime/proportion.mjs`, and the Wind Waker cast's upright idle and victory retargeted by `tools/anime/retarget.mjs`; the hidden anime chapter, FFX-2 only).
 * The files are kept out of git (they do ship in a production build), so every test here is skipped on a machine without them. Where they are, each is read in Node with no renderer (three's own `GLTFLoader`, pictures stripped,
 * through the chapter's own loaders, `../helpers/wwRealFiles.ts`), and the chapter's code is run over the REAL geometry, skeleton and clips:
 *
 * 1. **Each file is what the survey says**: one skinned mesh on the 24-joint Meshy rig, the bones every module reads (the head turn, the weapons, the facing, the face mask's `head_end`), the right height, the feet on y 0, and clips
 *    `idle` (the upright one), `attack`, `hit`, `cast`, `ko` and `victory` by name (and `walk` and `run`, which no role plays) and no `idle_combat`; **the proportion pass shows**: the height over the head's length (Head to `head_end`) is in the
 *    band of a taller-bodied, smaller-headed girl (before the pass: Yuna 6.1, Rikku 7.2, Paine 5.8);
 * 2. **The role map**: the idle is `idle`, a knock-out clip exists (so the skin lets it play instead of tipping her over), the strike windows are found;
 * 3. **The face is found**: the face mask on the real head covers a plausible part of the head's vertices, none of the body's, and the hull is made with no width inside it;
 * 4. **The real loader and the real material**: `loadWwModels` with the anime staging stands the three girls on their own files, cel, at their own heights, the head raised and turned, with the weapons from files on the hand bones.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { AnimationClip, Box3, Group, Vector3, type BufferAttribute, type SkinnedMesh } from 'three';
import { describe, expect, it } from 'vitest';

import { ANIME_CAMERA_POSITION, ANIME_FILES, ANIME_PROP_SPECS, ANIME_STAGING, ANIME_WORLD_HEIGHT } from '../../../src/engine/ww3d/animeLayout.ts';
import { UNUSED_CLIPS, roleClips, windowsOfClips } from '../../../src/engine/ww3d/clips.ts';
import { CEL_LOOKS, createCelUniforms } from '../../../src/engine/ww3d/cel.ts';
import { celify, createCelRig, type CelStyle } from '../../../src/engine/ww3d/celify.ts';
import { measureFace } from '../../../src/engine/ww3d/faceMask.ts';
import { FileCache } from '../../../src/engine/ww3d/io.ts';
import { WW_PARTY_IDS, type WwId } from '../../../src/engine/ww3d/layout.ts';
import { loadWwModels } from '../../../src/engine/ww3d/model.ts';
import { createOutlineUniforms } from '../../../src/engine/ww3d/outline.ts';
import { loadSwaps } from '../../../src/engine/ww3d/swaps.ts';
import { createToonUniforms } from '../../../src/engine/ww3d/toon.ts';
import { WW_MODEL_DIR, WW_PROP_DIR, WW_TEMPLE_DIR } from '../../../src/data/windwaker-ids.ts';
import { boxOf, modelsDir, readGltf, realIo, trianglesOf } from '../helpers/wwRealFiles.ts';

const path = (id: WwId): string => join(modelsDir, `${ANIME_FILES[id]}.glb`);
const have = WW_PARTY_IDS.every((id) => existsSync(path(id)));
/** The height over the head's length (Head to head_end) of the files of the proportion pass, as a band (measured 2026-11-06: Yuna 7.90, Rikku 9.02, Paine 7.01; the files before it: 6.08, 7.20, 5.82). */
const PASS_RATIO: Readonly<Record<'yuna' | 'rikku' | 'paine', readonly [number, number]>> = { yuna: [7.5, 8.3], rikku: [8.5, 9.5], paine: [6.6, 7.4] };
const NEEDED = ['Hips', 'Spine', 'Head', 'head_end', 'headfront', 'LeftShoulder', 'RightShoulder', 'LeftForeArm', 'RightForeArm', 'LeftHand', 'RightHand', 'LeftUpLeg', 'RightUpLeg'];

describe.skipIf(!have)('the three girls\' LOD1 files', () => {
  for (const id of WW_PARTY_IDS) {
    it(`${id}: one skinned mesh on the 24-joint rig with every bone the chapter reads, a base-colour map, her own height, her feet on y 0, 20 thousand triangles`, () => {
      const g = readGltf(path(id));
      const names = new Set(g.nodes.map((n) => n.name));
      for (const bone of NEEDED) expect(names.has(bone), `${id} has ${bone}`).toBe(true);
      expect(g.skins).toHaveLength(1);
      expect(g.skins![0]!.joints).toHaveLength(24);
      expect(g.nodes.filter((n) => n.mesh !== undefined)).toHaveLength(1);
      expect(g.materials?.[0]?.pbrMetallicRoughness?.baseColorTexture, 'the base-colour map the cel keeps').toBeDefined();
      const box = boxOf(g);
      expect(box.max[1]! - box.min[1]!, `${id}'s height`).toBeCloseTo(ANIME_STAGING.nativeHeight[id], 1);
      expect(box.min[1]!, 'the feet on y 0 in the bind pose').toBeCloseTo(0, 1);
      expect(trianglesOf(g)).toBeGreaterThan(15_000);
      expect(trianglesOf(g)).toBeLessThan(25_000);
    });

    it(`${id}: the proportion pass is in the file (the height is ${PASS_RATIO[id][0]} to ${PASS_RATIO[id][1]} lengths of her head, Head to head_end; the pass's own bounding box is her native height)`, () => {
      const g = readGltf(path(id));
      const head = g.nodes.find((n) => n.name === 'head_end')!;
      const len = Math.hypot(...(head as unknown as { translation: [number, number, number] }).translation);
      const box = boxOf(g);
      const ratio = (box.max[1]! - box.min[1]!) / len;
      expect(ratio, `${id}'s height over her head's length`).toBeGreaterThan(PASS_RATIO[id][0]);
      expect(ratio).toBeLessThan(PASS_RATIO[id][1]);
    });

    it(`${id}: clips idle, attack, hit, cast, ko and victory (and the walk and the run no role plays), no combat stance; the roles are found and the strike has a window`, () => {
      const g = readGltf(path(id));
      const names = (g.animations ?? []).map((a) => a.name ?? '');
      expect([...names].sort()).toEqual(['attack', 'cast', 'hit', 'idle', 'ko', 'run', 'victory', 'walk']);
      const by = roleClips(names.map((n) => new AnimationClip(n, 1, [])));
      expect([...by.keys()].sort()).toEqual(['attack', 'cast', 'hit', 'idle', 'ko', 'victory']);
      expect(by.get('idle')?.name).toBe('idle');
      for (const n of names.filter((x) => UNUSED_CLIPS.test(x))) expect([...by.values()].map((c) => c.name)).not.toContain(n);
    });
  }

  it('has the hands and forearms every weapon of the anime specs sits on', () => {
    for (const id of WW_PARTY_IDS) {
      const names = new Set(readGltf(path(id)).nodes.map((n) => n.name));
      for (const spec of ANIME_PROP_SPECS[id]) {
        expect(names.has(spec.hand), `${id} ${spec.hand}`).toBe(true);
        expect(names.has(spec.hand.replace('Hand', 'ForeArm')), `${id} ${spec.hand} forearm`).toBe(true);
      }
    }
  });
});

const FACE_VERTS_AFTER_PASS: Readonly<Record<'yuna' | 'rikku' | 'paine', number>> = { yuna: 130, rikku: 193, paine: 204 };

describe.skipIf(!have)('the chapter\'s code over the real girls', () => {
  const style = (): CelStyle => ({ look: CEL_LOOKS.genshin, uniforms: createCelUniforms(CEL_LOOKS.genshin), outline: createOutlineUniforms(CEL_LOOKS.genshin.outline) });

  for (const id of WW_PARTY_IDS) {
    it(`${id}: the strike window is found from the real attack clip, the knock-out plays whole, and the face mask lands on a plausible part of the head`, async () => {
      const files = new FileCache(realIo());
      const parsed = await files.get(`/${WW_MODEL_DIR}/${ANIME_FILES[id]}.glb`);
      expect(parsed).not.toBeNull();
      const by = roleClips(parsed!.animations);
      const windows = windowsOfClips(by);
      expect(windows.attack, 'the attack window').toBeDefined();
      expect(windows.attack!.end).toBeGreaterThan(windows.attack!.start);
      expect(windows.ko).toEqual({ start: 0, end: by.get('ko')!.duration });
      expect(windows.victory, 'the victory window').toBeDefined();
      // the upright idle: the hips stand within a tenth of their rest height (the file's own combat stance sat at 0.86) and the clip loops a few seconds
      const idle = by.get('idle')!;
      const hips = idle.tracks.find((t) => t.name === 'Hips.position')!;
      const rest = (await files.io.clone(parsed!.scene)).getObjectByName('Hips')!.position.y;
      expect(hips.values[1]! / rest, `${id}'s idle hips over their rest height`).toBeGreaterThan(0.9);
      expect(hips.values[1]! / rest).toBeLessThan(1.05);
      expect(idle.duration).toBeGreaterThan(1.5);
      const scene = await files.io.clone(parsed!.scene);
      const mesh = scene.getObjectByProperty('isSkinnedMesh', true) as SkinnedMesh;
      scene.updateMatrixWorld(true);
      const f = measureFace(scene, mesh, id)!;
      expect(f).not.toBeNull();
      const verts = mesh.geometry.attributes['position']!.count;
      expect(f.H, 'the head is a few tenths of a metre long').toBeGreaterThan(0.12);
      expect(f.H).toBeLessThan(0.45);
      // measured 2026-11-06 on the LOD1 files: Yuna 6191 head and 132 face of 17847; Rikku 8191 and 193 of 18503; Paine 4859 and 204 of 16788 (the hair is most of the head's vertices; the face is a smooth, sparsely meshed patch)
      expect(f.headVerts / verts, 'the head, hair included, is a quarter to a half of the vertices').toBeGreaterThan(0.2);
      expect(f.headVerts / verts).toBeLessThan(0.5);
      expect(f.faceVerts, 'the face is a hundred vertices or more').toBeGreaterThan(80);
      // the part-2 proportion pass scales the head uniformly about its joint, so the head-relative ellipse of FACE_FIT still finds the same face: 132 / 193 / 204 before the pass (above), 130 / 193 / 204 after it
      // (the review of 2026-11-06); a pass that changed the head's shape would move these and send FACE_FIT back to be re-fitted
      expect(Math.abs(f.faceVerts - FACE_VERTS_AFTER_PASS[id]), `${id}'s face vertices under FACE_FIT (${f.faceVerts})`).toBeLessThanOrEqual(6);
      expect(f.faceVerts / f.headVerts, 'and a small share of the head').toBeLessThan(0.2);
      const mask = (mesh.geometry.attributes['aFace'] as BufferAttribute).array as Float32Array;
      let bodyFace = 0;
      for (let i = 0; i < verts; i++) if (mask[i]! > 0.5 && f.hw[i]! < 0.3) bodyFace++;
      expect(bodyFace, 'no vertex of the body is a face').toBe(0);
      files.dispose();
    });
  }

  it('celify over the real Yuna makes the hull with no width inside the face and a width everywhere else', async () => {
    const files = new FileCache(realIo());
    const parsed = (await files.get(`/${WW_MODEL_DIR}/${ANIME_FILES.yuna}.glb`))!;
    const scene = await files.io.clone(parsed.scene);
    scene.updateMatrixWorld(true);
    const set = celify(scene, style(), { id: 'yuna' });
    const hull = scene.getObjectByName(`${set.meshes[0]!.name}:outline`)!;
    expect(hull).toBeDefined();
    const w = (hull as SkinnedMesh).geometry.attributes['aThick']!.array as Float32Array;
    const zero = w.reduce((n, v) => n + (v < 0.05 ? 1 : 0), 0);
    const full = w.reduce((n, v) => n + (v > 0.95 ? 1 : 0), 0);
    expect(zero, 'a face of no width').toBeGreaterThan(100);
    expect(full / w.length, 'most of her is outlined').toBeGreaterThan(0.8);
    files.dispose();
  });

  it('loadWwModels with the anime staging stands the three girls on their own files, cel, at their own heights, with the weapons from the files on their hands', async () => {
    const io = realIo();
    const files = new FileCache(io);
    const swaps = await loadSwaps(files, '/', WW_PROP_DIR, WW_TEMPLE_DIR);
    const loaded = await loadWwModels({ base: '/', dir: WW_MODEL_DIR, heights: ANIME_WORLD_HEIGHT, files, context: { uniforms: createToonUniforms(), swaps: swaps.props, camera: ANIME_CAMERA_POSITION, staging: ANIME_STAGING, shading: createCelRig('genshin').shading } });
    expect(loaded.capsules).toEqual([]);
    for (const id of WW_PARTY_IDS) {
      const m = loaded.models.get(id)!;
      expect(m.source).toBe('own');
      expect(m.animated).toBe(true);
      expect(m.falls, `${id} has a knock-out clip: she lies down by it`).toBe(true);
      expect(m.turnsHead).toBe(true);
      expect(m.materials.every((e) => e.material.userData['ww'] === 'cel')).toBe(true);
      const box = new Box3().setFromObject(m.root);
      expect(box.getSize(new Vector3()).y, `${id}'s fitted height`).toBeGreaterThan(ANIME_WORLD_HEIGHT[id] * 0.9);
      expect(box.getSize(new Vector3()).y).toBeLessThan(ANIME_WORLD_HEIGHT[id] * 1.15);
      expect(m.weapons.length, `${id}'s weapons`).toBe(ANIME_PROP_SPECS[id].length);
      expect(m.swappedProps, `${id}'s weapons come from the files`).toBe(ANIME_PROP_SPECS[id].length);
    }
    expect(loaded.models.get('x2-valefor')?.source).toBe('own');
    // the head is turned toward the lens and raised: the face looks no more than a few degrees below the horizon
    for (const id of WW_PARTY_IDS) {
      const m = loaded.models.get(id)!;
      const group = new Group();
      group.add(m.root);
      m.update(0.5);
      const head = m.headTopWorld();
      expect(head, `${id}'s head top`).not.toBeNull();
      expect(head!.y).toBeGreaterThan(ANIME_WORLD_HEIGHT[id] * 0.6);
    }
    loaded.dispose();
  });
});
