/**
 * **The Fahrenheit's deck for the hidden Penance chapter** (FFX only; `../data/chapter-penance.ts`; preflight P3): Chapter VIII's deck and plate, with Penance and its two Arms staged.
 *
 * Game case: FFX only [AGENTS.md rule 14; research/re-ffx-penance.md section 2]. The formation `hiku15_70` is in the airship map `hiku15` beside the Evrae fight, with the party where the Evrae party stands and the giant
 * 125 units off and 63 above it (RE 2), so the stage is the deck as Chapter VIII builds it (`./evrae-airship-deck.ts`): the same ship, rigs, party arc and lighting, over **Chapter VIII's own plate**
 * (`EVRAE_DECK_PLATE`: 0 new plates). Sin's chapters (`./evrae-airship-sin.ts`) reuse the deck the same way. One guide places the spawn in the Calm Lands; the files say the airship map and the repo has no Calm Lands
 * plate (`[inferred]`: the arena is not proved, RE 10 item 1). Chapter VIII's scene file is not touched.
 *
 * **Where they stand (`[estimate]`: none of it is the game's)**. The game gives start positions only (Penance (-150.8, 63, 90.1), the Right Arm (-146, -8, 40.1), the Left Arm (-150.7, -8, 138.9) against a party at
 * (-25, -35, 60 to 106)): a giant seen from the deck with a hand either side of it at the party's depth. Here Penance stands far and high on the deck's right-of-centre (x 2.4, z -6.4), the Right Arm to its left of the
 * frame and the Left Arm to its right at the rail's depth (z -4.6, x -1.6 and 6.0), inside the HUD's safe area (the turn list from 0.843 of the canvas width, the command stack on the left, `docs/ENGINE-API.md#hud-safe-area`).
 * The heights (5.6 and 2.6) fit the idle camera's frame (about 8.8 units high at that depth) and are read by the job specs in `docs/handoff/ch-penance.md`; no stature row exists for m344 to m346 (RE 10 item 6).
 * The Right Arm is the giant's own right hand, which faces the viewer, so it is on the viewer's left. Layout A of the preflight ("the giant over the bow"); layouts B and C wait for Bailey's pick (rule 9).
 */

import type { SceneEntry, SceneSlots } from './index.ts';
import type { SceneFactory } from './types.ts';
import { buildDemoScene } from './demo.ts';
import { EVRAE_AIRSHIP_DECK_SLOTS, EVRAE_DECK_PLATE, makeAirshipDeckScene } from './evrae-airship-deck.ts';
import { PENANCE_ID, PENANCE_LEFT_ARM_ID, PENANCE_RIGHT_ARM_ID, PENANCE_SCENE, PENANCE_SPLIT_LIFT, PENANCE_SPRITES } from '../data/ffx/penance-ids.ts';

type Spot = [number, number, number];

/** Where each stands on the deck (the formation's slots 0, 1 and 2). */
export const PENANCE_ENEMY_SPOTS: Readonly<Record<string, Spot>> = {
  [PENANCE_ID]: [2.4, 0, -6.4],
  [PENANCE_RIGHT_ARM_ID]: [-1.6, 0, -4.6],
  [PENANCE_LEFT_ARM_ID]: [6.0, 0, -4.6],
};

/** World heights: the body a head over the frame's middle, an arm under half of it (`[estimate]`). */
export const PENANCE_FIGURE_HEIGHTS: Readonly<Record<string, number>> = {
  [PENANCE_ID]: 5.6,
  [PENANCE_RIGHT_ARM_ID]: 2.6,
  [PENANCE_LEFT_ARM_ID]: 2.6,
};

/** The Separation's lift (FFX only; r76 art install): while the half disc's painting is up the stage stands it `PENANCE_SPLIT_LIFT` of the figure's height higher, so its top stays where the whole disc's was (`SceneStaging.formLifts`). */
export const PENANCE_FORM_LIFTS: Readonly<Record<string, number>> = {
  [PENANCE_SPRITES.split]: PENANCE_SPLIT_LIFT,
};

/** The published slots, same shape every other scene exports: the deck's party arc, the three enemy marks in formation order. */
export const PENANCE_SLOTS: SceneSlots = {
  ...EVRAE_AIRSHIP_DECK_SLOTS,
  enemy: [PENANCE_ID, PENANCE_RIGHT_ARM_ID, PENANCE_LEFT_ARM_ID].map((id) => [...(PENANCE_ENEMY_SPOTS[id] as Spot)] as Spot),
  enemyHeight: PENANCE_FIGURE_HEIGHTS[PENANCE_ID] as number,
  enemySpots: PENANCE_ENEMY_SPOTS,
  figureHeights: PENANCE_FIGURE_HEIGHTS,
  formLifts: PENANCE_FORM_LIFTS,
};

/** The deck over Chapter VIII's plate with this chapter's three figures pinned. */
export const buildPenanceScene: SceneFactory = makeAirshipDeckScene({
  key: EVRAE_DECK_PLATE,
  staging: { enemySpots: PENANCE_ENEMY_SPOTS as Record<string, Spot>, figureHeights: PENANCE_FIGURE_HEIGHTS, formLifts: PENANCE_FORM_LIFTS },
});

/** The scene-table row: real (the factory wins); `build` is the unreachable demo diorama, as for the deck itself. */
export const PENANCE_SCENE_ENTRY: SceneEntry = {
  key: PENANCE_SCENE,
  title: 'The deck of the Fahrenheit — Penance',
  build: buildDemoScene,
  slots: PENANCE_SLOTS,
  placeholder: false,
};
