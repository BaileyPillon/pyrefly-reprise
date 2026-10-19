/**
 * **The rig at the stage, for a release** (the rig program, 2026-10-17; both games, shared plumbing). The driver's rules, binding, as the engine keeps them:
 *   (a) a figure draws as a rig only with FULL COVERAGE: every pose it is painted in has a key (or was exempted by the gate); anything else is the painting set, with the reason on record;
 *   and, with the release art mirror (`tools/art-mirror-add-rigs.mjs`): the rig's textures are at the tier the device would draw the idle painting at (1x or 2x, the rim masks at 1x), inside the
 *   rigs' share of the class's texture budget, in the file the site serves; and the HUD's brackets and the strike's rows follow the pose SHOWN, not the idle plane the rig is mapped onto.
 */
import { PerspectiveCamera, Texture } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRigFile } from './rig-fixture.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});


const { buildFigure } = await import('../../../src/engine/rig/RigStage.ts');
const { chooseRig, clearRigCache, rigReport, uncoveredPoses } = await import('../../../src/engine/rig/RigLoad.ts');
const { rigLedger, rigTextureMB, planRigTextures, rigFileUrl, wantsMaster, RIG_SHARE, tierPartsOf, twinSizes, rimNeedsHalving } = await import('../../../src/engine/rig/RigTier.ts');
const { readSilhouettes, blendShape, profileOfShape } = await import('../../../src/engine/rig/RigSilhouette.ts');
const { readRig } = await import('../../../src/engine/rig/RigData.ts');
const { profileOfActor } = await import('../../../src/engine/motion/Silhouette.ts');
const { setShippedArt } = await import('../../../src/engine/ArtShipped.ts');
const { setArtTier } = await import('../../../src/engine/ArtDevice.ts');
type RigFile = import('../../../src/data/art/rigTypes.ts').RigFile;
type RigActorT = import('../../../src/engine/rig/RigActor.ts').RigActor;

const IDLE = '/art/characters/testfig/idle.png';
const ATTACK = '/art/characters/testfig/attack.png';
const KO = '/art/characters/testfig/ko.png';
const idlePainting = { texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780 }, placeholder: false, url: IDLE };

/** 40 bands whose painted run is [a, b] of the box width (a small ramp so rows differ). */
const profile = (a: number, b: number): { left: number[]; right: number[] } => ({ left: Array.from({ length: 40 }, (_, i) => a + i * 0.001), right: Array.from({ length: 40 }, () => b) });

/** The test rig with a ship record: silhouettes for idle (a narrow standing figure) and attack (a spear raised and thrust out). */
function shipped(over: { exempt?: string[]; coverage?: 'full' | 'partial' } = {}): RigFile {
  const f = makeRigFile();
  f.gate = {
    status: 'ok', at: '2026-10-17', by: 'test', coverage: over.coverage ?? 'full', exempt: over.exempt ?? [], keys: Object.keys(f.keys),
    silhouettes: {
      idle: { box: [100, 100, 300, 780], feet: [200, 780], profile: profile(0.1, 0.9) },
      attack: { box: [20, 60, 380, 780], feet: [200, 780], profile: profile(0.0, 1.0) },
    },
  };
  return f;
}

function serve(file: RigFile): ReturnType<typeof vi.fn> {
  const f = vi.fn(async (url: string) => (String(url).endsWith('/art/rigs/testfig/rig.json') ? { ok: true, status: 200, text: async () => JSON.stringify(file) } : { ok: false, status: 404, text: async () => '' }));
  vi.stubGlobal('fetch', f);
  return f;
}

const asked: string[] = [];
const loadTexture = async (url: string): Promise<Texture> => {
  asked.push(url);
  return new Texture();
};
const request = (over: Record<string, unknown> = {}): Parameters<typeof buildFigure>[0] => ({
  id: 'testfig',
  artId: 'testfig',
  poses: { idle: IDLE, attack: ATTACK },
  opts: { name: 'testfig', worldHeight: 1.82, side: 'party', shadow: false },
  hooks: { idlePainting, loadTexture },
  listed: async () => true,
  choose: { tiers: [1, 2], want: 2, budgetMB: 900 },
  ...over,
});

