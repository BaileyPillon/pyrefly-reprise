/**
 * Release 39 ("r39-hires-engine"; both games, shared plumbing): the art governor. Real three.js math and textures (no GL), a fake
 * actor, a fake loader. What is checked: the measurement of a painting's texel on screen, which master a camera asks for, the
 * persistence before a download, the in-place swap, the siblings, the memory budget's eviction, and the pin.
 */
import { Mesh, Object3D, PerspectiveCamera, PlaneGeometry, Texture } from 'three';
import { describe, expect, it } from 'vitest';
import { budgetFor } from '../../../src/engine/ArtBudget.ts';
import { ArtGovernor, PERSIST_MS, pixelsPer1xTexel, type GovernedActor, type GovernedPainting, type PixelSource } from '../../../src/engine/ArtGovernor.ts';
import { StageArt, anticipateView } from '../../../src/engine/StageArt.ts';
import { BattleCamera } from '../../../src/engine/BattleCamera.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { setArtTier, setForcedArtScale } from '../../../src/engine/ArtDevice.ts';

/** One frame of a 60 Hz screen, ms; the governor's persistence is time, so the tests step a clock. */
const FRAME_MS = 1000 / 60;
const PERSIST_FRAMES = Math.ceil(PERSIST_MS / FRAME_MS);

const META = { width: 673, height: 766, content: { x0: 40, x1: 640, y0: 30, y1: 740 } };

function camera(z: number, fov = 32): PerspectiveCamera {
  const c = new PerspectiveCamera(fov, 16 / 9, 0.1, 400);
  c.position.set(0, 1.4, z);
  c.lookAt(0, 1.0, 0);
  c.updateMatrixWorld(true);
  return c;
}

function plane(): Mesh {
  const m = new Mesh(new PlaneGeometry(1, 1));
  m.scale.set(1.62 * (673 / 766), 1.62, 1);
  m.position.set(0, 0.85, 0);
  m.updateMatrixWorld(true);
  return m;
}

interface Fake {
  actor: GovernedActor;
  paintings: GovernedPainting[];
  textures: Texture[];
  drawn: (i: number, on: boolean) => void;
}

/** One actor with `n` poses, each a texture holding a master of `scale`; pose 0 is drawn. */
function figure(n: number, scale = 2, mesh = plane()): Fake {
  const paintings: GovernedPainting[] = [];
  const textures: Texture[] = [];
  for (let i = 0; i < n; i++) {
    const t = new Texture();
    t.image = { width: META.width * scale, height: META.height * scale } as unknown as HTMLImageElement;
    t.userData['artScale'] = scale;
    textures.push(t);
    paintings.push({ painted: { texture: t, meta: META, url: `/art/characters/tidus/pose${i}.png`, scale }, mesh, drawn: i === 0 });
  }
  return { actor: { paintings: () => paintings }, paintings, textures, drawn: (i, on) => void (paintings[i]!.drawn = on) };
}

interface Rig {
  gov: ArtGovernor;
  loads: Array<{ url: string; scale: number }>;
  budget: ReturnType<typeof budgetFor>;
  cam: { current: PerspectiveCamera };
  pinned: { on: boolean };
  fail: Set<number>;
  clock: { t: number };
}

function rig(actors: GovernedActor[], opts: { z?: number; budgetMB?: number; cls?: 'high' | 'mid'; maxTexture?: number } = {}): Rig {
  const budget = budgetFor(opts.cls ?? 'high');
  if (opts.budgetMB !== undefined) budget.textureMB = opts.budgetMB;
  const cam = { current: camera(opts.z ?? 9) };
  const loads: Rig['loads'] = [];
  const pinned = { on: false };
  const fail = new Set<number>();
  const clock = { t: 0 };
  const gov = new ArtGovernor({
    actors: () => actors,
    camera: () => cam.current,
    bufferHeight: () => 1440,
    budget: () => budget,
    scalesFor: () => [2, 3, 4],
    load: async (url, scale) => {
      loads.push({ url, scale });
      if (fail.has(scale)) return null;
      const image: PixelSource = { width: META.width * scale, height: META.height * scale };
      return { image, scale };
    },
    pinned: () => pinned.on,
    now: () => clock.t,
    ...(opts.maxTexture ? { maxTexture: () => opts.maxTexture! } : {}),
  });
  return { gov, loads, budget, cam, pinned, fail, clock };
}

