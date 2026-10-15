/**
 * **Biran and Yenke Ronso**, Kimahri's duel at the gate of Mt. Gagazet (the hidden Biran and Yenke chapter; **FFX only** [AGENTS.md rule 14]). Source: `research/ffx-biran-yenke.md`
 * ("§n"). Which command each script uses, and on whom, is the game's own table (`monster_actions.json`, `[decompiled]`, §3.1); **the order and the triggers are the written sources'
 * description** (§4, `[search]`: the battle scripts m134 and m135 were not read), modelled here and tagged. Every move's numbers are the game's rows
 * (`data/ffx/enemies/biran-yenke-abilities.ts`).
 *
 * ## Biran's turn (§4.1 to §4.3)
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | Yenke has fallen, and Biran has not yet done it | **Berserk** on himself (0x400f, certain); from his next turn the Berserk turn runs his default attack, Bulldoze, every time |
 * | 2 | below a quarter of his HP, once | **Mighty Guard**: on both while they stand together, on himself while apart (Kimahri's own row 0x3072); he can teach it from then on |
 * | 3 | otherwise | the loop **Thunder, Bulldoze, Blizzard, Bulldoze** at Kimahri (§4.1, conflict B-5) |
 *
 * ## Yenke's turn
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | Biran has fallen, and Yenke has not yet done it | **Haste** on himself (0x3036) |
 * | 2 | below a quarter of his HP, once | **White Wind**: on both while together, on himself while apart (0x3070); he can teach it from then on |
 * | 3 | otherwise | the loop **Fire Breath, Aqua Breath, Bulldoze** |
 *
 * **Bulldoze moves its user to the other row** (§4.4): the row changes as the command is chosen, and the guarding (`./biran-yenke-rules.ts#refreshGuard`) shows the change once the
 * blow has landed. Both scripts bring the guarding in line at the start of their turn, and both Ronso's `onTargeted` do before any command that names them is resolved.
 * **Lancet** teaches through each Ronso's teacher (`../ronso-rage.ts`), which names the first Rage of his list Kimahri does not know (§4.5).
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, isAlive, livingFriendlies } from '../state.ts';
import { type AiContext, flag, num, registerAiScript, use } from './types.ts';
import { type ScriptHooks, registerScriptHooks } from './hooks.ts';
import { pickMatching } from './script-random.ts';
import { registerRageTeacher } from '../ronso-rage.ts';
import {
  BIRAN_BERSERK_ID,
  BIRAN_ID,
  BIRAN_MIGHTY_GUARD_ID,
  BIRAN_MIGHTY_GUARD_SELF_ID,
  BIRAN_SCRIPT,
  RONSO_BULLDOZE_ID,
  YENKE_AQUA_BREATH_ID,
  YENKE_FIRE_BREATH_ID,
  YENKE_ID,
  YENKE_SCRIPT,
  YENKE_WHITE_WIND_ID,
  YENKE_WHITE_WIND_SELF_ID,
  rageToTeach,
  refreshGuard,
  ronso,
  switchRow,
  together,
  usedRageFlag,
} from './biran-yenke-rules.ts';

export * from './biran-yenke-rules.ts';

/** Memory: the step of the loop (Biran 0 to 3, Yenke 0 to 2). */
export const MEM_STEP = 'step';
/** Memory: the partner's fall has been answered (Biran's Berserk, Yenke's Haste). */
export const MEM_ANSWERED_FALL = 'answeredFall';

/** "Below 25 % of HP" (§4.2, conflict B-4: Game8's 50 % is outvoted). Strictly below a quarter. */
export const LOW_HP_DIVISOR = 4;

/** Biran's loop: Thunder, Bulldoze, Blizzard, Bulldoze (§4.1). */
export const BIRAN_LOOP: readonly string[] = ['thunder', RONSO_BULLDOZE_ID, 'blizzard', RONSO_BULLDOZE_ID];
/** Yenke's loop: Fire Breath, Aqua Breath, Bulldoze (§4.1). */
export const YENKE_LOOP: readonly string[] = [YENKE_FIRE_BREATH_ID, YENKE_AQUA_BREATH_ID, RONSO_BULLDOZE_ID];

