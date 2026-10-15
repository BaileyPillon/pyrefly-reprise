/**
 * The party at Besaid Temple, the first mission of FFX-2 Chapter 3 (the hidden chapter "Valefor at Besaid", `../../chapter-ffx2-valefor-besaid.ts`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: dresspheres, Garment Grids, FFX-2 items.
 *
 * **No source gives the party's levels or loadout at Besaid.** The anchors (`docs/plans/ch-besaid-valefor-review.md` §2.8): Valefor is Lv 22 `[SinirothX]`; the Chapter 2 preset
 * (`./bevelle.ts`: Yuna 23, Rikku 24, Paine 25, from `research/ffx2-bahamut.md` §4.1's worked example) is the last sourced party; the Djose preset (`./djose.ts`, 32 / 33 / 34) is the end of
 * Chapter 3 and an estimate. "Protect Besaid Temple!" is one of the first two missions of Chapter 3 (Besaid and Kilika can be done in either order; Djose opens after both,
 * `research/ffx2-ixion-djose.md` §1.1), straight after Chapter 2, so **the Chapter 2 preset is carried forward unchanged**: the same girls, the same dresspheres (Yuna White Mage, Rikku
 * Dark Knight, Paine Warrior), the same grids, accessories and bag. `[estimate]`. That also means **no Samurai** (Kilika Temple, `[verified: 3 sources]`), **no Lady Luck** (the Luca Sphere Break
 * comes later in Chapter 3), no Berserker and no Trainer, which are Chapter 3 acquisitions `[verified: 2 sources]` that this mission does not wait for.
 *
 * It is a deep copy, so no chapter's preset can ever mutate another's. **Measured, not tuned** (`tests/unit/chapters/besaid-valefor-bench.test.ts`): if Bailey wants the fight easier or
 * harder the honest options are a measured round with different levels, never boss numbers (`boss-side-fix-needs-measured-options`).
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';
import { bevelleBuild } from './bevelle.ts';

/** The Chapter 2 preset, carried forward into the first Chapter 3 mission (a deep copy). */
export const besaidBuild: FFX2PartyBuild = structuredClone(bevelleBuild);

export default besaidBuild;
