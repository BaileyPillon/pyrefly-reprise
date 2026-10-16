import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots, Spot } from './index.ts';
import { DREAMS_END_SLOTS, buildDreamsEndScene } from './dreams-end.ts';
import { DREAMS_END_STAGING } from './dreams-end-giants.ts';

// ---------------------------------------------------------------------------
// Dream's End, the hidden Last Summoning's stage (FFX only)
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. The possession chain, Yojimbo and the Magus Sisters are FFX's (`docs/plans/ch-last-summoning-review.md`).
//
// THE PAINTING IS CHAPTER III'S, REUSED. The stage is Dream's End as Chapter III builds it (`backdrops/dreams-end`, `./dreams-end.ts`): the same plate, lights, fire, ruins and camera rigs, the party on the same
// held slots, the Yu Pagodas in the arrangement Bailey picked (`./dreams-end-giants.ts`), said so in the handoff. Chapter III's scene file is not touched: this is a thin derivation of what `buildDreamsEndScene`
// builds, with the enemy spots and heights of the aeons Chapter III never fields (Yojimbo, the three Magus Sisters, Anima). The five story aeons keep Chapter III's staging exactly (they are not named here): the
// possessed Valefor to Bahamut stand on the formation's first slot at the stage's own boss height, as they do in Chapter III.
//
// WHO STANDS WHERE (ours, `[estimate]`; no source gives a place on this stage). The party is Dream's End's (Tidus front left, Yuna front centre, Auron behind: `holdParty`). The enemy lane is the one Chapter III's
// formation uses, x from 0.6 to 4.0 and z from -4.0 to -7.4, inside the FFX HUD's safe area (its rail ends at 0.79 of the canvas width). The Sisters stand as the game lines them up (Mindy and Cindy to either side of
// Sandy, `research/re-ffx-last-summoning.md` section 1.3: Mindy at one lateral extreme, Sandy centre and a step nearer, Cindy at the other): Sandy in the middle, Cindy to the left and back, Mindy to the right and a
// little forward, so no Sister stands under the command menu (left) or the turn list (right).
//
// HEIGHTS (the party's shared height is Tidus's 1.8, `DREAMS_END_SLOTS.partyHeight`; `[estimate]`: the paintings' proportions against Tidus's, since "raw model heights are not proportions", the project's own note):
// Yojimbo is a man in a hat, a little taller than Auron; the Sisters tower over the party (Cindy 3.0, Sandy 3.4, Mindy 2.7 and hovering); Anima is a giant (5.2, a little above the stage's 4.2 boss height).

/** The party's shared world height on this stage: Dream's End's own (`DREAMS_END_SLOTS`). */
const PARTY_HEIGHT = DREAMS_END_SLOTS.partyHeight;

/** Where the aeons Chapter III never fields stand (the rest keep `DREAMS_END_STAGING`'s: the Pagodas and the party). */
export const LAST_SUMMONING_ENEMY_SPOTS: Readonly<Record<string, Spot>> = {
  'possessed-yojimbo': [2.05, 0, -4.0], // the formation's first slot, as every possessed aeon of Chapter III
  'possessed-anima': [2.05, 0, -4.0],
  'possessed-sandy': [2.35, 0, -5.4],
  'possessed-cindy': [1.0, 0, -6.4],
  'possessed-mindy': [3.6, 0, -4.1],
};

/** The heights of the same bodies. */
export const LAST_SUMMONING_FIGURE_HEIGHTS: Readonly<Record<string, number>> = {
  'possessed-yojimbo': 2.2,
  'possessed-anima': 5.2,
  'possessed-sandy': 3.4,
  'possessed-cindy': 3.0,
  'possessed-mindy': 2.7,
};

/** This stage's staging: Dream's End's (the party held on its slots, the Pagodas pinned and sized, the guide folded) with the new bodies' spots and heights added. */
export const LAST_SUMMONING_STAGING = {
  ...DREAMS_END_STAGING,
  enemySpots: { ...DREAMS_END_STAGING.enemySpots, ...LAST_SUMMONING_ENEMY_SPOTS },
  figureHeights: { ...DREAMS_END_STAGING.figureHeights, ...LAST_SUMMONING_FIGURE_HEIGHTS } as Record<string, number>,
} as const;

/** The published slots, same shape every other scene exports (the registry row, `./experiment-scenes.ts`). */
export const LAST_SUMMONING_SLOTS: SceneSlots = {
  party: DREAMS_END_SLOTS.party.map((s) => [...s] as Spot),
  enemy: DREAMS_END_SLOTS.enemy.map((s) => [...s] as Spot),
  partyHeight: PARTY_HEIGHT,
  enemyHeight: DREAMS_END_SLOTS.enemyHeight,
  ...LAST_SUMMONING_STAGING,
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** `build` with some fields replaced; the getters (the backdrop that hot-swaps in a dev server) are copied as getters, so the scene still reads the live one. */
function derive(build: SceneBuild, over: Partial<Mutable<SceneBuild>>): SceneBuild {
  const out = Object.defineProperties(Object.create(Object.getPrototypeOf(build)) as object, Object.getOwnPropertyDescriptors(build)) as Mutable<SceneBuild>;
  Object.assign(out, over);
  return out;
}

/**
 * **Dream's End for the Last Summoning**: Chapter III's scene with this chapter's staging added to its own. It owns no actors (`docs/ENGINE-API.md#scene-builder-contract`). Chapter III's staging is kept whole
 * (the Pagodas' pins and giant heights, the held party, the folded guide: Bailey's picks for Chapters I and III, which this hidden variant of III shares) and the new bodies are added to it.
 */
export const buildLastSummoningScene: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const base = await buildDreamsEndScene(opts);
  return derive(base, { enemySpots: LAST_SUMMONING_STAGING.enemySpots, figureHeights: LAST_SUMMONING_STAGING.figureHeights });
};
