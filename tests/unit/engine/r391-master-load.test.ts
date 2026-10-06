/**
 * Release 39.1 ("r391-stalls"; both games, shared plumbing): the governor's load of one master as a Blob read two ways. The file is fetched once; the `<img>` over an object URL is the
 * handle `texture.image` keeps (never decoded here), the `ImageBitmap` is the pixels (straight alpha, no colour conversion, flipped). The fall-back chain is `loadPixels`': one retry of a
 * 5xx when the manifest says the file ships, then the next master down, then the approved file. Fakes for `fetch`, `Image` and `createImageBitmap`; the real tier arithmetic.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { setArtTier, setBufferWidth } from '../../../src/engine/ArtDevice.ts';
import { BITMAP_OPTIONS, loadMaster, requestInit } from '../../../src/engine/MasterLoad.ts';

const STATES = ['idle', 'ready', 'attack'];

function manifest(): void {
  setArtManifest(
    parseArtManifest({
      version: 1,
      subjects: { tidus: { states: STATES, portrait: false, tiers: { ready: [2, 3, 4], idle: [2, 4] } } },
      backdrops: [],
    }),
  );
}

interface Rig {
  fetched: string[];
  images: FakeImage[];
  bitmaps: Array<{ width: number; height: number; closed: number; close(): void }>;
  bitmapCalls: Array<{ blob: Blob; options: unknown }>;
  /** What each url answers: a status, or a function (so a test can fail the first call only). */
  answers: Map<string, number | (() => number)>;
  /** The images (by the order they are made) that fail to load. */
  brokenImages: Set<number>;
  revoked: string[];
}

class FakeImage {
  static rig: Rig;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  decoded = 0;
  private href = '';
  set src(v: string) {
    this.href = v;
    const n = FakeImage.rig.images.push(this) - 1;
    queueMicrotask(() => (FakeImage.rig.brokenImages.has(n) ? this.onerror?.() : this.onload?.()));
  }
  get src(): string {
    return this.href;
  }
  decode(): Promise<void> {
    this.decoded++;
    return Promise.resolve();
  }
}

let rig: Rig;

beforeEach(() => {
  rig = { fetched: [], images: [], bitmaps: [], bitmapCalls: [], answers: new Map(), brokenImages: new Set(), revoked: [] };
  FakeImage.rig = rig;
  vi.stubGlobal('Image', FakeImage);
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      rig.fetched.push(String(url));
      const a = rig.answers.get(String(url));
      const status = typeof a === 'function' ? a() : (a ?? 200);
      return status === 200 ? new Response(new Blob([`bytes of ${url}`], { type: 'image/png' }), { status: 200 }) : new Response(null, { status });
    }),
  );
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async (blob: Blob, options: unknown) => {
      rig.bitmapCalls.push({ blob, options });
      const b = { width: 64, height: 64, closed: 0, close() { b.closed++; } };
      rig.bitmaps.push(b);
      return b;
    }),
  );
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => `blob:fake/${(blob as Blob).size}`);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation((u) => void rig.revoked.push(u));
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  manifest();
  setArtTier('high');
  setBufferWidth(2560);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  resetArtManifest();
  setArtTier(null);
  setBufferWidth(0);
});

const READY = '/art/characters/tidus/ready.png';

