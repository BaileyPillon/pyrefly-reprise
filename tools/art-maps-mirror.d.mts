/** Types for `tools/art-maps-mirror.mjs` (release 60: a release art mirror that carries the lighting maps). */

export interface PngDims {
  width: number;
  height: number;
  /** Bits per channel: 8 for the normal maps, 16 for the depth maps. */
  depth: number;
}
export declare function pngDims(file: string): PngDims | null;

export interface MapFile {
  /** The path in the mirror (forward slashes): `characters/tidus/idle.normal.png`, `backdrops/gagazet.depth.png`. */
  rel: string;
  /** The file in the maps folder it is linked from. */
  from: string;
  kind: 'normal' | 'depth';
  subject?: string;
  state?: string;
  /** 1 = the base map, 2 = `@2x`. */
  scale: number;
  /** The painting it lies over, in the mirror. */
  painting: string;
}

export interface MapsMirrorPlan {
  ok: boolean;
  problems: string[];
  links: string[];
  maps: MapFile[];
  /** Maps asked for (a chosen state, a tier) that the maps folder does not hold: not linked, not listed, not asked for by the game. */
  uncovered: string[];
  subjects: string[];
  backdrops: string[];
  tiers: number[];
}

export declare function planMapsMirror(o: { from: string; mapsRoot: string; to: string; subjects?: string[]; backdrops?: string[]; tiers?: number[] }): MapsMirrorPlan;

export declare function buildMapsMirror(o: { from: string; to: string; plan: MapsMirrorPlan; log?: (m: string) => void }): { linked: number; maps: number; lightMaps: { normal: number; subjects: number; depth: number } };

export declare function verifyMapsMirror(o: { from: string; to: string; plan: MapsMirrorPlan }): { ok: boolean; problems: string[]; files: number; linked: number; maps: number; bytes: number };
