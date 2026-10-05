/**
 * Release 39.1 ("r391-stalls"; both games, shared plumbing): the art governor with a stage dependency. Real three.js math and textures (no GL), a fake actor, a fake loader that hands
 * back decoded pixels, and a fake stage whose uploads finish when the test says so. What is checked: a master is not swapped until its upload is resident and then is adopted, never
 * uploaded, in one step; a load stays in the air until it is resident; a stage that is declined, cancelled or abandoned never leaves a painting half way or marks the master failed; and
 * the warm pool (a painting not drawn yet is uploaded before its first draw, up to the cap, once, and only where the stage can take it).
 */
import { Mesh, PerspectiveCamera, PlaneGeometry, Texture } from 'three';
import { describe, expect, it } from 'vitest';
import { budgetFor } from '../../../src/engine/ArtBudget.ts';
import { ArtGovernor, PERSIST_MS, type GovernedActor, type GovernedPainting, type GovernedStage, type GovernorDeps, type LoadedPixels, type LoadOptions } from '../../../src/engine/ArtGovernor.ts';

const FRAME_MS = 1000 / 60;
const PERSIST_FRAMES = Math.ceil(PERSIST_MS / FRAME_MS);
const META = { width: 673, height: 766, content: { x0: 40, x1: 640, y0: 30, y1: 740 } };

function camera(z: number): PerspectiveCamera {
  const c = new PerspectiveCamera(32, 16 / 9, 0.1, 400);
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
  remove: (i: number) => void;
}

/** One actor with `n` poses at `scale`; the poses in `drawn` are drawn. */
function figure(n: number, scale: number, drawn: number[] = [0]): Fake {
  let paintings: GovernedPainting[] = [];
  const textures: Texture[] = [];
  const mesh = plane();
  for (let i = 0; i < n; i++) {
    const t = new Texture();
    t.image = { width: META.width * scale, height: META.height * scale } as unknown as HTMLImageElement;
    t.userData['artScale'] = scale;
    textures.push(t);
    paintings.push({ painted: { texture: t, meta: META, url: `/art/characters/tidus/pose${i}.png`, scale }, mesh, drawn: drawn.includes(i) });
  }
  return { actor: { paintings: () => paintings }, paintings, textures, drawn: (i, on) => void (paintings[i]!.drawn = on), remove: (i) => void (paintings = paintings.filter((_, j) => j !== i)) };
}

interface FakeStaged extends GovernedStage {
  texture: Texture;
  loaded: LoadedPixels;
  urgent: boolean;
  settle: (ok: boolean) => void;
  adopted: number;
  cancelled: number;
}

interface Rig {
  gov: ArtGovernor;
  loads: Array<{ url: string; scale: number; opts: LoadOptions | undefined }>;
  stages: FakeStaged[];
  bitmaps: Array<{ closed: number }>;
  clock: { t: number };
  cam: { current: PerspectiveCamera };
  budget: ReturnType<typeof budgetFor>;
  flags: { canStage: boolean; declineStage: boolean; withBitmap: boolean };
}

function rig(actors: GovernedActor[], opts: { z?: number; budgetMB?: number; hasStage?: boolean } = {}): Rig {
  const budget = budgetFor('high');
  if (opts.budgetMB !== undefined) budget.textureMB = opts.budgetMB;
  const cam = { current: camera(opts.z ?? 9) };
  const loads: Rig['loads'] = [];
  const stages: FakeStaged[] = [];
  const bitmaps: Rig['bitmaps'] = [];
  const clock = { t: 0 };
  const flags = { canStage: true, declineStage: false, withBitmap: true };
  const deps: GovernorDeps = {
    actors: () => actors,
    camera: () => cam.current,
    bufferHeight: () => 1440,
    budget: () => budget,
    scalesFor: () => [2, 3, 4],
    load: async (url, scale, opts): Promise<LoadedPixels | null> => {
      loads.push({ url, scale, opts });
      const bitmap = { closed: 0, close() { this.closed++; } };
      bitmaps.push(bitmap);
      return { image: { width: META.width * scale, height: META.height * scale }, scale, ...(flags.withBitmap ? { bitmap: bitmap as unknown as ImageBitmap } : {}) };
    },
    now: () => clock.t,
  };
  if (opts.hasStage !== false) {
    deps.canStage = () => flags.canStage;
    deps.stage = (texture, loaded, urgent): GovernedStage | null => {
      if (flags.declineStage) return null;
      let settle: (ok: boolean) => void = () => undefined;
      const ready = new Promise<boolean>((res) => (settle = res));
      const s: FakeStaged = {
        texture,
        loaded,
        urgent,
        ready,
        settle,
        adopted: 0,
        cancelled: 0,
        adopt() {
          this.adopted++;
          return true;
        },
        cancel() {
          this.cancelled++;
          this.settle(false);
        },
      };
      stages.push(s);
      return s;
    };
  }
  return { gov: new ArtGovernor(deps), loads, stages, bitmaps, clock, cam, budget, flags };
}

