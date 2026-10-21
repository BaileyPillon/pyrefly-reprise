/**
 * **The HD-2D look lights a rig** (release 61, `src/engine/look/relight/RigRelight.ts`, format v2.2 `normal`). Both games: the shader and the loader are shared plumbing; what it lights is Chapter I's Seymour Flux (FFX)
 * and Chapter IV's Bahamut (FFX-2). The painted figures are lit by binding the painting's normal map; a rig has parts, so each part and variant carries a normal piece (`RigPart.normal`) and a lit part binds the piece of
 * the look it shows. Proved here, with stand-in textures: the file is read; nothing is asked for, compiled or bound while no look is armed (or the look is anime, or the budget has no room); a lit rig compiles the relight
 * block and shares the light cells with the painted figures; a swap, a hide and a cross-fade move the binding with the look; a piece that does not load leaves that look unlit and never fails the rig.
 */
import { Texture, type ShaderMaterial } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRigFile } from './rig-fixture.ts';
import { makeRigFileV2 } from './rig-v2-fixture.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

// the painted idle plane the rig carries is bound to its own map by the painted path (it needs a browser's image loader); that path is not under test here
vi.mock('../../../src/engine/look/relight/FigureRelight.ts', async (orig) => ({ ...(await orig<typeof import('../../../src/engine/look/relight/FigureRelight.ts')>()), bindRelight: () => undefined }));

const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
const { readRig } = await import('../../../src/engine/rig/RigData.ts');
const { chooseRig, clearRigCache } = await import('../../../src/engine/rig/RigLoad.ts');
const { rigLedger, rigNormalMB, rigTextureMB, tierPartsOf } = await import('../../../src/engine/rig/RigTier.ts');
const { lookState } = await import('../../../src/engine/look/LookState.ts');
const { relightCells } = await import('../../../src/engine/look/relight/FigureRelight.ts');
const { rigRelightWanted } = await import('../../../src/engine/look/relight/RigRelight.ts');
type Painted = import('../../../src/engine/PaintedArt.ts').PaintedTexture;
type Opts = import('../../../src/engine/PaintedActor.ts').PaintedActorOptions;
type RigActorT = import('../../../src/engine/rig/RigActor.ts').RigActor;
type RigFileT = import('../../../src/data/art/rigTypes.ts').RigFile;

/** The v2 fixture with normal pieces: every part's own look has one, `head` variant `back` has one, `head` variant `wide` has none (a look with no piece is not lit). */
function litFile(): RigFileT {
  const f = makeRigFileV2();
  const parts = f.parts.map((p) => {
    const own = { ...p, normal: `${p.name}.normal.png` };
    if (p.name !== 'head') return own;
    return { ...own, variants: { back: { ...p.variants!['back']!, normal: 'head.back.normal.png' }, wide: p.variants!['wide']! } };
  });
  return { ...f, parts };
}

const idlePainting = (): Painted => ({ texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780 }, placeholder: false, url: '/art/characters/testfig/idle.png' });
const opts = (): Opts => ({ name: 'testfig', worldHeight: 1.82, side: 'party', shadow: false });

const asked: string[] = [];
const byName = new Map<string, Texture>();
let failNormals = false;

async function rigged(file: RigFileT, normals: boolean): Promise<RigActorT> {
  const r = readRig(file);
  if (!r.ok) throw new Error(r.reason);
  asked.length = 0;
  byName.clear();
  return RigActor.createRigged(opts(), {
    data: r.data,
    base: '/art/rigs/testfig',
    idlePainting: idlePainting(),
    ...(normals ? { normals: true } : {}),
    loadTexture: async (url) => {
      const name = url.split('/').pop()!.replace(/\.webp$/, '.png');
      asked.push(name);
      if (failNormals && name.endsWith('.normal.png')) throw new Error('404');
      const t = new Texture();
      byName.set(name, t);
      return t;
    },
  });
}

