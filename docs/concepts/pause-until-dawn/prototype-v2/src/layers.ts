/**
 * The v3 art set as the renderer consumes it (`art/rig.json` -> `artMeta.v3`,
 * written by `tools/gen/rig-assemble.py`, `rig-keys.py` and `rig-face.py`):
 * the frontal key's silhouette-cut layer stack (each with the motion group it
 * rides), each yaw key's back/front head halves, and the matted patches.
 * Every file is a trimmed RGBA PNG placed at its `box` on the 832x1216 plate
 * canvas.
 */
import { loadImage } from './gl-utils.ts';

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
}
export interface V3Art {
  frontal: { layers: V3Layer[] };
  keys: Record<string, { back: PlacedFile; front: PlacedFile }>;
  patches: {
    eyes: V3EyeState[];
    brows: Record<'raised' | 'drawn', PlacedFile>;
    mouth: Record<'parted' | 'smile' | 'pressed', PlacedFile>;
  };
  fringeLiftPx: number;
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

export async function loadPlaced(gl: WebGL2RenderingContext, base: string, p: PlacedFile): Promise<Tex> {
  const img = await loadImage(base + p.file);
  return { tex: uploadTexture(gl, img), box: p.box };
}

export interface LoadedArt {
  frontal: Array<{ layer: V3Layer; t: Tex }>;
  keys: Map<string, { back: Tex; front: Tex }>;
  eyes: Array<{ state: V3EyeState; t: Tex }>;
  brows: Map<string, Tex>;
  mouth: Map<string, Tex>;
  fringeLiftPx: number;
  all: WebGLTexture[];
}

export async function loadArt(gl: WebGL2RenderingContext, base: string, art: V3Art): Promise<LoadedArt> {
  const all: WebGLTexture[] = [];
  const track = (t: Tex): Tex => (all.push(t.tex), t);
  const frontal = await Promise.all(art.frontal.layers.map(async (layer) => ({ layer, t: track(await loadPlaced(gl, base, layer)) })));
  const keys = new Map<string, { back: Tex; front: Tex }>();
  for (const [id, k] of Object.entries(art.keys)) {
    keys.set(id, { back: track(await loadPlaced(gl, base, k.back)), front: track(await loadPlaced(gl, base, k.front)) });
  }
  const eyes = await Promise.all(
    [...art.patches.eyes].sort((a, b) => b.aperture - a.aperture).map(async (state) => ({ state, t: track(await loadPlaced(gl, base, state)) })),
  );
  const brows = new Map<string, Tex>();
  for (const [k, p] of Object.entries(art.patches.brows)) brows.set(k, track(await loadPlaced(gl, base, p)));
  const mouth = new Map<string, Tex>();
  for (const [k, p] of Object.entries(art.patches.mouth)) mouth.set(k, track(await loadPlaced(gl, base, p)));
  return { frontal, keys, eyes, brows, mouth, fringeLiftPx: art.fringeLiftPx, all };
}