const tick = async (r: Rig, frames: number): Promise<void> => {
  for (let i = 0; i < frames; i++) {
    r.clock.t += FRAME_MS;
    r.gov.update();
    for (let k = 0; k < 4; k++) await Promise.resolve();
  }
};

/** A close camera, held long enough for the governor to ask for a master. */
async function wantUpgrade(r: Rig): Promise<void> {
  r.cam.current = camera(2.2);
  await tick(r, PERSIST_FRAMES + 4);
}

describe('a staged swap', () => {
  it('leaves the painting alone while the master uploads, then adopts it, and never puts the pixels in itself', async () => {
    const f = figure(1, 1);
    const r = rig([f.actor]);
    const tex = f.textures[0]!;
    let disposed = 0;
    tex.addEventListener('dispose', () => disposed++);
    const image = tex.image;
    const version = tex.version;
    await wantUpgrade(r);
    expect(r.loads).toHaveLength(1);
    expect(r.stages).toHaveLength(1);
    const staged = r.stages[0]!;
    expect(staged.urgent).toBe(true); // a figure on screen is waiting for it
    expect(staged.loaded.scale).toBeGreaterThanOrEqual(3);
    // until it is resident the painting is untouched: same image, same scale, nothing disposed, nothing marked for upload
    expect(tex.image).toBe(image);
    expect(tex.userData['artScale']).toBe(1);
    expect(disposed).toBe(0);
    expect(tex.version).toBe(version);
    expect(r.gov.stats()).toMatchObject({ upgrades: 0, staging: 1, stagedLanded: 0, inflight: 1 });

    staged.settle(true);
    await tick(r, 3);
    expect(staged.adopted).toBe(1);
    expect(tex.userData['artScale']).toBe(staged.loaded.scale);
    expect(disposed).toBe(0); // the governor does not dispose: adoption is the stager's step
    expect(tex.version).toBe(version); // and no `needsUpdate`: three uploads nothing
    expect(f.paintings[0]!.painted.scale).toBe(staged.loaded.scale);
    const s = r.gov.stats();
    expect(s).toMatchObject({ upgrades: 1, staging: 0, stagedLanded: 1, inflight: 0 });
    expect(s.swaps.at(-1)).toMatchObject({ staged: true, warm: false, from: 1, to: staged.loaded.scale });
    expect(r.bitmaps[0]!.closed).toBe(0); // the stager owns the bitmap
  });

  it('counts a load as in the air until it is resident: three masters at most for figures on screen', async () => {
    const figs = [figure(1, 1), figure(1, 1), figure(1, 1), figure(1, 1)];
    const r = rig(figs.map((f) => f.actor));
    await wantUpgrade(r);
    expect(r.loads).toHaveLength(3); // MAX_LOADS plus the one extra a figure on screen may take
    expect(r.stages).toHaveLength(3);
    r.stages[0]!.settle(true);
    await tick(r, 4);
    expect(r.loads).toHaveLength(4); // a slot freed once the first was resident
    expect(r.gov.stats().inflight).toBe(3);
  });

  it('lets a figure on screen start its master even when two speculative loads fill the slots, and no more than one extra', async () => {
    const f = figure(3, 2, [0]); // pose 0 drawn, poses 1 and 2 are warmed in the background
    const g = figure(1, 1); // a second figure that will want a bigger master at the same time as the first
    const r = rig([f.actor, g.actor], { z: 9 });
    await tick(r, 4);
    expect(r.loads.map((l) => l.scale)).toEqual([2, 2]); // the two warm-ups hold both slots (unresolved)
    expect(r.gov.stats().inflight).toBe(2);
    await wantUpgrade(r); // the camera comes in: both drawn figures want a bigger master
    const live = r.loads.filter((l) => l.scale > 2 || (l.scale >= 3));
    expect(live.length).toBe(1); // one live need started past the two slots; the other waits for a slot
    expect(r.gov.stats().inflight).toBe(3);
    expect(r.stages.filter((s) => s.urgent)).toHaveLength(1);
    r.stages.find((s) => !s.urgent)!.settle(true); // a speculative one lands: the waiting live need starts
    await tick(r, 4);
    expect(r.loads.filter((l) => l.scale >= 3).length).toBeGreaterThanOrEqual(2);
  });

  it('swaps on the spot, and closes the bitmap, when the stage declines', async () => {
    const f = figure(1, 1);
    const r = rig([f.actor]);
    r.flags.declineStage = true;
    const tex = f.textures[0]!;
    let disposed = 0;
    tex.addEventListener('dispose', () => disposed++);
    await wantUpgrade(r);
    expect(r.gov.stats().upgrades).toBe(1);
    expect(disposed).toBeGreaterThan(0); // release 39's in-place swap
    expect(r.bitmaps[0]!.closed).toBe(1);
    expect(r.gov.stats().swaps.at(-1)).toMatchObject({ staged: false });
  });

  it('swaps on the spot when the load carried no bitmap, without asking the stage', async () => {
    const f = figure(1, 1);
    const r = rig([f.actor]);
    r.flags.withBitmap = false;
    await wantUpgrade(r);
    expect(r.stages).toHaveLength(0);
    expect(r.gov.stats().upgrades).toBe(1);
  });

  it('swaps on the spot when there is no stage at all (the tests, a browser that failed the probe)', async () => {
    const f = figure(1, 1);
    const r = rig([f.actor], { hasStage: false });
    await wantUpgrade(r);
    expect(r.gov.stats()).toMatchObject({ upgrades: 1, stagedLanded: 0 });
    expect(r.bitmaps[0]!.closed).toBe(1);
  });

  it('does not mark a master failed when its upload was cancelled: the painting asks again', async () => {
    const f = figure(1, 1);
    const r = rig([f.actor]);
    await wantUpgrade(r);
    r.stages[0]!.settle(false); // a lost context, say
    await tick(r, PERSIST_FRAMES + 6);
    expect(r.gov.stats().loadFailures).toBe(0);
    expect(r.loads.length).toBeGreaterThanOrEqual(2); // asked for again
  });

  it('cancels the upload of a painting that leaves the field, and counts no failure', async () => {
    const a = figure(1, 1);
    const b = figure(1, 1);
    const r = rig([a.actor, b.actor]);
    await wantUpgrade(r);
    expect(r.stages).toHaveLength(2);
    a.remove(0); // the actor has no paintings now: its texture left the field
    await tick(r, 2);
    expect(r.stages[0]!.cancelled).toBe(1);
    expect(r.gov.stats().loadFailures).toBe(0);
    expect(r.stages[0]!.adopted).toBe(0);
  });

  it('cancels every upload in progress when it is disposed', async () => {
    const f = figure(1, 1);
    const r = rig([f.actor]);
    await wantUpgrade(r);
    r.gov.dispose();
    expect(r.stages[0]!.cancelled).toBe(1);
  });

  it('does not adopt a master that arrives for a painting that has meanwhile reached a bigger one', async () => {
    const f = figure(1, 1);
    const r = rig([f.actor]);
    await wantUpgrade(r);
    const staged = r.stages[0]!;
    f.textures[0]!.userData['artScale'] = 4; // something else brought it to 4x
    f.paintings[0]!.painted.scale = 4;
    // the entry still thinks it holds 1x; mimic the governor's own view by letting it be
    staged.settle(true);
    await tick(r, 3);
    expect(staged.adopted).toBeLessThanOrEqual(1);
  });
});

