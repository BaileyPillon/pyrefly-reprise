/**
 * HOW A KNOCK-OUT PLAYS, AND HOW A REVIVE MIRRORS IT (visual-and-feel fix FA-1, FA-2 and FA-3; PR-0378; both games).
 *
 * Until this module the KO COLLAPSE part (`fx/mix/living.ts`) buckled the standing painting for 220 ms (FFX) or 170 ms (FFX-2) and then CUT to the KO
 * painting in one frame: 78 of the 96 snaps of round 23 were that cut. Bailey picked option B on the Motion Options page (P1-B, 2026-10-10: "fall,
 * puff, land"; "I'll go with all your recommendations"). This file is the pure half of it: which way a KO plays ({@link koMode}), the clock of the
 * three phases ({@link KoRun}: a hold on the field clock, a short cross on the REAL clock, a rise on the field clock) and the dust puff's numbers
 * ({@link puffAt}). No `three`, no DOM, deterministic. The geometry of the topple is `KoTip.ts`; the driver is `fx/mix/living.ts`.
 *
 * The four ways ({@link KoMode}), from the page:
 * - `topple` (FA-2, option B): a party character whose KO painting is a lying body. The buckle goes on as before and the standing painting
 *   also tips about its feet toward the side the KO painting's head lies (`KoTip.ts`); after the hold the two paintings cross over {@link KO_CROSS_MS}
 *   on the capped curve (`PoseBlend.KO_CROSS`: the standing one 1 - s, the lying one s squared, neither above 0.382) under a dust puff; the landing
 *   squash and shake follow at 300 ms as before (`PaintedActor.fall`).
 * - `buckle-cross` (FA-1, the defect fix): a KO painting that does not lie down (a colossus, a machine part, a pagoda, a standing foe) takes the same buckle and then
 *   the same capped cross instead of a cut. Nothing topples and nothing puffs.
 * - `cross` (FA-1): no buckle, only the cross. A figure whose standing painting is already flagged prone by its shape (Vegnagun's tail, a Sin fin,
 *   Overdrive Sin; the two largest jerks of round 23, 807 and 513 px, took this branch as a plain cut).
 * - `cut` under REDUCE MOTION: it stays a cut, as it was before this lane (the page's default). The page recommends "REDUCE MOTION stays a cut unless you
 *   say otherwise", its tile P1-RM-cut ("Keep the cut") is today's behaviour, and Bailey took "the page defaults" (2026-10-10). The short fade that
 *   moves nothing (the page's P1-RM-cross tile) is a question the page asked and he did not answer, so it is not built. The landing squash is the
 *   actor's own and plays as it always did; a revive under REDUCE MOTION is the actor's own blend, as it was before FA-3.
 * - `flip` and `cut`: today's behaviour, kept where a cross cannot work: a KO that has no painting of its own (the pose resolves to the one showing; the
 *   dressphere with no KO painting is laid down by `KoFallback`), where two layers of one painting would dim for a moment.
 *
 * The revive ({@link KoRun} with `kind: 'revive'`) is the mirror: the lying painting crosses to the standing one already toppled (the same cross, under
 * a smaller puff), which then stands up from the floor pivot over {@link RISE_MS}. Cross plus rise is 395 ms, inside `TIMING.revive` (520), so the
 * presenter's wait, and the menu behind it, are unchanged.
 *
 * Every duration and shape here is `[ours]`: the sources are silent on the KO pose and its blend in both games (`research/status-display.md` 97 and
 * 144 say "unsourced"; `research/ffx-vs-ffx2-presentation.md` 297, a single source, says FFX plays a KO animation a character can leave by getting
 * up). The buckle's two tempos are the existing ones (VP-1001-49). One shape for both games; nothing here is FFX-only or FFX-2-only.
 */

import { koCross } from './PoseBlend.ts';
import { CUT_AT } from './motion/SmearPlan.ts';
import { DEMO_KO_CROSS_MS } from './motion/DemoBlend.ts';
import { demoMotionOn } from './motion/DemoMotion.ts';

export type KoGame = 'ffx' | 'ffx2';

