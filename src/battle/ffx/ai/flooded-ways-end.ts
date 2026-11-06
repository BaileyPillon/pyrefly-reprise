/**
 * **How the Flooded Ways' battles end besides the ordinary victory and defeat** (FFX only; the hidden Flooded Ways chapter), read by `engine-end.ts#checkEnd` before its own rules:
 *
 * - **The Via Purifico's area ends when both Gate Locks are gone** (RE 2.3: "if actors 21 and 22 are both dead it clears statuses, shows seven map layers, and ends the battle as 'player escaped'"; RE 4.3): the area is
 *   cleared with Evrae Altana still standing, and the chain carries on to the next area (`'victory'` is how a chained link reports a win, `BattleResult.nextGroupId`). An area whose locks stand and whose boss falls is the
 *   ordinary victory, and the chain skips the areas that are left (`app/screens/BattleScreenFloodedCarry.ts#skipSpentLinks`).
 * - **Geosgaeno's death blow can end the party** (RE 4.1 onDeath: 9,999 to the whole front line while somebody is inside): when that leaves nobody standing the battle is a defeat, though the monster is dead too
 *   (`checkEnd` would read the monster first and call it a win; the game's party is dead at that moment, and the guides say so). The blow is dealt from the `onHit` of the blow that killed it
 *   (`./geosgaeno.ts`); **a death that is not a hit** (a Poison tick on its own turn) is caught here, the first time the battle is asked whether it is over, and deals the same blow.
 */

import { type Ctx, isAlive, livingFriendlies, tryActor } from '../state.ts';
import { GEOSGAENO_ID, areaOf, gateLocks, heldId } from './flooded-ways-rules.ts';
import { deathBlow } from './geosgaeno-hold.ts';

/** `state.flags` key: Geosgaeno's death blow was dealt (`./geosgaeno.ts`, or here for a death that was no hit). */
export const DEATH_BLOW_FLAG = 'fw.geo.deathBlow';

export function floodedWaysOutcome(ctx: Ctx): 'victory' | 'defeat' | undefined {
  const area = areaOf(ctx);
  if (area === undefined) return undefined;
  if (area === 1 || area === 2) {
    const locks = gateLocks(ctx);
    if (locks.length === 2 && locks.every((c) => !isAlive(c))) return 'victory';
    return undefined;
  }
  const geo = tryActor(ctx, GEOSGAENO_ID);
  if (geo !== undefined && !isAlive(geo) && heldId(ctx) !== undefined && ctx.state.flags[DEATH_BLOW_FLAG] !== true) {
    ctx.state.flags[DEATH_BLOW_FLAG] = true;
    deathBlow(ctx, geo); // it died with somebody inside and nothing has hit them yet: a Poison tick
  }
  if (area === 0 && ctx.state.flags[DEATH_BLOW_FLAG] === true && livingFriendlies(ctx).length === 0) return 'defeat';
  return undefined;
}
