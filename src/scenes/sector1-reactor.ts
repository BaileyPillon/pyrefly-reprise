import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import { LightRig } from '../engine/Lighting.ts';
import { artUrl } from '../engine/PaintedArt.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots } from './index.ts';
import { viewportAspect } from './cavern-stolen-fayth-rigs.ts';
import {
  SECTOR1_BOSS_SPOT,
  SECTOR1_CAMERA,
  SECTOR1_FRONT,
  SECTOR1_HEIGHTS,
  SECTOR1_PLATE,
  SECTOR1_STAGING,
  sector1Backdrop,
  sector1RigsFor,
} from './sector1-reactor-staging.ts';

// ---------------------------------------------------------------------------
// The No. 1 Reactor, the core (FF7): the hidden Guard Scorpion experiment
// ---------------------------------------------------------------------------
//
// Game case: FF7 only [AGENTS.md rule 14]. Chapter record
// `src/data/chapter-ff7-guard-scorpion.ts` (`sceneKey: 'sector1-reactor'`);
// the arena is the reactor core, "a large tubular structure set into a wall
// with pipes running to a valve at its base" [research/ff7-guard-scorpion.md
// §10, single source: FF Wiki].
//
// On whose word: Bailey, 2026-09-27 (D-240): the painting is round 1
// `reactor-core/core.1` (our own render, rule 8), installed unchanged as
// `public/art/backdrops/ff7-sector1-reactor.png` and locked in set
// `bailey:2026-09-27-ff7`. The staging (sides, facing, rows, the fixed camera)
// and every number are in `./sector1-reactor-staging.ts`, with their sources
// and which are our estimates.
//
// THE PAINTING. One plane, no parallax layers (the camera never moves, so a
// layer would only register), sized to cover the frame at z -12 as the
// composite shows it: fit to the width at 16:9, a sliver cropped top and
// bottom. No 3D ground and no fog: the painting's own grated catwalk is the
// floor, as in the composite, and each figure brings its contact shadow.

/** The published slots, same shape every other scene exports. */
export const SECTOR1_SLOTS: SceneSlots = {
  party: SECTOR1_FRONT.map((s) => [s[0], s[1], s[2]] as [number, number, number]),
  enemy: [[SECTOR1_BOSS_SPOT[0], SECTOR1_BOSS_SPOT[1], SECTOR1_BOSS_SPOT[2]]],
  partyHeight: SECTOR1_HEIGHTS.cloud,
  enemyHeight: SECTOR1_HEIGHTS['guard-scorpion'],
  ...SECTOR1_STAGING,
};

/**
 * The grade (ours). `gamma` 2.0 is the one departure from the house grade: the
 * post chain hands the grade pass linear light and writes its result straight
 * to the screen, so with gamma 1 a painting's darks come out far darker than
 * painted (measured on this plate: the composite's 24 of 255 became 3). At 2.0
 * the plate and the figures read close to as painted, as in the composite
 * Bailey saw (2.2 lifted the darks past it). FF7 only; no FFX or FFX-2 palette
 * changes.
 */
export const SECTOR1_PALETTE: ScenePalette = {
  name: 'sector1-reactor',
  lift: [0, 0, 0],
  gamma: [2.0, 2.0, 2.0],
  gain: [1.0, 1.0, 1.0],
  saturation: 1.0,
  vignette: 0.12,
  vignetteRadius: 0.8,
  shadowTint: [0.3, 0.55, 0.45],
  shadowTintAmount: 0.0,
  grain: 0.018,
  exposure: 1.0,
  bloomThreshold: 0.84,
  bloomStrength: 0.4,
  bloomRadius: 0.5,
  tiltFocus: 0.62,
  tiltBandWidth: 0.4,
  tiltMaxBlur: 0.8,
};

/** **The No. 1 Reactor core**, as a {@link SceneFactory}. Owns no actors. */
export const buildSector1ReactorScene: SceneFactory = async (opts: SceneBuildOptions = {}): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:sector1-reactor';
  const low = opts.quality === 'low';
  const aspect = viewportAspect();
  const plane = sector1Backdrop();
  const rigs = sector1RigsFor(aspect);

  const backdropOptions = {
    url: artUrl(SECTOR1_PLATE.url),
    width: plane.width,
    distance: plane.distance,
    centreY: plane.centreY,
    cameraRef: opts.cameraRef ?? [...SECTOR1_CAMERA.position],
    layers: [],
    /** `horizon` the tower's lit base, `ground` the grated catwalk, `key` the lamps along the walls. */
    sampleBands: { sky: [0.0, 0.12], horizon: [0.62, 0.74], ground: [0.86, 0.98], key: [0.3, 0.5] },
    // No 3D ground: the painting's own grated floor stays visible under the fighters (each has its own contact shadow).
    ground: false,
    fog: false,
    fogPlanes: false,
    background: 0x07090a,
  } satisfies BackdropOptions;

  const backdrop = await Backdrop.create(backdropOptions);
  backdrop.applyTo(group);

  const lights = new LightRig({
    palette: backdrop.palette,
    // The core's lit crown is above and behind the centre; the mako column glows green below it.
    keyFrom: [0.5, 6.0, -6.0],
    keyIntensity: 0.85,
    rimFrom: [0.0, 2.2, -9.0],
    rimColor: 0x8fe8c0,
    rimIntensity: 0.7,
    fillIntensity: 0.75,
    ambientIntensity: 0.55,
    luma: { key: 0.75, fill: 0.55, rim: 0.8, ambient: 0.45 },
    shadows: low ? false : { mapSize: 1024, area: 12, radius: 3.0, bias: -0.0013 },
  });
  group.add(lights.group);

  return {
    group,
    backdrop,
    lights,
    particles: [],
    rigs,
    partySlots: SECTOR1_FRONT.map((s) => new Vector3(s[0], s[1], s[2])),
    enemySlots: [new Vector3(SECTOR1_BOSS_SPOT[0], SECTOR1_BOSS_SPOT[1], SECTOR1_BOSS_SPOT[2])],
    partyHeight: SECTOR1_HEIGHTS.cloud,
    enemyHeight: SECTOR1_HEIGHTS['guard-scorpion'],
    ...SECTOR1_STAGING,
    palette: { ...SECTOR1_PALETTE },
    update(dt: number): void {
      backdrop.update(dt);
      lights.update(dt);
    },
    dispose(): void {
      lights.dispose();
      backdrop.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
};
