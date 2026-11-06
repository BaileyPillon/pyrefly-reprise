/**
 * The party of the hidden chapter "The Guardians of the Bevelle Underground" (Georapella and the Precepts Guard on floor 3, Baralai on floor 7). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **BG2, the driver's pick under Bailey's blanket yes of 2026-11-06** (the paper preflight's own recommendation, `docs/plans/ch-drillshot-review.md`): `bevelleBuild` as it is, for all three links, and MEASURED
 * (`tests/unit/chapters/bevelle-guardians-bench.test.ts`; `docs/handoff/ch-bevelle-guardians.md`). It is the sourced Chapter 2 build point of the Bahamut fight at the bottom of this dungeon (Yuna 23 White Mage, Rikku 24
 * Dark Knight, Paine 25 Warrior; accessories, Garment Grids, learned abilities and the `[estimate]` bag, `./bevelle.ts`). Floors 3 and 7 come earlier in the same dungeon, so the levels there may be a few lower in
 * the game (RE §10.2); a lower-level variant is **not built** (rule 6: no source gives one). Alternative: that variant. **Boss numbers are never tuned** (PRODUCT-BRIEF): if a link measures unwinnable or trivial, Bailey gets
 * options with the numbers.
 *
 * Holy is the first two guardians' weakness and no member's kit gives it; nothing is added (rule 6).
 *
 * A deep copy, so no chapter's preset can mutate another's, and the Bahamut chapter's build is untouched.
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';
import { bevelleBuild } from './bevelle.ts';

export const bevelleGuardiansBuild: FFX2PartyBuild = structuredClone(bevelleBuild);

export default bevelleGuardiansBuild;
