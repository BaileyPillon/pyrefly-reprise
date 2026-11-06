/**
 * The party of the hidden chapter "The Farplane Cup" (the Fiend Arena's duels: Auron, Tidus and Seymour). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **DU4, the driver's pick under Bailey's blanket yes of 2026-11-06** (the paper preflight's own recommendation, `docs/plans/ch-duelist-review.md`): `viaInfinitoBuild` as it is, for all three duels, and MEASURED
 * (`tests/unit/chapters/farplane-cup-bench.test.ts`; `docs/handoff/ch-farplane-cup.md`). The duelists are Lv 67 to 74 and the party is Chapter XIII's Lv 99 three, so the cup is an endgame check as the game's own is;
 * nothing is levelled up or down. Alternative: a lower-level build (no source gives one). **Boss numbers are never tuned** (PRODUCT-BRIEF): if a duel measures unwinnable or trivial, Bailey gets options with the numbers.
 *
 * No source gives a party level or kit for the cup (`research/re-ffx2-farplane-cup.md` §10 Q2). The build is Chapter XIII's Lv 99 three (Yuna and Paine Dark Knights, Rikku an Alchemist, Crystal Bangle and Rabite's Foot
 * on each, Paine on The End's grid, ten Megalixirs, Light and Lunar Curtains and Remedies, 200,000 gil, no Phoenix Downs), every dressphere owned for a Spherechange. **Paine starts without the Break Damage Limit** (it sits
 * behind The End's red and green gates, as in the Fallen Maesters): every blow of the girls is capped at 9,999 until she has walked the grid.
 *
 * Confidence: [gap] no source gives a party for the cup (`research/re-ffx2-farplane-cup.md` §10 Q2), so the choice is [derived] from the Lv 99 line of Chapter XIII, which is [verified: 3 sources] (`./via-infinito.ts`).
 *
 * A deep copy, so no chapter's preset can mutate another's.
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';
import { viaInfinitoBuild } from './via-infinito.ts';

export const farplaneCupBuild: FFX2PartyBuild = structuredClone(viaInfinitoBuild);

export default farplaneCupBuild;
