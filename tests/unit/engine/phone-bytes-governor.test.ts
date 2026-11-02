/**
 * Release 73, lane "r73-bytes" (BOTH games, shared plumbing; `docs/handoff/r73-bytes.md`): no on-demand master is fetched while the phone's entry holds the line. Release 70's phone10 run, Chapter I: the
 * governor asked for Kimahri's idle at 2x (2.4 MB, 0.9 MB of it inside the entry) 2.2 s after the screen began to enter, because the figure was drawn under the load card and measured as magnified; nobody sees
 * it there, and the entry waited for the line. Real three.js math and textures (no GL), a fake actor, a fake loader and a fake stage.
 *
 * Proved: a persistent need is not started while the line is held, and is started as soon as it opens; a planned view (`anticipate`) and a held shot's size (`anticipateSize`) wait the same way; the warm-ups of
 * paintings not drawn yet (pixels already here, an upload) go on; `?phonebytes=off` and no hold are release 70.
 */
import { Mesh, PerspectiveCamera, PlaneGeometry, Texture } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { budgetFor } from '../../../src/engine/ArtBudget.ts';
import { ArtGovernor, PERSIST_MS, type GovernedActor, type GovernedPainting, type GovernedStage, type GovernorDeps, type LoadedPixels, type LoadOptions } from '../../../src/engine/ArtGovernor.ts';
import { bytesBooks, holdBackground, releaseBackground, resetHoldForTests, setForegroundFirst } from '../../../src/engine/LoadHold.ts';

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

/** One actor with `n` poses at `scale`; the poses in `drawn` are drawn. */
function figure(n: number, scale: number, drawn: number[] = [0]): GovernedActor {
  const paintings: GovernedPainting[] = [];
  const mesh = plane();
  for (let i = 0; i < n; i++) {
    const t = new Texture();
    t.image = { width: META.width * scale, height: META.height * scale } as unknown as HTMLImageElement;
    t.userData['artScale'] = scale;
    paintings.push({ painted: { texture: t, meta: META, url: `/art/characters/kimahri/pose${i}.png`, scale }, mesh, drawn: drawn.includes(i) });
  }
  return { paintings: () => paintings };
}

interface Rig {
  gov: ArtGovernor;
  loads: Array<{ url: string; scale: number; opts: LoadOptions | undefined }>;
  clock: { t: number };
  cam: { current: PerspectiveCamera };
}

function rig(actors: GovernedActor[], z = 9, onLoad?: (n: number) => void): Rig {
  const budget = budgetFor('phone');
  const cam = { current: camera(z) };
  const loads: Rig['loads'] = [];
  const clock = { t: 0 };
  const deps: GovernorDeps = {
    actors: () => actors,
    camera: () => cam.current,
    bufferHeight: () => 1440,
    budget: () => budget,
    scalesFor: () => [2],
    load: async (url, scale, opts): Promise<LoadedPixels | null> => {
      loads.push({ url, scale, opts });
      onLoad?.(loads.length);
      return { image: { width: META.width * scale, height: META.height * scale }, scale };
    },
    now: () => clock.t,
    canStage: () => true,
    stage: (texture, loaded): GovernedStage | null => {
      void texture;
      void loaded;
      return { ready: new Promise<boolean>(() => undefined), adopt: () => true, cancel: () => undefined } as unknown as GovernedStage;
    },
  };
  return { gov: new ArtGovernor(deps), loads, clock, cam };
}

const tick = async (r: Rig, frames: number): Promise<void> => {
  for (let i = 0; i < frames; i++) {
    r.clock.t += FRAME_MS;
    r.gov.update();
    for (let k = 0; k < 4; k++) await Promise.resolve();
  }
};

beforeEach(() => resetHoldForTests());
afterEach(() => {
  resetHoldForTests();
  vi.unstubAllGlobals();
});

describe('the governor while the phone\'s entry holds the line', () => {
  it('not held: a lasting close-up fetches its master after the persistence, as before', async () => {
    const r = rig([figure(1, 1)]);
    r.cam.current = camera(2.2);
    await tick(r, PERSIST_FRAMES + 6);
    expect(r.loads.length).toBeGreaterThan(0);
    expect(r.loads[0]!.opts).toMatchObject({ urgent: true });
    expect(bytesBooks().governorNeeds).toBe(0);
  });

  it('held: the same close-up fetches nothing, however long it lasts, and the books count the needs set aside', async () => {
    setForegroundFirst(true);
    holdBackground();
    const r = rig([figure(1, 1)]);
    r.cam.current = camera(2.2);
    await tick(r, 3 * PERSIST_FRAMES);
    expect(r.loads).toEqual([]);
    expect(bytesBooks().governorNeeds).toBeGreaterThan(0);
  });

  it('held, then opened: the need that lasted is started on the next frame', async () => {
    setForegroundFirst(true);
    holdBackground();
    const r = rig([figure(1, 1)]);
    r.cam.current = camera(2.2);
    await tick(r, 2 * PERSIST_FRAMES);
    expect(r.loads).toEqual([]);
    releaseBackground();
    await tick(r, 2);
    expect(r.loads.length).toBeGreaterThan(0);
    expect(r.loads[0]!.scale).toBe(2);
  });

  it('a planned view and a held shot\'s size wait for the hold too', async () => {
    setForegroundFirst(true);
    holdBackground();
    const r = rig([figure(1, 1)]);
    expect(r.gov.anticipate(camera(2.2))).toBe(1); // it still says what it wants
    expect(r.gov.anticipateSize([figure(1, 1)], 0.72)).toBeGreaterThanOrEqual(0);
    await tick(r, 4);
    expect(r.loads).toEqual([]);
  });

  it('held, the sibling poses of a magnified figure wait too (their masters are bytes of the line as well); opened, they follow (review of r73-bytes, minor 1)', async () => {
    setForegroundFirst(true);
    const r = rig([figure(2, 1, [0])], 9, (n) => {
      if (n === 1) holdBackground(); // the hold begins as the first master is asked for: the drawn pose's upgrade is out, its sibling's has not been asked yet
    });
    r.cam.current = camera(2.2);
    await tick(r, PERSIST_FRAMES + 12);
    expect(r.loads.map((l) => l.url)).toEqual(['/art/characters/kimahri/pose0.png']);
    expect(bytesBooks().governorNeeds).toBeGreaterThan(0);
    releaseBackground();
    await tick(r, 6);
    expect(r.loads.map((l) => l.url)).toContain('/art/characters/kimahri/pose1.png');
  });

  it('?phonebytes=off holds the line but not the governor: release 70\'s behaviour', async () => {
    vi.stubGlobal('location', { search: '?phonebytes=off' });
    setForegroundFirst(true);
    holdBackground();
    const r = rig([figure(1, 1)]);
    r.cam.current = camera(2.2);
    await tick(r, PERSIST_FRAMES + 6);
    expect(r.loads.length).toBeGreaterThan(0);
  });

  it('the warm-ups of paintings not drawn yet go on (they upload pixels already here; they are not bytes of the line)', async () => {
    setForegroundFirst(true);
    holdBackground();
    const r = rig([figure(3, 2, [0])]); // pose 0 drawn, poses 1 and 2 warmed in the background
    await tick(r, 6);
    expect(r.loads.length).toBeGreaterThan(0);
    expect(r.loads.every((l) => l.opts?.warm === true)).toBe(true);
  });
});
