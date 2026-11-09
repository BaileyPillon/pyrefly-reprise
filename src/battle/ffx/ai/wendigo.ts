/**
 * **Wendigo's script** (FFX only; the hidden Wendigo chapter, number 49): the monster file `m212` as the game's own bytecode runs it (`research/re-ffx-wendigo-lake-macalania.md` section 4, "RE 4": read from the file and run
 * in the earlier lanes' interpreter). **No number here is ours**; the rules and their sources are `./wendigo-rules.ts`, the rows `data/ffx/enemies/wendigo-abilities.ts`. The Guardians are `./lake-guardian.ts`.
 *
 * ## Wendigo's turn (RE 4.2), once per Wendigo turn, first match wins
 *
 * | State | What it does | Next |
 * |---|---|---|
 * | the arms are up, `armTurns` 0 | nothing (the turn after the raise) | `armTurns` 1 |
 * | the arms are up, `armTurns` 1 | nothing | `armTurns` 2 |
 * | the arms are up, `armTurns` 2 | **Lower Arms** on itself | arms down, `armTurns` 0, `cycle` 1 |
 * | HP below half, `cycle` under 4 | `cycle` + 1, then one in three the **Double Punch** on the lowest-HP living member, else the plain Attack (accuracy 90) on a random living member | |
 * | HP below half, `cycle` 4 or more (the start's 10 included) | **Raise Arms** on itself | arms up, `armTurns` 0, `cycle` 10 |
 * | HP at half or more | one in three the **Double Punch** on the lowest-HP living member, else the **Punch** (accuracy 120) on a random living member | |
 *
 * Below half HP it therefore attacks on 3 turns of every 7. **A Berserk or Provoked Wendigo never reaches this function**: the turn start hands it the forced default attack first (`forced-turn.ts`; its forced-action word is
 * 0x4000), so a Berserk Wendigo only ever throws the plain Attack at x3/2, and never raises its arms or throws the Double Punch or the Counter Punch.
 *
 * ## When it is hit (RE 4.3), once per action per target
 *
 * Only while counters are allowed (the owner can act and the hit is not itself part of a reaction):
 * 1. **Asleep**: with the arms up, they come down at once (`armTurns` 3, the stance off), and there is no counter.
 * 2. Otherwise, **with the arms up**, a hit whose command is **physical** (damage type 1 of the command's own record: the Attack, Dark, Sleep and Silence Attack, the four Breaks, Delay Attack and Buster, Ixion's Aerospark,
 *    Valefor's Sonic Wings) and **no aeon holds the field**: the **Counter Punch** on the last attacker, a free reply (never misses, can crit). Spells, Steal, Threaten, Provoke, Lancet, Jump, Spiral Cut, Use, Mix, Cheer,
 *    Focus, every Overdrive and every aeon Overdrive are not physical and are not answered; the arms down answer nothing.
 *
 * ## The deviations and open readings, said (rule 6: none of them is a number)
 *
 * - **The stance is a flag** (`wendigo.arms`, the game's status property 61 and its script's `v5`), set when the script chooses Raise Arms and cleared when it chooses Lower Arms or Sleep ends it; the game sets the status
 *   when the command runs, a few ticks later. The Guardians and the tactic read the flag. `[assumed]`: RE 8 says the status write of command 0x403B was not read.
 * - **Sleep ends the stance (RE 4.3 item 1) is followed as the note has it.** The Evrae lane read `isCounterattackAllowed()` as false for a sleeper (`research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` 1.1), which
 *   would make that branch unreachable in the game; the Wendigo note's run treats the branch as live. The chapter follows the Wendigo note: the hook's gate here lets a sleeping owner through (everything else the engine's
 *   gate refuses still refuses), and a **physical** hit wakes a sleeper before the hook runs (`hit-apply.ts`), so the branch is reached by a magic or status hit on a sleeper. **One look at the real game settles it** (ask first).
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, has, isAlive } from '../state.ts';
import { aeonHoldsField, react, reactionAim } from './hit-gates.ts';
import { damageTypeOf } from './hit-script.ts';
import { aiContextFor, type AiContext, registerAiScript, use } from './types.ts';
import { registerScriptHooks, type HitReport, type UsedCommand } from './hooks.ts';
import { livingFrontLine, gameMod } from './game-rolls.ts';
import {
  ARM_TURNS_AFTER_SLEEP,
  ARM_TURNS_LAST,
  ARM_TURNS_RAISED,
  CYCLE_AFTER_ARMS,
  CYCLE_ATTACK_LIMIT,
  CYCLE_START,
  HAYMAKER_MODULUS,
  WD_ARMS_FLAG,
  WD_ARM_TURNS_FLAG,
  WD_CYCLE_FLAG,
  WD_ROWS,
  WD_SCRIPT,
  armsUp,
  belowHalf,
  flagNumber,
  lowestHpLiving,
  randomLivingMember,
} from './wendigo-rules.ts';

export * from './wendigo-rules.ts';

/** The plain Attack (the enemy's own `plainAttack`, monster command 0x4000, accuracy 90) on one front-line member. */
function attackOn(target: FFXCombatant | undefined): Command | null {
  return target === undefined ? null : { kind: 'attack', targets: [target.id] };
}

