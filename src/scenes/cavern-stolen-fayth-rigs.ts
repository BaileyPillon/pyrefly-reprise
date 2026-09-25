import type { CameraRig } from '../engine/BattleCamera.ts';
import type { SceneRigName } from './types.ts';

// ---------------------------------------------------------------------------
// The Cavern's camera rigs, by the shape of the screen (FFX only)
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]: Chapter IX's own framing. The
// aspect rule is written here, for this scene, not in the shared camera.
//
// Three shapes, chosen once when the scene is built (a battle is built for the
// window it opens in; turning a phone mid-fight keeps the framing it opened
// with until the next battle):
//
// - **16:9 and wider**: {@link CAVERN_WIDE_RIGS}, solved against the FFX HUD
//   the real game lays out at 1600x900 (measured live, 2026-09-25). A wider
//   window sees more floor at the sides; the HUD is pinned to the height.
// - **Between square and 16:9** (4:3, 16:10): the same rigs with the vertical
//   field of view opened until the frame is exactly as wide as 16:9's. The HUD
//   there is pinned to the width, letterboxed in a 16:9 band, so every figure
//   lands on the same HUD grid pixel as at 1600x900 ({@link holdWidth}).
// - **Portrait (a phone)**: {@link CAVERN_PHONE_RIGS}. Chapter IX stands its
//   fiends right of the party, which a 390 px frame at 16:9's height cannot
//   reach: the 2026-09-25 end-to-end proof found Yojimbo, Daigoro and Ginnem
//   never on screen at 390x844 (Evrae's boss is). The phone rigs frame the
//   fiends the way the other chapters' phones show their boss: in the middle of
//   the screen at a readable size, the party's nearest member beside them and
//   the rest cropped, as Chapter 1 and Natus do at that width.

/** The aspect the wide rigs were solved at. */
export const CAVERN_DESIGN_ASPECT = 16 / 9;
/** The aspect the phone rigs were solved at (390x844). */
export const CAVERN_PHONE_ASPECT = 390 / 844;

/**
 * FFX framing, fov 28-34 like the other FFX chapters, a little higher and
 * steeper than Chapter 1 so the whole field stands in the band the FFX HUD
 * leaves open (under the Zanmato gauge, left of the CTB list and of the Sensor
 * plate's resting place, right of the command stack, above the party rows).
 * `enemy` is on Yojimbo and Daigoro (the boss reveal's push); `party` keeps
 * Yojimbo whole between the gauge and the CTB list while his blow lands; the
 * `victory` rig takes in the lit pad behind the party's heads.
 */
export const CAVERN_WIDE_RIGS: Readonly<Record<SceneRigName, CameraRig> & Record<string, CameraRig>> = {
  /** The chamber, wide, as the night forms (O-4 A's frame). */
  intro: { position: [0.6, 3.6, 20.0], lookAt: [1.4, 2.6, -4.0], fov: 32, sway: 1.3 },
  idle: { position: [0, 5.1, 17.6], lookAt: [0.6, 1.8, 0], fov: 28 },
  action: { position: [0.5, 4.3, 14.2], lookAt: [1.5, 1.7, 0.6], fov: 28, sway: 0.7 },
  enemy: { position: [0.5, 3.4, 9.8], lookAt: [2.3, 1.8, -2.8], fov: 30, sway: 0.7 },
  party: { position: [-0.4, 3.1, 12.25], lookAt: [0.95, 1.4, 4.4], fov: 31, sway: 0.7 },
  victory: { position: [-0.7, 3.2, 16.0], lookAt: [0.7, 1.2, -2.0], fov: 30, sway: 1.1 },
};

/**
 * The phone's framing (solved at 390x844 against the phone HUD measured live:
 * the gauge across the top, the 16:9 HUD band across the middle). `idle`,
 * `action` and `enemy` keep Yojimbo, Daigoro and Ginnem whole on screen and
 * clear of the gauge and the party rows; `party` holds all three of the party
 * and Yojimbo, whose blow it is; `victory` the party, Ginnem and the lit pad;
 * `intro` the three fiends and the tree.
 */
export const CAVERN_PHONE_RIGS: Readonly<Record<SceneRigName, CameraRig> & Record<string, CameraRig>> = {
  intro: { position: [2.0, 3.8, 18.0], lookAt: [2.6, 2.2, -3.0], fov: 38, sway: 1.1 },
  idle: { position: [1.5, 5.0, 17.0], lookAt: [1.7, 0.15, -1.55], fov: 29 },
  action: { position: [1.5, 4.6, 15.6], lookAt: [1.8, 0.4, -1.6], fov: 30, sway: 0.7 },
  enemy: { position: [2.2, 3.5, 12.3], lookAt: [2.2, 1.6, -2.8], fov: 40, sway: 0.7 },
  party: { position: [-1.05, 7.4, 14.25], lookAt: [0.85, 1.0, 0], fov: 38, sway: 0.7 },
  victory: { position: [0.1, 3.6, 17.1], lookAt: [0.6, 3.6, 0.6], fov: 40, sway: 1.1 },
};

/** A rig with its vertical fov opened so the frame at `aspect` is as wide as at `design`; unchanged when already as wide. */
export function holdWidth(rig: CameraRig, aspect: number, design: number): CameraRig {
  if (!(aspect > 0) || aspect >= design || rig.fov === undefined) return rig;
  const half = (rig.fov * Math.PI) / 360;
  const fov = (Math.atan((Math.tan(half) * design) / aspect) * 360) / Math.PI;
  return { ...rig, fov: Math.round(fov * 100) / 100 };
}

/** The rig set for a screen of this aspect (width over height). */
export function cavernRigsFor(aspect: number): Record<SceneRigName, CameraRig> & Record<string, CameraRig> {
  const phone = aspect < 1;
  const base = phone ? CAVERN_PHONE_RIGS : CAVERN_WIDE_RIGS;
  const design = phone ? CAVERN_PHONE_ASPECT : CAVERN_DESIGN_ASPECT;
  const out: Record<string, CameraRig> = {};
  for (const [name, rig] of Object.entries(base)) out[name] = holdWidth(rig, aspect, design);
  return out as Record<SceneRigName, CameraRig> & Record<string, CameraRig>;
}

/** The window's aspect when the scene is built; 16:9 with no window (a unit test, a worker). */
export function viewportAspect(): number {
  if (typeof window === 'undefined') return CAVERN_DESIGN_ASPECT;
  const w = window.innerWidth;
  const h = window.innerHeight;
  return w > 0 && h > 0 ? w / h : CAVERN_DESIGN_ASPECT;
}