/** The buckle's length on the standing painting, ms (the hold): the tempo `living.ts` always had (VP-1001-49, `[ours]`). */
export const KO_BUCKLE_MS: Readonly<Record<KoGame, number>> = { ffx: 220, ffx2: 170 };
/** The cross from the standing painting to the lying one (and back, in a revive), ms of REAL time. 220 + 75 = 295 lands before the 300 ms squash. */
export const KO_CROSS_MS = 75;
/** The buckle's forward lean at full, the shader's `lean` input (`livingShader.ts`; the value `living.ts` always used). */
export const KO_LEAN = 0.05;
/** MF-17 (`?kotopple=eased`, `MoveSwitch.ts`): a party figure's buckle is a long collapse, not a topple: the turn eases in from rest and out into the cut, over this much field time in all (plus the cross), and a revive stands up from rest to rest. */
export const KO_BUCKLE_EASED_MS: Readonly<Record<KoGame, number>> = { ffx: 500, ffx2: 400 };
/** MF-17: the eased revive's rise, ms of field time (cross 75 + rise 420 = 495, inside `TIMING.revive`, 520). */
export const RISE_EASED_MS = 420;
/** The revive's stand-up from the toppled pose, ms of field time (`riseEase`; the plane's old rise tween was 320 too). */
export const RISE_MS = 320;
/** The puff's size for a fall and for a revive (the page: 1 and 0.6). */
export const PUFF_FALL = 1;
export const PUFF_REVIVE = 0.6;
/** What a revive takes in all: the cross and the rise. Must stay under `TIMING.revive` (520) so the menu is never delayed. */
export const REVIVE_MS = KO_CROSS_MS + RISE_MS;
/** The cross a KO or a revive plays now: `KO_CROSS_MS`, or the demo's slightly longer one under `?motion=demo` (`motion/DemoBlend.ts`; 100 ms, still inside the landing squash and `TIMING.revive`). */
export const koCrossMs = (): number => (demoMotionOn() ? DEMO_KO_CROSS_MS : KO_CROSS_MS);

/** Figures built for size: a buckle and a cross suit them, a topple would swing a plane the size of the screen. Same list `living.ts` breathes slowly by. */
export const KO_GIANTS = /^(braskas-final-aeon|seymour-natus|yojimbo|anima|x2-anima|seymour-omnis|ixion|x2-ixion|bahamut|ffx2-bahamut|evrae)/;
/** The aeons on the party's side (their art ids): summoned creatures, not characters, so a buckle and a cross suit them and a body toppling flat does not. The giants above are aeons too. */
export const KO_AEONS = /^(valefor|ifrit|shiva|cindy|sandy|mindy)/;
/** Machines built of separately painted parts, and statues: they never lie down, whatever shape their KO painting has (the aspect flag over-flags: `ProneLay.ts`). */
export const KO_MACHINES = /^(vegnagun|sin-|overdrive-sin|yu-pagoda)/;

export type KoMode = 'cut' | 'flip' | 'cross' | 'buckle-cross' | 'topple';

/** What {@link koMode} decides from. All plain facts, read by `living.ts` after the cut to the KO painting has been made. */
export interface KoFacts {
  /** REDUCE MOTION. */
  rm: boolean;
  /** The pose request changed no plane (nothing to play). */
  samePlane: boolean;
  /** The KO painting is the very painting that was showing (a KO with no painting of its own, which `KoFallback` lays down). */
  samePainting: boolean;
  /** The painting that was showing is flagged prone (wider than tall, not marked upright). */
  fromProne: boolean;
  /** The KO painting is flagged prone. */
  toProne: boolean;
  /** The figure's id (`tidus`, `vegnagun-tail`). */
  name: string;
  /** Fights on the party's side (facing right). Foes keep a buckle and a cross. */
  partySide: boolean;
  /** `?kofall=off` ({@link koFallOff}): play it as before FA-1, for a same-build A/B capture. */
  legacy?: boolean;
}

/** `?kofall=off` (captures and A/B comparisons only): a KO plays as before FA-1 (the buckle and a cut) and a revive as before FA-3 (the actor's own blend). */
export function koFallOff(): boolean {
  return new URLSearchParams(globalThis.location?.search ?? '').get('kofall') === 'off';
}

/** Whether a figure may topple at all: party side, a character (not an aeon, a giant, a machine or a statue). */
export function canTopple(name: string, partySide: boolean): boolean {
  return partySide && !KO_GIANTS.test(name) && !KO_AEONS.test(name) && !KO_MACHINES.test(name);
}

