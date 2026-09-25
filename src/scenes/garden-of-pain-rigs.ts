import type { CameraRig } from '../engine/BattleCamera.ts';
import type { SceneRigName } from './types.ts';
import { holdWidth } from './cavern-stolen-fayth-rigs.ts';

// ---------------------------------------------------------------------------
// The Garden of Pain's camera rigs, by the shape of the screen (FFX only)
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]: Chapter XII's own framing, solved
// against the FFX HUD (the guide and best-move tags top left, the CTB list and
// the enemy-move tag on the right, the command stack bottom left, the party rows
// bottom right). The aspect rule is the Cavern's (`cavern-stolen-fayth-rigs.ts`):
// chosen once when the scene is built.
//
// - **16:9 and wider**: {@link GARDEN_WIDE_RIGS}. The geometry the art round's
//   engine frames were judged in (`docs/concepts/chapters/omnis/production/
//   battle-1600.jpg`: Chapter III's staging, the Garden plate in place of Dream's
//   End): the party in the lower left, Seymour on the steps right of centre with
//   two discs each side, all of it clear of the HUD at 1280x720, 1600x900 and
//   2000x1012.
// - **Between square and 16:9**: the wide rigs with the fov opened to 16:9's
//   width (`holdWidth`).
// - **Portrait (a phone)**: {@link GARDEN_PHONE_RIGS}, framed for the phone HUD
//   (option B, 2026-09-25: a 16:9 render of the field's height, slid to keep
//   the party and the aimed figure whole) so the party, Seymour and all four
//   discs fit the window's slice together.

/** The aspect the wide rigs were solved at. */
export const GARDEN_DESIGN_ASPECT = 16 / 9;
/** The aspect the phone rigs were solved at (390x844). */
export const GARDEN_PHONE_ASPECT = 390 / 844;

/** The camera the parallax stack and the plate are solved for: the `idle` rig's position (Dream's End's). */
export const GARDEN_CAMERA_REF: [number, number, number] = [0, 2.75, 9.8];

type RigSet = Readonly<Record<SceneRigName, CameraRig> & Record<string, CameraRig>>;

/**
 * FFX framing, fov 30-32, a nearly level camera, as Dream's End (the same dungeon, and the
 * frame the art was judged in). `intro` looks up the steps at him; `enemy` pushes onto him and
 * his discs; `party` holds the three in front; `victory` turns back to the party.
 */
export const GARDEN_WIDE_RIGS: RigSet = {
  intro: { position: [0.6, 2.2, 14.0], lookAt: [1.6, 3.2, -4.5], fov: 30, sway: 1.3 },
  idle: { position: GARDEN_CAMERA_REF, lookAt: [0.15, 1.9, -1.4], fov: 32 },
  action: { position: [0.08, 2.55, 9.1], lookAt: [0.8, 1.95, -1.2], fov: 32, sway: 0.7 },
  party: { position: [0.0, 2.15, 8.0], lookAt: [-0.8, 1.25, 0.5], fov: 32, sway: 0.7 },
  enemy: { position: [1.5, 2.8, 5.6], lookAt: [2.6, 2.3, -3.0], fov: 34, sway: 0.7 },
  victory: { position: [-0.2, 2.1, 8.2], lookAt: [-0.8, 1.3, 0.9], fov: 32, sway: 1.2 },
};

/**
 * The phone's framing (390x844, the phone HUD B). The phone shows a 16:9 render of the field's
 * height, slid sideways to keep the acting figure, the party and the largest enemy whole
 * (`src/ui/common/phoneFraming.ts`), so these rigs are solved for a 16:9 frame of which the
 * window shows 390 / 924 of the width: at `idle` the party, Seymour and all four discs fit that
 * slice together (92 % of it) and sit centred in the field's height.
 */
export const GARDEN_PHONE_RIGS: RigSet = {
  intro: { position: [1.2, 3.0, 17.0], lookAt: [1.8, 2.6, -4.0], fov: 36, sway: 1.1 },
  idle: { position: [0.8, 3.4, 14.0], lookAt: [0.9, 1.2, -2.0], fov: 35 },
  action: { position: [0.8, 3.3, 13.6], lookAt: [0.95, 1.3, -2.0], fov: 35, sway: 0.6 },
  party: { position: [-0.3, 3.0, 11.5], lookAt: [-0.4, 1.2, 0.5], fov: 36, sway: 0.6 },
  enemy: { position: [2.1, 3.0, 11.5], lookAt: [2.15, 2.0, -3.0], fov: 38, sway: 0.6 },
  victory: { position: [-0.3, 3.0, 12.0], lookAt: [-0.3, 1.4, 0.4], fov: 36, sway: 1.0 },
};

/** The rig set for a screen of this aspect (width over height). */
export function gardenRigsFor(aspect: number): Record<SceneRigName, CameraRig> & Record<string, CameraRig> {
  const phone = aspect < 1;
  const base = phone ? GARDEN_PHONE_RIGS : GARDEN_WIDE_RIGS;
  const design = phone ? GARDEN_PHONE_ASPECT : GARDEN_DESIGN_ASPECT;
  const out: Record<string, CameraRig> = {};
  for (const [name, rig] of Object.entries(base)) out[name] = holdWidth(rig, aspect, design);
  return out as Record<SceneRigName, CameraRig> & Record<string, CameraRig>;
}
