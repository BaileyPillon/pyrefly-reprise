/**
 * THE CUT-SIDE ANCHOR (post-conference motion plan, item MF-18 of `D:/Tools/pyrefly-scratch/2026-10-26/fluidity/plan.json`; wave 1 of the 2026-10-28 program, lane pc-scope; pure: no `three`, no DOM, no
 * clock; both games).
 *
 * A cut inside the smear swaps one painting for another on the fastest frame, and the incoming painting's head sits where ITS drawing has it: Auron's return to his stance after a swing (heads 0.41 to 0.44
 * of his height apart) is a 140 to 175 px step in one frame, Yunalesca's attack to cast 133 px, Tidus's hurt to critical 190 px across. The continuity harness excuses a planned cut up to half the drawn
 * height, but the eye sees a head that is somewhere else. The plan's own fix is to "register or body-anchor the big cuts".
 *
 * **What this does.** On a cut whose two heads are more than {@link ANCHOR_CAP} of the figure's height apart (along x, the way `PoseAlign.planeAnchor` reads them, the harness's point), the INCOMING plane
 * is drawn that far back toward the old head (its `align`, the same sideways drift the aligned dissolve uses, `PaintedActor.placeSlot`), so the step at the cut is {@link ANCHOR_CAP} of the height and no
 * more. The cut itself is unchanged (the same window, the same streak, the same flash). From the cut the plane then GLIDES the rest of the way home on an ease-out ({@link glideOffset}), {@link GLIDE_MS_MIN}
 * to {@link GLIDE_MS_MAX} ms (never fewer than {@link GLIDE_FRAMES_MIN} frames of the display actually running): the head decelerates into the pose instead of being somewhere else, which is how a
 * hand-drawn smear frame works (the in-between is a streak, the arrival eases). The slide is sideways only, so the feet keep the floor line and the head keeps the pose's own height; and a figure on a
 * lunge is already travelling at 4 to 8 body heights a second, which hides a slide of 2 to 3.
 *
 * **What it does not do.** It does not touch the vertical part of a step (the kneel of `critical`, the bow of `hurt` are inside the painting, 0.1 to 0.25 of the height: Tidus's hurt to critical stays
 * about 120 to 150 px at the push-in even with the x part gone, and is named in the handoff), a pair under the cap, a rig (a rig key change has no planes to shift), a cut inside an open FFX-2 menu (none
 * is made there), or a blend. It does not change which swaps are cuts (`SmearPlan.CAUSE_MAX_ANCHOR` still keeps a cause cut across 0.4 or more at rest as today's blend).
 *
 * `?cutanchor=today|on|moving` (default {@link CUT_ANCHOR_DEFAULT}): `on` anchors every plane cut; `moving` only a cut made on a figure that is travelling (its speed at least `SmearPlan.MIN_SPEED`), where
 * the slide hides in the move; with the pack off (`?pack=off`, a phone, a tablet) it is `today`. Every number here is `[ours]`: the sources give no anchor, glide or ease (rule 6); they are tuned by the
 * prediction of `docs/handoff/pc-scope.md`, then judged in the clips.
 */
import { packDemo, queryWord } from './DemoGate.ts';
import { BIG_ANCHOR, MIN_SPEED } from './SmearPlan.ts';

export type CutAnchorMode = 'today' | 'on' | 'moving';

/** What `?cutanchor` reads when the address does not name a value: `today` (nothing changes) until the browser measurement has been read and the clips judged. ONE line to flip. */
export const CUT_ANCHOR_DEFAULT: CutAnchorMode = 'today';

/** The step left at the cut, a share of the figure's height: the planner's own line for "heads far apart" (`SmearPlan.BIG_ANCHOR`), so a cut is never left with far-apart heads. */
export const ANCHOR_CAP = BIG_ANCHOR;
/** The glide home: shortest and longest, real ms; it takes the longest at {@link GLIDE_FULL_SHARE} of the height or more to cover. */
export const GLIDE_MS_MIN = 80;
export const GLIDE_MS_MAX = 150;
export const GLIDE_FULL_SHARE = 0.32;
/** The glide is never fewer than this many frames of the display running (a 30 fps display gets 133 ms), and never longer than the cap. */
export const GLIDE_FRAMES_MIN = 4;
export const GLIDE_CAP_MS = 200;

let mode: CutAnchorMode | null = null;

/** `?cutanchor=` from a search string (pure): with the pack off `today`; else the word it names (`today`, `on`, `moving`), else {@link CUT_ANCHOR_DEFAULT}. */
export function cutAnchorFromSearch(search: string | undefined): CutAnchorMode {
  if (!packDemo(search)) return 'today';
  const w = queryWord(search, 'cutanchor');
  return w === 'today' || w === 'on' || w === 'moving' ? w : CUT_ANCHOR_DEFAULT;
}

/** The mode the page asked for. Read once. */
export function cutAnchorMode(): CutAnchorMode {
  return (mode ??= cutAnchorFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? '')));
}

