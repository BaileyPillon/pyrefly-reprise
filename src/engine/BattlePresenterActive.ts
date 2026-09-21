/**
 * The **Active ATB pump**: the presenter's side of FFX-2's running clock.
 *
 * `BattlePresenter` parks on `HudPort.chooseCommand` in its `'player-input'`
 * branch, and under Wait that was the whole story — the FFX-2 engine was ticked
 * only in the `'waiting'` branch, so the gauges stood still for as long as a
 * player read the menu (measured: `critic/rounds/round-05.md` PR-0046, ticks
 * 8189 → 8189 over 2013 ms with the Chapter 4 menu open). Bailey chose Active
 * (`docs/target/decisions.json` D-009), so while the menu is open this pump
 * hands the engine **real elapsed time**, one clamped step at a time.
 *
 * **Shared plumbing, inert for FFX** (AGENTS.md rule 14 / CHK-020): one
 * presenter serves both engines, and the pump only runs for an engine that
 * offers `tick` *and* `inputValid`. FFX's engine offers neither, so its input
 * branch is byte-for-byte what it was — `tests/unit/ffx-no-active-clock.test.ts`
 * is the absence test.
 *
 * Five properties the shape below buys, each of which would otherwise be a
 * defect (`docs/plans/ffx2-active-atb-review.md` §4.5):
 *
 * 1. **Pause freezes the ATB.** The wait is the presenter's `baseSleep`, which
 *    is `BattleScreen.pauseGate` — it parks while the overlay is up. No new
 *    pause plumbing, and no ATB burned behind a pause menu.
 * 2. **`fast` and `skip` do not distort the game clock.** `dt` is read from a
 *    real clock, never from `PUMP_MS`, and the wait is `baseSleep` rather than
 *    the speed-scaled `sleep`. Under `'skip'` the waits collapse to zero, so
 *    almost no wall-clock time passes and an e2e or critic capture consumes
 *    almost no ATB.
 * 3. **A hidden tab cannot wipe the party.** `MAX_STEP_MS` clamps a throttled
 *    timer or a long GC pause; without it, ten seconds in another tab would
 *    arrive as ten seconds of enemy turns in one step.
 * 4. **Ordering stays exact at any pump period.** `FFX2Engine.tick` sub-steps
 *    to the next scheduled event, so `PUMP_MS` changes only how smoothly the
 *    bars move and how promptly an enemy action interrupts — never the order
 *    and never the outcome.
 * 5. **An animation does not pay the clock**, which is §1.5's "Automatic Wait"
 *    reached structurally rather than by authoring a list of animations: `play`
 *    is awaited inside the loop and `last` is **reset after it returns**, so
 *    the animation's own duration is never handed to the engine. Getting that
 *    one line wrong silently doubles the difficulty of both chapters.
 */

import type { AtbSnapshot, BattleEvent, CombatantId } from '../battle/common/types.ts';
import type { PlayResult } from './BattlePresenterPorts.ts';

/**
 * AUTHORED (presentation only, not game data — hard rule 6). 20 Hz: enough for
 * a bar that also carries a ~100 ms CSS transition, cheap enough that one
 * snapshot and two row renders per step are invisible in a frame budget.
 */
export const PUMP_MS = 50;

/**
 * AUTHORED (presentation only). The largest jump a hidden tab, a GC pause or a
 * slow art load may hand the engine in one go. Neither constant can change an
 * outcome — see property 4 above.
 */
export const MAX_STEP_MS = 250;

/** The slice of the FFX-2 engine the pump needs, structurally. */
export interface ActiveClockEngine {
  tick(ms: number, opts?: { throughInput?: boolean }): BattleEvent[];
  inputValid(actorId: CombatantId): boolean;
  gaugeSnapshot(): AtbSnapshot;
}

/**
 * An engine that runs an Active clock, or `null`.
 *
 * This is the FFX/FFX-2 fork for the whole feature, in one place: FFX has no
 * `tick` at all, so its input branch never starts a pump.
 */
export function activeClockEngine(engine: unknown): ActiveClockEngine | null {
  const e = engine as Partial<ActiveClockEngine> | null;
  if (!e || typeof e.tick !== 'function' || typeof e.inputValid !== 'function') return null;
  if (typeof e.gaugeSnapshot !== 'function') return null;
  return e as ActiveClockEngine;
}

/** Why the pump stopped. */
export type PumpStop =
  /** The menu settled (a command was picked, or the loop was abandoned). */
  | 'settled'
  /** The owner can no longer answer: KO, Stop, Sleep, Petrify, chain lock, Berserk, battle over. */
  | 'invalidated';

export interface ActivePumpDeps {
  engine: ActiveClockEngine;
  /** Whose menu is open. */
  actorId: CombatantId;
  /** True once the menu promise has settled; the pump stops asking. */
  settled: () => boolean;
  /** True once the presenter has been torn down. */
  aborted: () => boolean;
  /** The presenter's **unscaled** sleep — the pause gate. */
  sleep: (ms: number) => Promise<void>;
  /** Real elapsed time. Tests inject a fake clock. */
  now: () => number;
  /** The presenter's own `play`, so an enemy turn animates exactly as it does elsewhere. */
  play: (events: BattleEvent[]) => Promise<PlayResult>;
  /** Cheap gauge-only HUD refresh (never a full `sync`, which re-predicts intent). */
  syncGauges: (snapshot: AtbSnapshot) => void;
}

/**
 * Run the clock for as long as the command menu is open.
 *
 * Serialised on purpose: no second step starts inside `play`, so events never
 * interleave and the event log stays the single ordered truth.
 */
export async function runActivePump(deps: ActivePumpDeps): Promise<PumpStop> {
  let last = deps.now();

  for (;;) {
    if (deps.settled() || deps.aborted()) return 'settled';
    await deps.sleep(PUMP_MS);
    if (deps.settled() || deps.aborted()) return 'settled';

    const at = deps.now();
    const dt = Math.min(Math.max(0, at - last), MAX_STEP_MS);
    last = at;

    const events = deps.engine.tick(dt, { throughInput: true });
    if (events.length > 0) {
      await deps.play(events);
      // Property 5. Measured from *after* the animation, never through it.
      last = deps.now();
      if (deps.aborted()) return 'settled';
    } else {
      deps.syncGauges(deps.engine.gaugeSnapshot());
    }

    // A command that arrived while we were playing wins; only then do we ask
    // whether the menu is still answerable, so a girl who submitted on the same
    // step she was KO'd is not robbed of her command.
    if (deps.settled()) return 'settled';
    if (!deps.engine.inputValid(deps.actorId)) return 'invalidated';
  }
}
