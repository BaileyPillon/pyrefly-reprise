/**
 * The party of the hidden chapter "The Youth League Tournament" (Mushroom Rock Road, Chapter 5; seven fights in a row). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **YL2, the driver's pick under Bailey's blanket yes of 2026-11-06** (the paper preflight's own recommendation, `docs/plans/ch-youth-review.md` section 4): `farplaneBuild`, the Chapter V preset, **unmodified**: Yuna a White
 * Mage at Lv 46, Rikku a Dark Knight at Lv 48, Paine a Dark Knight at Lv 50, the Crystal Bangle on all three, Lady Luck on every grid and the bag of 40 Potions, 30 Hi-Potions, 20 X-Potions, 15 Mega-Potions, Elixirs, Turbo
 * Ethers, 25 Phoenix Downs, 15 Remedies, Curtains and Feathers (`./farplane.ts`). **No kit options** (no Hero Drinks, no level bonus): the Den of Woe's raises (`./den-of-woe.ts`) exist because its shades are Lv 52 to 63,
 * and the League's fighters are Lv 23 to 43.
 *
 * Why: it is the repo's one sourced Chapter 5 build point (the band 43 to 52, `research/ffx2-combat-core.md` section 5.1b; the three exact levels are `[estimate]`), the Den of Woe on the same road in the same chapter plays it,
 * and the sourced line (two Dark Knights and a healer) answers every act. **No source gives a player level for the tournament** (the game sets none; RE section 11 item 3), so the chapter is MEASURED, not tuned
 * (`tests/unit/chapters/youth-league-bench.test.ts`; `docs/handoff/ch-youth-league.md`): **boss numbers are never touched**, difficulty is the party's alone. Alternatives: a Lv 40/42/44 variant, or the Chapter 3 build
 * (`djoseBuild`), as measured what-ifs only.
 *
 * A deep copy, so no chapter's preset can mutate another's.
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';
import { farplaneBuild } from './farplane.ts';

export const youthLeagueBuild: FFX2PartyBuild = structuredClone(farplaneBuild);

export default youthLeagueBuild;
