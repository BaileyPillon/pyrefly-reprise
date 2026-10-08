import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { artUrl, watchAssets, type AssetWatcher } from '../engine/PaintedArt.ts';
import { ParticleField, ParticlePresets } from '../engine/Particles.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import { ScenePalettes } from '../engine/ScenePalettes.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory, SceneRigName } from './types.ts';
import { addPlateWings, paintPlateWings } from './plateWings.ts';
import type { SceneSlots } from './index.ts';
import { FORWARD_FIEND_ADVISOR_CAP } from './advisor-cap.ts';
import { ffx2FiendFigureHeights } from '../data/ffx2/fiend-stature.ts';

// ---------------------------------------------------------------------------
// The Den of Woe (FFX-2)
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only [AGENTS.md rule 14]. Chapter XV: the shades of
// Baralai, Gippal and Nooj, one after another in the cave under Mushroom Rock
// Road (`research/ffx2-gippal-den-of-woe.md` §1.1, §2, §6.2). No FFX chapter
// stands here.
//
// The scene key is `den-of-woe`, the plate's own id, so the cutscene screen
// (which draws `backdrops/<sceneKey>.png`) finds the same painting.
//
// On whose word: Bailey, 2026-09-25, "I'll go with all your recommendations"
// (D-148, O-3 A: the cold blue plate). The plate
// (`public/art/backdrops/den-of-woe.png`, 2688x1536) is used as installed; it is
// one painting, so there is no between-links shot (the chain carries straight
// on, GP3 a). The cave's look is ours: the sources give "a pyrefly-filled cave
// with a rectangular clearing" `[single source: GamerGuides]`.
//
// THE PAINTING. Its horizon sits at about 0.43 of the height with the stone
// clearing below, the same layout as Chapter V's Farplane plate, so the plate is
// framed exactly as Chapter V frames its own (`farplane.ts`: 88 wide at z -48,
// centre -0.5, the idle camera at (0, 2.7, 9.8)), and the rigs and party slots
// are Chapter V's, which are solved against the FFX-2 HUD at 1280x720, 1600x900
// and 2000x1012. The painted stone is the floor: no 3D ground.
//
// THE SHADES. One shade a link, always on the boss spot. Their heights are ours
// (`INSTALLED.md` "Sizing" leaves the world height to this scene): the sizes of
// the frames Bailey picked from (`INSTALLED.md` "Frames": 0.755, 0.769 and 0.82 of
// the Chapter XI staging's 3.4 boss height, about 1.2 times Rikku on screen).

/** The camera the plate is solved for: the `idle` rig's position (Chapter V's). */
export const DEN_CAMERA_REF: [number, number, number] = [0, 2.7, 9.8];

/** The painting plane: Chapter V's solve for the same layout (`farplane.ts`, "Framing maths"). */
export const DEN_BACKDROP = { width: 88, distance: -48, centreY: -0.5 } as const;

type RigSet = Readonly<Record<SceneRigName, CameraRig> & Record<string, CameraRig>>;

/** Chapter V's rigs (`farplane.ts` `RIGS`): the same party slots, the same HUD. Staging, not game data. */
export const DEN_RIGS: RigSet = {
  intro: { position: [-2.2, 4.2, 13.2], lookAt: [1.0, 2.4, -3.0], fov: 30, sway: 1.4 },
  idle: { position: DEN_CAMERA_REF, lookAt: [0.5, 1.45, -1.4], fov: 32 },
  action: { position: [-0.15, 2.55, 9.6], lookAt: [1.05, 1.5, -1.2], fov: 32, sway: 0.7 },
  party: { position: [-1.6, 2.0, 6.6], lookAt: [-2.9, 1.2, 0.4], fov: 32, sway: 0.7 },
  enemy: { position: [1.5, 2.4, 5.8], lookAt: [3.1, 1.8, -2.5], fov: 32, sway: 0.7 },
  victory: { position: [-1.2, 1.9, 6.8], lookAt: [-2.5, 1.2, 0.8], fov: 32, sway: 1.2 },
  reveal: { position: [-1.2, 2.2, 13.6], lookAt: [0.2, 2.9, -5.5], fov: 34, sway: 1.5 },
};

/** Yuna, Rikku, Paine (the Chapter V build's order), on Chapter V's held slots; then reserves off frame left. */
const PARTY_SLOTS: Array<[number, number, number]> = [
  [-2.48, 0, 1.45],
  [-1.44, 0, 0.1],
  [-0.33, 0, -1.3],
  [-11.5, 0, 2.6],
  [-12.4, 0, 1.0],
  [-13.3, 0, -0.6],
  [-14.2, 0, -2.2],
];

/** The three shades' combatant ids (`src/data/ffx2/enemies/den-of-woe.ts`). */
export const DEN_IDS = { baralai: 'shade-baralai', gippal: 'shade-gippal', nooj: 'shade-nooj' } as const;

