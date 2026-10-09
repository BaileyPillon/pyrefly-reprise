/**
 * Boss reactions — the counters that fire from the *hit hook* rather than from
 * a scheduled turn.
 *
 * All of these cost **0 CTB ticks** and never consult a rank: Yunalesca's
 * Blind/Silence/Sleep and Dispelling Slap [ffx-yunalesca §5.1, §14.8],
 * Seymour's threshold Protect/Reflect and his Slowga punish
 * [ffx-seymour-flux §4.3, §4.6], and Yu Yevon's Curaga [ffx-bfa-yu-yevon §3.4.1].
 *
 * A counter never triggers another counter.
 */

import type { AbilityDef, Command, CombatantId, FFXCombatant } from '../../common/types.ts';
import { type Ctx, isAlive, rtOf, tryActor } from '../state.ts';
import { activeScriptId } from './index.ts';
import { aiContextFor } from './types.ts';
import { collectEvraeCounters } from './evrae-counters.ts';
import { collectSinCounters, runSinLivenessHooks } from './sin-counters.ts';
import { yunalescaCounter } from './yunalesca.ts';
import { yuYevonCounter } from './yu-yevon.ts';

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

  // **Only a player-side action provokes a counter.**
  //
  // `ffx-bfa-yu-yevon §3.4.1` states the rule as "at most one Curaga per
  // **player-side action** that deals him damage", and its own table scores the
  // enemy-side rows at **0** Curagas: "Yu Yevon's Curaga counter" excludes
  // "Gravija's self-damage", "Yu Pagoda Power Wave" and the counter's own
  // Zombie-inverted damage. Without this guard a Pagoda's Power Wave on Yu
  // Yevon fired his 9,999 Curaga on the boss's own behalf — round 03 blocker
  // #15 measured one Curaga per Power Wave, against the research's 0 — and the
  // free healing is what made his attrition route unreachable.
  //
  // `ffx-yunalesca §14.11` draws the same line for her counters: they answer
  // what the *party* did.
  if (attacker.side === 'enemy') return out;

  for (const id of damagedEnemyIds) {
    const enemy = tryActor(ctx, id);
    if (!enemy || enemy.side !== 'enemy') continue;
    if (enemy.id === attacker.id) continue;
    // **Threaten stops the counter, not just the turn** [ffx-combat-core §4.2:
    // "Target cannot act **or counterattack**"]. {@link canCounter} has always
    // encoded that sentence; until round 04 nothing called it, so a Threatened
    // Yunalesca kept countering (round 04 PR-0004, observed twice at runtime).
    // FFX only: Threaten is an FFX ability and the ATB engine has no equivalent
    // status, so FFX-2 is untouched — this collector is FFX-side only.
    if (!canCounter(ctx, enemy.id)) continue;
    const script = activeScriptId(enemy);
    const ai = aiContextFor(ctx, enemy);

    // Chapter I (Flux and the Mortiorchis) no longer answers from this collector: the game's `onHit`
    // hooks do (`ai/seymour-flux-hooks.ts`, once per action per target, before the death check).
    // The Guado Guardians' Auto-Potion is their `onHit` hook now (`ai/macalania-guardian.ts`).
    if (script?.startsWith('yunalesca')) {
      if (!isAlive(enemy)) continue; // the killing blow of each form is never countered
      const command = yunalescaCounter(ai, attacker.id, def.damageType);
      if (command) out.push({ actorId: enemy.id, command, cause: 'script' });
      continue;
    }
    if (script === 'yu-yevon') {
      const command = yuYevonCounter(ai);
      if (command) out.push({ actorId: enemy.id, command, cause: 'script' });
      continue;
    }
  }

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
