import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots, Spot } from './index.ts';
import { ZANARKAND_DOME_SLOTS, buildZanarkandDomeScene } from './zanarkand-dome.ts';
import { GAUNTLET_CREATURES, ULTIMA_BUSTER_ARM_LEFT_ID, ULTIMA_BUSTER_ARM_RIGHT_ID, ULTIMA_BUSTER_HEAD_ID, type GauntletCombatantId } from '../data/ffx/gauntlet-ids.ts';

// ---------------------------------------------------------------------------
// The Gauntlet (FFX): the hidden chapter's one stage, the Zanarkand Dome's, standing in for the Monster Arena of the Calm Lands
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. `docs/plans/ch-gauntlet-review.md` pick GA11 and section 5 (the arena options). Built 2026-11-10.
//
// **A STAND-IN, THE PREFLIGHT'S OPTION (c).** No Calm Lands arena plate exists (the art mirror of release 79 holds none), and GA11 (a new `monster-arena` plate, a light colour per creature) is **held for Bailey's pick, with a
// mockup, before anything is painted** (hard rule 9). Until then the nine acts are fought on Chapter II's Zanarkand Dome: a round arena (wrong place, right shape) with its lights, particles and seven camera rigs, the party
// held on its slots. The scene IS the Dome's (`./zanarkand-dome.ts`, which is not touched) with this chapter's enemy staging, as the Spectral Keeper's (`./spectral-keeper.ts`) is. The plate every formation names
// (`EnemyGroupDef.plate`, `data/ffx/gauntlet-ids.ts#GAUNTLET_PLATE`) is that plate, so the battle screen's plate swap is a no-op here; when the new plate lands it is one line there and in `data/art/artNamespace.ts`.
//
// ONE STAGE, NINE ACTS. The chapter is a chain of nine fresh fights and a chain keeps one scene: the staging below knows every creature by its combatant id, so each act places its own and the others are never on the field
// together. All nine stand on the Dome's own enemy slot 0 (solved against the HUD safe area: the CTB queue owns everything right of 0.843 of the canvas, so a figure has to finish by 0.79; `./zanarkand-dome.ts`).
// The Ultima Buster alone has parts: its Head and its two Arms stand behind the body, the Arms either side of it.
//
// **THE HEIGHTS ARE ESTIMATES** for the framing (no stature row exists for any of the nine: `data/ffx/fiend-stature.ts` is keyed by other monsters): the party stands 1.78 and the Dome's own boss 2.9. The painting that
// stands in for each creature (`GAUNTLET_SPRITE`) is not the creature, so the height is read off the creature as the guides describe it (a giant Cactuar, a king Tonberry, a great serpent, a heavy ground-bound beast, a
// round machine, a vast thorned monster, a robed giant, a bulky shelled slug, a towering machine), capped at what the Dome's rigs frame. They were LOOKED AT in the stage 5 browser inspection of `docs/handoff/ch-gauntlet.md` (all nine acts' first menus):
// the first pass put the nine on Yunalesca's spot (x 2.8) at 2.2 to 3.4 m, and the wide stand-in paintings (the King's winged `pterya`, Earth Eater's `sinspawn-gui`) reached the turn list's rail, and the Arms' stand-in
// `gate-lock` (a 659 x 394 bar) at 1.8 m was a 3 m beam across the party; so the spot is the Dome's own slot 0 (x 2.5) and the King, Earth Eater and the Arms are smaller. A figure that clips the frame is a one-number
// change here; the art lane's paintings are solved against the safe area.

/** The Dome's own enemy slot 0 (`ZANARKAND_DOME_SLOTS.enemy[0]`; Yunalesca stands a little right of it, at 2.8): every body stands here. */
const BOSS_SPOT: Spot = [2.5, 0, -4.0];

