/**
 * The party at Kilika Temple, the second mission of FFX-2 Chapter 3 ("Pest Control"; the hidden chapter "Ifrit at Kilika Temple", `../../chapter-ffx2-ifrit-kilika.ts`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: dresspheres, Garment Grids, FFX-2 items.
 *
 * **No source gives the party's levels or loadout at Kilika.** The anchors (`docs/plans/ch-ifrit-review.md` §4): Ifrit is Lv 23 `[row 165, SinirothX]`; the Chapter 2 preset (`./bevelle.ts`: Yuna 23, Rikku 24, Paine 25, from
 * `research/ffx2-bahamut.md` §4.1's worked example) is the last sourced party; the Djose preset (`./djose.ts`, 32 / 33 / 34) is the end of Chapter 3 and an estimate. "Pest Control" is one of the first two missions of Chapter 3
 * (Besaid and Kilika can be done in either order; Djose opens after both, `research/ffx2-ixion-djose.md` §1.1), straight after Chapter 2, so, as at Besaid (`./besaid.ts`, the twin), **the Chapter 2 preset is carried forward**:
 * the same girls at the same levels, the same worn dresspheres (Yuna White Mage, Rikku Dark Knight, Paine Warrior), the same grids, accessories and bag. `[estimate]`.
 *
 * **One addition, and it is sourced: the Samurai dressphere is owned.** It is found in the temple on the way to him (`research/ffx2-fallen-aeons.md` §7.1, `[verified: 2 sources: GamerGuides, wiki Dressphere]`; the Chapter 3
 * guides, `[verified: 3 sources]`, `./djose.ts` lists it as owned by the end of the chapter). It is **owned and not worn**: it sits after Alchemist in each girl's list, past the end of every ring, so it adds no node and the
 * Chapter 2 grids are untouched; what a girl would do in it is a what-if, measured and not shipped (`tests/unit/helpers/ifritKilikaDrive.ts`, `tests/unit/chapters/ifrit-kilika-bench.test.ts`). Still no Lady Luck (the Luca Sphere
 * Break comes later in Chapter 3), no Berserker and no Trainer.
 *
 * It is a deep copy, so no chapter's preset can ever mutate another's. **Measured, not tuned**: if Bailey wants the fight easier or harder the honest options are a measured round with different levels, never boss numbers
 * (`boss-side-fix-needs-measured-options`).
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';
import { besaidBuild } from './besaid.ts';

/** The Chapter 2 preset carried forward into the second Chapter 3 mission, with the Samurai dressphere owned (a deep copy). */
export const kilikaBuild: FFX2PartyBuild = structuredClone(besaidBuild);

for (const member of kilikaBuild.members) {
  const at = member.owned.indexOf('alchemist');
  member.owned.splice(at < 0 ? member.owned.length : at + 1, 0, 'samurai');
}

export default kilikaBuild;
