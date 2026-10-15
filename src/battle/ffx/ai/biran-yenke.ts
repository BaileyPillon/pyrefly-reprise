/**
 * **Biran Ronso and Yenke Ronso**, Kimahri's solo trial, as the game's own scripts run them (FFX only; the hidden Biran and Yenke chapter; `research/re-ffx-biran-yenke.md` section 5, "RE section n"; the rules are
 * `./biran-yenke-rules.ts`). **Nothing here is random: the game's only draw in these scripts picks a dialogue line, and this chapter has none** (no dialogue, no new content: the driver's decision), so no
 * script draw is made.
 *
 * ## The turn (`onTurn`, RE 5.3), in this order
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | the half-HP action is pending | his own Ronso Rage (Biran **Mighty Guard**, Yenke **White Wind**) on both brothers when they stand on the same side, else on himself; the Rage gate for Lancet opens |
 * | 2 | the partner is dead and he has not yet answered | Biran: **Berserk** on himself (his turn then is the engine's forced Bulldoze-numbered swing every turn); Yenke: **Haste** on himself, AGI := Kimahri's AGI - 4, repeating until it is on |
 * | 3 | otherwise the cycle, always at Kimahri | **Biran** Thunder, Bulldoze, Blizzard, Bulldoze; **Yenke** Fire Breath, Aqua Breath, Bulldoze; each Bulldoze swaps the user's side; the step advances only here |
 *
 * `preTurn` arms the half-HP action and reacts to the partner's death (`preTurnRules`); `onTargeted` is the defence swap (`onBrotherTargeted`); `onHit` releases it (`onBrotherHit`). Lancet's teaching is
 * `../ronso-rage.ts`.
 */

import type { Command } from '../../common/types.ts';
import { has, livingFriendlies } from '../state.ts';
import { type AiContext, num, registerAiScript, use } from './types.ts';
import { type ScriptHooks, registerScriptHooks } from './hooks.ts';
import {
  BERSERK_SELF,
  BIRAN_ID,
  BIRAN_SCRIPT,
  CYCLE,
  V8_STEP,
  YENKE_ID,
  YENKE_SCRIPT,
  kimahriOf,
  onBrotherHit,
  onBrotherTargeted,
  partnerDeadAndUnanswered,
  preTurnRules,
  swapSide,
  takeHalfHpAction,
} from './biran-yenke-rules.ts';

export * from './biran-yenke-rules.ts';

/** One brother's turn (RE 5.3). */
export function ronsoAi(ai: AiContext): Command | null {
  const { ctx, self, memory } = ai;

  // 1. The half-HP action: his own Rage, on both brothers (same side) or himself. The turn ends; the cycle does not advance.
  const half = takeHalfHpAction(ctx, self, memory);
  if (half !== undefined) return use(ai, half.move, half.targets);

  // 2. The partner is dead and he has not answered it yet. The turn ends; the cycle does not advance.
  if (partnerDeadAndUnanswered(ai)) {
    if (self.id === BIRAN_ID && !has(self, 'berserk')) return use(ai, BERSERK_SELF, [self.id]);
    if (self.id === YENKE_ID && !has(self, 'haste')) {
      self.stats.agi = Math.max(1, (kimahriOf(ctx)?.stats.agi ?? self.stats.agi + 4) - 4); // AGI := Kimahri's AGI - 4 (a property read of actor 3)
      return use(ai, 'haste', [self.id]);
    }
  }

  // 3. The cycle, always at Kimahri. Every row's target is fixed: no draw.
  const steps = CYCLE[self.id];
  if (steps === undefined) return null;
  const step = num(memory, V8_STEP) % steps.length;
  const move = steps[step] ?? 'attack';
  memory[V8_STEP] = (step + 1) % steps.length;
  if (move.endsWith('bulldoze')) swapSide(ctx, self); // the Area is written before the command is queued
  const target = kimahriOf(ctx) ?? livingFriendlies(ctx)[0];
  return use(ai, move, target ? [target.id] : []);
}

const HOOKS: ScriptHooks = {
  preTurn: (ctx, self) => preTurnRules(ctx, self),
  onTargeted: (ctx, self, used) => onBrotherTargeted(ctx, self, used),
  onHit: (ctx, self) => onBrotherHit(ctx, self),
};

registerScriptHooks(BIRAN_SCRIPT, HOOKS);
registerScriptHooks(YENKE_SCRIPT, HOOKS);
registerAiScript(BIRAN_SCRIPT, ronsoAi);
registerAiScript(YENKE_SCRIPT, ronsoAi);
