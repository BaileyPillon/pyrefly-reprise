/**
 * **Sin's two chapters on the Fahrenheit's deck (FFX only)**: Chapter XVII's links I and II in flight over the
 * cloud sea, and Chapter XVIII's link IV over Bevelle at dusk.
 *
 * Game case: FFX only [AGENTS.md rule 14; research/ffx-sin.md §0.3]. Both are Chapter VIII's deck
 * (`./evrae-airship-deck.ts`): the same ship, the same NEAR / FAR range director, rigs and party arc, over a
 * different painting. Nothing here is read by an FFX-2 chapter.
 *
 * **The plates are the driver's picks** (D-279, delegated by Bailey, who can swap any of them;
 * `docs/concepts/chapters/sin-2026-09-29/install/INSTALL.md` "Scenes"):
 *
 * - `sin-fahrenheit-flight`: late afternoon over the cloud sea (`plates/flight-1`), links I and II;
 * - `sin-fahrenheit-bevelle`: golden dusk over Bevelle (`backdrop/bk-a-8`), link IV. It has Evrae's layout (the
 *   hull from below) and is not rolled on disk, so the deck rolls it exactly as it rolls Evrae's.
 *
 * **Link III (Sin's back) stays on the flight plate**, labelled: the chain restages every link on one scene and
 * `EnemyGroupDef` has no scene key, so a per-link swap is a new presentation seam (plan Q6). The `sin-back`
 * painting is staged for install, and wiring it is the seam's own change, not this listing's.
 *
 * Each factory falls back to Evrae's painting when its plate is not installed (`makeAirshipDeckScene`), so the
 * chapters never stand on a placeholder diorama.
 */

import type { SceneEntry, SceneSlots } from './index.ts';
import type { SceneFactory } from './types.ts';
import { buildDemoScene } from './demo.ts';
import { EVRAE_AIRSHIP_DECK_SLOTS, makeAirshipDeckScene } from './evrae-airship-deck.ts';
import { giantFigureHeights } from '../data/ffx/fiend-stature.ts';

/** Chapter XVII's plate (links I and II; link III too, see the header). */
export const SIN_FLIGHT_PLATE = 'sin-fahrenheit-flight';
/** Chapter XVIII's plate (link IV). */
export const SIN_BEVELLE_PLATE = 'sin-fahrenheit-bevelle';

/**
 * The flight plate's roll. Its lower third is its own painted foredeck with a level horizon, so it is drawn
 * level; the roll only ever levels a painted rail, and this one is level as painted.
 */
export const SIN_FLIGHT_ROLL = 0;

const SLOTS: SceneSlots = EVRAE_AIRSHIP_DECK_SLOTS;

/**
 * The party's shared world height on this deck: Tidus's 1.82, the stage's own default (the deck publishes no `partyHeight`: `resolveSceneHeights`), which the giants' heights are read against.
 */
export const SIN_PARTY_HEIGHT = 1.82;

/**
 * **r3942-giants-ffx (Bailey, 2026-10-08, "all of your recommendations"; FFX only, Chapter XVII link 3): Sinspawn Genais and Sin's Core stand at their real sizes, at today's spots.** The live PS2
 * game draws Genais about 49 units tall and the Core 30 (`data/ffx/fiend-stature.ts` `FFX_GIANT_STATURE`, `research/ffx-sin.md` section 13), 2.72 and 1.67 times the party; the build drew both at the stage's
 * boss height, 4.1 (Genais 20 percent too small, the Core 37 percent too big). At the party's 1.82 that is 4.913 and 3.008 (Genais +20 percent, the Core -27 percent). **The Fins do not change** (the
 * options study's pick: they stand about 1,200 units off and read as mountains already), and neither does the head of Chapter XVIII or Evrae: these are two combatant ids no other chapter has.
 * They are pinned (the formation solver spreads figures by their heights and would otherwise swap and move them): the Core at (5.90, -5.3), live's spot at the wider windows (5.87 at 1600x900, 5.90 at 1440x900
 * and 1024x768, 5.75 on a phone; 5.89 stood 0.008 nearer Auron than live's at 16:10 and 4:3), and Genais at (-0.93, -4.3), the
 * spot he stood on at the common window shapes (-0.93, -4.1) **0.2 further back** (repair of 2026-10-08, after the independent check). Live's formation solver places him per window shape, from x -0.80
 * on a phone to -1.30 at 1024x768, and a pin is one spot: at -4.1 he stood 0.02 to 0.04 nearer the party than live at 16:10 and 4:3, which Bailey's standing preference (no figure nearer than live,
 * 2026-10-08) rules out. At z -4.3 his ground distance to the nearest member (Yuna) is 1.80 against live's 1.60 to 1.64 at every shape, and to the party's centre 3.30, the 4:3 shape's own: no shape has him nearer.
 */
export const SIN_GENAIS_CORE_STAGING = {
  figureHeights: giantFigureHeights(['sinspawn-genais', 'sin-core'], SIN_PARTY_HEIGHT),
  enemySpots: { 'sinspawn-genais': [-0.93, 0, -4.3] as [number, number, number], 'sin-core': [5.9, 0, -5.3] as [number, number, number] },
};

/** The two factories, keyed as `SCENE_FACTORIES` wants them (`./index.ts`). */
export const SIN_SCENE_FACTORIES: Readonly<Record<string, SceneFactory>> = {
  [SIN_FLIGHT_PLATE]: makeAirshipDeckScene({ key: SIN_FLIGHT_PLATE, roll: SIN_FLIGHT_ROLL, staging: SIN_GENAIS_CORE_STAGING }),
  [SIN_BEVELLE_PLATE]: makeAirshipDeckScene({ key: SIN_BEVELLE_PLATE }),
};

/** The two scene-table rows: real (the factory wins); `build` is the unreachable demo diorama, as for Evrae. */
export const SIN_SCENE_ENTRIES: readonly SceneEntry[] = [
  { key: SIN_FLIGHT_PLATE, title: 'The deck of the Fahrenheit — in flight, Sin alongside', build: buildDemoScene, slots: SLOTS, placeholder: false },
  { key: SIN_BEVELLE_PLATE, title: 'The deck of the Fahrenheit — above Bevelle at dusk', build: buildDemoScene, slots: SLOTS, placeholder: false },
];