const tick = async (r: Rig, frames: number): Promise<void> => {
  for (let i = 0; i < frames; i++) {
    r.clock.t += FRAME_MS;
    r.gov.update();
    await Promise.resolve();
    await Promise.resolve();
  }
};

describe('measuring a texel on screen', () => {
  it('matches the arithmetic for a plane facing the camera', () => {
    const cam = camera(9);
    const m = plane();
    const px = pixelsPer1xTexel(m.matrixWorld, cam, 1440, META);
    // plane height 1.62 world units, camera 8.4 to 9 units away, 1440 px over 2 d tan(16 deg)
    const analytic = (1.62 * 1440) / (2 * 8.6 * Math.tan((16 * Math.PI) / 180)) / 766;
    expect(px).toBeGreaterThan(analytic * 0.93);
    expect(px).toBeLessThan(analytic * 1.07);
  });
  it('grows as the camera comes in and as the buffer grows', () => {
    const m = plane();
    const far = pixelsPer1xTexel(m.matrixWorld, camera(9), 1440, META);
    const near = pixelsPer1xTexel(m.matrixWorld, camera(3), 1440, META);
    expect(near / far).toBeGreaterThan(2.2);
    expect(pixelsPer1xTexel(m.matrixWorld, camera(9), 2160, META) / far).toBeCloseTo(1.5, 2);
  });
  it('a body lying on the floor is foreshortened, not counted at its full size', () => {
    const standing = pixelsPer1xTexel(plane().matrixWorld, camera(9), 1440, META);
    const lying = plane();
    lying.rotation.x = -Math.PI / 2;
    lying.position.set(0, 0.05, 0);
    lying.updateMatrixWorld(true);
    expect(pixelsPer1xTexel(lying.matrixWorld, camera(9), 1440, META)).toBeLessThan(standing);
  });
  it('is 0 behind the camera or inside the near plane', () => {
    const m = plane();
    m.position.set(0, 0.85, 12);
    m.updateMatrixWorld(true);
    expect(pixelsPer1xTexel(m.matrixWorld, camera(9), 1440, META)).toBe(0);
  });
});

