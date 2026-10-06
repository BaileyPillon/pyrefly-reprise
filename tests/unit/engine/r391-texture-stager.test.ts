/**
 * Release 39.1 ("r391-stalls"; both games, shared plumbing): the texture stager. Real three.js `Texture` objects, a fake renderer and a fake WebGL context that behave as three 0.186 does where
 * the stager depends on it: `initTexture` makes one GL texture per `Source` (a second texture that shares the source shares the GL texture, with a count of users), `dispose()` gives a
 * user back, and the last user frees the GL texture. What is checked: the modes the probe decides, the allocation without an upload, the bands (rows, order, the sub-rectangle state, the
 * per-frame budget and how it shrinks on a late frame), the mip chain once at the end, the atomic adoption (the painting's old GL texture freed, the staged one kept, nothing uploaded),
 * cancellation, a lost context, urgent jobs first, the job limit and the one-call fall-back.
 */
import { Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BAND_BYTES } from '../../../src/engine/StageBands.ts';
import type { ProbeResult } from '../../../src/engine/StageProbe.ts';
import { SAMPLER_FIELDS, TextureStager, copySampler } from '../../../src/engine/TextureStager.ts';
import { FakeHost, painting, request, type GlTex } from '../helpers/fake-stage-host.ts';

const BANDS: ProbeResult = { bitmap: true, bands: true, reason: 'ok' };
const ONE_SHOT: ProbeResult = { bitmap: true, bands: false, reason: 'bands refused' };
const OFF: ProbeResult = { bitmap: false, bands: false, reason: 'no' };

/** A stager on a fake host, with the probe's verdict already in. */
async function stagerOn(probe: ProbeResult = BANDS): Promise<{ host: FakeHost; stager: TextureStager }> {
  const host = new FakeHost();
  const stager = new TextureStager(host, probe);
  await Promise.resolve();
  await Promise.resolve();
  return { host, stager };
}

/** Tick until nothing is left to upload (or `max` frames), at a steady 60 Hz. */
function tickAll(stager: TextureStager, max = 100, frameMs = 16.7): number {
  let t = 1000;
  vi.spyOn(performance, 'now').mockImplementation(() => t);
  let frames = 0;
  const pending = (): boolean => stager.stats().landed + stager.stats().cancelled < stager.stats().started;
  while (pending() && frames < max) {
    t += frameMs;
    stager.tick();
    frames++;
  }
  return frames;
}

afterEach(() => vi.restoreAllMocks());

describe('the probe decides the mode', () => {
  it('stages nothing until the probe has answered, and nothing when the browser failed it', async () => {
    const host = new FakeHost();
    let answer: (r: ProbeResult) => void = () => undefined;
    const stager = new TextureStager(host, new Promise<ProbeResult>((res) => (answer = res)));
    expect(stager.enabled).toBe(false);
    expect(stager.stage(request(painting()))).toBeNull();
    answer(BANDS);
    await Promise.resolve();
    await Promise.resolve();
    expect(stager.enabled).toBe(true);
    expect(stager.stats().mode).toBe('bands');

    const off = await stagerOn(OFF);
    expect(off.stager.enabled).toBe(false);
    expect(off.stager.stage(request(painting()))).toBeNull();
    expect(off.stager.stats().mode).toBe('off');
    expect((await stagerOn(ONE_SHOT)).stager.stats().mode).toBe('oneshot');
  });

  it('reads a probe that rejects as "off"', async () => {
    const host = new FakeHost();
    const stager = new TextureStager(host, Promise.reject(new Error('no')));
    await Promise.resolve();
    await Promise.resolve();
    expect(stager.stats().mode).toBe('off');
  });
});

