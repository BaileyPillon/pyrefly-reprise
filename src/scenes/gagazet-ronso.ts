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
// STAGING. The brothers stand together right of Kimahri, **Yenke in front, Biran behind him and to the left**, both inside the FFX HUD's safe area (its rail ends at 0.79 of the canvas width; `docs/ENGINE-API.md#hud-safe-area`).
// Both brothers start on the same side of the arena in the game (Area 0, `research/re-ffx-biran-yenke.md` section 4); a Bulldoze moves the user to the other area, which the engine tracks
// (`battle/ffx/ai/biran-yenke-rules.ts`) and the stage does not draw: the other area is behind the camera. Kimahri stands on Chapter I's first party slot moved 0.79 to the left (the party is held on its slots: `holdParty`).
//
// WHO STANDS WHERE IS NOT FREE (two finds on the first-menu frame: the driver's in r49-rc, the focused review's F939-01 on the build that fixed it). The Sensor card (`ui/ffx/SensorPanel.ts`) is the one shared FFX read-out: pinned
// at grid (436, 166), slid left to clear the turn list's names (`ui/ffx/sensorCtbClear.ts`), 100 grid wide, it names the enemy the party's Sensor read LAST when the battle opens (`battle/ffx/sensor.ts#revealForSensorAuto`, the
// formation's own order: Biran, then Yenke), stays open seven seconds and opens again on every change of target. Measured on this stage in the browser, it covers x 1017 to 1314 and y 413 to 636 of a 1600x900 window and
// x 1245 to 1579, y 467 to 714 at 2000x1012: the HUD and the camera both scale with the window's height, so it is the same place in the picture at every window at least 16:9 wide. Its left edge never goes left of grid 406 (u 0.137 in the
// units of `tests/unit/chapters/biran-yenke-stage.test.ts`). The first build stood Biran under it (the chip read "YENKE RONSO" over the blond brother's head); r49-rc swapped the brothers so the chip sat over the brother it
// names, and its review found that the open card then hides Yenke completely. The ids and the paintings were right all along (each brother draws his own subject, `characters/<id>`, the turn list's portraits come from the same
// paintings): only the place was wrong. **The card is not this chapter's to move, so the brothers stand clear of it**: each one's whole picture ends left of that edge, at every window, with 30 px or more to spare at 1600x900.
// That leaves room for one figure beside Kimahri, not three (left of the card the screen holds about 230 px from his body to the card's edge, and a brother's picture is 150 wide), so Kimahri's slot also moves, 0.79 left of
// Chapter I's (x -2.1, still 60 px clear of the command stack at 1600x900): measured with Kimahri on Chapter I's slot, both brothers stood behind his head and shoulders, 50 to 80 percent of their pictures under his. The
// brothers stand shoulder to shoulder and overlap about half: the two stand guard for each other, which is also what the fight's first rule says. **Yenke, the brother the card names at the first menu, stands nearest it**, so the card
// rests beside the brother it names; while the player aims at Biran it names him and rests in the same place, clear of both (nothing for its steer to move). The target cursor opens on the LEFTMOST figure on screen
// (`ui/ffx/TargetCursor.ts#showSingle`), which is Biran, the brother the advisor's first tip names (Lancet -> Biran Ronso): the cursor and the tip agree. `tests/unit/chapters/biran-yenke-stage.test.ts` pins all of it; the frames
// are in `docs/screenshots/r50-rc/`.
//
// HEIGHTS. A Ronso stands at Kimahri's size (`research/visual-bible.md` section 1.22.4, `[single source]`: the base sheet is Kimahri's; `[estimate]`). His datamined height is 1.211 of Tidus's with the horn
// included (`data/ffx/party-stature.ts`); the brothers' paintings run horn tip to foot, so 1.211 of the party's shared height is the whole figure: 2.204 units against the party's 1.82.

/** The party's shared world height on this stage: Tidus's 1.82, the stage's own default (this scene publishes no `partyHeight`, `resolveSceneHeights`). */
const PARTY_HEIGHT = 1.82;
/** A Ronso brother, horn tip to foot: 1.211 of Tidus's (Kimahri's datamined top, horn included: `data/ffx/party-stature.ts`). */
const RONSO_HEIGHT = Math.round(PARTY_HEIGHT * 1.211 * 1000) / 1000;

/** Chapter I's three active party slots (`./gagazet.ts`): Kimahri takes the first, which is Chapter I's x -1.31 moved to -2.1 (the note above says why); the other two are Chapter I's and unused (Kimahri is alone). */
const PARTY_SLOTS: Spot[] = [
  [-2.1, 0, 1.55],
  [0.3, 0, 1.0],
  [-0.61, 0, -1.05],
];

/**
 * Where the brothers stand (`ENEMY_SPOTS` is the one place to move a body; read the note above before moving one: both pictures must end left of the Sensor card, Yenke nearest it, Biran the leftmost figure).
 * Biran's z (-3.9) and Yenke's z (-2.0) are the first build's, so each stands the size he did; only x moved (0.55 to -0.65 and 1.85 to -0.1). On the phone (390x844, no card) both stand whole, well inside both edges.
 */
const ENEMY_SPOTS: Record<string, Spot> = {
  [BIRAN_ID]: [-0.65, 0, -3.9],
  [YENKE_ID]: [-0.1, 0, -2.0],
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