describe('loadMaster', () => {
  it('fetches the master once and reads the same bytes as an image handle and as a bitmap', async () => {
    const got = await loadMaster(READY, 2);
    expect(got).not.toBeNull();
    expect(got!.scale).toBe(2);
    expect(rig.fetched).toEqual(['/art/characters/tidus/ready%402x.png']); // one request
    expect(got!.image).toBe(rig.images[0]);
    expect(got!.bitmap).toBe(rig.bitmaps[0]);
    expect(rig.bitmapCalls).toHaveLength(1);
    expect(rig.bitmapCalls[0]!.options).toEqual({ premultiplyAlpha: 'none', colorSpaceConversion: 'none', imageOrientation: 'flipY' });
    expect(BITMAP_OPTIONS).toEqual(rig.bitmapCalls[0]!.options);
    expect(rig.images[0]!.decoded).toBe(1); // the handle is decoded off the thread (the effects that read a painting's alpha draw it), not by the upload
    expect(rig.revoked).toEqual([rig.images[0]!.src]); // the object URL is let go once the image has loaded
  });

  it('asks for the master of the scale wanted, and takes the nearest one below it that ships', async () => {
    expect((await loadMaster(READY, 4))!.scale).toBe(4);
    expect(rig.fetched.at(-1)).toBe('/art/characters/tidus/ready%404x.png');
    const idle = await loadMaster('/art/characters/tidus/idle.png', 3); // idle has 2x and 4x only: 3 is not a master it ships
    expect(idle!.scale).toBe(4);
  });

  it('falls back one master at a time when a file is missing, then to the approved painting', async () => {
    rig.answers.set('/art/characters/tidus/ready%404x.png', 404);
    rig.answers.set('/art/characters/tidus/ready%403x.png', 404);
    const got = await loadMaster(READY, 4);
    expect(got!.scale).toBe(2);
    expect(rig.fetched).toEqual(['/art/characters/tidus/ready%404x.png', '/art/characters/tidus/ready%403x.png', '/art/characters/tidus/ready%402x.png']);
    rig.answers.set('/art/characters/tidus/ready%402x.png', 404);
    const last = await loadMaster(READY, 4);
    expect(last!.scale).toBe(1);
    expect(rig.fetched.at(-1)).toBe(READY);
  });

  it('is null when nothing loads, and says so once per file', async () => {
    for (const u of ['/art/characters/tidus/ready%402x.png', '/art/characters/tidus/ready%403x.png', '/art/characters/tidus/ready%404x.png', READY]) rig.answers.set(u, 404);
    expect(await loadMaster(READY, 4)).toBeNull();
    expect(await loadMaster(READY, 4)).toBeNull();
    const warns = (console.warn as unknown as { mock: { calls: string[][] } }).mock.calls.map((c) => c[0]);
    expect(new Set(warns).size).toBe(warns.length); // no file twice
    expect(warns.length).toBeGreaterThan(0);
  });

  it('retries a 5xx once when the manifest says the file ships, and not a 404', async () => {
    vi.useFakeTimers();
    let n = 0;
    rig.answers.set('/art/characters/tidus/ready%402x.png', () => (++n === 1 ? 503 : 200));
    const pending = loadMaster(READY, 2);
    await vi.advanceTimersByTimeAsync(600);
    const got = await pending;
    expect(got!.scale).toBe(2);
    expect(rig.fetched.filter((u) => u.endsWith('ready%402x.png'))).toHaveLength(2);
  });

  it('falls back when the image will not load, and closes the bitmap it made', async () => {
    rig.brokenImages.add(0); // the first image made (the 4x) fails to load
    const got = await loadMaster(READY, 4);
    expect(got!.scale).toBe(3); // the next master down
    expect(rig.bitmaps[0]!.closed).toBe(1); // and the bitmap made for the 4x was let go
    expect(got!.bitmap).toBe(rig.bitmaps[1]);
  });

  it('fetches a background load at low priority, a figure on screen at the default, and a warm-up from the cache', async () => {
    expect(requestInit()).toEqual({}); // no options: as a plain fetch
    expect(requestInit({ urgent: true, warm: false })).toEqual({});
    expect(requestInit({ urgent: false, warm: false })).toEqual({ priority: 'low' });
    expect(requestInit({ urgent: false, warm: true })).toEqual({ priority: 'low', cache: 'force-cache' });
    const lastInit = (): RequestInit | undefined => (fetch as unknown as { mock: { calls: Array<[string, RequestInit | undefined]> } }).mock.calls.at(-1)![1];
    await loadMaster(READY, 2, { urgent: false, warm: false });
    expect(lastInit()).toEqual({ priority: 'low' });
    await loadMaster(READY, 2, { urgent: true, warm: false });
    expect(lastInit()).toEqual({});
  });

  it('hands back no bitmap, and decodes the image, where the browser cannot or will not make one', async () => {
    vi.stubGlobal('createImageBitmap', undefined);
    const none = await loadMaster(READY, 2);
    expect(none!.bitmap).toBeNull();
    expect(rig.images[0]!.decoded).toBe(1); // it will be uploaded by three, so it is decoded, as `loadPixels` does (once, not twice)
    vi.stubGlobal('createImageBitmap', vi.fn(async () => Promise.reject(new Error('InvalidStateError'))));
    const refused = await loadMaster(READY, 2);
    expect(refused!.bitmap).toBeNull();
    expect(refused!.scale).toBe(2);
  });
});
