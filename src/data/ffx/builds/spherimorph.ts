/**
 * The party for the hidden **Spherimorph** chapter (FFX only; `../../chapter-spherimorph.ts`; `docs/plans/ch-spherimorph-review.md` section 4): the Macalania Woods' party, which is the Macalania Temple's own preset
 * (`./macalania.ts`, one region later) with the Woods' differences taken out and the front line chosen for this fight. **Every number is that preset's `[estimate]`** (an authored story-progress snapshot over a sourced
 * build point, `research/ffx-seymour-anima-macalania.md` section 8); this file adds no stat, no ability, no item and no gauge, and **no boss number is touched** (the product brief's "mechanics never bend"). The preset
 * already carries every piece of the sourced answer: Yuna has the four Nul spells, Shell, Protect, Scan and Pray; Lulu Fire, Fira, Blizzard, Blizzara, Thunder, Thundara, Water, Watera and Focus; Auron the four Breaks,
 * Threaten and a Piercing katana; Kimahri a Piercing spear; Tidus Haste and Delay Attack.
 *
 * | Choice | Value | Source |
 * |---|---|---|
 * | Line-up | **Tidus, Yuna, Lulu** in front; Auron, Wakka, Kimahri and Rikku on the bench | the preflight's SP2: Tidus probes with a plain Attack, Lulu casts the opposite of the clue, Yuna heals and casts the Nuls; Auron's Armor Break and Magic Break are one Switch away. The game lets the player pick any three of the seven and Switch is not disabled. **A driver's call, his to overturn**; the alternative (the line of the 2026-09-26 Steam session, `research/observed-ffx-steam-2026-09-26.md`) is Tidus, Auron, Lulu, which the bench also runs (`activeSlots` and `reserve`, one line) |
 * | Aeons | **Valefor, Ifrit and Ixion** (Shiva is out) | the formation holds exactly three aeon entries (RE 2); Shiva comes at the temple after this fight, and the Temple's preset owns her. The preset's other three rows are unchanged |
 * | Auron's Overdrives | **Shooting Star is taken out** | the preset's own note ([verified: 2 sources], `./macalania-bench.ts`): defeating Spherimorph unlocks it; Dragon Fang and Banishing Blade stay |
 *
 * The other gaps are the preset's, named and not filled (rule 6): the exact bag, the Overdrive gauges on arrival and the armour abilities at this point. `[estimate]`, never tuned toward a result. The Temple's two gifts
 * (Tromell's Shell Targe on Rikku) are the Temple's, one region later; the preset keeps them and this file does not claim they are the Woods' (**flagged**).
 */

import type { FFXPartyBuild } from '../../../battle/common/types.ts';
import { macalaniaBuild } from './macalania.ts';

/** The three in front, in slot order. */
export const SPHERIMORPH_FRONT_LINE = ['tidus', 'yuna', 'lulu'] as const;

/** The other four, on the bench. */
export const SPHERIMORPH_BENCH = ['auron', 'wakka', 'kimahri', 'rikku'] as const;

/** The three aeons the formation has entries for (RE 2). */
export const SPHERIMORPH_AEONS = ['valefor', 'ifrit', 'ixion'] as const;

/** `macalaniaBuild` as the Woods have it: a deep copy (the chapter never writes into the Temple's preset), without Shiva, with Auron's Shooting Star not yet unlocked, with this fight's front line. */
function woodsBuild(): FFXPartyBuild {
  const build = structuredClone(macalaniaBuild);
  return {
    ...build,
    members: build.members.map((m) =>
      m.id === 'auron' ? { ...m, overdrive: { ...m.overdrive, unlockedOverdriveIds: m.overdrive.unlockedOverdriveIds.filter((id) => id !== 'shooting-star') } } : m,
    ),
    activeSlots: [...SPHERIMORPH_FRONT_LINE],
    reserve: [...SPHERIMORPH_BENCH],
    aeons: build.aeons.filter((a) => (SPHERIMORPH_AEONS as readonly string[]).includes(a.id)),
  };
}

export const spherimorphBuild: FFXPartyBuild = woodsBuild();

export default spherimorphBuild;
