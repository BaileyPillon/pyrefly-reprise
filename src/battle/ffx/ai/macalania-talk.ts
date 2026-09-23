/**
 * Seymour and Anima, Macalania Temple: the Trigger Command (FFX only
 * [AGENTS.md rule 14]). Split out of `./macalania-rules.ts` for the 400-line
 * house rule; re-exported from there, so every import is unchanged.
 */

import type { CombatantId, FFXCombatant } from '../../common/types.ts';
import type { Ctx } from '../state.ts';

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

/** Who still has a Talk line left, for the menu and the intent panel. */
export function macalaniaTalkAvailable(ctx: Ctx, talkerId: CombatantId): boolean {
  if (!(talkerId in MACALANIA_TALK_BONUS)) return false;
  return ctx.state.flags[`${MAC_TALKED}${talkerId}`] !== true;
}

/** Spend `talker`'s one Talk line. Returns false when there is nothing to say. */
export function consumeMacalaniaTalk(ctx: Ctx, talker: FFXCombatant): boolean {
  const bonus = MACALANIA_TALK_BONUS[talker.id];
  if (!bonus) return false;
  const key = `${MAC_TALKED}${talker.id}`;
  if (ctx.state.flags[key] === true) return false;
  ctx.state.flags[key] = true;
  talker.stats[bonus.stat] += bonus.amount;
  ctx.emit({ type: 'message', text: `${talker.name}: +${bonus.amount} ${bonus.label}`, kind: 'story' });
  return true;
}
