import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { artUrl, watchAssets, type AssetWatcher } from '../engine/PaintedArt.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory, SceneRigName } from './types.ts';
import type { SceneSlots } from './index.ts';
import { MUSHROOM_ROCK_SCENE } from '../data/ffx/sinspawn-gui-ids.ts';

// ---------------------------------------------------------------------------
// Mushroom Rock Road, Operation Mi'ihen (FFX) — the hidden Sinspawn Gui chapter
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. Sinspawn Gui, the fight on Mushroom Rock Road (`docs/plans/ch-gui-review.md`). Built overnight, 2026-10-10, for Bailey's
// words "I'll add in those 2 chapter recommendations" / "i want those chapters added in over night while im sleep"; the driver's reading of them: the chapter is hidden behind
// a typed word and its art is PROVISIONAL (new subjects only, never replacing an approved painting).
//
// THE PAINTING. `public/art/backdrops/mushroom-rock-road.png` is a provisional plate (its sidecar says which): until the overnight art run's pick is installed it is a clearly labelled
// stand-in from existing approved art. The scene reads the plate like every other: the painting is the back wall of the arena (34 wide at z -12), its floor row on the ground
// (y 0), so the painted ground runs into the 3D floor under the fighters. The composition constants below are the plate's own (`MUSHROOM_PLATE`): a new plate with another floor
// row changes one number.
//
// Staging: the house FFX framing (the rigs Macalania and the Highbridge use, solved against the FFX HUD at 1600x900). The party stands on the Highbridge's slots (Tidus, Yuna,
// Kimahri there; here the build's `activeSlots` order, the guest last); the enemies stand on `ENEMY_SLOTS`, index = each record's `slot`
// (`src/data/ffx/enemies/sinspawn-gui.ts`). No particles: nothing in the sources puts any in the air here (`pyreflyCanon.ts`).

/** Plate pixels (`mushroom-rock-road.json`) and the row set on the floor. */
export const MUSHROOM_PLATE = { w: 2688, h: 1536, floorRow: 0.89 } as const;

/** Painting plane: 34 wide at z -12, its floor row on the floor (y 0). */
export const MUSHROOM_BACKDROP = (() => {
  const width = 34;
  const height = width / (MUSHROOM_PLATE.w / MUSHROOM_PLATE.h);
  return { width, height, distance: -12, centreY: height * (MUSHROOM_PLATE.floorRow - 0.5) } as const;
})();

/** The idle camera, which the parallax stack is solved for. */
const CAMERA_REF: [number, number, number] = [0, 5.1, 17.6];

/** The FFX house rigs (the Highbridge's, which Macalania's solved against the FFX HUD at 1600x900). The phone draws the 16:9 render and slides it (`ui/common/phoneFraming.ts`). */
export const MUSHROOM_RIGS: Readonly<Record<SceneRigName, CameraRig> & Record<string, CameraRig>> = {
  intro: { position: [0.6, 3.6, 20.0], lookAt: [1.4, 2.6, -4.0], fov: 32, sway: 1.3 },
  idle: { position: CAMERA_REF, lookAt: [0.6, 1.8, 0], fov: 28 },
  action: { position: [0.5, 4.3, 14.2], lookAt: [1.5, 1.7, 0.6], fov: 28, sway: 0.7 },
  enemy: { position: [0.5, 3.4, 9.8], lookAt: [2.3, 1.9, -2.8], fov: 30, sway: 0.7 },
  party: { position: [-0.4, 3.1, 12.25], lookAt: [0.95, 1.4, 4.4], fov: 31, sway: 0.7 },
  victory: { position: [-0.7, 3.2, 16.0], lookAt: [0.7, 1.2, -2.0], fov: 30, sway: 1.1 },
};

/** Party slots: the three on the field, then four reserve spots off frame-left (the Highbridge's). */
const PARTY_SLOTS: Array<[number, number, number]> = [
  [-1.11, 0, 4.95],
  [-0.2, 0, 4.45],
  [1.18, 0, 5.03],
  [-9.6, 0, 2.6],
  [-10.5, 0, 1.0],
  [-11.4, 0, -0.6],
  [-12.3, 0, -2.2],
];

/** Enemy slots, index = each record's `slot`. Settled with the formation's data (`ENEMY_SLOTS` is the one place to move a body). */
const ENEMY_SLOTS: Array<[number, number, number]> = [
  [2.9, 0, -2.6],
  [1.35, 0, -1.8],
  [4.6, 0, -1.8],
  [3.0, 0, -4.4],
];

/** The party's world height (the FFX chapters' shared 1.75) and the boss's, a presentation estimate until a measured height is chosen (`docs/handoff/ch-gui.md`). */
const PARTY_HEIGHT = 1.75;
const ENEMY_HEIGHT = 2.43;