beforeEach(() => {
  clearRigCache();
  asked.length = 0;
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  setShippedArt(undefined);
  setArtTier(undefined);
});

const reason = (): string => rigReport().find((r) => r.subject === 'testfig')!.reason;

describe('full coverage, or the painting set (the driver\'s rule)', () => {
  it('lists the painted poses with no key and no exemption', () => {
    const r = readRig(shipped());
    if (!r.ok) throw new Error(r.reason);
    expect(uncoveredPoses(r.data, ['idle', 'attack', 'hurt', 'ko'])).toEqual([]);
    expect(uncoveredPoses(r.data, ['idle', 'cast', 'jump'])).toEqual(['cast', 'jump']);
    const ex = readRig(shipped({ exempt: ['cast'] }));
    if (!ex.ok) throw new Error(ex.reason);
    expect(uncoveredPoses(ex.data, ['idle', 'cast', 'jump'])).toEqual(['jump']);
  });
  it('a figure painted in a pose the rig has no key for is the painting set, naming the pose', async () => {
    serve(shipped());
    const b = await buildFigure(request({ poses: { idle: IDLE, attack: ATTACK, cast: '/art/characters/testfig/cast.png' } }));
    expect(b.rig).toBeNull();
    expect(reason()).toMatch(/^no key for cast /);
    expect(rigLedger.usedMB).toBe(0); // nothing reserved for a figure that is not a rig
  });
  it('a pose the gate exempted is not owed a key, and a pose the art only borrows from another painting is not painted at all', async () => {
    serve(shipped({ exempt: ['cast'] }));
    expect((await buildFigure(request({ poses: { idle: IDLE, attack: ATTACK, cast: '/art/characters/testfig/cast.png' } }))).rig).not.toBeNull();
    clearRigCache();
    serve(shipped());
    // `sleep` resolves to the idle's file: it is a borrowed pose, not a painting of its own, so it is not owed a key
    expect((await buildFigure(request({ poses: { idle: IDLE, attack: ATTACK, sleep: IDLE } }))).rig).not.toBeNull();
  });
  it('?rig=on (a person asking to look at a rig still being fitted) skips the rule', async () => {
    serve(shipped());
    const b = await buildFigure(request({ search: '?rig=on', poses: { idle: IDLE, attack: ATTACK, cast: '/art/characters/testfig/cast.png' } }));
    expect(b.rig).not.toBeNull();
  });
});

