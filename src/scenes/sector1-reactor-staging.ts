import type { CameraRig } from '../engine/BattleCamera.ts';
import type { SceneRigName, SceneStaging } from './types.ts';
import { holdWidth } from './cavern-stolen-fayth-rigs.ts';

// ---------------------------------------------------------------------------
// The No. 1 Reactor core: FF7's battle staging for Guard Scorpion (FF7 only)
// ---------------------------------------------------------------------------
//
// Game case: FF7 only [AGENTS.md rule 14]. The hidden, experimental Guard
// Scorpion encounter (`src/data/chapter-ff7-guard-scorpion.ts`). No FFX or
// FFX-2 scene reads this module.
//
// On whose word: Bailey, 2026-09-27 ~00:45 EDT, "full speed ahead please.
// godspeed. ill go with all your recommendations." (D-240), which accepted
// FF7's own battle staging (`research/ff7-battle-staging.md`, "staging") and
// the art picks shown together in
// `docs/concepts/ff7-art-2026-09-27/round2/13-composite-1600-clean.jpg`.
//
// What is sourced and what is ours:
// - The party stands on the RIGHT and faces LEFT; Guard Scorpion is on the
//   LEFT and faces RIGHT [staging §2, §3.3: verified by 2 informal sources for
//   the side, derived for the facing]. Nothing is mirrored: every painting was
//   painted facing the way it stands (the stage's `sideFacing` below turns the
//   bodies, and each sidecar's `facing` agrees, so `mirrorFor` never flips).
// - Both start in the FRONT row [staging §5, single source: FF Wiki Row]; the
//   front row stands nearer the enemy, the back row further back, which with
//   the party on the right is further RIGHT [staging §5, derived].
// - The camera is FF7's "Fixed" Camera Angle setting (manual p. 30: "The
//   camera angle is fixed to a specific angle when you encounter enemies. The
//   battle continues at this fixed angle"; staging §4). The factory default is
//   Auto, which moves [staging §4, S4]; the moving camera is a follow-up.
// - Everything numeric here is **our estimate** (presentation, not game data,
//   rule 6). Repair pass after the FF7 purist review (2026-09-27): FF7's
//   Normal-formation stills and the A+ target look DOWN on the arena floor
//   from a raised camera, with every combatant whole above the HUD band (whose
//   top edge is 71% of a 16:9 frame). So the fixed camera stands high and
//   pitches down {@link SECTOR1_PITCH_DEG}, the painting is turned square to
//   that view and lifted so its grated floor ends at the band's top edge
//   ({@link SECTOR1_PLATE_BOTTOM}), and every figure stands on that painted
//   floor with its feet above the band (Cloud's lowest, about 66% of the
//   frame). The party stands side by side across the field in depth, facing
//   the enemy [staging §3.1, "stands in a line facing the opponents"], so from
//   the raised camera Cloud (downstage) and Barret (upstage) read as a
//   diagonal. The back-row step is ours.

/** The painting: round 1 `reactor-core/core.1`, installed as `backdrops/ff7-sector1-reactor.png`. */
export const SECTOR1_PLATE = { w: 2688, h: 1536, url: 'art/backdrops/ff7-sector1-reactor.png' } as const;

/** Vertical fov of the fixed camera, degrees. */
export const SECTOR1_FOV = 30;
/** The composite's frame the rigs were solved at. */
export const SECTOR1_DESIGN_ASPECT = 16 / 9;

/**
 * How far the fixed camera looks down, degrees: the painting's own vanishing
 * line (the floor grate's convergence, about 52% down the plate) lands at 22%
 * of the frame height, as high as FF7's raised battle camera puts its horizon.
 */
export const SECTOR1_PITCH_DEG = 8.47;

/** The fixed camera: raised, on the hall axis, pitched down {@link SECTOR1_PITCH_DEG} (its look point at z 0). */
export const SECTOR1_CAMERA = {
  position: [0, 3.1, 13.8],
  lookAt: [0, 3.1 - 13.8 * Math.tan((SECTOR1_PITCH_DEG * Math.PI) / 180), 0],
} as const;

/** Where the painting's bottom edge sits, as a fraction of the 16:9 frame's height: the band's top edge (71%) and a sliver under it. */
export const SECTOR1_PLATE_BOTTOM = 0.72;

/** The painting plane's distance from the camera along its view axis. The plane is sized in {@link sector1Backdrop} to fill the frame's width there. */
export const SECTOR1_BACKDROP_DISTANCE = 26;

/** World heights: Cloud the house human 1.75; Barret and the boss solved from the composite's pixel heights. */
export const SECTOR1_HEIGHTS = { cloud: 1.75, barret: 2.03, 'guard-scorpion': 2.16 } as const;

/**
 * Party slots by combatant `slot` (0 Cloud, 1 Barret), front row: side by side
 * across the field in depth, facing the enemy [staging §3.1], Cloud downstage
 * (nearer the camera) and Barret upstage, both the same distance across from the
 * boss (x 4.1, 7.3 from it), so both are one front row [staging §5]. From the
 * raised camera they read as a diagonal: at 1600x900 Barret's feet stand about
 * 70 px above Cloud's and 90 px nearer the middle, Cloud's at 66% of the height.
 */
export const SECTOR1_FRONT: ReadonlyArray<readonly [number, number, number]> = [
  [4.1, 0, 0.9],
  [4.1, 0, -1.9],
  [4.1, 0, 2.3],
];

/** How far the back row stands behind the front, in +x (away from the enemy). Our estimate. */
export const SECTOR1_BACK_ROW_DX = 0.6;

