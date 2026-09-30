import { between, OVER_GROUND, type RoomSpec } from './room.ts';

/**
 * Chapter IV, Bevelle Underground (FFX-2 only). Canon row: `absent`, research section 8: "steam,
 * not motes". So no motes of any kind: steam rises from the deck's vents and banks between the
 * gantries, the rust lamps breathe and flicker (the scene's own practicals keep their own
 * flicker), the cyan hole light shimmers, and the riveted deck gives back a faint sheen (ours).
 */
export const BEVELLE: RoomSpec = {
  key: 'bevelle-underground',
  game: 'ffx2',
  plates: { thresholds: [0.1, 0.2, 0.34], z: [-38, -26, -14], soft: 0.015, blur: 3, width: 2048 },
  phonePlates: { thresholds: [0.2], z: [-28], soft: 0.015, blur: 2, width: 1024 },
  lamps: {
    warm: { color: 0xff8a3d, gain: 1.7, halo: 1.8, lum: [0.4, 0.8], flicker: 0.2, hz: 5.5 },
    cool: { color: 0x6ed2ee, gain: 0.8, lum: [0.45, 0.9], speed: 0.25, scale: 5, halo: 0.9 },
  },
  fields: [
    {
      shape: 'plume', count: 56, min: [0, 0, 0], size: [1, 1, 1], vel: [0.12, 0.8, 0], life: 7, turb: 0.5, scale: [1.0, 2.6],
      color: 0xd0dcea, opacity: 0.16, additive: false, renderOrder: OVER_GROUND,
      vents: [[-4.5, 0, -6], [5, 0, -7], [-2, 0, -12], [3, 0, -14], [-7, 0, -10], [7.5, 0, -11], [0, 0, -18], [-9, 0, -4]],
    },
  ],
  haze: [
    // D must-fix 3: the vents' plumes and the banked steam at about 0.35 of the options-page values
    // (probed by dial on the frozen rest frame, d-final/fixes/), so the gantries read through them.
    { y: 4, z: -32, w: 90, h: 20, color: 0x9ab0c8, opacity: 0.12, flow: [0.012, 0.01], scale: [2.6, 1.3], cover: 0.32, renderOrder: between(1) },
    { y: 2, z: -20, w: 70, h: 10, color: 0x6ed2ee, opacity: 0.07, additive: true, flow: [0.02, 0.015], scale: [3, 1.2], cover: 0.35, renderOrder: between(2) },
  ],
  shadow: { key: [-8.4, 9.5, -1.5], length: 0.7, opacity: 0.8, color: 0x020306 },
  reflect: { opacity: 0.2, radius: 14, tint: 0xffd2b0, ripple: 0.002, center: [0, -5], size: [36, 28] },
};
