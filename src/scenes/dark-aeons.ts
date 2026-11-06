import type { SceneBuild, SceneFactory } from './types.ts';
import type { SceneSlots } from './index.ts';
import { buildMushroomRockRoadScene, MUSHROOM_SLOTS } from './mushroom-rock-road.ts';
import { DARK_ANIMA_ID, DARK_BAHAMUT_ID, DARK_IFRIT_ID, DARK_IXION_2_ID, DARK_IXION_ID, DARK_SHIVA_ID, DARK_VALEFOR_ID } from '../data/ffx/dark-aeons-six-ids.ts';

// ---------------------------------------------------------------------------
// The Dark Aeons (FFX) — the hidden chapter's one stage: the Mushroom Rock Road stage, a different existing plate for every link
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. `docs/plans/ch-dark-aeons-review.md` pick DA10. Built 2026-11-06.
//
// ONE STAGE, SEVEN PLATES. The chapter is a chain of seven fresh fights and a chain keeps one scene: each link's formation names its plate (`EnemyGroupDef.plate`, `data/ffx/dark-aeons-six-ids.ts#DARK_SIX_PLATES`) and the
// battle screen puts it on the painting plane under a white pulse (`SceneBuild.swapBackdrop`), as the Mirror Aeons' and Sinspawn Gui's second plates are. So this scene IS the Mushroom Rock Road scene (`./mushroom-rock-road.ts`:
// its plate, rigs, palette, lights and party slots) with this chapter's enemy staging, and its swap knows the other plates' looks (`MUSHROOM_PLATE_LOOK`: the desert, the temple, the mountain, the Dome; the ruined road
// stands for the Thunder Plains). **Every plate is an existing, already-shipped backdrop used as a provisional stand-in** (Besaid has no plate, the Sanubia desert is Angra Mainyu's Bikanel plate, the road to Macalania is the
// temple hall): the places are Bailey's eye to judge and, if he wants, to paint (the handoff's art list).
//
// What this does NOT do: change the grade when the plate changes. The palette is applied once, at the scene's entry (`BattleScreen`), so every plate is lit with the road's daylight grade (the Mirror Aeons' note). A per-plate
// grade is a presentation pick for Bailey's eye, not a number to guess here.
//
// THE STAGING IS AN ESTIMATE for the framing: the party stands on the Mushroom slots; every Dark aeon stands on the one boss spot (the formations give start positions only: RE six 2.3, a different coordinate system) at a
// height read off the player's aeon painting it is a recolour of (a winged Valefor and a tall Ixion, the great Bahamut and the chained Anima the largest), `[estimate]`; the paintings are installed (r76 art install) and the heights still wait for a look at them on the stage (`docs/handoff/r76-art-install.md`, held).

/** The one boss spot every Dark aeon stands on (the Mirror Aeons' Dark Yojimbo's: as far from the party as the arena allows). */
const BOSS_SPOT: [number, number, number] = [3.0, 0, -2.8];

/** The enemies' spots, by combatant id. */
export const DARK_AEONS_SPOTS: Readonly<Record<string, [number, number, number]>> = {
  [DARK_VALEFOR_ID]: BOSS_SPOT,
  [DARK_IFRIT_ID]: BOSS_SPOT,
  [DARK_IXION_ID]: BOSS_SPOT,
  [DARK_IXION_2_ID]: BOSS_SPOT,
  [DARK_SHIVA_ID]: BOSS_SPOT,
  [DARK_BAHAMUT_ID]: BOSS_SPOT,
  [DARK_ANIMA_ID]: BOSS_SPOT,
};

/** World heights, metres: the party stands 1.75. Estimates for the framing, `[estimate]`. */
export const DARK_AEONS_HEIGHTS: Readonly<Record<string, number>> = {
  [DARK_VALEFOR_ID]: 3.4,
  [DARK_IFRIT_ID]: 3.6,
  [DARK_IXION_ID]: 3.4,
  [DARK_IXION_2_ID]: 3.4,
  [DARK_SHIVA_ID]: 3.0,
  [DARK_BAHAMUT_ID]: 4.2,
  [DARK_ANIMA_ID]: 4.4, // the game scales Anima to 0.7 (RE six 4): the chained figure is large and stands low
};

const DARK_AEONS_STAGING = { holdParty: true, enemySpots: DARK_AEONS_SPOTS, figureHeights: DARK_AEONS_HEIGHTS } as const;

/** The published slots (`SCENES` table row): the Mushroom Rock Road slots, with this chapter's enemy staging. */
export const DARK_AEONS_SLOTS: SceneSlots = {
  ...MUSHROOM_SLOTS,
  party: MUSHROOM_SLOTS.party.map((s) => [...s] as [number, number, number]),
  enemy: MUSHROOM_SLOTS.enemy.map((s) => [...s] as [number, number, number]),
  ...DARK_AEONS_STAGING,
};

/** **The Dark Aeons**, as a {@link SceneFactory}: the Mushroom Rock Road stage with this chapter's staging. Owns no actors. */
export const buildDarkAeonsScene: SceneFactory = async (opts = {}): Promise<SceneBuild> => {
  const build = await buildMushroomRockRoadScene(opts);
  // `Object.assign`, not a spread: the build's `backdrop` is a getter that must keep following the plate after a swap.
  return Object.assign(build, DARK_AEONS_STAGING);
};
