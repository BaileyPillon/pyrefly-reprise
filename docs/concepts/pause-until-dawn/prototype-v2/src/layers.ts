/**
 * The v3 art set as the renderer consumes it (`art/rig.json` -> `artMeta.v3`,
 * written by `tools/gen/rig-assemble.py`, `rig-keys.py` and `rig-face.py`):
 * the frontal key's silhouette-cut layer stack (each with the motion group it
 * rides), each yaw key's back/front head halves, and the matted patches.
 * Every file is a trimmed RGBA PNG placed at its `box` on the 832x1216 plate
 * canvas. Face patches are not uploaded as they come: each is colour-matched
 * at its seam and feathered through its own matte first (`patch-blend.ts`).
 */
import { loadImage } from './gl-utils.ts';
import { blendPatch, type GainOffset, type RGBAImage } from './patch-blend.ts';

export type PixelBox = [number, number, number, number];
export type Motion = 'head' | 'chest' | 'iris' | 'fringe' | 'strand1' | 'strand2' | 'earring';

export interface PlacedFile {
  file: string;
  box: PixelBox;
}
export interface V3Layer extends PlacedFile {
  name: string;
  motion: Motion;
}
export interface V3EyeState extends PlacedFile {
  name: string;
  aperture: number;
  /**
   * v3.2 (tools/gen/rig-lids.py): built from the plate's own pixels with its
   * own soft edges, so it is uploaded as it is. The seam fit fitted a
   * different gain to every lid frame (the closed lid came out grey-violet on
   * one eye and tan on the other) and is skipped.
   */
  raw?: boolean;
}
export interface V3Art {
  /** `bodyTurned` (tools/gen/rig-collar.py): the body with the tassel footprint filled, for turned keys. */
  frontal: { layers: V3Layer[]; bodyTurned?: PlacedFile };
  keys: Record<string, { back: PlacedFile; front: PlacedFile }>;
  /**
   * v3.2 (tools/gen/rig-lids.py): lid frames for each turned key, nearest
   * aperture wins; each is transparent below its lid edge, so the key's own
   * painted eye shows under it. Absent: a turned key does not blink.
   */
  keyLids?: Record<string, V3EyeState[]>;
  patches: {
    eyes: V3EyeState[];
    brows: Record<'raised' | 'drawn', PlacedFile>;
    mouth: Partial<Record<'parted' | 'slightSmile' | 'smile' | 'pressed', PlacedFile>>;
  };
  fringeLiftPx: number;
  /**
   * v4 (tools/gen/rig-v4face.py): mouth and brow patches per turned key, each
   * seam-matched against that key's own composite (`rest`, a canvas-sized PNG).
   */
  keyPatches?: Record<string, { rest: string; mouth?: Record<string, PlacedFile>; brows?: Record<string, PlacedFile> }>;
}

/** v4 (`artMeta.v4`, tools/gen/rig-v4layers.py): how the keys are painted and where the tassel goes. */
export interface V4Meta {
  /** 'warp': adjacent keys warped and mixed continuously; 'switch': one painting at a time (v3.3). */
  paint: 'warp' | 'switch';
  tassel?: {
    /** The plate's earring layer's x offset (px) at each key, interpolated over the bracket. */
    dx: Record<string, number>;
    /** On top of the head from this yaw up. */
    overFromDeg: number;
    /** Under the face (between back and body) from this yaw down; cross-faded in between. */
    underToDeg: number;
    /** v4: faded out by this yaw (the far ear goes behind the skull and under the far hair). */
    hiddenBelowDeg?: number;
  };
}

export function readV4(artMeta: unknown): V4Meta | null {
  const v4 = (artMeta as { v4?: V4Meta } | undefined)?.v4;
  return v4 && (v4.paint === 'warp' || v4.paint === 'switch') ? v4 : null;
}

export interface Tex {
  tex: WebGLTexture;
  box: PixelBox;
}

export function readV3(artMeta: unknown): V3Art | null {
  const v3 = (artMeta as { v3?: V3Art } | undefined)?.v3;
  if (!v3 || !Array.isArray(v3.frontal?.layers) || !v3.keys || !v3.patches) return null;
  return v3;
}

/** Straight-alpha upload, no colour-space conversion: the texel must equal the PNG byte. */
export function uploadTexture(gl: WebGL2RenderingContext, image: TexImageSource): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error('createTexture failed');
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}

/**
 * The quad is the image's own size at the box's corner: v3.1's rig carried
 * boxes 2 px wider than their files for three turn keys (a 0.3 percent
 * horizontal stretch and a resample of every texel), so the file wins.
 */
export async function loadPlaced(gl: WebGL2RenderingContext, base: string, p: PlacedFile): Promise<Tex> {
  const img = await loadImage(base + p.file);
  return { tex: uploadTexture(gl, img), box: [p.box[0], p.box[1], img.width, img.height] };
}

/** Feather (px) of each patch group's own matte. Lids: 2.5 px, enough to take the stair-step off the lid mattes' top edge (1.5 left it, shots/RUNTIME-CHECK.md) while the lash line stays crisp. */
export const PATCH_FEATHER_PX = { eyes: 2.5, brows: 3, mouth: 3 } as const;

/** The rest pose the patches are matched against: pixel-for-pixel the plate (`art/rest-diff.png`). */
export const REST_COMPOSITE_FILE = 'rest-composite.png';

async function pixels(url: string): Promise<RGBAImage> {
  const blob = await (await fetch(url)).blob();
  // no colour conversion and no premultiply, same as the WebGL upload: a byte stays that byte
  const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const c = new OffscreenCanvas(bmp.width, bmp.height);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2d context failed');
  ctx.drawImage(bmp, 0, 0);
  const d = ctx.getImageData(0, 0, bmp.width, bmp.height);
  bmp.close();
  return { width: d.width, height: d.height, data: d.data };
}

