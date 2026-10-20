/**
 * THE RIG'S VARIANT CROSS-FADE (format v2.1 `RigKey.fadeMs`; decision 153a; `?motion=demo`, `motion/DemoMotion.ts`; both games, shared plumbing; pure TypeScript: no `three`, no DOM).
 *
 * Format v2 (`RigPartState.ts`) swaps a part's image, shows it or hides it **at progress 0.5 of the move into a key**: one frame, a flip. Hidden under the bones' motion it passes; on a part
 * that is a whole front-view upper body, a head or a mouth it is a pop, and it shows in motion (Bailey, 2026-10-19: "rigs are judged in motion"). Under the demo switch a state change that
 * a key makes **cross-fades**: the part keeps its old look on a second mesh (the ghost) while the new look comes up on the first.
 *
 * - **How long:** the key's `fadeMs` (v2.1), else {@link DEFAULT_FADE_MS}; `0` is a cut (a smear frame is meant to snap), and nothing past {@link FADE_MS_MAX} is believed.
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

/** How much of the new look (`inn`) and of the old one (`out`) shows `u` of the way through a fade (0 to 1). The new look is drawn over the old one. */
export function fadePair(u: number): { inn: number; out: number } {
  return { inn: smooth(u / 0.7), out: 1 - smooth((u - 0.3) / 0.7) };
}

/** What the two looks cover together, 0 to 1, when drawn one over the other with normal alpha: `1 - (1 - inn) * (1 - out)`. */
export function fadeCover(u: number): number {
  const { inn, out } = fadePair(u);
  return 1 - (1 - inn) * (1 - out);
}