/** True when `self` is strictly below a quarter of his HP. */
export function belowQuarter(self: FFXCombatant): boolean {
  return self.hp * LOW_HP_DIVISOR < self.stats.maxHp;
}

/** The partner has fallen (he is on the field and not standing). */
function partnerFell(ctx: Ctx, partnerId: string): boolean {
  const partner = ronso(ctx, partnerId);
  return partner !== undefined && !isAlive(partner);
}

/** The low-HP Rage: on both while together, on the caster alone while apart. Marks it used: from now on he can teach it. */
function lowHpRage(ai: AiContext, both: string, alone: string): Command {
  const { ctx, self } = ai;
  ctx.state.flags[usedRageFlag(self.id)] = true;
  if (together(ctx)) return use(ai, both, [BIRAN_ID, YENKE_ID]);
  return use(ai, alone, [self.id]);
}

/** One step of a loop at Kimahri (the only member: the picker draws nothing for one candidate). A Bulldoze moves its user, shown once it has landed. */
function loopStep(ai: AiContext, loop: readonly string[]): Command {
  const { ctx, self, memory } = ai;
  const step = num(memory, MEM_STEP) % loop.length;
  memory[MEM_STEP] = (step + 1) % loop.length;
  const move = loop[step] as string;
  const victim = pickMatching(ctx, livingFriendlies(ctx));
  const breath = move === YENKE_FIRE_BREATH_ID || move === YENKE_AQUA_BREATH_ID;
  if (move === RONSO_BULLDOZE_ID) {
    switchRow(ctx, self.id);
    refreshGuard(ctx, 'after-action');
  }
  return use(ai, move, breath ? [] : victim ? [victim.id] : []);
}

/** One of Biran's turns. */
export function biranAi(ai: AiContext): Command | null {
  const { ctx, self, memory } = ai;
  refreshGuard(ctx);
  if (partnerFell(ctx, YENKE_ID) && !flag(memory, MEM_ANSWERED_FALL)) {
    memory[MEM_ANSWERED_FALL] = true;
    return use(ai, BIRAN_BERSERK_ID, [self.id]);
  }
  if (belowQuarter(self) && ctx.state.flags[usedRageFlag(self.id)] !== true) return lowHpRage(ai, BIRAN_MIGHTY_GUARD_ID, BIRAN_MIGHTY_GUARD_SELF_ID);
  return loopStep(ai, BIRAN_LOOP);
}

/** One of Yenke's turns. */
export function yenkeAi(ai: AiContext): Command | null {
  const { ctx, self, memory } = ai;
  refreshGuard(ctx);
  if (partnerFell(ctx, BIRAN_ID) && !flag(memory, MEM_ANSWERED_FALL)) {
    memory[MEM_ANSWERED_FALL] = true;
    return use(ai, 'haste', [self.id]);
  }
  if (belowQuarter(self) && ctx.state.flags[usedRageFlag(self.id)] !== true) return lowHpRage(ai, YENKE_WHITE_WIND_ID, YENKE_WHITE_WIND_SELF_ID);
  return loopStep(ai, YENKE_LOOP);
}

/** Both Ronso: before any damage of a command that names one, the guarding is brought in line (a partner may have fallen since the last check). */
const RONSO_HOOKS: ScriptHooks = {
  onTargeted: (ctx) => refreshGuard(ctx),
};

registerScriptHooks(BIRAN_SCRIPT, RONSO_HOOKS);
registerScriptHooks(YENKE_SCRIPT, RONSO_HOOKS);
registerAiScript(BIRAN_SCRIPT, biranAi);
registerAiScript(YENKE_SCRIPT, yenkeAi);
registerRageTeacher(BIRAN_SCRIPT, (ctx, self, learner) => rageToTeach(ctx, self, learner.overdrive?.unlockedOverdriveIds ?? []));
registerRageTeacher(YENKE_SCRIPT, (ctx, self, learner) => rageToTeach(ctx, self, learner.overdrive?.unlockedOverdriveIds ?? []));
