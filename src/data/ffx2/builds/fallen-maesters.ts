/**
 * The party of the hidden chapter "The Fallen Maesters" (the Via Infinito floors 20, 40, 60 and 80). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **FM3 (a), the driver's pick under Bailey's blanket yes of 2026-11-02** (the preflight's own recommendation): `viaInfinitoBuild` as it is, for all four links, and MEASURED (`tests/unit/chapters/fallen-maesters-bench.test.ts`;
 * `docs/handoff/ch-maesters.md`). Alternatives: (b) the shipped Trema kit (`./via-infinito-kit.ts`: Defense Bracers, Adamantite, Valiant Lustre ..., which answers *Trema*, not these four, and uses one-copy gear a
 * player may not have at floor 20), (c) a per-link `[estimate]` band. **Boss numbers are never tuned** (PRODUCT-BRIEF): if a link measures unwinnable or trivial, Bailey gets options with the numbers.
 *
 * No source gives a party level or kit for floors 20, 40, 60 and 80 (`research/re-ffx2-fallen-maesters.md` §12 Q13; the RE session's live saves are Lv 99 at Bevelle - Via Infinito, 103:43). The build is Chapter XIII's
 * Lv 99 three (Yuna and Paine Dark Knights, Rikku an Alchemist, Crystal Bangle and Rabite's Foot on each, Paine on The End's grid, ten Megalixirs, Light and Lunar Curtains and Remedies, 200,000 gil, no Phoenix
 * Downs), and every dressphere is owned for a Spherechange.
 *
 * **Paine starts WITHOUT the Break Damage Limit.** It sits behind The End's red and green gates (`garment-grids.ts`) and the build starts with none passed (Chapter XIII's party is the same). Floor 60 (Concherer)
 * needs ONE result of 10,000 or more (about 20,000 before Protect and Shell), so the floor is won by the walk a player takes: Paine spends her first four turns on Changes across the two gates and back to the Dark Knight
 * (the menu's own rows; `tests/unit/helpers/fallenMaestersWalk.ts`), then casts Charon. Measured over 30 seeds (`fallen-maesters-bench.test.ts`, `PYREFLY_BENCH_SEEDS=30`): the `walk` line wins floor 60 on 19 and breaks the shell in 25,
 * against 2 wins for a Darkness line that never walks and 0 for a Charon that never walks. Seeding the gates (`passedGates: ['red', 'green']` on Paine) would win about 19 in 20 and is the alternative if Bailey wants the floor
 * easier; it is not done (a boss is never tuned, and neither is the kit to fit it).
 * Floor 80 (Chac) is not won by any line measured, this walk and a Gunner chain included (0 in 30 each; the handoff, section 6): the sourced answers (a chain or a delay-lock from the first second) need a kit and an initiative
 * this build does not give, so it stays a hard optional fight and Bailey's call.
 *
 * A deep copy, so no chapter's preset can mutate another's.
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';
import { viaInfinitoBuild } from './via-infinito.ts';

export const fallenMaestersBuild: FFX2PartyBuild = structuredClone(viaInfinitoBuild);

export default fallenMaestersBuild;
