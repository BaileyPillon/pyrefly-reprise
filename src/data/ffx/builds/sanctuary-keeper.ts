/**
 * The party for the hidden **Sanctuary Keeper** chapter (FFX only; `../../chapter-sanctuary-keeper.ts`; `docs/plans/ch-beast-review.md` section 4): the Mt. Gagazet summit's party, which is Chapter I's own preset
 * (`./gagazet.ts`) with the front line chosen for this fight. **Every number is that preset's `[estimate]`** (an authored story-progress snapshot over a sourced build point, `research/ffx-seymour-flux.md` section 7); this file
 * adds no stat, no ability, no item and no gauge, and **no boss number is touched** (the product brief's "mechanics never bend"). The preset already carries every piece of the sourced answer: Yuna has Esuna, Shell, Protect,
 * Reflect and Dispel; Tidus Haste, Hastega, Slow and Delay Attack and Buster; Auron the four Breaks; Lulu Bio and Focus; the bag holds Poison Fang x5, Holy Water x7, Remedy x3, Phoenix Downs and Elixirs.
 *
 * | Choice | Value | Source |
 * |---|---|---|
 * | Line-up | **Tidus, Yuna, Auron** in front; Lulu, Wakka, Kimahri and Rikku on the bench | the three the sources need first: Hastega (Tidus), Reflect, Protect and Shell (Yuna), the Breaks (Auron); Bio is Lulu's or the bag's Poison Fang (Tidus throws it). The game lets the player pick any three of the seven and Switch is not disabled. **A driver's call, his to overturn, taken by the bench**: the preflight recommended Tidus, Yuna, Lulu (SK2) and said the bench would run both and report; the advisor's line wins 138 of 200 seeds in front with Auron (69 percent, inside the preflight's 60 to 80 band) and 39 of 200 with Lulu (19.5 percent), so the shipped front line is Auron's (`docs/handoff/ch-sanctuary-keeper.md`, section 5). The alternative is `activeSlots` and `reserve` changed in one line |
 * | Everything else | Chapter I's preset as is | preflight SK3. Not in the cells' armour: Confuse Ward (the guides' advice against Photon Wings' Confuse), a lever named for the bench and **not applied** |
 *
 * The preset's aeons are the five story aeons at the Gagazet point; the Keeper's Summon is not disabled, so one can take the first Photon Wings (the guides' advice).
 */

import type { FFXPartyBuild } from '../../../battle/common/types.ts';
import { gagazetBuild } from './gagazet.ts';

/** The three in front, in slot order. */
export const SANCTUARY_KEEPER_FRONT_LINE = ['tidus', 'yuna', 'auron'] as const;

/** The other four, on the bench. */
export const SANCTUARY_KEEPER_BENCH = ['lulu', 'wakka', 'kimahri', 'rikku'] as const;

/** `gagazetBuild` with this fight's front line. A deep copy: the chapter never writes into Chapter I's preset. */
export const sanctuaryKeeperBuild: FFXPartyBuild = {
  ...structuredClone(gagazetBuild),
  activeSlots: [...SANCTUARY_KEEPER_FRONT_LINE],
  reserve: [...SANCTUARY_KEEPER_BENCH],
};

export default sanctuaryKeeperBuild;