const mesh = (a: RigActorT, n: string) => a.figure.plane.children.find((c) => c.name === n) as import('three').Mesh;
const mat = (a: RigActorT, n: string): ShaderMaterial => mesh(a, n).material as ShaderMaterial;
const lit = (m: ShaderMaterial): boolean => m.defines?.['PAINTED_RELIGHT'] !== undefined;

const saved = { armed: lookState.armed, name: lookState.name };
const arm = (name: 'hd2d' | 'cinematic' | 'anime' | null): void => {
  lookState.armed = name !== null;
  lookState.name = name;
};
beforeEach(() => {
  failNormals = false;
  arm('hd2d');
});
afterEach(() => {
  lookState.armed = saved.armed;
  lookState.name = saved.name;
  vi.restoreAllMocks();
});

describe('the file: `normal` is read from a part and from a variant, as a plain file name or not at all', () => {
  it('reads it, and a rig with none reads exactly as before (null)', () => {
    const r = readRig(litFile());
    if (!r.ok) throw new Error(r.reason);
    const head = r.data.parts.find((p) => p.name === 'head')!;
    expect(head.normal).toBe('head.normal.png');
    expect(head.variants.map((v) => [v.name, v.normal])).toEqual([['back', 'head.back.normal.png'], ['wide', null]]);
    const plain = readRig(makeRigFileV2());
    if (!plain.ok) throw new Error(plain.reason);
    expect(plain.data.parts.every((p) => p.normal === null && p.variants.every((v) => v.normal === null))).toBe(true);
  });

  it('refuses nothing and keeps nothing for a path (a normal is a file beside rig.json)', () => {
    const f = makeRigFile();
    const r = readRig({ ...f, parts: f.parts.map((p, i) => (i === 0 ? { ...p, normal: '../evil.png' } : i === 1 ? { ...p, normal: 'sub/x.png' } : p)) });
    if (!r.ok) throw new Error(r.reason);
    expect(r.data.parts[0]!.normal).toBeNull();
    expect(r.data.parts[1]!.normal).toBeNull();
  });
});

describe('with no look armed, or a look that has no relight, or no ask: nothing is fetched, nothing compiled in, nothing bound', () => {
  it('the look switch: armed with hd2d or cinematic wants the pieces; anime, no look, or a look that is off does not', () => {
    arm('hd2d');
    expect(rigRelightWanted()).toBe(true);
    arm('cinematic');
    expect(rigRelightWanted()).toBe(true);
    arm('anime');
    expect(rigRelightWanted()).toBe(false);
    arm(null);
    expect(rigRelightWanted()).toBe(false);
    lookState.armed = true; // `?look=off`: the address carries a look key and no look is on
    lookState.name = null;
    expect(rigRelightWanted()).toBe(false);
  });

  it.each([
    ['no look armed', () => arm(null), true],
    ['the anime look (flat: no relight)', () => arm('anime'), true],
    ['a lit-capable look but the caller did not ask (the budget had no room)', () => arm('hd2d'), false],
  ])('%s', async (_n, set, ask) => {
    set();
    const a = await rigged(litFile(), ask as boolean);
    expect(asked.filter((n) => n.endsWith('.normal.png'))).toEqual([]);
    for (const p of a.figure.materials) {
      expect(lit(p)).toBe(false);
      expect(p.uniforms['relightNormal']).toBeUndefined();
    }
    expect(a.rigInfo().relight).toEqual({ lit: false, pieces: 0 });
  });

  it('a rig file with no normal pieces draws exactly as before even under a look', async () => {
    const a = await rigged(makeRigFileV2(), true);
    expect(a.figure.materials.some(lit)).toBe(false);
    expect(a.rigInfo().relight).toEqual({ lit: false, pieces: 0 });
  });
});

