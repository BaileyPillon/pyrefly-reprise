import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots, Spot } from './index.ts';
import { buildMacalaniaTempleScene, MACALANIA_TEMPLE_SLOTS } from './macalania-temple.ts';
import { SPHERIMORPH_ID } from '../data/ffx/spherimorph-ids.ts';

// ---------------------------------------------------------------------------
// Macalania Woods, the spring (FFX): the hidden Spherimorph chapter's stage
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. Spherimorph (`research/re-ffx-spherimorph.md`; the paper preflight is `docs/plans/ch-spherimorph-review.md`).
//
// THE PAINTING IS THE TEMPLE'S, REUSED (preflight SP4 (a), the recommended pick: 0 new plates). The Woods have no plate of their own, so the stage is the Macalania Temple's antechamber (`backdrops/macalania-temple`,
// `./macalania-temple.ts`): same plate, lights, glitter, mirror ice and camera rigs, said so in the handoff. It is an icy blue hall, not a forest spring, and it is the NEXT place on the road, so it is a stand-in; a spring
// variant derived from the approved plate (SP4 (b)) or a new plate (SP4 (c)) waits for a mockup and Bailey's pick (rule 9). The Temple's scene file is not touched: this is a thin derivation of what
// `buildMacalaniaTempleScene` builds, with this fight's staging in place of Seymour's.
//
// The formation puts the party in a line and Spherimorph about 60 units off (`research/re-ffx-spherimorph.md` section 2); here the party stands on the Temple's three slots (Bailey's layout B of 2026-09-25, held) and
// Spherimorph on the spot that layout pins Seymour to, so the Temple's own light pool under him lines up with the figure and the spot is one the 1600x900 framing was measured with (`macalania-temple-layout.ts`).
//
// HEIGHT. No stature row exists for m121 (`data/ffx/fiend-stature.ts` is keyed by other monsters), so 3.0 is an `[estimate]`: a floating orb carrying its four spheres, a little over the party's height twice over. The job
// specs in `docs/handoff/ch-spherimorph.md` read it in a browser.

/** Spherimorph's spot: where Macalania's layout B pins Seymour (`./macalania-temple-layout.ts`), centre-right and back, inside the FFX HUD's safe area (the rail ends at 0.79 of the canvas width, `docs/ENGINE-API.md#hud-safe-area`). */
const SPHERIMORPH_SPOT: Spot = [2.5, 0, -5.8];

/** Spherimorph's world height (`[estimate]`: see the note above). */
export const SPHERIMORPH_HEIGHT = 3.0;

/** This fight's staging: the party held on the Temple's slots, Spherimorph pinned to its spot at its height. */
export const SPHERIMORPH_STAGING = {
  holdParty: true,
  enemySpots: { [SPHERIMORPH_ID]: SPHERIMORPH_SPOT } as Record<string, Spot>,
  figureHeights: { [SPHERIMORPH_ID]: SPHERIMORPH_HEIGHT } as Record<string, number>,
} as const;

/** The published slots, same shape every other scene exports (the registry row, `./experiment-scenes.ts`). */
export const SPHERIMORPH_SLOTS: SceneSlots = {
  party: MACALANIA_TEMPLE_SLOTS.party.map((s) => [...s] as Spot),
  enemy: [[...SPHERIMORPH_SPOT] as Spot],
  partyHeight: MACALANIA_TEMPLE_SLOTS.partyHeight,
  enemyHeight: SPHERIMORPH_HEIGHT,
  ...SPHERIMORPH_STAGING,
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** `build` with some fields replaced; the getters (the backdrop that hot-swaps in a dev server) are copied as getters, so the scene still reads the live one. */
function derive(build: SceneBuild, over: Partial<Mutable<SceneBuild>>): SceneBuild {
  const out = Object.defineProperties(Object.create(Object.getPrototypeOf(build)) as object, Object.getOwnPropertyDescriptors(build)) as Mutable<SceneBuild>;
  Object.assign(out, over);
  return out;
}

/**
 * **The spring for Spherimorph**: the Macalania Temple's scene with this fight's staging. It owns no actors (`docs/ENGINE-API.md#scene-builder-contract`). The Temple's own staging (the Guardians' and Seymour's pins) is
 * replaced, not added to: a floating orb is not a Guado.
 */
export const buildSpherimorphScene: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const base = await buildMacalaniaTempleScene(opts);
  const out = derive(base, {});
  return Object.assign(out, { holdParty: SPHERIMORPH_STAGING.holdParty, enemySpots: SPHERIMORPH_STAGING.enemySpots, figureHeights: SPHERIMORPH_STAGING.figureHeights });
};
