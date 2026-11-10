/**
 * **Catastrophe's script** (FFX only; the hidden Gauntlet chapter's act 6, the Monster Arena's Original of the six area creations, monster file `m277`, 2,200,000 HP), as the game's own bytecode runs it
 * (`research/re-ffx-monster-arena-creations.md` 3.3, "RE n": 2,964 bytes of code, read from the file and run in the earlier lanes' interpreter, `[disasm] [run]`). **No number here is ours.** The rows are
 * `data/ffx/enemies/gauntlet-abilities.ts` (Toxic Cloud, Toxic Spray, Hundred Thorns, Transform) and the party's own Demi; the record is `data/ffx/enemies/gauntlet.ts`, Armored in its first form.
 *
 * ## Form 1 (`v2` is 0): a rest, then a cloud
 *
 * One counter `v1`, flipped after every turn (`v1 = (v1 == 0)`): on `v1 == 1` it casts **Toxic Cloud** on the front line (Poison and Confuse 254); on `v1 == 0` it queues nothing (the turn is lost). So the
 * turns alternate **nothing, Toxic Cloud, nothing, Toxic Cloud**, with no draw. It takes hits with no answer at all.
 *
 * ## The change (RE n 3.3: "the phase line `v3` = 4/5 of max HP")
 *
 * `v3` is set at the start to **maximum HP x 4 / 5** (integer: 1,760,000 of 2,200,000). Its `onHit` returns if it is already transformed (`v2 == 1`); otherwise, **if its HP is below `v3` (strictly)** after the action's
 * hits, it **transforms**: `v2 = 1`, `v1 = 0`, **Armored off, Luck 30, Agility 60** (from 34), the second painting, and it performs **Transform** on itself. One hit that goes from above the line to below it does it,
 * whatever the size of the hit; there is no test of the damage dealt, of `isCounterattackAllowed()` or of Threaten (the property writes happen whether or not the Transform command can be queued).
 *
 * ## Form 2 (`v2` is 1): a three-turn cycle
 *
 * `v1` goes 0, 1, 2, 0, ...: **Toxic Spray** on the living member with the **most HP** (a tie is drawn; the four Breaks 254) -> **Demi** on the front line (a quarter of each member's current HP) ->
 * **Hundred Thorns** on the front line (physical, can crit). No counters.
 *
 * ## Deviations, said (none is a number)
 *
 * - The bytes' `onHit` transforms on a hit that **kills** it too (HP 0 is below the line); this file leaves a dying Catastrophe alone, because a second painting and a Transform scene on the blow that ends the fight
 *   add nothing and the battle is over. The game's death handler (`f5`) also transforms a Catastrophe that dies without ever being hit (case `v2 == 0`: Doom, say): not reachable by any damage, not modelled.
 * - The first form's rest turn queues nothing and so costs the default recovery, as every lost turn of the earlier scripts does (`../ticks.ts`).
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, rtOf } from '../state.ts';
import { canQueue, highestHpLiving, livingFrontLine } from './game-rolls.ts';
import { type HitReport, type UsedCommand, peekReactions, queueEmit, queueReaction, registerScriptHooks } from './hooks.ts';
import { type AiContext, aiContextFor, num, registerAiScript, use } from './types.ts';
import { CATASTROPHE_FORM2_SPRITE, CATASTROPHE_FORM_FLAG, GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS, setArmored } from './gauntlet-rules.ts';

/** The phase line is 4/5 of the maximum HP (`v3 = maxHP * 4 / 5`, integer division): the form changes when HP is strictly below it. */
export function catastropheLine(maxHp: number): number {
  return Math.floor((maxHp * 4) / 5);
}
/** What the transformation writes (`Luck` 30 and `Agility` 60; the record's Agility is 34). */
export const CATASTROPHE_FORM2_LUCK = 30;
export const CATASTROPHE_FORM2_AGI = 60;
/** The memory slots: `v2` (1 once transformed) and the counter `v1`. */
export const CATASTROPHE_FORM = 'gauntlet.catastrophe.form';
export const CATASTROPHE_STEP = 'gauntlet.catastrophe.step';

/** One Catastrophe turn (RE n 3.3). */
export function catastropheTurn(ai: AiContext): Command | null {
  const { ctx, memory } = ai;
  const step = num(memory, CATASTROPHE_STEP);
  const front = livingFrontLine(ctx).map((c) => c.id);
  if (num(memory, CATASTROPHE_FORM) === 0) {
    memory[CATASTROPHE_STEP] = step === 0 ? 1 : 0; // v1 = (v1 == 0)
    return step === 1 && front.length > 0 ? use(ai, ROW.toxicCloud, front) : null;
  }
  if (step === 0) {
    memory[CATASTROPHE_STEP] = 1;
    const victim = highestHpLiving(ctx);
    return victim === undefined ? null : use(ai, ROW.toxicSpray, [victim.id]);
  }
  if (step === 1) {
    memory[CATASTROPHE_STEP] = 2;
    return front.length > 0 ? use(ai, ROW.demi, front) : null;
  }
  memory[CATASTROPHE_STEP] = 0;
  return front.length > 0 ? use(ai, ROW.hundredThorns, front) : null;
}

/** The change: the writes first (they happen whether or not the Transform command can be queued), then Transform on itself, then the painting once the action's own events are done. */
function transform(ctx: Ctx, self: FFXCombatant, memory: AiContext['memory']): void {
  memory[CATASTROPHE_FORM] = 1;
  memory[CATASTROPHE_STEP] = 0;
  ctx.state.flags[CATASTROPHE_FORM_FLAG] = 1;
  setArmored(self, false);
  self.stats.luck = CATASTROPHE_FORM2_LUCK;
  self.stats.agi = CATASTROPHE_FORM2_AGI;
  self.spriteKey = CATASTROPHE_FORM2_SPRITE;
  if (canQueue(self) && !peekReactions(ctx).some((r) => r.kind === 'command' && r.ownerId === self.id)) {
    queueReaction(ctx, self.id, use(aiContextFor(ctx, self), ROW.transform, [self.id]), { keepsControl: true });
  }
  queueEmit(ctx, { type: 'form-change', enemyId: self.id, formIndex: 1, name: self.name, spriteKey: CATASTROPHE_FORM2_SPRITE });
}

/** Catastrophe hears it was hit, after the damage and before the death check (RE n 3.3). */
export function catastropheOnHit(ctx: Ctx, self: FFXCombatant, _used: UsedCommand, _report: HitReport): void {
  const memory = rtOf(ctx, self.id).ai;
  if (num(memory, CATASTROPHE_FORM) === 1) return; // already transformed
  if (self.hp <= 0) return; // the blow that kills it: see the header
  if (self.hp >= catastropheLine(self.stats.maxHp)) return;
  transform(ctx, self, memory);
}

registerAiScript(GAUNTLET_SCRIPTS.catastrophe, catastropheTurn);
registerScriptHooks(GAUNTLET_SCRIPTS.catastrophe, { onHit: catastropheOnHit });
