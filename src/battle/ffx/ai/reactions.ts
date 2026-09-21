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
import { GUADO_GUARDIAN_SCRIPT, macalaniaGuardianCounter } from './seymour-anima-macalania.ts';
import { collectEvraeCounters } from './evrae-counters.ts';
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
    // **The Guado Guardians' Auto-Potion** [ffx-seymour-anima-macalania §2.3]:
    // a counter on being damaged, +1,000 HP, disabled by one successful Steal.
    // Nothing here reuses `ticks.ts`'s Auto-Potion, which is the *character
    // equipment* path (HP < 50%, `hasAuto`) and a different rule entirely.
    // Trigger scope — any damage vs physical only — is the owner-approved
    // assumption C-11, held behind one constant in the script file.
    if (script === GUADO_GUARDIAN_SCRIPT) {
      const command = macalaniaGuardianCounter(ai);
      if (command) out.push({ actorId: enemy.id, command, cause: 'script' });
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
