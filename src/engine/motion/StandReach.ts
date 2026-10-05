/**
 * **The strike follows the stand** (r39-looks, FFX only; no `three`, no DOM).
 *
 * The house lunge is a fixed 1.4 world units (`BattlePresenterBeats.actionStart`), tuned against the stage's own formations: there it carries a
 * fighter to the foe's near edge or past it. A staging row (`fx/mix/stageTable.ts`) moves the figures after the stage seats them, and Chapter III's
 * is a big move: the boss stands 2.6 right and 0.95 back of its seat, the party 0.35 right. The same 1.4 then stopped short of the boss (Tidus's
 * painted box ended 70 px clear of the boss's instead of 204 px inside it, and 165 px of painted air stood between their painted shapes where the stage's
 * own formation touches them: 1600x900, `docs/handoff/r39-looks.md`, honest cost 6). A strike that does not reach its target is a defect, and a longer fixed lunge is the wrong repair: the
 * fighter is in front of the camera and the boss is far behind it, so a world unit of lunge is about four times as many pixels as a world unit of the
 * boss's move (the first try, "lunge the boss's 2.26 further", ran Tidus across the whole frame and behind the party panel). The relation that has to
 * come back is the one on the screen.
 *
 * So a row that sets `follow` (Chapter III's) makes the MAX mix's staging register every figure's table move here each frame (`Staging.apply`; nothing
 * while the table is off: `?stand=off`, the phone, EYE CANDY off, FFX-2), and the strike is solved against the screen: {@link reachAlong} finds the
 * lunge that leaves the fighter's painted box and its target's the same lateral gap at the apex as the stage's own seats do, the two figures put back
 * where the table found them and lunging today's 1.4, both boxes read through the camera the shot is settling on (`StageMotionPort.rect`, `at`).
 * Never less than today's lunge and never more than {@link REACH_CAP} further. It restores the relation the fight had without the table, and no other:
 * a fight whose row does not ask (Chapter II: its smaller move leaves every strike landing, Tidus's box overlaps Yunalesca's by about 195 px at the
 * apex), a fight with no row, and every FFX-2 fight register nothing, so their lunges are today's, to the unit. Per target: Tidus on the boss, on
 * the left pagoda and on the right one each get their own reach.
 *
 * Game case (AGENTS.md rule 14): FFX only. The rows are FFX-only (`standFor` is null for FFX-2), FFX-2's strike has its own RUN-IN
 * (`app/screens/BattleScreenRunIn.ts`: she runs to the foe and the lunge only carries the blow) and a long-range dressphere fires from where she
 * stands. Presentation only: no engine state, no RNG, no timing (the lunge keeps its 440 ms and its apex at 0.58).
 *
 * Keyed by the figure object (weakly, as `PlaceOwner.ts` is), so nothing is left behind when a figure goes; no setting, no save key.
 */
import type { Rect } from './StageMotionPort.ts';

/** The most a row may add to a lunge, world units (a row that opens a bigger gap is a design question, not a longer lunge). */
export const REACH_CAP = 3;

/** How a table moved a figure on the floor, world units (the same `dx`, `dz` `fx/mix/staging.ts` adds to its place). */
export interface StandShift {
  dx: number;
  dz: number;
}

const moved = new WeakMap<object, StandShift>();

/**
 * Register (or, with `null` or a zero move, forget) how far the table moved `figure`. Called by the staging every frame for every figure it
 * writes, so a table that lets go (the next link's fiends are on the stage, a switch turned off) leaves nothing here.
 */
export function standMove(figure: object, shift: StandShift | null): void {
  if (!shift || !Number.isFinite(shift.dx) || !Number.isFinite(shift.dz) || (shift.dx === 0 && shift.dz === 0)) moved.delete(figure);
  else moved.set(figure, { dx: shift.dx, dz: shift.dz });
}

/** How the table moved `figure` (null: it stands where the stage seats it). */
export function standMoveOf(figure: object | undefined): StandShift | null {
  return figure ? (moved.get(figure) ?? null) : null;
}

/** What {@link reachAlong} needs to see: the two painted boxes on screen, where the fighter would stand after `along` of lunge, and the stage's own seats. */
export interface ReachWorld {
  /** +1: the fighter faces +x (the party's, an aeon's); -1: it faces -x (a fiend's). */
  dir: 1 | -1;
  /**
   * The fighter's painted box on screen with its feet carried `along` world units along its facing from where it stands; with `seat`, from where the stage
   * seats it (the table's move undone). Null when it is not on the field.
   */
  attacker(along: number, seat: boolean): Rect | null;
  /** The target's painted box on screen, where it stands now, or (`seat`) where the stage seats it. */
  target(seat: boolean): Rect | null;
}

/** The lateral gap between the two boxes, in the fighter's own direction: positive is air between them, negative is how far the fighter's box has gone into the target's. */
export function lateralGap(dir: 1 | -1, a: Rect, t: Rect): number {
  return dir > 0 ? t.x - (a.x + a.w) : a.x - (t.x + t.w);
}

/**
 * The lunge, world units, that leaves the fighter and its target the lateral gap their stage seats leave at the apex of today's `base` lunge: `base` when the
 * table cost the strike nothing (or when a box is unknown), else more, by at most {@link REACH_CAP}. The screen gap is nearly linear in the lunge (a camera
 * with some yaw bends it a little), so a secant search with a few steps lands on it.
 */
export function reachAlong(base: number, w: ReachWorld): number {
  const aSeat = w.attacker(base, true);
  const tSeat = w.target(true);
  if (!aSeat || !tSeat) return base;
  const want = lateralGap(w.dir, aSeat, tSeat); // where the stage's own formation leaves the strike
  if (!Number.isFinite(want)) return base;
  const t = w.target(false);
  const gapAt = (l: number): number | null => {
    const a = w.attacker(l, false);
    return a && t ? lateralGap(w.dir, a, t) : null;
  };
  const g0 = gapAt(base);
  if (g0 === null || !Number.isFinite(g0) || g0 <= want + 0.5) return base; // already as close as the stage's own seats get it (half a pixel)
  const top = base + REACH_CAP;
  let l0 = base;
  let l1 = Math.min(top, base + 1);
  let f0 = g0 - want;
  let f1 = gapAt(l1);
  if (f1 === null || !Number.isFinite(f1)) return base;
  f1 -= want;
  for (let i = 0; i < 6 && Math.abs(f1) > 0.5; i++) {
    const slope = (f1 - f0) / (l1 - l0);
    if (!(slope < 0)) return base; // a gap that does not close with the lunge (a box that went missing): leave today's
    const next = Math.min(top, Math.max(base, l1 - f1 / slope));
    if (next === l1) break; // at the cap (or at today's lunge): that is as far as it goes
    l0 = l1;
    f0 = f1;
    l1 = next;
    const f = gapAt(l1);
    if (f === null || !Number.isFinite(f)) return base;
    f1 = f - want;
  }
  return Math.min(top, Math.max(base, l1));
}