function crop(img: RGBAImage, box: PixelBox, w: number, h: number): RGBAImage {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = box[0] + x;
      const sy = box[1] + y;
      if (sx < 0 || sy < 0 || sx >= img.width || sy >= img.height) continue;
      const si = (sy * img.width + sx) * 4;
      out.set(img.data.subarray(si, si + 4), (y * w + x) * 4);
    }
  }
  return { width: w, height: h, data: out };
}

export interface PatchFit extends GainOffset {
  file: string;
}

async function loadPatch(gl: WebGL2RenderingContext, base: string, p: PlacedFile, rest: RGBAImage | null, featherPx: number, fits: PatchFit[]): Promise<Tex> {
  if (!rest) return loadPlaced(gl, base, p);
  const img = await pixels(base + p.file);
  const { image, fit } = blendPatch(img, crop(rest, p.box, img.width, img.height), featherPx);
  fits.push({ file: p.file, ...fit });
  const data = new ImageData(new Uint8ClampedArray(image.data), image.width, image.height);
  return { tex: uploadTexture(gl, data), box: p.box };
}

export interface LoadedArt {
  frontal: Array<{ layer: V3Layer; t: Tex }>;
  bodyTurned: Tex | null;
  keys: Map<string, { back: Tex; front: Tex }>;
  eyes: Array<{ state: V3EyeState; t: Tex }>;
  /** Per turned key, its lid frames (open to closed). */
  keyLids: Map<string, Array<{ aperture: number; t: Tex }>>;
  brows: Map<string, Tex>;
  mouth: Map<string, Tex>;
  /** v4: per turned key, its own mouth and brow patches. */
  keyPatches: Map<string, { mouth: Map<string, Tex>; brows: Map<string, Tex> }>;
  /** v4: the plate's earring layer, drawn apart from every key (null: it rides in the frontal stack). */
  tassel: Tex | null;
  fringeLiftPx: number;
  all: WebGLTexture[];
  /** Per patch: the seam colour fit that was applied (identity when the rest composite could not be read). */
  patchFits: PatchFit[];
}

export async function loadArt(gl: WebGL2RenderingContext, base: string, art: V3Art, withTassel = false): Promise<LoadedArt> {
  const all: WebGLTexture[] = [];
  const track = (t: Tex): Tex => (all.push(t.tex), t);
  const frontal = await Promise.all(art.frontal.layers.map(async (layer) => ({ layer, t: track(await loadPlaced(gl, base, layer)) })));
  const bodyTurned = art.frontal.bodyTurned ? track(await loadPlaced(gl, base, art.frontal.bodyTurned)) : null;
  const keys = new Map<string, { back: Tex; front: Tex }>();
  for (const [id, k] of Object.entries(art.keys)) {
    keys.set(id, { back: track(await loadPlaced(gl, base, k.back)), front: track(await loadPlaced(gl, base, k.front)) });
  }
  let rest: RGBAImage | null = null;
  try {
    rest = await pixels(base + REST_COMPOSITE_FILE);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[living-portrait] rest composite unreadable; patches drawn unmatched:', err);
  }
  const fits: PatchFit[] = [];
  const F = PATCH_FEATHER_PX;
  const eyes = await Promise.all(
    [...art.patches.eyes]
      .sort((a, b) => b.aperture - a.aperture)
      .map(async (state) => ({ state, t: track(state.raw ? await loadPlaced(gl, base, state) : await loadPatch(gl, base, state, rest, F.eyes, fits)) })),
  );
  const brows = new Map<string, Tex>();
  for (const [k, p] of Object.entries(art.patches.brows)) brows.set(k, track(await loadPatch(gl, base, p, rest, F.brows, fits)));
  const mouth = new Map<string, Tex>();
  for (const [k, p] of Object.entries(art.patches.mouth)) mouth.set(k, track(await loadPatch(gl, base, p, rest, F.mouth, fits)));
  const keyLids = new Map<string, Array<{ aperture: number; t: Tex }>>();
  for (const [id, frames] of Object.entries(art.keyLids ?? {})) {
    const sorted = [...frames].sort((a, b) => b.aperture - a.aperture);
    keyLids.set(id, await Promise.all(sorted.map(async (f) => ({ aperture: f.aperture, t: track(await loadPlaced(gl, base, f)) }))));
  }
  const keyPatches = new Map<string, { mouth: Map<string, Tex>; brows: Map<string, Tex> }>();
  for (const [id, kp] of Object.entries(art.keyPatches ?? {})) {
    let keyRest: RGBAImage | null = null;
    try {
      keyRest = await pixels(base + kp.rest);
    } catch {
      keyRest = null;
    }
    const km = new Map<string, Tex>();
    const kb = new Map<string, Tex>();
    for (const [k, p] of Object.entries(kp.mouth ?? {})) km.set(k, track(await loadPatch(gl, base, p, keyRest, F.mouth, fits)));
    for (const [k, p] of Object.entries(kp.brows ?? {})) kb.set(k, track(await loadPatch(gl, base, p, keyRest, F.brows, fits)));
    keyPatches.set(id, { mouth: km, brows: kb });
  }
  const earring = frontal.find((f) => f.layer.name === 'earring');
  return { frontal, bodyTurned, keys, eyes, keyLids, brows, mouth, keyPatches, tassel: withTassel && earring ? earring.t : null, fringeLiftPx: art.fringeLiftPx, all, patchFits: fits };
}
