import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots, Spot } from './index.ts';
import { buildGagazetScene } from './gagazet.ts';
import { GAGAZET_STAGING } from './gagazet-giants.ts';
import { SANCTUARY_KEEPER_ID } from '../data/ffx/sanctuary-keeper-ids.ts';

// ---------------------------------------------------------------------------
// Mt. Gagazet, the summit (FFX): the hidden Sanctuary Keeper chapter's stage
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. The Sanctuary Keeper (`research/re-ffx-sanctuary-keeper.md`; the paper preflight is `docs/plans/ch-beast-review.md`).
//
// THE PAINTING IS CHAPTER I'S, REUSED (preflight SK4 (a), the recommended pick: 0 new plates). The summit region has no plate of its own, so the stage is the night valley with the moon that Seymour Flux is fought in
// (`backdrops/gagazet`, `./gagazet.ts`): same plate, lights, snow, mist, rocks and camera rigs, said so in the handoff. It is a stand-in; a summit variant derived from the approved plate (SK4 (b)) waits for a mockup and Bailey's
// pick (rule 9). Chapter I's scene file is not touched: this is a thin derivation of what `buildGagazetScene` builds, with this fight's staging in place of Seymour Flux's (his and Mortiorchis's pins and giant heights belong
// to Chapter I's fight, not to a beast).
//
// The formation puts the party in a line and the Keeper about 100 units off (`research/re-ffx-sanctuary-keeper.md` section 2); the four "areas" the script writes at the HP lines share every coordinate, so one stage serves the
// whole fight and the area changes are camera cues (SK6), not built yet. Here the party stands on Chapter I's three slots (held, `holdParty`) and the Keeper on Chapter I's boss spot (centre-right, inside the FFX HUD's safe
// area: the rail ends at 0.79 of the canvas width, `docs/ENGINE-API.md#hud-safe-area`).
//
// HEIGHT. No stature row exists for m128 (`data/ffx/fiend-stature.ts` is keyed by other monsters), so 3.8 is an `[estimate]`: a winged beast with a long tail, a little under the stage's default boss (4.1) because a wing
// span adds width, not height. The job specs in `docs/handoff/ch-sanctuary-keeper.md` read it in a browser.

/** The party's shared world height on this stage: Tidus's 1.82, the stage's own default (this scene publishes no `partyHeight`). */
const PARTY_HEIGHT = 1.82;

/** Chapter I's three active party slots (`./gagazet.ts`): unchanged, the party is held on them. */
const PARTY_SLOTS: Spot[] = [
  [-1.31, 0, 1.55],
  [0.3, 0, 1.0],
  [-0.61, 0, -1.05],
];

/** Chapter I's boss spot (`./gagazet.ts` `ENEMY_SLOTS[0]`): centre-right, clear of the turn list. */
const KEEPER_SPOT: Spot = [1.95, 0, -2.45];

/** The Keeper's world height (`[estimate]`: see the note above). */
export const SANCTUARY_KEEPER_HEIGHT = 3.8;

/** This fight's staging: the party held on its slots, the Keeper pinned to its spot at its height. */
export const SANCTUARY_KEEPER_STAGING = {
  holdParty: true,
  enemySpots: { [SANCTUARY_KEEPER_ID]: KEEPER_SPOT } as Record<string, Spot>,
  figureHeights: { [SANCTUARY_KEEPER_ID]: SANCTUARY_KEEPER_HEIGHT } as Record<string, number>,
} as const;

/** The published slots, same shape every other scene exports (the registry row, `./experiment-scenes.ts`). */
export const SANCTUARY_KEEPER_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.map((s) => [...s] as Spot),
  enemy: [[...KEEPER_SPOT] as Spot],
  partyHeight: PARTY_HEIGHT,
  enemyHeight: SANCTUARY_KEEPER_HEIGHT,
  ...SANCTUARY_KEEPER_STAGING,
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** `build` with some fields replaced; the getters (the backdrop that hot-swaps in a dev server) are copied as getters, so the scene still reads the live one. */
function derive(build: SceneBuild, over: Partial<Mutable<SceneBuild>>): SceneBuild {
  const out = Object.defineProperties(Object.create(Object.getPrototypeOf(build)) as object, Object.getOwnPropertyDescriptors(build)) as Mutable<SceneBuild>;
  Object.assign(out, over);
  return out;
}

/**
 * **The summit for the Sanctuary Keeper**: Chapter I's Mt. Gagazet scene with this fight's staging. It owns no actors (`docs/ENGINE-API.md#scene-builder-contract`). Chapter I's own staging (Seymour Flux's and
 * Mortiorchis's pins and heights, the folded guide) is replaced, not added to: a beast is not a giant, and the guide opens as in every other fight.
 */
export const buildSanctuaryKeeperScene: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const base = await buildGagazetScene(opts);
  const out = derive(base, {});
  // Chapter I's staging is REPLACED, not added to: every key its staging names is dropped (the giants' pins and heights, and the folded guide that is Bailey's pick for Chapters I and III only), then this fight's own
  // are set, so the guide opens as in every other fight (the same rule, and the same reason, as `./gagazet-ronso.ts`).
  for (const key of Object.keys(GAGAZET_STAGING)) delete (out as unknown as Record<string, unknown>)[key];
  return Object.assign(out, { holdParty: SANCTUARY_KEEPER_STAGING.holdParty, enemySpots: SANCTUARY_KEEPER_STAGING.enemySpots, figureHeights: SANCTUARY_KEEPER_STAGING.figureHeights });
};
