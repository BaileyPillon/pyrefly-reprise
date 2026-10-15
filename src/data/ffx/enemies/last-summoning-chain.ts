/**
 * **The Last Summoning's chain** (hidden FFX chapter 28): the formations of a gauntlet whose order the player picks. Chapter III's chain is a fixed list built once (`buildPossessedAeonChain`); this one cannot be, so every
 * formation is a **pure function of what has been given up so far** and its id says so (`../last-summoning-ids.ts`: `last-summoning:ifrit+shiva`), which `findEnemyGroup` resolves on demand
 * (`../../../app/screens/BattleScreenSetup.ts`). **Game case: FFX only.**
 *
 * - **The opener** (`last-summoning:open`): Yu Yevon's formation as a stand-in, staged behind the first offering screen and never fought (`offersAeons: 'open'`); the chain loop asks the player before the first
 *   fight and replaces it with the pick's possession link.
 * - **A possession link** (`last-summoning:<order>`; the last key is the aeon fought): the aeon's possessed copy and the two Yu Pagodas, exactly as Chapter III builds one (`possessedAeonEnemyDef`, `yuPagoda`),
 *   under the fayth's permanent Auto-Life; **the Magus Sisters are one battle with three bodies**, as the game fights them (`sins07_07`: Mindy, Sandy, Cindy, then the Pagodas), each with her own script
 *   (`battle/ffx/ai/possessed-sisters.ts`). Every aeon given up so far, this link's own included, is **locked** (`lockedAeons`, with the words "Taken by Yu Yevon"): off the Summon list and out of Grand Summon's
 *   choices, as the game removes the chosen aeon from the party before its battle and locks its id in the monster's own script (`research/re-ffx-last-summoning.md` section 2 and 5). After it comes the offering
 *   again (`nextGroupId` is the marker; `offersAeons: 'next'`), or Yu Yevon once all eight are gone.
 * - **Yu Yevon** (`last-summoning:<order>+yu-yevon`): Chapter III's own formation with every aeon locked (eight greyed rows: the cost on the screen).
 *
 * The stats of a possessed copy are not here: they are copied from the player's own aeon at the battle's start (`battle/ffx/ai/possession-setup.ts`).
 */

import type { EnemyDef, EnemyGroupDef } from '../../../battle/common/types.ts';
import { cloneData } from '../../../battle/common/clone.ts';
import { possessedAeonEnemyDef, yuPagoda, yuYevonGroup } from './braskas-final-aeon.ts';
import {
  FULL_CHAIN_LENGTH,
  OFFERING_KEYS,
  OFFERING_NEXT_ID,
  OPENER_GROUP_ID,
  type OfferingKey,
  TAKEN_REASON,
  aeonIdsOf,
  linkGroupId,
  nextGroupIdAfter,
  parseGroupId,
  yuYevonGroupId,
} from '../last-summoning-ids.ts';

/** Every aeon given up so far, locked with its reason. The mirror is the enemy the lock is about: Yu Yevon, who holds them. */
function locksFor(taken: readonly OfferingKey[]): NonNullable<EnemyGroupDef['lockedAeons']> {
  return taken.flatMap((key) => aeonIdsOf(key).map((aeonId) => ({ aeonId, mirrorOf: 'yu-yevon', reason: TAKEN_REASON })));
}

/** The Sisters' three bodies in the game's slot order (Mindy, Sandy, Cindy), each on her own script, then the two Pagodas. */
function sistersEnemies(): EnemyDef[] {
  const body = (key: 'mindy' | 'sandy' | 'cindy', slot: number): EnemyDef => ({ ...possessedAeonEnemyDef(`possessed-${key}`, slot), aiScriptId: `possessed-${key}` });
  return [
    body('mindy', 0),
    body('sandy', 1),
    body('cindy', 2),
    yuPagoda('yu-pagoda-left', 3, 'aeon-or-yu-yevon'),
    yuPagoda('yu-pagoda-right', 4, 'aeon-or-yu-yevon'),
  ];
}

/** One possessed aeon and the two Pagodas, as Chapter III builds a link. */
function singleEnemies(key: Exclude<OfferingKey, 'sisters'>): EnemyDef[] {
  return [
    possessedAeonEnemyDef(`possessed-${key}` as 'possessed-valefor', 0),
    yuPagoda('yu-pagoda-left', 1, 'aeon-or-yu-yevon'),
    yuPagoda('yu-pagoda-right', 2, 'aeon-or-yu-yevon'),
  ];
}

/** The possession link reached after giving up `order` (its last key is the aeon fought). */
export function possessionGroup(order: readonly OfferingKey[]): EnemyGroupDef {
  const key = order[order.length - 1];
  if (key === undefined) throw new Error('last-summoning: a possession link needs at least one aeon given up');
  const next = nextGroupIdAfter(order);
  return {
    id: linkGroupId(order),
    game: 'ffx',
    canEscape: false,
    grantsPermanentAutoLife: true, // ffx-bfa-yu-yevon §2.3 [verified: 3 sources]: the fayth's Auto-Life from the possession fights on
    enemies: key === 'sisters' ? sistersEnemies() : singleEnemies(key),
    ...(key === 'sisters' ? { bossId: 'possessed-cindy', headline: 'Magus Sisters' } : {}),
    nextGroupId: next,
    ...(next === OFFERING_NEXT_ID ? { offersAeons: 'next' as const } : {}),
    lockedAeons: locksFor(order),
    chainLength: FULL_CHAIN_LENGTH,
    musicCues: [{ at: 'start', track: 'boss-yu-yevon', fadeMs: 800 }],
  };
}

/** Yu Yevon's formation after the whole of `order`: Chapter III's, a copy, with all eight aeons locked. */
export function yuYevonLink(order: readonly OfferingKey[]): EnemyGroupDef {
  const copy = cloneData(yuYevonGroup);
  return { ...copy, id: yuYevonGroupId(order), lockedAeons: locksFor(order), chainLength: FULL_CHAIN_LENGTH };
}

/** The placeholder first formation: Yu Yevon staged behind the first offering, replaced by the pick before anything is fought. */
export function openerGroup(): EnemyGroupDef {
  const copy = cloneData(yuYevonGroup);
  return { ...copy, id: OPENER_GROUP_ID, nextGroupId: OFFERING_NEXT_ID, offersAeons: 'open', lockedAeons: [], chainLength: FULL_CHAIN_LENGTH };
}

const CACHE = new Map<string, EnemyGroupDef>();

/** The formation with this id if it belongs to the chain, else `null`. Resolved on demand and kept, so one id is one object. */
export function lastSummoningGroup(id: string): EnemyGroupDef | null {
  const known = CACHE.get(id);
  if (known !== undefined) return known;
  let made: EnemyGroupDef | null = null;
  if (id === OPENER_GROUP_ID) made = openerGroup();
  else {
    const parsed = parseGroupId(id);
    if (parsed !== null) made = parsed.yuYevon ? yuYevonLink(parsed.order) : possessionGroup(parsed.order);
  }
  if (made !== null) CACHE.set(id, made);
  return made;
}

/** The first formation of the chapter (the record's `enemyGroupRef`): the same object `lastSummoningGroup(OPENER_GROUP_ID)` answers. */
export const lastSummoningOpener: EnemyGroupDef = lastSummoningGroup(OPENER_GROUP_ID) as EnemyGroupDef;

/** The keys, re-exported for the screens and the tests that walk a whole order. */
export { OFFERING_KEYS };
