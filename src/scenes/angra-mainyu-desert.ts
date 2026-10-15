import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { BattleCamera } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { artUrl, watchAssets, type AssetWatcher } from '../engine/PaintedArt.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import { ANGRA_MAINYU_BODY_IDS, ANGRA_MAINYU_PLATE, X2_ANGRA_MAINYU_ID, X2_TAWRICH_ID, X2_ZARICH_ID } from '../data/angra-mainyu-ids.ts';
import { DJOSE_CAMERA_REF, DJOSE_CHAMBER_SLOTS, DJOSE_PARTY_HEIGHT, DJOSE_RIGS, type DjosePlateFrame, djoseCentreY } from './djose-chamber.ts';
import { RoadPhoneCamera, roadOnPhone } from './road-to-the-farplane-phone.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots } from './index.ts';

// ---------------------------------------------------------------------------
// The Bikanel Desert, under the FFX-2 camera: the Angra Mainyu fight
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only [AGENTS.md rule 14]. The hidden chapter "Angra Mainyu" (the Chapter 5 mission "Showdown in the Sands": the body and its two arms at the Al Bhed excavation camp). No FFX chapter stands here.
//
// THE PAINTING IS NEW AND PROVISIONAL (rule 9). None of the approved plates is a desert, so the stage is a local render, `backdrops/bikanel-desert-provisional` (2688 x 1536: dunes, a buried arch, a dug-in camp, a half-buried
// machina wreck, mesas under a cloudy sky), installed as a NEW file in the art mirror; nothing approved is replaced. It is framed here the way the Djose plates are: a wide plane far behind the stage, cropped by
// the FFX-2 camera so the dunes sit under the fighters.
//
// The camera rigs, the party slots, the girls' world height and the phone dolly are Chapter V's and Chapter XVI's (`./djose-chamber.ts`): the FFX-2 HUD is solved against them. **Where the three bodies stand and
// how tall they are is staging, ours, not game data**: the game's own start positions are the boss at (-45, -13) and the girls at (23, 29), (33, 11) and (32, -9) (the RE note, numbers for the AI's searches only,
// `battle/ffx2/ai/script-rolls.ts` `SCENES.angra`), and the arms' spots are unknown (both read (0, 0); the body's script links them to its model): they stand beside the body here (the driver's ruling).

/** How the desert plate sits behind the stage (staging, ours): a 150-wide plane at z -48 like the Djose plates, its centre solved against the plate. */
export const ANGRA_MAINYU_FRAME: DjosePlateFrame = {
  width: 150,
  distance: -48,
  centreY: 3.0,
  shiftX: 0,
  horizon: [0.3, 0.36],
  groundBand: [0.82, 0.97],
  floor: true,
  phoneCentreY: 3.0,
};

/**
 * World heights, staging, ours (no HD-model stature is measured for these three: the FFX-2 table has no row for them): the body is a colossus, about 2.6 times the girls' {@link DJOSE_PARTY_HEIGHT}; the arms stand a little over a girl
 * and a half each. A ratio of the painting's frame to the stage, not a measure of the monster.
 */
export const ANGRA_MAINYU_FIGURE_HEIGHT = 4.6;
export const ZARICH_FIGURE_HEIGHT = 2.9;
export const TAWRICH_FIGURE_HEIGHT = 2.7;

/**
 * Where the three stand (staging, ours): the body back and right of the middle, Zarich (the left arm) and Tawrich (the right arm) either side of it and a little nearer the girls, beside the boss as the driver ruled.
 * Solved in the browser at 1600x900 and 390x844 (the first menu).
 */
export const ANGRA_MAINYU_SPOT: [number, number, number] = [3.4, 0, -8.6];
export const ZARICH_SPOT: [number, number, number] = [0.4, 0, -6.0];
export const TAWRICH_SPOT: [number, number, number] = [6.8, 0, -6.2];
/** The enemy slots by the game's slot order: the body, Tawrich, Zarich. */
const ENEMY_SLOTS: Array<[number, number, number]> = [ANGRA_MAINYU_SPOT, TAWRICH_SPOT, ZARICH_SPOT];

const STAGING = {
  holdParty: true,
  enemySpots: { [X2_ANGRA_MAINYU_ID]: ANGRA_MAINYU_SPOT, [X2_ZARICH_ID]: ZARICH_SPOT, [X2_TAWRICH_ID]: TAWRICH_SPOT },
  figureHeights: { [X2_ANGRA_MAINYU_ID]: ANGRA_MAINYU_FIGURE_HEIGHT, [X2_ZARICH_ID]: ZARICH_FIGURE_HEIGHT, [X2_TAWRICH_ID]: TAWRICH_FIGURE_HEIGHT },
} as const;

/** The published slots, the same shape every other scene exports. */
export const ANGRA_MAINYU_SLOTS: SceneSlots = {
  party: DJOSE_CHAMBER_SLOTS.party.map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: DJOSE_PARTY_HEIGHT,
  enemyHeight: ANGRA_MAINYU_FIGURE_HEIGHT,
  ...STAGING,
};

