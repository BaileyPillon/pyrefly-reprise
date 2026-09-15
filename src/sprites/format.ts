/**
 * Sprite authoring format — **stable contract**.
 *
 * A sprite is data: a palette, a set of named animation states, and frames that
 * are either a literal pixel grid (`rows`) or a list of shape ops rasterised by
 * `raster.ts`. Nothing here touches the DOM, so sprite data modules are plain
 * TypeScript with **type-only imports** and can be loaded straight by Node
 * (`node --experimental-strip-types`, on by default in Node 22.18+/24) for the
 * `tools/render-sprite.mjs` preview loop.
 *
 * See `docs/SPRITE-GUIDE.md` for the authoring guide.
 */

/** `#rgb`, `#rrggbb`, `#rrggbbaa`, or the literal `'transparent'`. */
export type Hex = string;

/** A key into {@link Palette}. Must be exactly one character to be usable in `rows`. */
export type ColourKey = string;

/** Colour key -> colour. Keep it to 24 entries or fewer. */
export type Palette = Record<ColourKey, Hex>;

/** The character that always means "no pixel" inside a `rows` grid. */
export const TRANSPARENT_CHAR = '.';

// ---------------------------------------------------------------- shading

/** Where the key light comes from. Screen space: `top` is -y. */
export type LightDir =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * A cheap two-band shading pass: the 1-px rim facing the light is lifted, the
 * 1-px rim facing away is dropped. Either give explicit palette keys (crisper,
 * fewer colours) or let the pass tint each pixel's own colour by `strength`.
 */
export interface ShadingSpec {
  light: LightDir;
  /** Palette key painted on the lit rim. Omit to tint the pixel's own colour. */
  lightKey?: ColourKey;
  /** Palette key painted on the shadow rim. Omit to tint the pixel's own colour. */
  shadeKey?: ColourKey;
  /** 0..1 mix amount when tinting. Default 0.3. */
  strength?: number;
  /** Colour tinted toward on the lit rim when `lightKey` is absent. Default `#ffffff`. */
  lightTint?: Hex;
  /** Colour tinted toward on the shadow rim when `shadeKey` is absent. Default `#0d1020`. */
  shadeTint?: Hex;
  /**
   * `'silhouette'` (default) only shades rims against empty space.
   * `'keys'` also shades where the neighbouring pixel is a different material.
   */
  edges?: 'silhouette' | 'keys';
}

// ---------------------------------------------------------------- shape ops

export interface OpCommon {
  /**
   * `false` — this shape's pixels never emit a silhouette outline.
   * a `ColourKey` — outline pixels touching this shape use that colour
   * (per-material outlines read far better than one flat black).
   */
  outline?: boolean | ColourKey;
  /** `false` excludes the shape from the frame's shading pass. */
  shade?: boolean;
}

export interface EllipseOp extends OpCommon {
  op: 'ellipse';
  /** Centre. Integer centres give odd diameters (`2*r + 1`); use `x.5` for even. */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: ColourKey;
  /** Default true. `false` strokes the rim only. */
  fill?: boolean;
  /** Stroke width when `fill` is false. Default 1. */
  thickness?: number;
}

export interface RectOp extends OpCommon {
  op: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  color: ColourKey;
  /** Default true. `false` strokes the border only. */
  fill?: boolean;
  /** Corner pixels removed, chamfer style. Default 0. */
  radius?: number;
}

export interface PolyOp extends OpCommon {
  op: 'poly';
  points: Array<[number, number]>;
  color: ColourKey;
  /** Default true — even-odd scanline fill. `false` strokes the edges only. */
  fill?: boolean;
  /** Default true — always stamp the boundary so thin shapes survive. */
  strokeEdges?: boolean;
}

export interface LineOp extends OpCommon {
  op: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: ColourKey;
  /** Square brush size in pixels. Default 1. */
  thickness?: number;
}

export interface ArcOp extends OpCommon {
  op: 'arc';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Degrees. 0 = +x, increasing clockwise on screen (y grows downward). */
  from: number;
  to: number;
  color: ColourKey;
  thickness?: number;
}

/** Hand-placed pixels. `rows` are palette characters; `.` is transparent. */
export interface PixelsOp extends OpCommon {
  op: 'pixels';
  x: number;
  y: number;
  rows: string[];
}

/** Draws `ops`, then draws them again mirrored across a vertical axis. */
export interface MirrorOp extends OpCommon {
  op: 'mirror';
  ops: ShapeOp[];
  /** Mirror axis in pixels. Default: the sprite's vertical centre, `(width - 1) / 2`. */
  axis?: number;
  /** Default true — keep the original ops as well as the mirrored copy. */
  keep?: boolean;
}

