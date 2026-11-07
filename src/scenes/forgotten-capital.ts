import { Vector3 } from 'three';
import type { ScenePalette } from '../engine/Renderer.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots } from './index.ts';
import { viewportAspect } from './cavern-stolen-fayth-rigs.ts';
import { buildSector1ReactorScene, SECTOR1_PALETTE } from './sector1-reactor.ts';
import {
  FORGOTTEN_CAPITAL_DESK,
  FORGOTTEN_CAPITAL_HEIGHTS,
  FORGOTTEN_CAPITAL_STAGING,
  forgottenCapitalLayout,
  forgottenCapitalStaging,
} from './forgotten-capital-staging.ts';
import { FORGOTTEN_CAPITAL_SCENE, JENOVA_LIFE_ID } from '../data/ff7/jenova-life-ids.ts';

// ---------------------------------------------------------------------------
// The altar of the Forgotten Capital (FF7): the hidden Jenova LIFE chapter's stage
// ---------------------------------------------------------------------------
//
// Game case: FF7 only [AGENTS.md rule 14]. Chapter record `src/data/chapter-ff7-jenova-life.ts` (`sceneKey: 'forgotten-capital'`); the arena is the altar of the City of the Ancients, "stepping-stone pillars
// rising out of black water, light from below" (`research/ff7-jenova-life.md` section 7, the scene as Lifestream Encore records it).
//
// **A STAND-IN.** The altar is not painted (the preflight's section 5 options a to c are Bailey's to pick, hard rule 9). Until a plate exists this is the Guard Scorpion's field (`./sector1-reactor.ts`: its plate, camera,
// lights and motes) with this fight's staging and a cooler grade, so the chapter runs end to end. The plate it stands on is `backdrops/ff7-film-reactor`; the altar's would be `backdrops/ff7-film-forgotten-capital`
// (listed in `docs/handoff/ch-jenova-life.md`). The mako motes the reactor adds are green: they stay as the stand-in's, not the altar's light.

/** The published slots, same shape every other scene exports. */
export const FORGOTTEN_CAPITAL_SLOTS: SceneSlots = {
  party: FORGOTTEN_CAPITAL_DESK.front.map((s) => [s[0], s[1], s[2]] as [number, number, number]),
  enemy: [[FORGOTTEN_CAPITAL_DESK.boss[0], FORGOTTEN_CAPITAL_DESK.boss[1], FORGOTTEN_CAPITAL_DESK.boss[2]]],
  partyHeight: FORGOTTEN_CAPITAL_HEIGHTS.cloud,
  enemyHeight: FORGOTTEN_CAPITAL_HEIGHTS[JENOVA_LIFE_ID],
  ...FORGOTTEN_CAPITAL_STAGING,
};

/**
 * The grade (ours, a stand-in): the reactor's, shifted cool, so the borrowed plate reads as water and not as mako. Lift and gain only; the post chain is the reactor's (its `gamma` 2.0 stays,
 * for the reason `SECTOR1_PALETTE` gives). FF7 only.
 */
export const FORGOTTEN_CAPITAL_PALETTE: ScenePalette = {
  ...SECTOR1_PALETTE,
  name: FORGOTTEN_CAPITAL_SCENE,
  lift: [0.0, 0.01, 0.03],
  gain: [0.82, 0.97, 1.18],
  shadowTint: [0.25, 0.45, 0.7],
  shadowTintAmount: 0.12,
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** `build` with some fields replaced; the getters (the backdrop that hot-swaps in a dev server) are copied as getters, so the scene still reads the live one. */
function derive(build: SceneBuild, over: Partial<Mutable<SceneBuild>>): SceneBuild {
  const out = Object.defineProperties(Object.create(Object.getPrototypeOf(build)) as object, Object.getOwnPropertyDescriptors(build)) as Mutable<SceneBuild>;
  Object.assign(out, over);
  return out;
}

/** **The altar of the Forgotten Capital**, as a {@link SceneFactory}: the reactor field with this fight's staging. Owns no actors. */
export const buildForgottenCapitalScene: SceneFactory = async (opts: SceneBuildOptions = {}): Promise<SceneBuild> => {
  const base = await buildSector1ReactorScene(opts);
  const layout = forgottenCapitalLayout(viewportAspect());
  return derive(base, {
    partySlots: layout.front.map((s) => new Vector3(s[0], s[1], s[2])),
    enemySlots: [new Vector3(layout.boss[0], layout.boss[1], layout.boss[2])],
    partyHeight: FORGOTTEN_CAPITAL_HEIGHTS.cloud,
    enemyHeight: FORGOTTEN_CAPITAL_HEIGHTS[JENOVA_LIFE_ID],
    ...forgottenCapitalStaging(layout),
    palette: { ...FORGOTTEN_CAPITAL_PALETTE },
  });
};
