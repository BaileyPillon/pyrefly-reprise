/**
 * **Finding and loading the real models** (`src/engine/yrp3d/load.ts`; the hidden 3D Bahamut chapter, the real-models branch, FFX-2 only), with a fake IO (no file, no network, no loader). What it pins:
 *
 * 1. **The folders**: HD first and the base after it by default (HD whenever its file is there, figure by figure), the base alone for `?models=base`.
 * 2. **Each figure's parts**: its model from the first folder that has `<id>.glb`, its clips from the base folder's `<id>-anims.glb` (the same motions without the HD textures' weight; the HD folder's when the base has none),
 *    the clip map from `clipmap.json` in the same order, the `.chr` scale from the model's extras; a clips file alone shows its own mesh.
 * 3. **Which Bahamut**: the AI-made one by default (`bahamut-ai.glb`, no clips, his own physically based look, the procedural wing flap), the game's (`bahamut.glb` and his clips at 4x) for `?boss=real`, the AI mesh with the
 *    moved clips for `?bossrig=clips` when its rigged files are on disk and the procedural AI boss when they are not. A missing AI file is a capsule, never the game's Bahamut in disguise.
 * 4. **The fallbacks**: a figure with no file stands on the neutral capsule (and the log says nothing), one whose file will not parse is a capsule and a line in the log; every id always has a model.
 * 5. **The reads**: a body is a model only if it begins "glTF" (a dev server answers an unknown path with its index page and status 200), a map only if it is JSON, and the `.chr` scale comes from the extras in the shapes
 *    the extraction wrote.
 */
import { AnimationClip, BoxGeometry, Group, Mesh, MeshStandardMaterial, VectorKeyframeTrack } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { YRP_MODEL_DIRS } from '../../../src/data/yrp-ids.ts';
import { AI_BOSS_FILES, YRP_CAST, type BossChoice, type YrpId } from '../../../src/engine/yrp3d/layout.ts';
import { chrScaleOf, fetchGlb, fetchJson, loadYrpModels, modelDirs, type LoaderIO } from '../../../src/engine/yrp3d/load.ts';

/** A file's scene: a body 2.3 tall named `body`, and an arm. */
function fileScene(): Group {
  const g = new Group();
  const body = new Mesh(new BoxGeometry(1, 2.3, 0.6), new MeshStandardMaterial({ color: 0x8899aa }));
  body.name = 'body';
  body.position.y = 1.15;
  g.add(body, new Mesh(new BoxGeometry(1.2, 0.2, 0.2), new MeshStandardMaterial({ color: 0x8899aa })));
  return g;
}

const clip = (name: string): AnimationClip => new AnimationClip(name, 1, [new VectorKeyframeTrack('body.position', [0, 1], [0, 1.15, 0, 0, 1.2, 0])]);
const GIRL_CLIPS = ['APPEAR_00', 'DMG1', 'DEAD_00', 'DEAD_01', 'DEAD_02'];

const HD = YRP_MODEL_DIRS.hd;
const BASE = YRP_MODEL_DIRS.base;

/** What a fake folder holds: kind 1 a model, 2 a clips file (its own mesh too), 7 a body that will not parse. */
type Files = Record<string, 1 | 2 | 7>;

const bytesOf = (kind: number, scale: number): ArrayBuffer => {
  const b = new Uint8Array(32);
  b.set([0x67, 0x6c, 0x54, 0x46], 0); // "glTF"
  b[8] = kind;
  b[9] = scale;
  return b.buffer;
};

