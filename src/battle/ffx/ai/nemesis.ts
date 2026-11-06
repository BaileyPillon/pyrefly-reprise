/**
 * **Nemesis's script** (FFX only; the hidden Omega Ruins chapter, number 43, Act III): the monster file `m276` as the game's own bytecode runs it (`research/re-ffx-omega-ultima-nemesis.md` section 4.3, "RE 4.3": read from the
 * file and run in the earlier lanes' interpreter, with the Armageddon counter's distribution computed exactly). **No number here is ours**; the rules and their sources are `./weapons-rules.ts`, the rows
 * `data/ffx/enemies/weapons-abilities.ts`.
 *
 * ## Nemesis's turn (RE 4.3), once per turn
 *
 * Two hidden counters live in `state.flags`: the **Armageddon counter** (`nm.counter`) and the **cycle step** (`nm.step`, 0 to 2).
 *
 * 1. **If the Armageddon counter is 20 or more** (tested first, at the start of the turn): it returns to 0 and Nemesis casts **Armageddon on the whole front line** (99,999 each, whatever the defence); the turn ends.
 * 2. Otherwise a draw modulo 3: **0 (a third): the counter gains 3 and Nemesis Attacks a random living member**; the cycle does not move.
 * 3. **1 or 2: the counter gains 2**, and the step plays: **0, Ethereal Cannon on a random living member (to step 1); 1, Ultra Spark on the whole front line (to step 2); 2, Attack on a random member (back to step 0).**
 *
 * **Armageddon arrives on average every 9.88 turns, never sooner than 8 nor later than 11** (the exact distribution is the pin in `tests/unit/chapters/omega-ruins-ai.test.ts`). Nemesis acts every 9 CTB.
 *
 * ## When it is hit (RE 4.3, `onHit`), once per action per target
 *
 * The script reads the **damage type** of the command that reached it (`./command-class.ts#commandDamageType`, the low two bits of the record's damage flags): 1 (physical) or 2 (magical) and nothing happens; **anything else
 * (type 0, "special", or 3) and Nemesis casts Ultima (its own row, 0x40F3) on the whole front line.** That is every Overdrive, every aeon Overdrive, Wakka's reels and shots, every Mix result, Steal, Pilfer Gil, Lancet, Jinx,
 * Threaten, Provoke, Talk, Zanmato, the item command; **not** a plain Attack, Quick Hit, Delay Attack and Delay Buster, Armor Break and the other Breaks, Mug, or any spell (Bio, Dispel, Scan and Slow included). A multi-hit
 * Overdrive is one action and so one Ultima. Hidden, as in the game (preflight WP7).
 *
 * What it queues is a free counter of its owner, filtered by the engine as the game's queue is (`./hit-gates.ts#react`): not while it cannot act and not when it already has a reaction waiting. **The deviations, said:** the note
 * reads the script as testing neither Threaten, nor HP 0, nor `isCounterattackAllowed`; the engine's gate does refuse a reaction raised inside another reaction (the one place it differs, and no special-class command is a
 * reaction of the party's). A Zanmato that kills it is answered by nothing: the dead take no turn (pinned by the engine test; the note's question 1 is answered by the run, not by the game).
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import type { Ctx } from '../state.ts';
import { commandDamageType } from './command-class.ts';
import { gameMod, livingFrontLine, randomLiving } from './game-rolls.ts';
import { react, reactionAim } from './hit-gates.ts';
import { registerScriptHooks, type HitReport, type UsedCommand } from './hooks.ts';
import { type AiContext, aiContextFor, registerAiScript, use } from './types.ts';
import {
  NM_ARMAGEDDON_AT,
  NM_ATTACK_ADDS,
  NM_COUNTER_FLAG,
  NM_CYCLE_LENGTH,
  NM_DRAW_MODULUS,
  NM_OTHER_ADDS,
  NM_QUIET_TYPES,
  NM_SCRIPT,
  NM_STEP_FLAG,
  WEAPON_MOVES as M,
  flagNumber,
} from './weapons-rules.ts';

/** One Nemesis turn (RE 4.3). */
export function nemesisTurn(ai: AiContext): Command | null {
  const { ctx } = ai;
  const flags = ctx.state.flags;
  const counter = flagNumber(ctx, NM_COUNTER_FLAG);
  const living = livingFrontLine(ctx);
  if (counter >= NM_ARMAGEDDON_AT) {
    flags[NM_COUNTER_FLAG] = 0;
    return living.length === 0 ? null : use(ai, M.armageddon, living.map((c) => c.id));
  }
  if (living.length === 0) return null;
  const aimed = (id: string): Command | null => {
    const victim: FFXCombatant | undefined = randomLiving(ctx);
    return victim === undefined ? null : use(ai, id, [victim.id]);
  };
  if (gameMod(ctx, NM_DRAW_MODULUS) === 0) {
    flags[NM_COUNTER_FLAG] = counter + NM_ATTACK_ADDS;
    return aimed(M.nemesisAttack);
  }
  flags[NM_COUNTER_FLAG] = counter + NM_OTHER_ADDS;
  const step = flagNumber(ctx, NM_STEP_FLAG) % NM_CYCLE_LENGTH;
  flags[NM_STEP_FLAG] = (step + 1) % NM_CYCLE_LENGTH;
  if (step === 0) return aimed(M.etherealCannon);
  if (step === 1) return use(ai, M.ultraSpark, living.map((c) => c.id));
  return aimed(M.nemesisAttack);
}

/** Nemesis hears it was hit (RE 4.3): a command that is neither physical nor magical is answered by Ultima on the whole front line. */
function nemesisOnHit(ctx: Ctx, self: FFXCombatant, used: UsedCommand, _report: HitReport): void {
  if (used.user.id === self.id) return;
  if (NM_QUIET_TYPES.includes(commandDamageType(used.def, used.user))) return;
  const front = livingFrontLine(ctx).map((c) => c.id);
  if (front.length === 0) return;
  react(ctx, self, reactionAim(ctx, used.user), use(aiContextFor(ctx, self), M.nemesisUltima, front));
}

registerAiScript(NM_SCRIPT, nemesisTurn);
registerScriptHooks(NM_SCRIPT, { onHit: nemesisOnHit });