describe('the governor', () => {
  it('leaves a painting alone while its master is enough', async () => {
    const f = figure(3);
    const r = rig([f.actor], { z: 9 });
    await tick(r, PERSIST_FRAMES + 10);
    expect(r.loads).toEqual([]);
    expect(r.gov.stats().upgrades).toBe(0);
  });

  it('waits out a bounce, then fetches the master a lasting close-up needs and swaps it in place', async () => {
    const f = figure(1);
    const r = rig([f.actor], { z: 9 });
    const tex = f.textures[0]!;
    let disposed = 0;
    tex.addEventListener('dispose', () => disposed++);
    const version = tex.version;
    r.cam.current = camera(2.2); // 4x of the approved painting is asked for here
    await tick(r, PERSIST_FRAMES - 3);
    expect(r.loads).toEqual([]); // a bounce this short is not chased
    r.cam.current = camera(9);
    await tick(r, 3);
    expect(r.loads).toEqual([]);
    r.cam.current = camera(2.2);
    await tick(r, PERSIST_FRAMES + 4);
    expect(r.loads.length).toBeGreaterThan(0);
    expect(r.loads[0]!.scale).toBeGreaterThanOrEqual(3);
    const stats = r.gov.stats();
    expect(stats.upgrades).toBe(1);
    expect(disposed).toBeGreaterThan(0); // the old GL texture goes
    expect(tex.version).toBeGreaterThan(version); // and the new pixels are uploaded on the next draw
    expect(tex.userData['artScale']).toBeGreaterThanOrEqual(3);
    expect((tex.image as unknown as PixelSource).width).toBe(META.width * (tex.userData['artScale'] as number));
    expect(f.paintings[0]!.painted.scale).toBe(tex.userData['artScale']);
  });

  it('waits the same time on a 240 Hz screen as on a 60 Hz one: persistence is time, not frames', async () => {
    const f = figure(1);
    const r = rig([f.actor], { z: 9 });
    r.cam.current = camera(2.2);
    for (let i = 0; i < 40; i++) {
      r.clock.t += 1000 / 240; // 167 ms of a 240 Hz screen: 40 frames, more than the 18 a 60 Hz screen needs
      r.gov.update();
      await Promise.resolve();
    }
    expect(r.loads).toEqual([]);
    for (let i = 0; i < 40; i++) {
      r.clock.t += 1000 / 240; // 333 ms in all
      r.gov.update();
      await Promise.resolve();
    }
    expect(r.loads.length).toBeGreaterThan(0);
  });

  it('a planned view loads at once and never waits', async () => {
    const f = figure(1);
    const r = rig([f.actor], { z: 9 });
    const wanted = r.gov.anticipate(camera(2.2));
    expect(wanted).toBe(1);
    await tick(r, 4);
    expect(r.gov.stats().upgrades).toBe(1);
  });

  it('a held shot is asked for by its size: a figure drawn 0.72 of the frame tall', async () => {
    const f = figure(1, 1); // the approved painting only
    const r = rig([f.actor], { z: 9 });
    expect(r.gov.anticipateSize([f.actor], 0.72)).toBe(1);
    await tick(r, 4);
    expect(r.loads[0]!.scale).toBe(2); // 0.72 x 1440 / 710 texels = 1.46 per texel
    expect(StageArt.scaleFor(0.72, 1440, 710, [2, 3, 4], 4)).toBe(2);
    expect(StageArt.scaleFor(0.72, 2160, 710, [2, 3, 4], 4)).toBe(3);
  });

  it('never goes above the device ceiling, and a phone stops at 2x', async () => {
    const f = figure(1);
    const r = rig([f.actor], { z: 2.2, cls: 'mid' });
    await tick(r, PERSIST_FRAMES + 6);
    expect(r.loads.every((l) => l.scale <= 2)).toBe(true);
    expect(r.gov.stats().upgrades).toBe(0); // the figure already holds 2x: nothing above it is allowed
  });

  it('never asks for a master the GPU could not hold: the cap is the largest whole scale that fits its biggest texture', async () => {
    const f = figure(1, 1); // the approved painting only: 673x766
    const r = rig([f.actor], { z: 2.2, maxTexture: 2000 }); // 2x is 1532 px tall, 3x would be 2298
    await tick(r, PERSIST_FRAMES + 8);
    expect(r.loads.length).toBeGreaterThan(0);
    expect(r.loads.every((l) => l.scale === 2)).toBe(true);
    expect(f.textures[0]!.userData['artScale']).toBe(2);
  });

  it('a master that will not load is not asked for again, and nothing breaks', async () => {
    const f = figure(1);
    const r = rig([f.actor], { z: 2.2 });
    r.fail.add(3);
    r.fail.add(4);
    await tick(r, PERSIST_FRAMES + 12);
    const n = r.loads.length;
    expect(n).toBeGreaterThan(0);
    expect(r.gov.stats().loadFailures).toBeGreaterThan(0);
    await tick(r, 40);
    expect(r.loads.length).toBe(n);
  });

  it('the siblings follow a lasting upgrade, within the budget', async () => {
    const f = figure(4);
    const r = rig([f.actor], { z: 2.2 });
    await tick(r, PERSIST_FRAMES + 40);
    const scales = f.textures.map((t) => t.userData['artScale'] as number);
    expect(scales[0]).toBeGreaterThanOrEqual(3);
    expect(scales.slice(1).every((s) => s >= 3)).toBe(true);
  });

  it('the poses that started at the approved file come up to the opening pose\'s master in the background, with nothing magnified on screen', async () => {
    const f = figure(4, 2); // pose 0 is drawn and holds the base master
    f.paintings.slice(1).forEach((p, i) => {
      const t = f.textures[i + 1]!;
      t.image = { width: META.width, height: META.height } as unknown as HTMLImageElement;
      t.userData['artScale'] = 1;
      p.painted.scale = 1;
    });
    const r = rig([f.actor], { z: 9 }); // the standard camera: no texel is magnified past a pixel, so no live need
    await tick(r, 60);
    expect(f.textures.map((t) => t.userData['artScale'])).toEqual([2, 2, 2, 2]);
    expect(r.loads.map((l) => l.scale)).toEqual([2, 2, 2]);
    expect(r.gov.stats().trace.every((t) => t.why === 'sibling')).toBe(true);
    expect(r.gov.stats().downgrades).toBe(0);
  });

  it('a sibling never evicts anything, and never takes more than the budget has room for', async () => {
    const f = figure(4);
    const r = rig([f.actor], { z: 2.2, budgetMB: 70 }); // a 3x master of this painting is 25 MB with its mips
    await tick(r, PERSIST_FRAMES + 40);
    const scales = f.textures.map((t) => t.userData['artScale'] as number);
    expect(scales[0]).toBeGreaterThanOrEqual(3); // the painting on screen gets its master
    expect(scales.slice(1).filter((s) => s >= 3).length).toBe(1); // one sibling fit; the other two did not
    expect(scales.slice(1).filter((s) => s === 2).length).toBe(2);
    expect(r.gov.stats().downgrades).toBe(0);
  });

  it('over the budget, masters off screen go back to where they started, and the one on screen stays', async () => {
    const a = figure(1);
    const b = figure(1);
    const r = rig([a.actor, b.actor], { z: 2.2, budgetMB: 40 });
    await tick(r, PERSIST_FRAMES + 12);
    expect(a.textures[0]!.userData['artScale']).toBeGreaterThanOrEqual(3);
    // a leaves the screen; b is the one drawn from now on
    a.drawn(0, false);
    b.drawn(0, true);
    await tick(r, 200);
    expect(r.gov.stats().downgrades).toBeGreaterThan(0);
    expect(a.textures[0]!.userData['artScale']).toBe(2);
    expect((a.textures[0]!.image as unknown as PixelSource).width).toBe(META.width * 2);
    expect(b.textures[0]!.userData['artScale']).toBeGreaterThanOrEqual(3);
  });

  it('stands down while a scale is pinned', async () => {
    const f = figure(1);
    const r = rig([f.actor], { z: 2.2 });
    r.pinned.on = true;
    await tick(r, PERSIST_FRAMES + 10);
    expect(r.loads).toEqual([]);
    expect(r.gov.anticipate(camera(2.2))).toBe(0);
  });

  it('forgets a painting whose actor has gone', async () => {
    const f = figure(2);
    const list: GovernedActor[] = [f.actor];
    const r = rig(list, { z: 9 });
    await tick(r, 3);
    expect(r.gov.stats().entries.length).toBe(2);
    list.length = 0;
    await tick(r, 2);
    expect(r.gov.stats().entries.length).toBe(0);
  });

  it('reports what each rig would magnify, asking for nothing', () => {
    const f = figure(1);
    const r = rig([f.actor], { z: 9 });
    const out = r.gov.measureFrom(camera(3));
    expect(out).toHaveLength(1);
    expect(out[0]!.px1x).toBeGreaterThan(1);
    expect(out[0]!.mag).toBeCloseTo(out[0]!.px1x / out[0]!.scale, 2);
    expect(r.loads).toEqual([]);
  });
});

