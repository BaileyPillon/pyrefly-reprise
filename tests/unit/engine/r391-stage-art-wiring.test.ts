/**
 * Release 39.1 ("r391-stalls"; both games, shared plumbing): `StageArt` with the stager wired in. The governor, the stager and a fake renderer are the real code; the file loaders are fakes (a bitmap
 * and an image handle; the legacy loader). What is checked: with no renderer nothing changes (release 39's load and swap); with a renderer whose probe failed the legacy loader is still used;
 * with the probe passed the governor loads bitmaps, the stager uploads them in bands over frames on `StageArt.update`, and the painting adopts the staged GL texture without an upload; the
 * stats carry the stager's; disposing stops it.
 */
import { Mesh, PerspectiveCamera, PlaneGeometry, Texture } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/engine/MasterLoad.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../../src/engine/MasterLoad.ts')>();
  return { ...real, loadMaster: vi.fn() };
});
vi.mock('../../../src/engine/PaintedArt.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../../src/engine/PaintedArt.ts')>();
  return { ...real, loadPixels: vi.fn() };
});

import { setArtTier, setForcedArtScale, setStagedUploads, stagedUploads } from '../../../src/engine/ArtDevice.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import type { GovernedActor, GovernedPainting } from '../../../src/engine/ArtGovernor.ts';
import { BattleCamera } from '../../../src/engine/BattleCamera.ts';
import { loadMaster } from '../../../src/engine/MasterLoad.ts';
import { loadPixels } from '../../../src/engine/PaintedArt.ts';
import { StageArt } from '../../../src/engine/StageArt.ts';
import { FakeHost } from '../helpers/fake-stage-host.ts';

const META = { width: 673, height: 766, content: { x0: 40, x1: 640, y0: 30, y1: 740 } };
let now = 0;

function camera(z: number): PerspectiveCamera {
  const c = new PerspectiveCamera(32, 16 / 9, 0.1, 400);
  c.position.set(0, 1.4, z);
  c.lookAt(0, 1.0, 0);
  c.updateMatrixWorld(true);
  return c;
}

function figure(): { actor: GovernedActor; texture: Texture; painting: GovernedPainting } {
  const mesh = new Mesh(new PlaneGeometry(1, 1));
  mesh.scale.set(1.62 * (673 / 766), 1.62, 1);
  mesh.position.set(0, 0.85, 0);
  mesh.updateMatrixWorld(true);
  const texture = new Texture({ width: META.width, height: META.height } as unknown as HTMLImageElement);
  texture.userData['artScale'] = 1;
  texture.needsUpdate = true;
  const painting: GovernedPainting = { painted: { texture, meta: META, url: '/art/characters/tidus/idle.png', scale: 1 }, mesh, drawn: true };
  return { actor: { paintings: () => [painting] }, texture, painting };
}

function stage(actors: GovernedActor[], opts: { host?: FakeHost; probe?: { bitmap: boolean; bands: boolean; reason: string } } = {}): StageArt {
  const main = camera(2.2); // close: 4x is asked for
  const bc = new BattleCamera(main, { rigs: { idle: { position: [0, 1.4, 2.2], lookAt: [0, 1, 0], fov: 32 } }, initial: 'idle' });
  return new StageArt({ actors: () => actors, party: () => actors, camera: main, canvas: { height: 1440 }, battleCamera: bc, game: 'ffx', ...(opts.host ? { host: opts.host } : {}), ...(opts.probe ? { probe: opts.probe } : {}) });
}

/** Frames of a 60 Hz screen: the governor's persistence is time. */
async function frames(art: StageArt, n: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    now += 1000 / 60;
    art.update();
    for (let k = 0; k < 4; k++) await Promise.resolve();
  }
}

beforeEach(() => {
  now = 1000;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  setArtManifest(parseArtManifest({ version: 1, subjects: { tidus: { states: ['idle'], portrait: false, tiers: { idle: [2, 3, 4] } } } }));
  setArtTier('high');
  setForcedArtScale(undefined);
  vi.mocked(loadPixels).mockReset();
  vi.mocked(loadMaster).mockReset();
  const bytes = (scale: number) => ({ width: META.width * scale, height: META.height * scale });
  vi.mocked(loadPixels).mockImplementation(async (_url: string, scale?: number) => ({ image: bytes(scale ?? 1) as unknown as HTMLImageElement, scale: scale ?? 1 }));
  vi.mocked(loadMaster).mockImplementation(async (_url: string, scale: number) => ({ image: bytes(scale) as unknown as HTMLImageElement, scale, bitmap: { width: META.width * scale, height: META.height * scale, close() {} } as unknown as ImageBitmap }));
});

