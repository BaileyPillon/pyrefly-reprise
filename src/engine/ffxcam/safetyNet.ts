/**
 * **The tracking safety net** (the hidden Fayth chapter's FFX camera; FFX only): when the replayed shot has lost every subject of its beat for too long, the net takes the picture over with a
 * framing that holds them, and gives it back when the shot can be trusted again. It is a net, not a camera: **a shot that keeps its subjects is never touched** (the pose is returned as the same
 * object), and the programs, the VM and the solver never hear of it; it only changes the pose that goes to the screen.
 *
 * **When it acts** (every number is in {@link SAFETY_NET}, one place):
 *
 * - A frame *loses track* when none of the beat's subjects is in frame (`./framing.ts`: at least {@link SEEN_MIN} of a figure's box on screen). The net counts consecutive lost logic steps; more than
 *   `triggerSteps` and it engages. A new beat or program (the `key`) restarts the count: the new shot gets its own chance, as in FFX where each request starts afresh. A shot whose actor has no figure
 *   on the field (Cid is never drawn: `NetFrame.noActor`) is waiting for nothing and gets `triggerStepsNoActor`.
 * - **Engaging** blends, over `blendSteps` with a cosine ease, from the shot to the **safe framing**: FFX's default view for the current range (its look-at, its direction, its lens), re-aimed at the
 *   subjects and pulled back along its own line just far enough that each of them has `holdFraction` of its box in frame, never farther than `maxPullback` times the default distance. Every step the
 *   safe framing is solved again against the subjects where they stand, so it follows a figure that runs. The look-at runs `aimLead` times ahead of the eye (the camera turns to the subjects first), so
 *   they are back in frame after about a third of the blend and not at its end.
 * - **Holding.** The net holds until the next beat or program change. At that change it asks the same question of the new shot: held (the new shot has its subjects) and the net lets go at once, a hard cut,
 *   as FFX cuts to a new shot; still lost and the net stays, blending to the framing of the new subjects from where it stood (so a beat inside a long orbit does not flash the lost shot again). It also lets
 *   go on its own when the shot has held its subjects (`releaseFraction`) for `releaseSteps` running: a cosine blend back to the shot.
 *
 * Every engagement, retarget and release is an {@link NetEvent}: kept in {@link SafetyNet.events} and handed to the `log` callback (the scene logs them in dev). Pure: no DOM, no `three`. Game case: FFX only.
 */

import { SEEN_MIN, centreOf, unionOf, viewOf, visibleFractionIn, type Box } from './framing.ts';
import { D2R, polarToCart, vfovDeg } from './geometry.ts';
import type { Vec3 } from './ir.ts';
import type { CameraPose } from './solver.ts';

/** Every threshold of the net. */
export const SAFETY_NET = {
  /** A subject is in frame when at least this fraction of its box is on screen: the audit's line (`./framing.ts`), the one the net judges a shot by. */
  seen: SEEN_MIN,
  /** The shot must have lost every subject for MORE than this many logic steps before the net acts. */
  triggerSteps: 6,
  /** The same for a shot whose actor has no figure on the field: it cannot be tracking it, so there is nothing to wait for. */
  triggerStepsNoActor: 0,
  /** Logic steps of the cosine blend from the shot to the safe framing (and back, and from one safe framing to the next). */
  blendSteps: 12,
  /** In a blend into a safe framing the look-at runs this many times faster than the eye (it is there after `blendSteps / aimLead` steps). */
  aimLead: 2,
  /** The safe framing gives each subject it holds at least this fraction of its box on screen (well over {@link SAFETY_NET}`.seen`, so it stays in frame as the figures move). */
  holdFraction: 0.6,
  /** The net lets go when the shot has had at least this fraction of the best-placed subject on screen... */
  releaseFraction: 0.5,
  /** ...for this many logic steps running. */
  releaseSteps: 12,
  /** The safe framing pulls back at most this multiple of the default view's distance. */
  maxPullback: 2.5,
  /** Samples of the coarse scan along the pull-back, and iterations of the bisection that refines it. */
  scanSamples: 16,
  bisectIterations: 14,
  /** Events kept in {@link SafetyNet.events}. */
  maxEvents: 400,
} as const;

/** A default view as the scripts state it: the look-at, the eye as a polar offset from it (degrees, FFX's Y down), the lens. */
export interface HomeView {
  readonly ref: Vec3;
  readonly thetaDeg: number;
  readonly phiDeg: number;
  readonly len: number;
  readonly scrDpt: number;
}

