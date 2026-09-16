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
import { mortibsorption } from '../scripted.ts';
import { activeScriptId } from './index.ts';
import { aiContextFor } from './types.ts';
import { seymourDelayCounter, seymourThresholdCounters } from './seymour-flux.ts';
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
 */
export function collectBossCounters(
  ctx: Ctx,
  attacker: FFXCombatant,
  def: AbilityDef,
  damagedEnemyIds: readonly CombatantId[],
): BossCounter[] {
  const out: BossCounter[] = [];
  if (def.flags.includes('is-counter')) return out;

  for (const id of damagedEnemyIds) {
    const enemy = tryActor(ctx, id);
    if (!enemy || enemy.side !== 'enemy') continue;
    if (enemy.id === attacker.id) continue;
    const script = activeScriptId(enemy);
    const ai = aiContextFor(ctx, enemy);

    if (script === 'seymour-flux' || script === 'mortiorchis') {
      // Attempting to Delay either actor fails (both are immune-to-delay) AND
      // is punished with party-wide Slowga [ffx-seymour-flux §4.6].
      if (def.flags.includes('weak-delay') || def.flags.includes('strong-delay')) {
        const host = tryActor(ctx, 'seymour-flux');
        if (host && isAlive(host)) {
          out.push({ actorId: host.id, command: seymourDelayCounter(aiContextFor(ctx, host)), cause: 'script' });
        }
      }
      if (script !== 'seymour-flux') continue;
      for (const command of seymourThresholdCounters(ai, false)) {
        out.push({ actorId: enemy.id, command, cause: 'script' });
      }
      continue;
    }
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
  return out;
}

/**
 * The Mortiorchis's death trigger [ffx-seymour-flux §2.2].
 *
 * A reaction, not a scheduled turn: it consumes no CTB, does not advance the
 * charge ladder and does not trip the alternation guard. It fires even when the
 * drain is lethal to Seymour.
 */
export function runMortibsorptionIfDown(ctx: Ctx): boolean {
  const mount = tryActor(ctx, 'mortiorchis');
  const host = tryActor(ctx, 'seymour-flux');
  if (!mount || !host) return false;
  if (mount.hp > 0 && isAlive(mount)) return false;
  mortibsorption(ctx, mount, host);
  // Mortibsorption damage DOES trigger Seymour's HP-threshold reactions.
  const ai = aiContextFor(ctx, host);
  for (const command of seymourThresholdCounters(ai, false)) {
    void command;
  }
  return true;
}

/** Whether a combatant is still able to fire a counter at all. */
export function canCounter(ctx: Ctx, id: CombatantId): boolean {
  const c = tryActor(ctx, id);
  if (!c || !isAlive(c)) return false;
  // A Threatened enemy cannot act or counterattack [ffx-combat-core §4.2].
  return rtOf(ctx, id) !== undefined && c.statuses['threaten'] === undefined;
}
