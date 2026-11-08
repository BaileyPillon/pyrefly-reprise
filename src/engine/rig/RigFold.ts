/**
 * FOLD MOVES (rigs-v3, 2026-10-29; both games, shared plumbing; pure: no `three`, no DOM).
 *
 * A rig drawn as one painting PER KEY (the party method: every part of a key is cut from that key's own painting, `RigPartState.ts`) moves between two keys by turning rigid pieces from one pose
 * to the other and swapping the images half way (a cut, `partStateAt`). Where a bone turns a long way (the greatsword of Rikku's Dark Knight, 149 degrees from the follow-through to the idle;
 * 170 from the idle to the cast) the piece is, for the middle frames of the move, a sword lying flat across a body that is drawn in the other pose: the clips of 2026-10-29 count four such
 * frames in `follow>idle` (a 132 ms move at the page's pace), "a visibly broken figure". The audit that replays the engine's moves (`tools/rig/lane/party/fold_audit.mjs`) reads it as a piece drawn
 * more than {@link FOLD_DEG} off the angle of the key its image was painted in.
 *
 * Two rules, both of the move and not of the file (the pieces and the keys are the pipeline's, the format is unchanged):
 *
 * 1. **The short way round** ({@link shortestWay}). A key stores a rotation as the retarget found it, and for Tidus's `ready`, `attack` and `defend` the forearm sits at 183, 242 and 212 degrees: a turn from the idle
 *    (0) to the attack interpolated through 242 degrees where the same drawing is 118 degrees the other way (the retarget is exact, a rotation is the same pose modulo a turn). The transition now takes the
 *    shorter of the two ways to every rotation, so the limb does not swing through a flail to land where it was always going.
 * 2. **A fast fold** ({@link foldMs}). Where a bone still turns {@link FOLD_RAD} or more in a move the file authored at 100 to 199 ms, the move takes {@link FOLD_MS} ms (3 frames at the page's pace instead of 7 or 8), so the
 *    middle of the turn is one frame, not four. The brief's "key timing".
 *
 * Both apply to a figure drawn by pose (a rig with part images) on the party's side only: `RigActor.poseDrawnParty`. Nothing else changes: the key's own `ms` stays what the file says, a move that turns less
 * is played as asked, `immediate` is still a snap, and the key's value is the same pose (the transition ends on the equivalent angle).
 */
import { C_ROT, CH } from './RigSkeleton.ts';

/** A bone that turns this far (radians; 115 degrees, the short way round) in one move makes it a fold move. */
export const FOLD_RAD = 2.0;
/** What a fold move takes at most, ms (before the page's pace factor, which stretches it by 1.1 or 1.2). */
export const FOLD_MS = 50;
/** Only a move the file authored between {@link FOLD_FROM_MS} and {@link SLOW_MS} is capped: a key of under 100 ms is already 4 or 5 frames (a shorter one would only step the figure further a frame: Rikku's ready>attack head step 368 to 533 master px), and a key of 200 ms or more (critical, sleep, victory, ko) is a slow move by design, a figure sinking into a stance, not an action pose. */
export const FOLD_FROM_MS = 100;
export const SLOW_MS = 200;
/** The audit's line: a visible piece drawn this many degrees off the angle of the key its image was painted in is a folded piece. */
export const FOLD_DEG = 35;

const TAU = Math.PI * 2;
/** A turn wrapped to the shorter way round, -pi to pi. */
const wrap = (d: number): number => d - TAU * Math.round(d / TAU);

/**
 * `to` with every rotation channel moved by whole turns to the angle nearest `from`'s (the same pose, the shorter way there). The array itself when nothing changes (the compiled keys are shared and
 * never written); a copy otherwise.
 */
export function shortestWay(from: Float64Array, to: Float64Array): Float64Array {
  let out: Float64Array | null = null;
  const n = Math.min(from.length, to.length);
  for (let i = C_ROT; i < n; i += CH) {
    const d = to[i]! - from[i]!;
    if (Math.abs(d) <= Math.PI) continue;
    out ??= Float64Array.from(to);
    out[i] = from[i]! + wrap(d);
  }
  return out ?? to;
}

/** The largest turn (radians, the shorter way round) any bone makes between two poses (channel arrays of `CH` numbers a bone). */
export function maxTurn(from: Float64Array, to: Float64Array): number {
  let m = 0;
  const n = Math.min(from.length, to.length);
  for (let i = C_ROT; i < n; i += CH) m = Math.max(m, Math.abs(wrap(to[i]! - from[i]!)));
  return m;
}

/** The length of a move into a key that takes `ms`, from the pose `from` to the pose `to`: {@link FOLD_MS} where a bone turns {@link FOLD_RAD} or more and `ms` is in the capped range ({@link FOLD_FROM_MS} up to {@link SLOW_MS}), else `ms`. */
export function foldMs(ms: number, from: Float64Array, to: Float64Array): number {
  return ms >= FOLD_FROM_MS && ms < SLOW_MS && maxTurn(from, to) >= FOLD_RAD ? FOLD_MS : ms;
}
