import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots, Spot } from './index.ts';
import { ZANARKAND_DOME_SLOTS, buildZanarkandDomeScene } from './zanarkand-dome.ts';
import type { PartAnchor, PartAnchors } from '../engine/PartAnchors.ts';
import { SPECTRAL_ARMED_FLAG_PREFIX, SPECTRAL_CIRCLE_IDS, SPECTRAL_KEEPER_ID } from '../data/ffx/spectral-keeper-ids.ts';

// ---------------------------------------------------------------------------
// The Zanarkand Dome, the hidden Spectral Keeper's stage (FFX only)
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. The Keeper and its glyph platforms are FFX's (`research/re-ffx-spectral-keeper.md`; the paper preflight is `docs/plans/ch-keeper-review.md`).
//
// THE PAINTING IS CHAPTER II'S, REUSED (preflight SK2 (a), the recommended pick: 0 new plates, the platforms are props on the existing floor). The stage is the Dome as Chapter II builds it (`./zanarkand-dome.ts`): the same plate,
// lights, particles and seven camera rigs, the party held on its slots. Chapter II's scene file is not touched: this is a thin derivation of what `buildZanarkandDomeScene` builds, with the Keeper's spot and height and the seven
// Circles' anchors added. The painting is Yunalesca's great hall; in the game this fight is the room `dome02` (a stand-in, said so in the handoff).
//
// LAYOUT A, "the ring on the dais" (preflight section 7, the recommended target, `[estimate]` until a browser reads it): the Keeper stands in the middle of a hexagon of six glyphs, foreshortened by the camera, and the
// rock sits to the side. The game's ring is a 70-unit radius hexagon (`research/re-ffx-spectral-keeper.md` section 2.4, platforms 1 to 6 at 0, 60 ... degrees from the near point); here it is squeezed to fit the FFX HUD's safe area
// (the turn list from 0.843 of the canvas width, the party panel below 0.717, `docs/ENGINE-API.md#hud-safe-area`): the centre sits at x = 1.55, z = -4.6, the ring is 2.3 wide and 2.0 deep, the near glyph at the party's
// side. The party's own slots are Chapter II's (they do not walk between glyphs yet: the Move hop is an event, `platform`, that the presenter does not animate in this build).
//
// None of these numbers is the game's: the game gives only the hexagon's shape and its 70-unit radius (RE 2.4). They are checked in a browser by the job specs in `docs/handoff/ch-keeper.md`.

/** The ring's centre on the stage (the Keeper stands on it). */
const CENTRE: Spot = [1.55, 0, -4.6];
/** Half-width and half-depth of the squeezed hexagon. */
const RX = 2.3;
const RZ = 2.0;
/** A glyph ring's radius: under half the nearest spacing between two glyphs (2.0, platforms 2 and 3), so neighbouring rings never touch. `[estimate]`. */
export const GLYPH_RING_RADIUS = 0.8;

/**
 * The glyph anchors of platforms 1 to 6 (RE 2.4's table, game (x, z) = (0, 72), (64, 36), (64, -36), (0, -72), (-64, -36), (-64, 36), scaled to the stage): platform 1 is the near point, 2 and 3 on the right
 * (near, far), 4 the far point, 5 and 6 on the left (far, near). The rock is off to the right at the Keeper's depth.
 */
export const SPECTRAL_KEEPER_GLYPH_SPOTS: readonly Spot[] = [
  [CENTRE[0], 0, CENTRE[2] + RZ], // 1 near
  [CENTRE[0] + RX * 0.89, 0, CENTRE[2] + RZ * 0.5], // 2 right, near
  [CENTRE[0] + RX * 0.89, 0, CENTRE[2] - RZ * 0.5], // 3 right, far
  [CENTRE[0], 0, CENTRE[2] - RZ], // 4 far
  [CENTRE[0] - RX * 0.89, 0, CENTRE[2] - RZ * 0.5], // 5 left, far
  [CENTRE[0] - RX * 0.89, 0, CENTRE[2] + RZ * 0.5], // 6 left, near
  [CENTRE[0] + RX * 1.65, 0, CENTRE[2]], // 7 the aeon rock, to the side
];