/** An IO over `files` (url -> kind) and `map` (the clip map's JSON, by url); `scale` is the `.chr` scale each model's extras say (by id). */
function fakeIO(files: Files, map: Record<string, unknown> = {}, scale: Record<string, number> = {}): { io: LoaderIO; fetched: string[] } {
  const fetched: string[] = [];
  const io: LoaderIO = {
    async fetchBytes(url) {
      fetched.push(url);
      const kind = files[url];
      if (!kind) return null;
      const id = /\/((?:yuna|rikku|paine|bahamut)(?:-ai)?)(?:-rigged|-anims)?\.glb$/.exec(url)?.[1] ?? '';
      return bytesOf(kind, scale[id] ?? 1);
    },
    async fetchJson(url) {
      fetched.push(url);
      return map[url] ?? null;
    },
    async parse(bytes) {
      const b = new Uint8Array(bytes);
      if (b[8] === 7) throw new Error('bad file');
      const scene = fileScene();
      scene.userData = { ffx2: { runtimeScale: b[9] } };
      return { scene, animations: b[8] === 2 ? GIRL_CLIPS.map(clip) : [], extras: scene.userData };
    },
    async clone(scene) {
      return scene.clone(true);
    },
  };
  return { io, fetched };
}

const url = (dir: string, file: string): string => `/${dir}/${file}`;
/** Every figure's model in `dir` as kind 1, and its clips file as kind 2 when `anims`; with `ai` the AI boss's mesh beside the real one. */
function folder(dir: string, anims: boolean, ids: readonly YrpId[] = YRP_CAST, ai = true): Files {
  const out: Files = {};
  for (const id of ids) {
    out[url(dir, `${id}.glb`)] = 1;
    if (anims) out[url(dir, `${id}-anims.glb`)] = 2;
  }
  if (ai && ids.includes('bahamut')) out[url(dir, AI_BOSS_FILES.mesh)] = 1;
  return out;
}

const HEIGHTS = { yuna: 1.9, rikku: 1.9, paine: 1.9, bahamut: 5 } as const;
const REAL: BossChoice = { boss: 'real', rig: false };
const opts = (io: LoaderIO, dirs: readonly string[], warn?: (m: string) => void, choice?: BossChoice) => ({ base: '/', dirs, heights: HEIGHTS, io, ...(warn ? { warn } : {}), ...(choice ? { choice } : {}) });
const GIRLS: readonly YrpId[] = ['yuna', 'rikku', 'paine'];

describe('the folders', () => {
  it('prefers the HD folder and falls back to the base one by default and for ?models=hd, and takes the base alone for ?models=base', () => {
    expect(modelDirs('', YRP_MODEL_DIRS)).toEqual([HD, BASE]);
    expect(modelDirs('?models=hd', YRP_MODEL_DIRS)).toEqual([HD, BASE]);
    expect(modelDirs('?yrp=painted&models=base', YRP_MODEL_DIRS)).toEqual([BASE]);
    expect(modelDirs('?models=nonsense', YRP_MODEL_DIRS)).toEqual([HD, BASE]);
  });

  it('names the two folders under models-exp, which no build ships', () => {
    expect([HD, BASE]).toEqual(['models-exp/yrp-hd', 'models-exp/yrp']);
  });
});