describe('the textures: the tier the device would draw the idle painting at, the rim masks at 1x, inside the rigs\' share of the budget', () => {
  it('a 2x device: the maps are the full-size files, the rim masks the 1x twins', async () => {
    serve(shipped());
    const b = await buildFigure(request());
    expect(b.rig).not.toBeNull();
    const maps = asked.filter((u) => !u.endsWith('.rim.png'));
    const rims = asked.filter((u) => u.endsWith('.rim.png'));
    expect(maps).toHaveLength(6);
    expect(maps.every((u) => !u.includes('/1x/'))).toBe(true);
    expect(rims).toHaveLength(5); // the arm is rimEverywhere: no mask
    expect(rims.every((u) => u.includes('/art/rigs/testfig/1x/'))).toBe(true);
    expect(b.rig!.rigInfo().textures).toEqual({ map: 2, rim: 1 });
  });
  it('a 1x device (a phone): every file is the 1x twin, and the figure holds a quarter of the memory', async () => {
    serve(shipped());
    const b = await buildFigure(request({ choose: { tiers: [1, 2], want: 1, budgetMB: 900 } }));
    expect(asked).toHaveLength(11);
    expect(asked.every((u) => u.includes('/art/rigs/testfig/1x/'))).toBe(true);
    expect(reason()).toMatch(/, 1x maps$/);
    const info = b.rig!.rigInfo();
    expect(info.textures).toEqual({ map: 1, rim: 1 });
    expect(info.textureMB).toBeGreaterThan(0);
    const r = readRig(shipped());
    if (!r.ok) throw new Error(r.reason);
    const parts = tierPartsOf(r.data);
    expect(rigTextureMB(parts, { map: 1, rim: 1 }) * 3.9).toBeLessThan(rigTextureMB(parts, { map: 2, rim: 2 }));
  });
  it('a rig with no 1x tier in the manifest has only the full-size files, whatever the device', async () => {
    serve(shipped());
    await buildFigure(request({ choose: { tiers: undefined, want: 1, budgetMB: 900 } }));
    expect(asked.every((u) => !u.includes('/1x/'))).toBe(true);
  });
  it('asks the site for the file it serves: a master derived as WebP is named .webp, the tier folder included', async () => {
    serve(shipped());
    setShippedArt(['art/rigs/testfig/body.png', 'art/rigs/testfig/1x/body.rim.png', 'art/rigs/testfig/1x/body.png']);
    await buildFigure(request());
    expect(asked).toContain('/art/rigs/testfig/body.webp');
    expect(asked).toContain('/art/rigs/testfig/1x/body.rim.webp');
    expect(asked).toContain('/art/rigs/testfig/head.png'); // a master that stayed PNG
    expect(rigFileUrl('/pyrefly-reprise/art/rigs/testfig', 'body.png', 1)).toBe('/pyrefly-reprise/art/rigs/testfig/1x/body.webp');
  });
  it('a figure over the rigs\' share of the budget takes the 1x tier, and over it again is the painting set; the memory is given back when the figure goes', async () => {
    serve(shipped());
    const r = readRig(shipped());
    if (!r.ok) throw new Error(r.reason);
    const parts = tierPartsOf(r.data);
    const big = rigTextureMB(parts, { map: 2, rim: 1 });
    const small = rigTextureMB(parts, { map: 1, rim: 1 });
    expect(big).toBeGreaterThan(small * 1.5);
    const budget = (small * 1.5) / RIG_SHARE; // room for one figure at the small tier: not for the big tier, and not for a second figure
    const a = await buildFigure(request({ choose: { tiers: [1, 2], want: 2, budgetMB: budget } }));
    expect(a.rig!.rigInfo().textures.map).toBe(1);
    expect(rigLedger.usedMB).toBeCloseTo(small, 6);
    const b = await buildFigure(request({ id: 'testfig-2', choose: { tiers: [1, 2], want: 2, budgetMB: budget } })); // the second does not fit even at 1x
    expect(b.rig).toBeNull();
    expect(reason()).toMatch(/^over the rig texture budget/);
    a.actor.dispose();
    expect(rigLedger.usedMB).toBe(0);
    const c = await buildFigure(request({ id: 'testfig-3', choose: { tiers: [1, 2], want: 2, budgetMB: budget } }));
    expect(c.rig).not.toBeNull(); // the room came back
  });
  it('a build that fails after the memory was reserved gives it back', async () => {
    serve(shipped());
    const b = await buildFigure(request({ hooks: { idlePainting, loadTexture: async () => { throw new Error('404'); } } }));
    expect(b.rig).toBeNull();
    expect(rigLedger.usedMB).toBe(0);
  });
  it('the planner: want 2 with a tier takes 2x maps and 1x rims, want 1 the 1x twins, no tier the full size, and refuses with the numbers when nothing fits', () => {
    const parts = [{ map: [1000, 2000] as const, rim: [500, 1000] as const }];
    expect(planRigTextures({ parts, tiers: [1, 2], want: 2, budgetMB: 1000, usedMB: 0 })).toMatchObject({ ok: true, textures: { map: 2, rim: 1 } });
    expect(planRigTextures({ parts, tiers: [1, 2], want: 3, budgetMB: 1000, usedMB: 0 })).toMatchObject({ ok: true, textures: { map: 2, rim: 1 } });
    expect(planRigTextures({ parts, tiers: [1, 2], want: 1, budgetMB: 1000, usedMB: 0 })).toMatchObject({ ok: true, textures: { map: 1, rim: 1 } });
    expect(planRigTextures({ parts, tiers: undefined, want: 1, budgetMB: 1000, usedMB: 0 })).toMatchObject({ ok: true, textures: { map: 2, rim: 2 } });
    const refused = planRigTextures({ parts, tiers: [1, 2], want: 2, budgetMB: 10, usedMB: 0 });
    expect(refused.ok).toBe(false);
    expect(refused.ok === false && refused.reason).toMatch(/over the rig texture budget \(\d+ MB at the smallest tier, 5 MB free of 5\)/);
    expect(wantsMaster(1.2)).toBe(true);
    expect(wantsMaster(0.9)).toBe(false);
  });
});

