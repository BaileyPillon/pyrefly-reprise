/**
 * **Jormungand's script** (FFX only; the hidden Gauntlet chapter's act 3, the Monster Arena's Djose Highroad creation, monster file `m311`), as the game's own bytecode runs it (`research/re-ffx-monster-arena-creations.md` 3.7,
 * "RE n": 1,343 bytes of code, read from the file and run in the earlier lanes' interpreter with exact tallies over all 65,536 results of the random stream, `[disasm] [run]`). **No number here is ours.** The rows are
 * `data/ffx/enemies/gauntlet-abilities.ts`, the record `data/ffx/enemies/gauntlet.ts`. The script has no `onHit`: it counters nothing.
 *
 * ## The turn (RE n 3.7)
 *
 * | Condition | Draw | What it does |
 * |---|---|---|
 * | **an aeon is in the front line** | `mod 4`: 0 | **Cold Stare** (Petrify 254) on one random living member (16,384 of 65,536: 25 percent) |
 * | | `mod 4`: 1, 2, 3 | **Attack** on one random living member (49,152: 75 percent); never the Vorpal |
 * | **a member of the front line is petrified** (`findMatchingChr(front line, StatusPetrify)`) | none | **Attack** on that member (the shatter; with two or more petrified, the picker chooses) |
 * | **nobody is petrified** | `mod 3`: 0 | **Attack** on one random living member (21,846 of 65,536) |
 * | | `mod 3`: 1 | **Cold Stare** on one random living member (21,845) |
 * | | `mod 3`: 2 | **Space-Time Vorpal** (formula 3, power 40) on the whole front line (21,845) |
 *
 * The petrified member is looked for twice (once to test, once to aim), each a picker draw with two or more candidates; the "random living member" is picked after the `mod` draw. The Ribbon wards Petrify in the
 * engine (`types.ts`), so on the endgame party Cold Stare is a hit of 146 to 165 and no statue; against a party without it the next turn is the shatter.
 */

import type { Command } from '../../common/types.ts';
import { has } from '../state.ts';
import { aeonHoldsField } from './hit-gates.ts';
import { gameMod, livingFrontLine, pickActor, randomLiving } from './game-rolls.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import { GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS } from './gauntlet-rules.ts';

/** The draw with an aeon in the front line: `mod 4`, Cold Stare on 0 (RE n 3.7). */
export const JORMUNGAND_AEON_MODULO = 4;
/** The draw with nobody petrified and no aeon: `mod 3`, Attack on 0, Cold Stare on 1, the Vorpal on 2 (RE n 3.7). */
export const JORMUNGAND_OPEN_MODULO = 3;

/** One Jormungand turn (RE n 3.7). */
export function jormungandTurn(ai: AiContext): Command | null {
  const { ctx } = ai;
  const living = (): string[] => {
    const v = randomLiving(ctx);
    return v === undefined ? [] : [v.id];
  };
  if (aeonHoldsField(ctx)) {
    const draw = gameMod(ctx, JORMUNGAND_AEON_MODULO);
    return use(ai, draw === 0 ? ROW.coldStare : ROW.jormungandAttack, living());
  }
  const statues = livingFrontLine(ctx).filter((c) => has(c, 'petrify'));
  if (pickActor(ctx, statues) === undefined) {
    const draw = gameMod(ctx, JORMUNGAND_OPEN_MODULO);
    if (draw === 2) return use(ai, ROW.vorpal, []); // the whole front line
    return use(ai, draw === 0 ? ROW.jormungandAttack : ROW.coldStare, living());
  }
  const statue = pickActor(ctx, statues); // the second `findMatchingChr`, which aims the Attack
  return use(ai, ROW.jormungandAttack, statue === undefined ? [] : [statue.id]);
}

registerAiScript(GAUNTLET_SCRIPTS.jormungand, jormungandTurn);