describe("each figure's parts", () => {
  it('takes the model from the HD folder when its file is there and the clips from the base folder (the same motions, without the 4x textures), every real figure', async () => {
    const t = fakeIO({ ...folder(HD, false), ...folder(BASE, true) });
    const models = await loadYrpModels(opts(t.io, [HD, BASE], undefined, REAL));
    for (const id of YRP_CAST) expect(models.sources[id], id).toMatchObject({ mesh: HD, clips: BASE });
    expect(models.capsules).toEqual([]);
    for (const id of YRP_CAST) {
      const m = models.models.get(id)!;
      expect([m.source, m.height, m.animated, m.playingClip]).toEqual(['own', HEIGHTS[id], true, 'APPEAR_00']);
    }
    expect(t.fetched).toContain(url(HD, 'yuna.glb'));
    expect(t.fetched).not.toContain(url(HD, 'yuna-anims.glb')); // the HD clips file (20 MB a figure) is never fetched while the base has one
    models.dispose();
  });

  it('takes a figure the HD folder lacks from the base folder, and says which folder each came from', async () => {
    const t = fakeIO({ ...folder(HD, false, GIRLS, false), ...folder(BASE, true) });
    const models = await loadYrpModels(opts(t.io, [HD, BASE], undefined, REAL));
    expect(models.sources['yuna']).toMatchObject({ mesh: HD, clips: BASE, file: 'yuna.glb', look: 'diffuse' });
    expect(models.sources['bahamut']).toMatchObject({ mesh: BASE, clips: BASE, file: 'bahamut.glb' });
    models.dispose();
  });

  it('with ?models=base looks in the base folder alone, and never asks for an HD file', async () => {
    const t = fakeIO({ ...folder(HD, false), ...folder(BASE, true) });
    const models = await loadYrpModels(opts(t.io, [BASE]));
    for (const id of GIRLS) expect(models.sources[id]).toMatchObject({ mesh: BASE, clips: BASE });
    expect(t.fetched.some((u) => u.includes(HD))).toBe(false);
    models.dispose();
  });

  it("takes the clips from the HD folder when the base has none, and shows a clips file's own mesh when there is no model file", async () => {
    const onlyHdAnims: Files = {};
    for (const id of GIRLS) onlyHdAnims[url(HD, `${id}-anims.glb`)] = 2;
    const models = await loadYrpModels(opts(fakeIO(onlyHdAnims).io, [HD, BASE]));
    for (const id of GIRLS) {
      expect(models.sources[id], id).toMatchObject({ mesh: HD, clips: HD });
      expect(models.models.get(id)!.source).toBe('own');
      expect(models.models.get(id)!.animated).toBe(true);
    }
    models.dispose();
  });

  it('shows a model with no clips file as a still figure: no rig, and it is no capsule', async () => {
    const models = await loadYrpModels(opts(fakeIO(folder(BASE, false)).io, [BASE]));
    for (const id of GIRLS) {
      expect(models.sources[id]).toMatchObject({ mesh: BASE, clips: null });
      expect(models.models.get(id)!.animated).toBe(false);
    }
    models.dispose();
  });

  it('reads the clip map from the base folder first, and the plans follow the map (a map that makes another clip the idle plays that one)', async () => {
    const files = { ...folder(HD, false), ...folder(BASE, true) };
    const map = { [url(BASE, 'clipmap.json')]: { characters: { yuna: { poses: { idle: { play: 'loop', clips: ['DMG1'] } } } } } };
    const t = fakeIO(files, map);
    const models = await loadYrpModels(opts(t.io, [HD, BASE]));
    expect(models.models.get('yuna')!.playingClip).toBe('DMG1'); // the map's idle
    expect(models.models.get('rikku')!.playingClip).toBe('APPEAR_00'); // not in the map: the game's names
    expect(t.fetched.filter((u) => u.endsWith('clipmap.json')).length).toBeGreaterThan(0);
    expect(t.fetched.indexOf(url(BASE, 'clipmap.json'))).toBeLessThan(t.fetched.indexOf(url(HD, 'clipmap.json')) === -1 ? Infinity : t.fetched.indexOf(url(HD, 'clipmap.json')));
    models.dispose();
  });

  it("applies the .chr scale from the extras of the model's file: the game's Bahamut's 4", async () => {
    const t = fakeIO(folder(BASE, true), {}, { bahamut: 4 });
    const models = await loadYrpModels(opts(t.io, [BASE], undefined, REAL));
    expect(models.models.get('bahamut')!.chrScale).toBe(4);
    expect(models.models.get('yuna')!.chrScale).toBe(1);
    expect(models.models.get('bahamut')!.trueHeight / models.models.get('yuna')!.trueHeight).toBeCloseTo(4, 5);
    models.dispose();
  });
});

