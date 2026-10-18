/**
 * Turn-boundary effects and automatic reactions.
 *
 * Regen pays out at the **start of any unit's turn** — not only the carrier's —
 * which is what makes the `+100` addend matter and what the Yunalesca fight
 * weaponises against Zombied party members [ffx-combat-core §4.3].
 *
 * **The tick rules are the game's** (re-parity W2; FFX only): the start-of-turn tick (Regen's payout from each holder's own tick
 * counter, Regen's countdown, the stances, the Threaten pair), Doom's countdown, the end-of-turn counters and Poison are the
 * kernels of `kernel/turn-ticks.ts`, reached through `./adapt/ticks.ts`. What stays here is what the kernels do not model: the
 * Overdrive gauge's turn hooks and the Omnis and Sin hooks. (The equipment reactions are not decided here any more: Counterattack, Evade and Counter and Magic Counter
 * are `counter-chain.ts`, the item reactions `adapt/reactions.ts`.)
 */

import type { FFXCombatant } from '../common/types.ts';
import type { Ctx } from './state.ts';
import { refreshCriticalStatus } from './statuses.ts';
import { doomTurn, endOfTurn, startOfTurn } from './adapt/ticks.ts';
import { gaugeOnTurn } from './gauge.ts';
import { runSinLivenessHooks } from './ai/sin-counters.ts';
import { runPostPoison, runPreTurn } from './ai/hooks.ts';

/**
 * Everything that happens as a combatant's turn opens, in the game's order (`pp_BtlTurnStart`, VA 0x00792a90): the start-of-turn
 * tick, then the scripts' pre-turn hooks, then Doom, then the actor's own gauge hooks.
 *
 * The tick (VA 0x007af4f0): Regen pays every holder on the field `(its own tick counter * maxHP >> 8) + 100` (a Zombie takes it
 * as damage), the actor's Regen counter counts down, Defend, Guard, Sentinel, Shield and Boost end on the actor unless equipment
 * gives them, and the Threaten pair the actor belongs to is released. Doom's countdown (VA 0x00799cd0) goes down one; at 0 the
 * actor dies and its turn is over, which the caller sees as a dead actor.
 */
export function onTurnStart(ctx: Ctx, actor: FFXCombatant): void {
  startOfTurn(ctx, actor);
  // The scripts' preTurn hooks run at every turn start, after the start-of-turn tick and before Doom and the action request: the formation's
  // for everybody, then the actor's own script (re-parity, FFX only; `ai/hooks.ts`). Inert with none registered. That is the game's order:
  // its turn start calls the tick (VA 0x007af4f0), then requests the pre-turn entry of the scripts (VA 0x00792a90), then Doom's tick
  // (VA 0x00799cd0). The release-candidate line ran the hooks ahead of Regen's payout, before the tick was the game's.
  runPreTurn(ctx, actor);
  refreshCriticalStatus(ctx, actor);

  // Doom counts down on the victim's own turn, even while asleep or skipping.
  if (doomTurn(ctx, actor)) return;

  // The gauge's turn hook (Ally, Daredevil, Loner, Sufferer; `pp_BtlOdOnTurn`): the game runs it as the scheduler queues a turn.
  gaugeOnTurn(ctx, actor);
}

/**
 * Everything that happens as a combatant's turn closes: the end-of-turn tick (VA 0x007af390: Sleep, Silence, Darkness, Shell,
 * Protect, Reflect, Haste and Slow count down one) and Poison, which only follows an action whose results were applied.
 * `resultsApplied` is false for a passed turn (a sleeper's), which takes no Poison damage (VA 0x007b20e0).
 */
export function onTurnEnd(ctx: Ctx, actor: FFXCombatant, resultsApplied = true): void {
  // (Nothing of Omnis's runs at a turn's end any more: his discs turn from the script's `onHit` and his affinity is
  // refreshed by the formation's pre-turn hook, `ai/seymour-omnis.ts`.)
  // The monster's postPoison hook runs right after its own Poison tick (Macalania's Seymour only): `endOfTurn` says
  // whether the tick damaged the actor.
  if (endOfTurn(ctx, actor, resultsApplied)) runPostPoison(ctx, actor);
  // Sin link 3 (FFX): once more after the counters and the tick, so a Genais KO inside the counter phase (Zombie +
  // its own Cura) frees the Core before the next menu, not an action later (CHECK 2 finding 2). A no-op elsewhere.
  runSinLivenessHooks(ctx);
}
