import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { BattleCamera, CameraRig } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { artUrl, watchAssets, type AssetWatcher } from '../engine/PaintedArt.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import { ScenePalettes } from '../engine/ScenePalettes.ts';
import { DJOSE_CHAMBER_PLATE } from '../data/ixion-plates.ts';

import { RoadPhoneCamera, roadOnPhone } from './road-to-the-farplane-phone.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory, SceneRigName } from './types.ts';
import type { SceneSlots } from './index.ts';
import { ffx2FiendFigureHeights } from '../data/ffx2/fiend-stature.ts';

// ---------------------------------------------------------------------------
// Djose Temple, the Chamber of the Fayth (FFX-2)
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only [AGENTS.md rule 14]. Chapter XVI: Ixion in the Chamber
// of the Fayth at Djose, the hole where the fayth stood in view the whole fight
// (research `ffx2-ixion-djose.md` §6.1, `[verified: 3 sources]`; concept A,
// Bailey 2026-09-27, D-265). No FFX chapter stands here.
//
// THE PAINTING IS NOT BAILEY'S PICK YET (rule 9). The plate is option C2 "The
// Faction's lamps", installed provisionally under `backdrops/djose-chamber-provisional`
// (`../data/ixion-plates.ts`, `DJOSE_CHAMBER_PLATE`); C1 "Storm-lit stone"
// (`ffx2-djose-chamber-provisional`) and the stand-in (the Macalania hall over the
// Den of Woe floor, recoloured) stay on disk. Swapping is that one constant: each
// plate has its own row in {@link DJOSE_PLATE_FRAMES} (framing and Ixion's spot).
// The scene key is the plate's own key, so the cutscene screen, the board card
// and the prep wash (which draw `backdrops/<sceneKey>.png`) find the same painting.
//
// THE FRAMING. The stand-in keeps the Den / Farplane layout (its floor line at
// 0.44 of the height), so the plate is framed as Chapter V frames its own
// (`farplane.ts`: 88 wide at z -48, centre -0.5, the idle camera at (0, 2.7,
// 9.8)), and the rigs and party slots are Chapter V's, solved against the FFX-2
// HUD at 1280x720, 1600x900 and 2000x1012 (`./den-of-woe.ts` does the same).
// The painted stone is the floor: no 3D ground.
//
// THE PHONE. On an upright phone the idle camera dollies back to Chapter XI's
// z 13.2 (PR-0201 option A, Bailey 2026-09-26, `./road-to-the-farplane-phone.ts`)
// so Ixion stays in the slice; nothing changes on a desktop.

/** The camera the plate is solved for: the `idle` rig's position (Chapter V's). */
export const DJOSE_CAMERA_REF: [number, number, number] = [0, 2.7, 9.8];

/** How one plate sits behind the stage: the plane, its sampled bands, and whether a faded 3D floor helps. */
export interface DjosePlateFrame {
  width: number;
  distance: number;
  centreY: number;
  horizon: [number, number];
  groundBand: [number, number];
  /** A radially faded floor under the party, for a plate whose painted floor is a thin strip. */
  floor: boolean;
  /** Slides the whole painting sideways (world x at the plate), for a plate whose floor is off its centre. */
  shiftX?: number;
  /** Ixion's stage spot on this plate, where his hooves meet painted floor (default {@link DJOSE_IXION_SPOT}). */
  ixion?: [number, number, number];
  /**
   * The plane's centre on an upright phone (default `centreY`). The phone's idle camera stands much farther back
   * (z about 23 after the phone refit, not 9.8), so the painted floor seen behind a hoof is not the desktop's.
   */
  phoneCentreY?: number;
}

/** Ixion's default spot: Chapter XI's Anima spot, a little deeper for a wide aeon (staging, ours). */
export const DJOSE_IXION_SPOT: [number, number, number] = [1.0, 0, -6.0];

