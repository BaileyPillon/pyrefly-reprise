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
// On whose word: Bailey, 2026-09-27, "cant you just have the characters and
// enemy switch sides? not mirrored just literally switch sides" (D-262) and
// "I'll go with all of your recommendations" (~13:00 EDT: D-259 the Film art,
// D-244 E1 the phone framing). So the party stands on the LEFT and faces
// screen-right; Guard Scorpion stands on the RIGHT and faces screen-left,
// towering over them. Nothing is mirrored: each Film painting was painted
// facing the way it stands (a figure facing right shows its right side, so
// Barret's gun-arm is his near arm and Cloud's pauldron his far shoulder), each
// sidecar says so, and `mirrorFor` never flips.
//
// What is ours: every number here is **our estimate** (presentation, not game
// data, rule 6), solved so the fighters land where the approved Film frame
// puts them (`docs/concepts/ff7-art-2026-09-27/hifi/scripts/compose.py`, the
// desk and phone layouts: at 1600x900 Cloud 300 px tall with his feet near
// 615, Barret 318 px upstage-left, Guard Scorpion's tail-down idle 362 px with
// its raised tail under the message window). Both start in the FRONT row
// [research/ff7-battle-staging.md §5]; the back row stands further from the
// enemy, which with the party on the left is further LEFT. The camera is FF7's
// "Fixed" Camera Angle (manual p. 30, staging §4). On an upright phone the
// formation is drawn in and the camera moves in (E1, fighters about 2.5x the
// letterboxed field), with the painting cropped to cover the frame.

/** The painting: the Film reactor core (D-259), installed as `backdrops/ff7-film-reactor.png`. */
export const SECTOR1_PLATE = { w: 2304, h: 1296, url: 'art/backdrops/ff7-film-reactor.png' } as const;

/** The Film art ids (D-259). The round-2 `ff7-*` files stay installed and unused. */
export const SECTOR1_ART = {
  cloud: 'ff7-film-cloud',
  barret: 'ff7-film-barret',
  boss: 'ff7-film-guard-scorpion',
  bossTailUp: 'ff7-film-guard-scorpion-tail-up',
} as const;

/** Vertical fov of the fixed camera on a desk, degrees. */
export const SECTOR1_FOV = 30;
/** Vertical fov on an upright phone (E1: the camera moved in on a drawn-in formation). */
export const SECTOR1_PHONE_FOV = 60;
/** The frame the desk layout was solved at. */
export const SECTOR1_DESIGN_ASPECT = 16 / 9;

/** How far the fixed camera looks down, degrees. */
export const SECTOR1_PITCH_DEG = 8;

/** The fixed camera: raised, on the hall axis, pitched down {@link SECTOR1_PITCH_DEG} (its look point at z 0). */
export const SECTOR1_CAMERA = {
  position: [0, 2.6, 11],
  lookAt: [0, 2.6 - 11 * Math.tan((SECTOR1_PITCH_DEG * Math.PI) / 180), 0],
} as const;

/** The painting plane's distance from the camera along its view axis. */
export const SECTOR1_BACKDROP_DISTANCE = 26;

/** World heights, one per combatant (every pose of a subject shares its idle's pixel scale). Our estimate. */
export const SECTOR1_HEIGHTS = { cloud: 1.95, barret: 2.35, 'guard-scorpion': 2.35 } as const;

type Spot = readonly [number, number, number];

/** One framing of the field: where everyone stands, the lens, how far the painting is zoomed past covering the frame. */
export interface Sector1Layout {
  readonly name: 'desk' | 'phone';
  /** Front-row spots by combatant `slot` (0 Cloud downstage, 1 Barret upstage-left). */
  readonly front: readonly Spot[];
  /** Guard Scorpion's spot: its rear foot (every one of its paintings is centred there). */
  readonly boss: Spot;
  /** How far the back row stands from the front, in x (negative: away from the enemy, to the left). */
  readonly backRowDx: number;
  readonly fov: number;
  /** The painting covers the frame, then this much more; its bottom edge sits on the frame's. */
  readonly plateZoom: number;
  /** How far in front of the rifles' tips a melee attacker stops, world units. */
  readonly strikeGap: number;
}

/** 16:9 and wider (and every landscape window): the approved Film frame. */
export const SECTOR1_DESK: Sector1Layout = {
  name: 'desk',
  front: [[-2.42, 0, 0.26], [-4.11, 0, -1.32], [-3.3, 0, 1.4]],
  boss: [2.19, 0, 0.18],
  backRowDx: -0.75,
  fov: SECTOR1_FOV,
  plateZoom: 1.12,
  strikeGap: 0.55,
};

