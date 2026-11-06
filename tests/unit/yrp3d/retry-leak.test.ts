// @vitest-environment jsdom
/**
 * **A lose-and-retry leaves no texture behind** (the hidden 3D Bahamut chapter, FFX-2 only; the release 74 browser read YR-11, the driver's decision 219v item 4, 2026-11-03).
 *
 * The read: five lose-and-retry cycles in one page took three.js's `renderer.info.memory.textures` from 100 to 137, 171, 205, 239 and 273 (+34 a retry, never settling) while the geometries stayed at 120 to 121, the programs
 * at 63 to 70 and the JS heap flat at 290 MB; Chapter IV (painted figures, four cycles) went 90 to 100 and stayed. Flat geometries and a flat heap with climbing textures is the signature of a GPU resource nothing frees:
 * the models' geometry and maps were freed (the loader's `freeScene`), and what was left is what the **renderer makes for a skinned mesh on its first draw: the skeleton's bone texture**. `SkeletonUtils.clone` gives every
 * clone of a figure a `Skeleton` of its own for each skinned mesh, each draws with its own bone texture, and `Skeleton.dispose()` is the only thing that frees it; no code in the repo called it. 34 a retry is the skinned meshes
 * of the four figures (the three girls' dressphere models and Bahamut). A dressphere change left the old model's behind the same way.
 *
 * What this file does, with no GL (three's `Skeleton.computeBoneTexture` is what the renderer calls on the first draw and needs no context): it runs **the scene's real setup** (`scenes/exp-yrp-3d-stage.ts`: `openDressLibrary`, `loadYrpModels`
 * with the library as its `preload`, `YrpSkin` on real `PaintedActor`s, `applyStage`, then the scene's `dispose` order: the stage look, then the skin) over fake files whose figures are skinned and textured, cloned by the real
 * `SkeletonUtils.clone`, "draws" them (every skinned mesh gets its bone texture) and counts, per retry, the textures that were made against the textures that were freed (`Texture.prototype.dispose` is spied). Over N retries
 * nothing may stay alive. Mutation: `disposeShade` without the skeleton line fails every test marked below (12 textures a retry stay on the GPU); `freeScene` back on the colour map alone fails the last test.
 *
 * **The one texture a retry the skeletons did not account for (release 75 second code pass, the driver's decision 1; the check's m1: the read was +34 a retry, the real files' skinned meshes are 33).** Found by building the
 * real scene (`scenes/exp-yrp-3d-stage.ts` under jsdom) with every `Texture` and `RenderTarget` constructed tracked and asking which were not disposed after the scene's `dispose`: the **wet floor's grain**. `WetFloor`
 * builds a three.js `Reflector`, which builds its material from a CLONE of the shader's uniforms (`UniformsUtils.clone`), so the floor draws with (and the renderer uploads) a clone of the stage's grain texture, and the stage's
 * `grain.dispose()` frees the original, which is never uploaded: nothing disposed the clone, so it stayed on the GPU, +1 a retry. `WetFloor.dispose` frees the textures its material draws with now; the retry test counts that texture among the ones made (and requires it to be there), and the last-but-one block pins the mechanism. Mutation: `WetFloor.dispose` without the
 * loop fails the retry tests and that block.
 */
import { AnimationClip, Bone, BoxGeometry, DataTexture, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, Scene, ShaderMaterial, Skeleton, SkinnedMesh, Texture, Uint16BufferAttribute, VectorKeyframeTrack, type Object3D } from 'three';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { PaintedActor } from '../../../src/engine/PaintedActor.ts';
import { openDressLibrary } from '../../../src/engine/yrp3d/dressLib.ts';
import { BOSS_HEIGHT, PARTY_HEIGHT, YRP_CAST, type YrpId } from '../../../src/engine/yrp3d/layout.ts';
import { freeScene, loadYrpModels, type LoaderIO } from '../../../src/engine/yrp3d/load.ts';
import { disposeShade, shadeify } from '../../../src/engine/yrp3d/shade.ts';
import { YrpSkin } from '../../../src/engine/yrp3d/skin.ts';
import { applyStage } from '../../../src/engine/yrp3d/stageLook.ts';
import { WetFloor } from '../../../src/engine/yrp3d/wetFloor.ts';

