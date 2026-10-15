import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots, Spot } from './index.ts';
import { buildGagazetScene } from './gagazet.ts';
import { GAGAZET_STAGING } from './gagazet-giants.ts';
import { BIRAN_ID, YENKE_ID } from '../data/ffx/biran-yenke-ids.ts';

// ---------------------------------------------------------------------------
// Mt. Gagazet, the Mountain Gate (FFX): the hidden Biran and Yenke chapter's stage
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. Kimahri alone against the two Ronso brothers (`docs/plans/ch-biran-yenke-review.md`).
//
// THE PAINTING IS CHAPTER I'S, REUSED. No painting of the Mountain Gate exists, so the stage is the night valley with the moon that Seymour Flux is fought in (`backdrops/gagazet`, `./gagazet.ts`): same plate,
// same lights, snow, mist, rocks and camera rigs, said so in the handoff. It is the provisional stand-in; the gate itself is Bailey's to commission. Chapter I's scene file is not touched: this is a thin
// derivation of what `buildGagazetScene` builds, with this fight's staging in place of Seymour Flux's (his and Mortiorchis's pins and giant heights belong to Chapter I's fight, not to two Ronso).
//
// STAGING. Kimahri stands on Chapter I's first party slot (the party is held on its slots: `holdParty`). The brothers stand right of centre, Biran in front, Yenke behind and to the left of him, both inside the
// FFX HUD's safe area (its rail ends at 0.79 of the canvas width; `docs/ENGINE-API.md#hud-safe-area`). Both brothers start on the same side of the arena in the game (Area 0, `research/re-ffx-biran-yenke.md`
// section 4); a Bulldoze moves the user to the other area, which the engine tracks (`battle/ffx/ai/biran-yenke-rules.ts`) and the stage does not draw: the other area is behind the camera.
//
// HEIGHTS. A Ronso stands at Kimahri's size (`research/visual-bible.md` section 1.22.4, `[single source]`: the base sheet is Kimahri's; `[estimate]`). His datamined height is 1.211 of Tidus's with the horn
// included (`data/ffx/party-stature.ts`); the brothers' paintings run horn tip to foot, so 1.211 of the party's shared height is the whole figure: 2.204 units against the party's 1.82.

/** The party's shared world height on this stage: Tidus's 1.82, the stage's own default (this scene publishes no `partyHeight`, `resolveSceneHeights`). */
const PARTY_HEIGHT = 1.82;
/** A Ronso brother, horn tip to foot: 1.211 of Tidus's (Kimahri's datamined top, horn included: `data/ffx/party-stature.ts`). */
const RONSO_HEIGHT = Math.round(PARTY_HEIGHT * 1.211 * 1000) / 1000;

/** Chapter I's three active party slots (`./gagazet.ts`): Kimahri takes the first. */
const PARTY_SLOTS: Spot[] = [
  [-1.31, 0, 1.55],
  [0.3, 0, 1.0],
  [-0.61, 0, -1.05],
];

/** Where the brothers stand (`ENEMY_SPOTS` is the one place to move a body). */
const ENEMY_SPOTS: Record<string, Spot> = {
  [BIRAN_ID]: [1.85, 0, -2.0], // 2.15 in the first build: the phone rig (390 wide) cropped his mane at the right edge in the browser proof, so he stands 0.3 nearer the middle
  [YENKE_ID]: [0.55, 0, -3.9],
};

/** This fight's staging: the party held on its slots, each brother pinned to his spot at the Ronso height. */
export const GAGAZET_RONSO_STAGING = {
  holdParty: true,
  enemySpots: ENEMY_SPOTS,
  figureHeights: { [BIRAN_ID]: RONSO_HEIGHT, [YENKE_ID]: RONSO_HEIGHT } as Record<string, number>,
} as const;

/** The published slots, same shape every other scene exports (the registry row, `./experiment-scenes.ts`). */
export const GAGAZET_RONSO_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.map((s) => [...s] as Spot),
  enemy: [ENEMY_SPOTS[BIRAN_ID]!, ENEMY_SPOTS[YENKE_ID]!, [3.35, 0, -6.6]].map((s) => [...s] as Spot),
  partyHeight: PARTY_HEIGHT,
  enemyHeight: 4.1, // the stage default; the brothers' own heights are pinned below
  ...GAGAZET_RONSO_STAGING,
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** `build` with some fields replaced; the getters (the backdrop that hot-swaps in a dev server) are copied as getters, so the scene still reads the live one. */
function derive(build: SceneBuild, over: Partial<Mutable<SceneBuild>>): SceneBuild {
  const out = Object.defineProperties(Object.create(Object.getPrototypeOf(build)) as object, Object.getOwnPropertyDescriptors(build)) as Mutable<SceneBuild>;
  Object.assign(out, over);
  return out;
}

/**
 * **The Mountain Gate**: Chapter I's Mt. Gagazet scene with this fight's staging. It owns no actors (`docs/ENGINE-API.md#scene-builder-contract`).
 * Chapter I's own staging (Seymour Flux's and Mortiorchis's pins and heights, the folded guide) is replaced, not added to: two Ronso are not giants, and the guide opens as in every other fight.
 */
export const buildGagazetRonsoScene: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const base = await buildGagazetScene(opts);
  const out = derive(base, {
    partySlots: base.partySlots.map((s, i) => (i < PARTY_SLOTS.length ? s.clone().set(...PARTY_SLOTS[i]!) : s)),
    enemySlots: base.enemySlots.map((s, i) => (i === 0 ? s.clone().set(...ENEMY_SPOTS[BIRAN_ID]!) : i === 1 ? s.clone().set(...ENEMY_SPOTS[YENKE_ID]!) : s)),
  });
  // Chapter I's staging is REPLACED, not added to: every key its staging names is dropped (the giants' pins and heights, and the folded guide that is Bailey's pick for Chapters I and III only), then this
  // fight's own are set, so the guide opens as in every other fight. Dropping by Chapter I's own key list, not by name, keeps a key it adds later out of this scene too (and keeps this file from
  // naming the fold, which `tests/unit/ui-ffx-guide-folded-scenes.test.ts` allows only the type, its copier and the two giants' staging files to do).
  for (const key of Object.keys(GAGAZET_STAGING)) delete (out as unknown as Record<string, unknown>)[key];
  return Object.assign(out, { holdParty: GAGAZET_RONSO_STAGING.holdParty, enemySpots: GAGAZET_RONSO_STAGING.enemySpots, figureHeights: GAGAZET_RONSO_STAGING.figureHeights });
};
