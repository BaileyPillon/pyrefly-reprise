/**
 * Lady Luck's Two Dice at the engine's seam (re-parity RC10; **FFX-2 only**; FFX2-H04 section 3.9). The rules are `kernel/die.ts`; this module only holds the
 * generator in the battle and turns a die result into the ability that fires.
 *
 * The game rolls the dice inside the effect (two consecutive calls of the effect module's face generator), then hands the SUM of the faces to the hit
 * determination as its hit override and swaps the command's row when the faces agree. The engine does the same at the moment the strikes would resolve: it rolls
 * two faces, the sum is `hitsOverride` (the game's own override, `StrikeOptions#hitsOverride`), and a pair or two ones fire the stronger row.
 *
 * **The generator is not a battle stream.** The game's walk is global to the effect module and other effects draw from it too, so where in its 185-value cycle a
 * battle's first dice land is not knowable. The engine places it at a uniform position of the cycle with one draw of its engine-side stream
 * ({@link BattleRng.aux}, which cannot move any game stream), made at the first roll of a battle and nowhere else, and keeps the walk's state in the battle's flags
 * (`dieGenState`) so the dice of one battle continue one walk. An ability that rolls no dice (everything but Two Dice) takes no draw and touches no flag.
 */

import type { AbilityDef, BattleState, Rng } from '../common/types.ts';
import type { AbilityRegistry } from './internal.ts';
import { DIE_CYCLE_LENGTH, DIE_ROWS, dieFace, dieGeneratorInCycle, dieResult, type DieGenerator } from './kernel/die.ts';

/** The battle flag that holds the face generator's state (its bits). */
export const DIE_STATE_FLAG = 'dieGenState';

/** How many dice `ability` rolls (`extra.hitsFromDiceRoll`); 0 for every other ability. */
export function diceOf(ability: AbilityDef): number {
  const n = ability.extra?.['hitsFromDiceRoll'];
  return typeof n === 'number' && n >= 1 ? Math.trunc(n) : 0;
}

/** What a roll decides. */
export interface DiceRoll {
  faces: number[];
  /** The sum of the faces: the hit count handed to the hit determination as its override. */
  hits: number;
  /** The ability that fires: the base ability, or its stronger row when the dice agree (`extra.diceRows`). */
  fired: AbilityDef;
}

/** The generator as the battle holds it, or a new one placed in its cycle. */
function generatorOf(state: BattleState, aux: Rng): DieGenerator {
  const held = state.flags[DIE_STATE_FLAG];
  return typeof held === 'number' ? { state: held, primed: true } : dieGeneratorInCycle(aux.int(0, DIE_CYCLE_LENGTH - 1));
}

/** Roll `ability`'s dice (null when it rolls none). Moves the battle's generator on by one call a die. */
export function rollDice(state: BattleState, aux: Rng, abilities: AbilityRegistry, ability: AbilityDef): DiceRoll | null {
  const count = diceOf(ability);
  if (count < 1) return null;
  const gen = generatorOf(state, aux);
  const faces: number[] = [];
  for (let i = 0; i < count; i++) faces.push(dieFace(gen));
  state.flags[DIE_STATE_FLAG] = gen.state;
  const result = dieResult(faces);
  const rows = ability.extra?.['diceRows'] as { pair?: string; ones?: string } | undefined;
  const swap = result.commandId === DIE_ROWS.twoDicePair || result.commandId === DIE_ROWS.fourDicePair ? rows?.pair : result.commandId === DIE_ROWS.twoDiceOnes || result.commandId === DIE_ROWS.fourDiceOnes ? rows?.ones : undefined;
  return { faces, hits: result.hits, fired: (swap !== undefined ? abilities.get(swap) : undefined) ?? ability };
}

/**
 * The faces a preview quotes (the advisor's estimate, `simulate.ts`): the policy's end of the sums of a mixed roll, 3 (a one and a two), 7 (the walk's mean sum is 6.64) and
 * 11 (a five and a six), on the base row. A preview never rolls: it draws nothing and holds no generator, like the Trigger Happy estimate.
 */
export function expectedDiceHits(ability: AbilityDef, policy: 'min' | 'mid' | 'max'): number | null {
  const count = diceOf(ability);
  if (count < 1) return null;
  return Math.round(count * (policy === 'min' ? 1.5 : policy === 'max' ? 5.5 : 3.5));
}
