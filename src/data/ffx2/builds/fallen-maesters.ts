/**
 * The party of the hidden chapter "The Fallen Maesters" (the Via Infinito floors 20, 40, 60 and 80). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **FM3 (a), the driver's pick under Bailey's blanket yes of 2026-11-02** (the preflight's own recommendation): `viaInfinitoBuild` as it is, for all four links, and MEASURED (`tests/unit/chapters/fallen-maesters-bench.test.ts`;
 * `docs/handoff/ch-maesters.md`). Alternatives: (b) the shipped Trema kit (`./via-infinito-kit.ts`: Defense Bracers, Adamantite, Valiant Lustre ..., which answers *Trema*, not these four, and uses one-copy gear a
 * player may not have at floor 20), (c) a per-link `[estimate]` band. **Boss numbers are never tuned** (PRODUCT-BRIEF): if a link measures unwinnable or trivial, Bailey gets options with the numbers.
 *
 * No source gives a party level or kit for floors 20, 40, 60 and 80 (`research/re-ffx2-fallen-maesters.md` §12 Q13; the RE session's live saves are Lv 99 at Bevelle - Via Infinito, 103:43). The build is Chapter XIII's
 * Lv 99 three (Yuna and Paine Dark Knights, Rikku an Alchemist, Crystal Bangle and Rabite's Foot on each, Paine in The End's Break Damage Limit, ten Megalixirs, Light and Lunar Curtains and Remedies, 200,000 gil, no Phoenix
 * Downs), so Paine's hit can reach the shell-breaking size at floor 60 and every dressphere is owned for a Spherechange.
 *
 * A deep copy, so no chapter's preset can mutate another's.
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';
import { viaInfinitoBuild } from './via-infinito.ts';

export const fallenMaestersBuild: FFX2PartyBuild = structuredClone(viaInfinitoBuild);

export default fallenMaestersBuild;
