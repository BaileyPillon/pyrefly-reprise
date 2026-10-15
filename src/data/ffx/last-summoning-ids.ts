/**
 * The ids of the hidden Last Summoning chapter (hidden FFX chapter 28; `../chapter-last-summoning.ts`), in a module with no imports so that the scene, the door, the chain builder, the offering screen, the guide and
 * the tactic can all name them without pulling each other's graphs in (a scene must not import the chapter record, which imports the story and the party's builds). The battle layer does not import `src/data`:
 * `battle/ffx/ai/possessed-sisters.ts` keeps its own copy of the three Sisters' combatant ids, and `tests/unit/chapters/last-summoning-chain.test.ts` pins that the copies agree.
 *
 * **Game case: FFX only** (AGENTS.md rule 14): aeons, Summon and the possession chain exist only in FFX.
 */

/** The chapter's id: its key in the experiments' store and in the registry (the board has no card for it; its word is `summon`, `../../app/screens/frontend/summonDoor.ts`). */
export const LAST_SUMMONING_ID = 'last-summoning' as const;

/** The chapter's scene key: Dream's End's diorama with this chapter's staging (`../../scenes/last-summoning.ts`); the plate under `backdrops/<key>.png` is a copy of Dream's End's. */
export const LAST_SUMMONING_SCENE = 'last-summoning' as const;

/**
 * What Yu Yevon may take, in the game's list order (ids 8 to 15 of `sins0700`: Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo, and Cindy standing for all three Magus Sisters;
 * `research/re-ffx-last-summoning.md` section 2 and 3). **Anima has no fixed place in the order the player picks** (RE section 3): the list is only where she sits on the screen.
 */
export const OFFERING_KEYS = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'sisters'] as const;

/** One thing Yu Yevon may take. */
export type OfferingKey = (typeof OFFERING_KEYS)[number];

/** The player's aeon ids behind an offering: the Sisters are three actors and leave together (RE section 2, item 4). */
export function aeonIdsOf(key: OfferingKey): readonly string[] {
  return key === 'sisters' ? ['cindy', 'sandy', 'mindy'] : [key];
}

/** The possessed bodies of an offering's link: the Sisters are one battle with three. */
export function possessedIdsOf(key: OfferingKey): readonly string[] {
  return aeonIdsOf(key).map((id) => `possessed-${id}`);
}

/** The words a taken aeon's greyed Summon row gives (ours). */
export const TAKEN_REASON = 'Taken by Yu Yevon' as const;

/** The marker `nextGroupId` carries on every seam of this chain: the screen's chooser answers it with the formation the player's pick leads to (`EnemyGroupDef.offersAeons`). */
export const OFFERING_NEXT_ID = 'last-summoning:offering' as const;

/** The placeholder first formation: staged behind the offering screen and never fought (`offersAeons: 'open'`). */
export const OPENER_GROUP_ID = 'last-summoning:open' as const;

/** How many formations the whole chain has when the player holds every aeon: eight possessions and Yu Yevon. */
export const FULL_CHAIN_LENGTH = OFFERING_KEYS.length + 1;

const PREFIX = 'last-summoning:';
const YU_YEVON = 'yu-yevon';

/** The id of the possession link reached after giving up `order` in that order (the last key is the aeon fought in it). */
export function linkGroupId(order: readonly OfferingKey[]): string {
  return `${PREFIX}${order.join('+')}`;
}

/** The id of Yu Yevon's formation after the whole of `order` has been given up. */
export function yuYevonGroupId(order: readonly OfferingKey[]): string {
  return `${PREFIX}${order.join('+')}+${YU_YEVON}`;
}

/** What a group id of this chain says, or `null` for any other id (and for the opener and the marker). */
export function parseGroupId(id: string): { order: OfferingKey[]; yuYevon: boolean } | null {
  if (!id.startsWith(PREFIX) || id === OPENER_GROUP_ID || id === OFFERING_NEXT_ID) return null;
  const parts = id.slice(PREFIX.length).split('+');
  const yuYevon = parts[parts.length - 1] === YU_YEVON;
  const keys = yuYevon ? parts.slice(0, -1) : parts;
  const order: OfferingKey[] = [];
  for (const k of keys) {
    if (!(OFFERING_KEYS as readonly string[]).includes(k) || order.includes(k as OfferingKey)) return null;
    order.push(k as OfferingKey);
  }
  if (order.length === 0) return null;
  return { order, yuYevon };
}

/** The aeons still held after `taken`, in the list's order. */
export function heldAfter(taken: readonly OfferingKey[]): OfferingKey[] {
  return OFFERING_KEYS.filter((k) => !taken.includes(k));
}

/** The formation the pick of `key` leads to, after `taken` were given up: `key`'s possession link (Yu Yevon follows only the last link: {@link nextGroupIdAfter}). */
export function groupIdForPick(taken: readonly OfferingKey[], key: OfferingKey): string {
  return linkGroupId([...taken, key]);
}

/** After the link that took `order`: the offering's marker, or Yu Yevon's formation once every aeon is gone. */
export function nextGroupIdAfter(order: readonly OfferingKey[]): string {
  return order.length >= OFFERING_KEYS.length ? yuYevonGroupId(order) : OFFERING_NEXT_ID;
}
