/**
 * **Evrae's NEAR stage by window shape: the stand-back and the trim (D-360 repair of the critic's check, 2026-10-04; FFX only).**
 *
 * Game case: FFX only [AGENTS.md rule 14]. Evrae is Chapter VIII's boss and the airship range mechanic has no FFX-2
 * counterpart (`research/ffx-evrae-airship.md` section 0.4); the range director applies this to Evrae's own fight only, never to
 * Sin's Fins (Chapter XVII) or Chapter XVIII's face, and nothing here is read by an FFX-2 chapter.
 *
 * Pure data and functions, no `three`, no DOM: the director, the tests and any preview read one table. Split out of
 * `evrae-airship-range.ts`, which it reads (the NEAR rigs and Evrae's pinned spot) and which stays under the 400-line house rule.
 */

import { EVRAE_NEAR_SPOT, RANGE_STAGING } from './evrae-airship-range.ts';

type Spot = [number, number, number];

/**
 * **The width the NEAR stage is laid out for (D-360 repair, FFX only).** E1-H's coil stands right of the party and ends short
 * of the Ink & Gold turn rail at 16:9 (the rail's left edge is 0.878 of the width, and the HUD's 16:9 stage keeps that fraction
 * at every aspect down to 4:3). The scene's cameras keep a fixed vertical field of view, so a narrower window shows less width:
 * at 16:10 the same coil ended 51 to 59 px past the rail, at 4:3 112 px (the critic's check of `3b709a4f`), and no slot x can
 * fix that: the party stands 20 to 40 px from the coil's near side, so the whole figure may move left by 0.2 world and no more
 * (a shift of 0.5 puts a fifth of Rikku inside the coil, measured on the 1600x900 masks).
 *
 * So below 16:9 the NEAR rigs stand back along their own view line until the coil stands where it does at 16:9 in the window's
 * width ({@link nearDollyFor}, the Hor+ rule): every figure keeps its place against the HUD, and the party is smaller by the
 * stand-back (about 0.88 at 16:10, 0.70 at 4:3: the house answer to a frame too narrow for its fight, as the phone's A-12 refit).
 * Wider than 16:9 nothing moves. NEAR only: FAR's painting is unchanged, and the Fins never read this.
 */
export const NEAR_ASPECT_REF = 16 / 9;

/** The farthest NEAR's rigs stand back, as a multiple of their authored distance: the bound the MAX mix itself keeps (`masters.ts`). */
export const NEAR_DOLLY_MAX = 1.45;

/**
 * The stand-back is 10 % more than the Hor+ rule alone: the MAX mix shifts the stage right by 4 % of the width at one of the first
 * menus (its downed-footprint rule, once that menu's real panels are known; origin/main does the same at other menus), and the
 * coil's end stood flush against the rail in the window the rule fits exactly. The margin is also what lets the mix's own fit
 * pass at 4:3 without a shift (measured at 1024x768: no lens at all with it, a 41 px shift and 8 px of coil under the rail without).
 */
export const NEAR_DOLLY_MARGIN = 1.1;

/** How far right of the plane's centre the painted coil ends, world units (`idle.png`: the alpha reaches column 1119 of 1136, the plane centred on its slot). */
export const EVRAE_COIL_REACH = 2.94;

/**
 * How much farther the coil's end is from the NEAR `idle` rig's camera, along its view axis, than the rig's own aim point: the
 * stand-back must be sized for the coil's depth, not the aim's, or a narrow window keeps a few percent of the overshoot
 * (17 px at 1024x768). About 1.18; `evrae-e1h-slot.test.ts` recomputes it from the rig and the spot.
 */
export function nearCoilDepthRatio(): number {
  const { position: c, lookAt: l } = RANGE_STAGING.near.rigs.idle;
  const f: Spot = [l[0] - c[0], l[1] - c[1], l[2] - c[2]];
  const aim = Math.hypot(f[0], f[1], f[2]);
  const p: Spot = [EVRAE_NEAR_SPOT[0] + EVRAE_COIL_REACH, EVRAE_NEAR_SPOT[1] + 1.2, EVRAE_NEAR_SPOT[2]];
  const depth = ((p[0] - c[0]) * f[0] + (p[1] - c[1]) * f[1] + (p[2] - c[2]) * f[2]) / aim;
  return depth / aim;
}

const COIL_DEPTH_RATIO = nearCoilDepthRatio();

/**
 * How far NEAR's rigs stand back, as a multiple of their authored distance from their aim, for a window `aspect` wide (width over
 * height): 1 at 16:9 and wider, and below it `1 + coil depth ratio * margin * (16:9 / aspect - 1)`, so the coil's end keeps its 16:9
 * place in the window's width (a dolly changes a point's screen x by its own depth). At most {@link NEAR_DOLLY_MAX}.
 */
export function nearDollyFor(aspect: number): number {
  if (!Number.isFinite(aspect) || aspect <= 0 || aspect >= NEAR_ASPECT_REF) return 1;
  return Math.min(NEAR_DOLLY_MAX, 1 + COIL_DEPTH_RATIO * NEAR_DOLLY_MARGIN * (NEAR_ASPECT_REF / aspect - 1));
}

/**
 * World units the figure moves left of its 16:9 pin per unit of stand-back beyond 1. The pixel margin the rail needs is a fixed
 * share of the width, so the world distance for it grows as the camera stands back; and the farther camera also sees less
 * parallax between Rikku and the coil, so the same world shift costs less overlap (measured: at 16:10 a 0.15 shift leaves Rikku
 * 0.8 % inside the figure at her own menu where 0.2 leaves her 2.2 %; at 4:3 0.2 leaves 0.7 %).
 */
export const EVRAE_TRIM_PER_DOLLY = 0.25;

/**
 * How long a camera resting on `idle` takes to settle onto a new stand-back when the window changed shape mid-fight (the second
 * check's M1), ms: the presenter's own return to `idle` (`MOMENT_TIMING.returnOut`), so it reads as one more return, not a new move.
 */
export const NEAR_RESTAND_MS = 620;

/** NEAR's staging for a window: how far the rigs stand back, and how far (world x, negative = left) Evrae stands off its 16:9 pin. */
export interface NearAspect {
  dolly: number;
  dx: number;
}

export function nearAspectFor(aspect: number): NearAspect {
  const dolly = nearDollyFor(aspect);
  return { dolly, dx: dolly > 1 ? -EVRAE_TRIM_PER_DOLLY * (dolly - 1) : 0 };
}
