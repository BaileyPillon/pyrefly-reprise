/**
 * Release 39.1 ("r391-stalls"; both games, shared plumbing): the run-time proof that a staged upload draws what the legacy upload draws. A fake WebGL context holds
 * textures as bytes and honours the pixel-store state (`UNPACK_FLIP_Y_WEBGL`, `UNPACK_SKIP_ROWS`) the way a browser does, so the probe's decision logic can be driven through
 * a correct browser, one whose bitmap decode premultiplies, one that ignores the sub-rectangle overload, one that raises GL errors and one that throws.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  PROBE_HEIGHT,
  PROBE_PIXELS,
  PROBE_PNG_BASE64,
  PROBE_WIDTH,
  differingBytes,
  flipRows,
  probeBrowser,
  probeUploads,
  resetProbe,
  type ProbeGl,
} from '../../../src/engine/StageProbe.ts';

interface Source {
  kind: 'img' | 'bitmap';
  width: number;
  height: number;
  /** RGBA bytes, the first row first, as the source holds them. */
  rgba: number[];
}
interface Tex {
  w: number;
  h: number;
  data: Uint8Array;
}

class FakeGl implements ProbeGl {
  readonly TEXTURE_2D = 3553;
  readonly RGBA = 6408;
  readonly RGBA8 = 32856;
  readonly UNSIGNED_BYTE = 5121;
  readonly FRAMEBUFFER = 36160;
  readonly COLOR_ATTACHMENT0 = 36064;
  readonly UNPACK_FLIP_Y_WEBGL = 37440;
  readonly UNPACK_PREMULTIPLY_ALPHA_WEBGL = 37441;
  readonly UNPACK_COLORSPACE_CONVERSION_WEBGL = 37443;
  readonly UNPACK_SKIP_ROWS = 3314;
  readonly NONE = 0;
  textures: Tex[] = [];
  deleted: unknown[] = [];
  private bound: Tex | null = null;
  private attached: Tex | null = null;
  private store = new Map<number, number | boolean>();
  error = 0;
  /** What the pretend browser gets wrong. */
  quirks = { ignoreSkipRows: false, errorOnSkipRows: false, throwOnBitmap: false, bitmapErrors: false };

  createTexture(): unknown {
    const t: Tex = { w: 0, h: 0, data: new Uint8Array(0) };
    this.textures.push(t);
    return t;
  }
  bindTexture(_target: number, texture: unknown): void {
    this.bound = texture as Tex;
  }
  texStorage2D(_target: number, _levels: number, _format: number, width: number, height: number): void {
    this.bound!.w = width;
    this.bound!.h = height;
    this.bound!.data = new Uint8Array(width * height * 4);
  }
  pixelStorei(name: number, value: number | boolean): void {
    this.store.set(name, value);
  }
  texSubImage2D(_target: number, _level: number, x: number, y: number, ...rest: unknown[]): void {
    const full = rest.length === 5;
    const source = rest[rest.length - 1] as Source;
    const w = full ? (rest[0] as number) : source.width;
    const h = full ? (rest[1] as number) : source.height;
    if (source.kind === 'bitmap' && this.quirks.throwOnBitmap) throw new Error('DataError');
    if (source.kind === 'bitmap' && this.quirks.bitmapErrors) return void (this.error = 0x502);
    let rows: number[][] = [];
    for (let r = 0; r < source.height; r++) rows.push(source.rgba.slice(r * source.width * 4, (r + 1) * source.width * 4));
    if (source.kind === 'img' && this.store.get(this.UNPACK_FLIP_Y_WEBGL) === true) rows = rows.reverse();
    const skip = Number(this.store.get(this.UNPACK_SKIP_ROWS) ?? 0);
    if (skip > 0 && this.quirks.errorOnSkipRows) return void (this.error = 0x502);
    const first = this.quirks.ignoreSkipRows ? 0 : skip;
    const tex = this.bound!;
    for (let r = 0; r < h; r++) tex.data.set(rows[first + r]!.slice(0, w * 4), ((y + r) * tex.w + x) * 4);
  }
  createFramebuffer(): unknown {
    return {};
  }
  bindFramebuffer(): void {}
  framebufferTexture2D(_t: number, _a: number, _tt: number, texture: unknown): void {
    this.attached = texture as Tex;
  }
  readPixels(_x: number, _y: number, _w: number, _h: number, _f: number, _t: number, out: Uint8Array): void {
    out.set(this.attached!.data.subarray(0, out.length));
  }
  getError(): number {
    const e = this.error;
    this.error = 0;
    return e;
  }
  deleteTexture(texture: unknown): void {
    this.deleted.push(texture);
  }
  deleteFramebuffer(): void {}
}

