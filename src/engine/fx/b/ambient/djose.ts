import { OVER_GROUND, type RoomSpec } from './room.ts';

/**
 * Chapter XVI, the Chamber of the Fayth at Djose (FFX-2 only). Canon row: `unattested` (no
 * pyreflies; the hole to the Farplane is not a source for them). The painting names "machina work
 * lamps", "warm amber lamp light", "faint blue electric sparks" and dust: the lamps breathe and
 * flicker, blue arcs crackle at them (where they jump is ours), dust hangs in their light, and a
 * distant lightning flash (Djose's storm-held shell is canon for the exterior; the room-level
 * flash is ours) lifts the chamber for two frames, capped at +12 %.
 *
 * The floor is painted, so it is projected onto the ground rather than standing upright: the
 * party and Ixion stay planted on it while the camera drifts.
 */
export const DJOSE: RoomSpec = {
  key: 'djose-chamber-provisional',
  game: 'ffx2',
  plates: { thresholds: [0.15, 0.4], z: [-24], soft: 0.02, blur: 3, width: 2048, floor: { far: -40 } },
  phonePlates: { thresholds: [0.4], z: [], soft: 0.02, blur: 2, width: 1024, floor: { far: -40 } },
  // D must-fix 7: the work lamp keeps its painted mullions: B's warm layer is what burns it white
  // (probed layer by layer on the frozen rest frame, d-final/fixes/), so it glows at about 0.4 of
  // the options page and spills a smaller halo.
  lamps: { warm: { color: 0xffaa4a, gain: 0.5, halo: 0.8, lum: [0.55, 0.92], flicker: 0.16, hz: 4.8 } },
  fields: [
    // Dust hanging in the chamber's lamp light (the painting names dust).
    { shape: 'dust', count: 70, min: [-7, 0.1, -9], size: [16, 5, 12], vel: [0.05, 0.03, 0.02], turb: 0.4, scale: [0.014, 0.032], color: 0xffe2b8, opacity: 0.55, renderOrder: OVER_GROUND },
  ],
  haze: [
    { y: 0.35, z: -8, w: 50, h: 2, color: 0xc8c0b0, opacity: 0.16, flow: [0.03, 0.005], scale: [5, 1], cover: 0.42, renderOrder: OVER_GROUND, fadeBottom: 0.1, fadeTop: 0.6 },
  ],
  shadow: { key: [-4.8, 7.8, 4.6], length: 0.75, opacity: 0.8, color: 0x03040a },
  arcs: { at: [[0.837, 0.4], [0.152, 0.44], [0.703, 0.215]], reach: 1.8, width: 0.06, color: 0x9fc8ff, every: 0.9 },
  lampDust: [
    { at: [0.837, 0.42], box: [5, 4, 3], field: { shape: 'dust', count: 46, vel: [0.06, 0.05, 0], turb: 0.35, scale: [0.05, 0.11], color: 0xffd9a0, opacity: 0.8, renderOrder: 30 } },
    { at: [0.152, 0.45], box: [5, 4, 3], field: { shape: 'dust', count: 30, vel: [0.05, 0.05, 0], turb: 0.35, scale: [0.05, 0.11], color: 0xffd9a0, opacity: 0.7, renderOrder: 30 } },
  ],
  lightning: { every: [8, 14], tint: [0.8, 0.9, 1.25], peak: 0.12 },
};