/** An upright phone (E1): the formation drawn in, the camera moved in, the painting cropped to cover. */
export const SECTOR1_PHONE: Sector1Layout = {
  name: 'phone',
  front: [[-1.1, 0, 1.1], [-2.3, 0, -0.12], [-1.9, 0, 1.9]],
  boss: [1.39, 0, 0.64],
  backRowDx: -0.45,
  fov: SECTOR1_PHONE_FOV,
  plateZoom: 1.3,
  strikeGap: 0.3,
};

/** The layout for a frame of this aspect. */
export function sector1Layout(aspect: number): Sector1Layout {
  return aspect > 0 && aspect < 1 ? SECTOR1_PHONE : SECTOR1_DESK;
}

/** Desk spots, kept under their old names for the published slots and the tests. */
export const SECTOR1_FRONT = SECTOR1_DESK.front;
export const SECTOR1_BOSS_SPOT = SECTOR1_DESK.boss;
export const SECTOR1_BACK_ROW_DX = SECTOR1_DESK.backRowDx;

/**
 * How far the rifles' tips stand in front of Guard Scorpion's spot (its rear
 * foot), world units: 892 of the idle's 1060 source px above the floor, at its
 * height (the painting, `gs/idle/cut-tj`).
 */
export const SECTOR1_BOSS_FRONT = (892 / 1060) * 2.35;

/** Where a melee attacker stops to strike Guard Scorpion in `layout`: just in front of its rifles, a little nearer the camera. Our estimate. */
export function strikeSpot(layout: Sector1Layout = SECTOR1_DESK): [number, number, number] {
  const [bx, by, bz] = layout.boss;
  return [bx - SECTOR1_BOSS_FRONT - layout.strikeGap, by, bz + 0.5];
}

/** The boss's combatant id (`src/data/ff7/enemies/guard-scorpion.ts`). */
export const SECTOR1_BOSS_ID = 'guard-scorpion';
/** The tail-raised painting's art id (the form's `spriteKey`). */
export const SECTOR1_TAIL_UP_ART = SECTOR1_ART.bossTailUp;

/**
 * The round-2 paintings came from one frame with different crops, so the
 * raised one had to stand 71 source px right to keep the body still. The Film
 * paintings are all padded to centre on the rear foot (`film-set/scripts/
 * install.py`), so the idle, the raised tail and both recoils need no shift.
 */
const ROUND2_TAIL_UP = { art: 'ff7-guard-scorpion-tail-up', shiftPx: 681 - 610, baseline: 681 } as const;

/** How far right the figure stands while `artId` shows, in world units. 0 for every Film painting. */
export function bossArtShift(artId: string, height: number = SECTOR1_HEIGHTS['guard-scorpion']): number {
  return artId === ROUND2_TAIL_UP.art ? (ROUND2_TAIL_UP.shiftPx * height) / ROUND2_TAIL_UP.baseline : 0;
}

export type Ff7RowName = 'front' | 'back';

/** Where a party member on `slot` stands in `row`, in `layout` (the desk's by default). */
export function rowSpot(slot: number, row: Ff7RowName, layout: Sector1Layout = SECTOR1_DESK): [number, number, number] {
  const s = layout.front[Math.max(0, Math.min(slot, layout.front.length - 1))]!;
  return [s[0] + (row === 'back' ? layout.backRowDx : 0), s[1], s[2]];
}

/**
 * FF7's staging switches (`src/scenes/types.ts`) for a layout: the party turns
 * toward +x (screen-right) and the boss toward -x, the camera is fixed, the
 * party stands exactly on its row spots, the boss on its own, each figure has
 * its solved height, and no figure gets a turn ring (FF7's triangle marks the turn).
 */
export function sector1Staging(layout: Sector1Layout = SECTOR1_DESK): SceneStaging {
  return {
    sideFacing: { party: 1, enemy: -1 },
    fixedCamera: true,
    turnRings: false,
    holdParty: true,
    enemySpots: { [SECTOR1_BOSS_ID]: [layout.boss[0], layout.boss[1], layout.boss[2]] },
    figureHeights: { ...SECTOR1_HEIGHTS },
    figureExtent: 3.2, // Guard Scorpion's paintings, padded to its rear foot, run up to 2.7x its height
  };
}

/** The desk staging (the published slots). */
export const SECTOR1_STAGING: SceneStaging = sector1Staging(SECTOR1_DESK);

