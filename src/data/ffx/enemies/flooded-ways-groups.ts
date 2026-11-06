/**
 * The Flooded Ways' formations as one chain (FFX only; the hidden Flooded Ways chapter, number 36): **the Via Purifico's three areas** (`stbv00_10`, `_11`, `_12`: Evrae Altana, the same monster with the same HP in each) and
 * **the Baaj Temple's second Geosgaeno** (`bjyt02_02`), in the story's order (`docs/plans/ch-geosgaeno-review.md` GV1). The scripted first Geosgaeno (`bjyt02_01`, Tidus alone, three turns, cannot be won) is not built
 * (GV2). **Source:** `research/re-ffx-geosgaeno-evrae-altana.md` section 2 ("RE 2.n"; `[bytes]`).
 *
 * ## What each group carries, and from where
 *
 * - **Escape and Flee off for everyone, Switch off for characters 0, 4 and 6** (RE 2.3: the Via Purifico's areas 1 and 2 disable Escape and Flee for every character and Switch for 0, 4, 6; area 3 the same; the Baaj fight disables
 *   Escape and Flee for 0, 4, 6 and Switch for 0, 3, 4, 6), as `commandDisables` rows, plus `canEscape: false`. The party of the whole chapter is exactly Tidus, Wakka and Rikku, so Switch has nobody to bring anyway.
 * - **A water battle** (`inWater`, the block byte 3 of all four formations, RE 2.1): a Petrify that lands on a party member shatters them on the spot.
 * - **The area chain** (areas 1 to 3): area 1 and 2 hold the two Gate Locks and end when both are open (`ai/flooded-ways-end.ts`); each later area opens with Evrae Altana's HP as it was (`carriesBossHp`), with the party's
 *   HP as it was (the chain's own carry) and with the shattered members standing again (`returnsShattered`); a defeat retries that area (`checkpointOnEntry`). If the boss falls in an earlier area the later areas are skipped.
 * - **Link II** (Geosgaeno) is a fresh fight (`restoresPartyOnEntry`, no card, `checkpointOnEntry`): the Baaj Temple is another place and time. The last link pays every link's spoils (`poolsChainSpoils`).
 * - The start type is Normal on all four (RE 2.3), the engine's default. The music is the neutral `battle-ffx` for both links (preflight section 7: the game plays its Boss Theme for all five launches, and no cue of ours is that
 *   theme; a flagged stand-in, Bailey's ear decides, rule 13). Every plate is the Via Purifico's, standing in (the art list: three derived water plates and a Baaj plate are owed).
 */

import type { EnemyGroupDef, FormationCommandOff } from '../../../battle/common/types.ts';
import { FLOODED_LINKS, type FloodedLink } from '../flooded-ways-ids.ts';
import { evraeAltana, gateLock, geosgaeno } from './flooded-ways.ts';
import { FLOODED_WAYS_ABILITIES } from './flooded-ways-abilities.ts';

export { FLOODED_WAYS_ABILITIES };

/** The game's command ids the formation scripts pass (RE 2.3). */
const ESCAPE = 0x3003;
const FLEE = 0x3018;
const SWITCH = 0x3002;

/** Escape and Flee for everyone; Switch for the three swimmers (and Kimahri, whom the Baaj script lists and nobody brings). */
function disables(link: FloodedLink): FormationCommandOff[] {
  const out: FormationCommandOff[] = [
    { who: 'everyone', command: ESCAPE },
    { who: 'everyone', command: FLEE },
    { who: 'tidus', command: SWITCH },
    { who: 'wakka', command: SWITCH },
    { who: 'rikku', command: SWITCH },
  ];
  if (link.area === 0) out.push({ who: 'kimahri', command: SWITCH }); // RE 2.3: character 3 is on the Baaj script's Switch list too
  return out;
}

/** One link as a group. */
export function floodedGroup(index: number): EnemyGroupDef {
  const link = FLOODED_LINKS[index];
  if (link === undefined) throw new Error(`flooded-ways-groups: no link ${index}`);
  const next = FLOODED_LINKS[index + 1];
  const first = index === 0;
  const last = next === undefined;
  const bosses = link.area === 0 ? [geosgaeno()] : link.area === 3 ? [evraeAltana()] : [evraeAltana(), gateLock(0), gateLock(1)];
  return {
    id: link.groupId,
    game: 'ffx',
    canEscape: false,
    enemies: bosses,
    bossId: link.bodyId,
    headline: link.headline,
    plate: link.plate,
    inWater: true,
    commandDisables: disables(link),
    ...(next !== undefined ? { nextGroupId: next.groupId } : {}),
    // Areas 2 and 3: the boss HP and the shattered members ride across; a defeat retries the area.
    ...(link.area === 2 || link.area === 3 ? { carriesBossHp: true as const, returnsShattered: true as const, checkpointOnEntry: true } : {}),
    // Link II: a fresh fight, no card.
    ...(link.area === 0 && !first ? { restoresPartyOnEntry: true, noSaveSphereCard: true, checkpointOnEntry: true } : {}),
    ...(last ? { poolsChainSpoils: true } : {}),
    musicCues: [{ at: 'start', track: 'battle-ffx', fadeMs: 1200 }],
  };
}

/** The four groups in chain order. */
export const FLOODED_GROUPS: readonly EnemyGroupDef[] = FLOODED_LINKS.map((_, i) => floodedGroup(i));
