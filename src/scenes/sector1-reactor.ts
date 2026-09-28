import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import { LightRig } from '../engine/Lighting.ts';
import { artUrl } from '../engine/PaintedArt.ts';
import { ParticleField } from '../engine/Particles.ts';
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
  sector1Layout,
  sector1RigsFor,
  sector1Staging,
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
// On whose word: Bailey, 2026-09-27 ~13:00 EDT, "I'll go with all of your
// recommendations" (D-259): the painting is the Film reactor core (our own
// render, rule 8), installed as `public/art/backdrops/ff7-film-reactor.png` and
// locked in set `bailey:2026-09-27-ff7-film`. The staging (sides switched,
// facing, rows, the fixed camera, the phone's drawn-in formation) and every
// number are in `./sector1-reactor-staging.ts`, with which are our estimates.
//
// THE PAINTING. One plane, no parallax layers (the fixed camera only moves for
// the FF7 opening and Game Over, too little for a layer to register), square to
// the pitched view, covering the frame with its bottom on the frame's
// (`sector1Backdrop`). No 3D ground and no fog: the painting's own grated floor
// is the floor, and each figure brings its contact shadow. The layout (desk or
// upright phone, E1) is chosen once, at build, from the viewport.

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
  const layout = sector1Layout(aspect);
  const plane = sector1Backdrop(aspect);
  const rigs = sector1RigsFor(aspect);

  const backdropOptions = {
    url: artUrl(SECTOR1_PLATE.url),
    width: plane.width,
    distance: plane.distance,
    centreY: plane.centreY,
    cameraRef: opts.cameraRef ?? [...SECTOR1_CAMERA.position],
    layers: [],
    /** `horizon` the core's lit base, `ground` the grated floor, `key` the lamps along the walls. */
    sampleBands: { sky: [0.0, 0.12], horizon: [0.52, 0.62], ground: [0.8, 0.96], key: [0.2, 0.45] },
    // No 3D ground: the painting's own grated floor stays visible under the fighters (each has its own contact shadow).
    ground: false,
    fog: false,
    fogPlanes: false,
    background: 0x07090a,
  } satisfies BackdropOptions;

  const backdrop = await Backdrop.create(backdropOptions);
  backdrop.applyTo(group);
  // Square to the pitched view (`sector1Backdrop`): the plane leans back by the camera's pitch, so the painting reads undistorted.
  const painting = backdrop.group.getObjectByName('backdrop-painting');
  if (painting) painting.rotation.x = -plane.pitch;

  const lights = new LightRig({
    palette: backdrop.palette,
    // The mako column glows at the centre, behind and between the two sides.
    keyFrom: [0.0, 5.0, -6.0],
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

  // Mako motes drifting up out of the core and across the field (repair item 9: the Film frame's floating motes;
  // our estimate). Two depths: a far band round the column, a sparser near band crossing the fighters. None on
  // Low; fewer on a phone.
  const motes: ParticleField[] = [];
  if (!low) {
    const n = layout.name === 'phone' ? 0.6 : 1;
    const far = new ParticleField({
      count: Math.round(260 * n), bounds: { x: 12, y: 6, z: 6 }, colors: [0x9dffd0, 0x7affc0, 0xd8fff0],
      size: 6, sizeJitter: 0.6, drift: [0.02, 0.22, 0], wobble: [0.35, 0.2, 0.3], wobbleSpeed: 0.3,
      twinkle: 0.55, opacity: 0.85, additive: true, hardness: 0.45,
    });
    far.position.set(0, 3.2, -5);
    const near = new ParticleField({
      count: Math.round(110 * n), bounds: { x: 13, y: 4.5, z: 4 }, colors: [0xb8ffe0, 0x7dffc8],
      size: 8, sizeJitter: 0.6, drift: [0.03, 0.16, 0], wobble: [0.4, 0.25, 0.3], wobbleSpeed: 0.26,
      twinkle: 0.5, opacity: 0.7, additive: true, hardness: 0.4,
    });
    near.position.set(-0.5, 2.0, 0.2);
    motes.push(far, near);
    for (const m of motes) group.add(m);
  }

  return {
    group,
    backdrop,
    lights,
    particles: motes,
    rigs,
    partySlots: layout.front.map((s) => new Vector3(s[0], s[1], s[2])),
    enemySlots: [new Vector3(layout.boss[0], layout.boss[1], layout.boss[2])],
    partyHeight: SECTOR1_HEIGHTS.cloud,
    enemyHeight: SECTOR1_HEIGHTS['guard-scorpion'],
    ...sector1Staging(layout),
    palette: { ...SECTOR1_PALETTE },
    update(dt: number): void {
      backdrop.update(dt);
      lights.update(dt);
      for (const m of motes) m.update(dt);
    },
    dispose(): void {
      for (const m of motes) m.dispose();
      lights.dispose();
      backdrop.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
};
