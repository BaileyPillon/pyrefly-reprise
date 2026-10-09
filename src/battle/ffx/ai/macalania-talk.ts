/**
 * Seymour and Anima, Macalania Temple: the Trigger Command (FFX only
 * [AGENTS.md rule 14]). Split out of `./macalania-rules.ts` for the 400-line
 * house rule; re-exported from there, so every import is unchanged.
 */

import type { CombatantId, FFXCombatant } from '../../common/types.ts';
import type { Ctx } from '../state.ts';
import { has, isAlive } from '../state.ts';

/**
 * **This chapter's own Talk table — Tidus, Yuna, Wakka** [§5.5, verified: 2
 * sources].
 *
 * ⚠ **Not the Flux fight's set.** The *Trigger Command* master table lists
 * Tidus / Yuna / Wakka for *this* Seymour, Tidus / Yuna / Auron for Natus and
 * Yuna / Kimahri for Flux. `research/…-macalania.md` §13 row 4 calls a shared
 * table a **major** defect, so this table is deliberately its own record and
 * `ai/index.ts` dispatches on the boss standing opposite.
 *
 * The bonus lands on `stats`, not as a status, for the same reason
 * `consumeSeymourTalk` does it that way: only real stat points move the cubic
 * POWER term.
 */
const MACALANIA_TALK_BONUS: Readonly<
  Record<string, { readonly stat: 'str' | 'mdef'; readonly amount: number; readonly label: string }>
> = {
  tidus: { stat: 'str', amount: 10, label: 'Strength' },
  yuna: { stat: 'mdef', amount: 10, label: 'Magic Defense' },
  wakka: { stat: 'mdef', amount: 10, label: 'Magic Defense' },
};

const MAC_TALKED = 'macalania.talked.';

/** Seymour's summon takes the command away from all three (`removeCommand` in his summon row): act one only. */
function actOne(ctx: Ctx): boolean {
  const act = ctx.state.flags['macalania.act'];
  return act === undefined || act === 1;
}

/**
 * **Talk is switched by status** (re-parity, `research/re-ffx-ai-seymour.md` section 3.1; the formation script's
 * turn-start handlers). At the start of its turn the command is enabled for Tidus and for Yuna only while that
 * character is present without Death, Petrify, Sleep or Silence, and disabled otherwise. **Wakka's handler tests
 * Wakka and toggles Yuna's command** (a slip in the script), so Wakka's own Talk is never switched off by his
 * state; Yuna's own handler runs at the start of her own turn and decides what her menu shows, so the slip never
 * reaches a menu.
 */
function statusAllows(talker: FFXCombatant): boolean {
  if (talker.id === 'wakka') return true;
  return isAlive(talker) && !has(talker, 'petrify') && !has(talker, 'sleep') && !has(talker, 'silence');
}

/** Who still has a Talk line left, for the menu and the intent panel. */
export function macalaniaTalkAvailable(ctx: Ctx, talker: FFXCombatant | CombatantId): boolean {
  const who = typeof talker === 'string' ? ctx.state.combatants[talker] as FFXCombatant | undefined : talker;
  if (!who || !(who.id in MACALANIA_TALK_BONUS)) return false;
  if (!actOne(ctx)) return false;
  if (ctx.state.flags[`${MAC_TALKED}${who.id}`] === true) return false;
  return statusAllows(who);
}

/** Spend `talker`'s one Talk line. Returns false when there is nothing to say. */
export function consumeMacalaniaTalk(ctx: Ctx, talker: FFXCombatant): boolean {
  const bonus = MACALANIA_TALK_BONUS[talker.id];
  if (!bonus || !macalaniaTalkAvailable(ctx, talker)) return false;
  ctx.state.flags[`${MAC_TALKED}${talker.id}`] = true;
  talker.stats[bonus.stat] += bonus.amount;
  ctx.emit({ type: 'message', text: `${talker.name}: +${bonus.amount} ${bonus.label}`, kind: 'story' });
  return true;
}
