/**
 * AI script registry.
 *
 * Importing this module registers every rotation the three FFX chapters need.
 * `EnemyForm.aiScriptId` wins over `EnemyFields.aiScriptId`, so a boss can
 * change behaviour on a form change without swapping combatants
 * [ffx-combat-core §12.2].
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, livingFriendlies } from '../state.ts';
import { type AiContext, aiContextFor, getAiScript } from './types.ts';

import './seymour-flux.ts';
import './yunalesca.ts';
import './braskas-final-aeon.ts';
import './yu-yevon.ts';

export * from './types.ts';
export { seymourDelayCounter, seymourThresholdCounters } from './seymour-flux.ts';
export { yunalescaCounter, yunalescaEntryAction } from './yunalesca.ts';
export { bfaTalkCharges, consumeBfaTalk } from './braskas-final-aeon.ts';
export { yuYevonCounter, YU_YEVON_CURAGA_THRESHOLD } from './yu-yevon.ts';

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
