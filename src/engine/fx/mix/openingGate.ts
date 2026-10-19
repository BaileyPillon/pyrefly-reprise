import { battleCanvas } from './hudPanels.ts';
import type { RigWatch } from './rigWatch.ts';

/**
 * The opening waits for CHAPTER FRAMING's first plan (the Chapter IV first-menu framing race; Codex trace `codex-ch4-camera-trace.md`; **both games**: shared opening plumbing,
 * reproduced in FFX-2 Chapter IV, whose giant plan is the largest staging write there is).
 *
 * The plan is decided only when every figure is painted and stands still, 0.6 s after the roster last changed, and it is put on screen only when no command menu is open (a cut
 * never lands while the player chooses). On a fresh profile the paintings arrive late and a hurried opening collapses the sweep, so the first menu used to open FIRST: the plan,
 * decided behind the open menu, waited for it to close and then wrote a boss's size and the party's place on figures already on screen, at the first confirm (Bahamut 420 to
 * 629 px, Yuna 31 px sideways; not a camera cut: the camera had no cut at all).
 *
 * So the OPENING owns the plan. The battle-start card is the cover: it is held past its hold until the plan has landed (`BattleStartBanner` `until`; a press still dismisses it),
 * and `BattlePresenterBeats.settleOpening` waits again before the first decision is asked for (a hurried or skipped opening has no card left), so the plan commits through the
 * normal update loop with the first menu not yet open, and the camera, if it rests, moves onto the master before anything is offered.
 *
 * The wait is bounded ({@link PLAN_WAIT_S}). A plan that has not landed by then (a painting that never loads, a roster that never settles) is RETIRED, not postponed
 * (`Framing.retire`): the base presentation stands, consistent for the whole fight, and nothing decided or still pending lands on it later as a jump. The other verdicts are
 * terminal at once: the part is off, or there is nothing to plan on ({@link Arrival}).
 *
 * Presentation only (rule 1): no engine tick, no timer of the engine; the FFX CTB and FFX-2 Active/Wait clocks do not run before the first decision, so a longer opening moves nothing
 * in them.
 */

/** The most the opening waits for the first plan once it asks (seconds of the mix's frame clock): after it the plan is retired. */
export const PLAN_WAIT_S = 3;
/** One frame counts at most this long, so a hitch does not spend the wait. */
const MAX_STEP_S = 0.25;
/** The wait is counted in frames; this wall-clock ceiling (ms) is for a page that renders none to count (a frozen capture, a stalled tab): the plan is retired after it whatever the frame clock says. */
export const PLAN_WAIT_WALL_MS = 15_000;

/** Where the first plan stands: owed (to come, or decided and waiting for a menu to close), landed, retired (given up), off (part off, no rig), unsupported (no canvas or resting rig). */
export type Arrival = 'owed' | 'landed' | 'retired' | 'off' | 'unsupported';

/** What the gate reads of CHAPTER FRAMING (`Framing`). */
export interface GateSource {
  readonly rigs: RigWatch | null;
  readonly state: { on: boolean; wanted: boolean; pending: boolean; installed: boolean; seen: boolean };
  retire(): void;
}

/** Where the first plan stands. Everything but `owed` is final: the opening needs no more of CHAPTER FRAMING. */
export function arrivalOf(f: Pick<GateSource, 'rigs' | 'state'>): Arrival {
  const s = f.state;
  if (f.rigs === null) return 'off';
  if (!s.on) return s.seen ? 'off' : 'owed'; // before its first frame the part has not said whether it plays
  if (s.wanted || s.pending) return battleCanvas() && f.rigs.base('idle') ? 'owed' : 'unsupported';
  return s.installed ? 'landed' : 'retired';
}

/** The master is installed and the camera, at rest on the resting rig, has not gone onto it: the opening moves it (`BattlePresenterBeats.settleOpening`). */
export function cameraOwed(f: Pick<GateSource, 'rigs' | 'state'>): boolean {
  return f.state.installed && f.state.on && !!f.rigs?.atRest() && f.rigs.sinceInstall() < 1;
}

export class OpeningGate {
  private waiters: Array<() => void> = [];
  private waited = 0;
  private since = 0;

  /** Resolves at once when nothing is owed; otherwise on the frame the plan has landed, was given up, or the wait ran out. */
  wait(src: Pick<GateSource, 'rigs' | 'state'>): Promise<void> {
    if (arrivalOf(src) !== 'owed') return Promise.resolve();
    if (!this.waiters.length) [this.waited, this.since] = [0, performance.now()];
    return new Promise<void>((resolve) => this.waiters.push(resolve));
  }

  /** Every frame, after CHAPTER FRAMING has run. */
  update(dt: number, src: GateSource): void {
    if (!this.waiters.length) return;
    if (arrivalOf(src) === 'owed') {
      this.waited += Math.min(MAX_STEP_S, Math.max(0, dt));
      if (this.waited < PLAN_WAIT_S && performance.now() - this.since < PLAN_WAIT_WALL_MS) return;
      src.retire();
    }
    this.release();
  }

  /** The screen is going: nobody stays parked on a plan that will not come. */
  dispose(): void {
    this.release();
  }

  private release(): void {
    for (const resolve of this.waiters.splice(0)) resolve();
  }
}
