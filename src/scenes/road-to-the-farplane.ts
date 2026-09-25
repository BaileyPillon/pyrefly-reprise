import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { artUrl, watchAssets, type AssetWatcher } from '../engine/PaintedArt.ts';
import { ParticleField, ParticlePresets } from '../engine/Particles.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import { ScenePalettes } from '../engine/ScenePalettes.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory, SceneRigName } from './types.ts';
import type { SceneSlots } from './index.ts';

// ---------------------------------------------------------------------------
// The Road to the Farplane (FFX-2)
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only [AGENTS.md rule 14]. Chapter XI: Shiva, the Magus
// Sisters and Anima on three platforms of the road down into the Farplane
// (`research/ffx2-fallen-aeons.md` §2, §6.1). No FFX chapter stands here.
//
// The scene key is `road-to-the-farplane`, the plate's own id, so the
// cutscene screen (which draws `backdrops/<sceneKey>.png`) finds the same
// painting.
//
// On whose word: Bailey, 2026-09-24, "I'll go with your recommendations for
// all" (D-111 FA14 b, D-119 O-3 A with B as the between-links shot): plate A
// (`public/art/backdrops/road-to-the-farplane.png`, 2688x1536, one platform
// over a bright void) under all three links, and plate B
// (`road-to-the-farplane-links.png`, A plus two far islands toward the spire)
// as the establishing shot between links. Both are used as installed.
//
// THE PAINTING. Every row above 827 of 1536 is the approved Farplane plate's
// own pixels (`road-to-the-farplane.json`), so the plate is framed exactly as
// Chapter V frames that plate (`farplane.ts`: 88 wide at z -48, centre -0.5,
// the idle camera at (0, 2.7, 9.8)), and the rigs and party slots below are
// Chapter V's, which are solved against the FFX-2 HUD at 1280x720, 1600x900
// and 2000x1012. Only the lower fifth differs: a grey-violet stone platform
// with glowing cracks where Chapter V has its flower field, so the 3D ground is
// the backdrop's own tinted plane, sampled from that stone, not the flowers.
//
// PLATE B. The road-links rig ({@link ROAD_LINKS_RIG}) is the between-links
// shot: when the camera stands on it, plate B replaces plate A (same framing,
// same foreground platform); anywhere else plate A shows. The story's seam
// cuts to it (`src/story/scripts/ffx2-fallen-aeons.ts`).

/** The between-links rig. Mirrored in the story (`FALLEN_AEONS_LINKS_RIG`); a test pins them. */
export const ROAD_LINKS_RIG = 'road-links';

/** The camera the parallax stack and the plate are solved for: the `idle` rig's position (Chapter V's). */
export const ROAD_CAMERA_REF: [number, number, number] = [0, 2.7, 9.8];

/** The painting plane: Chapter V's solve for the same sky (`farplane.ts`, "Framing maths"). */
export const ROAD_BACKDROP = { width: 100, distance: -48, centreY: 8.8 } as const;

type RigSet = Readonly<Record<SceneRigName, CameraRig> & Record<string, CameraRig>>;

/**
 * Chapter V's rigs (`farplane.ts` `RIGS`), plus the between-links shot: a cut
 * to a low view from just behind the party's right, over their shoulders
 * toward the spire, where plate B's two far islands sit (the O-3 B frame).
 * Solved so the girls stand on the painted platform with their heads and
 * shoulders above the seam's dialogue box, and the islands clear right of
 * Paine. Staging, not game data.
 */
export const ROAD_RIGS: RigSet = {
  intro: { position: [-2.2, 4.2, 13.2], lookAt: [1.0, 2.4, -3.0], fov: 30, sway: 1.4 },
  idle: { position: ROAD_CAMERA_REF, lookAt: [0.5, 1.45, -1.4], fov: 32 },
  action: { position: [-0.15, 2.55, 9.6], lookAt: [1.05, 1.5, -1.2], fov: 32, sway: 0.7 },
  party: { position: [-1.6, 2.0, 6.6], lookAt: [-2.9, 1.2, 0.4], fov: 32, sway: 0.7 },
  enemy: { position: [1.5, 2.4, 5.8], lookAt: [3.1, 1.8, -2.5], fov: 32, sway: 0.7 },
  victory: { position: [-1.2, 1.9, 6.8], lookAt: [-2.5, 1.2, 0.8], fov: 32, sway: 1.2 },
  reveal: { position: [-1.2, 2.2, 13.6], lookAt: [0.2, 2.9, -5.5], fov: 34, sway: 1.5 },
  [ROAD_LINKS_RIG]: { position: [0.6, 1.8, 7.6], lookAt: [-1.0, 0.7, -6], fov: 32, sway: 0.2 },
};