describe('plane helper sanity', () => {
  it('Object3D world matrices compose as the governor expects', () => {
    const parent = new Object3D();
    parent.scale.setScalar(2);
    const m = plane();
    parent.add(m);
    parent.updateMatrixWorld(true);
    const one = pixelsPer1xTexel(plane().matrixWorld, camera(9), 1440, META);
    const two = pixelsPer1xTexel(m.matrixWorld, camera(9), 1440, META);
    expect(two).toBeGreaterThan(one * 1.5);
  });
});

describe('StageArt: the plan ahead', () => {
  const manifest = () =>
    setArtManifest(parseArtManifest({ version: 1, subjects: { tidus: { states: ['pose0', 'pose1', 'pose2'], portrait: false, tiers: { pose0: [2, 3, 4], pose1: [2, 3, 4], pose2: [2, 3, 4] } } } }));
  const stage = (actors: GovernedActor[]) => {
    const main = camera(9);
    const bc = new BattleCamera(main, { rigs: { idle: { position: [0, 1.4, 9], lookAt: [0, 1, 0], fov: 32 }, close: { position: [0, 1.4, 2.2], lookAt: [0, 1, 0], fov: 32 } }, initial: 'idle' });
    return new StageArt({ actors: () => actors, party: () => actors, camera: main, canvas: { height: 1440 }, battleCamera: bc, game: 'ffx' });
  };
  const after = () => {
    resetArtManifest();
    setArtTier(null);
    setForcedArtScale(undefined);
  };

  it('waits for the figures, then runs 30 frames after they stand, and asks for what a rig at rest would need', () => {
    manifest();
    setArtTier('high');
    const list: GovernedActor[] = [];
    const art = stage(list);
    for (let i = 0; i < 40; i++) art.update(); // nobody on the field: nothing to plan
    expect(art.governor.stats().trace).toEqual([]);
    const f = figure(1, 1);
    list.push(f.actor);
    for (let i = 0; i < 25; i++) art.update();
    expect(art.governor.stats().trace).toEqual([]); // the signature settles, the 30 frames have not passed
    for (let i = 0; i < 25; i++) art.update();
    const trace = art.governor.stats().trace;
    expect(trace.some((t) => t.why === 'anticipated' || t.why === 'size')).toBe(true);
    expect(trace.every((t) => t.want >= 2)).toBe(true);
    art.dispose();
    after();
  });

  it('plans again when who is on the field changes', () => {
    manifest();
    setArtTier('high');
    const a = figure(1, 1);
    const list: GovernedActor[] = [a.actor];
    const art = stage(list);
    for (let i = 0; i < 60; i++) art.update();
    const first = art.governor.stats().trace.length;
    expect(first).toBeGreaterThan(0);
    const b = figure(2, 1, plane());
    list.push(b.actor); // an arrival
    for (let i = 0; i < 60; i++) art.update();
    expect(art.governor.stats().trace.length).toBeGreaterThan(first);
    art.dispose();
    after();
  });

  it('measures the colossus master once the figures are up, wherever the order fell', () => {
    manifest();
    setArtTier('high');
    const f = figure(1, 1);
    const art = stage([f.actor]);
    anticipateView({ pos: camera(2.2).position, look: camera(2.2).position.clone().setZ(0), fov: 32 } as never);
    for (let i = 0; i < 60; i++) art.update();
    expect(art.governor.stats().trace.length).toBeGreaterThan(0);
    art.dispose();
    after();
  });

  it('a stage that is gone no longer takes a master view', () => {
    const art = stage([]);
    art.dispose();
    expect(() => anticipateView({ pos: camera(2.2).position, look: camera(2.2).position.clone().setZ(0), fov: 32 } as never)).not.toThrow();
  });
});