/**
 * The boss spot, one shade a link (r3942-stage: real sizes, nearer the girls). It was Chapter V's Shiva spot (`farplane-parts.ts`, x 1.12, z -5.0), far back, where the
 * shades read 0.96 of a girl at 2.6 tall and would read 0.71 at their real 1.95; at (1.5, -0.4) a shade stands beside the party, right of Paine and between Rikku's depth
 * and hers, and reads 1.0 of a girl at 1600x900 (real at the same distance: 1.09, Nooj 1.18) with its head on the line it had, its right edge at x 1030 (the command
 * list starts at 1246) and its feet at y 680 above the move advisor's card (y 705). x 2.0 read the same on the desktop but made the phone's slice fit stand the camera back by
 * 1.9 to 3.4 (the party 17 percent smaller); at 1.5 it stands back by 0.2. Nooj, the tallest, stands a little deeper. Staging, ours.
 */
export const DEN_SPOTS: Readonly<Record<string, [number, number, number]>> = {
  [DEN_IDS.baralai]: [1.5, 0, -0.4],
  [DEN_IDS.gippal]: [1.5, 0, -0.4],
  [DEN_IDS.nooj]: [1.5, 0, -0.8],
};

/** The girls' world height (the FFX-2 chapters' 1.78, Chapter V's). */
export const DEN_PARTY_HEIGHT = 1.78;

/**
 * World heights (r3942-stage, FFX-2 only): the girls' {@link DEN_PARTY_HEIGHT} times each shade's model's ratio to them, from the game's own HD models
 * (`data/ffx2/fiend-stature.ts`, `research/ffx2-gippal-den-of-woe.md` §12): Baralai 19.35 and Gippal 19.41 over the girls' 17.73 are 1.09, Nooj 20.91 is 1.18, so
 * 1.943, 1.949 and 2.100. They were the options frames' factors over 3.4 (2.61, 2.57 and 2.79, 1.47 to 1.57 times the girls): taller than the models, and they stood
 * far back, so they read about 0.96 of a girl on screen. Nooj is the tallest, as the bible's 188 cm against Baralai's 176 cm `[single source]` has him; Gippal and
 * Baralai are one height to the measurement's accuracy (0.3 percent apart).
 */
export const DEN_FIGURE_HEIGHTS: Readonly<Record<string, number>> = ffx2FiendFigureHeights(
  [DEN_IDS.baralai, DEN_IDS.gippal, DEN_IDS.nooj],
  'ffx2-den-of-woe',
  DEN_PARTY_HEIGHT,
);

const ENEMY_SLOTS: Array<[number, number, number]> = [DEN_SPOTS[DEN_IDS.baralai]!, [2.3, 0, -8.0], [-0.5, 0, -6.6]];

const DEN_STAGING = { holdParty: true, enemySpots: DEN_SPOTS, figureHeights: DEN_FIGURE_HEIGHTS, advisorCap: FORWARD_FIEND_ADVISOR_CAP } as const;

/** The published slots, the same shape every other scene exports. */
export const DEN_OF_WOE_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.slice(0, 3).map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: DEN_PARTY_HEIGHT,
  enemyHeight: DEN_FIGURE_HEIGHTS[DEN_IDS.nooj]!,
  ...DEN_STAGING,
};

/**
 * The plate's wings (PR-0300; FFX-2 only: this scene is Chapter XV's): the outer 20 % of the painting mirrored out
 * 18 units each side, so the plate keeps filling the frame at 2000x1012 and wider. At the intro and enemy rigs the
 * plane's own right edge sat at 94 % of a 1.98 frame (87 % at 2.37), and the party rigs showed the left edge.
 *
 * Release 38 (D-343): painted wings, left candidate 1 and right candidate 3 of the 2026-10-03 plate-wing round, replace the
 * mirrored ones where `public/art/backdrops/wings/` holds them (646 px strips: 550 of wing, 96 over the plate's edge).
 */
export const DEN_PLATE_WINGS = {
  width: 18,
  reflect: 0.2,
  painted: { left: 'art/backdrops/wings/den-of-woe-left.png', right: 'art/backdrops/wings/den-of-woe-right.png', stripPx: 646, overlapPx: 96, plateWidthPx: 2688 },
} as const;

/** The Bevelle Underground's cold grade (the approved FFX-2 underground), pulled toward the plate's blue. */
export const DEN_OF_WOE_PALETTE: ScenePalette = {
  ...ScenePalettes.bevelleUnderground,
  name: 'den-of-woe',
  exposure: 1.16,
  bloomThreshold: 0.84,
  bloomStrength: 0.6,
  bloomRadius: 0.62,
  tiltFocus: 0.44,
  tiltBandWidth: 0.17,
  tiltMaxBlur: 4.0,
  vignette: 0.32,
  gain: [0.96, 1.02, 1.08],
  saturation: 1.02,
};

