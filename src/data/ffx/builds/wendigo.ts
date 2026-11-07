/**
 * The party for the hidden **Wendigo** chapter (FFX only; `../../chapter-wendigo.ts`; `docs/plans/ch-wendigo-review.md` sections 5 and 10, CW3 and CW4): the repo's **Macalania preset** (`./macalania.ts`, the Temple's party,
 * a few chase battles before this fight), with Shiva in the roster and her gauge at 0 as that preset says. **Every number is that preset's `[estimate]`** (an authored story-progress snapshot over a sourced build point,
 * `research/ffx-seymour-anima-macalania.md` section 8); this file adds no stat, no ability, no item and no gauge, and **no boss number is touched** (the product brief's "mechanics never bend"). The preset already carries
 * every piece of the sourced answer: Rikku's Steal, Use and Mix; Auron's Power, Armor and Magic Break and Threaten; Wakka's Dark Attack and Silence Attack; Yuna's Esuna, Protect, Shell and Life; Tidus's Haste and Provoke;
 * Lulu's Fire and Fira; Kimahri's Stone Breath; Ixion's Aerospark; the bag (30 Potions, 10 Hi-Potions, 17 Phoenix Downs, 4 Petrify Grenades, 10 Eye Drops, 3 Remedies). **No Dispel** (Yuna), as at the Temple.
 *
 * | Choice | Value | Source |
 * |---|---|---|
 * | Line-up | **Tidus, Yuna, Rikku** in front (the preset's own `activeSlots`); Wakka, Auron, Lulu and Kimahri on the bench | CW3, the driver's pick (his to overturn): Rikku steals both Guardians in her first turns, Yuna carries Protect and Esuna and the aeons, Tidus Hastes; Auron's Power Break and Wakka's Dark Attack are one Switch away. The game lets the player pick any three of the seven and Switch is not disabled. The alternative is Tidus, Auron, Rikku (the Power Break line): `activeSlots` and `reserve` changed in one line, and the bench (`tests/unit/chapters/wendigo-bench.test.ts`) runs both |
 * | Everything else | the Macalania preset as is | CW4 |
 *
 * The preset's four aeons are Valefor, Ifrit, Ixion and Shiva; the formation does not disable Summon, and an aeon on the field silences Wendigo's counter, so a summoned aeon is the way to hit it while its arms are up.
 */

import type { FFXPartyBuild } from '../../../battle/common/types.ts';
import { macalaniaBuild } from './macalania.ts';

/** The three in front, in slot order (the Macalania preset's own). */
export const WENDIGO_FRONT_LINE = ['tidus', 'yuna', 'rikku'] as const;

/** The other four, on the bench (the Macalania preset's own order). */
export const WENDIGO_BENCH = ['wakka', 'auron', 'lulu', 'kimahri'] as const;

/** `macalaniaBuild` with this fight's front line. A deep copy: the chapter never writes into Chapter VII's preset. */
export const wendigoBuild: FFXPartyBuild = {
  ...structuredClone(macalaniaBuild),
  activeSlots: [...WENDIGO_FRONT_LINE],
  reserve: [...WENDIGO_BENCH],
};

export default wendigoBuild;
