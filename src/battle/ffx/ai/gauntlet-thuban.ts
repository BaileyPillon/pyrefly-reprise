/**
 * **Th'uban's script** (FFX only; the hidden Gauntlet chapter's act 7, the Monster Arena's Original of the six species creations, monster file `m282`, 3,000,000 HP), as the game's own bytecode runs it
 * (`research/re-ffx-monster-arena-creations.md` 3.6, "RE n": 1,841 bytes of code, read from the file and run in the earlier lanes' interpreter, `[disasm] [run]`). **No number here is ours.** The rows are
 * `data/ffx/enemies/gauntlet-abilities.ts` (its own Attack, Rainbow, Convergence and Condemn) and the party's own Haste, Protect, Shell and Regen; the record is `data/ffx/enemies/gauntlet.ts` (Reflect 255: nothing
 * reflects off it). **It shares the Sanctuary Keeper's painting and nothing else** (RE n 0): none of the Keeper's script carries over.
 *
 * ## The turn: a four-step cycle that starts on its third step
 *
 * One step counter `v1` (it starts at **3**), moved on at the end of every turn whatever the turn managed to queue:
 *
 * | `v1` | Its turn | Then |
 * |---|---|---|
 * | 3 | **Attack** on the front-line member with the **most HP** (a tie is one picker draw) | 4 |
 * | 4 (or 0) | **Rainbow** on the whole front line (Confuse 25, Sleep, Silence, Darkness 50) | 1 |
 * | 1 | a **buff on itself**: **Protect** if it lacks Protect, else **Shell** if it lacks Shell, else **Regen** if it lacks Regen, else nothing (the turn is lost) | 2 |
 * | 2 | **Convergence** on one random living member (formula 4, MDEF ignored: 99,999, a certain KO on this party) | 3 |
 *
 * So it plays Attack, Rainbow, buff, Convergence, Attack, Rainbow, buff, Convergence... and no draw but the pickers decides a move.
 *
 * ## When it is hit (`onTargeted` reads the command, `onHit` answers it)
 *
 * Whatever the command did to it (a miss counts; the script tests no damage, no counterattack gate and no attacker), it reads two bits of the **command's own record** and answers in this order:
 * the command **changes the CTB** (Slow and Haste on others: `damageClass` bit 4 alone; the Delay moves carry the HP bit alone and are answered by Condemn, below) -> **Haste on itself**; the command **changes HP** (`damageClass` bit 1) -> **Condemn on the front line** (it strips Shell, Protect, Reflect,
 * the four Nuls, Regen and Haste from everyone it hits, the party's Auto-Protect and Auto-Haste included if the engine lets a cleanse take them: the tests say).
 *
 * **One answer a hit.** The game's queue drops a second `performCommand` while the owner already has one waiting (`./hit-gates.ts#react`), so a command that did both bits would be answered by Haste alone (none of the party's does: Slow and Haste carry the CTB bit alone, Delay Attack and Delay Buster the HP bit alone, so the Delay moves are answered by Condemn; the both-bits case is pinned on a synthetic record). And the
 * engine's one rule that **a counter never triggers another counter** (`./hit-script.ts#queueCounter`) applies: the Haste it casts on itself is a CTB command that hit it, which the bytes would answer with another Haste for
 * ever; the engine's reaction queue refuses it. Nothing else of the party's hits it from inside a reaction, so this is the only place the rule shows. The blow that kills it (HP 0) is answered by nothing: its owner cannot act.
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { resolveCommand } from '../adapt/command.ts';
import { type Ctx, has } from '../state.ts';
import { highestHpLiving, livingFrontLine, randomLiving } from './game-rolls.ts';
import { react, reactionAim } from './hit-gates.ts';
import { type HitReport, type UsedCommand, registerScriptHooks } from './hooks.ts';
import { type AiContext, aiContextFor, num, registerAiScript, use } from './types.ts';
import { GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS } from './gauntlet-rules.ts';

/** The step the cycle starts on (`v1 = 3` in its init): the Attack. */
export const THUBAN_FIRST_STEP = 3;
/** The memory slot of the step counter (`v1`). */
export const THUBAN_STEP = 'gauntlet.thuban.step';
/** The command record's damage-class bits the answers read (`readCommandProperty(cmd, affectHP)` and `(cmd, affectCTB)`). */
export const THUBAN_AFFECTS_HP = 1;
export const THUBAN_AFFECTS_CTB = 4;
/** The buffs it casts on itself, in the order the script looks for the first one it lacks. */
export const THUBAN_BUFFS: ReadonlyArray<readonly ['protect' | 'shell' | 'regen', string]> = [['protect', ROW.protect], ['shell', ROW.shell], ['regen', ROW.regen]];

/** One Th'uban turn (RE n 3.6). */
export function thubanTurn(ai: AiContext): Command | null {
  const { ctx, self, memory } = ai;
  const step = num(memory, THUBAN_STEP, THUBAN_FIRST_STEP);
  if (step === 1) {
    memory[THUBAN_STEP] = 2;
    const missing = THUBAN_BUFFS.find(([status]) => !has(self, status));
    return missing === undefined ? null : use(ai, missing[1], [self.id]); // queues nothing when it has all three: the turn is lost
  }
  if (step === 2) {
    memory[THUBAN_STEP] = 3;
    const victim = randomLiving(ctx);
    return victim === undefined ? null : use(ai, ROW.convergence, [victim.id]);
  }
  if (step === 3) {
    memory[THUBAN_STEP] = 4;
    const victim = highestHpLiving(ctx);
    return victim === undefined ? null : use(ai, ROW.attack, [victim.id]);
  }
  memory[THUBAN_STEP] = 1; // 4 (and any other value): Rainbow
  const front = livingFrontLine(ctx).map((c) => c.id);
  return front.length === 0 ? null : use(ai, ROW.rainbow, front);
}

/** The command's own damage-class bits, as the script reads them (`readCommandProperty` on the used command). */
export function damageClassOf(used: UsedCommand): number {
  return resolveCommand(used.def, used.user).record.damageClass;
}

/** Th'uban hears the action's hit (RE n 3.6): Haste on itself for a CTB command, Condemn on the front line for an HP command, in that order, one answer in all. */
export function thubanOnHit(ctx: Ctx, self: FFXCombatant, used: UsedCommand, _report: HitReport): void {
  if (self.hp <= 0) return; // the blow that killed it: its owner cannot act
  const classes = damageClassOf(used);
  const aim = reactionAim(ctx, used.user);
  const ai = aiContextFor(ctx, self);
  if ((classes & THUBAN_AFFECTS_CTB) !== 0) react(ctx, self, aim, use(ai, ROW.haste, [self.id]));
  if ((classes & THUBAN_AFFECTS_HP) !== 0) {
    const front = livingFrontLine(ctx).map((c) => c.id);
    if (front.length > 0) react(ctx, self, aim, use(ai, ROW.condemn, front)); // dropped when the Haste above is already waiting
  }
}

registerAiScript(GAUNTLET_SCRIPTS.thuban, thubanTurn);
registerScriptHooks(GAUNTLET_SCRIPTS.thuban, { onHit: thubanOnHit });