/**
 * The framing of each plate the Chamber can show (`../data/ixion-plates.ts`). Staging, not game data.
 * - The stand-in keeps the Den / Farplane layout (floor line at 0.44): Chapter V's solve as is.
 * - Option C1 paints its floor line at about 0.76 of the height and its floor is a quarter of the picture, so the
 *   plane is wider (130) and higher (centre 22.4): the floor line sits where the stand-in's did (y about 3 at z -48)
 *   and the painted floor reaches the bottom of the frame. Measured headless at 1600x900 and 390x844 (widths 88,
 *   130 and 150 and heights 10 to 25.2 tried; 130 keeps the most floor for the least magnification). Its hole sits
 *   mostly behind Ixion at the standard spot (disclosed in the handoff).
 * - Option C2 is seen from above, with the pit (and its raised rim) in the middle of the painting, 38 % of its
 *   width. Ixion's hooves must land on solid floor, not the rim (the judge's C2 fault), and the party slots are
 *   fixed, so the painting is 150 wide, slid 27 left (its right edge still covers the enemy and intro rigs at
 *   2000x1012) and raised to 2.3, and Ixion stands at x 4.2 (z -6.0; wave 1 of r3942-stage had brought him to x 3.2, z -3.8, nearer the girls, and
 *   Bailey's "Yes, original spacing", 2026-10-08, put him back here at his real height, see {@link DJOSE_FIGURE_HEIGHTS}): his hooves on the lit floor right of the pit, the pit
 *   open between him and the party. Measured headless against a gridded copy of C2 at 1600x900, 2000x1012 and
 *   390x844, every rig. Disclosed: the party stands at the pit's near rim (no framing clears both).
 *   On an upright phone the idle camera stands at z about 23, and from there his hooves fell on the dark slab right
 *   of the pit (IXS-1), so the phone's plane sits 4.5 lower (`phoneCentreY` -2.2): his hooves and the lunging
 *   foreleg meet lit stone, Paine stands on lit stone, the pit stays in the slice. Measured headless at 390x844
 *   against the camera, plane and figure read from the running game (handoff `fixes-r28.md`).
 */
export const DJOSE_PLATE_FRAMES: Readonly<Record<string, DjosePlateFrame>> = {
  'ffx2-djose-chamber-standin': { width: 88, distance: -48, centreY: -0.5, horizon: [0.42, 0.48], groundBand: [0.8, 0.97], floor: false },
  'ffx2-djose-chamber-provisional': { width: 130, distance: -48, centreY: 22.4, horizon: [0.72, 0.78], groundBand: [0.84, 0.98], floor: false },
  'djose-chamber-provisional': { width: 150, distance: -48, centreY: 2.3, shiftX: -27, horizon: [0.36, 0.42], groundBand: [0.6, 0.95], floor: false, ixion: [4.2, 0, -6.0], phoneCentreY: -2.2 },
};

/** The frame for the plate the chapter shows now. */
export const DJOSE_BACKDROP: DjosePlateFrame = DJOSE_PLATE_FRAMES[DJOSE_CHAMBER_PLATE] ?? DJOSE_PLATE_FRAMES['ffx2-djose-chamber-standin']!;

type RigSet = Readonly<Record<SceneRigName, CameraRig> & Record<string, CameraRig>>;

/** Chapter V's rigs (`farplane.ts` `RIGS`): the same party slots, the same HUD. Staging, not game data. */
export const DJOSE_RIGS: RigSet = {
  intro: { position: [-2.2, 4.2, 13.2], lookAt: [1.0, 2.4, -3.0], fov: 30, sway: 1.4 },
  idle: { position: DJOSE_CAMERA_REF, lookAt: [0.5, 1.45, -1.4], fov: 32 },
  action: { position: [-0.15, 2.55, 9.6], lookAt: [1.05, 1.5, -1.2], fov: 32, sway: 0.7 },
  party: { position: [-1.6, 2.0, 6.6], lookAt: [-2.9, 1.2, 0.4], fov: 32, sway: 0.7 },
  enemy: { position: [1.5, 2.4, 5.8], lookAt: [3.1, 1.8, -2.5], fov: 32, sway: 0.7 },
  victory: { position: [-1.2, 1.9, 6.8], lookAt: [-2.5, 1.2, 0.8], fov: 32, sway: 1.2 },
  reveal: { position: [-1.2, 2.2, 13.6], lookAt: [0.2, 2.9, -5.5], fov: 34, sway: 1.5 },
};

