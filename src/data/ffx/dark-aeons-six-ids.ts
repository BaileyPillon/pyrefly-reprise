/**
 * The ids of the hidden **Dark Aeons** chapter (FFX only; `../chapter-dark-aeons.ts`; hidden chapter number 34; branch `ch-dark-aeons`, 2026-11-06), in a module with no imports so that the scene, the door, the data, the
 * story and the battle layer's seams can all name them without pulling each other's graphs in. The battle layer does not import `src/data`: `battle/ffx/ai/dark-aeons-six-rules.ts` keeps its own copy of the combatant,
 * script and ability ids, and `tests/unit/chapters/dark-aeons-six-data.test.ts` pins that the copies agree.
 *
 * **Every number in the link table is the game's own** (`research/re-ffx-dark-aeons-six.md`, "RE six section n", `[bytes]`): the seven formations of the six other Dark Aeons (`bsil07_70` Valefor, `bika03_70` Ifrit,
 * `kami03_70` and `kami03_71` Ixion, `mcyt00_70` Shiva, `mtgz01_70` Anima, `dome06_70` Bahamut), their battle ids, stage ids and launch flag words (RE six 2.1). **The order of the links is NOT the game's** (the game lets the
 * player fight them in any order; RE six 9): it is the chapter's pick DA2 (`docs/plans/ch-dark-aeons-review.md`), the guides' order of acquisition with Bahamut last, "driver's call, his to overturn". The plates are provisional
 * stand-ins from existing art (pick DA10).
 */

/** The chapter's id: its key in the experiments' store (the board has no card for it; its word is `darkaeon`, `../../app/screens/frontend/darkaeonDoor.ts`). */
export const DARK_AEONS_CHAPTER_ID = 'dark-aeons' as const;

/** The chapter's scene key: one painted stage with seven plates (`../../scenes/dark-aeons.ts`). */
export const DARK_AEONS_SCENE = 'dark-aeons' as const;

/** The six bodies (combatant ids, which are also the art subjects' names for the sprite lookup: `characters/<id>/` and `portraits/<id>.png`; each Dark aeon draws its own Dark painting, never the player's aeon). */
export const DARK_VALEFOR_ID = 'dark-valefor' as const;
export const DARK_IFRIT_ID = 'dark-ifrit' as const;
export const DARK_IXION_ID = 'dark-ixion' as const;
/** Dark Ixion's second fight is a different formation with a different script (RE six 4.3), so it is a different combatant id; both draw the one painting `characters/dark-ixion/` (`spriteKey`). */
export const DARK_IXION_2_ID = 'dark-ixion-2' as const;
export const DARK_SHIVA_ID = 'dark-shiva' as const;
export const DARK_BAHAMUT_ID = 'dark-bahamut' as const;
export const DARK_ANIMA_ID = 'dark-anima' as const;

export type DarkSixKey = 'valefor' | 'ifrit' | 'ixion-1' | 'ixion-2' | 'shiva' | 'anima' | 'bahamut';

/** AI script ids (registered by `battle/ffx/ai/dark-aeons-six.ts`). Dark Ixion has two: the game's one monster file runs a different script in each of his two formations (RE six 4.3). */
export const DARK_SIX_SCRIPTS: Readonly<Record<DarkSixKey, string>> = {
  valefor: 'dark6-valefor',
  ifrit: 'dark6-ifrit',
  'ixion-1': 'dark6-ixion-1',
  'ixion-2': 'dark6-ixion-2',
  shiva: 'dark6-shiva',
  anima: 'dark6-anima',
  bahamut: 'dark6-bahamut',
};

/** One link of the chain: one of the game's seven formations. */
export interface DarkSixLink {
  readonly key: DarkSixKey;
  /** The stop on the road, 1 to 6 (Dark Ixion's two fights are both stop 3: the game makes you win both). */
  readonly stop: number;
  /** The link's place in the chain, 1 to 7. */
  readonly link: number;
  /** The game's formation file. */
  readonly file: string;
  /** The battle id (area key x 65,536 + 70 or 71): the scripts do not read it, the setup publishes it as a flag for the record. */
  readonly battleId: number;
  /** The battlefield (stage) id of the area table (RE six 2.1). */
  readonly stage: number;
  /** The launching event's battle flag word: bit 9 (0x200) is clear in all seven, so a defeat is a game over; 1280 has no victory pose (RE six 2.1). */
  readonly flagWord: number;
  /** The combatant on the field. */
  readonly bodyId: string;
  /** The group id (`../enemies/dark-aeons-six-groups.ts`). */
  readonly groupId: string;
  /** The plate this link is fought on: an existing backdrop standing in (pick DA10, provisional, Bailey's eyes). */
  readonly plate: string;
  /** The battle-start card's name for the foe. */
  readonly headline: string;
  /** The game's HP (RE six 1.2); for the second Ixion fight the record's maximum (the current HP is written 1,300,000, RE six 4.3). */
  readonly hp: number;
}

