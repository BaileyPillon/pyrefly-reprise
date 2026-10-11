/**
 * **Bailey's own converted FFX models, as three.js objects** (`src/engine/ffx3d/models.ts`; the hidden Fayth chapter's `ffx` skin; FFX only). No retail file is read: the glTF loader is replaced by a stand-in
 * that hands back scenes built in code, shaped like the converter's (bones named `SkeletonNode_<n>`, a `runtimeScale` in the scene extras, a stage with a `sky` node), and the sidecar JSON is stubbed.
 * What this file pins:
 *
 * 1. **The sidecars and file names**: the posed file is `<name>-idle0.glb` beside `<name>.glb`; `weapons.json` and `poses.json` are read tolerantly (a bad entry costs that actor its weapon or its
 *    height, never the rest); `runtimeScale` comes from the scene extras and is 1 when it says nothing sensible.
 * 2. **The material**: every loaded material is rebuilt unlit (`MeshBasicMaterial`) keeping its map, tint, vertex colours, cut-out threshold, sidedness and blending, and never fogged.
 * 3. **The loader**: each model is scaled by its game factor times the world's (`FFX_UNIT`) and faces +Z; the weapon hangs under the bone `weapons.json` names with the half turn about X the converter
 *    asks for; the posed file is tried first and the bind pose stands in when it is missing (said in `problems`); a missing weapon bone and a missing stage cost only themselves; `dispose` frees all.
 * 4. **The stage's parts** (`shapeStage`): only the listed meshes are drawn, the deck's mirrored in y, the sky's handed back; the rest hidden, not removed.
 *
 * Game case: FFX only (the files are FFX's).
 */
import { BoxGeometry, BufferGeometry, Color, DoubleSide, FrontSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FFX_MODEL_LIFT, FFX_STAGE_PARTS } from '../../src/engine/ffx3d/ffxStaging.ts';
import { FFX_UNIT } from '../../src/engine/ffx3d/ffxWorld.ts';
import type { FfxLocalManifest } from '../../src/engine/ffx3d/localAssets.ts';
import { folderOf, idleFileOf, loadFfxModels, parsePoseHeights, parseWeapons, runtimeScaleOf, shapeStage, spreadOf, unlitMaterial } from '../../src/engine/ffx3d/models.ts';

/** The URLs the stand-in loader was asked for, in order. */
const asked: string[] = [];
/** Files the stand-in loader cannot serve (a 404). */
const missing = new Set<string>();

/** A scene shaped like the converter's: a skeleton root with the bones the test names, one mesh with a map, and the game's scale in the scene extras. */
function actorScene(scale: number, bones: string[]): Group {
  const scene = new Group();
  scene.userData = { ffx: { runtimeScale: scale } };
  const root = new Object3D();
  root.name = 'SkeletonNode_0';
  for (const b of bones) {
    const bone = new Object3D();
    bone.name = b;
    root.add(bone);
  }
  const mesh = new Mesh(new BufferGeometry(), new MeshStandardMaterial({ map: new Texture(), alphaTest: 0.5, side: DoubleSide }));
  scene.add(root, mesh);
  return scene;
}

const weaponScene = (): Group => {
  const scene = new Group();
  scene.userData = { ffx: { runtimeScale: 1 } };
  scene.add(new Mesh(new BufferGeometry(), new MeshStandardMaterial({ map: new Texture() })));
  return scene;
};

function stageScene(): Group {
  const scene = new Group();
  scene.userData = { ffx: { runtimeScale: 10 } };
  const sky = new Object3D();
  sky.name = 'sky';
  const names = ['polySurfaceShape5_1', 'FBXASC048_Shape0_2', 'FBXASC050_0Shape_4'];
  for (const n of names) {
    const m = new Mesh(new BufferGeometry(), new MeshStandardMaterial({ map: new Texture(), vertexColors: true }));
    m.name = n;
    scene.add(m);
  }
  const bowl = new Mesh(new BufferGeometry(), new MeshStandardMaterial({ map: new Texture() }));
  bowl.name = 'FBXASC0490_0Shape';
  sky.add(bowl);
  scene.add(sky);
  return scene;
}

vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    async loadAsync(url: string): Promise<{ scene: Group }> {
      asked.push(url);
      const file = url.slice(url.lastIndexOf('/') + 1);
      if (missing.has(file)) throw new Error(`404 ${file}`);
      if (file === 'stage.glb') return { scene: stageScene() };
      if (file.endsWith('-weapon.glb')) return { scene: weaponScene() };
      if (file === 'evrae-idle0.glb' || file === 'evrae.glb') return { scene: actorScene(4, []) };
      if (file === 'tidus-idle0.glb' || file === 'tidus.glb') return { scene: actorScene(1, ['SkeletonNode_50']) };
      return { scene: actorScene(1, ['SkeletonNode_22']) }; // wakka and rikku
    }
  },
}));

const manifest: FfxLocalManifest = {
  version: 1,
  encounter: 'evrae-airship',
  upAxis: 'y',
  units: 'ffx',
  stage: { file: 'evrae/stage.glb' },
  actors: {
    evrae: { file: 'evrae/evrae.glb', rawHeight: 52.152 },
    tidus: { file: 'evrae/tidus.glb', rawHeight: 18.1467 },
    wakka: { file: 'evrae/wakka.glb', rawHeight: 21.806 },
  },
  source: 'test fixture',
};

const sidecars: Record<string, unknown> = {
  'weapons.json': {
    tidus: { weapon: 'Brotherhood', file: 'evrae/tidus-weapon.glb', attachNode: 'SkeletonNode_50', attachLocalRotationQuat: [1, 0, 0, 0], attachLocalTranslation: [0, 0, 0] },
    wakka: { weapon: 'Official Ball', file: 'evrae/wakka-weapon.glb', attachNode: 'SkeletonNode_77', attachLocalRotationQuat: [1, 0, 0, 0], attachLocalTranslation: [0, 0, 0] }, // the bone the test's Wakka lacks
  },
  'poses.json': {
    'evrae-idle0': { file: 'evrae/evrae-idle0.glb', height: 34.2374, bbox_max: [1, 19.642, 1] },
    'tidus-idle0': { file: 'evrae/tidus-idle0.glb', height: 15.4318 },
  },
};

function stubFetch(): void {
  vi.stubGlobal('fetch', async (url: string) => {
    const key = url.slice(url.lastIndexOf('/') + 1);
    return key in sidecars ? new Response(JSON.stringify(sidecars[key]), { status: 200 }) : new Response(null, { status: 404 });
  });
}

afterEach(() => {
  asked.length = 0;
  missing.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the sidecars and file names', () => {
  it('names the posed file beside the bind pose, and the folder', () => {
    expect(idleFileOf('evrae/tidus.glb')).toBe('evrae/tidus-idle0.glb');
    expect(idleFileOf('a/b/c.GLB')).toBe('a/b/c-idle0.glb');
    expect(idleFileOf('plain')).toBe('plain');
    expect(folderOf('evrae/tidus.glb')).toBe('evrae/');
    expect(folderOf('tidus.glb')).toBe('');
  });

  it('reads weapons.json tolerantly: the half turn about X is the default, a bad entry loses only that actor\'s weapon', () => {
    const w = parseWeapons({
      tidus: { file: 'evrae/tidus-weapon.glb', attachNode: 'SkeletonNode_50', attachLocalRotationQuat: [1, 0, 0, 0], attachLocalTranslation: [0, 0, 0] },
      rikku: { file: 'evrae/rikku-weapon.glb', attachNode: 'SkeletonNode_22' }, // no quaternion, no translation: the converter's rule
      wakka: { file: 'evrae/wakka-weapon.glb' }, // no bone
      lulu: { file: 'evrae/lulu-weapon.glb', attachNode: 'SkeletonNode_9', attachLocalRotationQuat: [1, 0, 0] }, // a short quaternion
      auron: 'sword',
    });
    expect(Object.keys(w).sort()).toEqual(['rikku', 'tidus']);
    expect(w['rikku']).toEqual({ file: 'evrae/rikku-weapon.glb', attachNode: 'SkeletonNode_22', rotation: [1, 0, 0, 0], translation: [0, 0, 0] });
    expect(parseWeapons(null)).toEqual({});
    expect(parseWeapons([1, 2])).toEqual({});
  });

  it('reads how far each model stands above its origin: the box top where there is one, else the height; only "<id>-idle0" rows', () => {
    expect(parsePoseHeights({ 'evrae-idle0': { height: 34.2374, bbox_max: [1, 19.642, 1] }, 'tidus-idle0': { height: 0 }, 'wakka-idle0': 'tall', evrae: { height: 9 }, 'rikku-idle0': { height: 20.0028 }, 'lulu-idle0': { height: 17, bbox_max: [1, 0, 1] } })).toEqual({ evrae: 19.642, rikku: 20.0028, lulu: 17 });
    expect(parsePoseHeights(undefined)).toEqual({});
  });

  it('reads the game\'s factor from the scene extras, and says 1 when there is none', () => {
    expect(runtimeScaleOf({ ffx: { runtimeScale: 10 } })).toBe(10);
    expect(runtimeScaleOf({ ffx: { runtimeScale: 4 } })).toBe(4);
    for (const bad of [undefined, null, {}, { ffx: {} }, { ffx: { runtimeScale: 0 } }, { ffx: { runtimeScale: -2 } }, { ffx: { runtimeScale: 'big' } }, { ffx: { runtimeScale: Infinity } }]) expect(runtimeScaleOf(bad)).toBe(1);
  });
});

