/**
 * AI script registry.
 *
 * Importing this module registers every rotation the three FFX chapters need.
 * `EnemyForm.aiScriptId` wins over `EnemyFields.aiScriptId`, so a boss can
 * change behaviour on a form change without swapping combatants
 * [ffx-combat-core §12.2].
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, isAlive, livingFriendlies, tryActor } from '../state.ts';
import { type AiContext, aiContextFor, getAiScript } from './types.ts';
import { consumeSeymourTalk, seymourTalkAvailable } from './seymour-flux.ts';
import { consumeBfaTalk } from './braskas-final-aeon.ts';

import './seymour-flux.ts';
import './yunalesca.ts';
import './braskas-final-aeon.ts';
import './yu-yevon.ts';

export * from './types.ts';
export { seymourDelayCounter, seymourThresholdCounters, consumeSeymourTalk, seymourTalkAvailable } from './seymour-flux.ts';
export { yunalescaCounter, yunalescaEntryAction } from './yunalesca.ts';
export { bfaTalkCharges, consumeBfaTalk } from './braskas-final-aeon.ts';
export { yuYevonCounter, YU_YEVON_CURAGA_THRESHOLD } from './yu-yevon.ts';

/** The boss a Trigger Command is aimed at: the living non-part enemy. */
function triggerHost(ctx: Ctx): FFXCombatant | undefined {
  return ctx.state.enemyIds
    .map((id) => tryActor(ctx, id))
    .find((c): c is FFXCombatant => c !== undefined && isAlive(c) && !c.flags.isPart);
}

/**
 * Run the **Talk** Trigger Command for whoever submitted it.
 *
 * Talk is one menu row with two entirely different, entirely encounter-owned
 * effects, so the dispatch is on the boss standing opposite:
 *
 * - **Braska's Final Aeon** — zeroes his Overdrive gauge and costs him his next
 *   turn; **two charges, battle-wide**, offered a deliberately inert third time
 *   [ffx-bfa-yu-yevon §1.6, §7.3].
 * - **Seymour Flux** — Kimahri +10 Strength, Yuna +10 Magic Defense, **once per
 *   character** [ffx-seymour-flux §4.7].
 *
 * Returns false when the command had no effect, so the executor can say so
 * instead of eating a turn in silence.
 */
export function applyTalkTrigger(ctx: Ctx, talker: FFXCombatant): boolean {
  const boss = triggerHost(ctx);
  if (!boss) return false;
  const script = activeScriptId(boss) ?? boss.id;
  if (script === 'seymour-flux' || script === 'mortiorchis') return consumeSeymourTalk(ctx, talker);
  if (script.startsWith('bfa') || script === 'braskas-final-aeon') {
    return consumeBfaTalk(aiContextFor(ctx, boss));
  }
  return false;
}

/** True when submitting Talk right now would do something [§4.7, §1.6]. */
export function talkAvailable(ctx: Ctx, talker: FFXCombatant): boolean {
  const boss = triggerHost(ctx);
  if (!boss) return false;
  const script = activeScriptId(boss) ?? boss.id;
  if (script === 'seymour-flux' || script === 'mortiorchis') return seymourTalkAvailable(ctx, talker.id);
  if (script.startsWith('bfa') || script === 'braskas-final-aeon') {
    const used = ctx.state.flags['bfa.talkUsed'];
    return typeof used === 'number' ? used < 2 : true;
  }
  return false;
}

/** The script id in force for this combatant right now. */
export function activeScriptId(self: FFXCombatant): string | undefined {
  const enemy = self.enemy;
  if (!enemy) return undefined;
  const form = enemy.forms[enemy.formIndex];
  return form?.aiScriptId ?? enemy.aiScriptId;
}

/**
 * Pick an action for an AI-controlled combatant.
 *
 * Falls back to a plain Attack when no script is registered for the id, so a
 * data file that names a rotation the engine has not implemented still plays
 * rather than crashing.
 */
export function chooseAiCommand(ctx: Ctx, self: FFXCombatant): Command | null {
  const id = activeScriptId(self);
  const script = id ? getAiScript(id) : undefined;
  const ai: AiContext = aiContextFor(ctx, self);
  if (script) return script(ai);

  // Confused actors attack a random target on either side; Berserk restricts to
  // an auto-attack [ffx-combat-core §4.2].
  const targets = livingFriendlies(ctx);
  return { kind: 'attack', targets: targets.length > 0 ? [ctx.rng.pick(targets).id] : [] };
}
