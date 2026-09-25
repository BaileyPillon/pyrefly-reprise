/**
 * **Action time (method check E4): an actor's own gauge waits for its action to play out.**
 * **FFX-2 only** [AGENTS.md rule 14]: FFX is CTB and has no gauge to hold
 * (`research/ffx-vs-ffx2-presentation.md` §4.3). **OFF everywhere by default.**
 *
 * The rule is sourced, the length is not (`research/ffx2-trema.md` §12.4):
 *
 * - **Sourced `[verified: 2 sources]`:** a turn is fill, then charge, then the *execution* of the
 *   action, and only after it (and any recovery) does the bar refill (FF Wiki *Haste (Final Fantasy
 *   X-2 status)* revid 3998880; Split_Infinity FAQ 25872 G0905 rule 4 and G1019). The engine, until
 *   now, started the refill the moment an action resolved: an action took no time.
 * - **Sourced `[verified: 2 sources]`:** the *other* units' gauges keep filling meanwhile in Active
 *   mode (Split G0913 "If ATB mode is set to Active, time always passes"; FF Wiki *Active Time
 *   Battle* revid 3995539). Here that falls out of the model: the wait is paid as the actor's own
 *   `atb.recovery`, which every other gauge ignores, and the clock that pays it is the one the
 *   Wait and Wait-split holds already stop (`active.ts#clockHeldByMenu`), so they apply unchanged.
 *   The same clock carries Haste's ×1.05 (Haste "affects the speed at which attacks are executed",
 *   Split G1019, `[verified: 2]`), Slow's ×0.5 (no source says Slow slows an animation: our
 *   reading) and Stop's freeze.
 * - **Unsourced: the LENGTH.** "Nothing is published": no source gives any FFX-2 animation or
 *   recovery length (§12.4). {@link ACTION_TIME_ESTIMATE_SECONDS} is **one labelled estimate
 *   parameter**, the same for every action and every unit, and needs Bailey's word before it ships.
 *
 * **Not modelled, each on purpose:** the "Automatic Wait" some long animations trigger (§12.4: which
 * ones is unpublished); that an enemy mid-animation cannot be chained (2 sources, a separate rule);
 * a Short spherechange freezes everyone (2 sources), so a spherechange owes no action time here (the
 * freeze means nobody else moves either, which is the engine's instant change); an out-of-turn
 * counter (`engineHooks.ts#runCounters`) is not its actor's turn and owes none; a flavour turn
 * (`decide` returned `null`) plays nothing and owes none.
 *
 * **The switches** (each one line; the most specific wins):
 * 1. `Ffx2EngineOptions.actionTimeSeconds` — one engine, for a measurement run.
 * 2. `EnemyGroupDef.actionTimeSeconds` — one formation. Chapter XIII's two links read
 *    `CLOISTER_ACTION_TIME` (`src/data/ffx2/enemies/trema.ts`).
 * 3. {@link ACTION_TIME_ALL_FFX2} — every FFX-2 battle (Chapters 4, 5, 6, XI and XIII).
 *
 * Deterministic and DOM-free: no RNG draw, so a replay moves only through the time it adds.
 */

import { TICK_RATE_BASE } from './constants.ts';

/**
 * **`[estimate]` — the length of one action, in seconds of game time at Normal ATB speed.**
 * Unsourced (research §12.4: no published lengths). 1.5 s is the shorter of the two lengths the
 * scratch probes measured (`docs/plans/trema-bench.md`, "Probes, not built": 1.5 s and 3 s); the
 * longer one helps the party more. Read only where a switch below turns action time on.
 */
export const ACTION_TIME_ESTIMATE_SECONDS = 1.5;

/** **The global switch: OFF.** `true` gives every FFX-2 battle action time of the estimate's length. */
export const ACTION_TIME_ALL_FFX2 = false;

/** The battle flag `setup.ts` copies from `EnemyGroupDef.actionTimeSeconds`. */
export const ACTION_TIME_FLAG = 'actionTimeSeconds';

/**
 * Seconds of action time this battle owes per action: the engine option, else the formation's
 * value, else the global switch. `0` is off.
 */
export function actionTimeSeconds(
  option: number | undefined,
  flags: Readonly<Record<string, number | string | boolean>>,
): number {
  if (typeof option === 'number') return Math.max(0, option);
  const group = flags[ACTION_TIME_FLAG];
  if (typeof group === 'number') return Math.max(0, group);
  return ACTION_TIME_ALL_FFX2 ? ACTION_TIME_ESTIMATE_SECONDS : 0;
}

/** {@link actionTimeSeconds} in ticks of the global clock (3,000 a second at Normal, §1.2). */
export function actionTimeTicks(
  option: number | undefined,
  flags: Readonly<Record<string, number | string | boolean>>,
): number {
  return Math.round(actionTimeSeconds(option, flags) * TICK_RATE_BASE);
}