/** What the net is told on every publish of the director. */
export interface NetFrame {
  /** The VM's logic-step counter now (steps, not frames: a frame may run none or several). */
  readonly steps: number;
  /** The pose the programs say. */
  readonly raw: CameraPose;
  /** Width over height of the window: what the player sees of the render (`./framing.ts` judges "in frame" for the lens the camera sink draws for that shape, `./geometry.ts`, `screenFovDeg`). */
  readonly aspect: number;
  /** The subjects whose loss triggers the net: the shot has lost track when none of these boxes is in frame. Empty: nothing to watch, the net stands down. */
  readonly watch: readonly Box[];
  /** The subjects the safe framing must hold (each of them). */
  readonly hold: readonly Box[];
  /** The default view of the current range. */
  readonly home: HomeView;
  /** The identity of this beat, program and subject set: a change is "the next beat or program". */
  readonly key: string;
  /** The shot is an action's own and its actor has no figure on the field (Cid): the net does not wait {@link SAFETY_NET}`.triggerSteps` for it. */
  readonly noActor?: boolean;
}

export type NetEventKind = 'engage' | 'retarget' | 'release' | 'drop';

/** One thing the net did, for the log and for the audit. */
export interface NetEvent {
  readonly kind: NetEventKind;
  /** The VM's logic step. */
  readonly step: number;
  readonly key: string;
  /** Consecutive lost steps that led to an engagement. */
  readonly lostSteps?: number;
  /** The pull-back of the safe framing at that moment, as a multiple of the default view's distance. */
  readonly pullback?: number;
  readonly note?: string;
}

type Mode = 'idle' | 'in' | 'hold' | 'out';

/** An event as one line for the dev log: `[ffxnet] engage at step 412 (actionOpen:hiku15_00.w3.f9:tidus,evrae), lost 7 steps, pullback 1.00`. */
export function describeNetEvent(e: NetEvent): string {
  const lost = e.lostSteps === undefined ? '' : `, lost ${e.lostSteps} steps`;
  const pull = e.pullback === undefined ? '' : `, pullback ${e.pullback.toFixed(2)}`;
  return `[ffxnet] ${e.kind} at step ${e.step} (${e.key})${lost}${pull}${e.note ? `: ${e.note}` : ''}`;
}

const cosine = (w: number): number => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, w)))) / 2;
const lerp = (a: number, b: number, e: number): number => a + (b - a) * e;
const lerp3 = (a: Vec3, b: Vec3, e: number): Vec3 => [lerp(a[0], b[0], e), lerp(a[1], b[1], e), lerp(a[2], b[2], e)];

/**
 * The pose between `a` and `b` at `e` (0 is `a`, 1 is `b`): eye, roll and the vertical field of view, blended; the lens value follows the field of view. The look-at is blended at `eAim` (the eye's `e` by
 * default), which lets the camera turn to its subject ahead of the move.
 */
export function blendPoses(a: CameraPose, b: CameraPose, e: number, eAim: number = e): CameraPose {
  if (e <= 0 && eAim <= 0) return a;
  if (e >= 1 && eAim >= 1) return b;
  const fovDeg = lerp(a.fovDeg, b.fovDeg, e);
  return { eye: lerp3(a.eye, b.eye, e), ref: lerp3(a.ref, b.ref, eAim), roll: lerp(a.roll, b.roll, e), fovDeg, scrDpt: 240 / Math.tan((fovDeg * D2R) / 2) };
}

/** The best fraction any of `boxes` has in frame in `pose` (-1 for none). */
function bestFraction(pose: CameraPose, boxes: readonly Box[], aspect: number): number {
  const view = viewOf(pose, aspect);
  if (!view) return boxes.length ? 0 : -1;
  let best = -1;
  for (const b of boxes) best = Math.max(best, visibleFractionIn(view, b));
  return best;
}

/** The least fraction any of `boxes` has in frame in `pose`. */
function worstFraction(pose: CameraPose, boxes: readonly Box[], aspect: number): number {
  const view = viewOf(pose, aspect);
  if (!view) return 0;
  let worst = 1;
  for (const b of boxes) worst = Math.min(worst, visibleFractionIn(view, b));
  return worst;
}

