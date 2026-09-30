import { between, NEAR, OVER_GROUND, type RoomSpec } from './room.ts';

/**
 * Chapter I, Mt. Gagazet at night (FFX only). Canon row: `unattested` (no pyreflies added).
 * The visual bible's snow and 12 wind streaks, pushed further: gusts of blizzard haze flowing
 * between the painted ridges at their own depths, spindrift racing over the snow in front of and
 * behind the party, big out-of-focus flakes crossing the lens, the moon's halo breathing, and
 * long blue moon shadows off every figure. The key light is the scene's own (`keyFrom`).
 */
export const GAGAZET: RoomSpec = {
  key: 'gagazet',
  game: 'ffx',
  plates: { thresholds: [0.12, 0.2, 0.3], z: [-36, -26, -16], soft: 0.02, blur: 3, width: 2048 },
  phonePlates: { thresholds: [0.2], z: [-28], soft: 0.02, blur: 2, width: 1024 },
  // D must-fix 2: a softer moon halo, so the painted disc is not doubled into a sunburst.
  lamps: { cool: { color: 0xcfe0ff, gain: 0.55, lum: [0.72, 0.98], speed: 0.06, scale: 5, halo: 1.2 } },
  fields: [
    { shape: 'flake', count: 260, min: [-14, 0, -14], size: [28, 9, 13], vel: [2.2, -1.1, 0.2], turb: 0.35, scale: [0.02, 0.05], color: 0xe3eeff, opacity: 0.85, renderOrder: OVER_GROUND },
    { shape: 'streak', count: 16, min: [-16, 0.1, -9], size: [32, 6, 12], vel: [11, -0.9, 0.4], turb: 0.05, scale: [0.014, 0.026], stretch: 46, color: 0xe4eeff, opacity: 0.7, renderOrder: NEAR },
    // D must-fix 2: the near, out-of-focus flakes smaller and fainter, so A's bloom no longer turns them into extra moons.
    { shape: 'flake', count: 70, min: [-9, -0.5, 2.5], size: [18, 8, 5], vel: [1.5, -0.7, 0.1], turb: 0.25, scale: [0.03, 0.075], color: 0xdbe8ff, opacity: 0.38, renderOrder: NEAR, near: 1.0 },
  ],
  haze: [
    // D must-fix 3: the far veil thinner, so the upper left keeps the painting's ridges.
    { y: 10, z: -31, w: 120, h: 36, color: 0xd8e6ff, opacity: 0.36, flow: [0.045, 0.006], scale: [3.2, 1.4], gust: 0.45, cover: 0.24, renderOrder: between(1), fadeBottom: 0.25, fadeTop: 0.35 },
    { y: 5, z: -21, w: 84, h: 16, color: 0xe0ebff, opacity: 0.62, flow: [0.07, 0.004], scale: [3.5, 1.2], gust: 0.5, cover: 0.28, renderOrder: between(2) },
    { y: 0.6, z: -5, w: 46, h: 2.6, color: 0xe6efff, opacity: 0.55, flow: [0.22, 0.01], scale: [7, 1], gust: 0.5, cover: 0.32, renderOrder: OVER_GROUND, fadeBottom: 0.1, fadeTop: 0.6 },
    { y: 0.32, z: 3.2, w: 30, h: 1.4, color: 0xe6efff, opacity: 0.26, flow: [0.3, 0.02], scale: [6, 1], gust: 0.7, cover: 0.45, renderOrder: NEAR, fadeBottom: 0.1, fadeTop: 0.6 },
  ],
  shadow: { key: [-9.2, 6, -3], length: 1.05, opacity: 0.85, color: 0x050b1e },
};
