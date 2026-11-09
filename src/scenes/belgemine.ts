import type { SceneBuild, SceneFactory } from './types.ts';
import type { SceneSlots, Spot } from './index.ts';
import { buildMushroomRockRoadScene, MUSHROOM_SLOTS } from './mushroom-rock-road.ts';
import { BELGEMINE_ID, BELG_IDS } from '../data/ffx/belgemine-ids.ts';

// ---------------------------------------------------------------------------
// The Remiem Temple (FFX) — the hidden Belgemine's Challenge chapter's one stage: the Mushroom Rock Road stage on the Cavern of the Stolen Fayth's plate
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. `docs/plans/ch-belgemine-review.md` section 5. Built 2026-11-09.
//
// ONE STAGE, ONE STAND-IN PLATE. The Remiem court has no plate of its own in the repository or the art mirror. The preflight's recommendation is a `remiem-temple` plate derived from the Cavern of the Stolen Fayth (an inner temple
// chamber with a fayth door, open sky at the top); until that painting is made (the art list in the handoff) every act's formation names the **Cavern plate itself** (`EnemyGroupDef.plate`) and the battle screen puts it on the
// painting plane (`SceneBuild.swapBackdrop`), exactly as the Mirror Aeons' second act and the Dark Aeons' links do. So this scene IS the Mushroom Rock Road scene (`./mushroom-rock-road.ts`: its rigs, palette, lights and party slots)
// with this chapter's enemy staging; `MUSHROOM_PLATE_LOOK['cavern-stolen-fayth']` already knows the plate's floor row and sampled bands. The Cavern scene itself (`./cavern-stolen-fayth.ts`) is not used: its arrival and the
// Ginnem glow belong to Yojimbo's fight.
//
// THE STAGING IS AN ESTIMATE for the framing: the party stands on the Mushroom slots (Yuna alone fills the first); the enemy aeon stands on the one boss spot (the formations give start positions in another coordinate system,
// RE 1 item 4); Belgemine stands behind and to the left of it, small and out of the HUD's safe area; the dog beside Yojimbo; the Sisters as in the Mirror Aeons (Cindy front left, Sandy middle and behind, Mindy front right).
// Heights are the paintings' proportions against the party's 1.75, `[estimate]`, the Dark Aeons' for the same aeons (a winged Valefor, a tall Ixion, the great Bahamut and the chained Anima the largest).

/** The one boss spot every aeon stands on (the Dark Aeons' and the Mirror Aeons' Dark Yojimbo's: as far from the party as the arena allows). */
const BOSS_SPOT: Spot = [3.0, 0, -2.8];

/** The enemies' spots, by combatant id. */
export const BELGEMINE_SPOTS: Readonly<Record<string, Spot>> = {
  [BELGEMINE_ID]: [0.9, 0, -5.2],
  [BELG_IDS.valefor]: BOSS_SPOT,
  [BELG_IDS.ifrit]: BOSS_SPOT,
  [BELG_IDS.ixion]: BOSS_SPOT,
  [BELG_IDS.shiva]: BOSS_SPOT,
  [BELG_IDS.bahamut]: BOSS_SPOT,
  [BELG_IDS.yojimbo]: BOSS_SPOT,
  [BELG_IDS.dog]: [5.3, 0, -1.9],
  [BELG_IDS.anima]: BOSS_SPOT,
  [BELG_IDS.cindy]: [1.1, 0, -2.4],
  [BELG_IDS.sandy]: [3.3, 0, -3.3],
  [BELG_IDS.mindy]: [5.6, 0, -2.4],
};

/** World heights, metres: the party stands 1.75. Estimates for the framing, `[estimate]`. */
export const BELGEMINE_HEIGHTS: Readonly<Record<string, number>> = {
  [BELGEMINE_ID]: 1.6,
  [BELG_IDS.valefor]: 3.4,
  [BELG_IDS.ifrit]: 3.6,
  [BELG_IDS.ixion]: 3.4,
  [BELG_IDS.shiva]: 3.0,
  [BELG_IDS.bahamut]: 4.2,
  [BELG_IDS.yojimbo]: 2.5,
  [BELG_IDS.dog]: 1.1,
  [BELG_IDS.anima]: 4.4,
  [BELG_IDS.cindy]: 3.0,
  [BELG_IDS.sandy]: 3.5,
  [BELG_IDS.mindy]: 2.2,
};

const BELGEMINE_STAGING = { holdParty: true, enemySpots: BELGEMINE_SPOTS, figureHeights: BELGEMINE_HEIGHTS } as const;

/** The published slots (`SCENES` table row): the Mushroom Rock Road slots, with this chapter's enemy staging. */
export const BELGEMINE_SLOTS: SceneSlots = {
  ...MUSHROOM_SLOTS,
  party: MUSHROOM_SLOTS.party.map((s) => [...s] as Spot),
  enemy: MUSHROOM_SLOTS.enemy.map((s) => [...s] as Spot),
  ...BELGEMINE_STAGING,
};

/** **Belgemine's Challenge**, as a {@link SceneFactory}: the Mushroom Rock Road stage with this chapter's staging. Owns no actors. */
export const buildBelgemineScene: SceneFactory = async (opts = {}): Promise<SceneBuild> => {
  const build = await buildMushroomRockRoadScene(opts);
  // `Object.assign`, not a spread: the build's `backdrop` is a getter that must keep following the plate after a swap.
  return Object.assign(build, BELGEMINE_STAGING);
};
