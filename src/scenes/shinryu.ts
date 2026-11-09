import type { SceneBuild, SceneFactory } from './types.ts';
import type { SceneSlots } from './index.ts';
import { VIA_PURIFICO_SLOTS, viaPurificoOnPlate } from './via-purifico.ts';
import { SHINRYU_ID, SHINRYU_PLATE } from '../data/ffx/shinryu-ids.ts';

// ---------------------------------------------------------------------------
// Shinryu (FFX) — the hidden chapter's one stage: the Via Purifico's stage on its submerged plate
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. `docs/plans/ch-shinryu-review.md` picks SH3 and sections 5 and 6 (the arena options). Built 2026-11-07.
//
// ONE FIGHT, ONE PLATE. The game's stage for this fight is a sea stage (RE 5, "stage 106", shared with the S.S. Liki and the arena tests) that is not rendered; **the stand-in is the Flooded Ways' third area: the Via Purifico's
// stage on `via-purifico-flooded-3`, the submerged variant** (release 76's art, `data/ffx/flooded-ways-ids.ts#FLOODED_PLATES`), the driver's pick under Bailey's delegation, his to overturn (alternatives: the Baaj waterway plate,
// or a deeper sea plate of its own). The scene IS the Via Purifico scene (`./via-purifico.ts`: its rigs, palette, lights and the party's three slots) with this chapter's enemy staging. The water battle is a rule (the Petrify
// shatter, `EnemyGroupDef.inWater`), not a look.
//
// THE STAGING IS AN ESTIMATE for the framing: the party stands on the Via Purifico's party slots (three: the whole party); Shinryu stands on the boss spot Isaaru's room gives its one foe, taller than any foe of that room
// (the dragon "hangs in the water above them", preflight section 2). The formation file's own start positions are in another coordinate system (RE 0). Height is `[estimate]`, read off the airship Evrae's painting that stands
// in for it; a look at the real painting on the stage is owed when it exists.

/** Where the foe stands, by combatant id (the room's boss spot). */
export const SHINRYU_SPOTS: Readonly<Record<string, [number, number, number]>> = {
  [SHINRYU_ID]: [3.7, 0, -0.6],
};

/** World height, metres. An estimate for the framing, `[estimate]`: a deep-water dragon, larger than the airship Evrae (about 4 m) the painting stands in with. */
export const SHINRYU_HEIGHTS: Readonly<Record<string, number>> = {
  [SHINRYU_ID]: 5.6,
};

const SHINRYU_STAGING = { holdParty: true, enemySpots: SHINRYU_SPOTS, figureHeights: SHINRYU_HEIGHTS } as const;

/** The published slots (`SCENES` table row): the Via Purifico's slots with this chapter's enemy staging. */
export const SHINRYU_SLOTS: SceneSlots = {
  ...VIA_PURIFICO_SLOTS,
  party: VIA_PURIFICO_SLOTS.party.map((s) => [...s] as [number, number, number]),
  enemy: VIA_PURIFICO_SLOTS.enemy.map((s) => [...s] as [number, number, number]),
  ...SHINRYU_STAGING,
};

const buildOnPlate: SceneFactory = viaPurificoOnPlate(SHINRYU_PLATE);

/** **Shinryu**, as a {@link SceneFactory}: the Via Purifico stage on the submerged plate with this chapter's staging. Owns no actors. */
export const buildShinryuScene: SceneFactory = async (opts = {}): Promise<SceneBuild> => {
  const build = await buildOnPlate(opts);
  // `Object.assign`, not a spread: the build's `backdrop` is a getter that must keep following the plate.
  return Object.assign(build, SHINRYU_STAGING);
};
