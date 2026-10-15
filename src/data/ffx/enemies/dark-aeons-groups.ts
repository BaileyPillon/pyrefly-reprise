/**
 * The Dark Aeons' formations (FFX only; the hidden Mirror Aeons chapter): **all eleven of the game's own** (`research/re-ffx-yojimbo-sisters-feasibility.md` section 3, "RE section 3", `[bytes]`), built from the two tables in
 * `../mirror-aeons-ids.ts`: the six formations of the Dark Magus Sisters (`kino00_70` to `kino05_71`) and the five tiers of Dark Yojimbo (`nagi05_70` to `nagi05_74`). The chapter fights two of them, one per act
 * (`MIRROR_ACT_I`, `MIRROR_ACT_II`, an `[estimate]` pending the bench); the rest are registered so the bench can measure every rung of each ladder by its group id (`sistersGroupId`, `yojimboGroupId`).
 *
 * ## What each group carries, and from where
 *
 * - **Sisters:** the monsters in the file's slot order (slot 0 is battle actor 20: Mindy, Sandy, Cindy in the trio; RE section 3), **Escape and Flee off** (the formation script disables both for everyone: RE section 3),
 *   the music, `nextGroupId` to Act II's group (the chain: no menu between the acts), and the `headline` the battle-start card names when the first monster would misname the fight. The start gauge of each formation
 *   (100 for every sister in the trio, RE section 4.2) is in the formation table; `battle/ffx/ai/dark-aeons-setup.ts` writes it at the battle's start.
 * - **Dark Yojimbo:** him at slot 0 and the dog at slot 1 (the Sinscale stand-in, RE section 3), Escape and Flee off, the Cavern plate (`plate`), and no `nextGroupId` (the chapter ends with his fall). The five tiers
 *   differ only in the gauge each of his turns adds (RE section 4.1), which is the AI's, and in the stage id, which is the game's choice of arena and not modelled.
 * - **The launch flag words** (0x1800 and 0x1000 for the Sisters, 0x1500 for Yojimbo: a defeat is a game over in every one) and the start positions are in the note; the battle's loss rule is the engine's ordinary one.
 *
 * **Music: no source names these fights' cues** (`docs/audio/THEMES.md` is silent). Existing cues by reference, Bailey's ear decides (rule 13): `boss-challenge` (the game's one generic boss track, our original take)
 * for the Sisters, `boss-yojimbo` ("The Summoner's Sorrow", Yojimbo's own, Chapter IX's) for Dark Yojimbo.
 */

import type { EnemyGroupDef } from '../../../battle/common/types.ts';
import {
  DARK_CINDY_ID, DARK_YOJIMBO_ID, MIRROR_ACT_II_GROUP, MIRROR_ACT_II_PLATE, SISTER_FORMATIONS, YOJIMBO_TIERS, sistersGroupId, yojimboGroupId, type SisterFormation, type YojimboTier,
} from '../mirror-aeons-ids.ts';
import { DARK_AEONS_ABILITIES } from './dark-aeons-abilities.ts';
import { darkDaigoro, darkSister, darkYojimbo } from './dark-aeons.ts';

export { DARK_AEONS_ABILITIES };

const HEADLINES: Readonly<Record<number, string>> = { 3: 'The Dark Magus Sisters', 2: 'Dark Sandy and Dark Mindy' };

/** One Sisters formation as a group; it chains on to Act II, the way the chapter plays it. */
export function darkSistersGroup(formation: SisterFormation): EnemyGroupDef {
  const headline = HEADLINES[formation.sisters.length];
  return {
    id: sistersGroupId(formation.file),
    game: 'ffx',
    canEscape: false, // the formation script disables Escape and Flee for everyone (RE section 3)
    enemies: formation.sisters.map((name, slot) => darkSister(name, slot)),
    ...(formation.sisters.length === 3 ? { bossId: DARK_CINDY_ID } : {}),
    ...(headline !== undefined ? { headline } : {}),
    nextGroupId: MIRROR_ACT_II_GROUP,
    musicCues: [{ at: 'start', track: 'boss-challenge', fadeMs: 1200 }],
  };
}

/** One tier of Dark Yojimbo as a group, on the Cavern's plate. */
export function darkYojimboGroup(tier: YojimboTier): EnemyGroupDef {
  return {
    id: yojimboGroupId(tier.file),
    game: 'ffx',
    canEscape: false, // the formation script disables Escape and Flee for everyone (RE section 3)
    enemies: [darkYojimbo(), darkDaigoro()],
    bossId: DARK_YOJIMBO_ID,
    headline: 'Dark Yojimbo',
    plate: MIRROR_ACT_II_PLATE,
    // Act II is a retry checkpoint (a defeat in the cavern retries the cavern, not the sisters: the game lets the player heal at the Save Sphere between its five tiers, Jegged Yojimbo), and it is
    // the last link, so it pays both acts' spoils in one results screen (the Gui and Sin chains' flags; CONTRACT-CHANGES).
    checkpointOnEntry: true,
    poolsChainSpoils: true,
    musicCues: [{ at: 'start', track: 'boss-yojimbo', fadeMs: 1200 }],
  };
}

/** Every formation of both ladders, six Sisters groups and five Yojimbo tiers, for the data index (the groups are looked up by id: `nextGroupId`, the bench). */
export const DARK_AEONS_GROUPS: readonly EnemyGroupDef[] = [...SISTER_FORMATIONS.map(darkSistersGroup), ...YOJIMBO_TIERS.map(darkYojimboGroup)];

/** The group of one formation file (`'kino00_70'`, `'nagi05_72'`). Throws on an unknown file name so a typo cannot pass silently. */
export function darkAeonsGroupOf(file: string): EnemyGroupDef {
  const found = DARK_AEONS_GROUPS.find((g) => g.id === sistersGroupId(file) || g.id === yojimboGroupId(file));
  if (found === undefined) throw new Error(`dark-aeons-groups: no formation '${file}'`);
  return found;
}
