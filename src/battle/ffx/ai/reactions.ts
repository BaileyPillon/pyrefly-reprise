/**
 * Boss reactions: the counters that fire from the *hit hook* rather than from
 * a scheduled turn.
 *
 * All of these cost **0 CTB ticks** and never consult a rank. **Every boss answers from its script's `onHit` hook now**
 * (`ai/hooks.ts`, run once per action per target before the death check, for a hit, a miss and a status-only action
 * alike): Seymour Flux and the Mortiorchis, Macalania's Seymour and the Guado Guardians, Natus and Mortibody
 * (`ai/seymour-*.ts`, `ai/macalania-*.ts`); Yunalesca, Braska's Final Aeon and Yu Yevon (`ai/yunalesca.ts`,
 * `ai/yu-yevon.ts`, registered through `ai/hit-script.ts`); and Evrae and Cid, Yojimbo, Isaaru's aeons, the Fins, Genais
 * and the Core, and Sin's face (AI lane C: `ai/evrae-counters.ts`, `ai/yojimbo.ts`, `ai/isaaru.ts`, `ai/sin-fins.ts`,
 * `ai/sin-genais-core.ts`, `ai/overdrive-sin.ts`, also through `ai/hit-script.ts`). What a hook queues is run by
 * `ai/reaction-drain.ts`; the Threaten rule [ffx-combat-core §4.2] is `ai/hooks.ts#canQueueCommand` (the drain's gate) and
 * `ai/game-rolls.ts#canQueue` (the scripts' own).
 *
 * That leaves this collector with no producer. It stays as the engine's seam for a player-side action's counters
 * (`engine-end.ts#afterAction` runs whatever it returns first), and returns none.
 *
 * A counter never triggers another counter.
 */

import type { AbilityDef, Command, CombatantId, FFXCombatant } from '../../common/types.ts';
import type { Ctx } from '../state.ts';
import { runSinLivenessHooks } from './sin-counters.ts';

/** One queued free action. */
export interface BossCounter {
  actorId: CombatantId;
  command: Command;
  cause: string;
}

/**
 * Collect the counters an action provoked.
 *
 * `damagedEnemyIds` is every enemy the action actually resolved against —
 * healing an ally, buffing, summoning or a party-targeted Overdrive provokes
 * nothing [ffx-yunalesca §14.11].
 *
 * (No boss's answer is collected here any more: they are the engine's hit events, `ai/hooks.ts`, which see a hit that
 * missed, a heal and a status-only action too.)
 */
export function collectBossCounters(
  ctx: Ctx,
  attacker: FFXCombatant,
  def: AbilityDef,
  damagedEnemyIds: readonly CombatantId[],
): BossCounter[] {
  void ctx;
  void damagedEnemyIds;
  const out: BossCounter[] = [];
  if (def.flags.includes('is-counter')) return out;

  // Chapter X (Seymour Natus and Mortibody) answers from `onHit` hooks (`ai/seymour-natus.ts`): his phase follows
  // every hit, his own reflected spells included, and Mortibody's revive and drain are a hook and a queued reaction.

  // **Only a player-side action provokes the counters collected below.** (Yunalesca's and Yu Yevon's, which the game
  // raises for an enemy-side hit too, are hit events.)
  if (attacker.side === 'enemy') return out;

  // The per-enemy loop that used to answer here is gone with its last users: Flux, the Mortiorchis, the Guado
  // Guardians and Natus (AI-Seymour), Yunalesca and Yu Yevon (AI lane B), and Evrae and Sin (AI lane C) all answer from
  // `onHit` hooks now.

  return out;
}

/**
 * What `afterAction` runs first. Both mounts are hooks (`ai/seymour-flux-hooks.ts`, `ai/seymour-natus.ts`): their
 * revive and their drain run from `onHit` and the reaction queue (`ai/mount-revive.ts`, `ai/reaction-drain.ts`).
 * What is left is Sin's liveness marks.
 */
export function runMortibsorptionIfDown(ctx: Ctx): boolean {
  runSinLivenessHooks(ctx); // Sin link 3 (FFX): the Genais/Core marks follow isAlive, every action (sin-counters.ts)
  return false;
}
