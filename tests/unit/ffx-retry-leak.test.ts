// @vitest-environment jsdom
/**
 * **Entering the Fayth chapter again leaves no texture on the GPU** (the hidden Fayth chapter's `ffx` skin, `src/engine/ffx3d/models.ts`, `unlitParts.ts`; FFX only; dev server only: Bailey's own converted files).
 * Release 75 second code pass, the driver's decision 1 (2026-11-03): the same hole the 3D Bahamut chapter had (the release 74 browser read YR-11, fixed for FFX-2 in `yrp3d/retry-leak.test.ts`), found in the same pattern here.
 *
 * The converter's skinned actors are drawn straight from the glTF loader's scene. The first draw of a skinned mesh gives its `Skeleton` a bone texture (`Skeleton.computeBoneTexture`, which needs no GL), and only
 * `Skeleton.dispose()` frees it: the geometry, the unlit materials and the colour maps `FfxModel.dispose` freed left it behind, one texture per skeleton every time the chapter was entered again, with the heap and the
 * geometry count flat. The loader's own materials also held maps the unlit material never takes (a normal map): never drawn, so never on the GPU, but `unlit` now hands them back to be freed with the rest, so no file
 * texture outlives its model.
 *
 * What this file does, with no GL: runs the scene's real setup (`loadFfxModels` over a stand-in glTF loader that hands back skinned and textured scenes, `FfxSkin` on real `PaintedActor`s, then the scene's teardown
 * order: `skin.dispose()`, `models.dispose()`), "draws" every model (each skinned mesh's skeleton makes its bone texture) and counts, per retry, the textures made against the textures freed (`Texture.prototype.dispose`
 * is spied). Over five retries nothing may stay alive. Mutations: `freeAll` without the skeleton line fails three of the four tests (the two retry tests and the single-model one); `unlit` back on the colour map alone fails three (the two retry tests and the last).
 *
 * Game case: FFX only (the files are FFX's).
 */
import { Group, Mesh, MeshStandardMaterial, Scene, Texture, BoxGeometry, type Object3D } from 'three';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { FfxSkin } from '../../src/engine/ffx3d/ffxSkin.ts';
import { ffxFaythStaging } from '../../src/engine/ffx3d/ffxStaging.ts';
import type { FfxLocalManifest } from '../../src/engine/ffx3d/localAssets.ts';
import { loadFfxModels, type FfxModels } from '../../src/engine/ffx3d/models.ts';
import { PaintedActor } from '../../src/engine/PaintedActor.ts';
import { drawSkinned, noopContext, onGpu, pixel, skinnedFigure, skinnedUnder, useTextureLedger } from './helpers/textureLedger.ts';

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    return noopContext(this) as never;
  });
});
afterAll(() => vi.restoreAllMocks());

const ledger = useTextureLedger();

/** Every texture the stand-in loader has made (what a real glTF loader would have decoded), in order. */
const loaded: Texture[] = [];
const texturesOf = (scene: Object3D): void => {
  scene.traverse((o) => {
    const material = (o as Mesh).material as MeshStandardMaterial | undefined;
    if (!material) return;
    for (const value of Object.values(material)) if ((value as Texture | null)?.isTexture === true) loaded.push(value as Texture);
  });
};

/** A skinned actor scene shaped like the converter's: the game's scale in the scene extras, a bone the weapon hangs under, and skinned parts with a colour map AND a normal map each. */
function actorScene(scale: number, parts: readonly string[]): Group {
  const scene = skinnedFigure({ parts, bones: ['SkeletonNode_50'], normalMaps: true });
  scene.userData = { ffx: { runtimeScale: scale } };
  return scene;
}

