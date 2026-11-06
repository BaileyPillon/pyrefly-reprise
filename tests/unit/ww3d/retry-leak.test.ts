// @vitest-environment jsdom
/**
 * **Entering the Wind Waker chapter again leaves no texture on the GPU** (the hidden Wind Waker chapter, `src/engine/ww3d/toonify.ts`, `io.ts`, `model.ts`; FFX-2 only). Release 75 second code pass, the driver's
 * decision 1 (2026-11-03): the same hole the 3D Bahamut chapter had (the release 74 browser read YR-11, fixed in `yrp3d/retry-leak.test.ts`), found in the same pattern here.
 *
 * Each model of the chapter is `SkeletonUtils.clone` of its parsed file (`LoaderIO.clone`'s default), which gives it a `Skeleton` of its own for every skinned mesh. The first draw gives each a bone texture
 * (`Skeleton.computeBoneTexture`, which needs no GL) that only `Skeleton.dispose()` frees; `disposeToon` freed the toon materials and the file cache the geometry and the colour maps, and left the bone textures behind,
 * one per skinned mesh every time the scene was entered again, with the heap and the geometry count flat. The cache also freed the colour map alone: a file that kept a normal, roughness, metalness or occlusion map left
 * it behind, and the skeletons a plain clone shares with its file (`Object3D.clone`, the swapped props and temple pieces) were never freed either.
 *
 * What this file does, with no GL: runs the scene's real setup (`exp-windwaker-stage.ts`: a `FileCache` over the loader's IO with the real `SkeletonUtils.clone`, `prefetchModels`, `loadWwModels` with the cache handed in,
 * `WwSkin` on real `PaintedActor`s) over fake skinned and textured files, "draws" the models (each skinned mesh's skeleton makes its bone texture) and counts, per retry, the textures made against the textures freed
 * (`Texture.prototype.dispose` is spied), through the scene's dispose order (`fx`, `hits`, `skin`, which frees the models, then the cache). Over five retries nothing may stay alive. Mutations: `disposeToon` without
 * the skeleton line fails the tests marked below; `FileCache.dispose` back on the colour map alone and without the skeletons fails the cache tests.
 */
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Scene, Skeleton, Texture, type Bone, type Object3D } from 'three';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { PaintedActor } from '../../../src/engine/PaintedActor.ts';
import { FileCache, type LoaderIO } from '../../../src/engine/ww3d/io.ts';
import { PARTY_SLOTS, WORLD_HEIGHT, WW_BOSS_ID, WW_CAST, type WwId } from '../../../src/engine/ww3d/layout.ts';
import { TARGET_POSITION } from '../../../src/engine/ww3d/camera.ts';
import { loadWwModels, prefetchModels, type WwModels } from '../../../src/engine/ww3d/model.ts';
import { HitFx } from '../../../src/engine/ww3d/hitFx.ts';
import { MoveFx } from '../../../src/engine/ww3d/moveFx.ts';
import { WwSkin } from '../../../src/engine/ww3d/skin.ts';
import { createToonUniforms } from '../../../src/engine/ww3d/toon.ts';
import { drawSkinned, noopContext, onGpu, pixel, skinnedPart, skinnedUnder, useTextureLedger } from '../helpers/textureLedger.ts';
import { fakeIo, girl, valefor } from '../helpers/wwFixtures.ts';

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    return noopContext(this) as never;
  });
});
afterAll(() => vi.restoreAllMocks());

const ledger = useTextureLedger();

/** The skinned meshes of a girl's file (a body, hair, cloth): the clone of the file gives each its own skeleton, so each draws with a bone texture of its own. */
const PARTS = ['body_mesh', 'hair_mesh', 'cloth_mesh'] as const;

/** Every texture the fake parser has made (what a real glTF parse would have decoded), in order. */
const decoded: Texture[] = [];
afterEach(() => (decoded.length = 0));
const texturesOf = (scene: Object3D): Texture[] => {
  const out: Texture[] = [];
  scene.traverse((o) => {
    const material = (o as Mesh).material as MeshStandardMaterial | undefined;
    if (!material) return;
    for (const value of Object.values(material)) if ((value as Texture | null)?.isTexture === true) out.push(value as Texture);
  });
  return out;
};

/** The chapter's rigged girl (the bones it reads, three clips) with `PARTS` skinned on her skeleton, each with a colour map and a normal map. */
function skinnedGirl(): ReturnType<typeof girl> {
  const file = girl();
  file.scene.updateMatrixWorld(true);
  const bones: Bone[] = [];
  file.scene.traverse((o) => {
    if ((o as Bone).isBone) bones.push(o as Bone);
  });
  const skeleton = new Skeleton(bones);
  for (const name of PARTS) {
    const mesh = skinnedPart(name, true);
    file.scene.add(mesh);
    mesh.bind(skeleton);
  }
  return file;
}

