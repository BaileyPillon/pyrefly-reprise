/**
 * **The dressphere models, loaded and kept warm** (`src/engine/yrp3d/dressLib.ts`, with `model.ts`'s dress option and `load.ts`'s `preload`; the hidden 3D Bahamut chapter, FFX-2 only), over fake files (no disk, no renderer):
 *
 * 1. **No manifest, no library**: the chapter keeps its single model per girl.
 * 2. **A model**: the armed file cloned and fitted by the body alone (a staff that stands above the head does not shrink the girl), its weapons already in the file (none of the procedural props, none of the weapon files), its clips
 *    mapped by its own `clipmap.json` (a clip named as that dressphere names its idle plays), the HD file where the folder has one and the page wants it and the base file when the HD one is not there; null for a dressphere the
 *    manifest lacks and for files that do not load.
 * 3. **One scale per girl**: her starter is fitted to the figure's height as ever and her other dresspheres share the same world scale, so a taller costume stands taller and a swap does not change how big she is.
 * 4. **The leases**: a file is parsed once for any number of models, stays while a model holds it, and is freed when the last is disposed (unless it is being kept warm).
 * 5. **Warming**: only the dresspheres a girl can change into next (at most {@link WARM_MAX}), one at a time after the fight starts, and the ones she can no longer reach are let go.
 * 6. **The loader's hook**: each girl starts in her dressphere's model; one whose starter is missing loads from the single-model files as ever.
 */
import { AnimationClip, Box3, BoxGeometry, Bone, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, Skeleton, SkinnedMesh, Uint16BufferAttribute, VectorKeyframeTrack, type Object3D } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { openDressLibrary, WARM_MAX, type DressLibOptions } from '../../../src/engine/yrp3d/dressLib.ts';
import { PARTY_HEIGHT, BOSS_HEIGHT } from '../../../src/engine/yrp3d/layout.ts';
import { loadYrpModels, type LoaderIO } from '../../../src/engine/yrp3d/load.ts';
import type { YrpModel } from '../../../src/engine/yrp3d/model.ts';

const HEIGHTS = { yuna: PARTY_HEIGHT, rikku: PARTY_HEIGHT, paine: PARTY_HEIGHT, bahamut: BOSS_HEIGHT };
const DRESS = 'models-exp/yrp/dress';
const GLB = new Uint8Array([0x67, 0x6c, 0x54, 0x46, 0, 0, 0, 0]).buffer;

const entry = (girl: string, dress: string, hd = true, weapons = 1): Record<string, unknown> => ({ girl, dress, folder: `${girl}-${dress}`, hd, weapons, tier: 'b' });
const DRESSES = ['white-mage', 'gunner', 'thief', 'warrior', 'black-mage', 'songstress'];
const MANIFEST = {
  version: 1,
  starts: { yuna: 'white-mage', rikku: 'dark-knight', paine: 'warrior' },
  entries: [...DRESSES.map((d) => entry('yuna', d, d !== 'songstress')), entry('rikku', 'dark-knight'), entry('paine', 'warrior'), entry('paine', 'mascot', false, 0)],
};

/** A dressphere file's scene: a skinned body 2 tall on y 0 and, under a hand bone, a staff 3 long standing well above the head (the way a weapon baked into the file does). */
function dressScene(tall = 1): Group {
  const scene = new Group();
  const root = new Bone();
  root.name = 'SkeletonNode_0';
  const hand = new Bone();
  hand.name = 'SkeletonNode_61';
  hand.position.set(0.5, 1.2, 0);
  root.add(hand);
  const geometry = new BoxGeometry(0.6, 2, 0.4);
  geometry.scale(1, tall, 1);
  geometry.translate(0, tall, 0);
  const count = geometry.getAttribute('position').count;
  geometry.setAttribute('skinIndex', new Uint16BufferAttribute(new Uint16Array(count * 4), 4));
  geometry.setAttribute('skinWeight', new Float32BufferAttribute(Array.from({ length: count * 4 }, (_, i) => (i % 4 === 0 ? 1 : 0)), 4));
  const body = new SkinnedMesh(geometry, new MeshStandardMaterial());
  body.name = 'body_mesh';
  const staff = new Mesh(new BoxGeometry(0.1, 3, 0.1), new MeshStandardMaterial());
  staff.name = 'weapon_mesh';
  staff.position.y = 1.5;
  hand.add(staff);
  scene.add(root, body);
  body.bind(new Skeleton([root, hand]));
  scene.updateMatrixWorld(true);
  return scene;
}

