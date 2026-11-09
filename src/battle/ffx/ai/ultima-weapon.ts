/**
 * **Ultima Weapon's script** (FFX only; the hidden Omega Ruins chapter, number 43, Act I): the monster file `m99` as the game's own bytecode runs it (`research/re-ffx-omega-ultima-nemesis.md` section 4.1, "RE 4.1": read from the
 * file and run in the earlier lanes' interpreter). **No number here is ours**; the rules and their sources are `./weapons-rules.ts`, the rows `data/ffx/enemies/weapons-abilities.ts`. It has no counters, no phases and no hooks:
 * the whole of it is the turn.
 *
 * ## Ultima Weapon's turn (RE 4.1), once per turn
 *
 * A counter is raised by one at the start of the turn (1 to 6); **the branch is chosen by whether any aeon is on the field** (`./weapons-rules.ts#aeonOnField`), at every turn, so it can change mid-cycle.
 *
 * | Counter | An aeon is out | No aeon is out |
 * |---:|---|---|
 * | 1 | **Attack** on a random living front-line member | the same |
 * | 2 | **Core Energy** on a random one | **Break (Petrify), Silence or Confuse** (a draw modulo 3: 0, 1, 2) on a random one |
 * | 3 | **Shimmering Rain** on the whole front line | **Core Energy** on a random one |
 * | 4 | **Core Energy** on a random one | **Holy, Sleep or Confuse** (a draw modulo 3: 0, 1, 2) on a random one |
 * | 5 | **Attack** on a random one | the same |
 * | 6 | **Shimmering Rain** on the front line; the counter returns to 0 | the same |
 *
 * Nothing reacts to being hit and nothing the player does changes the round except putting an aeon on the field. A six-turn cycle is 144 CTB. The target pick is a draw only when two or more members stand
 * (`./game-rolls.ts#randomLiving`); the status draw is `GetRandomValue() mod 3` (21,846 / 21,845 / 21,845 of 65,536). The order of the two draws in a status turn (the target, then the status) is the script's.
 *
 * ## The deviations, said (rule 6: none of them is a number)
 *
 * - **Holy is the player's own row** (0x303F, formula 3, power 100, holy-elemental, reflectable), used by its id as the Keeper uses Curaga. A monster pays no MP.
 * - **Death:** the script forces its "Die" action on its own death; the engine's ordinary KO does the same (the body stays: death animation "Boss").
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { gameMod, livingFrontLine, randomLiving } from './game-rolls.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import {
  UW_CYCLE_LENGTH,
  UW_SCRIPT,
  UW_STATUS_MODULUS,
  UW_TURN_FLAG,
  WEAPON_MOVES as M,
  aeonOnField,
  flagNumber,
} from './weapons-rules.ts';

export * from './weapons-rules.ts';

/** One of the status moves, picked by a draw modulo 3 in the order the script lists them. */
function statusMove(ai: AiContext, victim: FFXCombatant | undefined, moves: readonly [string, string, string]): Command | null {
  if (victim === undefined) return null;
  const draw = gameMod(ai.ctx, UW_STATUS_MODULUS);
  return use(ai, moves[draw] as string, [victim.id]);
}

/** One Ultima Weapon turn (RE 4.1). */
export function ultimaWeaponTurn(ai: AiContext): Command | null {
  const { ctx } = ai;
  const living = livingFrontLine(ctx);
  if (living.length === 0) return null;
  const turn = flagNumber(ctx, UW_TURN_FLAG) + 1; // the counter is raised at the start of every turn
  ctx.state.flags[UW_TURN_FLAG] = turn >= UW_CYCLE_LENGTH ? 0 : turn;
  const aeon = aeonOnField(ctx);
  const front = living.map((c) => c.id);
  const one = (): FFXCombatant | undefined => randomLiving(ctx);
  const aimed = (id: string): Command | null => {
    const victim = one();
    return victim === undefined ? null : use(ai, id, [victim.id]);
  };
  switch (turn) {
    case 1:
    case 5:
      return aimed(M.ultimaAttack);
    case 2:
      return aeon ? aimed(M.coreEnergy) : statusMove(ai, one(), [M.break, M.silence, M.confuse]);
    case 3:
      return aeon ? use(ai, M.shimmeringRain, front) : aimed(M.coreEnergy);
    case 4:
      return aeon ? aimed(M.coreEnergy) : statusMove(ai, one(), [M.holy, M.sleep, M.confuse]);
    default:
      return use(ai, M.shimmeringRain, front); // 6 (the cycle's end)
  }
}

registerAiScript(UW_SCRIPT, ultimaWeaponTurn);