function plateOptions(url: string, low: boolean, cameraRef: [number, number, number]): BackdropOptions {
  return {
    url,
    width: DEN_BACKDROP.width,
    distance: DEN_BACKDROP.distance,
    centreY: DEN_BACKDROP.centreY,
    cameraRef,
    // The dark rock above the horizon parts from the floor on a sway; the floor itself stays one plane.
    layers: low ? [] : [{ from: 0.0, to: 0.4, feather: 0.1, featherBottom: 0.08, z: -36, opacity: 0.32 }],
    /** `key` is the pyreflies' glow in the dark, `horizon` the far floor line, `ground` the lit stone. */
    sampleBands: { sky: [0.02, 0.2], horizon: [0.42, 0.48], ground: [0.8, 0.97], key: [0.1, 0.36] },
    ground: false,
    fog: { near: 12, far: 42, colorMix: 0.34 },
    fogPlanes: [
      { z: -26, y: 1.4, width: 70, height: 9, opacity: 0.18, speed: 0.008 },
      { z: -7.5, y: 0.5, width: 32, height: 4.5, opacity: 0.1, speed: 0.025, additive: true },
    ],
  };
}

/** **The Den of Woe**, as a {@link SceneFactory}. Owns no combatants. */
export const buildDenOfWoeScene: SceneFactory = async (opts: SceneBuildOptions = {}): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:den-of-woe';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? DEN_CAMERA_REF;
  const url = artUrl('art/backdrops/den-of-woe.png');

  const options = plateOptions(url, low, cameraRef);
  let backdrop = await Backdrop.create(options);
  addPlateWings(backdrop, DEN_PLATE_WINGS);
  await paintPlateWings(backdrop, DEN_PLATE_WINGS);
  backdrop.applyTo(group);

  const lights = new LightRig({
    palette: backdrop.palette,
    // A cold key from the pyreflies overhead, a pale blue rim, a low ambient: a cave.
    keyFrom: [-4.8, 7.8, 4.6],
    keyIntensity: 1.2,
    rimFrom: [6.2, 3.2, -4.4],
    rimColor: 0xbfe4ff,
    rimIntensity: 1.05,
    fillIntensity: 0.9,
    ambientIntensity: 0.58,
    luma: { key: 0.82, fill: 0.68, rim: 0.9, ambient: 0.52 },
    shadows: false,
  });
  group.add(lights.group);

  const pools = PARTY_SLOTS.slice(0, 3).map((s) => {
    const pool = makeLightPool({ color: 0xbfe8ff, radius: 0.95, opacity: 0.12 });
    pool.position.set(s[0], 0.02, s[2]);
    group.add(pool);
    return pool;
  });

  /**
   * Live pyreflies (research §6.2: the cave's pyreflies hold the feelings). Sparse and cold, because
   * the plate already paints its own motes (`den-of-woe.json` knownDefects: live ones may double up).
   */
  const motes = new ParticleField(
    ParticlePresets.pyreflies({
      count: low ? 22 : 48,
      bounds: { x: 9.5, y: 3.4, z: 5.5 },
      colors: [0xbfe8ff, 0xffffff, 0x9fe6d8, 0xd6f0ff],
      size: 7,
      opacity: 0.8,
      drift: [0.02, 0.3, 0],
      wobble: [0.4, 0.18, 0.3],
      twinkle: 0.8,
    }),
  );
  motes.position.set(0.3, 1.8, -1.4);
  group.add(motes);

  const watchEnabled = opts.watchAssets ?? Boolean(import.meta.env.DEV);
  let watcher: AssetWatcher | null = null;
  if (watchEnabled && backdrop.placeholder) {
    watcher = watchAssets([url], () => {
      void (async (): Promise<void> => {
        const next = await Backdrop.create(options);
        addPlateWings(next, DEN_PLATE_WINGS);
        await paintPlateWings(next, DEN_PLATE_WINGS);
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
    particles: [motes],
    rigs: DEN_RIGS,
    partySlots: PARTY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    enemySlots: ENEMY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    partyHeight: DEN_OF_WOE_SLOTS.partyHeight!,
    enemyHeight: DEN_OF_WOE_SLOTS.enemyHeight!,
    ...DEN_STAGING,
    palette: { ...DEN_OF_WOE_PALETTE },
    update(dt: number): void {
      backdrop.update(dt);
      lights.update(dt);
      motes.update(dt);
    },
    dispose(): void {
      watcher?.stop();
      for (const p of pools) {
        p.geometry.dispose();
        (p.material as { dispose(): void }).dispose();
      }
      motes.dispose();
      lights.dispose();
      backdrop.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
};
