/**
 * The Sphere Level bar of a results row (FFX only; release 78, R77-4): where a member's grid stands once this battle's AP is banked, as numbers that can be printed `S.LV 187 · 11,000/22,000 AP`.
 *
 * Pure and DOM-free (`resultsMath.ts` prints it). **The bar can never be past its cap:** the AP left over after the levels gained is always under what the next level costs, and if the levels the engine reported
 * leave a whole level's worth over, the member has bought that level too and it is counted here. That is the case the release 77 review saw on the Omega Ruins' results ("S.LV 186 · 33,000/22,000 AP"): the chapter's
 * three links are one results screen (`EnemyGroupDef.poolsChainSpoils`), the screen adds the AP of the three (165,000) and the Sphere Levels each link reported (`BattleChainSpoils.addPerMember`), but each link
 * counted its levels from its own AP and dropped the remainder (the links pay 50,000, 60,000 and 55,000: two levels of 22,000 each, with 6,000, 16,000 and 11,000 dropped; the screen prints the whole 165,000
 * against the six levels, which leaves 33,000). Counting the unpaid whole levels from the AP the page prints makes the S.LV, the chip and the bar agree with the AP line. A bar that would still land past its cap (it cannot, with the
 * loop below) is held at the cap as a last guard, as FFX-2's bar holds at its ability's cost (`dressphereDetail`).
 *
 * Inert wherever the bar is within its cap (every single-link fight, every shipped chapter's results before a pooled chain): the levels, the rest and the cap are exactly the old arithmetic. Game case: FFX only (the
 * Sphere Grid is FFX's; FFX-2's rows read a dressphere's ability bar, which is untouched).
 */
import { apForLevel } from '../../battle/ffx/results.ts';

/** More whole levels than any fight could buy: the loop below ends long before (a level costs at least 5 AP and 22,000 at the top), this only guards against a bad number. */
const MAX_CARRIED_LEVELS = 1_000;

export interface SphereGridBar {
  /** The Sphere Level after the battle (the starting level plus every level bought, `levels`). */
  now: number;
  /** The levels gained: the engine's, plus any whole level the banked AP still pays for (`carried`). */
  levels: number;
  /** How many of {@link levels} are not in the engine's count (0 for every fight but a pooled chain's). */
  carried: number;
  /** The AP left toward the next level, from 0 up to just under {@link cap}. */
  rest: number;
  /** What the next level costs (`apForLevel(now)`). */
  cap: number;
}

/**
 * `sLv` the starting level, `bankedAp` the AP the member holds after the battle (the grid's own plus the battle's), `levelsGained` the levels the engine reported. `carry` false gives the engine's count as it was and
 * only holds the bar at its cap (the revert switch: one word).
 */
export function sphereGridBar(sLv: number, bankedAp: number, levelsGained: number, carry = true): SphereGridBar {
  let rest = bankedAp;
  for (let i = 0; i < levelsGained; i++) rest -= apForLevel(sLv + i);
  let levels = levelsGained;
  if (carry) {
    for (let n = 0; n < MAX_CARRIED_LEVELS && rest >= apForLevel(sLv + levels); n++) {
      rest -= apForLevel(sLv + levels);
      levels += 1;
    }
  }
  const now = sLv + levels;
  const cap = apForLevel(now);
  return { now, levels, carried: levels - levelsGained, rest: Math.min(Math.max(0, rest), cap), cap };
}
