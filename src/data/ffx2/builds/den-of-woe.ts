/**
 * Chapter XV (the Den of Woe): the party it fights with, **the Chapter V preset with both kit
 * options ON** (`docs/plans/den-of-woe-options-2026-09-25.md`, "Bailey's pick, 2026-09-26").
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: the Chapter V preset, FFX-2 items.
 *
 * Bailey first picked GP5 a and GP6 a (`docs/plans/chapter-gippal-review.md`, D-148): the Chapter V
 * preset and bag as they stand (`./farplane.ts`). The ship check measured that no human wins the Den
 * that way (0 of 200 first tries), and on **2026-09-26** Bailey picked the options sheet's
 * recommendation, "Den: both, drop the prep" ("I pick your recommendation for Den of Woe"): GP6 b and
 * GP5 b below, both ON; the Lightfall prep dropped (`../../guides/ffx2-den-of-woe.ts`); the retry
 * from Baralai kept (`../enemies/den-of-woe.ts`). `farplaneBuild` itself is untouched: the kit is a
 * copy with the two options laid on. The numbers are in the sheet and `docs/plans/den-of-woe-bench.md`.
 *
 * - **GP6 b, Hero Drinks** ({@link DEN_OF_WOE_HERO_DRINKS}): Invincible through Lightfall is the
 *   sources' answer to it (research `ffx2-gippal-den-of-woe.md` §5, wiki and GamerGuides, who reach
 *   it by a Dark Matter mix; this preset has no Alchemist). A Hero Drink grants the same status to
 *   one girl (`../items/effects-status.ts`, 10.6 s). The **count is an `[estimate]`**: no source gives
 *   a bag for the Den.
 * - **GP5 b, levels** ({@link DEN_OF_WOE_LEVEL_BONUS}): the preset's 46 / 48 / 50 raised toward the
 *   shades' 52-63. **No source gives a player level for the Den** (research §5, G-12): the size of
 *   the raise is an `[estimate]` in Bailey's name.
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';
import { farplaneBuild } from './farplane.ts';

/** GP6 b's count, `[estimate]` (the bench's what-if rows measure 3). */
export const DEN_OF_WOE_HERO_DRINKS_OPTION = 3;
/** GP5 b's raise, `[estimate]` (54 / 56 / 58, the bench's what-if rows). */
export const DEN_OF_WOE_LEVEL_BONUS_OPTION = 8;

/**
 * **GP6 b, ON: 3 Hero Drinks in the bag** `[estimate]` (the count; no source gives a bag for the Den).
 * Bailey's pick, 2026-09-26 ("I pick your recommendation for Den of Woe" = "Den: both, drop the
 * prep"). `0` would be GP6 a, the Chapter V bag alone. Change only on Bailey's word.
 */
export const DEN_OF_WOE_HERO_DRINKS: number = DEN_OF_WOE_HERO_DRINKS_OPTION;

/**
 * **GP5 b, ON: 8 levels added to each girl, 54 / 56 / 58** `[estimate]`, in Bailey's name (no source
 * gives a player level for the Den, research §5, G-12). Bailey's pick, 2026-09-26, with GP6 b above.
 * `0` would be GP5 a, the preset's 46 / 48 / 50. Change only on Bailey's word.
 */
export const DEN_OF_WOE_LEVEL_BONUS: number = DEN_OF_WOE_LEVEL_BONUS_OPTION;

/** `party` with `count` Hero Drinks added to its bag (GP6 b as numbers). */
export function withHeroDrinks(party: FFX2PartyBuild, count: number): FFX2PartyBuild {
  return { ...party, inventory: [...party.inventory, { itemId: 'x2-hero-drink', count }] };
}

/** `party` with every girl `bonus` levels higher (GP5 b as numbers). */
export function withLevelBonus(party: FFX2PartyBuild, bonus: number): FFX2PartyBuild {
  return { ...party, members: party.members.map((m) => ({ ...m, level: m.level + bonus })) as FFX2PartyBuild['members'] };
}

/** The Den's kit for a given pair of options; at `0, 0` it returns `farplaneBuild` itself. */
export function denOfWoeBuild(heroDrinks: number, levelBonus: number): FFX2PartyBuild {
  let party = farplaneBuild;
  if (levelBonus > 0) party = withLevelBonus(party, levelBonus);
  if (heroDrinks > 0) party = withHeroDrinks(party, heroDrinks);
  return party;
}

/** The kit Chapter XV ships with, from the two switches (Bailey's pick: 3 Hero Drinks, +8 levels). */
export const denOfWoeKit: FFX2PartyBuild = denOfWoeBuild(DEN_OF_WOE_HERO_DRINKS, DEN_OF_WOE_LEVEL_BONUS);