/**
 * The turn's attack, the draw first and the picks after, as the script does it (RE 4.2): `GetRandomValue() mod 3`; residue 0 is the Double Punch on the lowest-HP living member, anything else the weak punch on a random one.
 * `weak` is the Punch above half HP and the plain Attack below it.
 */
function attackTurn(ai: AiContext, weak: 'punch' | 'attack'): Command | null {
  const { ctx } = ai;
  if (gameMod(ctx, HAYMAKER_MODULUS) === 0) {
    const victim = lowestHpLiving(ctx);
    return victim === undefined ? null : use(ai, WD_ROWS.haymaker, [victim.id]);
  }
  const victim = randomLivingMember(ctx);
  if (victim === undefined) return null;
  return weak === 'punch' ? use(ai, WD_ROWS.punch, [victim.id]) : attackOn(victim);
}

/** One Wendigo turn (RE 4.2). */
export function wendigoTurn(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  const flags = ctx.state.flags;

  if (armsUp(ctx)) {
    const turns = flagNumber(ctx, WD_ARM_TURNS_FLAG, ARM_TURNS_RAISED);
    if (turns === 0) flags[WD_ARM_TURNS_FLAG] = 1;
    else if (turns === 1) flags[WD_ARM_TURNS_FLAG] = ARM_TURNS_LAST;
    else if (turns === ARM_TURNS_LAST) {
      flags[WD_ARM_TURNS_FLAG] = ARM_TURNS_RAISED;
      flags[WD_CYCLE_FLAG] = CYCLE_AFTER_ARMS;
      flags[WD_ARMS_FLAG] = false;
      return use(ai, WD_ROWS.lowerArms, [self.id]);
    }
    return null; // the turn after the raise, and the one after that: nothing is queued
  }

  if (livingFrontLine(ctx).length === 0) return null;
  if (!belowHalf(self)) return attackTurn(ai, 'punch');

  const cycle = flagNumber(ctx, WD_CYCLE_FLAG, CYCLE_START);
  if (cycle < CYCLE_ATTACK_LIMIT) {
    flags[WD_CYCLE_FLAG] = cycle + 1;
    return attackTurn(ai, 'attack');
  }
  flags[WD_ARM_TURNS_FLAG] = ARM_TURNS_RAISED;
  flags[WD_CYCLE_FLAG] = CYCLE_START;
  flags[WD_ARMS_FLAG] = true;
  return use(ai, WD_ROWS.raiseArms, [self.id]);
}

/**
 * The hook's own gate (RE 4.3): the owner is not Petrified, Ejected, Confused, Berserk or Threatened, and the hit is not part of a reaction. **A sleeper passes** (see the header's second deviation): the engine's
 * `counterAllowed` refuses a sleeper, and the Sleep branch below would never be reached.
 */
function hookAllowed(ctx: Ctx, self: FFXCombatant): boolean {
  if (!self.alive || self.removed || ctx.rt.inReaction === true) return false;
  return !(has(self, 'petrify') || has(self, 'eject') || has(self, 'confuse') || has(self, 'berserk') || has(self, 'threaten'));
}

/** Wendigo hears it was hit (RE 4.3). */
function wendigoOnHit(ctx: Ctx, self: FFXCombatant, used: UsedCommand, _report: HitReport): void {
  if (!hookAllowed(ctx, self)) return;
  if (has(self, 'sleep')) {
    if (armsUp(ctx)) {
      ctx.state.flags[WD_ARM_TURNS_FLAG] = ARM_TURNS_AFTER_SLEEP;
      ctx.state.flags[WD_ARMS_FLAG] = false;
    }
    return;
  }
  if (!armsUp(ctx)) return;
  if (damageTypeOf(used.def, used.user) !== 1) return; // only a physical command is answered
  if (aeonHoldsField(ctx)) return; // an aeon on the field silences the counter
  if (!isAlive(used.user)) return;
  react(ctx, self, reactionAim(ctx, used.user), use(aiContextFor(ctx, self), WD_ROWS.counterPunch, [used.user.id]));
}

registerAiScript(WD_SCRIPT, wendigoTurn);
registerScriptHooks(WD_SCRIPT, { onHit: wendigoOnHit });