/** The loader's IO over fake files (`yuna`, `rikku` and `paine` skinned and textured, Valefor one static mesh with a map), cloned by the REAL `SkeletonUtils.clone` the app uses. */
function realCloneIo(): LoaderIO {
  const io = fakeIo({
    'yuna.glb': skinnedGirl,
    'rikku.glb': skinnedGirl,
    'paine.glb': skinnedGirl,
    'valefor.glb': () => {
      const file = valefor();
      (file.scene.children[0] as Mesh).material = new MeshStandardMaterial({ map: pixel('valefor-colour'), normalMap: pixel('valefor-normal') });
      return file;
    },
  });
  return {
    fetchBytes: io.fetchBytes,
    parse: async (bytes) => {
      const parsed = await io.parse(bytes);
      decoded.push(...texturesOf(parsed.scene));
      return parsed;
    },
    clone: async (scene) => skeletonClone(scene) as Object3D,
  };
}

const STAGE_HEIGHT: Record<WwId, number> = { yuna: 1.75, rikku: 1.75, paine: 1.75, 'x2-valefor': 4 };
const blank = (): HTMLCanvasElement => document.createElement('canvas');
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0)); // the cache frees the parsed files a tick after `dispose` (it waits for any parse still in flight)

interface Attempt {
  models: WwModels;
  made: Set<Texture>;
  bones: Set<Texture>;
  teardown(): Promise<void>;
}

/** One entry into the chapter, as `buildExpWindwakerStageScene` does it for the models, and its teardown in the scene's `dispose` order (`fx`, `hits`, `skin` which frees the models, then the file cache). */
async function attempt(): Promise<Attempt> {
  const io = realCloneIo();
  const files = new FileCache(io);
  prefetchModels(files, '/', 'models-exp/windwaker');
  const models = await loadWwModels({ base: '/', dir: 'models-exp/windwaker', heights: WORLD_HEIGHT, context: { uniforms: createToonUniforms(), camera: TARGET_POSITION }, files });
  expect(models.capsules, 'every fake file loads, so no figure stands on a capsule').toEqual([]);
  const scene = new Scene();
  const host = new Group();
  scene.add(host);
  const actors = WW_CAST.map((id) => new PaintedActor({ name: id, worldHeight: STAGE_HEIGHT[id], side: id === WW_BOSS_ID ? 'enemy' : 'party', placeholder: blank }));
  actors.forEach((a, i) => {
    if (i < 3) a.position.set(PARTY_SLOTS[i]![0], 0, PARTY_SLOTS[i]![2]);
    scene.add(a);
  });
  const fx = new MoveFx();
  scene.add(fx.group);
  const hits = new HitFx();
  scene.add(hits.group);
  const skin = new WwSkin({ host, models, fx, hits });
  skin.update(0.05); // each model is carried by its actor
  expect(Object.keys(skin.carrying).sort()).toEqual([...WW_CAST].sort());

  const made = new Set<Texture>(decoded);
  const bones = new Set<Texture>();
  for (const id of WW_CAST) {
    const root = models.models.get(id)!.root;
    for (const t of drawSkinned(root)) bones.add(t);
    for (const t of onGpu(root)) made.add(t);
  }
  return {
    models,
    made,
    bones,
    async teardown(): Promise<void> {
      fx.dispose();
      hits.dispose();
      skin.dispose(); // frees the models
      files.dispose();
      for (const a of actors) a.dispose();
      await settle();
    },
  };
}

