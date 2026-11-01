/**
 * Release 73, lane "r73-bytes" (BOTH games, shared rig loading; `docs/handoff/r73-bytes.md`): a boss rig's variant looks stream in after the figure is built while the phone's entry holds the line.
 *
 * `RigFigure.load` used to fetch every look of every part (the part's own image and one per pose that swaps it: attack, cast, hurt, telegraph, ko, each with its rim mask and normal piece) before the figure could
 * be built: 4.7 MB in Chapter I and 5.7 MB in Chapter IV, of which 2.8 and 3.3 MB are variants that no frame draws until the boss first hurts, telegraphs or attacks (release 70, phone10). While the hold is shut
 * only each part's own look is waited for; a variant is the part's own image until it lands, lands when the hold opens in the order a fight first draws them, and goes on the mesh the moment it lands if the part
 * is showing it. Textures are stand-ins that need no image (a distinct `Texture` per file name).
 */
import { Texture } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRigFile } from './rig-fixture.ts';
import { makeRigFileV2 } from './rig-v2-fixture.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
const { readRig } = await import('../../../src/engine/rig/RigData.ts');
const { VARIANT_FIRST_USE, firstUseRank } = await import('../../../src/engine/rig/RigLook.ts');
const { bytesBooks, holdBackground, releaseBackground, resetHoldForTests, setForegroundFirst } = await import('../../../src/engine/LoadHold.ts');
type Painted = import('../../../src/engine/PaintedArt.ts').PaintedTexture;
type Opts = import('../../../src/engine/PaintedActor.ts').PaintedActorOptions;
type RigActorT = import('../../../src/engine/rig/RigActor.ts').RigActor;
type RigFileT = import('../../../src/data/art/rigTypes.ts').RigFile;

const idlePainting = (): Painted => ({ texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780 }, placeholder: false, url: '/art/characters/testfig/idle.png' });
const opts = (): Opts => ({ name: 'testfig', worldHeight: 1.82, side: 'party', shadow: false });

/** The order the files were asked for, the texture each got, and a way to make a file fail. */
let order: string[] = [];
const loaded = new Map<string, Texture>();
let failing = new Map<string, number>(); // file -> how many more times it fails
const nameOf = (url: string): string => url.split('/').pop()!.replace(/\.webp$/, '.png');

async function rigged(file: RigFileT): Promise<RigActorT> {
  const r = readRig(file);
  if (!r.ok) throw new Error(r.reason);
  order = [];
  loaded.clear();
  return RigActor.createRigged(opts(), {
    data: r.data,
    base: '/art/rigs/testfig',
    idlePainting: idlePainting(),
    loadTexture: async (url) => {
      const n = nameOf(url);
      order.push(n);
      const left = failing.get(n) ?? 0;
      if (left > 0) {
        failing.set(n, left - 1);
        throw new Error(`${n} did not load`);
      }
      const t = new Texture();
      loaded.set(n, t);
      return t;
    },
  });
}

const flush = async (): Promise<void> => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
};
const run = (a: RigActorT, seconds: number, dt = 1 / 60): void => {
  for (let t = 0; t < seconds - 1e-9; t += dt) a.update(dt);
};
const mesh = (a: RigActorT, n: string) => a.figure.plane.children.find((c) => c.name === n) as import('three').Mesh;
const mapOf = (a: RigActorT, n: string): Texture => (mesh(a, n).material as import('three').ShaderMaterial).uniforms['map']!.value as Texture;

/** The v2 fixture plus five boss-style variants on the body, named as a real boss rig names them and listed out of the order a fight uses them. */
function bossRig(): RigFileT {
  const f = makeRigFileV2();
  const parts = f.parts.map((p) => (p.name === 'body' ? { ...p, variants: Object.fromEntries(['ko', 'cast', 'attack', 'telegraph', 'hurt'].map((n) => [n, { png: `body.${n}.png` }])) } : p));
  return { ...f, parts, keys: { ...f.keys, attack: { ...f.keys['attack']!, parts: { ...(f.keys['attack']!.parts ?? {}), body: { image: 'attack' } } } } };
}