/** Each enemy stays on its spot; the party is held on its slots. */
const MUSHROOM_STAGING = {
  holdParty: true,
  enemySpots: {} as Record<string, [number, number, number]>,
  figureHeights: {} as Record<string, number>,
} as const;

/** The published slots, same shape every other scene exports. */
export const MUSHROOM_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.slice(0, 3).map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: PARTY_HEIGHT,
  enemyHeight: ENEMY_HEIGHT,
  ...MUSHROOM_STAGING,
};

/** Daylight on a sea cliff: a neutral-warm grade, light bloom, the house tilt-shift. Tuned against the plate when it is installed. */
export const MUSHROOM_PALETTE: ScenePalette = {
  name: MUSHROOM_ROCK_SCENE,
  lift: [0.008, 0.01, 0.014],
  gamma: [1.0, 1.0, 1.0],
  gain: [1.03, 1.01, 0.98],
  saturation: 1.04,
  vignette: 0.4,
  vignetteRadius: 0.66,
  shadowTint: [0.34, 0.4, 0.62],
  shadowTintAmount: 0.12,
  grain: 0.02,
  exposure: 1.0,
  bloomThreshold: 0.84,
  bloomStrength: 0.46,
  bloomRadius: 0.56,
  tiltFocus: 0.42,
  tiltBandWidth: 0.16,
  tiltMaxBlur: 3.2,
};

/** **Mushroom Rock Road**, as a {@link SceneFactory}. Owns no actors. */
export const buildMushroomRockRoadScene: SceneFactory = async (opts: SceneBuildOptions = {}): Promise<SceneBuild> => {
  const group = new Group();
  group.name = `scene:${MUSHROOM_ROCK_SCENE}`;
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? CAMERA_REF;
  const url = artUrl(`art/backdrops/${MUSHROOM_ROCK_SCENE}.png`);

  const backdropOptions = {
    url,
    width: MUSHROOM_BACKDROP.width,
    distance: MUSHROOM_BACKDROP.distance,
    centreY: MUSHROOM_BACKDROP.centreY,
    cameraRef,
    /** One masked band nearest the fighters (the rocks at the road's edge). */
    layers: low ? [] : [{ from: 0.46, to: 0.84, feather: 0.1, featherBottom: 0.05, z: -14, opacity: 0.5 }],
    /** `key` the lit rock band, `horizon` the sea line, `ground` the road. */
    sampleBands: { sky: [0.0, 0.12], horizon: [0.52, 0.7], ground: [0.84, 0.97], key: [0.46, 0.6] },
    ground: { size: 40, repeat: 5, tintMix: 0.36, luma: 0.42, fade: true, fadeCore: 0.3, center: [0.5, -3.5] as [number, number] },
    fog: { near: 16, far: 44, colorMix: 0.16 },
    fogPlanes: [{ z: -12, y: 0.8, width: 44, height: 4, opacity: 0.06, speed: 0.01, additive: true }],
    background: 0x0b1420,
  } satisfies BackdropOptions;

  let backdrop = await Backdrop.create(backdropOptions);
  backdrop.applyTo(group);

  const lights = new LightRig({
    palette: backdrop.palette,
    // Daylight from the upper right, over the enemy line; the sea sky behind the fighters is the cool rim.
    keyFrom: [5.0, 6.0, -6.5],
    keyIntensity: 1.0,
    rimFrom: [-1.0, 3.4, -9.0],
    rimColor: 0xa8c8ff,
    rimIntensity: 0.8,
    fillIntensity: 0.8,
    ambientIntensity: 0.6,
    luma: { key: 0.8, fill: 0.55, rim: 0.85, ambient: 0.45 },
    shadows: low ? false : { mapSize: 1024, area: 14, radius: 3.2, bias: -0.0013 },
  });
  group.add(lights.group);

  const pools = PARTY_SLOTS.slice(0, 3).map((s) => {
    const pool = makeLightPool({ color: 0xffe2b8, radius: 1.0, opacity: 0.1 });
    pool.position.set(s[0], 0.02, s[2]);
    group.add(pool);
    return pool;
  });

  const watchEnabled = opts.watchAssets ?? Boolean(import.meta.env.DEV);
  let watcher: AssetWatcher | null = null;
  if (watchEnabled && backdrop.placeholder) {
    watcher = watchAssets([url], () => {
      void (async (): Promise<void> => {
        const next = await Backdrop.create(backdropOptions);
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
    rigs: MUSHROOM_RIGS,
    partySlots: PARTY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    enemySlots: ENEMY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    partyHeight: PARTY_HEIGHT,
    enemyHeight: ENEMY_HEIGHT,
    ...MUSHROOM_STAGING,
    palette: { ...MUSHROOM_PALETTE },
    update(dt: number): void {
      backdrop.update(dt);
      lights.update(dt);
    },
    dispose(): void {
      watcher?.stop();
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