// ------------------------------------------------------------------------------------------------ the fakes

/** A 2D context that accepts every call (an actor paints a placeholder canvas; jsdom has no canvas), as `skin.test.ts` does. */
function noopContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const pixels = (w: number, h: number) => ({ data: new Uint8ClampedArray(Math.max(1, Math.floor(w) * Math.floor(h)) * 4), width: w, height: h });
  const stub: object = new Proxy(function () {}, { get: (_t, p) => (p === 'then' ? undefined : stub), apply: () => stub, set: () => true });
  return new Proxy({} as Record<string | symbol, unknown>, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'canvas') return canvas;
      if (prop === 'getImageData') return (_x: number, _y: number, w: number, h: number) => pixels(w, h);
      if (prop === 'createImageData') return (w: number, h: number) => pixels(w, h);
      if (prop === 'measureText') return () => ({ width: 10 });
      return () => stub;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    return noopContext(this) as never;
  });
});
afterAll(() => vi.restoreAllMocks());

/** Which textures were freed (`Texture.prototype.dispose` is how everything frees one: `Skeleton.dispose`, a material's map, a render target). */
const freed = new Set<Texture>();
const realDispose = Texture.prototype.dispose;
beforeAll(() => {
  Texture.prototype.dispose = function (this: Texture): void {
    freed.add(this);
    realDispose.call(this);
  };
});
afterAll(() => {
  Texture.prototype.dispose = realDispose;
});
afterEach(() => freed.clear());

const HEIGHTS = { yuna: PARTY_HEIGHT, rikku: PARTY_HEIGHT, paine: PARTY_HEIGHT, bahamut: BOSS_HEIGHT };
const GLB = new Uint8Array([0x67, 0x6c, 0x54, 0x46, 0, 0, 0, 0]).buffer;
/** Skinned meshes a figure's file carries (a body, hair, cloth): the clone of the file gives each its own skeleton, so each draws with a bone texture of its own. */
const PARTS = ['body_mesh', 'hair_mesh', 'cloth_mesh'] as const;

const entry = (girl: string, dress: string): Record<string, unknown> => ({ girl, dress, folder: `${girl}-${dress}`, hd: true, weapons: 1, tier: 'b' });
const MANIFEST = {
  version: 1,
  starts: { yuna: 'white-mage', rikku: 'dark-knight', paine: 'warrior' },
  entries: [entry('yuna', 'white-mage'), entry('yuna', 'gunner'), entry('rikku', 'dark-knight'), entry('paine', 'warrior')],
};

const pixel = (): DataTexture => {
  const t = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
};

/** A figure's file: a bone chain and `PARTS` skinned meshes on ONE skeleton, each with a material that has its own colour map (the way a glTF skin is shared by the meshes that use it). */
function figureScene(): Group {
  const scene = new Group();
  const root = new Bone();
  root.name = 'SkeletonNode_0';
  const hand = new Bone();
  hand.name = 'SkeletonNode_61';
  hand.position.set(0.5, 1.2, 0);
  root.add(hand);
  scene.add(root);
  const skeleton = new Skeleton([root, hand]);
  for (const name of PARTS) {
    const geometry = new BoxGeometry(0.6, 2, 0.4);
    geometry.translate(0, 1, 0);
    const count = geometry.getAttribute('position').count;
    geometry.setAttribute('skinIndex', new Uint16BufferAttribute(new Uint16Array(count * 4), 4));
    geometry.setAttribute('skinWeight', new Float32BufferAttribute(Array.from({ length: count * 4 }, (_, i) => (i % 4 === 0 ? 1 : 0)), 4));
    const mesh = new SkinnedMesh(geometry, new MeshStandardMaterial({ map: pixel() }));
    mesh.name = name;
    scene.add(mesh);
    mesh.bind(skeleton);
  }
  scene.updateMatrixWorld(true);
  return scene;
}

