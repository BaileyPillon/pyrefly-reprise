/**
 * THE ARENAS OF BATCH 3a (`booth-ffx-b3a`, release 71; Bailey 2026-10-30: "the nice treatment you gave to the booth chapters you need to now apply to all live and selectable chapters"; FFX only): Chapter VII (Seymour and Anima, the Macalania
 * antechamber), Chapter IX (Yojimbo, the Cavern of the Stolen Fayth) and Chapter X (Seymour Natus, the Highbridge of Bevelle). They are rows of `ProGrade.PRO_ARENA` (spread in right after the dome's, the last FFX row) and live in their own file only because
 * `ProGrade.ts` stands at 365 lines and three more rooms would take it over the house limit of 400. The grammar is the booth pair's (one strong light, the rest to deep shadow and haze, one coloured accent kept); each row is [ours], set from the plate's own colours
 * and graded offline through the table (`docs/handoff/booth-ffx-b3a.md`, `docs/screenshots/booth-ffx-b3a-plate-grade.png`), and a still beside Chapter I is owed before Bailey judges it (hard rule 9; the booth pair is the approved target).
 */
import type { ProRoom } from './ProGrade.ts';

export const PRO_ARENA_FFX_B3A: Readonly<Record<string, ProRoom>> = {
  // Chapter VII: the central ice door is the only light (the painting's own: `macalania-temple.ts`, "the doors are light through ice"); a cold cyan cone falls from it over the party and Seymour, the room falls to teal-indigo, and the braziers' gold stays the one warm accent.
  'macalania-temple': {
    colour: {
      exposure: 0.95,
      gamma: 1.0,
      contrast: 0.46,
      pivot: 0.3,
      sat: 0.95,
      pulls: [[205, 50, -6, 0.9, 0.82], [190, 36, -4, 0.9, 0.9], [24, 28, 0, 1.12, 1.05]],
      gradmap: { amount: 0.28, stops: [[0, [0.0, 0.03, 0.06]], [0.3, [0.03, 0.17, 0.28]], [0.6, [0.28, 0.56, 0.7]], [0.9, [0.85, 0.96, 1.0]], [1, [1, 1, 1]]] },
      shadow: [[0.015, 0.08, 0.18], 0.4],
      shadowTo: 0.45,
    },
    lightColor: [0.62, 0.88, 1.0],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.4, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.gain': 1.8 },
    haze: { colour: [0.2, 0.36, 0.56], amounts: [0.07, 0.05, 0.03], side: 0.1 },
    vignette: { amount: 0.56, radius: 0.42, tint: [0.0, 0.01, 0.03] },
    grain: 0.018,
    // the central door, found on the painting (plate u 0.475, v 0.5 from the top) so the cone follows the camera; (u, v) is the frame point it started from (the door at the first menu: screen x 0.42, y 0.9 from the bottom)
    cone: { u: 0.42, v: 0.9, follow: false, paint: { u: 0.475, v: 0.5 }, colour: [0.55, 0.85, 1.0], strength: 0.34, spread: 0.4, reach: 1.8, rays: 0.3 },
  },
  // Chapter X: the gate's open arch is the only cool light (plate u 0.49, v 0.8, between the amber lamps); a pale blue cone falls from it over the plaza and Natus, the night falls to navy-black, and the lamps shrink to a warm accent.
  'bevelle-highbridge': {
    colour: {
      exposure: 1.85,
      gamma: 1.0,
      contrast: 0.3,
      pivot: 0.3,
      sat: 1.15,
      pulls: [[22, 24, 0, 0.95, 0.85], [228, 50, -4, 0.9, 0.95], [205, 36, 0, 1.0, 1.05]],
      gradmap: { amount: 0.06, stops: [[0, [0.0, 0.01, 0.05]], [0.3, [0.04, 0.07, 0.22]], [0.6, [0.26, 0.42, 0.64]], [0.9, [0.84, 0.92, 1.0]], [1, [1, 1, 1]]] },
      shadow: [[0.03, 0.04, 0.16], 0.36],
      shadowTo: 0.45,
    },
    lightColor: [0.6, 0.8, 1.0],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.4, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.gain': 2.0 },
    haze: { colour: [0.12, 0.18, 0.4], amounts: [0.06, 0.05, 0.025], side: 0.1 },
    vignette: { amount: 0.5, radius: 0.42, tint: [0.0, 0.004, 0.03] },
    grain: 0.018,
    // the arch, found on the painting (plate u 0.49, v 0.78 from the top); (u, v) is the frame point it started from (the arch at the first menu: screen x 0.45, y 0.7 from the bottom). The look row's light (`LookGrades` ROOM_LOOKS) names v 0.8: the r64 plate is cool and bright from v 0.70 to 0.82 with no peak between 0.78 and 0.80, so the two are one light read twice, 0.02 of the plate apart, and both stay (a still is owed, J11)
    cone: { u: 0.45, v: 0.7, follow: false, paint: { u: 0.49, v: 0.78 }, colour: [0.45, 0.7, 1.0], strength: 0.4, spread: 0.38, reach: 2.0, rays: 0.3 },
  },
  // Chapter IX: the shaft of daylight is the only light (plate u 0.59, v 0.42); a cold white cone falls from it over the floor and Yojimbo, the cave falls to steel-black, and the dormant pad is the one thing left to wake at the end.
  'cavern-stolen-fayth': {
    colour: {
      exposure: 1.3,
      gamma: 1.0,
      contrast: 0.32,
      pivot: 0.3,
      sat: 1.1,
      pulls: [[200, 40, -4, 0.95, 0.9], [190, 30, 0, 1.0, 1.05]],
      gradmap: { amount: 0.08, stops: [[0, [0.0, 0.01, 0.04]], [0.3, [0.05, 0.1, 0.2]], [0.6, [0.3, 0.46, 0.62]], [0.9, [0.86, 0.95, 1.0]], [1, [1, 1, 1]]] },
      shadow: [[0.03, 0.06, 0.16], 0.36],
      shadowTo: 0.45,
    },
    lightColor: [0.7, 0.86, 1.0],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.3, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.gain': 2.2 },
    haze: { colour: [0.16, 0.24, 0.38], amounts: [0.06, 0.05, 0.025], side: 0.1 },
    vignette: { amount: 0.55, radius: 0.42, tint: [0.0, 0.005, 0.025] },
    grain: 0.018,
    // the shaft, found on the painting (plate u 0.59, v 0.42 from the top); it is above the frame's top edge at the idle rig (frame v 1.2), so the cone starts at the edge
    cone: { u: 0.585, v: 0.97, follow: false, paint: { u: 0.59, v: 0.42 }, colour: [0.7, 0.88, 1.0], strength: 0.45, spread: 0.36, reach: 2.2, rays: 0.35 },
  },
};