/** Yuna, Rikku, Paine (the build's order), on Chapter V's held slots; then reserves off frame left. */
const PARTY_SLOTS: Array<[number, number, number]> = [
  [-2.48, 0, 1.45],
  [-1.44, 0, 0.1],
  [-0.33, 0, -1.3],
  [-11.5, 0, 2.6],
  [-12.4, 0, 1.0],
  [-13.3, 0, -0.6],
  [-14.2, 0, -2.2],
];

/** Ixion's combatant id (`src/data/ffx2/enemies/ixion-djose.ts`). */
export const DJOSE_IXION_ID = 'x2-ixion';

/** Ixion's spot on the plate shown: the plate's own row, else the default (staging, ours). */
export const DJOSE_SPOTS: Readonly<Record<string, [number, number, number]>> = {
  [DJOSE_IXION_ID]: DJOSE_BACKDROP.ixion ?? DJOSE_IXION_SPOT,
};

/** The girls' world height (the FFX-2 chapters' 1.78). */
export const DJOSE_PARTY_HEIGHT = 1.78;

/** The boss height Chapter XI's aeons stand at; Ixion's sidecar `scale` (1.0892) restores the FFX painting's size. */
export const DJOSE_ENEMY_HEIGHT = 3.4;

const ENEMY_SLOTS: Array<[number, number, number]> = [DJOSE_SPOTS[DJOSE_IXION_ID]!, [2.3, 0, -8.0], [-0.5, 0, -6.6]];

/**
 * Ixion's world height (r3942-stage, FFX-2 only): the girls' {@link DJOSE_PARTY_HEIGHT} times his model's ratio to them, from the game's own HD model
 * (`data/ffx2/fiend-stature.ts`, `research/ffx2-ixion-djose.md` §12): 31.6 over the girls' 17.73 is 1.78, so 3.175 (the scene's boss height was 3.4, Chapter XI's).
 */
export const DJOSE_FIGURE_HEIGHTS: Readonly<Record<string, number>> = ffx2FiendFigureHeights([DJOSE_IXION_ID], 'ffx2-ixion-djose', DJOSE_PARTY_HEIGHT);

const DJOSE_STAGING = { holdParty: true, enemySpots: DJOSE_SPOTS, figureHeights: DJOSE_FIGURE_HEIGHTS } as const;

/** The published slots, the same shape every other scene exports. */
export const DJOSE_CHAMBER_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.slice(0, 3).map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: DJOSE_PARTY_HEIGHT,
  enemyHeight: DJOSE_ENEMY_HEIGHT,
  ...DJOSE_STAGING,
};

/** The Bevelle Underground's cold grade (the approved FFX-2 underground), toward storm grey. */
export const DJOSE_CHAMBER_PALETTE: ScenePalette = {
  ...ScenePalettes.bevelleUnderground,
  name: 'djose-chamber',
  exposure: 1.14,
  bloomThreshold: 0.84,
  bloomStrength: 0.58,
  bloomRadius: 0.6,
  tiltFocus: 0.44,
  tiltBandWidth: 0.17,
  tiltMaxBlur: 4.0,
  vignette: 0.34,
  gain: [0.98, 1.0, 1.08],
  saturation: 0.98,
};

/** The plane's centre for this window: the plate's phone row on an upright phone (IXS-1), else its own. */
export function djoseCentreY(onPhone: boolean, frame: DjosePlateFrame = DJOSE_BACKDROP): number {
  return onPhone ? (frame.phoneCentreY ?? frame.centreY) : frame.centreY;
}

function plateOptions(url: string, low: boolean, cameraRef: [number, number, number], onPhone: boolean): BackdropOptions {
  return {
    url,
    width: DJOSE_BACKDROP.width,
    distance: DJOSE_BACKDROP.distance,
    centreY: djoseCentreY(onPhone),
    cameraRef,
    // The hall above the floor line parts from the floor on a sway; the floor itself stays one plane.
    layers: low ? [] : [{ from: 0.0, to: DJOSE_BACKDROP.horizon[0] - 0.02, feather: 0.1, featherBottom: 0.08, z: -36, opacity: 0.32 }],
    sampleBands: { sky: [0.02, 0.2], horizon: DJOSE_BACKDROP.horizon, ground: DJOSE_BACKDROP.groundBand, key: [0.1, 0.36] },
    ground: DJOSE_BACKDROP.floor ? { size: 60, tintMix: 0.9, luma: 0.16, fade: true, fadeCore: 0.35, center: [0, -2] } : false,
    fog: { near: 12, far: 42, colorMix: 0.3 },
    fogPlanes: [{ z: -26, y: 1.4, width: 70, height: 9, opacity: 0.16, speed: 0.008 }],
  };
}