/** The safe framing and how far it pulled back (a multiple of the default view's distance). */
export interface SafeFraming {
  readonly pose: CameraPose;
  readonly pullback: number;
  /** True when every held subject has {@link SAFETY_NET}`.holdFraction` of its box in frame. */
  readonly holds: boolean;
  /** How many of the subjects asked for are held: the first ones in the list. All of them unless no pull-back within the cap could (the actor is first, its targets after it: a target 800 units off at FAR is let go). */
  readonly held: number;
}

/**
 * FFX's default view for the range, re-aimed at the centre of the subjects and pulled back along its own line just far enough that every subject has `holdFraction` of its box on screen; the lens and the
 * horizon (roll 0) are the default view's. When no pull-back up to `maxPullback` holds them all, the **last** subject is let go and the rest tried again (the list is the actor first, then its targets; the
 * party is nearer than Evrae is at FAR), down to the first alone; a lone subject too big for the cap gets the pull-back that holds it best. Null when there is nothing to hold.
 */
export function safeFraming(home: HomeView, hold: readonly Box[], aspect: number): SafeFraming | null {
  for (let n = hold.length; n >= 1; n--) {
    const framing = frameSubjects(home, hold.slice(0, n), aspect);
    if (framing && (framing.holds || n === 1)) return { ...framing, held: n };
  }
  return null;
}

/** One try: the framing for exactly these subjects. */
function frameSubjects(home: HomeView, hold: readonly Box[], aspect: number): Omit<SafeFraming, 'held'> | null {
  const box = unionOf(hold);
  if (!box) return null;
  const aim = centreOf(box);
  const theta = home.thetaDeg * D2R;
  const phi = home.phiDeg * D2R;
  const fovDeg = vfovDeg(home.scrDpt);
  const at = (factor: number): CameraPose => ({ eye: polarToCart(aim, theta, phi, home.len * factor), ref: aim, roll: 0, fovDeg, scrDpt: home.scrDpt });
  const score = (factor: number): number => worstFraction(at(factor), hold, aspect);
  const need = SAFETY_NET.holdFraction;
  const top = SAFETY_NET.maxPullback;
  if (score(1) >= need) return { pose: at(1), pullback: 1, holds: true };
  // Coarse geometric scan for the first pull-back that holds them, then a bisection inside its bracket.
  let prev = 1;
  let found = -1;
  let bestFactor = 1;
  let bestScore = score(1);
  for (let k = 1; k <= SAFETY_NET.scanSamples; k++) {
    const factor = Math.pow(top, k / SAFETY_NET.scanSamples);
    const s = score(factor);
    if (s > bestScore + 1e-9) {
      bestScore = s;
      bestFactor = factor;
    }
    if (s >= need) {
      found = factor;
      break;
    }
    prev = factor;
  }
  if (found < 0) return { pose: at(bestFactor), pullback: bestFactor, holds: false };
  let lo = prev;
  let hi = found;
  for (let i = 0; i < SAFETY_NET.bisectIterations; i++) {
    const mid = (lo + hi) / 2;
    if (score(mid) >= need) hi = mid;
    else lo = mid;
  }
  return { pose: at(hi), pullback: hi, holds: true };
}

export interface SafetyNetOptions {
  /** Called with every event (the scene logs them in dev). */
  readonly log?: (event: NetEvent) => void;
}

export class SafetyNet {
  /** Everything the net has done, oldest first, newest {@link SAFETY_NET}`.maxEvents` kept. */
  readonly events: NetEvent[] = [];

  private mode: Mode = 'idle';
  private lastSteps = 0;
  private started = false;
  private key = '';
  /** The key of the shot the net took over for (a different key is a new beat or program). */
  private engagedKey = '';
  private lostSteps = 0;
  private heldSteps = 0;
  private since = 0;
  private from: CameraPose | null = null;
  private last: CameraPose | null = null;
  private count = 0;

  constructor(private readonly opts: SafetyNetOptions = {}) {}

  /** What the net is doing now. */
  get state(): Mode {
    return this.mode;
  }

  /** Engagements so far. */
  get engagements(): number {
    return this.count;
  }

  /** Forget everything and stand down (a new scene, a new battle). */
  reset(): void {
    this.mode = 'idle';
    this.lostSteps = 0;
    this.heldSteps = 0;
    this.from = null;
    this.last = null;
    this.key = '';
    this.engagedKey = '';
    this.started = false;
  }

