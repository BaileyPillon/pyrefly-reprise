import type { SceneStaging } from './types.ts';
import { SECTOR1_DESK, SECTOR1_PHONE, sector1Layout, sector1Staging, type Sector1Layout } from './sector1-reactor-staging.ts';
import { JENOVA_LIFE_ID } from '../data/ff7/jenova-life-ids.ts';

// ---------------------------------------------------------------------------
// The altar of the Forgotten Capital: FF7's battle staging for Jenova LIFE (FF7 only)
// ---------------------------------------------------------------------------
//
// Game case: FF7 only [AGENTS.md rule 14]. The hidden Jenova LIFE chapter (`src/data/chapter-ff7-jenova-life.ts`, number 44).
// No FFX or FFX-2 scene reads this module.
//
// **A STAND-IN FIELD.** The altar has no painting yet (`docs/handoff/ch-jenova-life.md` section 6 lists it), so this fight is staged on the Guard Scorpion's field: the same fixed camera, the same plate plane and the
// same F1 opening, D1 and G1 rigs (`./sector1-reactor-staging.ts`), with the third member's spot, Jenova's height and a boss spot that are this fight's own. Every number is **our estimate** (presentation, not game
// data, rule 6) until the altar plate is painted and the frame is solved to it (preflight section 5, options a to c; the end state is Bailey's pick, hard rule 9). The party stands on the LEFT facing screen-right and
// Jenova on the RIGHT facing screen-left (Bailey's D-262, kept for every FF7 chapter); nothing is mirrored.
//
// Slots: 0 Cloud (downstage, in front), 1 Tifa (nearest the camera, in front), 2 Barret (upstage-left; he starts in the BACK row, one more step left). The three spots are the reactor frame's three front spots, reordered
// so Tifa takes the nearer one and Barret the upstage one he has in the Guard Scorpion frame.

type Spot = readonly [number, number, number];

/** The reactor frame's front spots in this fight's slot order: Cloud, Tifa, Barret. */
function slots(l: Sector1Layout): readonly Spot[] {
  return [l.front[0]!, l.front[2]!, l.front[1]!];
}

/** Jenova stands where the Guard Scorpion's rear foot does, so the shared camera rigs (the F1 opening, D1 and G1) still look at her. */
export const FORGOTTEN_CAPITAL_DESK: Sector1Layout = { ...SECTOR1_DESK, front: slots(SECTOR1_DESK), bossFront: 1.0 };
/**
 * The upright phone's drawn-in formation (E1), **our estimate** (the first look at 390x844, 2026-11-07, showed the reactor frame's reordered spots cropping Tifa and Barret at the left edge, so they stand further right and Barret
 * further upstage; the field is 5.3 world units wide at Cloud's depth, so a figure at the edge needs its centre 0.6 to 0.7 inside it). Cloud keeps his spot; Tifa stands nearest the camera, Barret upstage behind the two.
 */
export const FORGOTTEN_CAPITAL_PHONE: Sector1Layout = {
  ...SECTOR1_PHONE,
  front: [SECTOR1_PHONE.front[0]!, [-1.65, 0, 1.9], [-1.55, 0, -1.5]],
  bossFront: 0.6,
};

/** The layout for a frame of this aspect (a portrait frame is the phone's). */
export function forgottenCapitalLayout(aspect: number): Sector1Layout {
  return aspect > 0 && aspect < 1 ? FORGOTTEN_CAPITAL_PHONE : FORGOTTEN_CAPITAL_DESK;
}

/** World heights, one per combatant. Cloud and Barret are the Film set's (`SECTOR1_HEIGHTS`); Tifa a little under Cloud and Jenova a head and a half over him are our estimates. */
export const FORGOTTEN_CAPITAL_HEIGHTS = { cloud: 1.95, tifa: 1.85, barret: 2.35, [JENOVA_LIFE_ID]: 3.0 } as const;

/**
 * The layout of the FF7 fight whose boss is `enemyId` (the first enemy of the battle state): this fight's for Jenova LIFE,
 * the Guard Scorpion's reactor field for everything else (so the Guard Scorpion chapter reads exactly what it always read).
 */
export function ff7LayoutFor(enemyId: string | undefined, aspect: number): Sector1Layout {
  return enemyId === JENOVA_LIFE_ID ? forgottenCapitalLayout(aspect) : sector1Layout(aspect);
}

/** This fight's staging switches: the reactor's, with Jenova pinned to the boss spot at her height and the third member's height added. */
export function forgottenCapitalStaging(layout: Sector1Layout = FORGOTTEN_CAPITAL_DESK): SceneStaging {
  const base = sector1Staging(layout);
  return {
    ...base,
    enemySpots: { [JENOVA_LIFE_ID]: [layout.boss[0], layout.boss[1], layout.boss[2]] },
    figureHeights: { ...FORGOTTEN_CAPITAL_HEIGHTS },
  };
}

/** The desk staging (the published slots). */
export const FORGOTTEN_CAPITAL_STAGING: SceneStaging = forgottenCapitalStaging(FORGOTTEN_CAPITAL_DESK);