/** How a KO plays: the one decision of this part. */
export function koMode(f: KoFacts): KoMode {
  if (f.legacy) return f.rm || f.samePlane || f.fromProne ? 'cut' : 'flip'; // what `living.ts` did before FA-1, exactly
  if (f.samePlane) return 'cut';
  if (f.rm) return 'cut'; // the page's default: REDUCE MOTION stays a cut (no buckle, no tilt, no topple, no puff, no fade)
  if (f.samePainting) return 'flip';
  if (f.fromProne) return 'cross';
  if (f.toProne && canTopple(f.name, f.partySide)) return 'topple';
  return 'buckle-cross';
}

/** MF-17: speed zero at both ends (smootherstep). The turn of an eased topple, and (backwards) of an eased revive. */
export const softEase = (t: number): number => {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

export type KoPhase = 'hold' | 'cross' | 'rise' | 'done';

/** What a frame of a run asks of the figure. */
export interface KoPose {
  phase: KoPhase;
  /** The fade of the plane the figure came from (the standing painting of a fall, the lying one of a revive). */
  out: number;
  /** The fade of the plane it goes to. */
  inn: number;
  /** The buckle (0..1) and lean the shader is given (`livingShader.ts`). */
  buckle: number;
  lean: number;
  /** How far the standing plane has tipped, 0 upright to 1 fully toppled (always 0 for a run with no travel). A fall's turn takes the hold and the cross; a revive's the cross and the rise. */
  tip: number;
  /** How far it has slid along the floor toward the lying body (its head, or its middle: `KoTip.SlotTip.by`), 0 to 1 (always 0 for a run with no travel), in a straight line on the same clock as the turn. */
  slide: number;
}

export interface KoRunOptions {
  kind: 'fall' | 'revive';
  /** The buckle's length (field ms); 0 when there is none. Revives have none. */
  holdMs: number;
  /** The cross's length (real ms); 0 is a flip (a cut at the end of the hold). */
  crossMs: number;
  /** The rise (field ms); 0 for a run that does not stand a body up. */
  riseMs: number;
  /** The standing plane tips (a topple, or a rise). */
  travel: boolean;
  /** The standing plane buckles. */
  buckle: boolean;
  /** The puff's size (1 = a fall's), or 0 for none. */
  puff: number;
  /** MF-17: the turn and the slide ease in from rest and out to rest (`softEase`) instead of `toppleEase` / `riseEase`. */
  eased?: boolean;
  /** Motion pass, step 3: the cross is a CUT inside the smear's window (the old painting whole until half-way, the new one from there) instead of the capped cross. */
  cut?: boolean;
}

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/**
 * How far a body has turned, over the whole of its fall (t, 0 to 1: the hold and the cross): the page's quadIn softened to half quadIn and half linear.
 * A pure quadIn over the hold swung a head 47 to 70 px in its last frame at the test camera (the check fails a jerk of 40); turning on through the
 * cross and peaking at 1.5 times the average speed instead of 2 keeps it down, and the turn still starts slowly and falls faster. `[ours]`, with the
 * page's loop as the look it follows.
 */
export const toppleEase = (t: number): number => {
  const x = clamp01(t);
  return 0.5 * x + 0.5 * x * x;
};
/** The same turn run backwards for a rise (r, 0 to 1): fast first and settling upright, at most 1.5 times the average speed. 1 at the start, 0 at the end. */
export const riseEase = (r: number): number => {
  const x = clamp01(r);
  return 1 - (1.5 * x - 0.5 * x * x);
};

/**
 * The clock of one KO or one revive: phases `hold` (the buckle and the topple, on the FIELD clock, so a hit-stop holds them), `cross` (REAL time: a
 * hit-stop never freezes a half-mixed pair of paintings, the lesson of FB-1) and `rise` (field clock). A phase of length 0 is skipped; time left over
 * when a phase ends carries into the next one.
 */
export class KoRun {
  readonly opts: Readonly<KoRunOptions>;
  private phase: KoPhase = 'hold';
  private hold = 0;
  private cross = 0;
  private rise = 0;
  private puffLeft: number;

  constructor(opts: KoRunOptions) {
    this.opts = opts;
    // A revive's puff goes up as the run starts; a fall's goes up as the cross begins (the body is down).
    this.puffLeft = opts.kind === 'revive' ? opts.puff : 0;
  }

  get done(): boolean {
    return this.phase === 'done';
  }

  /**
   * Move on by `fieldMs` of the field clock and `realMs` of real time (a frame's dt: the one a hit-stop zeroes and the one it never does). A phase
   * uses the clock it runs on; what is left of the frame when it ends goes into the next phase, in that phase's own clock (the share of the frame the
   * clock moved: a frozen field gives a rise nothing), and a phase of length 0 is skipped with the whole frame untouched.
   */
  step(fieldMs: number, realMs: number): void {
    const o = this.opts;
    let f = Math.max(0, fieldMs);
    let r = Math.max(0, realMs);
    if (this.phase === 'hold') {
      if (o.holdMs > 0) {
        this.hold += f;
        if (this.hold < o.holdMs) return;
        const over = this.hold - o.holdMs;
        r = f > 0 ? r * Math.min(1, over / f) : 0;
        f = over;
        this.hold = o.holdMs;
      }
      this.phase = o.crossMs > 0 ? 'cross' : 'done';
      if (this.phase === 'cross' && o.kind === 'fall') this.puffLeft = o.puff;
    }
    if (this.phase === 'cross') {
      this.cross += r;
      if (this.cross < o.crossMs) return;
      const over = this.cross - o.crossMs;
      f = r > 0 ? f * Math.min(1, over / r) : 0;
      r = over;
      this.cross = o.crossMs;
      this.phase = o.riseMs > 0 ? 'rise' : 'done';
    }
    if (this.phase === 'rise') {
      this.rise += f;
      if (this.rise < o.riseMs) return;
      this.rise = o.riseMs;
      this.phase = 'done';
    }
  }

  /** How far through the cross it is, 0 to 1 (0 before and 1 after it). The smear window's own progress when the cross is a cut. */
  get crossU(): number {
    const o = this.opts;
    return o.crossMs > 0 ? clamp01(this.cross / o.crossMs) : 0;
  }

  /** The puff that has gone up since the last call: its size, once; null otherwise. */
  takePuff(): number | null {
    const s = this.puffLeft;
    this.puffLeft = 0;
    return s > 0 ? s : null;
  }

  /**
   * How far a travelling run is through its turn, 0 to 1, on one clock for the whole of it: a fall's over the hold AND the cross (the body is still turning
   * as the lying painting comes in, so the head never stops dead at the cross), a revive's over the cross AND the rise (it starts getting up as it comes in).
   */
  private get turn(): number {
    const o = this.opts;
    return o.kind === 'fall' ? clamp01((this.hold + this.cross) / (o.holdMs + o.crossMs)) : clamp01((this.cross + this.rise) / (o.crossMs + o.riseMs));
  }

  /** What the figure shows now. */
  get pose(): KoPose {
    const o = this.opts;
    const fall = o.kind === 'fall';
    // The turn and the slide of a travelling run (the plane tips and slides toward the lying body); none otherwise.
    const turn = o.travel ? this.turn : 0;
    const tip = !o.travel ? 0 : o.eased ? (fall ? softEase(turn) : 1 - softEase(turn)) : fall ? toppleEase(turn) : riseEase(turn);
    const slide = !o.travel ? 0 : o.eased ? tip : fall ? turn : 1 - turn;
    switch (this.phase) {
      case 'hold': {
        const t = o.holdMs > 0 ? clamp01(this.hold / o.holdMs) : 0;
        return { phase: 'hold', out: 1, inn: 0, buckle: o.buckle ? t * t : 0, lean: o.buckle ? KO_LEAN * t : 0, tip, slide };
      }
      case 'cross': {
        const u = clamp01(this.cross / o.crossMs);
        const c = o.cut ? { from: u < CUT_AT ? 1 : 0, to: u < CUT_AT ? 0 : 1 } : koCross(u); // a cut: no frame shows both paintings (the smear covers the change)
        // a fall's buckle is full from here; a revive's unwinds with its turn
        const b = fall ? 1 : tip * tip;
        const l = fall ? KO_LEAN : KO_LEAN * tip;
        return { phase: 'cross', out: c.from, inn: c.to, buckle: o.buckle ? b : 0, lean: o.buckle ? l : 0, tip, slide };
      }
      case 'rise':
        return { phase: 'rise', out: 0, inn: 1, buckle: o.buckle ? tip * tip : 0, lean: o.buckle ? KO_LEAN * tip : 0, tip, slide };
      default:
        return { phase: 'done', out: 0, inn: 1, buckle: 0, lean: 0, tip: 0, slide: 0 };
    }
  }
}

/**
 * The run for a KO of this mode, at this game's tempo. `cut` plays nothing (null). `cutMs` (motion pass, step 3: the smear's window for the knock-out's cut, `motion/MomentsPlan.koCutMs`) makes the
 * cross of a TOPPLE (a party figure who falls to a lying painting) a CUT of that length; the hold before it grows by what the cross gave up, so the fall takes the same time and the cut falls at its
 * end, where the turn is fastest. Every other mode (a colossus's buckle, a prone standing painting) keeps its capped cross: its pair is not always a big change.
 */
export function fallRun(mode: KoMode, game: KoGame, cutMs?: number, buckleMs?: number, eased = false): KoRun | null {
  if (mode === 'cut') return null;
  const soft = eased && mode === 'topple' && buckleMs === undefined; // MF-17: only a party figure's topple, and not under the real-clip modes
  const hold = buckleMs ?? (soft ? KO_BUCKLE_EASED_MS[game] : KO_BUCKLE_MS[game]); // `?curves=real` (integration 2): the real clip's floor impact less the cross (`motion/RealMoments.realBuckleMs`); absent: the house buckle
  const cross = koCrossMs();
  const cutting = cutMs !== undefined && cutMs > 0 && mode === 'topple'; // a party figure whose KO painting is a lying body: the standing painting and the lying one always share almost no outline
  const crossMs = cutting ? cutMs : cross;
  const lead = cutting ? Math.max(0, cross - cutMs) : 0;
  switch (mode) {
    case 'flip':
      return new KoRun({ kind: 'fall', holdMs: hold, crossMs: 0, riseMs: 0, travel: false, buckle: true, puff: 0 });
    case 'cross':
      return new KoRun({ kind: 'fall', holdMs: 0, crossMs: cross, riseMs: 0, travel: false, buckle: false, puff: 0 });
    case 'buckle-cross':
      return new KoRun({ kind: 'fall', holdMs: hold, crossMs: cross, riseMs: 0, travel: false, buckle: true, puff: 0 });
    default:
      return new KoRun({ kind: 'fall', holdMs: hold + lead, crossMs, riseMs: 0, travel: true, buckle: true, puff: PUFF_FALL, ...(cutting ? { cut: true } : {}), ...(soft ? { eased: true } : {}) });
  }
}

/** The revive's run: with `travel` the lying body crosses to the toppled figure and stands up (FA-3); without, only the short cross (figures that never topple). REDUCE MOTION plays no run at all: the actor's own blend, as before FA-3. */
export function reviveRun(travel: boolean, eased = false): KoRun {
  return new KoRun({ kind: 'revive', holdMs: 0, crossMs: koCrossMs(), riseMs: travel ? (eased ? RISE_EASED_MS : RISE_MS) : 0, travel, buckle: travel, puff: travel ? PUFF_REVIVE : 0, ...(travel && eased ? { eased: true } : {}) });
}

// ------------------------------------------------------------------------- the dust puff

/** How long one puff lives after its own delay, ms (the page's 380). */
export const PUFF_LIFE_MS = 380;
/** The dust's colour (the page's 222, 213, 196: pale floor dust; pyreflies belong to the dead and the departing, not to a body that falls). */
export const PUFF_COLOUR = 0xded5c4;

/**
 * The six puffs, as the page drew them: `ox` along the body (a share of its length, from the middle), `delay` after the puff goes up (ms) and `r`
 * the biggest radius in world units for a human 1.75 tall (the page's pixels over 134.3 pixels a unit).
 */
export const PUFFS: ReadonlyArray<{ ox: number; delay: number; r: number }> = [
  { ox: -0.38, delay: 0, r: 0.194 },
  { ox: -0.16, delay: 28, r: 0.253 },
  { ox: 0.04, delay: 44, r: 0.313 },
  { ox: 0.26, delay: 14, r: 0.238 },
  { ox: 0.42, delay: 58, r: 0.179 },
  { ox: -0.02, delay: 90, r: 0.223 },
];
/** How high a puff drifts over its life, world units for a human 1.75 tall (16 page pixels). */
export const PUFF_RISE = 0.119;

/** One puff `age` ms after it went up, for the `i`-th of {@link PUFFS} at `size`: null before its delay and after its life. Lengths for a 1.75 human; the caller scales by height / 1.75. */
export function puffAt(age: number, i: number, size: number): { ox: number; radius: number; alpha: number; rise: number } | null {
  const p = PUFFS[i];
  if (!p) return null;
  const a = (age - p.delay) / PUFF_LIFE_MS;
  if (!(a >= 0) || a > 1) return null;
  return { ox: p.ox, radius: p.r * size * (0.4 + 0.6 * Math.sqrt(a)), alpha: 0.34 * Math.pow(1 - a, 1.5), rise: a * PUFF_RISE * size };
}
