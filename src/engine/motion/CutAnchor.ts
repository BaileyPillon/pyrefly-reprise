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
 * more. The cut itself is unchanged (the same window, the same streak, the same flash). The cut frame (the first frame in which the new painting shows, at ANY frame rate) is drawn with the whole shift, so
 * 0.12 of the height is what the eye gets there; from the next frame the plane GLIDES the rest of the way home on an ease-out ({@link glideOffset}), {@link GLIDE_MS_MIN}
 * to {@link GLIDE_MS_MAX} ms (never fewer than {@link GLIDE_FRAMES_MIN} frames of the display actually running): the head decelerates into the pose instead of being somewhere else, which is how a
 * hand-drawn smear frame works (the in-between is a streak, the arrival eases). The slide is sideways only: the feet keep the FLOOR LINE (y) and the head keeps the pose's own height, but the feet DO slide
 * sideways by the shift, and the continuity harness reads exactly that as a feet move (CHK-026 reads both paintings' feet through their planes in one frame; the review of this lane measured 92 px for a pair
 * 0.33 of the height apart against a 2 px line). So the log entry carries the design (`glide: { share, ms }`) and the policy's `continuity.smear.glideFeet` excuses the sideways part up to that share and
 * nothing else (`critic/runner/lib/continuity-smear.mjs`); a figure on a lunge is already travelling at 4 to 8 body heights a second, which hides a slide of 2 to 3.
 *
 * **What it does not do.** It does not touch the vertical part of a step (the kneel of `critical`, the bow of `hurt` are inside the painting, 0.1 to 0.25 of the height: Tidus's hurt to critical stays
 * about 120 to 150 px at the push-in even with the x part gone, and is named in the handoff), a pair under the cap, a rig (a rig key change has no planes to shift), a cut inside an open FFX-2 menu (none
 * is made there), or a blend. It does not change which swaps are cuts (`SmearPlan.CAUSE_MAX_ANCHOR` still keeps a cause cut across 0.4 or more at rest as today's blend).
 *
 * `?cutanchor=today|on|moving` (default {@link CUT_ANCHOR_DEFAULT}, one word PER GAME): `on` anchors every plane cut; `moving` only a cut made on a figure that is travelling (its speed at least `SmearPlan.MIN_SPEED`),
 * where the slide hides in the move; with the pack off (`?pack=off`, a phone, a tablet) it is `today`. Every number here is `[ours]`: the sources give no anchor, glide or ease (rule 6); they are tuned by the
 * prediction of `docs/handoff/pc-scope.md`, then judged in the clips.
 *
 * Game case (AGENTS.md rule 14): the MECHANISM is shared (both games' paintings are planes), but the EVIDENCE is FFX's: Yunalesca's 48 planned cuts over 120 px and Chapter I's 10 to 13 are the cases; FFX-2's
 * Chapter IV and Trema have none over 120 px (their own lane numbers read "nothing to fix"), and `research/ffx-vs-ffx2-presentation.md` is silent on how a hit's pose is staged in either game (no entry; the only
 * "cut" there is the battle transition), so nothing in the sources says FFX-2's cut should slide. The default is therefore a TABLE, one word for each game, and flipping FFX does not flip FFX-2.
 */
import { demoChapter, packDemo, queryWord, type DemoGame } from './DemoGate.ts';
import { BIG_ANCHOR, MIN_SPEED } from './SmearPlan.ts';

export type CutAnchorMode = 'today' | 'on' | 'moving';

/**
 * What `?cutanchor` reads when the address does not name a value, for each game (rule 14): `today` (nothing changes) in both until the browser measurement has been read and the clips judged. Flipping a game
 * is ONE word here. The word an address names applies to both.
 */
export const CUT_ANCHOR_DEFAULT: Readonly<Record<DemoGame, CutAnchorMode>> = Object.freeze({ ffx: 'today', ffx2: 'today' });

/**
 * ONE WORD FOR A CHAPTER (held-chapters lane, 2026-10-29; FFX only: both chapters are FFX's; the driver's call under Bailey's delegation of 2026-10-28, his to overturn). A chapter named here reads this word when the address
 * names none, instead of its game's {@link CUT_ANCHOR_DEFAULT}: the two chapters the wide swap scope holds out because their planned cuts sit across heads 0.40 to 0.44 of the figure's height apart (a step of about half the
 * drawn height, which the harness refuses to excuse by 0.1 to 1.2 percent) get the anchor, so that lifting their `SwapSwitch.SCOPE_EXCEPTIONS` line ships the cut with its glide and no other FFX chapter is flipped with it:
 * Yunalesca (13 unexcused planned cuts in release 68's run: her attack to cast 133 px against a cap of 131.5, Auron's follow to idle 154 against 153) and Sin's face (Auron's follow to idle, 224 px against 222). The model of
 * `docs/handoff/held-chapters.md` reads both at 0 unexcused with the anchor (Yunalesca 76 planned cuts of 120 px or more down to 0, worst 154 down to 84; Sin's face worst 224 down to 108). **Inert today:** both chapters are
 * `SCOPE_EXCEPTIONS`, so no cut is planned in them and no plane is shifted (`smearStyleNow` is `off` outside the two pack chapters); the word applies from the lift (or `?swapscope=all`). No browser has run it: its own job
 * (`yunalesca-all-held-anchor`, `sin-face-all-held-anchor`; the second names no `?cutanchor`, so it proves this table is read) reads it first, and the clips (`docs/handoff/pc-scope.md`) are the look call. Emptying this table is one edit and puts the chapters back on the game's word.
 */
export const CUT_ANCHOR_CHAPTERS: Readonly<Record<string, CutAnchorMode>> = Object.freeze({
  yunalesca: 'on',
  'sin-face': 'on',
});

/** The game of a chapter id for this switch: the seven `ffx2-` chapters are FFX-2's, every other listed chapter FFX's (`tests/unit/pc-scope-cut-anchor.test.ts` checks it against `src/data/encounters.ts`); none named reads FFX. */
export function cutAnchorGame(id: string | undefined = demoChapter()): DemoGame {
  return id !== undefined && id.startsWith('ffx2-') ? 'ffx2' : 'ffx';
}

/** The step left at the cut, a share of the figure's height: the planner's own line for "heads far apart" (`SmearPlan.BIG_ANCHOR`), so a cut is never left with far-apart heads. */
export const ANCHOR_CAP = BIG_ANCHOR;
/** The glide home: shortest and longest, in the blend's own ms (the frame's real time at pace 1, which is what the display runs on; the pace option stretches both); it takes the longest at {@link GLIDE_FULL_SHARE} of the height or more to cover. */
export const GLIDE_MS_MIN = 80;
export const GLIDE_MS_MAX = 150;
export const GLIDE_FULL_SHARE = 0.32;
/** The glide is never fewer than this many frames of the display running (a 30 fps display gets 133 ms), and never longer than the cap. */
export const GLIDE_FRAMES_MIN = 4;
export const GLIDE_CAP_MS = 200;

let mode: CutAnchorMode | null = null;
let word: CutAnchorMode | null | undefined; // the mode an address or a test NAMED (null: it named none, the game's default applies); undefined: the address is not read yet

/** The word `?cutanchor=` names in a search string (pure), or null; with the pack off it is `today` whatever the address says. */
export function cutAnchorWord(search: string | undefined): CutAnchorMode | null {
  if (!packDemo(search)) return 'today';
  const w = queryWord(search, 'cutanchor');
  return w === 'today' || w === 'on' || w === 'moving' ? w : null;
}

/** `?cutanchor=` from a search string (pure) for a figure of `game` (FFX when none is named) in chapter `chapter` (none: the game's word): with the pack off `today`; else the word it names (`today`, `on`, `moving`), else the chapter's own word ({@link CUT_ANCHOR_CHAPTERS}), else that game's {@link CUT_ANCHOR_DEFAULT}. */
export function cutAnchorFromSearch(search: string | undefined, game: DemoGame = 'ffx', chapter?: string): CutAnchorMode {
  return cutAnchorWord(search) ?? chapterWord(chapter) ?? CUT_ANCHOR_DEFAULT[game];
}

/** The word {@link CUT_ANCHOR_CHAPTERS} gives chapter `id`, or null. */
export function chapterWord(id: string | undefined): CutAnchorMode | null {
  return id !== undefined && Object.prototype.hasOwnProperty.call(CUT_ANCHOR_CHAPTERS, id) ? CUT_ANCHOR_CHAPTERS[id]! : null;
}

/** The mode in force for the running chapter: a forced mode (tests, `swapSwitch({ cutAnchor })`), else the address's word, else the chapter's own word ({@link CUT_ANCHOR_CHAPTERS}), else its game's default. The address is read once. */
export function cutAnchorMode(): CutAnchorMode {
  if (mode !== null) return mode;
  word ??= cutAnchorWord(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return word ?? chapterWord(demoChapter()) ?? CUT_ANCHOR_DEFAULT[cutAnchorGame()];
}

/** Tests and `window.__pyrefly.swapSwitch({ cutAnchor })`: force the mode for both games (`null` reads the address again). */
export function setCutAnchorMode(v: CutAnchorMode | null): void {
  mode = v;
  if (v === null) word = undefined;
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
  /** The glide home from the cut, in the blend's own ms (see {@link GLIDE_MS_MIN}). */
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

/** The offset still on the plane `elapsed` ms after the window began: all of `shift` until the cut (`holdMs`, the plane is not yet seen), then an ease-out to 0 over `ms` (the remaining part is `(1 - u) ** 2`). {@link CutGlide} passes the time since the cut FRAME, with no hold, so the cut frame itself carries the whole shift at any frame rate. */
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
  /** `elapsed` on the first frame past the hold, the frame the new painting is first seen (the cut frame), or null before it: the glide runs from there, so that frame is drawn with the whole shift (review m-6: counting from the hold itself ate up to a frame of it, 0.164 of the height left at 30 and 60 Hz). */
  since: number | null;
}

const offsetOfGlide = (g: Glide): number => (g.since === null ? g.shift : glideOffset(g.shift, g.ms, 0, g.elapsed - g.since));

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
    return g ? offsetOfGlide(g) : 0;
  }

  /** A cut is made onto plane `i`, now showing painting `pose`: it starts at `plan.shift`, holds through `holdMs` (the cut) and glides home. */
  begin(i: 0 | 1, pose: string, plan: AnchorPlan, holdMs: number): number {
    this.rec[i] = { pose, shift: plan.shift, ms: plan.ms, holdMs, elapsed: 0, since: null };
    return plan.shift;
  }

  /** Plane `i` was given a new painting (the actor reset its drift): forget its glide. */
  forget(i: 0 | 1): void {
    this.rec[i] = null;
  }

  /**
   * Advance every glide by `ms`, the same ms the pose blend was just advanced by (the frame's real time, paced when the curves are on). `poseOf` names the painting a plane holds now (a glide whose plane was given another painting is dropped, the actor having reset its drift); `write` is handed
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
      const before = offsetOfGlide(g);
      g.elapsed += Math.max(0, ms);
      if (g.since === null && g.elapsed > g.holdMs) g.since = g.elapsed; // the cut frame: drawn with the whole shift, the glide runs from here
      const now = offsetOfGlide(g);
      if (now !== before) write(i, now);
      if (now === 0) this.rec[i] = null;
    }
  }
}