describe('which Bahamut', () => {
  const both = (): { io: LoaderIO; fetched: string[] } => fakeIO({ ...folder(BASE, true), [url(BASE, AI_BOSS_FILES.rigged)]: 1, [url(BASE, AI_BOSS_FILES.anims)]: 2 }, {}, { bahamut: 4 });

  it("by default is the AI-made one playing the game's clips (2026-10-22): the rigged file, his clips, his own physically based look, no wing flap (the clips move the wings), and the game's Bahamut's files are never fetched", async () => {
    const t = both();
    const models = await loadYrpModels(opts(t.io, [BASE]));
    expect(models.sources['bahamut']).toEqual({ mesh: BASE, clips: BASE, file: 'bahamut-ai-rigged.glb', look: 'pbr' });
    const boss = models.models.get('bahamut')!;
    expect([boss.source, boss.animated, boss.flaps, boss.playsKo, boss.playingClip]).toEqual(['own', true, false, true, 'APPEAR_00']);
    expect(boss.chrScale).toBe(1); // the AI mesh is in its own units: no .chr scale
    expect(t.fetched.some((u) => u.endsWith('/bahamut.glb') || u.endsWith('/bahamut-anims.glb'))).toBe(false);
    expect(models.sources['yuna']).toMatchObject({ file: 'yuna.glb', look: 'diffuse' }); // the real girls are untouched
    models.dispose();
  });

  it("with ?boss=real is the game's own: bahamut.glb and his clips, at 4x, in the diffuse look, with no wing flap (his clips move the wings)", async () => {
    const t = both();
    const models = await loadYrpModels(opts(t.io, [BASE], undefined, REAL));
    expect(models.sources['bahamut']).toEqual({ mesh: BASE, clips: BASE, file: 'bahamut.glb', look: 'diffuse' });
    const boss = models.models.get('bahamut')!;
    expect([boss.animated, boss.flaps, boss.playsKo, boss.chrScale]).toEqual([true, false, true, 4]);
    expect(t.fetched.some((u) => u.includes('bahamut-ai'))).toBe(false);
    models.dispose();
  });

  it('with ?bossrig=simple keeps the first motion: bahamut-ai.glb with no clips, in his own physically based look, flapping his wings; the rigged files are never fetched', async () => {
    const t = both();
    const models = await loadYrpModels(opts(t.io, [BASE], undefined, { boss: 'ai', rig: false }));
    expect(models.sources['bahamut']).toEqual({ mesh: BASE, clips: null, file: 'bahamut-ai.glb', look: 'pbr' });
    const boss = models.models.get('bahamut')!;
    expect([boss.source, boss.animated, boss.flaps, boss.playsKo]).toEqual(['own', false, true, false]);
    expect(t.fetched.some((u) => u.includes('bahamut-ai-rigged') || u.includes('bahamut-ai-anims'))).toBe(false);
    models.dispose();
  });

  it('with no rigged files on disk (the default asks for them) plays the procedural AI boss, not a hole and not the game\'s Bahamut', async () => {
    const t = fakeIO(folder(BASE, true));
    const models = await loadYrpModels(opts(t.io, [BASE]));
    expect(models.sources['bahamut']).toMatchObject({ file: 'bahamut-ai.glb', look: 'pbr', clips: null });
    expect([models.models.get('bahamut')!.animated, models.models.get('bahamut')!.flaps]).toEqual([false, true]);
    models.dispose();
  });

  it('with no AI file at all stands the capsule, never the game\'s Bahamut in disguise (the real one is only for ?boss=real)', async () => {
    const t = fakeIO(folder(BASE, true, YRP_CAST, false));
    const models = await loadYrpModels(opts(t.io, [BASE]));
    expect(models.capsules).toEqual(['bahamut']);
    expect(models.models.get('bahamut')!.source).toBe('capsule');
    models.dispose();
  });
});

