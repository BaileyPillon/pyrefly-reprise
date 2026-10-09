/**
 * **The Guado Guardians at Macalania Temple, as their script runs them** (m141, the same script for both;
 * re-parity; `research/re-ffx-ai-seymour.md` section 3.3; D-10, D-12). **Game case: FFX only.**
 *
 * ## The turn (`onTurn`), rows in order
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | first turn | **Protect** on itself, a real turn |
 * | 2 | never stolen from, and 4,800 is more than Seymour's HP | **Hi-Potion** on Seymour |
 * | 3 | Seymour is Poisoned or Silenced | **Remedy** on Seymour |
 * | 4 | it is Poisoned or Silenced | **Remedy** on itself |
 * | 5 | `GetRandomValue() mod 100 > 50` (**48.97 %**) | a second draw (`mod 4`) picks a spell and **the turn ends without casting it**: the instructions that would cast it sit after the return |
 * | 6 | Guardian A is Asleep or Silenced | **Remedy** on A |
 * | 7 | Guardian B is Asleep or Silenced | **Remedy on Seymour** (the script aims it at him, not at B) |
 * | 8 | otherwise | `mod 3`: Blizzard, Thunder or Shremedy at a random living member |
 *
 * Rows 2 to 4 return before the coin, so no number is spent on them.
 *
 * ## Being targeted and being hit (`onTargeted`, `onHit`)
 *
 * `onTargeted` remembers that the Guardian was **asleep when the command named it**. `onHit` (after the action's
 * last hit on it) takes the Guard off it; once it has been stolen from, zeroes its steal chance (so a second Steal
 * can never land); and answers with **Auto-Potion** (+1,000 HP, a reaction at no CTB cost) unless it is down, asleep
 * now, was asleep when targeted (that mark is spent without an answer), Threatened, took no HP (a heal, a miss, a
 * zero) or **has been stolen from**.
 */

import type { Command } from '../../common/types.ts';
import { has, livingFriendlies, rtOf, tryActor } from '../state.ts';
import { type AiContext, use } from './types.ts';
import { type ScriptHooks, queueReaction, registerScriptHooks } from './hooks.ts';
import { pickMatching, scriptCoin, scriptMod } from './script-random.ts';
import {
  GUARDIAN_HI_POTION_THRESHOLD,
  GUADO_GUARDIAN_SCRIPT,
  GUARDIAN_IDS,
  MAC_ASLEEP_MARK,
  MAC_PROTECTED,
  SEYMOUR_ID,
} from './macalania-rules.ts';

export const guadoGuardianAi = (ai: AiContext): Command | null => {
  const ctx = ai.ctx;
  const self = ai.self;

  const openedKey = `${MAC_PROTECTED}${self.id}`;
  if (ctx.state.flags[openedKey] !== true) {
    ctx.state.flags[openedKey] = true;
    return use(ai, 'protect', [self.id]);
  }

  const seymour = tryActor(ctx, SEYMOUR_ID);
  if (rtOf(ctx, self.id).stealCount === 0 && seymour && GUARDIAN_HI_POTION_THRESHOLD > seymour.hp) {
    return use(ai, 'guardian-hi-potion', [seymour.id]);
  }
  if (seymour && (has(seymour, 'poison') || has(seymour, 'silence'))) return use(ai, 'guardian-remedy', [seymour.id]);
  if (has(self, 'poison') || has(self, 'silence')) return use(ai, 'guardian-remedy-self', [self.id]);

  if (scriptCoin(ctx)) {
    scriptMod(ctx, 4); // picks Blizzard, Thunder or Shremedy and returns before casting it: the draw is spent, the turn is not
    return null;
  }
  const a = tryActor(ctx, GUARDIAN_IDS[0]);
  const b = tryActor(ctx, GUARDIAN_IDS[1]);
  if (a && (has(a, 'sleep') || has(a, 'silence'))) return use(ai, 'guardian-remedy', [a.id]);
  if (b && (has(b, 'sleep') || has(b, 'silence'))) return use(ai, 'guardian-remedy', [SEYMOUR_ID]);

  const roll = scriptMod(ctx, 3);
  const spell = roll === 0 ? 'guardian-blizzard' : roll === 1 ? 'guardian-thunder' : 'guardian-shremedy';
  const victim = pickMatching(ctx, livingFriendlies(ctx));
  return use(ai, spell, victim ? [victim.id] : []);
};

registerScriptHooks(GUADO_GUARDIAN_SCRIPT, {
  onTargeted: (ctx, self) => {
    ctx.state.flags[`${MAC_ASLEEP_MARK}${self.id}`] = has(self, 'sleep');
  },
  onHit: (ctx, self, used, report) => {
    const rt = rtOf(ctx, self.id);
    rt.guardMark = false;
    if (rt.stealCount > 0 && self.enemy?.rewards.steal) self.enemy.rewards.steal.baseChance = 0;
    if (self.hp <= 0 || has(self, 'sleep')) return;
    const markKey = `${MAC_ASLEEP_MARK}${self.id}`;
    if (ctx.state.flags[markKey] === true) {
      ctx.state.flags[markKey] = false;
      return;
    }
    if (has(self, 'threaten') || !report.lostHp) return;
    if (rt.stealCount === 0) {
      queueReaction(ctx, self.id, { kind: 'ability', id: 'guardian-auto-potion', targets: [self.id] }, { byId: used.user.id });
    }
  },
} satisfies ScriptHooks);