/** Guard Scorpion's spot, left of the hall axis (its tail tip just inside the frame's left edge), between the two members in depth. */
export const SECTOR1_BOSS_SPOT: readonly [number, number, number] = [-3.1, 0, -0.5];

/** The boss's combatant id (`src/data/ff7/enemies/guard-scorpion.ts`). */
export const SECTOR1_BOSS_ID = 'guard-scorpion';
/** The tail-raised painting's art id (the form's `spriteKey`). */
export const SECTOR1_TAIL_UP_ART = 'ff7-guard-scorpion-tail-up';

/**
 * The two cut-outs come from one 1216x832 frame (ground on source row 827):
 * the idle's crop is x 4..1216 (centre 610), the raised one's x 146..1216
 * (centre 681). A plane is centred on its figure's position, so while the
 * raised form shows, the figure moves right by 71 source px to keep the body
 * still (the sidecar's `scale` 748/681 keeps its size).
 */
export const SECTOR1_TAIL_UP_SHIFT_PX = 681 - 610;
/** Idle painting's `baselineY`: its source px per world unit is `681 / height`. */
export const SECTOR1_BOSS_IDLE_BASELINE = 681;

/** How far right the figure stands while `artId` shows, in world units. 0 for the idle painting. */
export function bossArtShift(artId: string, height = SECTOR1_HEIGHTS['guard-scorpion']): number {
  if (artId !== SECTOR1_TAIL_UP_ART) return 0;
  return (SECTOR1_TAIL_UP_SHIFT_PX * height) / SECTOR1_BOSS_IDLE_BASELINE;
}

export type Ff7RowName = 'front' | 'back';

/** Where a party member on `slot` stands in `row`. */
export function rowSpot(slot: number, row: Ff7RowName): [number, number, number] {
  const s = SECTOR1_FRONT[Math.max(0, Math.min(slot, SECTOR1_FRONT.length - 1))]!;
  return [s[0] + (row === 'back' ? SECTOR1_BACK_ROW_DX : 0), s[1], s[2]];
}

/**
 * FF7's staging switches (`src/scenes/types.ts`): bodies face the other way
 * from FFX/FFX-2, the camera is fixed, the party stands exactly on its row
 * spots, the boss on its own, each figure has its solved height, and no
 * figure gets a turn ring (FF7's triangle is the only turn marker).
 */
export const SECTOR1_STAGING: SceneStaging = {
  sideFacing: { party: -1, enemy: 1 },
  fixedCamera: true,
  turnRings: false,
  holdParty: true,
  enemySpots: { [SECTOR1_BOSS_ID]: [SECTOR1_BOSS_SPOT[0], SECTOR1_BOSS_SPOT[1], SECTOR1_BOSS_SPOT[2]] },
  figureHeights: { ...SECTOR1_HEIGHTS },
};

/** The fixed shot. Every rig the presenter asks for is this one, so no cut or move changes the angle. */
export const SECTOR1_FIXED_RIG: CameraRig = {
  position: [...SECTOR1_CAMERA.position],
  lookAt: [...SECTOR1_CAMERA.lookAt],
  fov: SECTOR1_FOV,
  sway: 0,
};

/** The rig set for a render of this aspect: all one fixed shot, its fov opened on a narrower screen to keep the width. */
export function sector1RigsFor(aspect: number): Record<SceneRigName, CameraRig> & Record<string, CameraRig> {
  const rig = holdWidth(SECTOR1_FIXED_RIG, aspect, SECTOR1_DESIGN_ASPECT);
  const out: Record<string, CameraRig> = {};
  for (const name of ['intro', 'idle', 'action', 'victory', 'enemy', 'party']) out[name] = { ...rig };
  return out as Record<SceneRigName, CameraRig> & Record<string, CameraRig>;
}

/**
 * The painting plane, square to the pitched view axis at
 * {@link SECTOR1_BACKDROP_DISTANCE}: as wide as the 16:9 frame there plus 2%
 * (its height follows the plate's 2688x1536), and lifted along the view's up
 * axis until its bottom edge sits at {@link SECTOR1_PLATE_BOTTOM} of the frame,
 * so the painted floor runs from about 56% of the frame down to the band. The
 * top of the painting (the core's lit crown) is cropped. The same plane at
 * every aspect: a narrower screen keeps the width (`holdWidth`), so the fight
 * stays registered on its painted floor and an upright window shows the
 * scene's background colour above and below.
 *
 * `distance` and `centreY` are the plane centre's world z and y (what
 * `Backdrop.create` places), `pitch` the tilt the scene gives the plane, radians.
 */
export function sector1Backdrop(): { width: number; distance: number; centreY: number; pitch: number } {
  const pitch = (SECTOR1_PITCH_DEG * Math.PI) / 180;
  const D = SECTOR1_BACKDROP_DISTANCE;
  const halfH = D * Math.tan((SECTOR1_FOV * Math.PI) / 360);
  const width = 2 * halfH * SECTOR1_DESIGN_ASPECT * 1.02;
  const plateH = (width * SECTOR1_PLATE.h) / SECTOR1_PLATE.w;
  // In the plane, up from the view axis: the frame's bottom edge is -halfH, a fraction s down the frame is halfH (1 - 2 s).
  const up = halfH * (1 - 2 * SECTOR1_PLATE_BOTTOM) + plateH / 2;
  const [, cy, cz] = SECTOR1_CAMERA.position;
  // Forward (0, -sin, -cos), up (0, cos, -sin).
  return {
    width,
    distance: cz - D * Math.cos(pitch) - up * Math.sin(pitch),
    centreY: cy - D * Math.sin(pitch) + up * Math.cos(pitch),
    pitch,
  };
}
