/**
 * **The lake's light and grade** (the hidden Wendigo chapter's 3D stage; FFX only): one table to tune. The picture is a night on the ice under the aurora: a **cold moon key** from the camera's left and above (so the party's
 * faces, turned toward the lens, are lit), a **sky-and-ice hemisphere** (blue from above, the ice's teal bounced up from below), and an **aurora rim** from behind and to the right that outlines the Wendigo and the
 * Guardians in green (the brute against the curtains is the shot). The engine's own light rig is hidden; these are the only lights on the models and the shore.
 *
 * The game's post chain ends in a grade that does not encode sRGB (the painted planes are unlit), so lit geometry would come out dark: this palette is neutral and **encodes** (a gamma of 2.2 is the sRGB curve to within a
 * few percent, as the 3D Bahamut chapter found), with a bloom whose threshold sits above any lit surface (only the aurora's brightest curtains, the moon, the ice's cracks, the crystals' tips and the shafts' cores glow), a
 * touch of saturation and a vignette. Pure data. Game case: FFX only.
 */

import type { ScenePalette } from '../Renderer.ts';
import type { V3 } from './layout.ts';

export const LOOK = {
  key: { colour: 0xcfe4ff, intensity: 2.6, toward: [-0.5, 0.66, 0.56] as V3 },
  rim: { colour: 0x74ffb8, intensity: 2.2, toward: [0.55, 0.38, -0.75] as V3 },
  hemi: { sky: 0x4a78c4, ground: 0x2aa6b4, intensity: 1.05 },
  fog: { colour: 0x1f4f6c, near: 90, far: 330 },
  background: '#16384f',
} as const;

/** The chapter's grade: neutral, and it encodes. */
export const LAKE_PALETTE: ScenePalette = {
  name: 'exp-wendigo-lake',
  lift: [0, 0, 0],
  gamma: [2.2, 2.2, 2.2],
  gain: [1, 1, 1],
  saturation: 1.08,
  vignette: 0.22,
  vignetteRadius: 0.82,
  shadowTintAmount: 0,
  grain: 0.012,
  exposure: 1,
  bloomThreshold: 0.92,
  bloomStrength: 0.42,
  bloomRadius: 0.75,
  tiltMaxBlur: 0,
  figureBloomMask: 0,
};
