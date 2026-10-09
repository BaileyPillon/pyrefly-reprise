/**
 * **The pair of party slots a double cast is aimed at** (re-parity; **FFX only**; shared by Seymour in Macalania
 * and Seymour Natus, whose scripts spell it out the same way):
 * `research/re-ffx-ai-seymour.md` section 3.4 row 4 and section 4.3 row 2.
 *
 * Before choosing its cast the script spends the draws below, whether or not it ends up using the pair (Macalania's
 * Seymour computes it on every turn and uses it only in act three), so they are drawn here in the script's order:
 *
 * 1. The call that builds the "living front line" mask draws one picker value when two or more are standing
 *    ({@link drawPicker}); its result is discarded.
 * 2. **Three standing:** `GetRandomValue() mod 3` names the slot to leave out (slot 1 with 21,846 of 65,536 values,
 *    slots 2 and 3 with 21,845), then `GetRandomValue() mod 100 > 50` orders the other two: ascending when true
 *    (48.97 %), descending when false.
 * 3. **Two standing:** the script tests slots 1, 2 and 3 in turn for the one that is down and spends one coin
 *    ordering the other two (ascending when true).
 * 4. **One standing:** that actor twice, no draw. Nobody standing: the previous pair stands (never reached in a
 *    live battle).
 *
 * **The slip in Natus's script** (found reading its compiled branch; the research note's table says "the two living
 * slots"): with slot 3 down, the *false* coin pairs slot 1 with slot 3, the fallen one, where Macalania's Seymour
 * correctly pairs 2 with 1. The queue rejects a command aimed at a fallen member (`FUN_007ac9c0`, "TARGET ERROR"),
 * so that half of the cast is lost: 51.03 % of Natus's double casts with Auron down hit one member, not two.
 * `script: 'natus'` follows his branch; `'macalania'` follows Seymour's.
 */

import type { CombatantId, FFXCombatant } from '../../common/types.ts';
import { type Ctx, isAlive, livingFriendlies, tryActor } from '../state.ts';
import { drawPicker, scriptCoin, scriptMod } from './script-random.ts';

export type PairScript = 'macalania' | 'natus';

/** The pair, as the combatants the script's two commands name (a fallen member is named too, and refused later). */
export type PartyPair = readonly [CombatantId, CombatantId] | null;

/** The three active slots, `Character 1/2/3`, in menu order. */
function slots(ctx: Ctx): (FFXCombatant | undefined)[] {
  return [0, 1, 2].map((i) => {
    const id = ctx.state.activeIds[i];
    return id === undefined ? undefined : tryActor(ctx, id);
  });
}

/** Two slot indexes ordered by the script's coin: ascending when true. */
function ordered(a: number, b: number, coin: boolean): [number, number] {
  return coin ? [a, b] : [b, a];
}

export function pickPartyPair(ctx: Ctx, script: PairScript): PartyPair {
  const living = livingFriendlies(ctx);
  drawPicker(ctx, living.length);
  const party = slots(ctx);
  const name = (i: number): CombatantId | undefined => party[i]?.id;
  const out = (a: number, b: number): PartyPair => {
    const x = name(a);
    const y = name(b);
    return x === undefined || y === undefined ? null : [x, y];
  };

  if (living.length >= 3) {
    const left = scriptMod(ctx, 3);
    const coin = scriptCoin(ctx);
    const rest = [0, 1, 2].filter((i) => i !== left) as [number, number];
    const [first, second] = ordered(rest[0], rest[1], coin);
    return out(first, second);
  }
  if (living.length === 2) {
    for (let down = 0; down < 3; down++) {
      const member = party[down];
      if (member && isAlive(member)) continue;
      const coin = scriptCoin(ctx);
      const rest = [0, 1, 2].filter((i) => i !== down) as [number, number];
      if (script === 'natus' && down === 2 && !coin) return out(0, 2); // the slip: slot 3 is the fallen one
      const [first, second] = ordered(rest[0], rest[1], coin);
      return out(first, second);
    }
    return null;
  }
  const only = living[0];
  return only ? [only.id, only.id] : null;
}
