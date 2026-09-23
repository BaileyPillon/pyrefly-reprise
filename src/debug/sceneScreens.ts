/**
 * The scene agents' debug screens, one per diorama: `__pyrefly.goto('scene-<key>')`
 * and `tools/screenshot.mjs --screen=scene-<key> --rig=<name>`. Moved out of
 * `./api.ts` (which had passed 500 lines) so each new chapter's scene adds its
 * line here, not there (AGENTS.md rule 7). Registration order is unchanged.
 */

import type { App } from '../app/App.ts';
// Scene agent (Mt. Gagazet): temporary screen for `goto('scene-gagazet')`.
import { GagazetSceneScreen } from '../scenes/gagazet-debug.ts';
// Scene agent (Farplane): temporary screen for `goto('scene-farplane')`.
import { FarplaneSceneScreen } from '../scenes/farplane-debug.ts';
// Scene agent (Zanarkand Dome): temporary screen for `goto('scene-zanarkand-dome')`.
import { ZanarkandDomeSceneScreen } from '../scenes/zanarkand-dome-debug.ts';
// Scene agent (Bevelle Underground): temporary screen for
// `goto('scene-bevelle-underground')`.
import { BevelleUndergroundSceneScreen } from '../scenes/bevelle-underground-debug.ts';
// Scene agent (Dream's End): temporary screen for `goto('scene-dreams-end')`.
import { DreamsEndSceneScreen } from '../scenes/dreams-end-debug.ts';
// Scene agent (Chateau Leblanc, the Last Room): temporary screen for
// `goto('scene-leblanc-last-room')`.
import { LeblancLastRoomSceneScreen } from '../scenes/leblanc-last-room-debug.ts';
// Scene agent (Macalania Temple): `goto('scene-macalania-temple')`.
import { MacalaniaTempleSceneScreen } from '../scenes/macalania-temple-debug.ts';
// Scene agent (the deck of the Fahrenheit): `goto('scene-evrae-airship-deck')`.
import { EvraeAirshipSceneScreen } from '../scenes/evrae-airship-debug.ts';

/** Register every scene debug screen on `app`. */
export function registerSceneScreens(app: App): void {
  // Scene agent (Mt. Gagazet): a temporary, actor-staged view of the scene
  // builder, reachable as `__pyrefly.goto('scene-gagazet')` and by
  // `tools/screenshot.mjs --screen=scene-gagazet --rig=<name>`.
  app.register('scene-gagazet', () => new GagazetSceneScreen());
  // Scene agent (Heart of the Farplane): same deal, `goto('scene-farplane')`
  // and `tools/screenshot.mjs --screen=scene-farplane --rig=<name>`.
  app.register('scene-farplane', () => new FarplaneSceneScreen());
  // Scene agent (Zanarkand Dome): same deal, `goto('scene-zanarkand-dome')`
  // and `tools/screenshot.mjs --screen=scene-zanarkand-dome --rig=<name>`.
  app.register('scene-zanarkand-dome', () => new ZanarkandDomeSceneScreen());
  // Scene agent (Dream's End — inside Sin): same deal, `goto('scene-dreams-end')`
  // and `tools/screenshot.mjs --screen=scene-dreams-end --rig=<name>`.
  app.register('scene-dreams-end', () => new DreamsEndSceneScreen());
  // Scene agent (Bevelle Underground — Vegnagun's chamber): same deal,
  // `goto('scene-bevelle-underground')` and
  // `tools/screenshot.mjs --screen=scene-bevelle-underground --rig=<name>`.
  app.register('scene-bevelle-underground', () => new BevelleUndergroundSceneScreen());
  // Scene agent (Chateau Leblanc, the Last Room): same deal,
  // `goto('scene-leblanc-last-room')` and
  // `tools/screenshot.mjs --screen=scene-leblanc-last-room --rig=<name>`.
  app.register('scene-leblanc-last-room', () => new LeblancLastRoomSceneScreen());
  app.register('scene-macalania-temple', () => new MacalaniaTempleSceneScreen());
  app.register('scene-evrae-airship-deck', () => new EvraeAirshipSceneScreen());
}
