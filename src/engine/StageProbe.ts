/**
 * The run-time proof that a staged upload draws what the legacy upload draws (release 39.1, "r391-stalls"; both games, shared plumbing, no game content).
 *
 * The art rule is that a shipped image stays pixel-identical (`tools/art-derive.mjs`, `tools/art-browser-identity.mjs`). The staged upload decodes a master as an
 * `ImageBitmap` off the main thread (`premultiplyAlpha: 'none'`, `colorSpaceConversion: 'none'`, `imageOrientation: 'flipY'`) and writes it into the texture in row
 * bands with the WebGL2 sub-rectangle overload (`UNPACK_SKIP_ROWS`); the legacy upload is what Three does with an `<img>` (`UNPACK_FLIP_Y_WEBGL`, no premultiply, no
 * colour conversion). On Chromium with the RTX 5070 Ti the two are byte for byte the same on real masters (340,533 to 1,971,579 texels of colour hidden under alpha 0 and
 * up to 155,793 of partial alpha). That is a property of a browser and a driver, so each session checks it once, on a 4 x 2 PNG that holds both kinds of texel, in a
 * throwaway WebGL2 context (nothing of the game's GL state is touched):
 *
 *   - `bitmap`: the bitmap uploaded in one call equals the legacy upload, texel for texel. If not, the bitmap path is never used (the release 39 swap stays).
 *   - `bands`: the bitmap uploaded one row at a time through `UNPACK_SKIP_ROWS` equals it too and raised no GL error. If not, a staged texture is uploaded in one call.
 *
 * Pure of the game: the comparison and the GL steps take their inputs as arguments, so the unit tests drive them with a fake context.
 */

/** A 4 x 2 RGBA PNG (115 bytes). Rows, top first: red, 50 percent green, (10,20,30) at alpha 0, (200,100,50) at 25 percent / blue, white at alpha 1, (123,45,67) at alpha 0, (1,2,3) at 254. */
export const PROBE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAJUlEQVQI12P4z8DwHwgbuETkGE6kGDkwAPkgwFit68zAyMT8DwDRQQxDJUoWXgAAAABJRU5ErkJggg==';

export const PROBE_WIDTH = 4;
export const PROBE_HEIGHT = 2;

/** The straight RGBA the PNG holds, top row first. */
export const PROBE_PIXELS: readonly number[] = [
  255, 0, 0, 255, 0, 255, 0, 128, 10, 20, 30, 0, 200, 100, 50, 64,
  0, 0, 255, 255, 255, 255, 255, 1, 123, 45, 67, 0, 1, 2, 3, 254,
];

export interface ProbeResult {
  /** The bitmap path is exact on this browser (the staged upload may be used at all). */
  bitmap: boolean;
  /** The row-band path is exact too and raised no error (the upload may be spread over frames). */
  bands: boolean;
  /** Why a path was refused, for the debug stats. */
  reason: string;
}

export const PROBE_OFF: ProbeResult = { bitmap: false, bands: false, reason: 'not run' };

/** How many bytes differ between two readbacks (a length mismatch counts every byte of the longer one). */
export function differingBytes(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let n = Math.abs(a.length - b.length);
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) if (a[i] !== b[i]) n++;
  return n;
}

/** The pixels a texture holds read bottom row first, from rows written top first: the texture of a flipped upload. */
export function flipRows(rgba: ArrayLike<number>, width: number): number[] {
  const rowLen = width * 4;
  const rows = Math.floor(rgba.length / rowLen);
  const out: number[] = [];
  for (let y = rows - 1; y >= 0; y--) for (let x = 0; x < rowLen; x++) out.push(rgba[y * rowLen + x]!);
  return out;
}

/** The slice of a WebGL2 context the probe uses (the real context satisfies it; the tests pass a fake). */
export interface ProbeGl {
  readonly TEXTURE_2D: number;
  readonly RGBA: number;
  readonly RGBA8: number;
  readonly UNSIGNED_BYTE: number;
  readonly FRAMEBUFFER: number;
  readonly COLOR_ATTACHMENT0: number;
  readonly UNPACK_FLIP_Y_WEBGL: number;
  readonly UNPACK_PREMULTIPLY_ALPHA_WEBGL: number;
  readonly UNPACK_COLORSPACE_CONVERSION_WEBGL: number;
  readonly UNPACK_SKIP_ROWS: number;
  readonly NONE: number;
  createTexture(): unknown;
  bindTexture(target: number, texture: unknown): void;
  texStorage2D(target: number, levels: number, format: number, width: number, height: number): void;
  pixelStorei(name: number, value: number | boolean): void;
  texSubImage2D(target: number, level: number, x: number, y: number, ...rest: unknown[]): void;
  createFramebuffer(): unknown;
  bindFramebuffer(target: number, fb: unknown): void;
  framebufferTexture2D(target: number, attachment: number, textarget: number, texture: unknown, level: number): void;
  readPixels(x: number, y: number, w: number, h: number, format: number, type: number, out: Uint8Array): void;
  getError(): number;
  deleteTexture(texture: unknown): void;
  deleteFramebuffer(fb: unknown): void;
}

