/**
 * **The Oblitzerator's script** (FFX only; the hidden Oblitzerator chapter, number 50): the monster file `m110` as the game's own bytecode runs it (`research/re-ffx-oblitzerator-crane.md` section 4, "RE 4": read from the
 * file and run in the earlier lanes' interpreter). **No number here is ours**; the rules and their sources are `./oblitzerator-rules.ts`, the rows `data/ffx/enemies/oblitzerator-abilities.ts`. The crane is `./luca-crane.ts`.
 *
 * ## Its turn (RE 4.1)
 *
 * Unless the crane has lifted it, it writes MAG 30 (a leftover: every row it has is a strength formula) and queues **Blitzball Rush on the whole living front line**: ten balls of power 4, each landing on one member
 * picked at random (the row is a random-target spread, `abilities.ts`). It queues nothing else, ever. Once lifted, its turn does nothing.
 *
 * ## When it is hit (RE 4.2)
 *
 * 1. **The speed-up**, whether or not it is lifted: a hit that leaves it under a third of its HP (under 2,000) adds 15 to its Agility; a later hit that leaves it under a twelfth (under 500) adds 10 more. One step per hit.
 * 2. **The counters**, unless lifted: the formula byte of the command that hit it (`./command-formula.ts#formulaByteOf`, the byte the game's scripts read) decides. **3** (any spell, Lancet, Scan, a Fury, and the status
 *    spells whose record carries the magic formula) is answered by **Mute Ball**, **1** (a weapon blow, every physical skill and Overdrive, the Breaks) by **Blind Ball**, **2** by **Doze Ball**, each aimed at the attacker and
 *    each when `GetRandomValue() mod 3` is 0, **one time in three**. The draw is taken only for those three bytes. The counter follows the engine's rule: it is not asked for while a reaction is resolving, only if the
 *    Oblitzerator can act (`./hit-gates.ts#react`), and once per command per target.
 *
 * ## When it is named (RE 4.4)
 *
 * The crane's row (0x6012) naming it **ends it**: from that moment it takes no turn and answers nothing (the game forces its exit animation, Special 1, which is the presenter's, and sets `v2` to 255). What the row
 * then does to its HP is the row (`data/ffx/enemies/oblitzerator-abilities.ts`, formula 5, power 15).
 *
 * ## The deviations and open readings, said (rule 6: none of them is a number)
 *
 * - **Doze Ball is unreachable** (RE 4.3): no player command has formula byte 2, so the branch is in the code and in the data and nothing in the party's hands reaches it. `tests/unit/chapters/oblitzerator-ai.test.ts` pins that
 *   against every player ability. Two guides say an Overdrive draws it; the files say not; a live check settles it (RE 8).
 * - **The matched set** (`findMatchingChr(-14, isAlive)`, RE 3) is read as no draw: the interpreter's run took none.
 * - **Its death** (`endBattle(Victory)`, RE 4.4) is the engine's own victory: the crane is a non-combatant (`./luca-crane.ts#applyLucaSetup`), so the Oblitzerator's fall ends the battle.
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx } from '../state.ts';
import { formulaByteOf } from './command-formula.ts';
import { gameMod, livingFrontLine } from './game-rolls.ts';
import { react, reactionAim } from './hit-gates.ts';
import { type AiContext, aiContextFor, registerAiScript, use } from './types.ts';
import { type HitReport, type UsedCommand, queueEmit, registerScriptHooks } from './hooks.ts';
import {
  COUNTER_MODULUS,
  FORMULA_BLIND,
  FORMULA_DOZE,
  FORMULA_MUTE,
  MAG_WRITE,
  OB_CALLOUTS,
  OB_ENDED_FLAG,
  OB_PHASE_FLAG,
  OB_ROWS,
  OB_SCRIPT,
  SPEED_FIRST_AGI,
  SPEED_FIRST_DIVISOR,
  SPEED_SECOND_AGI,
  SPEED_SECOND_DIVISOR,
  flagNumber,
  lifted,
  speedLine,
} from './oblitzerator-rules.ts';

export * from './oblitzerator-rules.ts';

/** One Oblitzerator turn (RE 4.1): nothing once lifted, else Blitzball Rush on the whole living front line. */
export function oblitzeratorTurn(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  if (lifted(ctx)) return null;
  self.stats.mag = MAG_WRITE; // the script's own write, inert
  const front = livingFrontLine(ctx);
  if (front.length === 0) return null;
  return use(ai, OB_ROWS.rush, front.map((c) => c.id));
}

/**
 * The speed-up (RE 4.2): `switch (v3)`, one step per hit. Phase 0 steps when HP is under a third of the maximum, phase 1 when it is under a twelfth. **A single hit that crosses both lines moves one step**; the next
 * hit takes the other.
 */
export function speedUp(ctx: Ctx, self: FFXCombatant): void {
  const phase = flagNumber(ctx, OB_PHASE_FLAG, 0);
  if (phase === 0 && self.hp < speedLine(self.stats.maxHp, SPEED_FIRST_DIVISOR)) {
    self.stats.agi += SPEED_FIRST_AGI;
    ctx.state.flags[OB_PHASE_FLAG] = 1;
  } else if (phase === 1 && self.hp < speedLine(self.stats.maxHp, SPEED_SECOND_DIVISOR)) {
    self.stats.agi += SPEED_SECOND_AGI;
    ctx.state.flags[OB_PHASE_FLAG] = 2;
  }
}

/** The ball a command's formula byte earns, or `undefined` for a byte that answers nothing (RE 4.2: only 1, 2 and 3 do). */
export function ballFor(formulaByte: number): string | undefined {
  if (formulaByte === FORMULA_MUTE) return OB_ROWS.mute;
  if (formulaByte === FORMULA_BLIND) return OB_ROWS.blind;
  if (formulaByte === FORMULA_DOZE) return OB_ROWS.doze;
  return undefined;
}

/** The Oblitzerator hears a command name it (RE 4.4): the crane's row ends it, before any damage. */
function oblitzeratorOnTargeted(ctx: Ctx, _self: FFXCombatant, used: UsedCommand): void {
  if (lifted(ctx)) return;
  if (used.def.id !== OB_ROWS.lift) return;
  ctx.state.flags[OB_ENDED_FLAG] = true;
  queueEmit(ctx, { type: 'script-trigger', name: OB_CALLOUTS.lifted, payload: {} });
}

/** The Oblitzerator hears it was hit, after the damage and before the death check (RE 4.2). */
function oblitzeratorOnHit(ctx: Ctx, self: FFXCombatant, used: UsedCommand, _report: HitReport): void {
  speedUp(ctx, self);
  if (lifted(ctx)) return;
  const ball = ballFor(formulaByteOf(used.def, used.user));
  if (ball === undefined) return;
  if (gameMod(ctx, COUNTER_MODULUS) !== 0) return; // the draw is taken for formula bytes 1, 2 and 3 only
  react(ctx, self, reactionAim(ctx, used.user), use(aiContextFor(ctx, self), ball, [used.user.id]));
}

registerAiScript(OB_SCRIPT, oblitzeratorTurn);
registerScriptHooks(OB_SCRIPT, { onTargeted: oblitzeratorOnTargeted, onHit: oblitzeratorOnHit });
