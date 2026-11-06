/**
 * The party of the hidden chapter "Yuna's Ballad" (the possessed Rikku and the possessed Paine of the Den of Woe): **Yuna alone**. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **YB3 (a), the driver's pick under Bailey's blanket yes of 2026-11-06** (the preflight's own recommendation, `docs/plans/ch-wraith-review.md`): Yuna as the Den of Woe's kit has her (`./den-of-woe.ts`, `denOfWoeKit`: the
 * Chapter V preset with both kit options on, so level 54, a White Mage on Tempered Will with Gun Mage's Mighty Guard and White Wind, Crystal Bangle and Mystery Veil, and the Den's bag with 3 Hero Drinks). Alternative: a
 * Level-99 Yuna (no source). **No source gives the player's level or bag for the duels** (`research/ffx2-gippal-den-of-woe.md` G-12; `research/re-ffx2-yunas-ballad.md` §9.3), so the build is the Den's own,
 * flagged `[estimate]`, and **the boss numbers are never tuned**: if a duel measures unwinnable or trivial, Bailey gets options with the numbers (`tests/unit/chapters/yunas-ballad-bench.test.ts`, `docs/handoff/ch-yunas-ballad.md`).
 *
 * **A party of one** (YB4 (a)): `FFX2PartyBuild.members` may hold one or two girls since 2026-11-06 (`battle/common/types.ts`, `docs/CONTRACT-CHANGES.md`); the engine builds the line-up from this list's length.
 * Wiki-level, three sources (the wiki, GamerGuides, Split_Infinity): Yuna fights Rikku and Paine alone, and the girls join her for the last three of the five. **No file shows the party size** (the scene position files
 * are empty; `research/re-ffx2-yunas-ballad.md` section 10.1).
 *
 * A deep copy, so no chapter's preset can mutate another's.
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';
import { denOfWoeKit } from './den-of-woe.ts';

const fullKit = structuredClone(denOfWoeKit);

export const yunasBalladBuild: FFX2PartyBuild = { ...fullKit, members: [fullKit.members[0]] };

export default yunasBalladBuild;