describe('a lit rig', () => {
  it('fetches one piece per look that names one, as data (no colour space), and compiles the painted shader\'s relight block into every part', async () => {
    const a = await rigged(litFile(), true);
    const normals = asked.filter((n) => n.endsWith('.normal.png')).sort();
    expect(normals).toEqual(['arm.normal.png', 'body.normal.png', 'head.back.normal.png', 'head.normal.png', 'scar.normal.png', 'legF.normal.png', 'legN.normal.png', 'tail.normal.png'].sort());
    for (const n of normals) expect(byName.get(n)!.colorSpace, n).toBe('');
    for (const m of a.figure.materials) {
      expect(lit(m)).toBe(true);
      expect(m.fragmentShader).toContain('relightNormal'); // the patched painted shader still has the block
      expect(m.vertexShader).toContain('varying vec3 vNR'); // and the vertex shader feeds it its varyings
      expect(m.vertexShader).toContain('vClip = gl_Position');
    }
    expect(a.rigInfo().relight).toEqual({ lit: true, pieces: 8 }); // the seven parts' own looks and the `back` variant; `head.wide` has none
  });

  it('shares the light cells with every painted figure: ONE key, rim and set of point lights', async () => {
    const a = await rigged(litFile(), true);
    for (const m of a.figure.materials) {
      for (const k of Object.keys(relightCells)) expect(m.uniforms[k], k).toBe((relightCells as Record<string, unknown>)[k]);
    }
    relightCells.relightAny.value = 1;
    expect(mat(a, 'head').uniforms['relightAny']!.value).toBe(1);
    relightCells.relightAny.value = 0;
  });

  it('binds the piece of the look a part shows: its own, then the variant\'s, then none (a look with no piece is unlit) and back', async () => {
    const a = await rigged(litFile(), true);
    const piece = (n: string): Texture | undefined => byName.get(n);
    expect(mat(a, 'head').uniforms['relightNormal']!.value).toBe(piece('head.normal.png'));
    expect(mat(a, 'head').uniforms['relightOn']!.value).toBe(1);
    a.setPose('attack', { immediate: true }); // the `back` variant: has a piece
    expect(mat(a, 'head').uniforms['relightNormal']!.value).toBe(piece('head.back.normal.png'));
    expect(mat(a, 'head').uniforms['relightOn']!.value).toBe(1);
    a.setPose('hurt', { immediate: true }); // the `wide` variant: none
    expect(mat(a, 'head').uniforms['relightOn']!.value).toBe(0);
    expect(mat(a, 'head').uniforms['relightNormal']!.value).not.toBe(piece('head.normal.png'));
    a.setPose('idle', { immediate: true });
    expect(mat(a, 'head').uniforms['relightNormal']!.value).toBe(piece('head.normal.png'));
    expect(mat(a, 'head').uniforms['relightOn']!.value).toBe(1);
  });

  it('a cross-fade keeps the look going out lit with its own piece on the ghost mesh', async () => {
    const a = await rigged(litFile(), true);
    const fig = a.figure;
    const idx = fig.plane.children.filter((c) => !c.name.endsWith('~ghost')).findIndex((c) => c.name === 'head');
    const state = new Int16Array(fig.partState());
    state[idx] = 0; // the `back` variant
    fig.setPartState(state, 110);
    const ghost = fig.plane.children.find((c) => c.name === 'head~ghost') as import('three').Mesh;
    expect(ghost).toBeDefined();
    const g = ghost.material as ShaderMaterial;
    expect(lit(g)).toBe(true);
    expect(g.uniforms['relightNormal']!.value).toBe(byName.get('head.normal.png')); // the look going out
    expect(g.uniforms['relightOn']!.value).toBe(1);
    expect(mat(a, 'head').uniforms['relightNormal']!.value).toBe(byName.get('head.back.normal.png')); // the look coming in
  });

  it('a piece that does not load leaves that look unlit and never fails the rig', async () => {
    failNormals = true;
    const a = await rigged(litFile(), true);
    expect(a.figure.partCount).toBe(7);
    expect(a.rigInfo().relight).toEqual({ lit: false, pieces: 0 });
    for (const m of a.figure.materials) expect(lit(m)).toBe(false); // none loaded: nothing to light, nothing compiled in
  });

  it('disposes the pieces with the figure', async () => {
    const a = await rigged(litFile(), true);
    const spy = vi.spyOn(byName.get('head.normal.png')!, 'dispose');
    a.dispose();
    expect(spy).toHaveBeenCalled();
  });
});