  /** The pose to show for this publish: the shot's own (the same object) unless the net has the picture. */
  process(f: NetFrame): CameraPose {
    const steps = this.started ? Math.max(0, f.steps - this.lastSteps) : 1; // the first publish is one step
    this.started = true;
    this.lastSteps = f.steps;
    const keyChanged = f.key !== this.key;
    this.key = f.key;
    const raw = f.raw;
    if (f.watch.length === 0 || f.hold.length === 0) {
      if (this.mode !== 'idle') this.emit({ kind: 'drop', step: f.steps, key: f.key, note: 'nothing to hold' });
      return this.stand(raw);
    }
    const rawBest = bestFraction(raw, f.watch, f.aspect);
    const lost = rawBest < SAFETY_NET.seen;

    if (this.mode === 'idle') {
      if (keyChanged || !lost) this.lostSteps = 0;
      if (lost) this.lostSteps += steps;
      const grace = f.noActor ? SAFETY_NET.triggerStepsNoActor : SAFETY_NET.triggerSteps;
      if (!lost || this.lostSteps <= grace) return this.remember(raw);
      const target = safeFraming(f.home, f.hold, f.aspect);
      if (!target) return this.remember(raw);
      this.mode = 'in';
      this.since = f.steps;
      this.from = null;
      this.heldSteps = 0;
      this.engagedKey = f.key;
      this.count++;
      this.emit({ kind: 'engage', step: f.steps, key: f.key, lostSteps: this.lostSteps, pullback: target.pullback, ...(target.held < f.hold.length ? { note: `holds ${target.held} of ${f.hold.length} subjects` } : !target.holds ? { note: 'cannot hold the subject within the pull-back cap' } : {}) });
    }

    if (this.mode === 'out') {
      if (keyChanged) return this.stand(raw); // a new shot: the net is gone, the cut is the shot's own
      const w = (f.steps - this.since) / SAFETY_NET.blendSteps;
      const out = blendPoses(this.from ?? raw, raw, cosine(w));
      if (w >= 1) {
        this.mode = 'idle';
        this.lostSteps = 0;
        return this.remember(raw);
      }
      return this.remember(out);
    }

    // 'in' or 'hold'. A new beat or program: the new shot is asked the same question.
    if (f.key !== this.engagedKey) {
      if (!lost) {
        this.emit({ kind: 'drop', step: f.steps, key: f.key, note: 'the new shot holds its subjects' });
        return this.stand(raw);
      }
      if (this.mode === 'hold') this.emit({ kind: 'retarget', step: f.steps, key: f.key, note: 'the new shot has lost its subjects too' });
      this.mode = 'in';
      this.since = f.steps;
      this.from = this.last; // carry on from where the picture is
      this.heldSteps = 0;
    }
    this.engagedKey = f.key;
    if (rawBest >= SAFETY_NET.releaseFraction) this.heldSteps += steps;
    else this.heldSteps = 0;
    const target = safeFraming(f.home, f.hold, f.aspect);
    if (!target) return this.stand(raw);
    if (this.mode === 'hold' && this.heldSteps >= SAFETY_NET.releaseSteps) {
      this.mode = 'out';
      this.since = f.steps;
      this.from = this.last ?? target.pose;
      this.emit({ kind: 'release', step: f.steps, key: f.key, note: 'the shot holds its subjects again' });
      return this.remember(this.from);
    }
    const w = (f.steps - this.since) / SAFETY_NET.blendSteps;
    if (this.mode === 'in' && w >= 1) this.mode = 'hold';
    const out = this.mode === 'in' ? blendPoses(this.from ?? raw, target.pose, cosine(w), cosine(w * SAFETY_NET.aimLead)) : target.pose;
    return this.remember(out);
  }

  // ------------------------------------------------------------------ internals

  /** Back to idle with nothing pending: the shot's own pose. */
  private stand(raw: CameraPose): CameraPose {
    this.mode = 'idle';
    this.lostSteps = 0;
    this.heldSteps = 0;
    this.from = null;
    return this.remember(raw);
  }

  private remember(pose: CameraPose): CameraPose {
    this.last = pose;
    return pose;
  }

  private emit(e: NetEvent): void {
    this.events.push(e);
    if (this.events.length > SAFETY_NET.maxEvents) this.events.splice(0, this.events.length - SAFETY_NET.maxEvents);
    this.opts.log?.(e);
  }
}