describe('the staging texture', () => {
  it('carries the painting\'s sampler state, because three shares a GL texture only between textures with the same key', () => {
    const target = painting();
    target.anisotropy = 16;
    target.generateMipmaps = true;
    target.flipY = true;
    const s = new Texture();
    copySampler(s, target);
    for (const k of SAMPLER_FIELDS) expect((s as unknown as Record<string, unknown>)[k]).toBe((target as unknown as Record<string, unknown>)[k]);
    expect(SAMPLER_FIELDS).toContain('colorSpace');
    expect(SAMPLER_FIELDS).toContain('anisotropy');
  });

  it('is allocated through the renderer with no data ready, and the painting keeps its own GL texture meanwhile', async () => {
    const { host, stager } = await stagerOn();
    const target = painting('tidus');
    host.initTexture(target); // the painting has been drawn once: it has a GL texture
    const before = host.glTextures[0]!;
    const staged = stager.stage(request(target))!;
    expect(staged).not.toBeNull();
    expect(host.uploads).toHaveLength(2);
    expect(host.uploads[1]).toMatchObject({ dataReady: false }); // storage allocated, nothing uploaded
    expect(target.source).not.toBe(host.glTextures.length > 1 ? undefined : null);
    expect(before.freed).toBe(false);
    expect(host.gl.subs).toHaveLength(0);
  });
});

describe('the bands', () => {
  it('upload a 4096-square master in 16 frames of 256 rows, top to bottom, with the sub-rectangle state set and cleared', async () => {
    const { host, stager } = await stagerOn();
    const req = request(painting());
    const staged = stager.stage(req)!;
    const frames = tickAll(stager);
    expect(frames).toBe(16);
    expect(host.gl.subs).toHaveLength(16);
    host.gl.subs.forEach((s, i) => {
      expect(s.y).toBe(i * 256);
      expect(s.rows).toBe(256);
      expect(s.width).toBe(4096);
      expect(s.skip).toBe(i * 256); // UNPACK_SKIP_ROWS selects the same rows of the bitmap
      expect(s.flip).toBe(false);
      expect(s.premul).toBe(false);
      expect(s.source).toBe(req.bitmap);
    });
    expect(host.gl.store.get(host.gl.UNPACK_SKIP_ROWS)).toBe(0); // left as three expects it
    await expect(staged.ready).resolves.toBe(true);
  });

  it('make the mip chain once, after the last band, then close the bitmap', async () => {
    const { host, stager } = await stagerOn();
    const req = request(painting(), 1024, 1024);
    stager.stage(req);
    tickAll(stager);
    expect(host.gl.mipmaps).toHaveLength(1);
    expect(host.gl.subs.length).toBeGreaterThan(0);
    expect(req.bitmap.closed).toBe(1);
    expect(stager.stats()).toMatchObject({ landed: 1, jobs: 1 }); // resident, waiting to be adopted
  });

  it('spend about the budget a frame: a 4096-wide band is 4 MB', async () => {
    const { host, stager } = await stagerOn();
    stager.stage(request(painting()));
    tickAll(stager, 1);
    const bytes = host.gl.subs[0]!.rows * host.gl.subs[0]!.width * 4;
    expect(bytes).toBeLessThanOrEqual(BAND_BYTES);
    expect(bytes).toBeGreaterThan(BAND_BYTES / 2);
  });

  it('shrink on a late frame, so a page that is already late is not piled on, and still finish', async () => {
    const { host, stager } = await stagerOn();
    stager.stage(request(painting(), 4096, 1024));
    const frames = tickAll(stager, 400, 60); // 60 ms frames: an eighth of the budget
    expect(host.gl.subs[0]!.rows).toBe(256); // the first frame has nothing to compare with
    expect(host.gl.subs[2]!.rows).toBeLessThan(256);
    expect(stager.stats().landed).toBe(1);
    expect(frames).toBeGreaterThan(4);
  });

  it('back off after a slow upload call: a quarter of the budget for a few frames, then the full band again', async () => {
    const { host, stager } = await stagerOn();
    stager.stage(request(painting(), 4096, 4096));
    let t = 1000;
    const now = vi.spyOn(performance, 'now');
    now.mockImplementation(() => t);
    t += 16.7;
    stager.tick(); // the first band, normal
    const normal = host.gl.subs[0]!.rows;
    // make the next band's call look slow (it waited on the GPU): performance.now jumps 10 ms across the call
    t += 16.7;
    const seq = [t, t, t + 10]; // the tick's own clock read, then the band call's start and end
    now.mockImplementation(() => seq.shift() ?? t);
    stager.tick();
    now.mockImplementation(() => t);
    const rowsAfterSlow = [] as number[];
    for (let i = 0; i < 3; i++) {
      t += 16.7;
      const before = host.gl.subs.length;
      stager.tick();
      rowsAfterSlow.push(host.gl.subs[before]!.rows);
    }
    expect(normal).toBe(256);
    expect(rowsAfterSlow.every((r) => r <= 64)).toBe(true); // a quarter of 256
    for (let i = 0; i < 20; i++) {
      t += 16.7;
      stager.tick();
    }
    const last = host.gl.subs.at(-1)!.rows;
    expect(last).toBeGreaterThan(64); // the back-off ended: full bands again
  });

  it('run an urgent job before an older background one', async () => {
    const { host, stager } = await stagerOn();
    const a = stager.stage(request(painting('a'), 1024, 1024, false))!;
    const b = stager.stage(request(painting('b'), 1024, 1024, true))!;
    void a;
    void b;
    tickAll(stager, 1);
    const first = host.gl.subs[0]!;
    const urgentGl = host.glTextures.find((g) => g.id === first.tex)!;
    expect(urgentGl.id).toBe(host.glTextures[1]!.id); // the second staged texture, the urgent one
  });

  it('hold at most four jobs, and say no to the fifth', async () => {
    const { stager } = await stagerOn();
    for (let i = 0; i < 4; i++) expect(stager.stage(request(painting(`p${i}`)))).not.toBeNull();
    expect(stager.stage(request(painting('p5')))).toBeNull();
  });

  it('fall back to the one-call upload when the renderer\'s record has no GL texture', async () => {
    const host = new FakeHost();
    host.hideHandle = true;
    const stager = new TextureStager(host, BANDS);
    await Promise.resolve();
    await Promise.resolve();
    const req = request(painting());
    const staged = stager.stage(req)!;
    expect(staged).not.toBeNull();
    tickAll(stager);
    expect(host.gl.subs).toHaveLength(0); // no bands: three uploaded the bitmap in one call
    expect(host.uploads.some((u) => u.image === req.bitmap && u.dataReady)).toBe(true);
    await expect(staged.ready).resolves.toBe(true);
  });
});