/** A hot, bright desert grade: the painting's own warm light kept, the shadows a cool sand-blue, a little more bloom than the caves. */
export const ANGRA_MAINYU_PALETTE: ScenePalette = {
  name: 'ffx2-angra-mainyu-desert',
  lift: [0.01, 0.008, 0.006],
  gamma: [1.0, 0.99, 0.97],
  gain: [1.03, 1.0, 0.95],
  saturation: 1.0,
  vignette: 0.34,
  vignetteRadius: 0.7,
  shadowTint: [0.5, 0.46, 0.5],
  shadowTintAmount: 0.12,
  grain: 0.02,
  exposure: 1.0,
  bloomThreshold: 0.88,
  bloomStrength: 0.34,
  bloomRadius: 0.55,
  tiltFocus: 0.55,
  tiltBandWidth: 0.2,
  tiltMaxBlur: 2.6,
};

function plateOptions(url: string, low: boolean, cameraRef: [number, number, number], onPhone: boolean): BackdropOptions {
  const frame = ANGRA_MAINYU_FRAME;
  return {
    url,
    width: frame.width,
    distance: frame.distance,
    centreY: djoseCentreY(onPhone, frame),
    cameraRef,
    layers: [],
    sampleBands: { sky: [0.02, 0.14], horizon: frame.horizon, ground: frame.groundBand, key: [0.3, 0.55] },
    ground: frame.floor ? { size: 44, repeat: 5, tintMix: 0.55, luma: 0.62, fade: true, fadeCore: 0.45, center: [3.0, 0.5] as [number, number] } : false,
    fog: { near: 20, far: 52, colorMix: 0.2 },
    fogPlanes: low ? [] : [{ z: -9, y: 0.5, width: 34, height: 3.0, opacity: 0.07, speed: 0.012, additive: true }],
    background: 0x9a8f86,
  };
}

/** **The Bikanel Desert, for Angra Mainyu**, as a {@link SceneFactory}. Owns no combatants. */
export const buildAngraMainyuDesertScene: SceneFactory = async (opts: SceneBuildOptions = {}): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:ffx2-angra-mainyu-desert';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? DJOSE_CAMERA_REF;
  const url = artUrl(`art/backdrops/${ANGRA_MAINYU_PLATE}.png`);

  // On an upright phone the idle camera dollies back so the three stay in the slice (the Chamber's rule, `./djose-chamber.ts`); a desktop is untouched.
  const onPhone = roadOnPhone();
  const options = plateOptions(url, low, cameraRef, onPhone);
  let backdrop = await Backdrop.create(options);
  backdrop.group.position.x = ANGRA_MAINYU_FRAME.shiftX ?? 0;
  backdrop.applyTo(group);

  const lights = new LightRig({
    palette: backdrop.palette,
    // Hard sun from the upper right (where the painting's light falls), a warm sand bounce from the left, a pale sky ambient.
    keyFrom: [6.2, 8.8, 3.0],
    keyIntensity: 1.35,
    rimFrom: [-5.2, 3.2, -4.6],
    rimColor: 0xffe2b8,
    rimIntensity: 0.8,
    fillIntensity: 0.9,
    ambientIntensity: 0.66,
    luma: { key: 0.88, fill: 0.7, rim: 0.82, ambient: 0.56 },
    shadows: false,
  });
  group.add(lights.group);

  const pools = ANGRA_MAINYU_SLOTS.party.map((s) => {
    const pool = makeLightPool({ color: 0xffe6c4, radius: 0.95, opacity: 0.1 });
    pool.position.set(s[0], 0.02, s[2]);
    group.add(pool);
    return pool;
  });

  const phoneCamera = onPhone ? new RoadPhoneCamera(DJOSE_RIGS.idle, { shiva: [...ANGRA_MAINYU_BODY_IDS], sisters: [], anima: [] }) : null;

  const watchEnabled = opts.watchAssets ?? Boolean(import.meta.env.DEV);
  let watcher: AssetWatcher | null = null;
  if (watchEnabled && backdrop.placeholder) {
    watcher = watchAssets([url], () => {
      void (async (): Promise<void> => {
        const next = await Backdrop.create(options);
        next.group.position.x = ANGRA_MAINYU_FRAME.shiftX ?? 0;
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
    partySlots: ANGRA_MAINYU_SLOTS.party.map((s) => new Vector3(s[0], s[1], s[2])).concat(
      [[-11.5, 0, 2.6], [-12.4, 0, 1.0], [-13.3, 0, -0.6], [-14.2, 0, -2.2]].map((s) => new Vector3(s[0], s[1], s[2])),
    ),
    enemySlots: ENEMY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    partyHeight: DJOSE_PARTY_HEIGHT,
    ...STAGING,
    enemyHeight: ANGRA_MAINYU_FIGURE_HEIGHT,
    palette: ANGRA_MAINYU_PALETTE,
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