describe('a figure on its 1x maps raises them to the 2x when the camera magnifies the idle\'s texel (the art governor\'s own target), if the budget has room', () => {
  async function onePhoneFigure(budgetMB = 900): Promise<RigActorT> {
    serve(shipped());
    const b = await buildFigure(request({ choose: { tiers: [1, 2], want: 1, budgetMB } }));
    return b.rig!;
  }
  /** Look at the figure from `z` metres: the figure's idle texel then covers more or fewer pixels. */
  function lookFrom(a: RigActorT, z: number): void {
    const cam = new PerspectiveCamera(40, 16 / 9, 0.1, 100);
    cam.position.set(0, 0.9, z);
    cam.lookAt(0, 0.9, 0);
    cam.updateMatrixWorld(true);
    (a.figure as unknown as { seen: unknown }).seen = { camera: cam, height: 900 };
  }
  const settle = async (): Promise<void> => {
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
  };
  it('stays on 1x while the texel is smaller than a pixel, and raises when it is not', async () => {
    const a = await onePhoneFigure();
    const small = rigTextureMB(readRigParts(), { map: 1, rim: 1 });
    expect(rigLedger.usedMB).toBeCloseTo(small, 6);
    lookFrom(a, 12); // far: a texel is a fraction of a pixel
    for (let i = 0; i < 45; i++) a.update(1 / 60);
    await settle();
    expect(a.rigInfo().textures.map).toBe(1);
    asked.length = 0;
    lookFrom(a, 1.6); // close: a texel covers more than a pixel
    for (let i = 0; i < 45; i++) a.update(1 / 60);
    await settle();
    expect(a.rigInfo().textures).toEqual({ map: 2, rim: 1 });
    expect(asked).toHaveLength(6); // the six maps, at the full-size files
    expect(asked.every((u) => !u.includes('/1x/'))).toBe(true);
    expect(rigLedger.usedMB).toBeCloseTo(rigTextureMB(readRigParts(), { map: 2, rim: 1 }), 6);
    a.dispose();
    expect(rigLedger.usedMB).toBe(0);
  });
  it('does not raise when the rigs\' share of the budget has no room, and says nothing more about it', async () => {
    const a = await onePhoneFigure();
    const hold = rigLedger.reserve(1e6); // the rest of the budget is spoken for
    lookFrom(a, 1.6);
    for (let i = 0; i < 45; i++) a.update(1 / 60);
    await settle();
    expect(a.rigInfo().textures.map).toBe(1);
    asked.length = 0;
    hold();
    for (let i = 0; i < 45; i++) a.update(1 / 60);
    await settle();
    expect(asked).toHaveLength(0); // it asked once and was told no: it does not ask every frame
  });
});

function readRigParts(): ReturnType<typeof tierPartsOf> {
  const r = readRig(shipped());
  if (!r.ok) throw new Error(r.reason);
  return tierPartsOf(r.data);
}

