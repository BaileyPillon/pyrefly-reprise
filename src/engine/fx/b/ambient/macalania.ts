import { between, NEAR, OVER_GROUND, type RoomSpec } from './room.ts';

/**
 * Chapter VII, Macalania Temple (FFX only). Canon row: `absent` until Seymour's death releases
 * the held motes (D-225): option B adds no pyreflies and leaves the held ones alone. Research
 * section 8.1: "ice, cold light, frozen lake... maybe drifting ice crystals". So: the twin braziers
 * breathe and flicker, cold light crawls up through the ice panes, crystals drift and twinkle,
 * a cold mist lies on the ice, and the ice floor mirrors the room and the fighters (canon: an ice
 * palace on a frozen lake).
 */
export const MACALANIA: RoomSpec = {
  key: 'macalania-temple',
  game: 'ffx',
  plates: { thresholds: [0.08, 0.16, 0.35], z: [-16, -11.5, -6], soft: 0.015, blur: 3, width: 2048 },
  phonePlates: { thresholds: [0.16], z: [-12], soft: 0.015, blur: 2, width: 1024 },
  lamps: {
    warm: { color: 0xffc06a, gain: 1.1, halo: 1.3, lum: [0.5, 0.9], flicker: 0.14, hz: 4.2 },
    cool: { color: 0x8fd4ff, gain: 0.55, lum: [0.5, 0.95], speed: 0.12, scale: 7, halo: 0.12 },
  },
  fields: [
    { shape: 'crystal', count: 54, min: [-9, 0.2, -12], size: [18, 7, 9], vel: [0.06, -0.1, 0.02], turb: 0.35, scale: [0.05, 0.1], color: 0xd8f0ff, opacity: 1, renderOrder: OVER_GROUND },
    { shape: 'crystal', count: 22, min: [-6, 0.2, -3], size: [12, 5, 7], vel: [0.05, -0.08, 0.02], turb: 0.3, scale: [0.06, 0.12], color: 0xe4f6ff, opacity: 0.95, renderOrder: NEAR, near: 1.2 },
  ],
  haze: [
    { y: 6, z: -13.5, w: 30, h: 12, color: 0x9fd0ff, opacity: 0.16, additive: true, flow: [0.01, 0.012], scale: [2.5, 1.5], cover: 0.45, renderOrder: between(1) },
    { y: 0.5, z: -7, w: 40, h: 2.2, color: 0xa9d8ff, opacity: 0.24, flow: [0.02, 0.004], scale: [5, 1], cover: 0.4, renderOrder: OVER_GROUND, fadeBottom: 0.1, fadeTop: 0.6 },
  ],
  shadow: { key: [4.5, 5.4, -8], length: 0.8, opacity: 0.75, color: 0x030814 },
  reflect: { opacity: 0.5, radius: 16, tint: 0xcfe8ff, ripple: 0.005, center: [0.5, -3.5], size: [40, 40] },
};