export type ShapeOp =
  | EllipseOp
  | RectOp
  | PolyOp
  | LineOp
  | ArcOp
  | PixelsOp
  | MirrorOp;

// ---------------------------------------------------------------- frames

/** Hand-placed detail stamped after the shading pass (faces, buckles, glints). */
export interface PixelOverlay {
  x: number;
  y: number;
  rows: string[];
}

/** A reference to a named frame in {@link SpriteDef.frames}, used as a layer. */
export type BaseRef =
  | string
  | {
      frame: string;
      /** Shift just this layer. */
      offset?: [number, number];
    };

export interface FrameCommon {
  /** Silhouette outline colour. `false` disables it. Falls back to `SpriteDef.outline`. */
  outline?: ColourKey | false;
  /** Shading pass. `false` disables it. Falls back to `SpriteDef.shading`. */
  shading?: ShadingSpec | false;
  /** Milliseconds this frame is held. Falls back to `1000 / fps`. */
  duration?: number;
  /** Shift the whole frame (all layers) by `[dx, dy]`. */
  offset?: [number, number];
  /** Stamped last, after shading, before the outline pass. */
  overlays?: PixelOverlay[];
}

/** A literal pixel grid: one character per pixel, `.` = transparent. */
export interface RowsFrame extends FrameCommon {
  rows: string[];
}

/** A frame built from shape ops. */
export interface OpsFrame extends FrameCommon {
  ops: ShapeOp[];
}

/**
 * Layer composition: reuse one or more named frames as a base pose, then add
 * deltas on top. This is how animations avoid restating the whole body.
 */
export interface LayeredFrame extends FrameCommon {
  base: BaseRef | BaseRef[];
  ops?: ShapeOp[];
  rows?: string[];
}

export type Frame = RowsFrame | OpsFrame | LayeredFrame;

/** Structural view of a frame, for code that walks frames generically. */
export type AnyFrame = FrameCommon & {
  rows?: string[];
  ops?: ShapeOp[];
  base?: BaseRef | BaseRef[];
};

/** Per-state playback hints; mirrors `SpriteActor`'s `SpriteStateOptions`. */
export interface StateOptions {
  /** Default true. A non-looping state holds its last frame. */
  loop?: boolean;
  /** State to fall through to when a non-looping state ends. */
  next?: string;
}

// ---------------------------------------------------------------- sprite

export interface SpriteDef {
  /** File-safe identifier, e.g. `tidus`. Used for output filenames. */
  name: string;
  /** `[width, height]` in logical pixels. Party 48x64, bosses up to 256x192. */
  size: [number, number];
  /** Feet point — where the sprite meets the ground, in sprite pixels. */
  anchor: [number, number];
  palette: Palette;
  /** State name -> ordered frames. `idle`, `ready`, `attack`, `hurt`, `ko`, `victory`, ... */
  states: Record<string, Frame[]>;
  defaultState: string;
  /** Default frame rate when a frame gives no `duration`. Default 6. */
  fps?: number;
  /** Suggested preview zoom for `tools/render-sprite.mjs`. Default 8. */
  scale?: number;
  /** Named frames usable as {@link LayeredFrame.base}. Never rendered directly. */
  frames?: Record<string, Frame>;
  /** Default silhouette outline colour for every frame. */
  outline?: ColourKey | false;
  /** Default shading pass for every frame. */
  shading?: ShadingSpec | false;
  /** Playback hints per state. */
  stateOptions?: Record<string, StateOptions>;
  /** One line about the design; shown in contact sheets and the guide. */
  description?: string;
}

// ---------------------------------------------------------------- helpers

/** True when a palette entry means "draw nothing". */
export function isTransparent(hex: Hex | undefined): boolean {
  return hex === undefined || hex === 'transparent' || hex === 'none' || hex === '';
}

/** Milliseconds a frame is held, honouring `duration` then `fps` then 6 fps. */
export function frameDuration(def: SpriteDef, frame: Frame): number {
  const d = (frame as FrameCommon).duration;
  if (typeof d === 'number' && d > 0) return d;
  return Math.round(1000 / (def.fps && def.fps > 0 ? def.fps : 6));
}

/** Every frame duration of a state, index-aligned with the frame list. */
export function stateDurations(def: SpriteDef, state: string): number[] {
  return (def.states[state] ?? []).map((f) => frameDuration(def, f));
}

/** Sorted state names, `defaultState` first. */
export function stateNames(def: SpriteDef): string[] {
  const names = Object.keys(def.states);
  return names.sort((a, b) =>
    a === def.defaultState ? -1 : b === def.defaultState ? 1 : names.indexOf(a) - names.indexOf(b),
  );
}
