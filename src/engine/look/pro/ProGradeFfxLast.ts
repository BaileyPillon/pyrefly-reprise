/**
 * THE PRO ARENAS OF THE LAST FIVE LISTED CHAPTERS (`booth-b4-last`, release 71; Bailey 2026-10-30: the booth treatment for every listed chapter; FFX only): the Fahrenheit's deck over Evrae's plate (Chapter VIII, `evrae-airship-deck`) and over the Bevelle
 * plate at golden dusk (Chapter XVIII, Sin's face, `sin-fahrenheit-bevelle`). `ProGrade.PRO_ARENA` spreads this table in (the shape of `ProGradeFfx.ts` and `ProGradeFfxB3a.ts`: `ProGrade.ts` stands at 396 lines). Type-only import: no runtime cycle.
 * Every number is [ours], set from each plate's own colours and graded offline through the engine's own LUT (`docs/handoff/booth-b4-last.md` section 3, `docs/screenshots/booth-b4-last-plate-grade.png`); a still beside Chapter I is owed before
 * Bailey judges them (hard rule 9; job L1 of the handoff). The booth grammar in each room's own colours: one strong light, one accent, the rest to deep shadow and haze.
 *
 * **No row for the Mirror Aeons chapter or for Chapter XVI**: both hold the arena (`PieceHoldsLast.ts`: two plates under one key and a provisional plate). Chapter XVII has no rows (it does not join).
 */
import type { ProRoom } from './ProGrade.ts';

export const FFX_LAST_ARENA: Readonly<Record<string, ProRoom>> = {
  // Chapter VIII (FFX), Evrae's deck: the sunlit cloud bank above the hull is the one light (plate u 0.311, v 0.361 from the top; the painting's brightest blob); it throws a warm cream cone down onto the deck and the party; the blue sky (hue 210, most of the plate's colour)
  // falls to navy, the hull to near-black, and the copper glints and the cloud's warm shadows (hue 14) stay as the one accent. The plate is as luminous as Chapter I's snow (mean luminance 0.373 against 0.418), so the exposure is Chapter I's.
  'evrae-airship-deck': {
    colour: {
      exposure: 1.0,
      gamma: 1.0,
      contrast: 0.5,
      pivot: 0.3,
      sat: 0.92,
      pulls: [[214, 40, -4, 0.82, 0.8], [14, 26, 0, 1.1, 1.05]],
      gradmap: { amount: 0.2, stops: [[0, [0.01, 0.02, 0.06]], [0.3, [0.06, 0.12, 0.26]], [0.6, [0.42, 0.5, 0.66]], [0.9, [1.0, 0.93, 0.84]], [1, [1, 1, 1]]] },
      shadow: [[0.02, 0.05, 0.16], 0.4],
      shadowTo: 0.45,
    },
    lightColor: [1.0, 0.9, 0.78],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.2, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.gain': 1.4 },
    haze: { colour: [0.34, 0.42, 0.62], amounts: [0.05, 0.04, 0.03], side: 0.1 },
    vignette: { amount: 0.55, radius: 0.42, tint: [0.004, 0.008, 0.025] },
    grain: 0.018,
    // the cloud bank, found on the painting (plate u 0.311, v 0.361 from the top, through the deck's roll of -11.6 degrees) so the cone follows the camera; (u, v) is the frame point it started from (the bank at the NEAR idle rig, 16:9: frame u 0.138, v 0.833 from the bottom)
    cone: { u: 0.138, v: 0.833, follow: false, paint: { u: 0.311, v: 0.361 }, colour: [1.0, 0.9, 0.76], strength: 0.24, spread: 0.45, reach: 1.7, rays: 0.3 },
  },
  // Chapter XVIII (FFX), Sin's face over Bevelle at golden dusk: the setting sun itself is the one light (plate u 0.483, v 0.522; rgb 0.98 0.94 0.77); it throws a gold cone across the deck, the violet-brown sky and the hull fall to dark plum, and the amber of the cloud tops (hue 22) and the
  // city's glints stay as the one accent. Mean luminance 0.388.
  'sin-fahrenheit-bevelle': {
    colour: {
      exposure: 1.0,
      gamma: 1.0,
      contrast: 0.5,
      pivot: 0.3,
      sat: 0.95,
      pulls: [[22, 36, 0, 1.08, 1.0], [325, 30, -6, 0.85, 0.8]],
      gradmap: { amount: 0.16, stops: [[0, [0.03, 0.01, 0.04]], [0.3, [0.2, 0.1, 0.14]], [0.6, [0.78, 0.5, 0.34]], [0.9, [1.0, 0.92, 0.72]], [1, [1, 1, 1]]] },
      shadow: [[0.07, 0.03, 0.1], 0.4],
      shadowTo: 0.45,
    },
    lightColor: [1.0, 0.86, 0.6],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.2, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.gain': 1.4 },
    haze: { colour: [0.4, 0.26, 0.3], amounts: [0.05, 0.04, 0.03], side: 0.1 },
    vignette: { amount: 0.55, radius: 0.42, tint: [0.02, 0.005, 0.01] },
    grain: 0.018,
    // the sun, found on the painting (plate u 0.483, v 0.522 from the top, through the deck's roll) so the cone follows the camera; (u, v) is the frame point it started from (the sun at the NEAR idle rig, 16:9: frame u 0.375, v 0.483 from the bottom, behind the party's heads)
    cone: { u: 0.375, v: 0.483, follow: false, paint: { u: 0.483, v: 0.522 }, colour: [1.0, 0.86, 0.6], strength: 0.24, spread: 0.45, reach: 1.7, rays: 0.3 },
  },
};