/** The plates the seven links are fought on (existing backdrops; all 2688 x 1536). */
export const DARK_SIX_PLATES = {
  valefor: 'mushroom-rock-road',
  ifrit: 'bikanel-desert-provisional',
  ixion: 'mushroom-rock-road-ruined',
  shiva: 'macalania-temple',
  anima: 'gagazet',
  bahamut: 'zanarkand-dome',
} as const;

/** The seven links in the chapter's order (pick DA2): Valefor, Ifrit, Ixion's two, Shiva, Anima, Bahamut. */
export const DARK_SIX_LINKS: readonly DarkSixLink[] = [
  { key: 'valefor', stop: 1, link: 1, file: 'bsil07_70', battleId: 0x00480046, stage: 1028, flagWord: 4096, bodyId: DARK_VALEFOR_ID, groupId: 'dark-aeons-valefor', plate: DARK_SIX_PLATES.valefor, headline: 'Dark Valefor', hp: 800_000 },
  { key: 'ifrit', stop: 2, link: 2, file: 'bika03_70', battleId: 0x01610046, stage: 1051, flagWord: 1280, bodyId: DARK_IFRIT_ID, groupId: 'dark-aeons-ifrit', plate: DARK_SIX_PLATES.ifrit, headline: 'Dark Ifrit', hp: 1_400_000 },
  { key: 'ixion-1', stop: 3, link: 3, file: 'kami03_70', battleId: 0x012f0046, stage: 1042, flagWord: 1280, bodyId: DARK_IXION_ID, groupId: 'dark-aeons-ixion-1', plate: DARK_SIX_PLATES.ixion, headline: 'Dark Ixion', hp: 1_200_000 },
  { key: 'ixion-2', stop: 3, link: 4, file: 'kami03_71', battleId: 0x012f0047, stage: 1042, flagWord: 1280, bodyId: DARK_IXION_2_ID, groupId: 'dark-aeons-ixion-2', plate: DARK_SIX_PLATES.ixion, headline: 'Dark Ixion, again', hp: 1_200_000 },
  { key: 'shiva', stop: 4, link: 5, file: 'mcyt00_70', battleId: 0x01540046, stage: 1046, flagWord: 1280, bodyId: DARK_SHIVA_ID, groupId: 'dark-aeons-shiva', plate: DARK_SIX_PLATES.shiva, headline: 'Dark Shiva', hp: 1_100_000 },
  { key: 'anima', stop: 5, link: 6, file: 'mtgz01_70', battleId: 0x01e60046, stage: 1068, flagWord: 0, bodyId: DARK_ANIMA_ID, groupId: 'dark-aeons-anima', plate: DARK_SIX_PLATES.anima, headline: 'Dark Anima', hp: 8_000_000 },
  { key: 'bahamut', stop: 6, link: 7, file: 'dome06_70', battleId: 0x02090046, stage: 521, flagWord: 1280, bodyId: DARK_BAHAMUT_ID, groupId: 'dark-aeons-bahamut', plate: DARK_SIX_PLATES.bahamut, headline: 'Dark Bahamut', hp: 4_000_000 },
] as const;

/** The first link's group (`Chapter.enemyGroupRef`). */
export const DARK_SIX_FIRST_GROUP = DARK_SIX_LINKS[0]!.groupId;

/** The link of a key. */
export const darkSixLink = (key: DarkSixKey): DarkSixLink => {
  const found = DARK_SIX_LINKS.find((l) => l.key === key);
  if (found === undefined) throw new Error(`dark-aeons-six-ids: no link '${key}'`);
  return found;
};

/** The second Dark Ixion fight's current HP, written by his formation's script over the record's maximum (RE six 4.3, `[bytes]`, unproved in play: live check L1). */
export const DARK_IXION_2_CURRENT_HP = 1_300_000;
/** The second Dark Ixion fight's stat writes (RE six 4.3): STR, DEF, MAG, MDEF. */
export const DARK_IXION_2_STATS = { str: 182, def: 222, mag: 146, mdef: 198 } as const;

/** Mid-battle script ids (the story script mirrors them; the story layer does not reach into the data layer): the first Overdrive of each foe, announced once. */
export const DARK_SIX_CALLOUT_OVERDRIVE = 'dark-six-overdrive' as const;