const clip = (name: string): AnimationClip => new AnimationClip(name, 1, [new VectorKeyframeTrack('SkeletonNode_0.position', [0, 1], [0, 0, 0, 0, 0.1, 0])]);

/** The loader's IO over fake files: every `.glb` is a figure (the dress folder's, the single-model folders' and Bahamut's), cloned by the REAL `SkeletonUtils.clone` the app uses. */
function fakeIO(): LoaderIO {
  return {
    fetchBytes: async (url) => (url.endsWith('.glb') ? GLB : null),
    fetchJson: async (url) => {
      if (url.endsWith('/dress/index.json')) return MANIFEST;
      const m = /\/dress\/([a-z-]+)\/clipmap\.json$/.exec(url);
      return m ? { poses: { idle: { play: 'loop', clips: [`IDLE_${m[1]}`] }, hurt: { play: 'once', clips: ['DMG1'] } } } : null;
    },
    parse: async () => ({ scene: figureScene(), animations: [clip('APPEAR_00'), clip('DMG1'), clip('IDLE_yuna-white-mage'), clip('IDLE_rikku-dark-knight'), clip('IDLE_paine-warrior'), clip('IDLE_yuna-gunner')], extras: { ffx2: { scale: { base: 1, actor: 1 } } } }),
    clone: async (s) => skeletonClone(s) as Object3D,
  };
}

// ------------------------------------------------------------------------------------------------ the counting

/** Every skinned mesh under `root`. */
function skinnedUnder(root: Object3D): SkinnedMesh[] {
  const out: SkinnedMesh[] = [];
  root.traverse((o) => {
    if ((o as SkinnedMesh).isSkinnedMesh) out.push(o as SkinnedMesh);
  });
  return out;
}

/** What the renderer does on the first draw of a skinned mesh: its skeleton makes a bone texture. Returns the textures that now exist because of it. */
function draw(root: Object3D): Texture[] {
  const made: Texture[] = [];
  for (const mesh of skinnedUnder(root)) {
    if (mesh.skeleton.boneTexture === null) mesh.skeleton.computeBoneTexture();
    if (mesh.skeleton.boneTexture) made.push(mesh.skeleton.boneTexture);
  }
  return made;
}

/** The textures a draw of `root` puts on the GPU: each skinned mesh's bone texture, and every texture its materials hold. */
function onGpu(root: Object3D): Set<Texture> {
  const set = new Set<Texture>(draw(root));
  root.traverse((o) => {
    const material = (o as Mesh).material as MeshStandardMaterial | MeshStandardMaterial[] | undefined;
    if (!material) return;
    for (const m of Array.isArray(material) ? material : [material]) {
      for (const value of Object.values(m)) if ((value as Texture | null)?.isTexture === true && (value as Texture).isRenderTargetTexture !== true) set.add(value as Texture);
    }
  });
  return set;
}

interface Attempt {
  /** Textures the retry's figures and stage put on the GPU. */
  made: Set<Texture>;
  /** Of them, the bone textures. */
  bones: Texture[];
  teardown(): void;
}

