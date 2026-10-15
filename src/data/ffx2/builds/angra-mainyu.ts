/**
 * The party at the Bikanel Desert, the mission "Showdown in the Sands" of FFX-2 Chapter 5 (the hidden chapter "Angra Mainyu", `../../chapter-ffx2-angra-mainyu.ts`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: dresspheres, Garment Grids, FFX-2 items.
 *
 * **No source gives the party's levels, dresspheres or bag at this mission** (`research/ffx2-angra-mainyu.md` §1 and §5; the RE note holds no party number either). The driver's rule (2026-10-14): never invent
 * levels or stats; use **the nearest existing FFX-2 chapter's preset in story order**, and say which. That is **the Experiment's** (the hidden chapter "The Experiment", the Chapter 5 mission at Djose Temple): Jegged's
 * Chapter 5 walkthrough runs Djose Temple, then the Bikanel Desert, then Bevelle (the page names "Previous: Djose Temple" and "Next: Bevelle"), and the Experiment's party is **the Chapter V preset**
 * (`./farplane.ts`: Yuna White Mage Lv 46, Rikku and Paine Dark Knight Lv 48 and 50; `src/data/chapter-ffx2-experiment.ts` `buildRef: farplaneBuild`; research `ffx2-experiment.md` §7: "the nearest in-repo build ... Do not
 * invent a separate level"). It is the same preset the Fallen Aeons, Trema and the Den of Woe use, and it sits inside the Chapter 5 level band (43 to 52, `research/ffx2-vegnagun-shuyin.md` §6) against Angra Mainyu's Lv 47.
 * Jegged's first answer to the fight is this preset's own line: one girl heals, the other two are Dark Knights whose Darkness reaches all three bodies. `[estimate]`: the levels are the preset's, not the mission's.
 *
 * It is a deep copy, so no chapter's preset can ever mutate another's. **Measured, not tuned** (`tests/unit/chapters/angra-mainyu-bench.test.ts`): if Bailey wants the fight easier or harder the honest options are a
 * measured round with different levels, never boss numbers (`boss-side-fix-needs-measured-options`).
 *
 * **Release candidate r49-rc ships the raise ON (+20: Lv 66 / 68 / 70), the driver's delegated pick** under Bailey's standing word to take all the recommendations (recorded as Bailey's item 78a, 2026-10-15). It is a
 * **party-side estimate; the boss rows are untouched; the Chapter V preset is one constant away** (`ANGRA_MAINYU_LEVEL_BONUS = 0`).
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';
import { farplaneBuild } from './farplane.ts';

/**
 * **The one option the measurements handed to Bailey: a raise of the preset's three levels, now ON at +20 (Lv 46 / 48 / 50 become 66 / 68 / 70).** At the sourced Chapter V preset as it stands the shipped advisor line
 * (`../../../engine/tactics/ffx2-angra-mainyu.ts`) wins **0 of 20 seeds** (0 of 240 fights over every pace and line the lane measured); the numbers by raise, with the action time on, 20 seeds each
 * (`tests/unit/chapters/angra-mainyu-bench.test.ts`, `docs/handoff/ch-angra-mainyu.md` §6): +10 wins 7 of 20, **+20 wins 18 of 20** (about 7 minutes), +30 wins 20 of 20 (about 5). No source gives a level for the mission (the
 * driver's rule, 2026-10-14: never invent levels), so this is an `[estimate]` and it is **party-side only: the boss rows are untouched**; it makes the fight winnable by the advisor's line. The girls' stats are a function
 * of dressphere and level only (`research/ffx2-combat-core.md` §5.1), so the raise changes nothing else; a level never goes above 99. **The Chapter V preset is one constant away**: set this to 0 and the party is the
 * sourced preset again (the bench measures its raises from `farplaneBuild`, so its table does not move).
 */
export const ANGRA_MAINYU_LEVEL_BONUS: number = 20;

/** The Chapter V preset (the Experiment's), carried into the Bikanel Desert mission (a deep copy), its three levels raised by {@link ANGRA_MAINYU_LEVEL_BONUS}. */
export const angraMainyuBuild: FFX2PartyBuild = structuredClone(farplaneBuild);
if (ANGRA_MAINYU_LEVEL_BONUS !== 0) for (const member of angraMainyuBuild.members) member.level = Math.min(99, member.level + ANGRA_MAINYU_LEVEL_BONUS);

export default angraMainyuBuild;
