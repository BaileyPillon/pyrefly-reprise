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
import type { PoseBlend } from '../PoseBlend.ts';
import type { Footprint } from '../PoseAlign.ts';
import { ActorSmear, type SmearFrame } from './ActorSmear.ts';
import { applySmear, type SmearCells, type SmearPlane } from './SmearApply.ts';
import { pairFacts } from './SmearFacts.ts';
import { noteSmear } from './SmearLog.ts';
import { CUT, FLASH_PEAK, smearPlan } from './SmearPlan.ts';
import { smearStyleNow } from './SmearSwitch.ts';

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
}

/** The smear's flash colour: warm ivory, never pure white (a white flash on a big plane is a blob). */
export const SMEAR_FLASH_COLOUR = 0xfff3d9;

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export class SmearDirector {
  readonly state = new ActorSmear();
  private readonly frame: SmearFrame = { amount: 0, dirX: 1, dirY: 0, style: 'paint', length: 0 };
  private readonly dir = { x: 1, y: 0 };
  private written = false;

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
    const style = smearStyleNow();
    if (style === 'off' || !this.host.canCut()) return false;
    const out: 0 | 1 = to === 0 ? 1 : 0;
    const h = this.host;
    const height = h.worldHeight();
    const facts = pairFacts(h.footprintOf(out), h.footprintOf(to), height);
    const speed = this.state.speed(height);
    const from = h.poseOf(out);
    const plan = smearPlan({ from, to: resolved, overlap: facts.overlap, anchorDistance: facts.anchorDistance, speed, frameMs: this.state.frameMs, style });
    if (!plan) return false;
    h.blend.retune(plan.cutMs, CUT);
    const d = this.state.direction(height, this.dir);
    this.state.begin(plan, d.x, d.y);
    noteSmear({ at: now(), actor: h.name(), from, to: resolved, style: plan.style, cutMs: plan.cutMs, overlap: facts.overlap, anchorDistance: facts.anchorDistance, speed, strength: plan.strength, flash: plan.flash, kind: 'plane' });
    if (plan.flash && !h.flashBlocked()) h.flash(SMEAR_FLASH_COLOUR, plan.cutMs * 1.5, FLASH_PEAK);
    return true;
  }

  /** Every frame, after the blend has advanced: the window's amount onto the planes (and off again when it is over). */
  step(): void {
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