/** Tests and `window.__pyrefly.swapSwitch({ cutAnchor })`: force the mode (`null` reads the address again). */
export function setCutAnchorMode(v: CutAnchorMode | null): void {
  mode = v;
}

/** True when a plane cut made on a figure moving at `speed` (body heights a second) gets the anchor. */
export function cutAnchorFor(speed: number, m: CutAnchorMode = cutAnchorMode()): boolean {
  return m === 'on' || (m === 'moving' && speed >= MIN_SPEED);
}

export interface AnchorInput {
  /** The incoming head's x minus the outgoing head's as drawn now, world units (`SmearFacts.anchorDx`, less any drift the outgoing plane still carries); null when unknown. */
  dx: number | null;
  /** The figure's height, world units. */
  height: number;
  /** The recent frame time of the display, ms (0 or less: unknown). */
  frameMs: number;
}

export interface AnchorPlan {
  /** Where the incoming plane is drawn at the cut, relative to its own place: signed world x (toward the old head). */
  shift: number;
  /** The glide home from the cut, real ms. */
  ms: number;
  /** `|shift|` as a share of the figure's height. */
  share: number;
}

/** The anchor for one cut, or null when the step is under the cap (or unknown): the incoming plane is drawn back so that `ANCHOR_CAP` of the height is what is left at the cut. */
export function anchorPlan(i: AnchorInput): AnchorPlan | null {
  if (i.dx === null || !Number.isFinite(i.dx) || !(i.height > 0)) return null;
  const over = Math.abs(i.dx) - ANCHOR_CAP * i.height;
  if (!(over > 0)) return null;
  const share = over / i.height;
  const base = GLIDE_MS_MIN + (GLIDE_MS_MAX - GLIDE_MS_MIN) * Math.min(1, share / (GLIDE_FULL_SHARE - ANCHOR_CAP));
  const frames = i.frameMs > 0 && Number.isFinite(i.frameMs) ? GLIDE_FRAMES_MIN * i.frameMs : 0;
  const ms = Math.round(Math.min(GLIDE_CAP_MS, Math.max(base, frames)));
  return { shift: -Math.sign(i.dx) * over, ms, share };
}

/** The offset still on the plane `elapsed` ms after the window began: all of `shift` until the cut (`holdMs`, the plane is not yet seen), then an ease-out to 0 over `ms` (the remaining part is `(1 - u) ** 2`). */
export function glideOffset(shift: number, ms: number, holdMs: number, elapsed: number): number {
  if (elapsed <= holdMs) return shift;
  const u = (elapsed - holdMs) / Math.max(1, ms);
  return u >= 1 ? 0 : shift * (1 - u) * (1 - u);
}

interface Glide {
  pose: string;
  shift: number;
  ms: number;
  holdMs: number;
  elapsed: number;
}

/**
 * The glides of one figure, one record per plane (two planes carry a figure): a plane that is going out keeps easing home until it is gone, so a swap that follows a swap never snaps the old plane
 * back. Pure bookkeeping: the actor writes the offsets (`SmearHost.shiftPlane`).
 */
export class CutGlide {
  private readonly rec: [Glide | null, Glide | null] = [null, null];

  /** True while any plane is still gliding. */
  get active(): boolean {
    return this.rec[0] !== null || this.rec[1] !== null;
  }

  /** The offset plane `i` carries now (0 when it has no glide). */
  offsetOf(i: 0 | 1): number {
    const g = this.rec[i];
    return g ? glideOffset(g.shift, g.ms, g.holdMs, g.elapsed) : 0;
  }

  /** A cut is made onto plane `i`, now showing painting `pose`: it starts at `plan.shift`, holds through `holdMs` (the cut) and glides home. */
  begin(i: 0 | 1, pose: string, plan: AnchorPlan, holdMs: number): number {
    this.rec[i] = { pose, shift: plan.shift, ms: plan.ms, holdMs, elapsed: 0 };
    return plan.shift;
  }

  /** Plane `i` was given a new painting (the actor reset its drift): forget its glide. */
  forget(i: 0 | 1): void {
    this.rec[i] = null;
  }

  /**
   * Advance every glide by `ms` real ms. `poseOf` names the painting a plane holds now (a glide whose plane was given another painting is dropped, the actor having reset its drift); `write` is handed
   * each plane's new offset (0 on the frame the glide ends). Offsets that did not change are not written.
   */
  advance(ms: number, poseOf: (i: 0 | 1) => string, write: (i: 0 | 1, offset: number) => void): void {
    for (const i of [0, 1] as const) {
      const g = this.rec[i];
      if (!g) continue;
      if (poseOf(i) !== g.pose) {
        this.rec[i] = null;
        continue;
      }
      const before = glideOffset(g.shift, g.ms, g.holdMs, g.elapsed);
      g.elapsed += Math.max(0, ms);
      const now = glideOffset(g.shift, g.ms, g.holdMs, g.elapsed);
      if (now !== before) write(i, now);
      if (now === 0) this.rec[i] = null;
    }
  }
}
