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
//   rule 6): the heights reproduce the composite Bailey saw (each figure's
//   pixel height against its screen depth, for a level camera at fov 30); the
//   camera stands a little further back than the composite's scale (figures
//   about 7% smaller) so that either member's back-row spot stays whole in the
//   frame; the spots keep the composite's arrangement (boss left, Barret
//   upstage, Cloud downstage right). The back-row step is ours.

/** The painting: round 1 `reactor-core/core.1`, installed as `backdrops/ff7-sector1-reactor.png`. */
export const SECTOR1_PLATE = { w: 2688, h: 1536, url: 'art/backdrops/ff7-sector1-reactor.png' } as const;

/** Vertical fov of the fixed camera, degrees. */
export const SECTOR1_FOV = 30;
/** The composite's frame the rigs were solved at. */
export const SECTOR1_DESIGN_ASPECT = 16 / 9;

/** The fixed camera: level (its look point at its own height), on the hall axis. */
export const SECTOR1_CAMERA = { position: [0, 1.9, 8.6], lookAt: [0, 1.9, 0] } as const;

/** The painting plane's depth. The plane is sized in {@link sector1Backdrop} to fill the frame there. */
export const SECTOR1_BACKDROP_Z = -12;

/** World heights: Cloud the house human 1.75; Barret and the boss solved from the composite's pixel heights. */
export const SECTOR1_HEIGHTS = { cloud: 1.75, barret: 2.03, 'guard-scorpion': 2.16 } as const;

/**
 * Party slots by combatant `slot` (0 Cloud, 1 Barret), front row: an arc at
 * about one distance from the boss (Cloud 4.37, Barret 4.27), Barret upstage
 * and nearer the hall axis as in the composite, so neither hides the other.
 */
export const SECTOR1_FRONT: ReadonlyArray<readonly [number, number, number]> = [
  [2.55, 0, 0.6],
  [2.15, 0, -1.4],
  [2.95, 0, 1.9],
];

/** How far the back row stands behind the front, in +x (away from the enemy). Our estimate. */
export const SECTOR1_BACK_ROW_DX = 0.6;

/** Guard Scorpion's spot, left of the hall axis (its tail tip just inside the frame's left edge). */
export const SECTOR1_BOSS_SPOT: readonly [number, number, number] = [-1.8, 0, 0.22];

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
 * spots, the boss on its own, and each figure has its solved height.
 */
export const SECTOR1_STAGING: SceneStaging = {
  sideFacing: { party: -1, enemy: 1 },
  fixedCamera: true,
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
 * The painting plane: at {@link SECTOR1_BACKDROP_Z}, centred on the camera's
 * axis, 2% larger than the 16:9 frame there (the composite's framing: the
 * plate fit to the width, a sliver cropped top and bottom). The same plane at
 * every aspect: a narrower screen keeps the width (`holdWidth`), so the fight
 * and its painted floor stay registered and an upright window shows the
 * scene's background colour above and below (a letterbox). Growing the plate
 * to fill a portrait frame instead would float the fighters over the middle
 * of the painting, far above its floor. The upright phone's own framing is the
 * FF7 HUD's call (the FFX/FFX-2 phone HUD draws a 16:9 render and slides it).
 */
export function sector1Backdrop(): { width: number; distance: number; centreY: number } {
  const d = SECTOR1_CAMERA.position[2] - SECTOR1_BACKDROP_Z;
  const halfH = d * Math.tan((SECTOR1_FOV * Math.PI) / 360);
  const plate = SECTOR1_PLATE.w / SECTOR1_PLATE.h;
  const width = Math.max(2 * halfH * SECTOR1_DESIGN_ASPECT, 2 * halfH * plate) * 1.02;
  return { width, distance: SECTOR1_BACKDROP_Z, centreY: SECTOR1_CAMERA.lookAt[1] };
}