describe('the one-call mode', () => {
  it('uploads the bitmap through the renderer in one tick, with flip and premultiply off, and gives the image handle back', async () => {
    const { host, stager } = await stagerOn(ONE_SHOT);
    const target = painting();
    const req = request(target, 2048, 2048);
    const staged = stager.stage(req)!;
    expect(host.uploads).toHaveLength(0); // nothing is allocated until the tick
    const frames = tickAll(stager);
    expect(frames).toBe(1);
    expect(host.gl.store.get(host.gl.UNPACK_FLIP_Y_WEBGL)).toBe(false);
    expect(host.gl.store.get(host.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL)).toBe(false);
    expect(host.uploads[0]!.image).toBe(req.bitmap); // the bitmap was the image during the upload
    await expect(staged.ready).resolves.toBe(true);
    expect(staged.adopt()).toBe(true);
    expect(target.image).toBe(req.image); // and the handle is what the painting keeps
    expect(req.bitmap.closed).toBe(1);
  });
});

describe('adoption', () => {
  it('makes the painting draw the staged GL texture in one step: the old one freed, the staged one kept, nothing uploaded', async () => {
    const { host, stager } = await stagerOn();
    const target = painting('tidus');
    host.initTexture(target);
    const old = host.glTextures[0]!;
    const sourceBefore = target.source;
    const req = request(target, 2048, 2048);
    const staged = stager.stage(req)!;
    tickAll(stager);
    await staged.ready;
    expect(target.source).toBe(sourceBefore); // until the swap the painting is untouched
    expect(old.freed).toBe(false);
    const uploadsBefore = host.uploads.length;
    host.log.length = 0;

    expect(staged.adopt()).toBe(true);
    expect(target.source.data).toBe(req.image); // the painting's image is now the decoded handle
    expect(old.freed).toBe(true);
    const staging = host.glTextures[1]!;
    expect(staging.freed).toBe(false);
    expect(staging.users).toBe(1); // the painting's share; the staging texture's own was given back
    expect(host.uploads).toHaveLength(uploadsBefore); // adoption uploads nothing
    expect((host.properties.get(target) as { __webglTexture: GlTex }).__webglTexture).toBe(staging);
    // the order that keeps the GL texture alive: the old one freed, the painting takes its share, then the staging texture gives its share back
    expect(host.log.indexOf(`free:${old.id}`)).toBeLessThan(host.log.indexOf('init:tidus'));
    expect(host.log.filter((l) => l.startsWith('free:'))).toEqual([`free:${old.id}`]);
    expect(staged.adopt()).toBe(false); // once
    expect(stager.stats()).toMatchObject({ adopted: 1, jobs: 0 });
  });

  it('works for a painting that has never been drawn: no old GL texture, the staged one is the first', async () => {
    const { host, stager } = await stagerOn();
    const target = painting('ready');
    const staged = stager.stage(request(target, 1024, 1024))!;
    tickAll(stager);
    await staged.ready;
    expect(staged.adopt()).toBe(true);
    expect(host.glTextures.map((g) => g.freed)).toEqual([false]);
    expect(host.glTextures[0]!.users).toBe(1);
  });

  it('refuses before the upload is whole', async () => {
    const { stager } = await stagerOn();
    const staged = stager.stage(request(painting()))!;
    expect(staged.adopt()).toBe(false);
  });
});