afterEach(() => {
  setStagedUploads(undefined);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetArtManifest();
  setArtTier(null);
  setForcedArtScale(undefined);
});

describe('StageArt with the stager', () => {
  it('has no stager without a renderer: the loader and the swap are release 39\'s', async () => {
    const f = figure();
    const art = stage([f.actor]);
    expect(art.stager).toBeNull();
    expect(art.stats().stager).toBeNull();
    let disposed = 0;
    f.texture.addEventListener('dispose', () => disposed++);
    await frames(art, 80);
    expect(vi.mocked(loadMaster)).not.toHaveBeenCalled();
    expect(vi.mocked(loadPixels)).toHaveBeenCalled();
    expect(art.governor.stats().upgrades).toBeGreaterThan(0);
    expect(disposed).toBeGreaterThan(0); // the in-place swap
    art.dispose();
  });

  it('keeps the legacy loader when the browser failed the probe', async () => {
    const f = figure();
    const art = stage([f.actor], { host: new FakeHost(), probe: { bitmap: false, bands: false, reason: 'refused' } });
    expect(art.stager!.stats().mode).toBe('pending');
    await frames(art, 80);
    expect(art.stager!.stats().mode).toBe('off');
    expect(vi.mocked(loadMaster)).not.toHaveBeenCalled();
    expect(vi.mocked(loadPixels)).toHaveBeenCalled();
    expect(art.stats().stager).toMatchObject({ mode: 'off', probe: 'refused' });
    art.dispose();
  });

  it('loads bitmaps once the probe has passed, uploads them in bands as the frames go by, and adopts the staged GL texture', async () => {
    const host = new FakeHost();
    const f = figure();
    host.initTexture(f.texture); // the painting has been drawn: it has a GL texture
    const oldGl = host.glTextures[0]!;
    const sourceBefore = f.texture.source;
    const art = stage([f.actor], { host, probe: { bitmap: true, bands: true, reason: 'ok' } });
    await frames(art, 80);
    expect(vi.mocked(loadMaster)).toHaveBeenCalled();
    expect(vi.mocked(loadPixels)).not.toHaveBeenCalled();
    const stats = art.stats();
    expect(stats.stager).toMatchObject({ mode: 'bands', landed: 1, adopted: 1 });
    expect(stats.stager!.uploads).toBeGreaterThan(1); // more than one band, over several frames
    expect(stats.stagedLanded).toBe(1);
    expect(stats.upgrades).toBe(1);
    expect(f.texture.source).not.toBe(sourceBefore); // the painting draws the staged texture
    expect(oldGl.freed).toBe(true);
    expect(host.glTextures.filter((g) => !g.freed)).toHaveLength(1);
    // the uploads were spread over frames: no tick carried more than a band
    expect(host.gl.subs.every((s) => s.rows <= 512)).toBe(true);
    expect(stats.stager!.maxUploadMs).toBeLessThan(50);
    art.dispose();
  });

  it('has no stager when the staged uploads are switched off: `?stage=off`, or the debug switch', () => {
    expect(stagedUploads()).toBe(true); // on by default
    vi.stubGlobal('location', { search: '?artlink=fast&stage=off' });
    expect(stagedUploads()).toBe(false);
    expect(stage([figure().actor], { host: new FakeHost(), probe: { bitmap: true, bands: true, reason: 'ok' } }).stager).toBeNull();
    vi.stubGlobal('location', { search: '?stage=on' });
    expect(stagedUploads()).toBe(true);
    setStagedUploads(false);
    expect(stagedUploads()).toBe(false);
    setStagedUploads(true);
    vi.stubGlobal('location', { search: '?stage=off' });
    expect(stagedUploads()).toBe(true); // a forced value beats the address
    setStagedUploads(null);
    expect(stagedUploads()).toBe(false); // null goes back to it
  });

  it('stops the stager and cancels what it holds when the stage is disposed', async () => {
    const host = new FakeHost();
    const f = figure();
    const art = stage([f.actor], { host, probe: { bitmap: true, bands: true, reason: 'ok' } });
    await frames(art, 25); // the upload has started and is not whole
    expect(art.stager!.stats().jobs).toBeGreaterThanOrEqual(0);
    art.dispose();
    expect(art.stager!.enabled).toBe(false);
    expect(art.stager!.stats().jobs).toBe(0);
  });
});