beforeEach(() => {
  resetHoldForTests();
  failing = new Map();
});
afterEach(() => {
  resetHoldForTests();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('the order a fight first draws a boss rig\'s variants in', () => {
  it('hurt, telegraph, attack, cast, ko; a name the list does not know comes after them all', () => {
    expect([...VARIANT_FIRST_USE]).toEqual(['hurt', 'telegraph', 'attack', 'cast', 'ko']);
    expect(firstUseRank('hurt')).toBeLessThan(firstUseRank('telegraph'));
    expect(firstUseRank('ko')).toBeLessThan(firstUseRank('back'));
    expect(firstUseRank('back')).toBe(firstUseRank('anything-else'));
  });
});

describe('a rig built when nothing is held (a desktop, every other caller)', () => {
  it('waits for every look before the figure exists, as before: nothing is pending, nothing is counted', async () => {
    const a = await rigged(bossRig());
    for (const f of ['body.png', 'body.ko.png', 'body.cast.png', 'body.attack.png', 'body.telegraph.png', 'body.hurt.png', 'head.back.png', 'head.wide.png']) expect(loaded.has(f), f).toBe(true);
    expect(a.figure.pendingLooks()).toEqual([]);
    expect(bytesBooks()).toMatchObject({ rigLooks: 0, rigLanded: 0, rigFailed: 0 });
  });

  it('?phonebytes=off holds the line but not the rig: the figure is built whole', async () => {
    vi.stubGlobal('location', { search: '?phonebytes=off' });
    setForegroundFirst(true);
    holdBackground();
    const a = await rigged(bossRig());
    expect(loaded.has('body.hurt.png')).toBe(true);
    expect(a.figure.pendingLooks()).toEqual([]);
  });
});

describe('a rig built while the phone\'s entry holds the line', () => {
  beforeEach(() => {
    setForegroundFirst(true);
    holdBackground();
  });

  it('waits for each part\'s own look only: no variant file is asked for before the hold opens', async () => {
    const a = await rigged(bossRig());
    await flush();
    for (const f of ['body.png', 'head.png', 'arm.png', 'scar.png']) expect(loaded.has(f), f).toBe(true);
    for (const f of ['body.ko.png', 'body.hurt.png', 'head.back.png', 'head.wide.png']) expect(order.includes(f), f).toBe(false);
    expect(a.figure.pendingLooks()).toHaveLength(5 + 2); // the body's five and the head's two
    expect(a.figure.partCount).toBe(7);
  });

  it('a pose whose variant has not landed shows the part\'s own image on its own mesh: nothing breaks, nothing garbles', async () => {
    const a = await rigged(bossRig());
    const ownGeo = mesh(a, 'body').geometry;
    const ownHeadGeo = mesh(a, 'head').geometry;
    a.setPose('attack', { immediate: true });
    run(a, 0.3);
    expect(mapOf(a, 'body')).toBe(loaded.get('body.png'));
    expect(mesh(a, 'body').geometry).toBe(ownGeo);
    expect(mesh(a, 'scar').visible).toBe(true); // the key's other parts still do what the key says
    a.setPose('hurt', { immediate: true }); // the head's own-mesh variant has not landed either: the part's own mesh and image
    run(a, 0.3);
    expect(mapOf(a, 'head')).toBe(loaded.get('head.png'));
    expect(mesh(a, 'head').geometry).toBe(ownHeadGeo); // the variant's own mesh is for the variant's own image: until it lands the part keeps both of its own
    const headPos = (mesh(a, 'head').geometry.getAttribute('position') as import('three').BufferAttribute).array as Float32Array;
    expect(headPos.some((v) => v !== 0 && Number.isFinite(v))).toBe(true); // the part's own quad, skinned as always
  });

  it('when the hold opens the variants are asked for in the order a fight first draws them', async () => {
    const a = await rigged(bossRig());
    await flush();
    releaseBackground();
    await flush();
    const body = order.filter((n) => /^body\.(hurt|telegraph|attack|cast|ko)\.png$/.test(n)).map((n) => n.split('.')[1]);
    expect(body).toEqual(['hurt', 'telegraph', 'attack', 'cast', 'ko']);
    expect(a.figure.pendingLooks()).toEqual([]);
    expect(bytesBooks()).toMatchObject({ rigLooks: 7, rigLanded: 7, rigFailed: 0 });
  });

  it('a variant that lands while its part is showing it goes on the mesh at once; one that lands for a part showing something else waits for its pose', async () => {
    const a = await rigged(bossRig());
    a.setPose('attack', { immediate: true });
    run(a, 0.3);
    expect(mapOf(a, 'body')).toBe(loaded.get('body.png'));
    releaseBackground();
    await flush();
    expect(mapOf(a, 'body')).toBe(loaded.get('body.attack.png')); // showing attack: it is on the mesh now
    a.update(1 / 60); // and the next skin poses it
    a.setPose('idle', { immediate: true });
    run(a, 0.3);
    expect(mapOf(a, 'body')).toBe(loaded.get('body.png'));
    a.setPose('hurt', { immediate: true });
    run(a, 0.3);
    expect(mapOf(a, 'head')).toBe(loaded.get('head.wide.png')); // the own-mesh variant of the head, landed while idle was shown, is there when its pose comes
    expect(mesh(a, 'head').geometry).not.toBe(mesh(a, 'body').geometry);
  });

  it('a variant that fails is asked for once more; if it fails again the part keeps its own image for that pose, the page says so once, and the rest land', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    failing.set('body.cast.png', 2);
    failing.set('body.telegraph.png', 1); // one failure: the retry lands it
    const a = await rigged(bossRig());
    releaseBackground();
    await flush();
    expect(loaded.has('body.cast.png')).toBe(false);
    expect(loaded.has('body.telegraph.png')).toBe(true);
    expect(loaded.has('body.hurt.png') && loaded.has('body.ko.png')).toBe(true);
    expect(a.figure.pendingLooks().map((p) => p.src.name)).toEqual(['cast']);
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('cast'))).toHaveLength(1);
    expect(bytesBooks()).toMatchObject({ rigFailed: 1, rigLanded: 6 });
  });

  it('a figure disposed before the hold opened asks for no variant at all', async () => {
    const a = await rigged(bossRig());
    const figure = a.figure;
    a.dispose();
    releaseBackground();
    await flush();
    expect(figure.gone).toBe(true);
    expect(order.filter((n) => /body.(ko|cast|attack|telegraph|hurt)|head.(back|wide)/.test(n))).toEqual([]);
    expect(bytesBooks().rigLanded).toBe(0);
  });

  it('a figure disposed while its variants were on the wire frees what lands, and it lands on nothing', async () => {
    const disposed = vi.spyOn(Texture.prototype, 'dispose');
    const r = readRig(bossRig());
    if (!r.ok) throw new Error(r.reason);
    let land: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (land = resolve));
    let hurtMap: Texture | null = null;
    const a = await RigActor.createRigged(opts(), {
      data: r.data,
      base: '/art/rigs/testfig',
      idlePainting: idlePainting(),
      loadTexture: async (url) => {
        const t = new Texture();
        if (/body.hurt/.test(url)) {
          await gate; // one variant is on the wire when the figure goes
          hurtMap = t;
        }
        return t;
      },
    });
    releaseBackground();
    await flush();
    const figure = a.figure;
    const before = disposed.mock.calls.length;
    a.dispose();
    land();
    await flush();
    expect(figure.gone).toBe(true);
    expect(disposed.mock.calls.length).toBeGreaterThan(before);
    expect(hurtMap).not.toBeNull();
    expect(disposed.mock.instances).toContain(hurtMap); // the texture that landed after the figure went was freed, not kept
  });

  it('swapping the maps to the other scale waits for the stream, then leaves a look that never landed alone', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    failing.set('body.ko.png', 2);
    const a = await rigged(bossRig());
    let swapped = false;
    const swap = a.figure.swapMaps('/art/rigs/testfig', 1, async (url) => {
      order.push(`swap:${nameOf(url)}`);
      return new Texture();
    }).then(() => (swapped = true));
    await flush();
    expect(swapped).toBe(false); // variants are still pending on the hold
    releaseBackground();
    await swap;
    expect(swapped).toBe(true);
    const swaps = order.filter((n) => n.startsWith('swap:')).map((n) => n.slice(5));
    expect(swaps).toContain('body.hurt.png');
    expect(swaps).not.toContain('body.ko.png'); // it never landed: no map to swap
  });

  it('a v1 rig (no variants at all) is built the same way and has nothing to stream', async () => {
    const a = await rigged(makeRigFile());
    expect(a.figure.pendingLooks()).toEqual([]);
    expect(a.figure.partCount).toBe(6);
  });
});
