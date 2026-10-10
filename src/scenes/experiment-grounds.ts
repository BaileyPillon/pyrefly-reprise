import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { BattleCamera } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { artUrl, watchAssets, type AssetWatcher } from '../engine/PaintedArt.ts';
import { EXPERIMENT_GROUNDS_PLATE } from '../data/experiment-plates.ts';
import { EXPERIMENT_BODY_IDS } from '../data/ffx2/enemies/experiment.ts';
import { DJOSE_CAMERA_REF, DJOSE_CHAMBER_PALETTE, DJOSE_CHAMBER_SLOTS, DJOSE_PARTY_HEIGHT, DJOSE_RIGS, type DjosePlateFrame, djoseCentreY } from './djose-chamber.ts';
import { RoadPhoneCamera, roadOnPhone } from './road-to-the-farplane-phone.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots } from './index.ts';

// ---------------------------------------------------------------------------
// Djose Temple, the Machine Faction's grounds (FFX-2): the Experiment's fight
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only [AGENTS.md rule 14]. The hidden chapter "The Experiment" (FFX-2 Chapter 5, Djose Temple). No FFX chapter stands here.
//
// THE PAINTING IS PROVISIONAL (rule 9). The plate is `backdrops/ffx2-experiment-grounds` (`../data/experiment-plates.ts`): until the overnight art run's grounds
// plate is installed it is a real copy of Chapter XVI's Chamber plate, so it is framed here exactly as that plate is (`./djose-chamber.ts`, `DJOSE_PLATE_FRAMES`). When
// the real plate arrives, the file changes and {@link EXPERIMENT_GROUNDS_FRAME} is re-solved against it; nothing else moves.
//
// The party slots, the camera rigs and the colour grade are Chapter V's and Chapter XVI's (the FFX-2 HUD is solved against them). The Experiment stands where Ixion
// stood: on the lit floor right of the pit, with the pit open between it and the girls. Staging, not game data.

/** How the plate sits behind the stage: the stand-in's frame is the Chamber plate's (`djose-chamber-provisional`), re-solved for the real plate when it is installed. */
export const EXPERIMENT_GROUNDS_FRAME: DjosePlateFrame = {
  width: 150,
  distance: -48,
  centreY: 2.3,
  shiftX: -27,
  horizon: [0.36, 0.42],
  groundBand: [0.6, 0.95],
  floor: false,
  ixion: [4.2, 0, -6.0],
  phoneCentreY: -2.2,
};

/** The Experiment's stage spot (staging, ours): where the Chamber's boss stands. */
export const EXPERIMENT_SPOT: [number, number, number] = EXPERIMENT_GROUNDS_FRAME.ixion ?? [4.2, 0, -6.0];

/**
 * The Experiment's world height: the game's own ratio to the girls, at the Chamber's party height. The RE note (`research/re-ffx2-experiment.md` section 2 and section 12 Q7) gives
 * the body's real height as 50.78 (the model's 25.39 times the engine scale 2.0, `[H]`), and the girls' mean in this party's dresses is 17.727 (White Mage Yuna 16.77, Dark Knight
 * Rikku 18.54, Dark Knight Paine 17.87: the same means Chapters XI, XV and XVI read in `data/ffx2/fiend-stature.ts`), so the body stands 2.86 times the girls: 5.098 over the Chamber's
 * 1.78. It is kept here and not in that shared table because the table holds engine scales of 1 and 4 only (its test pins that). Both bodies share the model (Special 1's scene
 * is the body with no extra modules), so both stand at this height. A ratio, not a measure of the painting: the art run's picture is scaled to it.
 */
export const EXPERIMENT_REAL_HEIGHT = 50.78;
export const EXPERIMENT_GIRLS_MEAN = (16.77 + 18.54 + 17.87) / 3;
export const EXPERIMENT_FIGURE_HEIGHT = Math.round(DJOSE_PARTY_HEIGHT * (EXPERIMENT_REAL_HEIGHT / EXPERIMENT_GIRLS_MEAN) * 1000) / 1000;

const ENEMY_SLOTS: Array<[number, number, number]> = [EXPERIMENT_SPOT, [2.3, 0, -8.0], [-0.5, 0, -6.6]];

