/**
 * The party of the hidden chapter "The Fiend Arena Superbosses" (Almighty Shinra, then the Major Numerus). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **LG3, the driver's pick under Bailey's delegation** (the paper preflight's own recommendation, `docs/plans/ch-fiend-superbosses-review.md` section 9; his to overturn): `viaInfinitoBuild` as it is, for both acts, and MEASURED
 * (the bench of stage 4; `docs/handoff/ch-fiend-superbosses.md`). The foes are Lv 99 and so is the party, so the chapter is an endgame check as the arena's own is; nothing is levelled up or down. Alternative: a stronger
 * kit as the shipped build, only if Bailey picks it from the options sheet. **Boss numbers are never tuned** (PRODUCT-BRIEF): the base party is expected to lose both acts, and that is a RESULT with numbers, not a reason to
 * touch a boss. Difficulty moves only through this preset, and only as a bench measures it.
 *
 * No source gives a party level or kit for the arena (`research/re-ffx2-fiend-arena-superbosses.md` section 8, U4). The build is Chapter XIII's Lv 99 three (Yuna and Paine Dark Knights, Rikku an Alchemist, Crystal Bangle and
 * Rabite's Foot on each, Paine on The End's grid, ten Megalixirs, Light and Lunar Curtains and Remedies, 200,000 gil, no Phoenix Downs), every dressphere owned for a Spherechange. **Paine starts without the Break Damage
 * Limit** (it sits behind The End's red and green gates): every blow of the girls is capped at 9,999 until she has walked the grid. The kit what-ifs (Miracle Drink needs Dark Matter, which this bag does not hold; Thunder-proof
 * gear; a Ribbon against Duo's statuses) are rigs the bench applies (stage 1 section 3 and stage 2 section 8 of the lane), never part of this preset.
 *
 * Confidence: [gap] no source gives a party for the arena's superbosses (`research/re-ffx2-fiend-arena-superbosses.md` §8, U4), so the choice is [derived] from the Lv 99 line of Chapter XIII, which is
 * [verified: 3 sources] (`./via-infinito.ts`).
 *
 * A deep copy, so no chapter's preset can mutate another's.
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';
import { viaInfinitoBuild } from './via-infinito.ts';

export const fiendSuperbossBuild: FFX2PartyBuild = structuredClone(viaInfinitoBuild);

export default fiendSuperbossBuild;