describe('a model\'s bone textures are the model\'s to free (FFX-2 only)', () => {
  it('disposing a model frees the bone texture of every skinned mesh of its clone, and only its own (mutation: fails)', async () => {
    const files = new FileCache(realCloneIo());
    const models = await loadWwModels({ base: '/', dir: 'models-exp/windwaker', heights: WORLD_HEIGHT, context: { uniforms: createToonUniforms(), camera: TARGET_POSITION }, files });
    const yuna = models.models.get('yuna')!;
    const rikku = models.models.get('rikku')!;
    expect(skinnedUnder(yuna.root)).toHaveLength(PARTS.length);
    const yunaBones = drawSkinned(yuna.root);
    const rikkuBones = drawSkinned(rikku.root);
    expect(new Set(yunaBones).size, 'the clone gave each skinned mesh its own skeleton').toBe(PARTS.length);
    yuna.dispose();
    expect(ledger.alive(yunaBones)).toEqual([]);
    expect(ledger.alive(rikkuBones), 'Rikku is still on the field: her textures stay').toHaveLength(PARTS.length);
    expect(skinnedUnder(yuna.root)[0]!.skeleton.boneTexture, 'cleared, so a new draw would make a new one').toBeNull();
    models.dispose();
    files.dispose();
    await settle();
    expect(ledger.alive(rikkuBones)).toEqual([]);
  });

  it('a capsule has no skinned mesh, so freeing its skeletons does nothing and its geometry is still freed', async () => {
    const models = await loadWwModels({ base: '/', dir: 'models-exp/windwaker', heights: WORLD_HEIGHT, context: { uniforms: createToonUniforms(), camera: TARGET_POSITION }, io: fakeIo({}) });
    expect(models.capsules).toHaveLength(WW_CAST.length);
    const capsule = models.models.get('yuna')!;
    expect(skinnedUnder(capsule.root)).toHaveLength(0);
    let geometries = 0;
    capsule.root.traverse((o) => {
      const mesh = o as Mesh;
      if (mesh.isMesh) mesh.geometry.addEventListener('dispose', () => geometries++);
    });
    models.dispose();
    expect(geometries).toBeGreaterThan(0);
  });
});

describe('the file cache frees the skeletons and every texture of the files it parsed (FFX-2 only)', () => {
  it('a skeleton a plain clone shares with its file (a swapped prop or a temple piece, `Object3D.clone`) is freed with the cache (mutation: fails)', async () => {
    const files = new FileCache(realCloneIo());
    const parsed = (await files.get('/models-exp/windwaker/yuna.glb'))!;
    const shared = parsed.scene.clone(true); // what `chooseProp` and `templateOf` make: the meshes share the file's skeleton
    const fromClone = drawSkinned(shared);
    expect(new Set(fromClone).size, 'the plain clone draws with the file\'s one skeleton').toBe(1);
    expect(skinnedUnder(shared)[0]!.skeleton).toBe(skinnedUnder(parsed.scene)[0]!.skeleton);
    files.dispose();
    await settle();
    expect(ledger.alive(fromClone).map(ledger.label)).toEqual([]);
  });

  it('a file\'s colour, normal, roughness, metalness and occlusion maps are all freed, not the colour map alone (mutation: the colour map alone fails)', async () => {
    const maps = { map: pixel('c'), normalMap: pixel('n'), roughnessMap: pixel('r'), metalnessMap: pixel('m'), aoMap: pixel('a') };
    const io = fakeIo({
      'yuna.glb': () => {
        const scene = new Group();
        scene.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial(maps)));
        return { scene, animations: [] };
      },
    });
    const files = new FileCache(io);
    expect(await files.get('/models-exp/windwaker/yuna.glb')).not.toBeNull();
    files.dispose();
    await settle();
    for (const [name, t] of Object.entries(maps)) expect(ledger.freed.has(t), name).toBe(true);
  });
});

describe('five entries into the chapter through the scene\'s real setup (FFX-2 only)', () => {
  const RETRIES = 5;

  it('each retry makes the same textures (nine bone textures, the files\' maps) and after its teardown NONE is left on the GPU: the count is flat (mutation: fails)', async () => {
    const perRetry: number[] = [];
    let stillAlive = 0;
    for (let i = 0; i < RETRIES; i++) {
      const a = await attempt();
      expect(a.bones.size, 'a bone texture per skinned mesh of the three girls\' clones').toBe(3 * PARTS.length);
      expect(ledger.alive(a.bones), 'while the fight is on the bone textures are up').toHaveLength(a.bones.size); // (the toon pass closes the maps it never reads when it is made: `releaseUnread`)
      await a.teardown();
      perRetry.push(a.made.size);
      stillAlive += ledger.alive(a.made).length;
      expect(ledger.alive(a.made).map(ledger.label), `retry ${i + 1}: textures left on the GPU`).toEqual([]);
      decoded.length = 0; // each retry is counted on its own
    }
    expect(new Set(perRetry).size, 'the same setup makes the same textures every time').toBe(1);
    expect(perRetry[0]!).toBeGreaterThanOrEqual(3 * PARTS.length);
    expect(stillAlive).toBe(0);
  });

  it('no texture is carried from one retry to the next (nothing a later retry could free twice or miss)', async () => {
    const first = await attempt();
    await first.teardown();
    decoded.length = 0;
    const second = await attempt();
    for (const t of second.made) expect(first.made.has(t), 'a texture of the first retry in the second').toBe(false);
    await second.teardown();
    expect(ledger.alive(second.made)).toEqual([]);
  });
});