describe('the fallbacks', () => {
  it('stands the neutral capsule in any slot whose files are missing, and says which', async () => {
    const models = await loadYrpModels(opts(fakeIO(folder(BASE, true, ['yuna', 'rikku', 'paine'])).io, [BASE]));
    expect(models.capsules).toEqual(['bahamut']);
    expect(models.models.get('bahamut')!.source).toBe('capsule');
    expect(models.sources['bahamut']).toEqual({ mesh: null, clips: null, file: null, look: null });
    expect(models.models.get('yuna')!.source).toBe('own');
    expect(models.models.get('bahamut')!.height).toBe(5);
    models.dispose();
  });

  it('with no file at all, every slot is a capsule (the chapter still plays in frame A)', async () => {
    const models = await loadYrpModels(opts(fakeIO({}).io, [HD, BASE]));
    expect([...models.capsules].sort()).toEqual([...YRP_CAST].sort());
    for (const m of models.models.values()) expect([m.source, m.animated]).toEqual(['capsule', false]);
    models.dispose();
  });

  it('a file that will not parse is a capsule and a line in the log, never a failed load', async () => {
    const files = { ...folder(BASE, true, ['rikku', 'paine', 'bahamut']), [url(BASE, 'yuna.glb')]: 7 as const };
    const warn = vi.fn();
    const models = await loadYrpModels(opts(fakeIO(files).io, [BASE], warn));
    expect(models.capsules).toEqual(['yuna']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toMatch(/yuna\.glb did not parse: bad file/);
    expect(models.models.size).toBe(4);
    models.dispose();
  });

  it('dispose empties the set and frees the figures', async () => {
    const models = await loadYrpModels(opts(fakeIO(folder(BASE, true)).io, [BASE]));
    const roots = [...models.models.values()].map((m) => m.root);
    const holder = new Group();
    roots.forEach((r) => holder.add(r));
    models.dispose();
    expect(models.models.size).toBe(0);
    for (const r of roots) expect(r.parent).toBeNull();
  });
});

describe('the reads', () => {
  const GLB = new Uint8Array(32);
  GLB.set([0x67, 0x6c, 0x54, 0x46], 0);
  const answer = (body: BodyInit | null, status = 200) => (async () => new Response(body, { status })) as unknown as typeof fetch;

  it('fetchGlb returns the bytes of a binary glTF and nothing else: a missing file, an index page answered with 200, an empty body and a failed fetch are all null', async () => {
    expect(await fetchGlb('/x.glb', answer(GLB))).toBeInstanceOf(ArrayBuffer);
    expect(await fetchGlb('/x.glb', answer(null, 404))).toBeNull();
    expect(await fetchGlb('/x.glb', answer('<!doctype html><html><body>index</body></html>'))).toBeNull();
    expect(await fetchGlb('/x.glb', answer(''))).toBeNull();
    expect(await fetchGlb('/x.glb', (async () => { throw new Error('offline'); }) as unknown as typeof fetch)).toBeNull();
  });

  it('fetchJson returns parsed JSON and null for a missing file, an index page (not JSON) and a failed fetch', async () => {
    expect(await fetchJson('/m.json', answer('{"a":1}'))).toEqual({ a: 1 });
    expect(await fetchJson('/m.json', answer(null, 404))).toBeNull();
    expect(await fetchJson('/m.json', answer('<!doctype html>'))).toBeNull();
    expect(await fetchJson('/m.json', (async () => { throw new Error('offline'); }) as unknown as typeof fetch)).toBeNull();
  });

  it("reads the .chr scale from the extras: runtimeScale first, else the scale block's base times actor, else 1", () => {
    expect(chrScaleOf({ ffx2: { runtimeScale: 4, scaleBlock: { base: 9, actor: 9 } } })).toBe(4);
    expect(chrScaleOf({ ffx2: { scaleBlock: { base: 4, actor: 1 } } })).toBe(4);
    expect(chrScaleOf({ ffx2: { scale: { base: 2, actor: 1.5 } } })).toBe(3); // the clips file's name for the block
    expect(chrScaleOf({ ffx2: { runtimeScale: 0 } })).toBe(1);
    expect(chrScaleOf({ ffx2: { scaleBlock: { base: -1 } } })).toBe(1);
    expect(chrScaleOf({})).toBe(1);
    expect(chrScaleOf(undefined)).toBe(1);
  });
});