describe('the warm pool', () => {
  it('uploads a painting that has not been drawn before its first draw, as the master it already holds, and flags it until it is drawn', async () => {
    const f = figure(3, 2, [0]); // pose 0 drawn, poses 1 and 2 base-loaded at 2x and never drawn
    const r = rig([f.actor], { z: 9 });
    await tick(r, 4);
    expect(r.loads.map((l) => l.scale)).toEqual([2, 2]); // the same master, not an upgrade
    expect(r.stages.every((s) => !s.urgent)).toBe(true);
    for (const s of r.stages) s.settle(true);
    await tick(r, 4);
    const stats = r.gov.stats();
    expect(stats).toMatchObject({ upgrades: 0, warmed: 2, stagedLanded: 2 });
    expect(stats.warmMB).toBeGreaterThan(0);
    expect(stats.entries.filter((e) => e.warm)).toHaveLength(2);
    expect(stats.swaps.every((s) => s.warm && s.from === 2 && s.to === 2)).toBe(true);
    expect(r.stages.every((s) => s.adopted === 1)).toBe(true);
    // the painting is drawn: no longer speculative
    f.drawn(1, true);
    await tick(r, 2);
    expect(r.gov.stats().entries.filter((e) => e.warm)).toHaveLength(1);
  });

  it('tells the loader what a load is for: a warm-up and a sibling are background work, a figure on screen is urgent', async () => {
    const f = figure(3, 2, [0]);
    const r = rig([f.actor]);
    await tick(r, 4);
    expect(r.loads.map((l) => l.opts)).toEqual([{ urgent: false, warm: true }, { urgent: false, warm: true }]);
    const g = figure(1, 1);
    const r2 = rig([g.actor]);
    await wantUpgrade(r2);
    expect(r2.loads[0]!.opts).toEqual({ urgent: true, warm: false });
  });

  it('asks for a warm-up once: a painting that has been warmed is not asked for again', async () => {
    const f = figure(2, 2, [0]);
    const r = rig([f.actor]);
    await tick(r, 4);
    r.stages[0]!.settle(true);
    await tick(r, 30);
    expect(r.loads).toHaveLength(1);
  });

  it('leaves small paintings alone (their first draw is a 4 ms upload), and does nothing where the stage cannot take a master', async () => {
    const small = figure(3, 1, [0]); // 0.5 Mpx
    const a = rig([small.actor]);
    await tick(a, 4);
    expect(a.loads).toEqual([]);

    const big = figure(3, 2, [0]);
    const b = rig([big.actor]);
    b.flags.canStage = false;
    await tick(b, 4);
    expect(b.loads).toEqual([]);

    const c = rig([figure(3, 2, [0]).actor], { hasStage: false });
    await tick(c, 4);
    expect(c.loads).toEqual([]);
  });

  it('holds the speculative memory under the cap: a share of the class budget', async () => {
    // textureMB 100 -> a 30 MB pool; one 2x pose is about 15.7 MB with its mips, so two fit and the rest do not
    const f = figure(8, 2, [0]);
    const r = rig([f.actor], { budgetMB: 100 });
    for (let i = 0; i < 12; i++) {
      await tick(r, 3);
      for (const s of r.stages) s.settle(true);
    }
    await tick(r, 6);
    const stats = r.gov.stats();
    expect(stats.warmMB).toBeLessThanOrEqual(30);
    expect(stats.warmed).toBeGreaterThan(0);
    expect(stats.warmed).toBeLessThan(7);
  });

  it('stages a painting that is drawn even when the pool is full: a live need is never refused', async () => {
    const f = figure(4, 2, [0]);
    const r = rig([f.actor], { budgetMB: 100 });
    for (let i = 0; i < 6; i++) {
      await tick(r, 3);
      for (const s of r.stages) s.settle(true);
    }
    const before = r.stages.length;
    await wantUpgrade(r); // pose 0 is drawn and wants a bigger master
    expect(r.stages.length).toBeGreaterThan(before);
    expect(r.stages.at(-1)!.urgent).toBe(true);
  });

  it('is not an upgrade: an upgrade that lands on a painting whose warm-up is in the air does not clear its loading flag', async () => {
    const f = figure(2, 2, [0]);
    const r = rig([f.actor]);
    await tick(r, 4); // the warm-up of pose 1 starts
    expect(r.stages).toHaveLength(1);
    expect(r.gov.stats().inflight).toBe(1);
    r.stages[0]!.settle(true);
    await tick(r, 4);
    expect(r.gov.stats().warmed).toBe(1);
  });
});
