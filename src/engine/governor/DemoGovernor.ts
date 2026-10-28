/**
 * THE HOST of the frame-budget governor (`FrameBudget.ts`): the one object that feeds it the frame clock in the two demo chapters while a pro lane is on, and writes its levers into `govLive`. It is
 * ticked from `LookRig.update` (once a frame, inside the battle, after the look is wanted), so it adds no per-frame hook anywhere else and does nothing at all where the look rig does not run.
 *
 * Gate (everything off must be release 62 / r63-int's frame): the governor runs only in Chapter I and Chapter IV (`DemoGate`) and only while the pro look or the pro camera is on; with both off, or in any
 * other chapter, or with `?govern=off`, it holds its levers at rest and the consumers draw what they always did. `?govern=on` runs it whatever the lanes say (a capture); `?govbudget=<ms>` names the display's
 * budget by hand. A new scene, a resize and a hidden tab are not readings (a hold).
 *
 * The display: the budget is 8.33 ms (120 Hz) unless the page's own frame probe (`eyeCandy.probe`, the last 600 intervals, the title and the picker included) shows a slower display when the battle starts: its
 * quarter-percentile, snapped to the common refresh intervals (8.33, 11.11, 13.33, 16.67 ms), becomes the budget, so a 60 Hz screen is not trimmed for missing 120 Hz.
 */
import { eyeCandy } from '../fx/EyeCandy.ts';
import { demoChapter, isDemoChapter, queryWord } from '../motion/DemoGate.ts';
import { FrameBudgetGovernor, type GovernorPlan } from './FrameBudget.ts';
import { govLive, resetGovLive } from './GovernorLive.ts';

/** The refresh interval the probe's quarter-percentile stands for: the common display rates, never below the 120 Hz budget. */
export function snapBudget(quarterMs: number): number {
  if (!Number.isFinite(quarterMs) || quarterMs < 9.4) return 8.33;
  if (quarterMs < 12.2) return 11.11;
  if (quarterMs < 15) return 13.33;
  return 16.67;
}

export type GovernMode = 'auto' | 'on' | 'off';

export function governMode(search: string | undefined): GovernMode {
  const w = queryWord(search, 'govern');
  return w === 'on' ? 'on' : w === 'off' || w === 'today' ? 'off' : 'auto';
}

/**
 * MF-10 (motion-fluidity pass, lane "mf-l4-freezes"; both games; `?govern=fixed`, DEFAULT OFF = release 64's reading): the governor reads the display's own frame timestamps (the one `App.step` has, `FrameClock.ts`) and not
 * `performance.now()` at the look's update (whose callback-to-callback jitter alone sat on the old 18.0 ms recovery bar at 60 Hz), an interval over 100 ms is a load event and the 2 s round it are held out of the window
 * (the opening's links and uploads used to take the first levels), and a level is given back after 4 s of calm, the wait doubling to 16 s on a failed probe (8 s to 96 s before). The levels and what they do are unchanged.
 */
export function governFixed(search: string | undefined): boolean {
  return queryWord(search, 'govern') === 'fixed';
}

/** The options of the fixed reading (everything else is the governor's default). */
export const FIXED_READING = { stallMs: 100, loadHoldMs: 2000, recoverAfterMs: 4000, maxRecoverMs: 16000 } as const;

/** `?govbudget=<ms>`: the budget by hand (a capture, a test), or null. */
export function governBudget(search: string | undefined): number | null {
  const n = Number(queryWord(search, 'govbudget'));
  return Number.isFinite(n) && n >= 4 && n <= 34 ? n : null;
}

export class DemoGovernor {
  private gov: FrameBudgetGovernor | null = null;
  private lastScene: unknown = null;
  private mode: GovernMode = 'auto';
  private byHand: number | null = null;
  private fixed = false;
  private isActive = false;
  private readonly search: string | undefined = typeof location === 'undefined' ? undefined : location.search;
  /** The last plan, for the debug API. */
  last: GovernorPlan | null = null;

  constructor() {
    this.mode = governMode(this.search);
    this.byHand = governBudget(this.search);
    this.fixed = governFixed(this.search);
  }

  /** MF-10: take the fixed reading (or not) from the next battle on: the governor is built when it first runs, so a capture sets this before the fight (`?govern=fixed` does the same from the address). */
  useFixedReading(on: boolean): void {
    this.fixed = on;
    this.gov = null;
  }

  /** Switched off by hand (`__pyrefly.govern.enable(false)`, the cost harness): the levers rest as if `?govern=off`. */
  disabled = false;

  /** Is the governor allowed to act now: a demo chapter with a pro lane on (or forced), and not switched off. */
  gate(lanesOn: boolean): boolean {
    if (this.mode === 'off' || this.disabled) return false;
    if (this.mode === 'on') return true;
    return lanesOn && isDemoChapter(demoChapter());
  }

  /** One frame of a battle. `scene` names the scene being drawn (a new one is a hold); `lanesOn` is whether the pro look or the pro camera is on. */
  tick(wall: number, scene: unknown, lanesOn: boolean, frameNow?: number): void {
    const now = this.fixed && frameNow !== undefined && Number.isFinite(frameNow) && frameNow > 0 ? frameNow : wall; // MF-10: the display's own frame time with `?govern=fixed`, else the page clock at the look's update
    const on = this.gate(lanesOn);
    if (!on) {
      if (this.isActive) this.stop(now);
      return;
    }
    if (!this.gov) {
      const budget = this.byHand ?? snapBudget(eyeCandy.probe.count >= 200 ? eyeCandy.probe.percentile(25) : 0);
      this.gov = new FrameBudgetGovernor({ budgetMs: budget, ...(this.fixed ? FIXED_READING : {}) });
    }
    if (!this.isActive) {
      this.isActive = true;
      this.gov.reset(now, 2000);
    }
    if (scene !== this.lastScene) {
      this.lastScene = scene;
      this.gov.hold(now, 2000); // a new scene decodes art and compiles shaders: not a reading of the display
    }
    this.gov.pin(this.pinLevel);
    const plan = this.gov.frame(now);
    this.last = plan;
    govLive.level = plan.level;
    govLive.soft = plan.soft;
    govLive.particles = plan.particles;
    govLive.heavy = plan.heavy;
  }

  /** Is the governor acting now (a battle with a lane on). */
  get active(): boolean {
    return this.isActive;
  }

  /** The battle was left: the levers go back to rest, and the next battle starts from a clean window. */
  battleEnded(now: number): void {
    this.lastScene = null;
    if (this.isActive) this.stop(now);
  }

  /** A level held by hand (`__pyrefly.govern(level)`), or null: the governor then decides. Takes effect at the next tick. */
  pinLevel: 0 | 1 | 2 | 3 | null = null;

  /** A resize, a hidden tab coming back, the pause screen closing: not readings of the display. */
  hold(now: number, ms: number): void {
    this.gov?.hold(now, ms);
  }

  /** The lanes went off (or the battle ended): the levers go back to rest at once, the next run starts clean. */
  stop(now: number): void {
    this.isActive = false;
    this.gov?.release(now);
    resetGovLive();
    this.last = null;
  }

  /** For `__pyrefly.govern()`. */
  report(): Record<string, unknown> {
    return { mode: this.mode, fixed: this.fixed, active: this.isActive, live: { ...govLive }, governor: this.gov?.report() ?? null, plan: this.last };
  }
}

/** The page's governor. */
export const demoGovernor = new DemoGovernor();
