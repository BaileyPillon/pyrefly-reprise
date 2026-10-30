/**
 * THE SMEAR, AS A PAINTING SET'S ACTOR RUNS IT (conference demo, motion pass, lane "core", step 2; `SmearSwitch.ts` has the switch and the picture; no `three` import: the actor hands in what it
 * needs; both games). `PaintedActor` owns one and calls it in four places only:
 *
 * - {@link SmearDirector.track}: every frame, with the figure's motion offset (so the planner knows how fast it moves);
 * - {@link SmearDirector.hintRecoil}: a hit is about to push the figure (its first frame is its fastest, and the `hurt` swap is made on it);
 * - {@link SmearDirector.swap}: a pose change has just begun a blend (`PaintedActor.beginBlend`): it plans a cut and, when it is one, retunes the blend to the cut, logs it
 *   (`SmearLog.ts`, where the continuity harness reads it) and lights the flash;
 * - {@link SmearDirector.step}: every frame after the blend has advanced, it writes the window's amount onto the planes' uniforms (`SmearApply.ts`).
 *
 * The window is the pose blend itself: its progress is the window's `u`, so the streak and the cut cannot drift apart at any frame rate, pace or hit-stop (the blend runs on the real clock).
 */
import type { BlendCurves, PoseBlend } from '../PoseBlend.ts';
import { cappedPeak, easeMap } from './DemoBlend.ts';
import type { Footprint } from '../PoseAlign.ts';
import { ActorSmear, type SmearFrame } from './ActorSmear.ts';
import { applySmear, type SmearCells, type SmearPlane } from './SmearApply.ts';
import { pairFacts, type PairFacts } from './SmearFacts.ts';
import { noteSmear } from './SmearLog.ts';
import { menuHolds } from './MenuHold.ts';
import { KO_CUT_STRENGTH } from './MomentsPlan.ts';
import { CUT, CUT_AT, FLASH_PEAK, LENGTH, MIN_SPEED, causeCutPlan, causeCutTooFar, isBigChange, smearPlan } from './SmearPlan.ts';
import { CutGlide, anchorPlan, cutAnchorFor, type AnchorPlan } from './CutAnchor.ts';
import { alignedSwapOn } from '../PoseSwap.ts';
import { stanceKindOf, swapClassOf } from './SwapClass.ts';
import { noteDesigned } from './SwapLog.ts';
import { BLEND3_MS, blendTooFar, causeMode, stanceNow, swapHow, swapsInScope, type SwapHow } from './SwapSwitch.ts';
import { heftOfHeight, motionBeat } from '../feel/MotionBeats.ts';
import { smearStyle, smearStyleNow } from './SmearSwitch.ts';

/** What the director needs of the actor that owns it. */
export interface SmearHost {
  /** The combatant id (the harness's figure id) and the figure's height in world units. */
  name(): string;
  worldHeight(): number;
  readonly planes: readonly SmearPlane[];
  readonly cells: SmearCells;
  readonly blend: PoseBlend;
  /** Which plane the figure is showing (the active one). */
  showing(): number;
  /** The plane's pose name and its footprint as placed. */
  poseOf(i: 0 | 1): string;
  footprintOf(i: 0 | 1): Footprint;
  /** False for a figure whose crossfade is a cut (FF7's), a scene's own long dissolve, or one that shifts poses by hand. */
  canCut(): boolean;
  /** The light flash: a colour, its length in ms and its peak. */
  flash(colour: number, ms: number, peak: number): void;
  /** True while the actor's flash is running or REDUCE FLASHES is on (the smear's flash then stays out). */
  flashBlocked(): boolean;
  /** MF-18 (`CutAnchor.ts`): draw plane `i` `dx` world units sideways of its own place (its drift, `PaintedActor.placeSlot`); 0 puts it back. A host without it gets no cut-side anchor. */
  shiftPlane?(i: 0 | 1, dx: number): void;
}

