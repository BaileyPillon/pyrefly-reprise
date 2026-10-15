import type { SceneBuild, SceneFactory } from './types.ts';
import type { SceneSlots } from './index.ts';
import { buildMushroomRockRoadScene, MUSHROOM_SLOTS } from './mushroom-rock-road.ts';
import { DARK_CINDY_ID, DARK_DAIGORO_ID, DARK_MINDY_ID, DARK_SANDY_ID, DARK_YOJIMBO_ID } from '../data/ffx/mirror-aeons-ids.ts';

// ---------------------------------------------------------------------------
// Mirror Aeons (FFX) — the hidden chapter's one stage: Mushroom Rock Road for Act I, the Cavern of the Stolen Fayth for Act II
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. `docs/plans/ch-mirror-aeons-review.md`. Built 2026-10-15.
//
// ONE STAGE, TWO PLATES. The chapter is a chain (Act I the Dark Magus Sisters, Act II Dark Yojimbo) and a chain keeps one scene: the second act's formation names its plate (`EnemyGroupDef.plate`) and the battle screen
// puts it on the painting plane under a white pulse (`SceneBuild.swapBackdrop`), as Sinspawn Gui's ruined camp does. So this scene IS the Mushroom Rock Road scene (`./mushroom-rock-road.ts`: its plate,
// rigs, palette, lights and party slots) with this chapter's enemy staging, and its swap knows a third plate, the Cavern's (a look entry in `MUSHROOM_PLATE_LOOK`). Both plates are existing, already-shipped
// backdrops (the Mushroom plate is a provisional stand-in; the Cavern's is Chapter IX's approved plate).
//
// What this does NOT do: change the grade when the plate changes. The palette is applied once, at the scene's entry (`BattleScreen`), so the cavern is lit with the road's daylight grade. A cavern grade is a
// presentation pick for Bailey's eye (`docs/handoff/ch-mirror-aeons.md`), not a number to guess here.
//
// THE STAGING IS AN ESTIMATE for the framing: the party stands on the Mushroom slots; the Dark aeons draw their aeons' own paintings (the possessed aeons' precedent), so the heights are the paintings' proportions
// against the party's 1.75, not measures. The trio stands Cindy front left, Sandy in the middle and behind, Mindy front right (the game's start positions, RE section 3, are in another coordinate system and are not
// transcribed); Dark Yojimbo stands where Gui's body does, with the dog beside him, as far from the party as the arena allows.

/** The enemies' spots, by combatant id: every formation of both ladders (`data/ffx/enemies/dark-aeons-groups.ts`) uses these, so a solo sister or a pair stands where she stands in the trio. */
export const MIRROR_ENEMY_SPOTS: Readonly<Record<string, [number, number, number]>> = {
  [DARK_CINDY_ID]: [1.1, 0, -2.4],
  [DARK_SANDY_ID]: [3.3, 0, -3.3],
  [DARK_MINDY_ID]: [5.6, 0, -2.4],
  [DARK_YOJIMBO_ID]: [3.0, 0, -2.8],
  [DARK_DAIGORO_ID]: [5.3, 0, -1.9],
};

/** World heights, metres: the party stands 1.75. Estimates for the framing (Cindy the broad one, Sandy the tall one, Mindy the small one), `[estimate]`. */
export const MIRROR_FIGURE_HEIGHTS: Readonly<Record<string, number>> = {
  [DARK_CINDY_ID]: 3.0,
  [DARK_SANDY_ID]: 3.5,
  [DARK_MINDY_ID]: 2.2,
  [DARK_YOJIMBO_ID]: 2.5,
  [DARK_DAIGORO_ID]: 1.1,
};

const MIRROR_STAGING = { holdParty: true, enemySpots: MIRROR_ENEMY_SPOTS, figureHeights: MIRROR_FIGURE_HEIGHTS } as const;

/** The published slots (`SCENES` table row): the Mushroom Rock Road slots, with this chapter's enemy staging. */
export const MIRROR_SLOTS: SceneSlots = {
  ...MUSHROOM_SLOTS,
  party: MUSHROOM_SLOTS.party.map((s) => [...s] as [number, number, number]),
  enemy: MUSHROOM_SLOTS.enemy.map((s) => [...s] as [number, number, number]),
  ...MIRROR_STAGING,
};

/** **Mirror Aeons**, as a {@link SceneFactory}: the Mushroom Rock Road stage with this chapter's staging. Owns no actors. */
export const buildMirrorAeonsScene: SceneFactory = async (opts = {}): Promise<SceneBuild> => {
  const build = await buildMushroomRockRoadScene(opts);
  // `Object.assign`, not a spread: the build's `backdrop` is a getter that must keep following the plate after a swap.
  return Object.assign(build, MIRROR_STAGING);
};