describe('the material', () => {
  it('rebuilds a loaded material unlit, keeping its map, tint, vertex colours, cut-out, sidedness and blending, and never fogged', () => {
    const map = new Texture();
    const src = new MeshStandardMaterial({ name: 'cloth', map, color: new Color(0x336699), vertexColors: true, alphaTest: 0.41, side: DoubleSide, transparent: true, opacity: 0.8, depthWrite: false });
    const out = unlitMaterial(src);
    expect(out).toBeInstanceOf(MeshBasicMaterial);
    expect(out.name).toBe('cloth');
    expect(out.map).toBe(map);
    expect(out.color.getHex()).toBe(0x336699);
    expect(out.color).not.toBe(src.color); // its own copy
    expect(out.vertexColors).toBe(true);
    expect(out.alphaTest).toBe(0.41);
    expect(out.side).toBe(DoubleSide);
    expect(out.transparent).toBe(true);
    expect(out.opacity).toBe(0.8);
    expect(out.depthWrite).toBe(false);
    expect(out.fog).toBe(false);
    expect(out.userData['baseTransparent']).toBe(true);
    expect(map.anisotropy).toBe(8);
  });

  it('keeps a plain opaque, single-sided material plain, and takes white for a material with no tint', () => {
    const out = unlitMaterial(new MeshStandardMaterial());
    expect(out.map).toBeNull();
    expect(out.side).toBe(FrontSide);
    expect(out.transparent).toBe(false);
    expect(out.alphaTest).toBe(0);
    expect(out.userData['baseTransparent']).toBe(false);
  });
});

