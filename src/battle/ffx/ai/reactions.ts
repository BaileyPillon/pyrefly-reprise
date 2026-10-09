/**
 * Boss reactions — the counters that fire from the *hit hook* rather than from
 * a scheduled turn.
 *
 * All of these cost **0 CTB ticks** and never consult a rank: Seymour's
 * threshold Protect/Reflect and his Slowga punish [ffx-seymour-flux §4.3, §4.6]
 * and the rest below. Yunalesca's counters and Yu Yevon's Curaga left this file
 * for the engine's hit events (`hit-hooks.ts`, `ai/yunalesca.ts`,
 * `ai/yu-yevon.ts`), which run for every sub-action that reached them.
 *
 * A counter never triggers another counter.
 */

import type { AbilityDef, Command, CombatantId, FFXCombatant } from '../../common/types.ts';
import { type Ctx, isAlive, rtOf, tryActor } from '../state.ts';
import { mortibsorption } from '../scripted.ts';
import { activeScriptId } from './index.ts';
import { aiContextFor } from './types.ts';
import { seymourDelayCounter, seymourThresholdCounters, stepFluxPhase } from './seymour-flux.ts';
import { GUADO_GUARDIAN_SCRIPT, macalaniaGuardianCounter } from './seymour-anima-macalania.ts';
import { collectEvraeCounters } from './evrae-counters.ts';
import { collectSinCounters, runSinLivenessHooks } from './sin-counters.ts';
import { MORTIBODY_ID, NATUS_ID, natusActionCounters, stepNatusPhase } from './seymour-natus-rules.ts';
import { executeCommand } from '../execute.ts';

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

  // **Chapter X, Seymour Natus** (FFX only): his stored phase moves on damage
  // from *any* action — B8 = a, our estimate, so his own spells bounced back
  // by Reflect count too — which is why this runs above the player-side guard
  // below. Empty unless the action damaged Natus, so every other battle is
  // untouched [docs/plans/chapter-natus-review.md N-G2, B8].
  for (const c of natusActionCounters(ctx, damagedEnemyIds)) {
    if (canCounter(ctx, c.actorId)) out.push(c);
  }

  // **Only a player-side action provokes the counters collected below.** (Yunalesca's and Yu Yevon's, which the game
  // raises for an enemy-side hit too, are hit events now.)
  if (attacker.side === 'enemy') return out;

  for (const id of damagedEnemyIds) {
    const enemy = tryActor(ctx, id);
    if (!enemy || enemy.side !== 'enemy') continue;
    if (enemy.id === attacker.id) continue;
    // Chapter I: a direct hit moves Seymour Flux's **stored** phase, Threatened
    // or not; a Poison tick never reaches this collector [ffx-seymour-flux §4.3].
    if (activeScriptId(enemy) === 'seymour-flux') stepFluxPhase(ctx);
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
 * The Mortiorchis's death trigger [ffx-seymour-flux §2.2].
 *
 * A reaction, not a scheduled turn: it consumes no CTB, does not advance the
 * charge ladder and does not trip the alternation guard. It fires even when the
 * drain is lethal to Seymour.
 */
export function runMortibsorptionIfDown(ctx: Ctx): boolean {
  runSinLivenessHooks(ctx); // Sin link 3 (FFX): the Genais/Core marks follow isAlive, every action (sin-counters.ts)
  if (runNatusMortibsorption(ctx)) return true;
  const mount = tryActor(ctx, 'mortiorchis');
  const host = tryActor(ctx, 'seymour-flux');
  if (!mount || !host) return false;
  if (mount.hp > 0 && isAlive(mount)) return false;
  mortibsorption(ctx, mount, host);
  // Mortibsorption damage DOES trigger Seymour's HP-threshold reactions
  // [ffx-seymour-flux §2.2, §4.3, verified: 2 sources], and they are **run**,
  // not dropped (combat-fixes-0924 (b), FFX only). Computing them and then
  // discarding them left the phase flag at 2 with no Reflect up, so his next
  // Flare detonated on himself (1,639 on seed 3). Executed exactly as Chapter
  // X's pair below: a `counter` event, then the command at no CTB cost. A later
  // player-side collector in the same action sees Protect/Reflect already up
  // and adds nothing, so nothing doubles.
  stepFluxPhase(ctx);
  runDrainCounters(ctx, host, mount, seymourThresholdCounters(aiContextFor(ctx, host), false));
  return true;
}

/** Run the counters a Mortibsorption drain owes its host, each at no CTB cost. */
function runDrainCounters(ctx: Ctx, host: FFXCombatant, mount: FFXCombatant, commands: readonly Command[]): void {
  for (const command of commands) {
    if (!canCounter(ctx, host.id)) continue;
    ctx.emit({
      type: 'counter',
      actorId: host.id,
      targetId: mount.id,
      abilityId: command.kind === 'ability' ? command.id : 'attack',
      cause: 'script',
    });
    executeCommand(ctx, host, command, true);
  }
}

/**
 * **Mortibody's** death trigger — Chapter X's own pair, not Chapter I's
 * (`docs/plans/chapter-natus-review.md` N-G1). The same drain
 * (`scripted.ts#mortibsorption`: its current max HP into Natus, back at the
 * next 1,000 down, floor 1,000; it fires even when the drain is lethal)
 * [ffx-seymour-natus-highbridge §4.4, verified: 4 sources].
 *
 * As in Chapter I's branch above, the counters the drain owes are **run**,
 * not dropped: Mortibsorption moves Natus's stored phase and, on the first
 * crossing of 24,000, fires his Protect counter [§4.2, single source: wiki].
 * Executed here, as the engine's counter loop does (a `counter` event, then
 * the command at no CTB cost), so `engine.ts` does not grow. A no-op in every
 * other battle.
 */
function runNatusMortibsorption(ctx: Ctx): boolean {
  const mount = tryActor(ctx, MORTIBODY_ID);
  const host = tryActor(ctx, NATUS_ID);
  if (!mount || !host) return false;
  if (mount.hp > 0 && isAlive(mount)) return false;
  mortibsorption(ctx, mount, host);
  runDrainCounters(ctx, host, mount, stepNatusPhase(ctx));
  return true;
}

/** Whether a combatant is still able to fire a counter at all. */
export function canCounter(ctx: Ctx, id: CombatantId): boolean {
  const c = tryActor(ctx, id);
  if (!c || !isAlive(c)) return false;
  // A Threatened enemy cannot act or counterattack [ffx-combat-core §4.2].
  return rtOf(ctx, id) !== undefined && c.statuses['threaten'] === undefined;
}