/** The stage: static meshes with a map, one of them the sky. */
function stageScene(): Group {
  const scene = new Group();
  scene.userData = { ffx: { runtimeScale: 10 } };
  for (const name of ['polySurfaceShape5_1', 'FBXASC048_Shape0_2']) {
    const m = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ map: pixel(`${name}-colour`), vertexColors: true }));
    m.name = name;
    scene.add(m);
  }
  const sky = new Group();
  sky.name = 'sky';
  sky.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ map: pixel('sky-colour') })));
  scene.add(sky);
  return scene;
}

/** Tidus's weapon: a static mesh with a colour map and a normal map. */
function weaponScene(): Group {
  const scene = new Group();
  scene.userData = { ffx: { runtimeScale: 1 } };
  scene.add(new Mesh(new BoxGeometry(0.1, 1, 0.1), new MeshStandardMaterial({ map: pixel('weapon-colour'), normalMap: pixel('weapon-normal') })));
  return scene;
}

vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    async loadAsync(url: string): Promise<{ scene: Group }> {
      const file = url.slice(url.lastIndexOf('/') + 1);
      const scene = file === 'stage.glb' ? stageScene() : file.endsWith('-weapon.glb') ? weaponScene() : file.startsWith('evrae') ? actorScene(4, ['wing_mesh', 'body_mesh']) : actorScene(1, ['body_mesh', 'hair_mesh', 'cloth_mesh']);
      texturesOf(scene);
      return { scene };
    }
  },
}));

const manifest: FfxLocalManifest = {
  version: 1,
  encounter: 'evrae-airship',
  upAxis: 'y',
  units: 'ffx',
  stage: { file: 'evrae/stage.glb' },
  actors: { evrae: { file: 'evrae/evrae.glb', rawHeight: 52.152 }, tidus: { file: 'evrae/tidus.glb', rawHeight: 18.1467 } },
  source: 'test fixture',
};
const sidecars: Record<string, unknown> = {
  'weapons.json': { tidus: { weapon: 'Brotherhood', file: 'evrae/tidus-weapon.glb', attachNode: 'SkeletonNode_50', attachLocalRotationQuat: [1, 0, 0, 0], attachLocalTranslation: [0, 0, 0] } },
  'poses.json': { 'evrae-idle0': { file: 'evrae/evrae-idle0.glb', height: 34.2374, bbox_max: [1, 19.642, 1] }, 'tidus-idle0': { file: 'evrae/tidus-idle0.glb', height: 15.4318 } },
};
beforeAll(() => {
  vi.stubGlobal('fetch', async (url: string) => {
    const key = url.slice(url.lastIndexOf('/') + 1);
    return key in sidecars ? new Response(JSON.stringify(sidecars[key]), { status: 200 }) : new Response(null, { status: 404 });
  });
});
afterAll(() => vi.unstubAllGlobals());
afterEach(() => (loaded.length = 0));

interface Attempt {
  models: FfxModels;
  /** Textures the retry's models put on the GPU (the bone textures and the maps they draw) plus every texture the loader decoded. */
  made: Set<Texture>;
  /** Of them, the distinct bone textures. */
  bones: Set<Texture>;
  teardown(): void;
}

/** One entry into the chapter, as `stageFaythSkin` does it for the models, and its teardown in the scene's `dispose` order (`animator`, `skin`, `models`, then the build). */
async function attempt(): Promise<Attempt> {
  const models = await loadFfxModels(manifest);
  expect(models.problems, 'every file of the fixture loads').toEqual([]);
  const scene = new Scene();
  const host = new Group();
  scene.add(host);
  const actors = ['tidus', 'evrae'].map((id) => new PaintedActor({ name: id, worldHeight: id === 'evrae' ? 4.1 : 1.75, side: id === 'evrae' ? 'enemy' : 'party', placeholder: () => document.createElement('canvas') }));
  for (const a of actors) scene.add(a);
  const skin = new FfxSkin({ host, models, staging: ffxFaythStaging() });
  skin.update(0.05); // each model is carried by its actor
  expect(skin.modelOf('tidus'), 'Tidus carries his model').not.toBeNull();
  expect(skin.modelOf('evrae'), 'Evrae carries his model').not.toBeNull();

  const made = new Set<Texture>(loaded);
  const bones = new Set<Texture>();
  const roots = [...Object.values(models.actors).map((m) => m.root), ...(models.stage ? [models.stage.root] : [])];
  for (const root of roots) {
    for (const t of drawSkinned(root)) bones.add(t);
    for (const t of onGpu(root)) made.add(t);
  }
  return {
    models,
    made,
    bones,
    teardown(): void {
      skin.dispose();
      models.dispose();
      for (const a of actors) a.dispose();
    },
  };
}

