import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneEntry, SceneSlots, Spot } from './index.ts';
import { buildDemoScene } from './demo.ts';
import { buildMacalaniaTempleScene, MACALANIA_TEMPLE_ACTOR_HEIGHTS, MACALANIA_TEMPLE_SLOTS } from './macalania-temple.ts';
import { LAKE_GUARDIAN_A_ID, LAKE_GUARDIAN_B_ID, WENDIGO_ID, WENDIGO_SCENE } from '../data/ffx/wendigo-ids.ts';

// ---------------------------------------------------------------------------
// Lake Macalania (FFX): the hidden Wendigo chapter's stage, today a STAND-IN
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. Wendigo and the two Guado Guardians (`research/re-ffx-wendigo-lake-macalania.md`; the paper preflight is `docs/plans/ch-wendigo-review.md`).
//
// THE STAGE IS CHAPTER VII'S, REUSED (the preflight's "temple plate stand-in", PLAN row 49: no plate exists for the lake). It is the Macalania Temple's antechamber, the same snows and the same mirror ice, with Seymour's three
// enemy spots taken by this fight's three: Chapter VII's picked party layout B is kept (Bailey, 2026-09-25: the party stands clear of the FFX command stack) and the enemy line is Guardian A, Wendigo, Guardian B, in the
// formation's order (actors 20, 21, 22). Chapter VII's scene file is not touched: this is a thin derivation of what `buildMacalaniaTempleScene` builds. Anima's arrival director is keyed to her own combatant and is inert here.
//
// **This is the placeholder the Meshy 3D stage replaces.** The next lane registers the hidden 3D engine's own stage for `wendigo-lake` through the same scene key (`./experiment-scenes.ts` names the row; a 3D chapter's
// factory replaces this one and keeps `WENDIGO_LAKE_SLOTS`); nothing about the fight, the door or the data changes when it does. Until then the figures are the painted ones: the Temple's Guardian painting twice, and
// Wendigo's procedural silhouette (no painting exists for it; the presenter draws one when the art manifest has no key).
//
// HEIGHTS (presentation, not game data: rule 6). The game draws Wendigo **1.55 times Tidus** and the Guardian **1.08 times** (`research/re-ffx-wendigo-lake-macalania.md` 1.1 and 1.3, from the size table's drawn heights), so on this
// stage's Tidus of 1.75 they stand 2.71 and 1.89 (the Temple's own Guardian is 1.85).

/** The party's shared world height on this stage: Chapter VII's Tidus, 1.75. */
const PARTY_HEIGHT = MACALANIA_TEMPLE_ACTOR_HEIGHTS.tidus;

/** Wendigo as a multiple of Tidus (the size table's drawn heights: 28.07 against Tidus's 18.15, a measured fact, `research/re-ffx-wendigo-lake-macalania.md` 1.1; its design height E, 26.4, is not what is drawn). */
export const WENDIGO_OVER_TIDUS = 1.55;
/** The Guardian as a multiple of Tidus (19.58 against 18.15). */
export const GUARDIAN_OVER_TIDUS = 1.08;

/** Wendigo's and the Guardian's world heights on this stage. */
export const WENDIGO_HEIGHT = Math.round(PARTY_HEIGHT * WENDIGO_OVER_TIDUS * 100) / 100;
export const LAKE_GUARDIAN_HEIGHT = Math.round(PARTY_HEIGHT * GUARDIAN_OVER_TIDUS * 100) / 100;

/** Chapter VII's picked party layout B, kept: the three in front, the bench off frame-left (`macalania-temple.ts` `MACALANIA_TEMPLE_SLOTS`). */
const PARTY_SLOTS: Spot[] = MACALANIA_TEMPLE_SLOTS.party.map((s) => [...s] as Spot);

/** Where the three stand, in the formation's order (Guardian A, Wendigo, Guardian B): layout B's three enemy spots, Wendigo on Seymour's focal point. */
const ENEMY_SPOTS: Readonly<Record<string, Spot>> = {
  [LAKE_GUARDIAN_A_ID]: [1.0, 0, -3.6],
  [WENDIGO_ID]: [2.5, 0, -5.8],
  [LAKE_GUARDIAN_B_ID]: [3.6, 0, -1.8],
};

/** This fight's staging: the party held on its slots, the three pinned to their spots at their heights. */
export const WENDIGO_LAKE_STAGING = {
  holdParty: true,
  enemySpots: ENEMY_SPOTS as Record<string, Spot>,
  figureHeights: { [WENDIGO_ID]: WENDIGO_HEIGHT, [LAKE_GUARDIAN_A_ID]: LAKE_GUARDIAN_HEIGHT, [LAKE_GUARDIAN_B_ID]: LAKE_GUARDIAN_HEIGHT } as Record<string, number>,
} as const;

/** The published slots, same shape every other scene exports (the registry row, `./experiment-scenes.ts`): enemy index = the formation's `slot` field (0 Guardian A, 1 Wendigo, 2 Guardian B). */
export const WENDIGO_LAKE_SLOTS: SceneSlots = {
  party: PARTY_SLOTS,
  enemy: [ENEMY_SPOTS[LAKE_GUARDIAN_A_ID], ENEMY_SPOTS[WENDIGO_ID], ENEMY_SPOTS[LAKE_GUARDIAN_B_ID]].map((s) => [...(s as Spot)] as Spot),
  partyHeight: PARTY_HEIGHT,
  enemyHeight: WENDIGO_HEIGHT,
  ...WENDIGO_LAKE_STAGING,
};

/** The scene-table row (the anime chapter's pattern, `./exp-anime-stage.ts` `EXP_ANIME_SCENE_ENTRY`): real (the factory wins); `build` is the unreachable demo diorama, as for every scene with a factory of its own. The 3D stage that replaces this one keeps this row's key and slots. */
export const WENDIGO_SCENE_ENTRY: SceneEntry = {
  key: WENDIGO_SCENE,
  title: 'Lake Macalania — Wendigo',
  build: buildDemoScene,
  slots: WENDIGO_LAKE_SLOTS,
  placeholder: false,
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** `build` with some fields replaced; the getters (the backdrop that hot-swaps in a dev server) are copied as getters, so the scene still reads the live one. */
function derive(build: SceneBuild, over: Partial<Mutable<SceneBuild>>): SceneBuild {
  const out = Object.defineProperties(Object.create(Object.getPrototypeOf(build)) as object, Object.getOwnPropertyDescriptors(build)) as Mutable<SceneBuild>;
  Object.assign(out, over);
  return out;
}

/**
 * **The lake for Wendigo**: Chapter VII's Macalania Temple scene with this fight's staging. It owns no actors (`docs/ENGINE-API.md#scene-builder-contract`). Chapter VII's own enemy pins (Seymour's and the Temple
 * Guardians') are replaced, not added to.
 */
export const buildWendigoLakeScene: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const base = await buildMacalaniaTempleScene(opts);
  const out = derive(base, {});
  return Object.assign(out, { holdParty: WENDIGO_LAKE_STAGING.holdParty, enemySpots: WENDIGO_LAKE_STAGING.enemySpots, figureHeights: WENDIGO_LAKE_STAGING.figureHeights });
};