describe('the silhouette per key: the brackets and the strike follow the pose shown', () => {
  async function figure(): Promise<RigActorT> {
    serve(shipped());
    const b = await buildFigure(request());
    return b.rig!;
  }
  const width = (q: Array<{ x: number }>): number => Math.abs(q[1]!.x - q[0]!.x);

  it('reads what the gate stamped, leaves a malformed record out, and blends between two keys on the game\'s ease', () => {
    const f = shipped();
    f.gate!.silhouettes!['hurt'] = { box: [10, 10, 5, 5], feet: null, profile: { left: [], right: [] } } as never; // x1 before x0: no shape
    const s = readSilhouettes(f.gate);
    expect([...s.keys()].sort()).toEqual(['attack', 'idle']);
    const [i, a] = [s.get('idle')!, s.get('attack')!];
    expect(blendShape(i, a, 0)).toBe(i);
    expect(blendShape(i, a, 1)).toBe(a);
    const mid = blendShape(i, a, 0.5);
    expect(mid.box[0]).toBeCloseTo((i.box[0] + a.box[0]) / 2, 6); // the game's ease is symmetric: half way is half way
    expect(mid.box[2]).toBeCloseTo((i.box[2] + a.box[2]) / 2, 6);
  });
  it('the profile is the painted front in fractions of the box, and a mirrored plane flips it', () => {
    const s = readSilhouettes(shipped().gate).get('idle')!;
    const p = profileOfShape(s, false);
    expect(p.left[0]).toBeCloseTo(0.1, 5);
    expect(p.right[0]).toBeCloseTo(0.9, 5);
    const m = profileOfShape(s, true);
    expect(m.left[0]).toBeCloseTo(0.1, 5); // 1 - 0.9
    expect(m.right[0]).toBeCloseTo(0.9, 5); // 1 - 0.1
    const lopsided = profileOfShape(readSilhouettes(shipped().gate).get('attack')!, true);
    expect(lopsided.left[0]).toBeCloseTo(0, 5);
  });
  it('contentQuad is the box of the key shown: the attack\'s is wider than the idle\'s, and a move between them is in between', async () => {
    const a = await figure();
    a.update(1 / 60);
    const idle = width(a.contentQuad());
    a.setPose('attack', { immediate: true });
    a.update(1 / 60);
    const attack = width(a.contentQuad());
    expect(attack / idle).toBeCloseTo((380 - 20) / (300 - 100), 1);
    a.setPose('idle', { immediate: true });
    a.update(1 / 60);
    expect(width(a.contentQuad())).toBeCloseTo(idle, 6);
    a.setPose('attack'); // 140 ms
    for (let i = 0; i < 4; i++) a.update(1 / 60);
    const mid = width(a.contentQuad());
    expect(mid).toBeGreaterThan(idle * 1.05);
    expect(mid).toBeLessThan(attack * 0.98);
  });
  it('poseShape(name) is the box of the key a request for the name would show, without showing it; a pose with no stamped shape falls back to the actor\'s own', async () => {
    const a = await figure();
    const shape = a.poseShape('attack')!;
    expect(shape).not.toBeNull();
    expect(Math.abs(shape.corners[1].x - shape.corners[0].x) / width(a.contentQuad())).toBeCloseTo(1.8, 1); // idle showing, attack's box
    expect(a.pose).toBe('idle');
    expect(shape.u0).toBeCloseTo(20 / 400, 6);
    expect(shape.v1).toBeCloseTo(1 - 60 / 800, 6);
    expect(shape.mirrored).toBe(false);
  });
  it('the strike\'s rows come from the key: profileOfActor asks the rig before it reads the idle painting\'s alpha', async () => {
    const a = await figure();
    const idle = profileOfActor(a)!;
    const atk = profileOfActor(a, 'attack')!;
    expect(idle.left[0]).toBeCloseTo(0.1, 5);
    expect(atk.left[0]).toBeCloseTo(0, 5);
    expect(atk.right[0]).toBeCloseTo(1, 5);
    a.setPose('attack', { immediate: true });
    a.update(1 / 60);
    expect(profileOfActor(a)!.right[0]).toBeCloseTo(1, 5);
  });
  it('the feet point is where the gate found the lowest foot of the pose shown, on the idle plane\'s ground', async () => {
    const a = await figure();
    a.update(1 / 60);
    const foot = a.feetPoint()!;
    expect(foot).not.toBeNull();
    const quad = a.contentQuad();
    // the stamped feet [200, 780] sit on the bottom of the idle box [.., 780]: the same height as its lower edge, and inside it sideways
    expect(foot.y).toBeCloseTo(quad[0].y, 5);
    expect(foot.x).toBeGreaterThan(quad[0].x);
    expect(foot.x).toBeLessThan(quad[1].x);
  });
  it('a key the gate stamped no shape for keeps the figure\'s last shape (it never reads as a missing box)', async () => {
    const a = await figure();
    a.setPose('hurt', { immediate: true });
    a.update(1 / 60);
    expect(width(a.contentQuad())).toBeGreaterThan(0);
  });
});

