import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { BattleCamera } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { artUrl, watchAssets, type AssetWatcher } from '../engine/PaintedArt.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import { TOURIST_TRAP_PLATE } from '../data/tourist-trap-ids.ts';
import { X2_DAIGORO_ID, X2_YOJIMBO_ID, TOURIST_TRAP_BODY_IDS } from '../data/ffx2/enemies/tourist-trap.ts';
import { DJOSE_CAMERA_REF, DJOSE_CHAMBER_SLOTS, DJOSE_PARTY_HEIGHT, DJOSE_RIGS, type DjosePlateFrame, djoseCentreY } from './djose-chamber.ts';
import { RoadPhoneCamera, roadOnPhone } from './road-to-the-farplane-phone.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots } from './index.ts';

// ---------------------------------------------------------------------------
// The Cavern of the Stolen Fayth, under the FFX-2 camera: the Tourist Trap's fight
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only [AGENTS.md rule 14]. The hidden chapter "Tourist Trap" (Yojimbo and Daigoro, the optional FFX-2 mission). No FFX chapter stands here: Chapter IX's own scene
// (`./cavern-stolen-fayth.ts`) is solved against the FFX camera and HUD and is not touched.
//
// THE PAINTING IS BORROWED AND PROVISIONAL (rule 9). The plate is Chapter IX's approved `backdrops/cavern-stolen-fayth` (2688 x 1536: rock walls, a shaft of daylight right of centre, a
// painted floor in the bottom fifth with the dormant teleport pad at plate (1540, 1394)); it is read in place and nothing is copied, written or replaced. It is framed here the way the Djose
// plates are: a wide plane far behind the stage, cropped by the FFX-2 camera so the wall's base and the painted floor sit under the fighters.
//
// The camera rigs, the party slots, the girls' world height and the phone dolly are Chapter V's and Chapter XVI's (`./djose-chamber.ts`): the FFX-2 HUD is solved against them. Where the two
// fighters stand, how tall they are and how the plate sits are staging, ours, not game data.

/** How the Cavern plate sits behind the stage (staging, ours): a 150-wide plane at z -48 like the Djose plates, its centre and slide solved against the plate. */
export const TOURIST_TRAP_FRAME: DjosePlateFrame = {
  width: 150,
  distance: -48,
  centreY: 23.5,
  shiftX: 2,
  horizon: [0.62, 0.78],
  groundBand: [0.84, 0.97],
  floor: true,
  phoneCentreY: 23.5,
};

/**
 * World heights, staging from the HD models of FFX (`research/ffx-yojimbo.md` section 12, `[datamined]`): Yojimbo 27.101 and Daigoro 7.972 against the girls' mean 17.727 (White Mage Yuna 16.77,
 * Dark Knight Rikku 18.54 and Paine 17.87, `data/ffx2/fiend-stature.ts`), at the girls' world height {@link DJOSE_PARTY_HEIGHT}. The FFX-2 possessed Yojimbo is assumed to be the same model
 * `[estimate]`: the FFX-2 table has no row for him. A ratio, not a measure of the painting: the painting is scaled to it.
 */
export const YOJIMBO_MODEL_HEIGHT = 27.101;
export const DAIGORO_MODEL_HEIGHT = 7.972;
export const TOURIST_TRAP_GIRLS_MEAN = (16.77 + 18.54 + 17.87) / 3;
const heightOf = (model: number): number => Math.round(DJOSE_PARTY_HEIGHT * (model / TOURIST_TRAP_GIRLS_MEAN) * 1000) / 1000;
export const YOJIMBO_FIGURE_HEIGHT = heightOf(YOJIMBO_MODEL_HEIGHT);
export const DAIGORO_FIGURE_HEIGHT = heightOf(DAIGORO_MODEL_HEIGHT);

/**
 * Where the two stand (staging, ours): Yojimbo right of the party, the dog a step in front of him and toward the girls. Solved in the browser at 1600x900 and 390x844 (the first menu): at x 3.6 the command stack hid
 * Yojimbo's legs and the intent slab his hat, and on the phone he stood at the right edge; at x 2.7 he clears both and the pair sits closer to the girls.
 */
export const YOJIMBO_SPOT: [number, number, number] = [2.7, 0, -4.4];
export const DAIGORO_SPOT: [number, number, number] = [1.4, 0, -3.4];
const ENEMY_SLOTS: Array<[number, number, number]> = [YOJIMBO_SPOT, DAIGORO_SPOT, [-0.5, 0, -6.6]];

const STAGING = {
  holdParty: true,
  enemySpots: { [X2_YOJIMBO_ID]: YOJIMBO_SPOT, [X2_DAIGORO_ID]: DAIGORO_SPOT },
  figureHeights: { [X2_YOJIMBO_ID]: YOJIMBO_FIGURE_HEIGHT, [X2_DAIGORO_ID]: DAIGORO_FIGURE_HEIGHT },
} as const;

