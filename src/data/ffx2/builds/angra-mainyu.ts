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
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';
import { farplaneBuild } from './farplane.ts';

/** The Chapter V preset (the Experiment's), carried into the Bikanel Desert mission (a deep copy). */
export const angraMainyuBuild: FFX2PartyBuild = structuredClone(farplaneBuild);

export default angraMainyuBuild;