describe('the sizes the memory is budgeted from, and the tier rule the tool and the engine share', () => {
  it('the engine\'s rule for the twins is the tool\'s, on a table of sizes (a rim written at the map\'s size is halved, one already at half or less is copied, an odd edge rounds up)', async () => {
    const tool = await import('../../../tools/rig/rig-tiers.mjs');
    const table: Array<[[number, number], [number, number] | null]> = [[[907, 737], [907, 737]], [[907, 737], [453, 368]], [[907, 737], [454, 369]], [[907, 737], [455, 370]], [[307, 201], [154, 101]], [[307, 201], [307, 201]], [[2220, 64], [1110, 32]], [[2220, 64], null], [[1, 1], [1, 1]], [[8, 8], [3, 3]]];
    for (const [map, rim] of table) {
      const a = tool.twinSizes(map, rim);
      const b = twinSizes({ map, rim });
      expect([b.map, b.rim], JSON.stringify([map, rim])).toEqual([a.map1x, a.rim1x]);
      if (rim) expect(rimNeedsHalving(rim, map)).toBe(tool.rimNeedsHalving({ width: rim[0], height: rim[1] }, { width: map[0], height: map[1] }));
    }
  });
  it('budgets from the sizes the gate stamped, not from the box: a ribbon part\'s PNG is a thin strip, and a rim mask may be half its map\'s size', () => {
    const f = shipped();
    f.gate!.textures = { body: { map: [120, 250], rim: [60, 125] }, tail: { map: [200, 20], rim: [100, 10] } };
    const r = readRig(f);
    if (!r.ok) throw new Error(r.reason);
    const parts = tierPartsOf(r.data);
    const names = r.data.parts.map((p) => p.name);
    expect(parts[names.indexOf('body')]).toEqual({ map: [120, 250], rim: [60, 125] });
    expect(parts[names.indexOf('tail')]).toEqual({ map: [200, 20], rim: [100, 10] }); // not its 80 x 150 box
    expect(parts[names.indexOf('legN')]).toEqual({ map: [40, 330], rim: [40, 330] }); // no stamp for it: the box, for both files
    expect(parts[names.indexOf('arm')]!.rim).toBeNull(); // rimEverywhere: no mask texture
    // an unusable stamp is not believed: a zero, a string and a missing size fall back to the box
    f.gate!.textures = { body: { map: [0, 250] as never, rim: null }, tail: { map: 'x' as never, rim: null } };
    const bad = readRig(f);
    if (!bad.ok) throw new Error(bad.reason);
    expect(tierPartsOf(bad.data)[names.indexOf('body')]).toEqual({ map: [120, 250], rim: [120, 250] });
  });
  it('a rim already at half its map\'s size costs the same at both scales; one written at the map\'s size costs a quarter at 1x', () => {
    const half = [{ map: [1000, 2000] as const, rim: [500, 1000] as const }];
    const full = [{ map: [1000, 2000] as const, rim: [1000, 2000] as const }];
    const rimOnly = (parts: ReadonlyArray<{ map: readonly [number, number]; rim: readonly [number, number] }>, rim: 1 | 2): number => rigTextureMB(parts, { map: 1, rim }) - rigTextureMB([{ map: parts[0]!.map, rim: null }], { map: 1, rim: 1 });
    expect(rimOnly(half, 1)).toBeCloseTo(rimOnly(half, 2), 9);
    expect(rimOnly(full, 1) * 4).toBeCloseTo(rimOnly(full, 2), 0);
  });
});

describe('chooseRig, directly', () => {
  it('keys the decision on what it is told: painted poses, the device\'s scale, the budget', async () => {
    serve(shipped());
    const c = await chooseRig('testfig', IDLE, { on: true, reason: 'default' }, false, async () => true, { painted: ['idle', 'attack', 'ko'], tiers: [1, 2], want: 1, budgetMB: 900 });
    expect(c.on).toBe(true);
    expect(c.asset?.textures).toEqual({ map: 1, rim: 1 });
    expect(KO).toBeTruthy();
    c.asset?.release?.();
  });
});
