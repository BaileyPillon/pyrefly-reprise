import type { SceneBuild, SceneFactory } from './types.ts';
import type { SceneSlots } from './index.ts';
import { VIA_PURIFICO_SLOTS, viaPurificoOnPlate } from './via-purifico.ts';
import { EVRAE_ALTANA_ID, FLOODED_PLATE, FLOODED_PLATES, GATE_LOCK_IDS, GEOSGAENO_ID } from '../data/ffx/flooded-ways-ids.ts';

// ---------------------------------------------------------------------------
// The Flooded Ways (FFX) — the hidden chapter's one stage: the Via Purifico's stage on four plates of its own
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. `docs/plans/ch-geosgaeno-review.md` picks GV1, GV12 and section 5 (the arena options). Built 2026-11-06.
//
// ONE STAGE, FOUR PLATES. The chapter is a chain of four fights (the Via Purifico's three areas, then the Baaj Temple) and a chain keeps one scene: this scene IS the Via Purifico scene (`./via-purifico.ts`: its rigs,
// palette, lights and the party's three slots) with this chapter's enemy staging, opening on the first area's plate. **The plates are the r76b art install's** (`docs/handoff/r76b-art-install.md`): three water variants of
// Isaaru's red-lit chamber (a thin sheet on the floor, a water line at the knee, submerged) and the Baaj Temple's own (pale stone, green light), each `EnemyGroupDef.plate` of its link and swapped in by
// `SceneBuild.swapBackdrop` under a white pulse at the seam, as the Dark Aeons' are. The water battle is a rule (the Petrify shatter, `EnemyGroupDef.inWater`), not a look.
//
// THE STAGING IS AN ESTIMATE for the framing: the party stands on the Via Purifico's party slots (three of them: the whole party); Evrae Altana and Geosgaeno stand on the boss spot Isaaru's room gives its one foe; the two
// Gate Locks stand behind it on either side (the formation files give start positions in another coordinate system: RE 2.4). Heights are read off the airship Evrae's painting and guessed for the rest, `[estimate]`.

/** Where the foes stand, by combatant id (the room's boss spot, then the locks at the foot of the hall). */
export const FLOODED_WAYS_SPOTS: Readonly<Record<string, [number, number, number]>> = {
  [EVRAE_ALTANA_ID]: [3.7, 0, -0.6],
  [GEOSGAENO_ID]: [3.7, 0, -0.6],
  [GATE_LOCK_IDS[0]]: [1.2, 0, -3.4],
  [GATE_LOCK_IDS[1]]: [5.4, 0, -5.0],
};

/** World heights, metres. Estimates for the framing, `[estimate]`: the airship Evrae is about 4 m; the locks are door-sized props. */
export const FLOODED_WAYS_HEIGHTS: Readonly<Record<string, number>> = {
  [EVRAE_ALTANA_ID]: 4.2,
  [GEOSGAENO_ID]: 4.6,
  [GATE_LOCK_IDS[0]]: 1.8,
  [GATE_LOCK_IDS[1]]: 1.8,
};

const FLOODED_WAYS_STAGING = { holdParty: true, enemySpots: FLOODED_WAYS_SPOTS, figureHeights: FLOODED_WAYS_HEIGHTS } as const;

/** The plates after the opening one, in chain order: fetched when the stage is built, so each swap finds its texture in the cache. */
const FLOODED_WARM: readonly string[] = [FLOODED_PLATES.area2, FLOODED_PLATES.area3, FLOODED_PLATES.baaj];

/** The published slots (`SCENES` table row): the Via Purifico's slots with this chapter's enemy staging. */
export const FLOODED_WAYS_SLOTS: SceneSlots = {
  ...VIA_PURIFICO_SLOTS,
  party: VIA_PURIFICO_SLOTS.party.map((s) => [...s] as [number, number, number]),
  enemy: VIA_PURIFICO_SLOTS.enemy.map((s) => [...s] as [number, number, number]),
  ...FLOODED_WAYS_STAGING,
};

const buildOnFirstPlate: SceneFactory = viaPurificoOnPlate(FLOODED_PLATE, FLOODED_WARM);

/** **The Flooded Ways**, as a {@link SceneFactory}: the Via Purifico stage on the first area's plate with this chapter's staging. Owns no actors. */
export const buildFloodedWaysScene: SceneFactory = async (opts = {}): Promise<SceneBuild> => {
  const build = await buildOnFirstPlate(opts);
  // `Object.assign`, not a spread: the build's `backdrop` is a getter that must keep following the plate after a swap.
  return Object.assign(build, FLOODED_WAYS_STAGING);
};