/** How close the camera must stand to the road-links rig for plate B to show (world units). */
export const ROAD_LINKS_RADIUS = 0.9;

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

/** Combatant ids this scene stages (`src/data/ffx2/enemies/fallen-aeons-road.ts`, `magus-sisters.ts`). */
export const ROAD_IDS = { shiva: 'x2-shiva', sandy: 'sandy', cindy: 'cindy', mindy: 'mindy', anima: 'x2-anima' } as const;

/**
 * Where each fighter stands. Shiva keeps the spot Chapter V's relaxation settled
 * her on (`farplane-parts.ts`). The Sisters follow the visual bible's staging
 * (`[estimate]` there; `docs/concepts/chapters/fallen-aeons/README.md`): Sandy
 * at the back left, Cindy in front, Mindy on the right, hovering a little off
 * the stone ("hovers during battle", the wiki's profile). Anima takes the boss
 * spot, a little deeper for her size. Every number is staging, solved at
 * 1600x900 against the FFX-2 HUD (the boss gauges top left, the command list
 * from 0.745 of the width, the party plates bottom right).
 */
export const ROAD_SPOTS: Readonly<Record<string, [number, number, number]>> = {
  [ROAD_IDS.shiva]: [1.12, 0, -5.0],
  [ROAD_IDS.sandy]: [0.95, 0, -4.9],
  [ROAD_IDS.cindy]: [1.85, 0, -2.7],
  [ROAD_IDS.mindy]: [3.0, 0.55, -4.0],
  [ROAD_IDS.anima]: [1.0, 0, -6.2],
};

/**
 * World heights at the party's scale, ours (the concepts README: Sandy 2.3,
 * Cindy 1.7, Mindy 1.2). Shiva and Anima take the scene's boss height and their
 * own sidecars' scale, as Chapter V's Shiva did.
 */
export const ROAD_FIGURE_HEIGHTS: Readonly<Record<string, number>> = {
  [ROAD_IDS.sandy]: 2.3,
  [ROAD_IDS.cindy]: 1.7,
  [ROAD_IDS.mindy]: 1.2,
};

const ENEMY_SLOTS: Array<[number, number, number]> = [
  ROAD_SPOTS[ROAD_IDS.shiva]!,
  [2.3, 0, -8.0],
  [-0.5, 0, -6.6],
];

const ROAD_STAGING = { holdParty: true, enemySpots: ROAD_SPOTS, figureHeights: ROAD_FIGURE_HEIGHTS } as const;

/** The published slots, the same shape every other scene exports. */
export const ROAD_TO_THE_FARPLANE_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.slice(0, 3).map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: 1.78,
  enemyHeight: 3.4,
  ...ROAD_STAGING,
};

/** Chapter V's pulled-back Farplane grade (`farplane.ts`): the same painted sky, so the same answer to its brightness. */
export const ROAD_TO_THE_FARPLANE_PALETTE: ScenePalette = {
  ...ScenePalettes.farplane,
  name: 'road-to-the-farplane',
  exposure: 0.9,
  bloomThreshold: 0.9,
  bloomStrength: 0.5,
  bloomRadius: 0.6,
  tiltFocus: 0.44,
  tiltBandWidth: 0.17,
  tiltMaxBlur: 4.4,
  vignette: 0.24,
  shadowTintAmount: 0.08,
  gain: [1.0, 0.985, 1.02],
  lift: [0.016, 0.01, 0.02],
  saturation: 0.97,
};

/** True when a camera at `at` stands on the road-links rig (plate B shows). */
export function onLinksShot(at: { x: number; y: number; z: number }): boolean {
  const p = ROAD_RIGS[ROAD_LINKS_RIG]!.position as [number, number, number];
  return Math.hypot(at.x - p[0], at.y - p[1], at.z - p[2]) <= ROAD_LINKS_RADIUS;
}

