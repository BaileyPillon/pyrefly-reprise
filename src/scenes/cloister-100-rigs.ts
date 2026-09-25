import type { CameraRig } from '../engine/BattleCamera.ts';
import type { SceneRigName } from './types.ts';
import { holdWidth } from './cavern-stolen-fayth-rigs.ts';

// ---------------------------------------------------------------------------
// Cloister 100's camera rigs, by the shape of the screen (FFX-2 only)
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only [AGENTS.md rule 14]: Chapter XIII's own framing,
// solved against the FFX-2 HUD (the boss plate top left, the command list and
// the party plates on the right). The aspect rule is the Cavern's
// (`cavern-stolen-fayth-rigs.ts`): chosen once when the scene is built.
//
// - **16:9 and wider**: {@link CLOISTER_WIDE_RIGS}. The same room geometry as
//   the approved Bevelle Underground staging the art round's engine frames
//   used (`docs/concepts/chapters/trema/INSTALLED.md`): the party in the lower
//   left, the boss right of centre and further back, both clear of the FFX-2
//   HUD at 1280x720, 1600x900 and 2000x1012.
// - **Between square and 16:9**: the wide rigs with the fov opened to 16:9's
//   width (`holdWidth`).
// - **Portrait (a phone)**: {@link CLOISTER_PHONE_RIGS}, pulled back and
//   centred so the boss and the party stand whole in the band the phone HUD
//   leaves open.
//
// `trema-link` ({@link CLOISTER_LINK_RIG}) is the link seam's shot: the
// story's `camera('trema-link')` cuts here, and the scene starts the kill link
// when the camera arrives (`cloister-100-link.ts`).

/** The link seam's rig. Mirrored in `src/story/scripts/ffx2-trema.ts` (`TREMA_LINK_RIG`); a test pins them. */
export const CLOISTER_LINK_RIG = 'trema-link';

/** The aspect the wide rigs were solved at. */
export const CLOISTER_DESIGN_ASPECT = 16 / 9;
/** The aspect the phone rigs were solved at (390x844). */
export const CLOISTER_PHONE_ASPECT = 390 / 844;

/** The camera the parallax stack and the plate are solved for: the `idle` rig's position. */
export const CLOISTER_CAMERA_REF: [number, number, number] = [0, 3.0, 9.6];

type RigSet = Readonly<Record<SceneRigName, CameraRig> & Record<string, CameraRig>>;

/**
 * FFX-2 framing, fov 32. `enemy` pushes onto the boss spot (Paragon's reveal,
 * then Trema's); `party` holds the three girls; `trema-link` is wide enough
 * to hold the standing Paragon and the old man's entrance on its right.
 */
export const CLOISTER_WIDE_RIGS: RigSet = {
  intro: { position: [0.15, 5.5, 16.4], lookAt: [0.5, 2.5, -3.0], fov: 30, sway: 1.5 },
  idle: { position: CLOISTER_CAMERA_REF, lookAt: [0.15, 1.5, -1.3], fov: 32 },
  action: { position: [0.15, 2.7, 9.0], lookAt: [1.0, 1.5, -1.2], fov: 32, sway: 0.7 },
  party: { position: [0.5, 2.3, 8.2], lookAt: [-0.35, 1.4, 0.9], fov: 32, sway: 0.7 },
  enemy: { position: [0.8, 3.1, 7.2], lookAt: [2.0, 1.9, -2.8], fov: 32, sway: 0.7 },
  [CLOISTER_LINK_RIG]: { position: [0.9, 3.2, 10.6], lookAt: [2.2, 1.9, -3.2], fov: 34, sway: 0.5 },
  victory: { position: [0.4, 2.2, 8.6], lookAt: [-0.5, 1.45, 0.9], fov: 32, sway: 1.2 },
};

/**
 * The phone's framing (390x844). The FFX-2 HUD on a phone is a 16:9 band across the middle of
 * the screen (the boss plate, the guide, the command list and the party plates all live in it),
 * so the fight is framed **below the band**, where the screen is otherwise empty floor: a low
 * camera looking up the hall, the Cloister's vault and banners filling the top, Paragon and the
 * party standing whole between the band and the bottom edge. Solved at 390x844 (every figure's
 * box below y 545 and inside the screen at `idle`); `party` and `victory` hold the girls, `enemy`
 * the boss, `trema-link` the boss and the old man's entrance spot above the band (the seam's
 * dialogue box sits over the lower third).
 */
export const CLOISTER_PHONE_RIGS: RigSet = {
  intro: { position: [0.3, 5.2, 17.5], lookAt: [0.4, 2.2, -3.0], fov: 44, sway: 1.1 },
  idle: { position: [-1.5, 2.0, 15.0], lookAt: [-0.2, 5.0, -3.0], fov: 40 },
  action: { position: [-1.5, 2.5, 12.0], lookAt: [0.25, 5.0, -3.0], fov: 40, sway: 0.5 },
  party: { position: [-1.5, 3.0, 10.0], lookAt: [-1.0, 3.0, -3.0], fov: 40, sway: 0.5 },
  enemy: { position: [-1.5, 3.0, 10.5], lookAt: [0.75, 5.0, -3.0], fov: 40, sway: 0.5 },
  // The seam's dialogue box covers the phone's lower third, so the kill link is framed above the band.
  [CLOISTER_LINK_RIG]: { position: [-1.25, 5.5, 14.0], lookAt: [1.75, -2.0, -3.0], fov: 40, sway: 0.3 },
  victory: { position: [-1.5, 3.0, 10.5], lookAt: [-1.0, 3.2, -3.0], fov: 40, sway: 0.8 },
};

/** The rig set for a screen of this aspect (width over height). */
export function cloisterRigsFor(aspect: number): Record<SceneRigName, CameraRig> & Record<string, CameraRig> {
  const phone = aspect < 1;
  const base = phone ? CLOISTER_PHONE_RIGS : CLOISTER_WIDE_RIGS;
  const design = phone ? CLOISTER_PHONE_ASPECT : CLOISTER_DESIGN_ASPECT;
  const out: Record<string, CameraRig> = {};
  for (const [name, rig] of Object.entries(base)) out[name] = holdWidth(rig, aspect, design);
  return out as Record<SceneRigName, CameraRig> & Record<string, CameraRig>;
}
