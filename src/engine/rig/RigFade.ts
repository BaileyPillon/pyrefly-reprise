/**
 * THE RIG'S VARIANT CROSS-FADE (format v2.1 `RigKey.fadeMs`; decision 153a; `?motion=demo`, `motion/DemoMotion.ts`; both games, shared plumbing; pure TypeScript: no `three`, no DOM).
 *
 * Format v2 (`RigPartState.ts`) swaps a part's image, shows it or hides it **at progress 0.5 of the move into a key**: one frame, a flip. Hidden under the bones' motion it passes; on a part
 * that is a whole front-view upper body, a head or a mouth it is a pop, and it shows in motion (Bailey, 2026-10-19: "rigs are judged in motion"). Under the demo switch a state change that
 * a key makes **cross-fades**: the part keeps its old look on a second mesh (the ghost) while the new look comes up on the first.
 *
 * - **How long:** the key's `fadeMs` (v2.1); else {@link fadeMsFor}: {@link DEFAULT_FADE_MS} for a change of a small part of the figure, shortened to {@link LARGE_FADE_MS} as the share of the figure that
 *   changes image grows (release 61, PR-0478 of the release 60 deep review: a move that swaps the whole figure's images, Bahamut's idle to attack, showed TWO figures for 4 to 6 frames at 110 ms, because the two
 *   paintings' outlines are far apart); `0` is a cut (a smear frame is meant to snap), and nothing past {@link FADE_MS_MAX} is believed.
 * - **When:** centred on 0.5 of the move, so it starts a little before the flip would have fallen and ends a little after ({@link fadeStart}); never before 0.05 of the move.
 * - **The shape** ({@link fadePair}): the new look comes up over the first 70 percent and sits on top of the old one; the old one stays whole until 30 percent and goes out over the rest. The
 *   two together always cover at least 0.96 of what one whole look covers, so a head does not go see-through in the middle of its change (a plain `1 - u`, `u` pair covers 0.75 there).
 * - **The clock is the real one:** a hit-stop that holds the field never freezes a half-mixed pair of images (`PoseBlend.ts` rule 5, the lesson of FB-1).
 *
 * The state a key asks for is still the pure function of the key and the file (`RigPartState.keyState`), and the rig gate and its agreement test still use the flip at 0.5: the fade is
 * how the runtime draws the change, not what the change is. Without the switch nothing here runs. Every number is `[ours]`.
 */
import type { RigKey } from '../../data/art/rigTypes.ts';

/** The cross-fade when a key says nothing, ms. */
export const DEFAULT_FADE_MS = 110;
/** No fade runs longer than this, whatever a file says, ms. */
export const FADE_MS_MAX = 400;
/** The earliest a fade may begin, as progress through the move into its key. */
export const FADE_EARLIEST = 0.05;
/** The cross-fade of a move that swaps (nearly) the whole figure's images, ms: about two frames, so the two outlines overlap for one or two frames and not six. */
export const LARGE_FADE_MS = 40;
/** The share of the figure's mesh area that changes image: at or below the first the key's default fade stands, at or above the second it is {@link LARGE_FADE_MS}, a smooth step between. */
export const SWAP_SHARE_FROM = 0.25;
export const SWAP_SHARE_TO = 0.75;

/** The fade length a key asks for, ms: its `fadeMs`, else the default; 0 (a cut) stays 0; capped at {@link FADE_MS_MAX}. */
export function fadeMsOf(key: Pick<RigKey, 'fadeMs'> | undefined): number {
  const f = key?.fadeMs;
  if (f === undefined) return DEFAULT_FADE_MS;
  if (!Number.isFinite(f) || f <= 0) return 0;
  return Math.min(FADE_MS_MAX, f);
}

/** The progress of a move of `moveMs` at which a fade of `fadeMs` should begin so that it is centred on 0.5. */
export function fadeStart(moveMs: number, fadeMs: number): number {
  if (!(moveMs > 0) || !(fadeMs > 0)) return 0.5;
  return Math.min(0.5, Math.max(FADE_EARLIEST, 0.5 - fadeMs / (2 * moveMs)));
}