/** One entry into the chapter, as `buildExpYrp3dStageScene` does it for the models, and its teardown in the scene's `dispose` order: the stage look, then the skin (which frees the models and the library). */
async function attempt(): Promise<Attempt> {
  const io = fakeIO();
  const dress = await openDressLibrary({ base: '/', modelsDir: 'models-exp/yrp', heights: HEIGHTS, io, warmDelayMs: 0, gapMs: 0 });
  expect(dress, 'the fake manifest opens a library').not.toBeNull();
  const models = await loadYrpModels({ base: '/', dirs: ['models-exp/yrp-hd', 'models-exp/yrp'], heights: HEIGHTS, io, ...(dress ? { preload: dress } : {}) });
  const scene = new Scene();
  const host = new Group();
  scene.add(host);
  const actors: PaintedActor[] = YRP_CAST.map((id: YrpId) => new PaintedActor({ name: id, worldHeight: HEIGHTS[id], side: id === 'bahamut' ? 'enemy' : 'party', placeholder: () => document.createElement('canvas') }));
  for (const a of actors) scene.add(a);
  const skin = new YrpSkin({ host, models, ...(dress ? { dress } : {}) });
  const stage = applyStage(host, new Group(), YRP_CAST);
  skin.update(0.05); // each model is carried by its actor
  expect(Object.keys(skin.carrying).sort()).toEqual([...YRP_CAST].sort());

  const made = new Set<Texture>();
  const bones: Texture[] = [];
  for (const id of YRP_CAST) {
    const root = skin.get(id)!.model.root;
    for (const t of draw(root)) bones.push(t);
    for (const t of onGpu(root)) made.add(t);
  }
  host.traverse((o) => {
    const material = (o as Mesh).material as MeshStandardMaterial | undefined;
    if (!material || !('map' in material) || !material.map) return;
    if (material.map.isRenderTargetTexture !== true) made.add(material.map); // the contact discs' and the orb's map
  });
  // the wet floor's shader textures: `Reflector` clones the shader's uniforms, so the grain the floor draws with is a CLONE of the stage's own (m1, the +1 a retry the skeletons did not account for)
  const floorTextures: Texture[] = [];
  host.traverse((o) => {
    const material = (o as Mesh).material as ShaderMaterial | undefined;
    if (!material || material.isShaderMaterial !== true) return;
    for (const u of Object.values(material.uniforms)) {
      const t = u.value as Texture | null;
      if (t?.isTexture === true && t.isRenderTargetTexture !== true) floorTextures.push(t);
    }
  });
  expect(floorTextures, 'the wet floor draws with the grain texture').toHaveLength(1);
  for (const t of floorTextures) made.add(t);
  return {
    made,
    bones,
    teardown(): void {
      stage.dispose();
      skin.dispose();
      for (const a of actors) a.dispose();
    },
  };
}

