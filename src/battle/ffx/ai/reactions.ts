/**
 * Boss reactions — the counters that fire from the *hit hook* rather than from
 * a scheduled turn.
 *
 * All of these cost **0 CTB ticks** and never consult a rank. What this collector still answers is what the engine
 * had before the boss scripts' own hooks: Evrae's three counters and Sin's. Every other boss answers from its
 * script's `onHit` hook (`ai/hooks.ts`, run once per action per target before the death check): Seymour Flux and
 * the Mortiorchis, Macalania's Seymour and the Guado Guardians, Natus and Mortibody (`ai/seymour-*.ts`,
 * `ai/macalania-*.ts`), and Yunalesca and Yu Yevon (`ai/yunalesca.ts`, `ai/yu-yevon.ts`, registered through
 * `ai/hit-script.ts`), which run for every sub-action that reached them.
 *
 * A counter never triggers another counter.
 */

import type { AbilityDef, Command, CombatantId, FFXCombatant } from '../../common/types.ts';
import { type Ctx, isAlive, rtOf, tryActor } from '../state.ts';
import { collectEvraeCounters } from './evrae-counters.ts';
import { collectSinCounters, runSinLivenessHooks } from './sin-counters.ts';

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
 * `statusAddedEnemyIds` is every enemy the action landed a **status** on, and
 * it is a separate list on purpose. Evrae answers **Slow landing** while it is
 * already Hasted [ffx-evrae-airship §5.5, verified: 2 sources], and Slow's
 * `ctb` formula may or may not emit a `damage` event on the same action — so a
 * counter keyed off the damage set would fire or not fire by seed. Every boss
 * that shipped before this parameter existed ignores it, which is what keeps
 * Chapters 1-3's event logs byte-identical.
 */
export function collectBossCounters(
  ctx: Ctx,
  attacker: FFXCombatant,
  def: AbilityDef,
  damagedEnemyIds: readonly CombatantId[],
  statusAddedEnemyIds: readonly CombatantId[] = [],
): BossCounter[] {
  const out: BossCounter[] = [];
  if (def.flags.includes('is-counter')) return out;

  // Chapter X (Seymour Natus and Mortibody) answers from `onHit` hooks now (`ai/seymour-natus.ts`): his phase follows
  // every hit, his own reflected spells included, and Mortibody's revive and drain are a hook and a queued reaction.

  // **Only a player-side action provokes the counters collected below.** (Yunalesca's and Yu Yevon's, which the game
  // raises for an enemy-side hit too, are hit events now.)
  if (attacker.side === 'enemy') return out;

  // The per-enemy loop that used to answer here is gone with its last two users: Flux, the Mortiorchis, the Guado
  // Guardians and Natus (AI-Seymour) and Yunalesca and Yu Yevon (AI lane B) all answer from `onHit` hooks now.

  // **Evrae answers three different things**, and only one of them is "you hurt
  // me": the Stone Gaze aggro counter reads the damage set, the counter-Haste
  // reads the status set, and Swooping Scythe reads *being targeted at all*
  // [ffx-evrae-airship §5.3, §5.5, §4.5]. Collected once for the encounter
  // rather than once per damaged enemy, because two of the three do not have a
  // damaged enemy to hang off. A no-op in every other battle.
  for (const c of collectEvraeCounters(ctx, def, damagedEnemyIds, statusAddedEnemyIds)) {
    const evrae = tryActor(ctx, c.actorId);
    if (!evrae || !canCounter(ctx, c.actorId)) continue;
    out.push({ actorId: c.actorId, command: { kind: 'ability', id: c.abilityId, targets: [] }, cause: c.cause });
  }

  // **Sin** (FFX only): Overdrive Sin's Gaze [ffx-sin §5.4], the Fins' counters [§5.1] and link 3's [§5.3], once
  // per action as Evrae's are (`sin-counters.ts`). A counter may name its aim: Waterga goes to the caster [§3.2,
  // verified: 4 sources]; unset, the engine resolves it as before. A no-op in every other battle.
  for (const c of collectSinCounters(ctx, attacker, def, damagedEnemyIds)) {
    if (!canCounter(ctx, c.actorId)) continue;
    out.push({ actorId: c.actorId, command: { kind: 'ability', id: c.abilityId, targets: c.targets ?? [] }, cause: c.cause });
  }
  return out;
}

/**
 * What `afterAction` runs first. Both mounts are hooks now (`ai/seymour-flux-hooks.ts`, `ai/seymour-natus.ts`): their
 * revive and their drain run from `onHit` and the reaction queue (`ai/mount-revive.ts`, `ai/reaction-drain.ts`).
 * What is left is Sin's liveness marks.
 */
export function runMortibsorptionIfDown(ctx: Ctx): boolean {
  runSinLivenessHooks(ctx); // Sin link 3 (FFX): the Genais/Core marks follow isAlive, every action (sin-counters.ts)
  return false;
}

/** Whether a combatant is still able to fire a counter at all. */
export function canCounter(ctx: Ctx, id: CombatantId): boolean {
  const c = tryActor(ctx, id);
  if (!c || !isAlive(c)) return false;
  // A Threatened enemy cannot act or counterattack [ffx-combat-core §4.2].
  return rtOf(ctx, id) !== undefined && c.statuses['threaten'] === undefined;
}