/** The fixed shot at the desk fov. Every rig the presenter asks for is this one, so no cut or move changes the angle. */
export const SECTOR1_FIXED_RIG: CameraRig = {
  position: [...SECTOR1_CAMERA.position],
  lookAt: [...SECTOR1_CAMERA.lookAt],
  fov: SECTOR1_FOV,
  sway: 0,
};

/** The fixed shot for a frame of this aspect: the desk lens opened to keep the width, or the phone's own lens. */
export function sector1FixedRig(aspect: number): CameraRig {
  const layout = sector1Layout(aspect);
  if (layout.name === 'phone') return { ...SECTOR1_FIXED_RIG, fov: layout.fov };
  return holdWidth(SECTOR1_FIXED_RIG, aspect, SECTOR1_DESIGN_ASPECT);
}

/**
 * F1's opening shot (our estimate): close on the boss's face, slightly below
 * it, before the camera settles on the fixed view. Only the FF7 opening moves
 * the camera there (`BattleScreenFf7Opening.ts`); the presenter never asks.
 */
export function sector1OpeningRig(aspect: number): CameraRig {
  const layout = sector1Layout(aspect);
  const [bx, , bz] = layout.boss;
  const phone = layout.name === 'phone';
  return {
    position: [bx - (phone ? 0.3 : 0.9), 1.35, bz + (phone ? 6.2 : 5.4)],
    lookAt: [bx - (phone ? 0.2 : 0.7), 1.05, bz],
    fov: phone ? 44 : 30,
    sway: 0,
  };
}

/**
 * G1's pan up over the fallen party (our estimate: "the camera pans up showing
 * the dead characters", FF Wiki "Game Over (term)", revid 4032692): the camera
 * rises and tilts up toward the core, the party small at the bottom of the frame.
 */
export function sector1GameOverRig(aspect: number): CameraRig {
  const fixed = sector1FixedRig(aspect);
  const p = fixed.position as readonly number[];
  const l = fixed.lookAt as readonly number[];
  return { ...fixed, position: [p[0]!, p[1]! + 0.55, p[2]! - 0.8], lookAt: [l[0]!, l[1]! + 1.05, l[2]!] };
}

/** The rig set for a render of this aspect: the one fixed shot everywhere, plus F1's opening and G1's pan. */
export function sector1RigsFor(aspect: number): Record<SceneRigName, CameraRig> & Record<string, CameraRig> {
  const rig = sector1FixedRig(aspect);
  const out: Record<string, CameraRig> = {};
  for (const name of ['intro', 'idle', 'action', 'victory', 'enemy', 'party']) out[name] = { ...rig };
  out['ff7-open'] = sector1OpeningRig(aspect);
  out['ff7-gameover'] = sector1GameOverRig(aspect);
  return out as Record<SceneRigName, CameraRig> & Record<string, CameraRig>;
}

/**
 * The painting plane, square to the pitched view axis at
 * {@link SECTOR1_BACKDROP_DISTANCE}, for a frame of this aspect: big enough to
 * cover the whole frame (width and height) times the layout's zoom, centred
 * across, its bottom edge on the frame's bottom edge (the band hides the last
 * of the floor). The core's lit crown is what a narrower frame crops.
 *
 * `distance` and `centreY` are the plane centre's world z and y (what
 * `Backdrop.create` places), `pitch` the tilt the scene gives the plane, radians.
 */
export function sector1Backdrop(aspect: number = SECTOR1_DESIGN_ASPECT): { width: number; distance: number; centreY: number; pitch: number } {
  const layout = sector1Layout(aspect);
  const fov = sector1FixedRig(aspect).fov ?? SECTOR1_FOV;
  const pitch = (SECTOR1_PITCH_DEG * Math.PI) / 180;
  const D = SECTOR1_BACKDROP_DISTANCE;
  const halfH = D * Math.tan((fov * Math.PI) / 360);
  const halfW = halfH * aspect;
  const plateAspect = SECTOR1_PLATE.w / SECTOR1_PLATE.h;
  const plateH = Math.max(2 * halfH, (2 * halfW) / plateAspect) * layout.plateZoom;
  const width = plateH * plateAspect;
  // In the plane, up from the view axis: the frame's bottom edge is -halfH.
  const up = -halfH + plateH / 2;
  const [, cy, cz] = SECTOR1_CAMERA.position;
  // Forward (0, -sin, -cos), up (0, cos, -sin).
  return {
    width,
    distance: cz - D * Math.cos(pitch) - up * Math.sin(pitch),
    centreY: cy - D * Math.sin(pitch) + up * Math.cos(pitch),
    pitch,
  };
}
