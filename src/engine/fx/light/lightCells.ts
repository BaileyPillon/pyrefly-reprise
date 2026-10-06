import { Color, Vector2, Vector3, Vector4, type Texture } from 'three';
import type { BackdropMap } from './backdropField.ts';
import { tuned } from './lightFlags.ts';
import type { RoomKey, RoomLight } from './rooms.ts';

/**
 * Figure lighting MOCKUPS (`lightFlags.ts`): the uniform cells the injected block reads (`lightShader.ts`), the pick of the two keys
 * that matter to a figure, the writing of a key into a plane's own axes, and the look's numbers. Split from the driver
 * (`FigureLight.ts`) to keep both under 400 lines (rule 7). Presentation only (rule 1).
 */

export type Cell<T> = { value: T };

/** Everything the block reads. The `lg` cells shared by every slot are built once; the rest are one set per slot. */
export interface Shared {
  mode: Cell<number>;
  k: Cell<number>;
  time: Cell<number>;
  back: Cell<Texture | null>;
  backM: Cell<Vector4>;
  backO: Cell<Vector2>;
}

export interface SlotCells {
  [k: string]: Cell<unknown>;
  lgSize: Cell<Vector2>;
  lgBand: Cell<number>;
  lgN0: Cell<Vector2>;
  lgNx: Cell<Vector2>;
  lgNy: Cell<Vector2>;
  lgKeyA: Cell<Vector4>;
  lgDirA: Cell<Vector3>;
  lgKeyB: Cell<Vector4>;
  lgDirB: Cell<Vector3>;
  lgAmb: Cell<Color>;
  lgSky: Cell<Color>;
  lgBounce: Cell<Color>;
  lgHead: Cell<Vector4>;
  lgFace: Cell<number>;
  lgNormal: Cell<Texture | null>;
  lgHasN: Cell<number>;
  lgT1: Cell<Vector4>;
  lgT2: Cell<Vector4>;
}


const lumaOf = (c: Color): number => c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722;

/** A colour at a given luma (the hue kept, `soft` of the way toward white first): the ambient, the sky and the bounce enter the maths as hues. */
export function atLuma(hex: number, luma: number, soft = 0): Color {
  const c = new Color(hex);
  if (soft > 0) c.lerp(new Color(1, 1, 1), soft);
  return c.multiplyScalar(luma / Math.max(lumaOf(c), 1e-3));
}

const peakedCache = new Map<number, Color>();

/** A colour with its largest channel at 1 (the strength of a key is carried by its weight, not its colour). */
function peaked(hex: number): Color {
  let c = peakedCache.get(hex);
  if (!c) {
    c = new Color(hex);
    c.multiplyScalar(1 / Math.max(c.r, c.g, c.b, 1e-3));
    peakedCache.set(hex, c);
  }
  return c;
}

export function makeShared(): Shared {
  return {
    mode: { value: 0 },
    k: { value: 1 },
    time: { value: 0 },
    back: { value: null },
    backM: { value: new Vector4(1, 0, 0, 1) },
    backO: { value: new Vector2() },
  };
}

/** One set of cells for one painted plane; the cells shared by every plane are the `shared` ones. */
export function makeSlotCells(sh: Shared): SlotCells {
  return {
    lgMode: sh.mode,
    lgK: sh.k,
    lgTime: sh.time,
    lgBackTex: sh.back,
    lgBackM: sh.backM,
    lgBackO: sh.backO,
    lgSize: { value: new Vector2(1, 1) },
    lgBand: { value: 0.05 },
    lgN0: { value: new Vector2() },
    lgNx: { value: new Vector2(1, 0) },
    lgNy: { value: new Vector2(0, 1) },
    lgKeyA: { value: new Vector4() },
    lgDirA: { value: new Vector3(0, 0, 1) },
    lgKeyB: { value: new Vector4() },
    lgDirB: { value: new Vector3(0, 0, 1) },
    lgAmb: { value: new Color(0.5, 0.5, 0.5) },
    lgSky: { value: new Color(1, 1, 1) },
    lgBounce: { value: new Color(1, 1, 1) },
    lgHead: { value: new Vector4() },
    lgFace: { value: 0 },
    lgNormal: { value: null },
    lgHasN: { value: 0 },
    lgT1: { value: new Vector4() },
    lgT2: { value: new Vector4(0, 0.55, 0.7, 1.18) },
  } as SlotCells;
}

/** The two keys that matter most to a figure at NDC (x, y): strong and near. */
export function pickKeys(keys: readonly RoomKey[], bmap: BackdropMap, fx: number, fy: number, aspect: number): { col: Color; w: number; front: number; dx: number; dy: number }[] {
  const out = keys.map((k) => {
    const u = k.at[0];
    const v = 1 - k.at[1];
    const kx = bmap.n0[0] + u * bmap.nx[0] + v * bmap.ny[0];
    const ky = bmap.n0[1] + u * bmap.nx[1] + v * bmap.ny[1];
    const dx = (kx - fx) * aspect;
    const dy = ky - fy;
    return { col: peaked(k.col), w: k.w, front: k.front, dx, dy, score: k.w / (0.6 + dx * dx + dy * dy) };
  });
  out.sort((p, q) => q.score - p.score);
  const a = out[0]!;
  const b = out[1] ?? { ...a, w: 0 };
  return [a, b];
}


export function writeKeys(c: SlotCells, keys: { col: Color; w: number; front: number; dx: number; dy: number }[], aspect: number, amb: Color, sky: Color, bounce: Color): void {
  // The plane's own axes on the screen (a mirrored plane has its x pointing left).
  const ex = c.lgNx.value;
  const ey = c.lgNy.value;
  const exl = Math.hypot(ex.x * aspect, ex.y) || 1;
  const eyl = Math.hypot(ey.x * aspect, ey.y) || 1;
  const dirs = [c.lgDirA.value, c.lgDirB.value];
  const cols = [c.lgKeyA.value, c.lgKeyB.value];
  keys.forEach((k, i) => {
    const len = Math.hypot(k.dx, k.dy) || 1;
    const sx = k.dx / len;
    const sy = k.dy / len;
    const px = (sx * ex.x * aspect + sy * ex.y) / exl;
    const py = (sx * ey.x * aspect + sy * ey.y) / eyl;
    const lat = 1 - k.front;
    dirs[i]!.set(px * lat, py * lat, k.front).normalize();
    cols[i]!.set(k.col.r, k.col.g, k.col.b, k.w);
  });
  c.lgAmb.value.copy(amb);
  c.lgSky.value.copy(sky);
  c.lgBounce.value.copy(bounce);
}


/** The look's numbers (every one can be overridden at capture time: `__pyrefly.fx.light.tune`). */
export function writeTune(c: SlotCells, mode: number, room: RoomLight): void {
  const t1 = c.lgT1.value;
  const t2 = c.lgT2.value;
  const wrap = tuned('wrap', 1.5) * room.wrap;
  if (mode === 1) t1.set(wrap * 1.0, tuned('glint', 0.9), 0, 0);
  else if (mode === 2) t1.set(wrap * 0.8, tuned('glint', 0.75), tuned('shade', 1.0), 0);
  else t1.set(wrap * 0.9, tuned('glint', 0.8), 0, tuned('grad', 0.25));
  t2.set(tuned('glow', 0.6), tuned('glowThr', 0.55), tuned('floor', 0.62), tuned('ceil', 1.18));
}