describe('the texture budget: the pieces are extra memory, taken only when the rigs\' share has room, and never at the cost of the rig', () => {
  const stamped = (): RigFileT => {
    const f = litFile();
    const sizes: Record<string, { map: [number, number]; rim: [number, number] | null; normal?: [number, number] }> = {};
    for (const p of f.parts) {
      sizes[p.name] = { map: [p.box[2], p.box[3]], rim: null, normal: [40, 40] };
      for (const [vn, v] of Object.entries(p.variants ?? {})) sizes[`${p.name}:${vn}`] = { map: [(v.box ?? p.box)[2], (v.box ?? p.box)[3]], rim: null, ...(v.normal ? { normal: [40, 40] as [number, number] } : {}) };
    }
    return { ...f, gate: { ...f.gate!, textures: sizes } };
  };
  const IDLE = '/art/characters/testfig/idle.png';

  beforeEach(() => {
    clearRigCache();
    rigLedger.reset();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', async (url: string) => (String(url).endsWith('/art/rigs/testfig/rig.json') ? { ok: true, status: 200, text: async () => JSON.stringify(stamped()) } : { ok: false, status: 404, text: async () => '' }));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    rigLedger.reset();
    clearRigCache();
  });

  it('counts the stamped sizes of the pieces (one size, no twin), and none for a file the stamp has no size for', () => {
    const r = readRig(stamped());
    if (!r.ok) throw new Error(r.reason);
    const parts = tierPartsOf(r.data);
    expect(parts.filter((p) => p.normal).length).toBe(8);
    expect(rigNormalMB(parts)).toBeGreaterThan(0);
    const bare = readRig({ ...litFile(), gate: { status: 'ok', at: 'x', by: 'test' } });
    if (!bare.ok) throw new Error(bare.reason);
    expect(rigNormalMB(tierPartsOf(bare.data))).toBe(0);
    expect(tierPartsOf(bare.data).every((p) => p.normal === undefined)).toBe(true); // the shape the older tests pin is unchanged
  });

  it('asks for the pieces under a look when there is room, and reserves them with the colour textures', async () => {
    const c = await chooseRig('testfig', IDLE, { on: true, reason: 'test' }, false, async () => true, { tiers: undefined, want: 2, budgetMB: 400 });
    expect(c.on).toBe(true);
    expect(c.asset?.normals).toBe(true);
    expect(c.reason).toContain(', lit');
    const colourOnly = readRig(stamped());
    if (!colourOnly.ok) throw new Error(colourOnly.reason);
    expect(rigLedger.usedMB).toBeGreaterThan(0);
    c.asset?.release?.();
    expect(rigLedger.usedMB).toBeCloseTo(0, 6);
  });

  it('asks for none without a look, and for none when the share has no room: the rig is still on, unlit', async () => {
    arm(null);
    const a = await chooseRig('testfig', IDLE, { on: true, reason: 'test' }, false, async () => true, { tiers: undefined, want: 2, budgetMB: 400 });
    expect(a.on).toBe(true);
    expect(a.asset?.normals).toBeUndefined();
    a.asset?.release?.();
    arm('hd2d');
    clearRigCache();
    // room for the colour textures but not the pieces on top of them
    const parts = tierPartsOf((readRig(stamped()) as { ok: true; data: import('../../../src/engine/rig/RigData.ts').RigData }).data);
    const colourMB = rigTextureMB(parts, { map: 2, rim: 2 });
    const budget = (colourMB + rigNormalMB(parts) * 0.5) / 0.5;
    const b = await chooseRig('testfig', IDLE, { on: true, reason: 'test' }, false, async () => true, { tiers: undefined, want: 2, budgetMB: budget });
    expect(b.on).toBe(true);
    expect(b.asset?.normals).toBeUndefined();
    expect(b.reason).not.toContain(', lit');
    b.asset?.release?.();
  });
});