/** The smear's flash colour: warm ivory, never pure white (a white flash on a big plane is a blob). */
export const SMEAR_FLASH_COLOUR = 0xfff3d9;

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * The three-frame blend of the fluidity pass (MF-05 `v3`, MF-06 `blend3`): 50 ms, the capped cross of exponent 3 (`DemoBlend`): the outgoing painting leaves as `(1 - s) ** 3`, the incoming one comes in as `s`, so
 * the lesser of the two never shows more than 0.318 at ANY frame phase. The first build was a plain linear 50 ms blend; the continuity harness read it WORSE than today's dissolve on the pairs that share
 * nothing (Paine's attack to follow, overlap 0.07: worst severity 0.397 against 0.342, because at 60 Hz one of the two frames in a 50 ms blend can land on the half-way point), and the swaps lane's
 * "peak near 0.18" is the severity of frames at exactly a third and two thirds, which a display does not promise. With the cap the model prices the same pair at 0.69 ghost frames a swap (today's 2.67)
 * and a worst severity of 0.29.
 */
const BLEND3: BlendCurves = { out: (u) => Math.pow(1 - easeMap(u), 3), inn: easeMap, cap: cappedPeak(3) };

export class SmearDirector {
  readonly state = new ActorSmear();
  private readonly glide = new CutGlide(); // MF-18: the incoming plane of a big cut eases home from the old head (`CutAnchor.ts`)
  private readonly frame: SmearFrame = { amount: 0, dirX: 1, dirY: 0, style: 'paint', length: 0 };
  private readonly dir = { x: 1, y: 0 };
  private written = false;
  private manual = false;

  constructor(private readonly host: SmearHost) {}

  track(x: number, y: number, dt: number, realDt: number): void {
    this.state.track(x, y, dt, realDt);
  }

  /** A push of `distance` world units over `pushMs` (a sine-out: its peak speed is pi / 2 of the average) is about to start, away from the way the figure faces (`facing` +1 or -1). */
  hintRecoil(facing: number, distance: number, pushMs: number): void {
    const peak = (Math.PI / 2) * (distance / Math.max(0.001, pushMs / 1000));
    this.state.hint(-facing, peak / Math.max(1e-6, this.host.worldHeight()), 80);
  }

  /**
   * A pose blend toward plane `to` (showing `resolved`) has just begun. True when it was made a cut inside a smear; false leaves the blend as it is (a small change, a figure at rest, the
   * switch off). Ends any window an earlier swap left running.
   */
  swap(to: 0 | 1, resolved: string): boolean {
    this.state.end();
    this.glide.forget(to); // the actor has just given plane `to` a new painting and reset its drift
    this.manual = false; // a window the caller was running (the KO's cut) gives way to this change
    const style = swapsInScope() ? smearStyle() : smearStyleNow(); // `?swapscope` (MF-22): the asked-for style in any chapter the looks reach
    if (style === 'off' || !this.host.canCut()) return false;
    const out: 0 | 1 = to === 0 ? 1 : 0;
    const h = this.host;
    const from = h.poseOf(out);
    // The fluidity pass (MF-05 `v3`, MF-06): a swap asked for as a cut on its cause, or as a 50 ms three-frame blend (`SwapSwitch`, default today's). An open FFX-2 command menu allows no cut and no flash
    // (D-357), so a cut asked for there is the three-frame blend: shorter than today's, and no new look over the menu.
    const cls = swapClassOf(from, resolved);
    const stanceBlend = stanceNow() === 'v3' && stanceKindOf(from, resolved); // `?stance=v3`: the plan's V3 arm, today's two paintings with the change a 50 ms blend, whatever the pair
    let how: SwapHow = stanceBlend ? 'blend3' : swapHow(cls);
    const cutAsked = how === 'cut'; // asked as a cut on its cause (`?swapcause=cut`, or `pick` where the moment has a cover)
    if (cutAsked && menuHolds()) how = 'blend3';
    const height = h.worldHeight();
    let read: PairFacts | null = null;
    const facts = (): PairFacts => (read ??= pairFacts(h.footprintOf(out), h.footprintOf(to), height));
    // `?swapcause=pick` blends only where the pair is close, and so does a cut that an open menu turned into the blend (`?swapcause=cut` with an FFX-2 menu open: review F-6). A 50 ms blend of two drawings the planner calls a BIG change (heads 0.12 of the height apart, or outlines under half shared) is the head
    // crossing 70 to 150 px in two frames (the harness read 17 swap jerks of 40 px or more in Chapter I against 2 today), so there it keeps today's blend, or the smear when the figure moves. The pure
    // `blend3` word is the plan's V2 arm and stays unguarded, for the clip.
    // Held-chapters lane: in the chapters of `BLEND_HEAD_CHAPTERS` the guard also reads the heads' WHOLE distance, up and down as well as sideways (a serpent's head dips and rears; `SwapSwitch.BLEND3_HEAD_MAX`).
    if (how === 'blend3' && !stanceBlend && (causeMode() === 'pick' || cutAsked) && (isBigChange(facts().overlap, facts().anchorDistance) || blendTooFar(facts().headDistance))) how = 'today';
    // A cut on its cause whose two heads are 0.4 of the height apart or more is a 130 px step in one frame: it stays today's (a blend at rest, the smear when the figure moves). See `SmearPlan.CAUSE_MAX_ANCHOR`.
    if (how === 'cut' && causeCutTooFar(facts().anchorDistance)) how = 'today';
    if (how === 'blend3') {
      h.blend.retune(BLEND3_MS, BLEND3);
      noteDesigned({ actor: h.name(), from, to: resolved, cls: stanceBlend ? 'stance' : (cls as string), ms: BLEND3_MS });
      return true; // the blend is chosen: not for `demoRetune` to change again
    }
    if (menuHolds()) return false; // an open FFX-2 command menu keeps today's blend: no cut, no flash (D-357, `MenuHold.ts`)
    const speed = this.state.speed(height);
    if (how !== 'cut' && !(speed >= MIN_SPEED)) return false; // a figure at rest keeps its blend (and the overlap of the pair is not read for nothing)
    const pair = facts();
    const input = { from, to: resolved, overlap: pair.overlap, anchorDistance: pair.anchorDistance, speed, frameMs: this.state.frameMs, style };
    const plan = how === 'cut' ? causeCutPlan(input) : smearPlan(input);
    if (!plan) return false;
    const unnamed = how === 'cut' && !isBigChange(pair.overlap, pair.anchorDistance); // a small change cut on purpose: the log says the engine knows it is a cut (`big`), as for the knock-out's
    h.blend.retune(plan.cutMs, CUT);
    const d = this.state.direction(height, this.dir);
    this.state.begin(plan, d.x, d.y);
    const glide = this.anchor(to, out, resolved, pair.anchorDx, speed, height, plan.cutMs);
    noteSmear({ at: now(), actor: h.name(), from, to: resolved, style: plan.style, cutMs: plan.cutMs, overlap: pair.overlap, anchorDistance: pair.anchorDistance, speed, strength: plan.strength, flash: plan.flash, kind: 'plane', ...(how === 'cut' ? { cause: cls as string } : {}), ...(unnamed ? { big: true } : {}), ...(glide ? { glide: { share: Math.round(glide.share * 1000) / 1000, ms: glide.ms } } : {}) });
    if (speed >= MIN_SPEED) motionBeat({ kind: 'smear', strength: plan.strength, heft: heftOfHeight(height), atMs: plan.cutMs * CUT_AT }); // lane "feel", `?motionsfx=`: the whoosh of the cut, on the cut (a no-op unless the sink is on); a cut on its cause at rest (MF-06) has the blow's own sound, not a whoosh
    if (plan.flash && !h.flashBlocked()) h.flash(SMEAR_FLASH_COLOUR, plan.cutMs * 1.5, FLASH_PEAK);
    return true;
  }

  /**
   * MF-18 (`CutAnchor.ts`, `?cutanchor=`): a plane cut was just made onto plane `to`; when the two heads are more than the cap apart, draw the new plane back toward the old head so the step at the cut is the
   * cap, and let it glide home. `dx` is the pair's signed head step as placed; the outgoing plane may still be carrying an earlier glide's drift, which the head it shows includes.
   */
  private anchor(to: 0 | 1, out: 0 | 1, resolved: string, dx: number | null, speed: number, height: number, cutMs: number): AnchorPlan | null {
    const h = this.host;
    if (!h.shiftPlane || !cutAnchorFor(speed) || alignedSwapOn()) return null; // `?swap=aligned` runs its own drift on the same field
    const plan = anchorPlan({ dx: dx === null ? null : dx - this.glide.offsetOf(out), height, frameMs: this.state.frameMs });
    if (plan) h.shiftPlane(to, this.glide.begin(to, resolved, plan, cutMs * CUT_AT));
    return plan;
  }

  /**
   * A WINDOW THAT THE CALLER RUNS (motion pass, step 3: the knock-out's cut, `fx/mix/living.ts`): the fall's cross is played plane by plane there, not by the pose blend, so the caller opens the
   * window ({@link beginManual}: it is logged as a planned smear, the harness excuses the swap by it), gives the progress each frame ({@link stepManual}, 0 to 1) and closes it
   * ({@link endManual}). The direction is along the stage (the way the body falls) and a little down. No style (the smear off): nothing is drawn or logged.
   */
  beginManual(info: { from: string; to: string; toPlane: 0 | 1; cutMs: number; dirX: number }): void {
    const style = smearStyleNow();
    if (style === 'off') return;
    this.state.end();
    const h = this.host;
    const facts = pairFacts(h.footprintOf(info.toPlane === 0 ? 1 : 0), h.footprintOf(info.toPlane), h.worldHeight()); // the pair as placed: the harness excuses a swap only when the log says it was a BIG change
    const len = Math.hypot(info.dirX, 0.25);
    this.state.begin({ cutMs: info.cutMs, style, strength: KO_CUT_STRENGTH, length: LENGTH[style], flash: false, difference: 1 }, info.dirX / len, -0.25 / len);
    this.manual = true;
    noteSmear({ at: now(), actor: h.name(), from: info.from, to: info.to, style, cutMs: info.cutMs, overlap: facts.overlap, anchorDistance: facts.anchorDistance, speed: 0, strength: KO_CUT_STRENGTH, flash: false, kind: 'plane', big: true });
  }

  stepManual(u: number): void {
    if (!this.manual) return;
    this.state.sample(u, this.frame);
    applySmear(this.frame, this.host.planes, this.host.cells, this.host.showing());
    this.written = true;
  }

  endManual(): void {
    if (!this.manual) return;
    this.manual = false;
    this.state.end();
    this.frame.amount = 0;
    applySmear(this.frame, this.host.planes, this.host.cells, this.host.showing());
    this.written = false;
  }

  /** Every frame, after the blend has advanced: the window's amount onto the planes (and off again when it is over). `ms` is the same ms the blend was just advanced by (the frame's real time, paced when the curves are on): MF-18's glide runs on the blend's own clock, so the cut frame and the glide stay together at any pace and display rate. */
  step(ms = 0): void {
    if (this.glide.active) this.glide.advance(ms, (i) => this.host.poseOf(i), (i, dx) => this.host.shiftPlane?.(i, dx));
    if (this.manual) return; // the caller runs this window
    if (!this.host.canCut()) return; // a rig plays its own window on this state (`rig/RigSmearWindow.ts`); a cut crossfade has none
    const s = this.state;
    if (s.active && !this.host.blend.blending) s.end();
    if (!s.active) {
      if (this.written) {
        this.frame.amount = 0;
        applySmear(this.frame, this.host.planes, this.host.cells, this.host.showing());
        this.written = false;
      }
      return;
    }
    s.sample(this.host.blend.progress, this.frame);
    applySmear(this.frame, this.host.planes, this.host.cells, this.host.showing());
    this.written = true;
  }
}