describe('a model\'s bone textures are the model\'s to free (FFX only)', () => {
  it('disposing the model frees the bone texture of its skeleton and its weapon\'s textures, and only its own (mutation: fails)', async () => {
    const models = await loadFfxModels(manifest);
    const tidus = models.actors['tidus']!;
    const evrae = models.actors['evrae']!;
    expect(skinnedUnder(tidus.root)).toHaveLength(3);
    const tidusBones = new Set(drawSkinned(tidus.root));
    const evraeBones = new Set(drawSkinned(evrae.root));
    expect(tidusBones.size, 'the three parts share the one skeleton of the file').toBe(1);
    expect(evraeBones.size).toBe(1);
    tidus.dispose();
    expect(ledger.alive(tidusBones)).toEqual([]);
    expect(ledger.alive(evraeBones), 'Evrae is still on the field: his texture stays').toHaveLength(1);
    expect(skinnedUnder(tidus.root)[0]!.skeleton.boneTexture, 'cleared, so a new draw would make a new one').toBeNull();
    evrae.dispose();
    expect(ledger.alive(evraeBones)).toEqual([]);
    models.dispose();
  });
});

describe('five entries into the chapter through the scene\'s real setup (FFX only)', () => {
  const RETRIES = 5;

  it('each retry makes the same textures (two skeletons\' bone textures, the figures\', the weapon\'s and the stage\'s maps) and after its teardown NONE is left on the GPU (mutation: fails)', async () => {
    const perRetry: number[] = [];
    let stillAlive = 0;
    for (let i = 0; i < RETRIES; i++) {
      const a = await attempt();
      expect(a.bones.size, 'a bone texture per skeleton: Tidus\'s and Evrae\'s').toBe(2);
      expect(ledger.alive(a.made), 'while the fight is on everything is up').toHaveLength(a.made.size);
      a.teardown();
      perRetry.push(a.made.size);
      stillAlive += ledger.alive(a.made).length;
      expect(ledger.alive(a.made).map(ledger.label), `retry ${i + 1}: textures left on the GPU`).toEqual([]);
      loaded.length = 0; // each retry is counted on its own
    }
    expect(new Set(perRetry).size, 'the same setup makes the same textures every time').toBe(1);
    expect(stillAlive).toBe(0);
  });

  it('no texture is carried from one retry to the next (nothing a later retry could free twice or miss)', async () => {
    const first = await attempt();
    first.teardown();
    loaded.length = 0;
    const second = await attempt();
    for (const t of second.made) expect(first.made.has(t), 'a texture of the first retry in the second').toBe(false);
    second.teardown();
    expect(ledger.alive(second.made)).toEqual([]);
  });
});

describe('every texture of the loader\'s materials is freed, not only the colour map the unlit material takes', () => {
  it('a normal map on the file\'s material (the unlit material never draws it) is freed with the model (mutation: the colour map alone fails)', async () => {
    const a = await attempt();
    const normals = [...a.made].filter((t) => t.name.endsWith('-normal'));
    expect(normals.length, 'the fixture\'s figures and weapon carry normal maps').toBeGreaterThanOrEqual(2);
    a.teardown();
    expect(ledger.alive(normals).map(ledger.label)).toEqual([]);
  });
});