function readBack(gl: ProbeGl, tex: unknown): Uint8Array {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const out = new Uint8Array(PROBE_WIDTH * PROBE_HEIGHT * 4);
  gl.readPixels(0, 0, PROBE_WIDTH, PROBE_HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, out);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(fb);
  return out;
}

function allocate(gl: ProbeGl): unknown {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, PROBE_WIDTH, PROBE_HEIGHT);
  return tex;
}

/**
 * The three uploads of the one PNG and their verdicts. `img` is the decoded `<img>` the legacy path uploads, `bmp` the ImageBitmap the staged path does;
 * both come from the same bytes. The GL steps are the ones `TextureStager` takes (flip and premultiply off, `UNPACK_SKIP_ROWS` for a band).
 */
export function probeUploads(gl: ProbeGl, img: unknown, bmp: unknown): ProbeResult {
  const made: unknown[] = [];
  try {
    gl.getError(); // clear anything left over
    // The legacy upload: what Three does with an <img>.
    const a = allocate(gl);
    made.push(a);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, img);
    const legacy = readBack(gl, a);
    if (gl.getError() !== 0) return { bitmap: false, bands: false, reason: 'the legacy upload raised a GL error' };
    // The staged upload, in one call.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    const b = allocate(gl);
    made.push(b);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
    const oneShot = readBack(gl, b);
    const oneShotError = gl.getError();
    const bitmap = oneShotError === 0 && differingBytes(legacy, oneShot) === 0;
    if (!bitmap) return { bitmap: false, bands: false, reason: oneShotError !== 0 ? `the bitmap upload raised GL error ${oneShotError}` : `the bitmap upload differs from the legacy upload in ${differingBytes(legacy, oneShot)} bytes` };
    // The staged upload, a row at a time through the sub-rectangle overload.
    const c = allocate(gl);
    made.push(c);
    for (let y = 0; y < PROBE_HEIGHT; y++) {
      gl.pixelStorei(gl.UNPACK_SKIP_ROWS, y);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, PROBE_WIDTH, 1, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
    }
    gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0);
    const banded = readBack(gl, c);
    const bandError = gl.getError();
    const bands = bandError === 0 && differingBytes(legacy, banded) === 0;
    return { bitmap: true, bands, reason: bands ? 'ok' : bandError !== 0 ? `the banded upload raised GL error ${bandError}` : `the banded upload differs from the legacy upload in ${differingBytes(legacy, banded)} bytes` };
  } catch (err) {
    return { bitmap: false, bands: false, reason: `probe threw: ${String(err).slice(0, 120)}` };
  } finally {
    for (const t of made) {
      try {
        gl.deleteTexture(t);
      } catch {
        /* the context is going away */
      }
    }
  }
}

function pngBlob(): Blob {
  const bin = atob(PROBE_PNG_BASE64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: 'image/png' });
}

let cached: Promise<ProbeResult> | null = null;

/**
 * The browser's verdict, run once per page session and shared by every battle. Never throws: a browser that cannot decode a bitmap, cannot make a second WebGL2
 * context or answers anything unexpected reads as "no staged upload" and the release 39 path stays.
 */
export function probeBrowser(): Promise<ProbeResult> {
  cached ??= (async (): Promise<ProbeResult> => {
    try {
      if (typeof document === 'undefined' || typeof createImageBitmap !== 'function' || typeof Image === 'undefined') return { bitmap: false, bands: false, reason: 'no createImageBitmap' };
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const gl = canvas.getContext('webgl2', { antialias: false, depth: false, stencil: false, premultipliedAlpha: false });
      if (!gl) return { bitmap: false, bands: false, reason: 'no second WebGL2 context' };
      const blob = pngBlob();
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.src = url;
      await img.decode();
      URL.revokeObjectURL(url);
      const bmp = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none', imageOrientation: 'flipY' });
      const result = probeUploads(gl as unknown as ProbeGl, img, bmp);
      bmp.close();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return result;
    } catch (err) {
      return { bitmap: false, bands: false, reason: `probe failed: ${String(err).slice(0, 120)}` };
    }
  })();
  return cached;
}

/** Forget the browser's verdict (tests only). */
export function resetProbe(): void {
  cached = null;
}
