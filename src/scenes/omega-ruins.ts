import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots, Spot } from './index.ts';
import { buildCavernStolenFaythScene, CAVERN_STOLEN_FAYTH_SLOTS } from './cavern-stolen-fayth.ts';
import { NEMESIS_ID, OMEGA_WEAPON_ID, ULTIMA_WEAPON_ID } from '../data/ffx/omega-ruins-ids.ts';

// ---------------------------------------------------------------------------
// The Omega Ruins (FFX): the hidden Omega Ruins chapter's stage
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. Ultima Weapon, Omega Weapon and Nemesis (`research/re-ffx-omega-ultima-nemesis.md`; the paper preflight is `docs/plans/ch-weapon-review.md`).
//
// THE PAINTING IS THE CAVERN'S, REUSED (preflight WP5 (a), the first build: 0 new plates). The Omega Ruins have no plate of their own; the nearest approved plate is the Cavern of the Stolen Fayth, a dark cave with shafts of
// cold light and a glowing ring platform on the floor (`backdrops/cavern-stolen-fayth`, `./cavern-stolen-fayth.ts`): same plate, lights, mist, pad glow and camera rigs, said so in the handoff. It is a stand-in; the plate relit per act
// (WP5 (b)) and a plate of its own (WP5 (c)) wait for a mockup and Bailey's pick (rule 9). Chapter IX's scene file is not touched: this is a thin derivation of what `buildCavernStolenFaythScene` builds, with this chapter's
// staging in place of Yojimbo's (his arrival and Lady Ginnem's glow belong to Chapter IX's fight and find no figure of theirs here, so they idle).
//
// ONE STAGE, THREE ACTS. The chapter is a chain (Ultima Weapon, Omega Weapon, Nemesis) and a chain keeps one scene: the three groups share this stage and plate. The game stages Ultima Weapon and Nemesis in one place with the party on
// the left, and Omega Weapon in a second place with the party on the right (RE 2); the chapter keeps one camera for all three.
//
// THE HEIGHTS ARE ESTIMATES (no stature row exists for m99, m100 or m276; `data/ffx/fiend-stature.ts` is keyed by other monsters): the party stands 1.75, and the three bosses are drawn as large machines and a colossus against it, a
// little under what the plate's rigs can frame (the Cavern rigs hold a 2.6 Yojimbo). They are read in the browser jobs of `docs/handoff/ch-omega-ruins.md`. All three stand on the one spot, in the column between the party and the
// back wall, since they are never on the field together.

/** The party's shared world height on this stage: Tidus's 1.75, the Cavern's own. */
const PARTY_HEIGHT = 1.75;

/** Where the boss stands, for every act: behind Yojimbo's spot, so a larger body does not cover the party. */
const BOSS_SPOT: Spot = [2.4, 0, -4.4];

/** The three bodies' world heights (`[estimate]`: see the note above). */
export const OMEGA_RUINS_HEIGHTS = { [ULTIMA_WEAPON_ID]: 3.4, [OMEGA_WEAPON_ID]: 3.8, [NEMESIS_ID]: 4.4 } as const;

/** This chapter's staging: the party held on the Cavern's slots, the boss pinned to its spot at its height. */
export const OMEGA_RUINS_STAGING = {
  holdParty: true,
  enemySpots: { [ULTIMA_WEAPON_ID]: BOSS_SPOT, [OMEGA_WEAPON_ID]: BOSS_SPOT, [NEMESIS_ID]: BOSS_SPOT } as Record<string, Spot>,
  figureHeights: { ...OMEGA_RUINS_HEIGHTS } as Record<string, number>,
} as const;

/** The published slots, same shape every other scene exports (the registry row, `./experiment-scenes.ts`). */
export const OMEGA_RUINS_SLOTS: SceneSlots = {
  party: CAVERN_STOLEN_FAYTH_SLOTS.party.map((s) => [...s] as Spot),
  enemy: [[...BOSS_SPOT] as Spot],
  partyHeight: PARTY_HEIGHT,
  enemyHeight: OMEGA_RUINS_HEIGHTS[NEMESIS_ID],
  ...OMEGA_RUINS_STAGING,
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** `build` with some fields replaced; the getters (the backdrop that hot-swaps in a dev server) are copied as getters, so the scene still reads the live one. */
function derive(build: SceneBuild, over: Partial<Mutable<SceneBuild>>): SceneBuild {
  const out = Object.defineProperties(Object.create(Object.getPrototypeOf(build)) as object, Object.getOwnPropertyDescriptors(build)) as Mutable<SceneBuild>;
  Object.assign(out, over);
  return out;
}

/**
 * **The Omega Ruins**: the Cavern of the Stolen Fayth's scene with this chapter's staging. It owns no actors (`docs/ENGINE-API.md#scene-builder-contract`). The Cavern's own staging (Yojimbo's, Daigoro's and Lady Ginnem's spots and
 * heights) is replaced, not added to.
 */
export const buildOmegaRuinsScene: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const base = await buildCavernStolenFaythScene(opts);
  const out = derive(base, { enemySlots: base.enemySlots.slice(0, 1).map(() => base.enemySlots[0]!.clone().set(BOSS_SPOT[0], BOSS_SPOT[1], BOSS_SPOT[2])), enemyHeight: OMEGA_RUINS_SLOTS.enemyHeight });
  return Object.assign(out, { holdParty: OMEGA_RUINS_STAGING.holdParty, enemySpots: OMEGA_RUINS_STAGING.enemySpots, figureHeights: OMEGA_RUINS_STAGING.figureHeights });
};