const clip = (name: string): AnimationClip => new AnimationClip(name, 1, [new VectorKeyframeTrack('SkeletonNode_0.position', [0, 1], [0, 0, 0, 0, 0.1, 0])]);

interface Spy {
  fetched: string[];
  parsed: string[];
  cloned: number;
  /** Geometry disposals, by the file's url. */
  freed: string[];
  broken: Set<string>;
}

/** Fake files: the manifest, and for every `.glb` under the dress folder a dressphere scene whose idle clip is named by the file (`SEQ_<folder>` where a clip map says so). */
function fakeIO(spy: Spy, manifest: unknown = MANIFEST): LoaderIO {
  const urls = new WeakMap<Object3D, string>();
  return {
    fetchBytes: async (url) => {
      spy.fetched.push(url);
      return url.includes('/dress/') && url.endsWith('.glb') && !spy.broken.has(url) ? GLB : null;
    },
    fetchJson: async (url) => {
      if (url.endsWith('/dress/index.json')) return manifest;
      const m = /\/dress\/([a-z-]+)\/clipmap\.json$/.exec(url);
      if (!m) return null;
      return { poses: { idle: { play: 'loop', clips: [`IDLE_${m[1]}`] }, hurt: { play: 'once', clips: ['DMG1'] } } };
    },
    parse: async () => {
      const url = spy.fetched.at(-1)!; // fetched just before: good enough for a fake
      spy.parsed.push(url);
      const scene = dressScene(url.includes('mascot') ? 1.5 : 1); // a costume with a hat: half again as tall
      urls.set(scene, url);
      scene.traverse((o) => {
        const g = (o as Mesh).geometry;
        if (g) g.addEventListener('dispose', () => spy.freed.push(url));
      });
      const folder = /\/dress\/([a-z-]+)\//.exec(url)![1]!;
      return { scene, animations: [clip(`IDLE_${folder}`), clip('DMG1')], extras: { ffx2: { scale: { base: 1, actor: 1 } } } };
    },
    clone: async (s) => {
      spy.cloned++;
      return s.clone(true);
    },
  };
}

const spyOf = (): Spy => ({ fetched: [], parsed: [], cloned: 0, freed: [], broken: new Set() });
const lib = async (spy: Spy, extra: Partial<DressLibOptions> = {}, manifest?: unknown) => openDressLibrary({ base: '/', modelsDir: 'models-exp/yrp', heights: HEIGHTS, io: fakeIO(spy, manifest), warmDelayMs: 0, gapMs: 0, ...extra });

describe('opening the library', () => {
  it('is none when there is no manifest (or a manifest with nothing in it): the chapter keeps its single model per girl', async () => {
    const spy = spyOf();
    for (const bad of [null, {}, { entries: [] }, 'html']) expect(await lib(spy, {}, bad), JSON.stringify(bad)).toBeNull();
  });

  it('reads the manifest from the base folder\'s dress directory', async () => {
    const spy = spyOf();
    const l = (await lib(spy))!;
    expect(l.start('yuna')).toBe('white-mage');
    expect(l.start('rikku')).toBe('dark-knight');
    expect(l.has('paine', 'mascot')).toBe(true);
    expect(l.has('paine', 'thief')).toBe(false);
  });
});

