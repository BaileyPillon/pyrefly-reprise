/**
 * The party at the top of Mt. Gagazet, the Chapter 3 mission "Battle Blockade" (the hidden chapter "Garik Ronso", `../../chapter-ffx2-garik-ronso.ts`): **the Djose preset, unmodified**. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **Pick GA3, the driver's, under Bailey's blanket yes of 2026-11-06** (the preflight's own recommendation, `docs/plans/ch-lionheart-review.md` section 4): the fight sits late in Chapter 3 (after the Trainer scene and Bevelle, before
 * Djose Temple), so the end-of-chapter preset is the nearest sourced build: Yuna Lv 32, Rikku Lv 33 and Paine Lv 34, Samurai and Lady Luck owned, the Chapter 3 bag (`./djose.ts`). **No source gives a level at the summit**
 * (`research/re-ffx2-garik-ronso.md` section 4), so the levels are an `[estimate]`; the alternatives, named and measured as what-ifs and not shipped, are the Chapter 2 preset carried forward (`./besaid.ts`, harder) and a Lv 40 variant
 * (easier). **The boss numbers are never tuned**: if a fight measures unwinnable or trivial, Bailey gets options with the numbers (`tests/unit/chapters/garik-ronso-bench.test.ts`, `docs/handoff/ch-garik-ronso.md`).
 *
 * Black Mage is owned and sits on the last node of Yuna's and Rikku's five-node rings, one Change from the dressphere they wear, so the Black Mage Garik hunts with Bane Lance is a choice the player can make (Water, Blizzard and
 * Thunder come from it). The preset's Dark Knights do not know Confuse (Demi is learned, Confuse is not), and the Gun Mage's Mighty Guard learning beat of the guides is out of scope (pick GA10).
 *
 * Confidence: no level at the summit is given by `research/re-ffx2-garik-ronso.md` §4, so the three levels are an [estimate]; the rings and the bag are the Djose build's own, [verified: 2 sources] there (`./djose.ts`).
 *
 * A deep copy, so no chapter's preset can mutate another's.
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';
import { djoseBuild } from './djose.ts';

export const garikRonsoBuild: FFX2PartyBuild = structuredClone(djoseBuild);

export default garikRonsoBuild;