const img = (): Source => ({ kind: 'img', width: PROBE_WIDTH, height: PROBE_HEIGHT, rgba: [...PROBE_PIXELS] });
/** A bitmap decoded with flipY: the bottom row first. */
const bitmap = (rgba = flipRows(PROBE_PIXELS, PROBE_WIDTH)): Source => ({ kind: 'bitmap', width: PROBE_WIDTH, height: PROBE_HEIGHT, rgba });

describe('the probe PNG and its helpers', () => {
  it('is a 4 x 2 PNG that holds colour hidden under alpha 0 and partial alpha', () => {
    const bytes = Buffer.from(PROBE_PNG_BASE64, 'base64');
    expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(bytes.readUInt32BE(16)).toBe(PROBE_WIDTH);
    expect(bytes.readUInt32BE(20)).toBe(PROBE_HEIGHT);
    expect(PROBE_PIXELS).toHaveLength(PROBE_WIDTH * PROBE_HEIGHT * 4);
    const px = (i: number): number[] => PROBE_PIXELS.slice(i * 4, i * 4 + 4);
    expect(px(2)).toEqual([10, 20, 30, 0]); // colour under alpha 0
    expect(px(6)).toEqual([123, 45, 67, 0]);
    expect(px(1)[3]).toBe(128); // partial alpha
    expect(px(5)[3]).toBe(1);
  });

  it('counts differing bytes and flips rows', () => {
    expect(differingBytes([1, 2, 3], [1, 2, 3])).toBe(0);
    expect(differingBytes([1, 2, 3], [1, 9, 3])).toBe(1);
    expect(differingBytes([1, 2, 3], [1, 2])).toBe(1); // a length mismatch counts every byte of the longer one
    expect(flipRows([1, 1, 1, 1, 2, 2, 2, 2], 1)).toEqual([2, 2, 2, 2, 1, 1, 1, 1]);
    expect(flipRows(flipRows(PROBE_PIXELS, PROBE_WIDTH), PROBE_WIDTH)).toEqual([...PROBE_PIXELS]);
  });
});

describe('probeUploads', () => {
  it('passes a browser whose bitmap path is exact: the bitmap, one call or in bands, equals the legacy upload', () => {
    const gl = new FakeGl();
    const r = probeUploads(gl, img(), bitmap());
    expect(r).toEqual({ bitmap: true, bands: true, reason: 'ok' });
    expect(gl.deleted).toHaveLength(3); // every texture it made is freed
  });

  it('refuses the bitmap path when its decode premultiplies (colour under alpha 0 is lost)', () => {
    const premultiplied = flipRows(PROBE_PIXELS, PROBE_WIDTH).map((v, i, all) => (i % 4 !== 3 ? Math.round((v * all[i - (i % 4) + 3]!) / 255) : v));
    const r = probeUploads(new FakeGl(), img(), bitmap(premultiplied));
    expect(r.bitmap).toBe(false);
    expect(r.bands).toBe(false);
    expect(r.reason).toMatch(/differs from the legacy upload/);
  });

  it('keeps the bitmap path but refuses bands when the sub-rectangle overload is ignored', () => {
    const gl = new FakeGl();
    gl.quirks.ignoreSkipRows = true;
    const r = probeUploads(gl, img(), bitmap());
    expect(r.bitmap).toBe(true);
    expect(r.bands).toBe(false);
    expect(r.reason).toMatch(/banded upload differs/);
  });

  it('keeps the bitmap path but refuses bands when the overload raises a GL error', () => {
    const gl = new FakeGl();
    gl.quirks.errorOnSkipRows = true;
    const r = probeUploads(gl, img(), bitmap());
    expect(r.bitmap).toBe(true);
    expect(r.bands).toBe(false);
    expect(r.reason).toMatch(/GL error/);
  });

  it('refuses everything when the bitmap upload raises a GL error or throws', () => {
    const errors = new FakeGl();
    errors.quirks.bitmapErrors = true;
    expect(probeUploads(errors, img(), bitmap())).toMatchObject({ bitmap: false, bands: false });
    const throws = new FakeGl();
    throws.quirks.throwOnBitmap = true;
    const r = probeUploads(throws, img(), bitmap());
    expect(r).toMatchObject({ bitmap: false, bands: false });
    expect(r.reason).toMatch(/probe threw/);
    expect(throws.deleted.length).toBeGreaterThan(0); // and it still cleaned up
  });
});

describe('probeBrowser', () => {
  beforeEach(() => resetProbe());

  it('reads "no staged upload" where there is no DOM, and answers once per session', async () => {
    const a = probeBrowser();
    expect(probeBrowser()).toBe(a);
    expect(await a).toMatchObject({ bitmap: false, bands: false });
    resetProbe();
    expect(probeBrowser()).not.toBe(a);
  });
});