describe('a dressphere model', () => {
  it("stands the body at the figure's height whatever its weapon does (the box is the body's), is armed by its file alone and says which dressphere it is", async () => {
    const spy = spyOf();
    const l = (await lib(spy))!;
    const m = (await l.model('yuna', 'white-mage'))!;
    expect(m).not.toBeNull();
    expect(m.dress).toBe('white-mage');
    expect(m.id).toBe('yuna');
    expect(m.weaponKind, 'its one weapon is in the file').toBe('real');
    expect(m.height).toBe(PARTY_HEIGHT);
    expect(m.trueHeight, 'the staff, 3 long above a hand at 1.2, is not in the measured box').toBeCloseTo(2, 5);
    const body = m.root.getObjectByName('body_mesh')!;
    body.updateWorldMatrix(true, false);
    // no procedural props and no weapon files: the model holds what its file has and nothing else
    const meshes: string[] = [];
    m.root.traverse((o) => {
      if ((o as Mesh).isMesh) meshes.push(o.name);
    });
    expect(meshes.sort()).toEqual(['body_mesh', 'weapon_mesh']);
    // a dressphere that holds nothing
    const mascot = (await l.model('paine', 'mascot'))!;
    expect(mascot.weaponKind).toBe('none');
  });

  it("plays its own clips as its own clip map names them (the data, not a table in the code)", async () => {
    const spy = spyOf();
    const l = (await lib(spy))!;
    const m = (await l.model('yuna', 'gunner'))!;
    expect(m.animated).toBe(true);
    expect(m.playingClip).toBe('IDLE_yuna-gunner'); // this dressphere's own idle, named in its clip map
    m.update(0.1);
    expect(m.playing).toBe('idle');
  });

  it('takes the HD file where the folder has one and the page wants it, and the base file otherwise or when the HD one does not load', async () => {
    const hd = spyOf();
    await (await lib(hd))!.model('yuna', 'white-mage');
    expect(hd.fetched.filter((u) => u.endsWith('.glb'))).toEqual([`/${DRESS}/yuna-white-mage/hd/anims.glb`]);

    const base = spyOf();
    await (await lib(base, { preferHd: false }))!.model('yuna', 'white-mage');
    expect(base.fetched.filter((u) => u.endsWith('.glb'))).toEqual([`/${DRESS}/yuna-white-mage/anims.glb`]);

    const noHd = spyOf();
    await (await lib(noHd))!.model('yuna', 'songstress'); // the manifest says this folder has no HD file
    expect(noHd.fetched.filter((u) => u.endsWith('.glb'))).toEqual([`/${DRESS}/yuna-songstress/anims.glb`]);

    const failing = spyOf();
    failing.broken.add(`/${DRESS}/yuna-white-mage/hd/anims.glb`);
    const m = await (await lib(failing))!.model('yuna', 'white-mage');
    expect(m, 'the base file stands in').not.toBeNull();
    expect(failing.fetched.filter((u) => u.endsWith('.glb'))).toEqual([`/${DRESS}/yuna-white-mage/hd/anims.glb`, `/${DRESS}/yuna-white-mage/anims.glb`]);
  });

  it('is null for a dressphere the manifest lacks and for files that do not load, and says so once', async () => {
    const spy = spyOf();
    const warn = vi.fn();
    const l = (await lib(spy, { warn }))!;
    expect(await l.model('rikku', 'gunner')).toBeNull();
    expect(await l.model('yuna', 'samurai')).toBeNull();
    spy.broken.add(`/${DRESS}/paine-mascot/anims.glb`);
    expect(await l.model('paine', 'mascot')).toBeNull();
    expect(await l.model('paine', 'mascot')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain('paine-mascot');
  });
});

describe("one scale per girl", () => {
  const bodyHeight = (m: YrpModel): number => {
    m.root.updateMatrixWorld(true);
    const box = new Box3();
    m.root.traverse((o) => {
      if ((o as { isSkinnedMesh?: boolean }).isSkinnedMesh) box.expandByObject(o);
    });
    return box.max.y - box.min.y;
  };

  it('fits the starter to the figure and draws her other dresspheres at the same world scale: a taller costume is taller, one as tall is as tall', async () => {
    const spy = spyOf();
    const l = (await lib(spy))!;
    const start = (await l.starter('paine'))!.model; // Warrior
    expect(bodyHeight(start)).toBeCloseTo(PARTY_HEIGHT, 4);
    const mascot = (await l.model('paine', 'mascot'))!; // 1.5 times the starter's own box
    expect(mascot.trueHeight / start.trueHeight).toBeCloseTo(1.5, 5);
    expect(bodyHeight(mascot)).toBeCloseTo(PARTY_HEIGHT * 1.5, 4);
    expect(mascot.height, 'the figure the stage sized is the same').toBe(PARTY_HEIGHT);
    mascot.fitTo(PARTY_HEIGHT * 1.1); // the stage re-sizes the figure: the ratio holds
    expect(bodyHeight(mascot)).toBeCloseTo(PARTY_HEIGHT * 1.1 * 1.5, 4);
    const same = (await l.model('paine', 'warrior'))!;
    expect(bodyHeight(same)).toBeCloseTo(PARTY_HEIGHT, 4);
    const other = (await l.starter('yuna'))!.model; // her own girl's reference, not Paine's
    expect(bodyHeight(other)).toBeCloseTo(PARTY_HEIGHT, 4);
  });

  it('draws a model as the figure is when no starter set the scale (nothing to compare it with)', async () => {
    const spy = spyOf();
    const l = (await lib(spy))!;
    const mascot = (await l.model('paine', 'mascot'))!;
    expect(bodyHeight(mascot)).toBeCloseTo(PARTY_HEIGHT, 4);
  });
});

describe('the leases on the parsed files', () => {
  it('parses a file once for any number of models, keeps it while a model holds it, frees it when the last is disposed', async () => {
    const spy = spyOf();
    const l = (await lib(spy))!;
    const a = (await l.model('yuna', 'gunner'))!;
    const b = (await l.model('yuna', 'gunner'))!;
    expect(spy.parsed).toHaveLength(1);
    expect(l.parsedCount).toBe(1);
    a.dispose();
    expect(spy.freed, 'a model still holds it').toEqual([]);
    b.dispose();
    expect(l.parsedCount).toBe(0);
    expect(spy.freed.length).toBeGreaterThan(0);
    b.dispose(); // a second disposal gives nothing back twice
    const c = (await l.model('yuna', 'gunner'))!;
    expect(spy.parsed, 'parsed again after it was freed').toHaveLength(2);
    c.dispose();
  });

  it('frees everything on dispose, and gives no model after it', async () => {
    const spy = spyOf();
    const l = (await lib(spy))!;
    await l.model('yuna', 'thief');
    l.dispose();
    expect(l.parsedCount).toBe(0);
    expect(await l.model('yuna', 'gunner')).toBeNull();
  });
});

describe('warming what a swap may ask for next', () => {
  const reach = (_girl: string, current: string): string[] => DRESSES.filter((d) => d !== current);

  it('warms at most WARM_MAX of the dresspheres she can reach, one parse each, and a swap to one is a clone', async () => {
    expect(WARM_MAX).toBe(3);
    const spy = spyOf();
    const l = (await lib(spy, { reach }))!;
    l.wearing('yuna', 'white-mage');
    await l.idle;
    expect(spy.parsed).toHaveLength(WARM_MAX);
    expect(l.parsedCount).toBe(WARM_MAX);
    const before = spy.parsed.length;
    const m = (await l.model('yuna', 'gunner'))!; // warm: no new parse
    expect(m).not.toBeNull();
    expect(spy.parsed).toHaveLength(before);
    m.dispose();
  });

  it('lets go of the ones she can no longer reach when she changes, and keeps what both nodes share', async () => {
    const spy = spyOf();
    const ring = { 'white-mage': ['gunner', 'black-mage'], gunner: ['white-mage', 'thief'] } as Record<string, string[]>;
    const l = (await lib(spy, { reach: (_g, c) => ring[c] ?? [] }))!;
    l.wearing('yuna', 'white-mage');
    await l.idle;
    expect(l.parsedCount).toBe(2); // gunner and black-mage
    l.wearing('yuna', 'gunner');
    await l.idle;
    expect(l.parsedCount, 'white-mage and thief now; black-mage is let go').toBe(2);
    expect(spy.parsed.some((u) => u.includes('yuna-white-mage'))).toBe(true);
    expect(spy.parsed.filter((u) => u.includes('yuna-gunner'))).toHaveLength(1);
  });

  it('warms nothing with no reach, and nothing after dispose', async () => {
    const spy = spyOf();
    const l = (await lib(spy))!;
    l.wearing('yuna', 'white-mage');
    await l.idle;
    expect(spy.parsed).toHaveLength(0);
    const w = (await lib(spy, { reach }))!;
    w.dispose();
    w.wearing('yuna', 'white-mage');
    await w.idle;
    expect(spy.parsed).toHaveLength(0);
  });
});

describe("the loader's hook: each girl starts in her dressphere's model", () => {
  const NO_SINGLE_FILES: LoaderIO = { fetchBytes: async () => null, fetchJson: async () => null, parse: async () => ({ scene: new Group(), animations: [] }), clone: async (s) => s.clone(true) };

  it('puts the starters on the girls (Yuna White Mage, Rikku Dark Knight, Paine Warrior), says where each came from, and leaves Bahamut to the folders', async () => {
    const spy = spyOf();
    const l = (await lib(spy))!;
    const models = await loadYrpModels({ base: '/', dirs: ['models-exp/yrp'], heights: HEIGHTS, io: NO_SINGLE_FILES, preload: l });
    expect(models.models.get('yuna')!.dress).toBe('white-mage');
    expect(models.models.get('rikku')!.dress).toBe('dark-knight');
    expect(models.models.get('paine')!.dress).toBe('warrior');
    expect(models.models.get('bahamut')!.dress).toBeNull();
    expect(models.capsules).toEqual(['bahamut']);
    expect(models.sources['yuna']).toEqual({ mesh: 'dress/yuna-white-mage', clips: 'dress/yuna-white-mage', file: 'yuna-white-mage/hd/anims.glb', look: 'diffuse', weapons: 'real' });
    models.dispose();
    expect(l.parsedCount).toBe(0); // the library goes with the models
  });

  it("keeps the single model for a girl whose starter has no files (Rikku's folder is broken), and replace puts another in a girl's place", async () => {
    const spy = spyOf();
    spy.broken.add(`/${DRESS}/rikku-dark-knight/hd/anims.glb`);
    spy.broken.add(`/${DRESS}/rikku-dark-knight/anims.glb`);
    const l = (await lib(spy))!;
    const models = await loadYrpModels({ base: '/', dirs: ['models-exp/yrp'], heights: HEIGHTS, io: NO_SINGLE_FILES, preload: l });
    expect(models.models.get('rikku')!.dress, 'no dress files and no single files: the neutral capsule').toBeNull();
    expect(models.models.get('rikku')!.source).toBe('capsule');
    expect(models.capsules).toContain('rikku');
    const gunner = (await l.model('yuna', 'gunner'))!;
    const was = models.models.get('yuna')!;
    models.replace('yuna', gunner);
    expect(models.models.get('yuna')).toBe(gunner);
    expect(models.models.get('yuna')).not.toBe(was);
    models.dispose();
  });

  it('loads exactly as before with no hook', async () => {
    const models = await loadYrpModels({ base: '/', dirs: ['models-exp/yrp'], heights: HEIGHTS, io: NO_SINGLE_FILES });
    for (const id of ['yuna', 'rikku', 'paine', 'bahamut'] as const) expect(models.models.get(id)!.dress).toBeNull();
    models.dispose();
  });
});