const alive = (made: Iterable<Texture>): Texture[] => [...made].filter((t) => !freed.has(t));
/** The loader frees the parsed files a tick after `dispose` (it waits for any parse still in flight): let it. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

// ------------------------------------------------------------------------------------------------ the tests

describe('a skeleton\'s bone texture is the model\'s to free (YR-11; FFX-2 only)', () => {
  it('disposeShade frees the bone texture of every skinned mesh of the model, a file\'s and a capsule\'s alike, and the skeleton makes a new one if it is drawn again (mutation: fails)', () => {
    const scene = skeletonClone(figureScene());
    const set = shadeify(scene);
    const bones = draw(scene);
    expect(bones).toHaveLength(PARTS.length); // one bone texture per skinned mesh: the clone gave each its own skeleton
    expect(new Set(bones).size, 'no two meshes share one').toBe(PARTS.length);
    disposeShade(set); // a file's model: its geometry and maps are the loader's
    expect(alive(bones)).toEqual([]);
    for (const mesh of skinnedUnder(scene)) expect(mesh.skeleton.boneTexture, 'cleared, so a new draw makes a new one').toBeNull();
    expect(draw(scene)).toHaveLength(PARTS.length); // still drawable
  });

  it('a model that is disposed frees its bone textures, not only its materials (mutation: fails)', async () => {
    const lib = (await openDressLibrary({ base: '/', modelsDir: 'models-exp/yrp', heights: HEIGHTS, io: fakeIO(), warmDelayMs: 0, gapMs: 0 }))!;
    const model = (await lib.model('yuna', 'white-mage'))!;
    const bones = draw(model.root);
    expect(bones).toHaveLength(PARTS.length);
    model.dispose();
    expect(alive(bones)).toEqual([]);
    lib.dispose();
  });

  it('a dressphere change frees the model it replaces (the old model\'s bone textures), and the new one keeps its own (mutation: fails)', async () => {
    const lib = (await openDressLibrary({ base: '/', modelsDir: 'models-exp/yrp', heights: HEIGHTS, io: fakeIO(), warmDelayMs: 0, gapMs: 0 }))!;
    const old = (await lib.model('yuna', 'white-mage'))!;
    const next = (await lib.model('yuna', 'gunner'))!;
    const oldBones = draw(old.root);
    const nextBones = draw(next.root);
    old.dispose(); // what `YrpSkin.exchange` does at the peak of the change
    expect(alive(oldBones)).toEqual([]);
    expect(alive(nextBones), 'the model in use keeps its textures').toHaveLength(nextBones.length);
    next.dispose();
    expect(alive(nextBones)).toEqual([]);
    lib.dispose();
  });
});

describe('five lose-and-retry cycles through the scene\'s real setup (YR-11; FFX-2 only)', () => {
  const RETRIES = 5;

  it('each retry makes the same number of textures (the four figures\' bone textures and maps, the stage\'s), and after its teardown NONE is left on the GPU: the count is flat, not +34 a retry (mutation: fails)', async () => {
    const perRetry: number[] = [];
    let stillAlive = 0;
    for (let i = 0; i < RETRIES; i++) {
      const a = await attempt();
      expect(a.bones, 'a bone texture per skinned mesh of the four figures').toHaveLength(YRP_CAST.length * PARTS.length);
      expect(alive(a.made), 'while the fight is on everything is up').toHaveLength(a.made.size);
      a.teardown();
      await settle();
      perRetry.push(a.made.size);
      stillAlive += alive(a.made).length; // what this retry left behind
      expect(alive(a.made).map((t) => t.constructor.name + ':' + t.uuid), `retry ${i + 1}: textures left on the GPU`).toEqual([]);
    }
    expect(new Set(perRetry).size, 'the same setup makes the same textures every time').toBe(1);
    expect(perRetry[0]!).toBeGreaterThanOrEqual(YRP_CAST.length * PARTS.length); // the bone textures alone are 12
    expect(stillAlive).toBe(0);
  });

  it('the textures made are all of the retry\'s own (no texture is carried from one retry to the next, so nothing is shared that a later retry could free twice or miss)', async () => {
    const first = await attempt();
    first.teardown();
    await settle();
    const second = await attempt();
    for (const t of second.made) expect(first.made.has(t), 'a texture of the first retry in the second').toBe(false);
    second.teardown();
    await settle();
    expect(alive(second.made)).toEqual([]);
  });
});

describe('the wet floor frees the grain texture it draws with (m1 of the release 74 deep review\'s check: the +1 texture a retry the skeletons did not account for; FFX-2 only)', () => {
  it('the floor\'s material draws with a CLONE of the stage\'s grain, so the stage\'s own dispose frees a texture that was never drawn; the floor\'s dispose frees the clone (mutation: fails)', () => {
    const grain = pixel();
    const floor = new WetFloor(grain);
    const drawn = (floor.mesh.material as ShaderMaterial).uniforms['uGrain']!.value as Texture;
    expect(drawn, 'Reflector clones the uniforms: the texture the floor draws with (and the renderer uploads) is not the stage\'s').not.toBe(grain);
    grain.dispose(); // what `applyStage(...).dispose()` does with its own: the original was never the one drawn
    expect(freed.has(drawn), 'the clone is still up after the stage freed the original').toBe(false);
    floor.dispose();
    expect(freed.has(drawn), 'the floor frees the texture it draws with').toBe(true);
  });
});

describe('the loader frees every map of a parsed file, not only the colour map (the AI Bahamut\'s look keeps the file\'s material whole; local comparisons only)', () => {
  it('freeScene disposes the colour, normal, roughness, metalness and occlusion maps of a mesh, and its geometry (mutation: the colour map alone fails)', () => {
    const maps = { map: pixel(), normalMap: pixel(), roughnessMap: pixel(), metalnessMap: pixel(), aoMap: pixel() };
    const material = new MeshStandardMaterial(maps);
    const geometry = new BoxGeometry(1, 1, 1);
    let geometryFreed = false;
    geometry.addEventListener('dispose', () => (geometryFreed = true));
    const scene = new Group();
    scene.add(new Mesh(geometry, material));
    freeScene(scene);
    expect(geometryFreed).toBe(true);
    for (const [name, t] of Object.entries(maps)) expect(freed.has(t), name).toBe(true);
  });
});