const smooth = (x: number): number => {
  const t = x < 0 ? 0 : x > 1 ? 1 : x;
  return t * t * (3 - 2 * t);
};

/** The area of a triangle mesh, flat x/y pairs and flat indices (painting px squared). */
export function meshAreaOf(verts: ArrayLike<number>, tris: ArrayLike<number>): number {
  let a = 0;
  for (let t = 0; t + 2 < tris.length; t += 3) {
    const i = tris[t]! * 2;
    const j = tris[t + 1]! * 2;
    const k = tris[t + 2]! * 2;
    a += Math.abs((verts[j]! - verts[i]!) * (verts[k + 1]! - verts[i + 1]!) - (verts[k]! - verts[i]!) * (verts[j + 1]! - verts[i + 1]!)) / 2;
  }
  return a;
}

/** What the fade needs of a rig: each part's mesh (a `RigData` is one). */
export interface MeshParts {
  parts: ReadonlyArray<{ verts: ArrayLike<number>; triangles: ArrayLike<number> }>;
}

const areasOf = new WeakMap<object, Float64Array>();
/** Each part's own mesh area, in `data.parts` order (cached: a rig's meshes do not change). */
export function partAreas(data: MeshParts): Float64Array {
  let a = areasOf.get(data);
  if (!a) areasOf.set(data, (a = Float64Array.from(data.parts, (p) => meshAreaOf(p.verts, p.triangles))));
  return a;
}

/** Of the parts that are drawn in either state, the share of their mesh area (0 to 1) whose state differs: a head's mouth is a few percent, a move that swaps every part's image is 1. */
export function swapShare(areas: ArrayLike<number>, from: Int16Array, to: Int16Array): number {
  let changed = 0;
  let total = 0;
  for (let i = 0; i < areas.length; i++) {
    const a = areas[i]!;
    const f = from[i] ?? -1;
    const t = to[i] ?? -1;
    if (f === -2 && t === -2) continue; // hidden in both (RigPartState.HIDDEN)
    total += a;
    if (f !== t) changed += a;
  }
  return total > 0 ? changed / total : 0;
}

/**
 * The cross-fade of a move from the state `from` into the key `key` whose state is `to`, ms. A key that says `fadeMs` is believed (0 is a cut). Otherwise {@link DEFAULT_FADE_MS} for a change of a small
 * part of the figure, and the larger the share of the figure whose image changes ({@link swapShare}) the shorter, down to {@link LARGE_FADE_MS}: two paintings of two poses overlap little, so a long
 * cross-fade of all of them is two figures on the screen at once (PR-0478).
 */
export function fadeMsFor(data: MeshParts, key: Pick<RigKey, 'fadeMs'> | undefined, from: Int16Array, to: Int16Array): number {
  if (key?.fadeMs !== undefined) return fadeMsOf(key);
  const k = smooth((swapShare(partAreas(data), from, to) - SWAP_SHARE_FROM) / (SWAP_SHARE_TO - SWAP_SHARE_FROM));
  return Math.round(DEFAULT_FADE_MS - (DEFAULT_FADE_MS - LARGE_FADE_MS) * k);
}

/** How much of the new look (`inn`) and of the old one (`out`) shows `u` of the way through a fade (0 to 1). The new look is drawn over the old one. */
export function fadePair(u: number): { inn: number; out: number } {
  return { inn: smooth(u / 0.7), out: 1 - smooth((u - 0.3) / 0.7) };
}

/** What the two looks cover together, 0 to 1, when drawn one over the other with normal alpha: `1 - (1 - inn) * (1 - out)`. */
export function fadeCover(u: number): number {
  const { inn, out } = fadePair(u);
  return 1 - (1 - inn) * (1 - out);
}
