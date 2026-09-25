/**
 * Chapter XV (the Den of Woe): the party it fights with, and **two options for Bailey, built and
 * OFF** (`docs/plans/den-of-woe-options-2026-09-25.md`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: the Chapter V preset, FFX-2 items.
 *
 * Bailey picked **GP5 a** and **GP6 a** (`docs/plans/chapter-gippal-review.md`, D-148): the Chapter V
 * preset and bag as they stand (`./farplane.ts`). With both switches at 0 the kit **is**
 * `farplaneBuild`, the same object, so the chapter is unchanged. The numbers behind each option are
 * `docs/plans/den-of-woe-bench.md`; never flip one without Bailey's word.
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
 * **GP6, OFF: Hero Drinks in the bag.** `0` is Bailey's pick (GP6 a). Option b is
 * {@link DEN_OF_WOE_HERO_DRINKS_OPTION}. Change only on Bailey's word.
 */
export const DEN_OF_WOE_HERO_DRINKS: number = 0;

/**
 * **GP5, OFF: levels added to each girl.** `0` is Bailey's pick (GP5 a). Option b is
 * {@link DEN_OF_WOE_LEVEL_BONUS_OPTION}. Change only on Bailey's word.
 */
export const DEN_OF_WOE_LEVEL_BONUS: number = 0;

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

/** The kit Chapter XV ships with, from the two switches (today: `farplaneBuild`). */
export const denOfWoeKit: FFX2PartyBuild = denOfWoeBuild(DEN_OF_WOE_HERO_DRINKS, DEN_OF_WOE_LEVEL_BONUS);