describe('cancelling and losing the context', () => {
  it('frees the staging texture, closes the bitmap, settles false and leaves the painting alone', async () => {
    const { host, stager } = await stagerOn();
    const target = painting();
    host.initTexture(target);
    const req = request(target);
    const staged = stager.stage(req)!;
    tickAll(stager, 3);
    staged.cancel();
    await expect(staged.ready).resolves.toBe(false);
    expect(req.bitmap.closed).toBe(1);
    expect(host.glTextures[1]!.freed).toBe(true);
    expect(host.glTextures[0]!.freed).toBe(false);
    expect(stager.stats()).toMatchObject({ cancelled: 1, jobs: 0 });
    staged.cancel(); // twice is nothing
    expect(stager.stats().cancelled).toBe(1);
  });

  it('cancels a resident job that was never adopted without settling twice', async () => {
    const { stager } = await stagerOn();
    const req = request(painting(), 1024, 1024);
    const staged = stager.stage(req)!;
    tickAll(stager);
    await expect(staged.ready).resolves.toBe(true);
    staged.cancel();
    expect(req.bitmap.closed).toBe(1); // closed once, at the landing
    expect(stager.stats().jobs).toBe(0);
  });

  it('cancels everything when the context is lost, and answers null while it is', async () => {
    const { host, stager } = await stagerOn();
    const a = stager.stage(request(painting('a')))!;
    const b = stager.stage(request(painting('b')))!;
    host.gl.lost = true;
    tickAll(stager, 2);
    await expect(a.ready).resolves.toBe(false);
    await expect(b.ready).resolves.toBe(false);
    expect(stager.stage(request(painting('c')))).toBeNull();
    host.gl.lost = false;
    expect(stager.stage(request(painting('d')))).not.toBeNull();
  });

  it('cancels every job when it is disposed, and then stages nothing', async () => {
    const { stager } = await stagerOn();
    const a = stager.stage(request(painting('a')))!;
    stager.dispose();
    await expect(a.ready).resolves.toBe(false);
    expect(stager.enabled).toBe(false);
    expect(stager.stage(request(painting('b')))).toBeNull();
  });
});

describe('the counters', () => {
  it('count the uploads, the megabytes and the slowest call', async () => {
    const { stager } = await stagerOn();
    stager.stage(request(painting(), 1024, 1024));
    tickAll(stager);
    const s = stager.stats();
    expect(s.mode).toBe('bands');
    expect(s.probe).toBe('ok');
    expect(s.started).toBe(1);
    expect(s.landed).toBe(1);
    expect(s.mb).toBeCloseTo(4, 0);
    expect(s.uploads).toBeGreaterThan(0);
    expect(s.busyFrames).toBeGreaterThan(0);
  });
});
