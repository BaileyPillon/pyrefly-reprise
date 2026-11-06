/**
 * The six other Dark Aeons' formations as one chain (FFX only; the hidden Dark Aeons chapter, number 34): **the game's seven** (`research/re-ffx-dark-aeons-six.md` section 2, "RE six n", `[bytes]`), built from the link table
 * in `../dark-aeons-six-ids.ts`. The game lets the player fight them in any order and with a Save Sphere's worth of rest between; the chapter strings them in the order of pick DA2 (`docs/plans/ch-dark-aeons-review.md`):
 * Valefor, Ifrit, Ixion's two fights, Shiva, Anima, Bahamut.
 *
 * ## What each group carries, and from where
 *
 * - **One body at slot 0** (RE six 1.1: one monster, one slot each, no dog and no helper), **Escape and Flee off** (`canEscape: false`; five of the seven formation scripts disable both (RE six 2.2); **a departure for the
 *   two Dark Ixion fights, whose formations disable neither**, pick DA8: a link is one fight of a chain and a fled link has no place to go), the music (`boss-challenge`, our original take of the game's one "Challenge"
 *   cue, for all but the last link; Dark Bahamut's is `boss-yojimbo`: stand-ins by reference, no source names these fights' cues, Bailey's ear decides, rule 13), the headline, the plate (an existing backdrop standing in).
 * - **The chain** (pick DA1): each link but the last names the next (`nextGroupId`); every link from the second on is a **fresh fight** (`restoresPartyOnEntry`, `restoresAeonsOnEntry`: the party and every aeon whole, a
 *   fallen member or aeon up, statuses cleared; the bag, the gil and the gauges carry), a **retry checkpoint** (`checkpointOnEntry`: a defeat retries that link, not the chapter) and shows **no Save Sphere card**
 *   (`noSaveSphereCard`); the last link pays every link's spoils in one results screen (`poolsChainSpoils`). A defeat on the first link starts the chapter over.
 * - The start type is Normal on all seven (pick DA9; the game writes Normal in six and rolls for Dark Anima, who writes nothing), the engine's default for a chapter.
 */

import type { EnemyDef, EnemyGroupDef } from '../../../battle/common/types.ts';
import { DARK_SIX_LINKS, type DarkSixKey } from '../dark-aeons-six-ids.ts';
import { DARK_SIX_ABILITIES } from './dark-aeons-six-abilities.ts';
import { darkAnima, darkBahamut, darkIfrit, darkIxion1, darkIxion2, darkShiva, darkValefor } from './dark-aeons-six.ts';

export { DARK_SIX_ABILITIES };

const BODY: Readonly<Record<DarkSixKey, () => EnemyDef>> = {
  valefor: darkValefor,
  ifrit: darkIfrit,
  'ixion-1': darkIxion1,
  'ixion-2': darkIxion2,
  shiva: darkShiva,
  anima: darkAnima,
  bahamut: darkBahamut,
};

/** One link as a group. */
export function darkSixGroup(index: number): EnemyGroupDef {
  const link = DARK_SIX_LINKS[index];
  if (link === undefined) throw new Error(`dark-aeons-six-groups: no link ${index}`);
  const next = DARK_SIX_LINKS[index + 1];
  const first = index === 0;
  const last = next === undefined;
  return {
    id: link.groupId,
    game: 'ffx',
    canEscape: false,
    enemies: [BODY[link.key]()],
    bossId: link.bodyId,
    headline: link.headline,
    plate: link.plate,
    ...(next !== undefined ? { nextGroupId: next.groupId } : {}),
    ...(first ? {} : { checkpointOnEntry: true, restoresPartyOnEntry: true, restoresAeonsOnEntry: true, noSaveSphereCard: true }),
    ...(last ? { poolsChainSpoils: true } : {}),
    musicCues: [{ at: 'start', track: last ? 'boss-yojimbo' : 'boss-challenge', fadeMs: 1200 }],
  };
}

/** The seven groups in chain order. */
export const DARK_SIX_GROUPS: readonly EnemyGroupDef[] = DARK_SIX_LINKS.map((_, i) => darkSixGroup(i));

/** The group of one link key (`'valefor'`, `'ixion-2'`). Throws on an unknown key so a typo cannot pass silently. */
export function darkSixGroupOf(key: DarkSixKey): EnemyGroupDef {
  const link = DARK_SIX_LINKS.find((l) => l.key === key);
  const found = link === undefined ? undefined : DARK_SIX_GROUPS.find((g) => g.id === link.groupId);
  if (found === undefined) throw new Error(`dark-aeons-six-groups: no link '${key}'`);
  return found;
}