/** **The Chamber of the Fayth at Djose**, as a {@link SceneFactory}. Owns no combatants. */
export const buildDjoseChamberScene: SceneFactory = async (opts: SceneBuildOptions = {}): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:djose-chamber';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? DJOSE_CAMERA_REF;
  const url = artUrl(`art/backdrops/${DJOSE_CHAMBER_PLATE}.png`);

  // PR-0201 A on an upright phone: the idle camera dollies back so Ixion stays in the slice, and the painting sits
  // lower so his hooves meet lit stone from that camera (IXS-1). Desktop: nothing.
  const onPhone = roadOnPhone();
  const options = plateOptions(url, low, cameraRef, onPhone);
  let backdrop = await Backdrop.create(options);
  backdrop.group.position.x = DJOSE_BACKDROP.shiftX ?? 0;
  backdrop.applyTo(group);

  const lights = new LightRig({
    palette: backdrop.palette,
    // A cold key from the lightning-held stone overhead, a pale violet rim, a low ambient.
    keyFrom: [-4.8, 7.8, 4.6],
    keyIntensity: 1.2,
    rimFrom: [6.2, 3.2, -4.4],
    rimColor: 0xd6ccff,
    rimIntensity: 1.05,
    fillIntensity: 0.9,
    ambientIntensity: 0.6,
    luma: { key: 0.82, fill: 0.68, rim: 0.9, ambient: 0.54 },
    shadows: false,
  });
  group.add(lights.group);

  const pools = PARTY_SLOTS.slice(0, 3).map((s) => {
    const pool = makeLightPool({ color: 0xd8dcff, radius: 0.95, opacity: 0.12 });
    pool.position.set(s[0], 0.02, s[2]);
    group.add(pool);
    return pool;
  });

  // No live motes: the research names no particles here (§6.1; `engine/pyreflyCanon.ts` row 'unattested').

  const phoneCamera = onPhone
    ? new RoadPhoneCamera(DJOSE_RIGS.idle, { shiva: [DJOSE_IXION_ID], sisters: [], anima: [] })
    : null;

  const watchEnabled = opts.watchAssets ?? Boolean(import.meta.env.DEV);
  let watcher: AssetWatcher | null = null;
  if (watchEnabled && backdrop.placeholder) {
    watcher = watchAssets([url], () => {
      void (async (): Promise<void> => {
        const next = await Backdrop.create(options);
        next.group.position.x = DJOSE_BACKDROP.shiftX ?? 0;
        const wasIn = backdrop.group.parent;
        backdrop.dispose();
        backdrop = next;
        if (wasIn) backdrop.applyTo(wasIn);
      })();
    });
  }

  return {
    group,
    get backdrop(): Backdrop {
      return backdrop;
    },
    lights,
    particles: [],
    rigs: DJOSE_RIGS,
    partySlots: PARTY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    enemySlots: ENEMY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    partyHeight: DJOSE_PARTY_HEIGHT,
    enemyHeight: DJOSE_ENEMY_HEIGHT,
    ...DJOSE_STAGING,
    palette: { ...DJOSE_CHAMBER_PALETTE },
    ...(phoneCamera ? { bindCamera: (camera: BattleCamera | null): void => phoneCamera.bind(camera) } : {}),
    update(dt: number): void {
      phoneCamera?.update(group.parent);
      backdrop.update(dt);
      lights.update(dt);
    },
    dispose(): void {
      watcher?.stop();
      phoneCamera?.bind(null);
      for (const p of pools) {
        p.geometry.dispose();
        (p.material as { dispose(): void }).dispose();
      }
      lights.dispose();
      backdrop.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
};
