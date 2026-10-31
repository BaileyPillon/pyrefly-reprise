/**
 * THE PRO ARENAS OF BATCH 3b (`booth-ffx-b3b`, release 71; Bailey 2026-10-30: the booth treatment for every listed chapter; FFX only): Dream's End (Chapter III, Braska's Final Aeon), the Garden of Pain (Chapter XII, Seymour Omnis) and the
 * Via Purifico (Chapter XIV, Isaaru). `ProGrade.PRO_ARENA` spreads this table in; the rows live here because `ProGrade.ts` stood at 365 lines and three rows with their notes would have taken it past the house limit of 400.
 * Type-only import: no runtime cycle. Every number is [ours], set from each plate's own colours and graded offline through the engine's own LUT (`docs/handoff/booth-ffx-b3b.md` section 3, `docs/screenshots/booth-ffx-b3b-plate-grade.png`);
 * a still beside Chapter I is owed before Bailey judges them (hard rule 9; job J6 of the handoff). The booth grammar in each room's own colours: one strong light, one accent, the rest to deep shadow and haze.
 */
import type { ProRoom } from './ProGrade.ts';

export const FFX_B3B_ARENA: Readonly<Record<string, ProRoom>> = {
  // Chapter III (FFX), Dream's End: the burning eye of the Abes emblem is the one light (core at plate u 0.484, v 0.286 from the top), it throws a warm gold cone down onto the arena; the crimson clouds and the stadium fall to wine-black, the flame wall at the base is the
  // one accent (kept hot, hue 38), the scene's own cold blue fill (forced by `dreams-end.ts`) stays what separates the figures. The plate is dark (mean luminance 0.189), so the arena stays near its own exposure and falls by contrast and the crimson pull rather than by a steep curve.
  'dreams-end': {
    colour: {
      exposure: 2.6,
      gamma: 1.0,
      contrast: 0.5,
      pivot: 0.3,
      sat: 1.05,
      pulls: [[350, 40, 0, 0.95, 0.5], [340, 30, 0, 0.95, 0.5], [38, 30, 0, 1.12, 1.05]],
      gradmap: { amount: 0.1, stops: [[0, [0.03, 0.0, 0.02]], [0.3, [0.2, 0.04, 0.06]], [0.6, [0.85, 0.35, 0.16]], [0.9, [1.0, 0.9, 0.62]], [1, [1, 1, 1]]] },
      shadow: [[0.07, 0.015, 0.05], 0.4],
      shadowTo: 0.45,
    },
    lightColor: [1.0, 0.74, 0.34],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.3, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.gain': 1.6 },
    haze: { colour: [0.34, 0.1, 0.1], amounts: [0.05, 0.05, 0.03], side: 0.1 },
    vignette: { amount: 0.55, radius: 0.42, tint: [0.02, 0.0, 0.005] },
    grain: 0.018,
    // the eye, found on the painting (plate u 0.484, v 0.286 from the top) so the cone follows the camera; (u, v) is the frame point it started from (the eye at the first menu of the colossus idle rig: frame u 0.34, v 0.73 from the bottom)
    cone: { u: 0.34, v: 0.73, follow: false, paint: { u: 0.484, v: 0.286 }, colour: [1.0, 0.72, 0.36], strength: 0.26, spread: 0.45, reach: 1.6, rays: 0.3 },
  },
  // Chapter XII (FFX), the Garden of Pain: the pale pink glow low in the sky behind the dais is the one light (the scene's own key, "from high and behind"; plate u 0.505, v 0.337); it throws a pale violet-pink cone onto the dais and Seymour, the violet-blue sky
  // (hue 240, most of the plate's colour) falls to indigo-black, the pink terrace and the dais steps (hue 330) stay as the one accent.
  'garden-of-pain': {
    colour: {
      exposure: 1.8,
      gamma: 1.0,
      contrast: 0.5,
      pivot: 0.3,
      sat: 1.0,
      pulls: [[240, 45, -4, 0.9, 0.55], [250, 30, 0, 0.9, 0.55], [330, 30, 0, 1.1, 1.0]],
      gradmap: { amount: 0.1, stops: [[0, [0.01, 0.0, 0.05]], [0.3, [0.08, 0.05, 0.26]], [0.6, [0.5, 0.32, 0.6]], [0.9, [0.98, 0.88, 1.0]], [1, [1, 1, 1]]] },
      shadow: [[0.04, 0.03, 0.18], 0.4],
      shadowTo: 0.45,
    },
    lightColor: [0.86, 0.66, 1.0],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.3, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.gain': 1.6 },
    haze: { colour: [0.24, 0.2, 0.5], amounts: [0.06, 0.05, 0.03], side: 0.1 },
    vignette: { amount: 0.55, radius: 0.42, tint: [0.005, 0.0, 0.03] },
    grain: 0.018,
    cone: { u: 0.49, v: 0.81, follow: false, paint: { u: 0.505, v: 0.337 }, colour: [0.8, 0.62, 1.0], strength: 0.26, spread: 0.45, reach: 1.7, rays: 0.25 },
  },
  // Chapter XIV (FFX), the Via Purifico: the red lamps are Bailey's pick (O-3 A, "red-lit stone with the hallway behind") and stay as the one accent (hue 350 and 0, held near their plate value: lamp luma 0.23 against 0.29); the one light is the cold glow at the far door, lying again in the wet floor, which
  // throws a cool cone back down the hall (plate u 0.50, v 0.70); the grey stone and the walls fall to wine-black. The darkest plate of the three (mean luminance 0.155).
  'via-purifico': {
    colour: {
      exposure: 2.6,
      gamma: 1.0,
      contrast: 0.6,
      pivot: 0.35,
      sat: 1.05,
      pulls: [[350, 40, 0, 1.05, 1.0], [0, 30, 0, 1.0, 1.0], [210, 36, 0, 0.95, 0.9]],
      gradmap: { amount: 0.1, stops: [[0, [0.02, 0.0, 0.03]], [0.3, [0.12, 0.05, 0.1]], [0.6, [0.8, 0.22, 0.16]], [0.9, [1.0, 0.8, 0.6]], [1, [1, 1, 1]]] },
      shadow: [[0.03, 0.02, 0.06], 0.4],
      shadowTo: 0.45,
    },
    lightColor: [0.6, 0.72, 1.0],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.2, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.gain': 1.4 },
    haze: { colour: [0.22, 0.1, 0.14], amounts: [0.06, 0.05, 0.03], side: 0.1 },
    vignette: { amount: 0.55, radius: 0.42, tint: [0.02, 0.0, 0.01] },
    grain: 0.018,
    cone: { u: 0.46, v: 0.67, follow: false, paint: { u: 0.5, v: 0.7 }, colour: [0.6, 0.72, 1.0], strength: 0.22, spread: 0.45, reach: 1.5, rays: 0.2 },
  },
};