describe('the loader', () => {
  it('scales each model by its game factor times the world\'s, tries the posed file first and hangs the weapon under its bone with the half turn about X', async () => {
    stubFetch();
    const models = await loadFfxModels(manifest);
    expect(models.problems).toEqual(['wakka: weapon not attached (no bone SkeletonNode_77)']);
    // the posed files, then the weapons; never the bind pose when the posed file is there
    expect(asked).toContain('/__ffx-local/evrae/tidus-idle0.glb');
    expect(asked).toContain('/__ffx-local/evrae/evrae-idle0.glb');
    expect(asked).not.toContain('/__ffx-local/evrae/tidus.glb');
    expect(asked).toContain('/__ffx-local/evrae/tidus-weapon.glb');
    expect(asked).toContain('/__ffx-local/evrae/stage.glb');

    const tidus = models.actors['tidus']!;
    expect(tidus.root.scale.x).toBeCloseTo(1 * FFX_UNIT, 15);
    expect(tidus.root.scale.x).toBe(tidus.root.scale.y);
    expect(tidus.height).toBeCloseTo(15.4318 * FFX_UNIT, 12); // poses.json's height (no box in the stub), in world units
    const bone = tidus.root.getObjectByName('SkeletonNode_50')!;
    expect(bone.children).toHaveLength(1); // the Brotherhood
    expect(bone.children[0]!.quaternion.toArray()).toEqual([1, 0, 0, 0]); // the half turn about X
    expect(bone.children[0]!.position.toArray()).toEqual([0, 0, 0]);

    const evrae = models.actors['evrae']!;
    expect(evrae.root.scale.x).toBeCloseTo(4 * FFX_UNIT, 15); // Evrae is drawn at x4
    expect(evrae.height).toBeCloseTo((19.642 * 4 + FFX_MODEL_LIFT['evrae']!) * FFX_UNIT, 12); // the box top above its origin (the creature's origin is mid-body), at x4, and the model's lift
    expect(evrae.root.position.y).toBeCloseTo(30 * FFX_UNIT, 12); // drawn 30 FFX units above its origin: the fit to the PS2 capture
    expect(tidus.root.position.y).toBe(0); // the party stands at its origin
    expect(Object.keys(FFX_MODEL_LIFT)).toEqual(['evrae']);
    expect(models.actors['wakka']!.root.getObjectByName('SkeletonNode_22')!.children).toHaveLength(0); // the weapon's bone is not there: unarmed, the rest stands

    expect(models.stage!.root.scale.x).toBeCloseTo(10 * FFX_UNIT, 15); // the stage is drawn at x10
    expect(models.stage!.sky!.name).toBe('sky');
  });

  it('turns every material of every model unlit, weapons and stage included', async () => {
    stubFetch();
    const models = await loadFfxModels(manifest);
    const roots = [models.stage!.root, ...Object.values(models.actors).map((a) => a.root)];
    let meshes = 0;
    for (const root of roots) {
      root.traverse((o) => {
        if (!(o instanceof Mesh)) return;
        meshes++;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          expect(m).toBeInstanceOf(MeshBasicMaterial);
          expect((m as MeshBasicMaterial).fog).toBe(false);
        }
      });
    }
    expect(meshes).toBe(8); // the stage's four, Evrae's one, Tidus's one and his sword, Wakka's one
  });

  it('falls back to the bind pose when the posed file is missing, and says so; a missing stage costs only the stage', async () => {
    stubFetch();
    missing.add('tidus-idle0.glb');
    missing.add('stage.glb');
    const models = await loadFfxModels(manifest);
    expect(asked).toContain('/__ffx-local/evrae/tidus.glb');
    expect(models.problems).toContain('tidus: no idle pose file, using the bind pose');
    expect(models.problems.some((p) => p.startsWith('stage: '))).toBe(true);
    expect(models.stage).toBeNull();
    expect(Object.keys(models.actors).sort()).toEqual(['evrae', 'tidus', 'wakka']);
  });

  it('leaves out an actor whose file will not load at all, and carries on with the rest', async () => {
    stubFetch();
    missing.add('wakka-idle0.glb');
    missing.add('wakka.glb');
    const models = await loadFfxModels(manifest);
    expect(Object.keys(models.actors).sort()).toEqual(['evrae', 'tidus']);
    expect(models.problems.some((p) => p.startsWith('wakka: '))).toBe(true);
    expect(models.stage).not.toBeNull();
  });

  it('works with no sidecars at all: no weapons, a default height, the files still load', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));
    const models = await loadFfxModels(manifest);
    expect(models.problems).toEqual([]);
    expect(models.actors['tidus']!.root.getObjectByName('SkeletonNode_50')!.children).toHaveLength(0);
    expect(models.actors['tidus']!.height).toBeCloseTo(18 * FFX_UNIT, 12);
  });

  it('fades a model: blended below 1 at that opacity, back to what the file said at 1', async () => {
    stubFetch();
    const models = await loadFfxModels(manifest);
    const tidus = models.actors['tidus']!;
    const mats: MeshBasicMaterial[] = [];
    tidus.root.traverse((o) => {
      if (o instanceof Mesh) mats.push(...(Array.isArray(o.material) ? o.material : [o.material]) as MeshBasicMaterial[]);
    });
    tidus.setOpacity(0.4);
    for (const m of mats) expect([m.opacity, m.transparent]).toEqual([0.4, true]);
    tidus.setOpacity(1);
    for (const m of mats) expect([m.opacity, m.transparent]).toEqual([1, false]);
  });

  it('frees every geometry, material and texture when disposed, and takes the models off whatever carried them', async () => {
    stubFetch();
    const models = await loadFfxModels(manifest);
    const carrier = new Group();
    for (const a of Object.values(models.actors)) carrier.add(a.root);
    carrier.add(models.stage!.root);
    const geometry = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const material = vi.spyOn(MeshBasicMaterial.prototype, 'dispose');
    const texture = vi.spyOn(Texture.prototype, 'dispose');
    models.dispose();
    expect(geometry).toHaveBeenCalled();
    expect(material).toHaveBeenCalled();
    expect(texture).toHaveBeenCalled();
    expect(carrier.children).toHaveLength(0);
  });
});