/** Where each combatant stands, by id. The parts of the Ultima Buster stand behind the body, the Arms either side of it and the Head above them. */
export const GAUNTLET_SPOTS: Readonly<Record<GauntletCombatantId, Spot>> = {
  'cactuar-king': BOSS_SPOT,
  'don-tonberry': BOSS_SPOT,
  jormungand: BOSS_SPOT,
  'earth-eater': BOSS_SPOT,
  'greater-sphere': BOSS_SPOT,
  catastrophe: BOSS_SPOT,
  thuban: BOSS_SPOT,
  neslug: BOSS_SPOT,
  'ultima-buster': BOSS_SPOT,
  [ULTIMA_BUSTER_HEAD_ID]: [2.5, 0, -8.0],
  [ULTIMA_BUSTER_ARM_LEFT_ID]: [0.7, 0, -6.0],
  [ULTIMA_BUSTER_ARM_RIGHT_ID]: [3.6, 0, -6.0],
};

/** World heights, metres: the party stands 1.78. Estimates for the framing, `[estimate]` (see the note above). */
export const GAUNTLET_HEIGHTS: Readonly<Record<GauntletCombatantId, number>> = {
  'cactuar-king': 2.3, // the stand-in is a wide winged beast (1,785 x 950): at 2.6 its wing tip reached the turn list
  'don-tonberry': 2.2,
  jormungand: 3.2,
  'earth-eater': 2.9, // the stand-in is a wide, heavy body: at 3.2 its right edge crossed the turn list's rail
  'greater-sphere': 3.0,
  catastrophe: 3.4,
  thuban: 2.9, // the Sanctuary Keeper painting it stands in with is the Spectral Keeper's 2.9 on this very stage
  neslug: 2.8,
  'ultima-buster': 3.4,
  [ULTIMA_BUSTER_HEAD_ID]: 1.3,
  [ULTIMA_BUSTER_ARM_LEFT_ID]: 1.1, // the stand-in is a wide bar (659 x 394): 1.8 made a 3 m beam
  [ULTIMA_BUSTER_ARM_RIGHT_ID]: 1.1,
};

/** This stage's staging: the Dome's (the party held on its slots) with every creature's spot and height. */
export const GAUNTLET_STAGING = {
  holdParty: true,
  enemySpots: GAUNTLET_SPOTS as Record<string, Spot>,
  figureHeights: GAUNTLET_HEIGHTS as Record<string, number>,
} as const;

/** The published slots, same shape every other scene exports (the registry row, `./experiment-scenes.ts`): the body's spot, then the Ultima Buster's three part slots. */
export const GAUNTLET_SLOTS: SceneSlots = {
  party: ZANARKAND_DOME_SLOTS.party.map((s) => [...s] as Spot),
  enemy: [BOSS_SPOT, GAUNTLET_SPOTS[ULTIMA_BUSTER_HEAD_ID], GAUNTLET_SPOTS[ULTIMA_BUSTER_ARM_LEFT_ID], GAUNTLET_SPOTS[ULTIMA_BUSTER_ARM_RIGHT_ID]].map((s) => [...s] as Spot),
  partyHeight: ZANARKAND_DOME_SLOTS.partyHeight,
  enemyHeight: GAUNTLET_HEIGHTS['ultima-buster'],
  ...GAUNTLET_STAGING,
};

/** The nine creatures the staging knows (the formations' bodies; a test pins that this is the data's list). */
export const GAUNTLET_STAGED_BODIES: readonly string[] = GAUNTLET_CREATURES;

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** `build` with some fields replaced; the getters (the backdrop that hot-swaps in a dev server) are copied as getters, so the scene still reads the live one. */
function derive(build: SceneBuild, over: Partial<Mutable<SceneBuild>>): SceneBuild {
  const out = Object.defineProperties(Object.create(Object.getPrototypeOf(build)) as object, Object.getOwnPropertyDescriptors(build)) as Mutable<SceneBuild>;
  Object.assign(out, over);
  return out;
}

/**
 * **The Dome for the Gauntlet**: Chapter II's scene with this chapter's staging in place of Yunalesca's. It owns no actors (`docs/ENGINE-API.md#scene-builder-contract`). Chapter II's staging is kept whole (the party held
 * on its slots: Bailey's pick for Chapters I to III, which this hidden variant shares) and the nine creatures' spots and heights are added to it.
 */
export const buildGauntletScene: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const base = await buildZanarkandDomeScene(opts);
  return derive(base, { enemySpots: GAUNTLET_STAGING.enemySpots, figureHeights: GAUNTLET_STAGING.figureHeights });
};
