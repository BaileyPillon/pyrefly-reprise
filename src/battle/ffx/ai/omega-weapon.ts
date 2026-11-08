/**
 * **Omega Weapon's script** (FFX only; the hidden Omega Ruins chapter, number 43, Act II): the monster file `m100` as the game's own bytecode runs it (`research/re-ffx-omega-ultima-nemesis.md` section 4.2, "RE 4.2": read from the
 * file and run in the earlier lanes' interpreter, with the Nova counter's distribution computed exactly). **No number here is ours**; the rules and their sources are `./weapons-rules.ts`, the rows
 * `data/ffx/enemies/weapons-abilities.ts`. It has no hooks: the whole of it is the turn.
 *
 * ## Omega Weapon's turn (RE 4.2), once per turn
 *
 * Two hidden counters live in `state.flags`: the **Nova counter** (`ow.counter`) and the **cycle position** (`ow.step`).
 *
 * 1. **If the Nova counter is 30 or more** (tested first, at the start of the turn): it returns to 0 and Omega casts **Nova on the whole front line**; the turn ends.
 * 2. Otherwise a draw modulo 3: **0 (21,846 of 65,536, a third): the counter gains 5 and Omega Attacks a random living member** with its own Attack (always hits, the 99,999 cap); the cycle does not move.
 * 3. **1 or 2: the counter gains 2, the cycle advances one step**, and the step is played:
 *
 * | Step | An aeon is out | No aeon is out |
 * |---:|---|---|
 * | 1 | **Core Energy** on a random living member | the same |
 * | 2 | **Shimmering Rain** on the whole front line | **Break or Confuse** (a draw modulo 2: 0 is Break) on a random living member |
 * | 3 | **Core Energy** on a random one | **Shimmering Rain** on the front line |
 * | 4 | **Shimmering Rain** on the front line; the cycle returns to 0 | **the player's Ultima or Demi** (a draw modulo 2: 0 is Ultima) on the front line; the cycle returns to 0 |
 *
 * The aeon test is made at the start of every special turn, so the branch can change mid-cycle. **The Nova arrives on average every 11.44 turns, never sooner than 7 nor later than 16** (the exact distribution is the
 * pin in `tests/unit/chapters/omega-ruins-ai.test.ts`). Omega's Nova is a monster row (0x4067, magic 60), not Kimahri's Ronso Rage Nova (0x3073).
 *
 * ## The deviations, said (rule 6: none of them is a number)
 *
 * - **Ultima and Demi are the player's own rows** (0x3053, 0x304E), used by their ids as the Keeper uses Curaga. A monster pays no MP.
 * - **Death:** the script forces its "Die" action on its own death; the engine's ordinary KO does the same.
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { gameMod, livingFrontLine, randomLiving } from './game-rolls.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import {
  OW_ATTACK_ADDS,
  OW_CHOICE_MODULUS,
  OW_COUNTER_FLAG,
  OW_CYCLE_LENGTH,
  OW_DRAW_MODULUS,
  OW_NOVA_AT,
  OW_SCRIPT,
  OW_SPECIAL_ADDS,
  OW_STEP_FLAG,
  WEAPON_MOVES as M,
  aeonOnField,
  flagNumber,
} from './weapons-rules.ts';

/** One Omega Weapon turn (RE 4.2). */
export function omegaWeaponTurn(ai: AiContext): Command | null {
  const { ctx } = ai;
  const flags = ctx.state.flags;
  const counter = flagNumber(ctx, OW_COUNTER_FLAG);
  const living = livingFrontLine(ctx);
  if (counter >= OW_NOVA_AT) {
    flags[OW_COUNTER_FLAG] = 0;
    return living.length === 0 ? null : use(ai, M.nova, living.map((c) => c.id));
  }
  if (living.length === 0) return null;
  const front = living.map((c) => c.id);
  const aimed = (id: string): Command | null => {
    const victim: FFXCombatant | undefined = randomLiving(ctx);
    return victim === undefined ? null : use(ai, id, [victim.id]);
  };
  if (gameMod(ctx, OW_DRAW_MODULUS) === 0) {
    flags[OW_COUNTER_FLAG] = counter + OW_ATTACK_ADDS;
    return aimed(M.omegaAttack);
  }
  flags[OW_COUNTER_FLAG] = counter + OW_SPECIAL_ADDS;
  const step = flagNumber(ctx, OW_STEP_FLAG) + 1;
  flags[OW_STEP_FLAG] = step >= OW_CYCLE_LENGTH ? 0 : step;
  return specialStep(ai, step, front, aimed);
}

/** The special turn of cycle step `step` (1 to 4), by whether an aeon is out. */
function specialStep(ai: AiContext, step: number, front: string[], aimed: (id: string) => Command | null): Command | null {
  const { ctx } = ai;
  const aeon = aeonOnField(ctx);
  switch (step) {
    case 1:
      return aimed(M.coreEnergy);
    case 2:
      if (aeon) return use(ai, M.shimmeringRain, front);
      return choose(ai, aimedVictim(ctx), M.break, M.confuse);
    case 3:
      return aeon ? aimed(M.coreEnergy) : use(ai, M.shimmeringRain, front);
    default: // 4, the cycle's end
      if (aeon) return use(ai, M.shimmeringRain, front);
      return gameMod(ctx, OW_CHOICE_MODULUS) === 0 ? use(ai, M.ultima, front) : use(ai, M.demi, front);
  }
}

/** The member a status step picks first (a draw only when two or more stand), then the draw modulo 2 chooses the move. */
function aimedVictim(ctx: AiContext['ctx']): FFXCombatant | undefined {
  return randomLiving(ctx);
}

function choose(ai: AiContext, victim: FFXCombatant | undefined, first: string, second: string): Command | null {
  if (victim === undefined) return null;
  return use(ai, gameMod(ai.ctx, OW_CHOICE_MODULUS) === 0 ? first : second, [victim.id]);
}

registerAiScript(OW_SCRIPT, omegaWeaponTurn);
