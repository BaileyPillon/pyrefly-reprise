import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots, Spot } from './index.ts';
import { buildMushroomRockRoadScene, MUSHROOM_SLOTS } from './mushroom-rock-road.ts';
import { LUCA_CRANE_ID, OBLITZERATOR_ID } from '../data/ffx/oblitzerator-ids.ts';

// ---------------------------------------------------------------------------
// Luca, the Number 4 Dock (FFX): the hidden Oblitzerator chapter's stage
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. The Oblitzerator and the dock crane (`research/re-ffx-oblitzerator-crane.md`; the paper preflight is `docs/plans/ch-oblitzerator-review.md`).
//
// THE PAINTING IS THE COAST ROAD'S, REUSED (preflight OB4 (c), the stand-in: 0 new plates). The Number 4 Dock has no plate of its own (the newest art mirror holds nothing named for Luca or a harbour); the nearest approved
// plate is the Mushroom Rock Road's, a sea-cliff road under daylight with a crane and a cage painted in it (`backdrops/mushroom-rock-road`, `./mushroom-rock-road.ts`): same plate, lights, ground and camera rigs, said so in the
// handoff. It is a stand-in; the recommended pick, a new dock plate with the crane as a two-state overlay (OB4 (b)), waits for a mockup and Bailey's pick (rule 9). The Mushroom Rock Road's scene file is not touched: this is a
// thin derivation of what `buildMushroomRockRoadScene` builds, with this fight's staging in place of Sinspawn Gui's.
//
// STAGING. The game puts the party in a row with the Oblitzerator straight ahead of it (a little left of the middle) and the crane to the party's right and slightly behind (`research/re-ffx-oblitzerator-crane.md` 2). Here the
// party stands on the road's three slots (held), the Oblitzerator in front of them and the crane at the right, behind it, left of the HUD's rail (the rail begins at about 0.79 of the canvas width, `docs/ENGINE-API.md#hud-safe-area`;
// the crane's foot is at x 4.8, which the idle rig draws at about 0.69). Both heights are `[estimate]`s (no stature row exists for m110 or m133; `data/ffx/fiend-stature.ts` is keyed by other monsters): the machine a little taller
// than the party, the crane a tower over it. The job specs in `docs/handoff/ch-oblitzerator.md` read them in a browser.

/** The Oblitzerator's spot: in front of the party, a little left of the middle. */
const OBLITZERATOR_SPOT: Spot = [0.9, 0, -2.6];

/** The crane's spot: to the party's right and behind the machine, inside the HUD's safe area. */
const CRANE_SPOT: Spot = [4.8, 0, -4.2];

/** The two bodies' world heights (`[estimate]`: see the note above). */
export const LUCA_DOCK_HEIGHTS = { [OBLITZERATOR_ID]: 2.8, [LUCA_CRANE_ID]: 4.6 } as const;

/** This fight's staging: the party held on the road's slots, the machine and the crane pinned to their spots at their heights. */
export const LUCA_DOCK_STAGING = {
  holdParty: true,
  enemySpots: { [OBLITZERATOR_ID]: OBLITZERATOR_SPOT, [LUCA_CRANE_ID]: CRANE_SPOT } as Record<string, Spot>,
  figureHeights: { ...LUCA_DOCK_HEIGHTS } as Record<string, number>,
} as const;

/** The published slots, same shape every other scene exports (the registry row, `./experiment-scenes.ts`): the machine is slot 0, the crane slot 1 (each record's `slot`). */
export const LUCA_DOCK_SLOTS: SceneSlots = {
  party: MUSHROOM_SLOTS.party.map((s) => [...s] as Spot),
  enemy: [[...OBLITZERATOR_SPOT] as Spot, [...CRANE_SPOT] as Spot],
  partyHeight: MUSHROOM_SLOTS.partyHeight,
  enemyHeight: LUCA_DOCK_HEIGHTS[OBLITZERATOR_ID],
  ...LUCA_DOCK_STAGING,
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** `build` with some fields replaced; the getters (the backdrop that hot-swaps in a dev server) are copied as getters, so the scene still reads the live one. */
function derive(build: SceneBuild, over: Partial<Mutable<SceneBuild>>): SceneBuild {
  const out = Object.defineProperties(Object.create(Object.getPrototypeOf(build)) as object, Object.getOwnPropertyDescriptors(build)) as Mutable<SceneBuild>;
  Object.assign(out, over);
  return out;
}

/**
 * **The dock for the Oblitzerator**: the Mushroom Rock Road's scene with this fight's staging. It owns no actors (`docs/ENGINE-API.md#scene-builder-contract`). The road's own staging (Sinspawn Gui's body, head and arms) is
 * replaced, not added to: a blitzball machine is not a fiend.
 */
export const buildLucaDockScene: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const base = await buildMushroomRockRoadScene(opts);
  const out = derive(base, { enemyHeight: LUCA_DOCK_SLOTS.enemyHeight });
  return Object.assign(out, { holdParty: LUCA_DOCK_STAGING.holdParty, enemySpots: LUCA_DOCK_STAGING.enemySpots, figureHeights: LUCA_DOCK_STAGING.figureHeights });
};