describe('the stage\'s parts', () => {
  it('draws only the listed meshes, mirrors the deck in y, hands back the sky, and hides (does not remove) the rest', () => {
    const scene = stageScene();
    const shaped = shapeStage(scene, FFX_STAGE_PARTS);
    expect(shaped).toMatchObject({ drawn: 2, flipped: 1 });
    expect(shaped.sky.map((m) => m.name)).toEqual(['FBXASC0490_0Shape']);
    const by = (name: string): Mesh => scene.getObjectByName(name) as Mesh;
    expect(by('polySurfaceShape5_1').visible).toBe(true);
    expect(by('polySurfaceShape5_1').scale.y).toBe(-1);
    expect(by('FBXASC0490_0Shape').visible).toBe(true);
    expect(by('FBXASC0490_0Shape').scale.y).toBe(1);
    expect(by('FBXASC048_Shape0_2').visible).toBe(false);
    expect(by('FBXASC050_0Shape_4').visible).toBe(false);
    expect(by('FBXASC050_0Shape_4')).toBeDefined(); // still in the graph
  });

  it('draws nothing from a file whose names are not the ones listed: no stage rather than a wrong one', () => {
    const scene = new Group();
    for (const n of ['a', 'b', 'c']) scene.add(Object.assign(new Mesh(new BufferGeometry(), new MeshBasicMaterial()), { name: n }));
    expect(shapeStage(scene, FFX_STAGE_PARTS)).toMatchObject({ drawn: 0, flipped: 0, sky: [] });
    scene.traverse((o) => {
      if (o instanceof Mesh) expect(o.visible).toBe(false);
    });
  });
});

describe('how far a model spreads (what the FFX camera frames a figure by)', () => {
  it("is the larger of the box's x and z extents, with the root's scale applied", () => {
    const root = new Group();
    root.add(new Mesh(new BoxGeometry(8, 15, 12), new MeshBasicMaterial())); // x 8, y 15, z 12
    root.scale.setScalar(0.5);
    expect(spreadOf(root, 99)).toBeCloseTo(6, 9); // z is the wider: 12 * 0.5
    const other = new Group();
    other.add(new Mesh(new BoxGeometry(20, 3, 4), new MeshBasicMaterial()));
    expect(spreadOf(other, 99)).toBeCloseTo(20, 9);
  });

  it("is the height's 0.6 for a model that cannot be measured (nothing in it, or an empty geometry)", () => {
    expect(spreadOf(new Group(), 10)).toBeCloseTo(6, 12);
    const bare = new Group();
    bare.add(new Mesh(new BufferGeometry(), new MeshBasicMaterial()));
    expect(spreadOf(bare, 10)).toBeCloseTo(6, 12);
  });

  it("every loaded model carries it, finite and positive (here the fakes have no geometry, so the height's 0.6)", async () => {
    stubFetch();
    const models = await loadFfxModels(manifest);
    for (const [id, model] of Object.entries(models.actors)) {
      expect(Number.isFinite(model.width), id).toBe(true);
      expect(model.width, id).toBeGreaterThan(0);
      expect(model.width, id).toBeCloseTo(model.height * 0.6, 9);
    }
    models.dispose();
  });
});