const STAGING = {
  holdParty: true,
  enemySpots: Object.fromEntries(EXPERIMENT_BODY_IDS.map((id) => [id, EXPERIMENT_SPOT])), // both acts' bodies stand on the one spot
  figureHeights: Object.fromEntries(EXPERIMENT_BODY_IDS.map((id) => [id, EXPERIMENT_FIGURE_HEIGHT])),
} as const;

/** The published slots, the same shape every other scene exports. */
export const EXPERIMENT_GROUNDS_SLOTS: SceneSlots = {
  party: DJOSE_CHAMBER_SLOTS.party.map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: DJOSE_PARTY_HEIGHT,
  enemyHeight: EXPERIMENT_FIGURE_HEIGHT,
  ...STAGING,
};

function plateOptions(url: string, low: boolean, cameraRef: [number, number, number], onPhone: boolean): BackdropOptions {
  const frame = EXPERIMENT_GROUNDS_FRAME;
  return {
    url,
    width: frame.width,
    distance: frame.distance,
    centreY: djoseCentreY(onPhone, frame),
    cameraRef,
    layers: low ? [] : [{ from: 0.0, to: frame.horizon[0] - 0.02, feather: 0.1, featherBottom: 0.08, z: -36, opacity: 0.32 }],
    sampleBands: { sky: [0.02, 0.2], horizon: frame.horizon, ground: frame.groundBand, key: [0.1, 0.36] },
    ground: frame.floor ? { size: 60, tintMix: 0.9, luma: 0.16, fade: true, fadeCore: 0.35, center: [0, -2] } : false,
    fog: { near: 12, far: 42, colorMix: 0.3 },
    fogPlanes: [{ z: -26, y: 1.4, width: 70, height: 9, opacity: 0.16, speed: 0.008 }],
  };
}

/** **The Machine Faction's grounds at Djose Temple**, as a {@link SceneFactory}. Owns no combatants. */
export const buildExperimentGroundsScene: SceneFactory = async (opts: SceneBuildOptions = {}): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:experiment-grounds';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? DJOSE_CAMERA_REF;
  const url = artUrl(`art/backdrops/${EXPERIMENT_GROUNDS_PLATE}.png`);

  // On an upright phone the idle camera dollies back so the Experiment stays in the slice (the Chamber's rule, `./djose-chamber.ts`); a desktop is untouched.
  const onPhone = roadOnPhone();
  const options = plateOptions(url, low, cameraRef, onPhone);
  let backdrop = await Backdrop.create(options);
  backdrop.group.position.x = EXPERIMENT_GROUNDS_FRAME.shiftX ?? 0;
  backdrop.applyTo(group);

  const lights = new LightRig({
    palette: backdrop.palette,
    // A cold key from the work lamps overhead, a pale violet rim, a low ambient: the Chamber's light (the same lamps and cables).
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

  const pools = EXPERIMENT_GROUNDS_SLOTS.party.map((s) => {
    const pool = makeLightPool({ color: 0xd8dcff, radius: 0.95, opacity: 0.12 });
    pool.position.set(s[0], 0.02, s[2]);
    group.add(pool);
    return pool;
  });

  const phoneCamera = onPhone ? new RoadPhoneCamera(DJOSE_RIGS.idle, { shiva: [...EXPERIMENT_BODY_IDS], sisters: [], anima: [] }) : null;

  const watchEnabled = opts.watchAssets ?? Boolean(import.meta.env.DEV);
  let watcher: AssetWatcher | null = null;
  if (watchEnabled && backdrop.placeholder) {
    watcher = watchAssets([url], () => {
      void (async (): Promise<void> => {
        const next = await Backdrop.create(options);
        next.group.position.x = EXPERIMENT_GROUNDS_FRAME.shiftX ?? 0;
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
    partySlots: DJOSE_CHAMBER_SLOTS.party.map((s) => new Vector3(s[0], s[1], s[2])).concat(
      [[-11.5, 0, 2.6], [-12.4, 0, 1.0], [-13.3, 0, -0.6], [-14.2, 0, -2.2]].map((s) => new Vector3(s[0], s[1], s[2])),
    ),
    enemySlots: ENEMY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    partyHeight: DJOSE_PARTY_HEIGHT,
    enemyHeight: EXPERIMENT_FIGURE_HEIGHT,
    ...STAGING,
    palette: { ...DJOSE_CHAMBER_PALETTE, name: 'experiment-grounds' },
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