/** Where the Keeper stands. */
export const SPECTRAL_KEEPER_ENEMY_SPOTS: Readonly<Record<string, Spot>> = { [SPECTRAL_KEEPER_ID]: CENTRE };

/**
 * The glyphs, figure-less (`SceneStaging.partAnchors`, the mechanism Vegnagun's Nodes use: 'overhead' mode, a world offset from the parent's feet): the stage draws no silhouette for a Circle, the target cursor and the turn
 * ring still find it, and the Circle follows the Keeper (its `flags.partOf`). **Each anchor asks for a floor ring** (`floorRing`, `PartAnchors.ts`): an overhead anchor draws nothing without one, so before this the platforms
 * were invisible (the review's major 1). A ring turns **amber while its Circle is armed** (`litFlag`, the engine's `plat.armed.<id>` flag): the only on-screen tell of a mine. The painting of the glyph (`spectral-glyph`, owed) replaces the ring when it exists. `[estimate]`, browser-checked by the job specs.
 */
export const SPECTRAL_KEEPER_PART_ANCHORS: PartAnchors = Object.fromEntries(
  SPECTRAL_CIRCLE_IDS.map((id, i) => {
    const spot = SPECTRAL_KEEPER_GLYPH_SPOTS[i] as Spot;
    return [id, { mode: 'overhead', offset: [spot[0] - CENTRE[0], 0, spot[2] - CENTRE[2]], floorRing: { radius: GLYPH_RING_RADIUS, litFlag: SPECTRAL_ARMED_FLAG_PREFIX + id } } as PartAnchor];
  }),
);

/** The Keeper's height: Yunalesca's third form's stand-in boss height, the stage's own (`ZANARKAND_DOME_HEIGHTS.boss`, 2.9) `[estimate]`: no stature row exists for m129 (preflight section 6). */
const KEEPER_HEIGHT = 2.9;

/** This stage's staging: Chapter II's (the party held on its slots) with the Keeper and the glyph anchors added. */
export const SPECTRAL_KEEPER_STAGING = {
  holdParty: true,
  enemySpots: SPECTRAL_KEEPER_ENEMY_SPOTS,
  partAnchors: SPECTRAL_KEEPER_PART_ANCHORS,
  figureHeights: { [SPECTRAL_KEEPER_ID]: KEEPER_HEIGHT } as Record<string, number>,
} as const;

/** The published slots, same shape every other scene exports (the registry row, `./experiment-scenes.ts`): the Keeper on slot 0, then the seven glyphs. */
export const SPECTRAL_KEEPER_SLOTS: SceneSlots = {
  party: ZANARKAND_DOME_SLOTS.party.map((s) => [...s] as Spot),
  enemy: [CENTRE, ...SPECTRAL_KEEPER_GLYPH_SPOTS].map((s) => [...s] as Spot),
  partyHeight: ZANARKAND_DOME_SLOTS.partyHeight,
  enemyHeight: KEEPER_HEIGHT,
  ...SPECTRAL_KEEPER_STAGING,
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** `build` with some fields replaced; the getters (the backdrop that hot-swaps in a dev server) are copied as getters, so the scene still reads the live one. */
function derive(build: SceneBuild, over: Partial<Mutable<SceneBuild>>): SceneBuild {
  const out = Object.defineProperties(Object.create(Object.getPrototypeOf(build)) as object, Object.getOwnPropertyDescriptors(build)) as Mutable<SceneBuild>;
  Object.assign(out, over);
  return out;
}

/**
 * **The Dome for the Spectral Keeper**: Chapter II's scene with this chapter's staging added to its own. It owns no actors (`docs/ENGINE-API.md#scene-builder-contract`). Chapter II's staging is kept whole (the party held on its
 * slots: Bailey's pick for Chapters I to III, which this hidden variant of II shares) and the Keeper's spot and the glyphs' anchors are added to it.
 */
export const buildSpectralKeeperScene: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const base = await buildZanarkandDomeScene(opts);
  return derive(base, { enemySpots: SPECTRAL_KEEPER_STAGING.enemySpots, partAnchors: SPECTRAL_KEEPER_STAGING.partAnchors, figureHeights: SPECTRAL_KEEPER_STAGING.figureHeights });
};