function plateOptions(url: string, links: boolean, low: boolean, cameraRef: [number, number, number]): BackdropOptions {
  return {
    url,
    width: ROAD_BACKDROP.width,
    distance: ROAD_BACKDROP.distance,
    centreY: ROAD_BACKDROP.centreY,
    cameraRef,
    // The cloud band parts from the sky on a sway, as Chapter V's does; the between-links shot holds still.
    layers: low || links ? [] : [{ from: 0.3, to: 0.68, feather: 0.12, featherBottom: 0.09, z: -32, opacity: 0.38 }],
    /** `key` is the spire's glow, `horizon` the pale haze over the void, `ground` the grey-violet stone. */
    sampleBands: { sky: [0.02, 0.2], horizon: [0.7, 0.78], ground: [0.86, 0.97], key: [0.28, 0.44] },
    ground: false,
    fog: { near: 12, far: 40, colorMix: 0.3 },
    fogPlanes: links
      ? []
      : [
          { z: -30, y: 4.6, width: 76, height: 22, opacity: 0.26, speed: 0.006 },
          { z: -7.5, y: 0.9, width: 32, height: 6.5, opacity: 0.12, speed: 0.03, additive: true },
        ],
  };
}

/** **The Road to the Farplane**, as a {@link SceneFactory}. Owns no combatants. */
export const buildRoadToTheFarplaneScene: SceneFactory = async (opts: SceneBuildOptions = {}): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:road-to-the-farplane';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? ROAD_CAMERA_REF;
  const urlA = artUrl('art/backdrops/road-to-the-farplane.png');
  const urlB = artUrl('art/backdrops/road-to-the-farplane-links.png');

  const optionsA = plateOptions(urlA, false, low, cameraRef);
  let backdrop = await Backdrop.create(optionsA);
  backdrop.applyTo(group);
  // Plate B, held hidden until the camera stands on the road-links rig. Its own ground and fog stay
  // off: plate A's are the same stone and the same haze.
  const plateB = await Backdrop.create({ ...plateOptions(urlB, true, low, cameraRef), ground: false, fog: false, background: false });
  plateB.group.visible = false;
  group.add(plateB.group);

  const lights = new LightRig({
    palette: backdrop.palette,
    // Chapter V's rig: the spire's glow high behind, a pink rim, a high ambient (almost no real shadow here).
    keyFrom: [-5.4, 8.6, 5.2],
    keyIntensity: 1.35,
    rimFrom: [6.6, 3.4, -4.6],
    rimColor: 0xffd2ea,
    rimIntensity: 1.0,
    fillIntensity: 1.05,
    ambientIntensity: 0.7,
    luma: { key: 0.86, fill: 0.74, rim: 0.9, ambient: 0.6 },
    shadows: false,
  });
  group.add(lights.group);

  const pools = PARTY_SLOTS.slice(0, 3).map((s) => {
    const pool = makeLightPool({ color: 0xe8d4ff, radius: 0.95, opacity: 0.12 });
    pool.position.set(s[0], 0.02, s[2]);
    group.add(pool);
    return pool;
  });

  /** Spirit lights over the void (the plate's own motes, research §6.1: "floating lights"). */
  const motes = new ParticleField(
    ParticlePresets.pyreflies({
      count: low ? 50 : 110,
      bounds: { x: 10, y: 3.6, z: 5.5 },
      colors: [0xffc2e6, 0xffffff, 0xe7d0ff, 0xffa8d8],
      size: 9,
      opacity: 0.9,
      drift: [0.02, 0.4, 0],
      wobble: [0.5, 0.2, 0.34],
      twinkle: 0.85,
    }),
  );
  motes.position.set(0.3, 1.9, -1.4);
  group.add(motes);

  // The camera probe: the frame rendered from the road-links rig shows plate B, every other frame plate A.
  let links = false;
  pools[0]!.frustumCulled = false;
  pools[0]!.onBeforeRender = (_r, _s, camera): void => {
    const want = onLinksShot(camera.position);
    if (want === links) return;
    links = want;
    plateB.group.visible = want;
    backdrop.group.visible = !want;
  };

  const watchEnabled = opts.watchAssets ?? Boolean(import.meta.env.DEV);
  let watcher: AssetWatcher | null = null;
  if (watchEnabled && backdrop.placeholder) {
    watcher = watchAssets([urlA], () => {
      void (async (): Promise<void> => {
        const next = await Backdrop.create(optionsA);
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
    rigs: ROAD_RIGS,
    partySlots: PARTY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    enemySlots: ENEMY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    partyHeight: ROAD_TO_THE_FARPLANE_SLOTS.partyHeight!,
    enemyHeight: ROAD_TO_THE_FARPLANE_SLOTS.enemyHeight!,
    ...ROAD_STAGING,
    palette: { ...ROAD_TO_THE_FARPLANE_PALETTE },
    update(dt: number): void {
      backdrop.update(dt);
      plateB.update(dt);
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
      plateB.dispose();
      backdrop.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
};