/** The published slots, the same shape every other scene exports. */
export const TOURIST_TRAP_SLOTS: SceneSlots = {
  party: DJOSE_CHAMBER_SLOTS.party.map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: DJOSE_PARTY_HEIGHT,
  enemyHeight: YOJIMBO_FIGURE_HEIGHT,
  ...STAGING,
};

/** Cold stone under a shaft of daylight: Chapter IX's approved grade (O-4 A) carried over, named for this scene (copied, so the FFX scene is not imported). */
export const TOURIST_TRAP_PALETTE: ScenePalette = {
  name: 'ffx2-tourist-trap-cavern',
  lift: [0.006, 0.01, 0.018],
  gamma: [1.0, 1.0, 0.99],
  gain: [1.0, 1.01, 1.03],
  saturation: 0.98,
  vignette: 0.4,
  vignetteRadius: 0.66,
  shadowTint: [0.36, 0.48, 0.62],
  shadowTintAmount: 0.14,
  grain: 0.024,
  exposure: 1.0,
  bloomThreshold: 0.86,
  bloomStrength: 0.4,
  bloomRadius: 0.55,
  tiltFocus: 0.55,
  tiltBandWidth: 0.2,
  tiltMaxBlur: 2.8,
};

function plateOptions(url: string, low: boolean, cameraRef: [number, number, number], onPhone: boolean): BackdropOptions {
  const frame = TOURIST_TRAP_FRAME;
  return {
    url,
    width: frame.width,
    distance: frame.distance,
    centreY: djoseCentreY(onPhone, frame),
    cameraRef,
    layers: [],
    sampleBands: { sky: [0.02, 0.2], horizon: frame.horizon, ground: frame.groundBand, key: [0.3, 0.55] },
    ground: frame.floor ? { size: 44, repeat: 5, tintMix: 0.45, luma: 0.46, fade: true, fadeCore: 0.4, center: [1.0, 0.5] as [number, number] } : false,
    fog: { near: 18, far: 46, colorMix: 0.16 },
    fogPlanes: low ? [] : [{ z: -9, y: 0.6, width: 34, height: 3.2, opacity: 0.09, speed: 0.008, additive: true }],
    background: 0x0b1118,
  };
}

/** **The Cavern of the Stolen Fayth, for the Tourist Trap**, as a {@link SceneFactory}. Owns no combatants. */
export const buildTouristTrapCavernScene: SceneFactory = async (opts: SceneBuildOptions = {}): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:ffx2-tourist-trap-cavern';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? DJOSE_CAMERA_REF;
  const url = artUrl(`art/backdrops/${TOURIST_TRAP_PLATE}.png`);

  // On an upright phone the idle camera dollies back so the pair stays in the slice (the Chamber's rule, `./djose-chamber.ts`); a desktop is untouched.
  const onPhone = roadOnPhone();
  const options = plateOptions(url, low, cameraRef, onPhone);
  let backdrop = await Backdrop.create(options);
  backdrop.group.position.x = TOURIST_TRAP_FRAME.shiftX ?? 0;
  backdrop.applyTo(group);

  const lights = new LightRig({
    palette: backdrop.palette,
    // A shaft of daylight from the upper right (where the painting's light falls), a pale blue rim from behind the girls, a cool low ambient.
    keyFrom: [5.4, 8.2, 3.4],
    keyIntensity: 1.25,
    rimFrom: [-5.6, 3.0, -4.2],
    rimColor: 0xb8d4ff,
    rimIntensity: 0.95,
    fillIntensity: 0.85,
    ambientIntensity: 0.58,
    luma: { key: 0.84, fill: 0.66, rim: 0.86, ambient: 0.52 },
    shadows: false,
  });
  group.add(lights.group);

  const pools = TOURIST_TRAP_SLOTS.party.map((s) => {
    const pool = makeLightPool({ color: 0xd2e4ff, radius: 0.95, opacity: 0.12 });
    pool.position.set(s[0], 0.02, s[2]);
    group.add(pool);
    return pool;
  });

  const phoneCamera = onPhone ? new RoadPhoneCamera(DJOSE_RIGS.idle, { shiva: [...TOURIST_TRAP_BODY_IDS], sisters: [], anima: [] }) : null;

  const watchEnabled = opts.watchAssets ?? Boolean(import.meta.env.DEV);
  let watcher: AssetWatcher | null = null;
  if (watchEnabled && backdrop.placeholder) {
    watcher = watchAssets([url], () => {
      void (async (): Promise<void> => {
        const next = await Backdrop.create(options);
        next.group.position.x = TOURIST_TRAP_FRAME.shiftX ?? 0;
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
    partySlots: TOURIST_TRAP_SLOTS.party.map((s) => new Vector3(s[0], s[1], s[2])).concat(
      [[-11.5, 0, 2.6], [-12.4, 0, 1.0], [-13.3, 0, -0.6], [-14.2, 0, -2.2]].map((s) => new Vector3(s[0], s[1], s[2])),
    ),
    enemySlots: ENEMY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    partyHeight: DJOSE_PARTY_HEIGHT,
    ...STAGING,
    enemyHeight: YOJIMBO_FIGURE_HEIGHT,
    palette: TOURIST_TRAP_PALETTE,
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
