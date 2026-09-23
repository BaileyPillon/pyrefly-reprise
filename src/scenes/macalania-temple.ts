import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { artUrl, watchAssets, type AssetWatcher } from '../engine/PaintedArt.ts';
import { ParticleField, ParticlePresets } from '../engine/Particles.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory, SceneRigName } from './types.ts';
import type { SceneSlots } from './index.ts';

// ---------------------------------------------------------------------------
// Macalania Temple — the antechamber outside the Chamber of the Fayth (FFX)
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. Seymour, his two Guado Guardians and
// Anima are `research/ffx-seymour-anima-macalania.md`'s own encounter; nothing
// here is FFX-2's and nothing is shared plumbing.
//
// INTEGRATOR TODO (one line each, this track does not edit shared registries):
// `src/scenes/index.ts` — `'macalania-temple': buildMacalaniaTempleScene` in
// SCENE_FACTORIES and a SCENES entry with `slots: MACALANIA_TEMPLE_SLOTS`;
// `src/debug/api.ts` — `app.register('scene-macalania-temple', () => new
// MacalaniaTempleSceneScreen())` from `./macalania-temple-debug.ts`.
//
// The painting (`public/art/backdrops/macalania-temple.png`, 2688x1536,
// CANDIDATE, img2img from Bailey's pick **backdrop A**, docs/target/targets.json
// + D-019) is a **low, level, front-on** view: three glowing ice doors between
// gold-banded columns, twin braziers, a dome above, and a mirror-ice floor that
// is only the bottom 11 % of the frame (its seam sits at 0.89 of the height).
// A battle camera looks *down* on the field, so the painted floor can never be
// the floor the fighters stand on. The fix is to stand the painting close, as
// the room's back wall (distance -20), and put that seam at world y 0.25, so
// the 3D ice under the fighters runs straight into the painted ice. The idle
// frame then shows the painting from 0.37 down: the door arches, the braziers
// and the seam; the dome is off the top. That is a knowing crop, recorded in
// docs/handoff/chapter-macalania-scene.md.

/** The camera the parallax stack and the backdrop framing are solved for; identical to `idle`. */
const CAMERA_REF: [number, number, number] = [0, 2.2, 10.6];

/** Painting plane: 40 wide at z -20 (H 22.86), seam (0.89) at y 0.25, so centre y 9.16. */
const BACKDROP = { width: 40, distance: -20, centreY: 9.16 } as const;

/**
 * FFX framing, fov 30-34 like chapters 1 to 3, but nearly level (Dream's End's
 * choice, `dreams-end.ts`): the painting is a level view and a steep camera
 * would push the doors out of the top of the frame. Two bespoke rigs carry
 * Anima's arrival (`macalania-temple-arrival.ts`): `anima-low` is concept A's
 * step 1 (floor height, behind the party), `anima` is where the rise ends.
 */
const RIGS: Record<SceneRigName, CameraRig> & Record<string, CameraRig> = {
  /** The held establishing frame of the empty antechamber the story opens on (§9.1, the script's `wait(2000)`). */
  intro: { position: [0.3, 2.9, 14.2], lookAt: [0.7, 2.6, -4.0], fov: 30, sway: 1.4 },
  idle: { position: CAMERA_REF, lookAt: [0.55, 1.95, -1.6], fov: 32 },
  action: { position: [0.3, 2.1, 9.7], lookAt: [1.25, 1.85, -1.6], fov: 32, sway: 0.7 },
  party: { position: [-1.4, 1.9, 7.0], lookAt: [-2.3, 1.3, 0.4], fov: 32, sway: 0.7 },
  enemy: { position: [1.2, 2.1, 6.4], lookAt: [2.2, 1.8, -3.0], fov: 32, sway: 0.7 },
  victory: { position: [-1.7, 1.9, 7.3], lookAt: [-2.4, 1.3, 0.9], fov: 32, sway: 1.2 },
  /** Concept A, beat 1: floor height behind the party, the ice filling the bottom of the frame. */
  'anima-low': { position: [1.5, 0.95, 6.8], lookAt: [2.4, 1.75, -4.8], fov: 34, sway: 0.3 },
  /** Concept A, beat 4: risen with her, looking up; the move from `anima-low` to here is the rise. */
  anima: { position: [1.2, 1.55, 8.4], lookAt: [2.2, 2.7, -4.8], fov: 33, sway: 0.5 },
};

/**
 * Party: Chapter 1's (`gagazet.ts`) measured FFX arc, front to back and
 * staggered, then four reserve spots off frame-left. Order is the build's
 * `activeSlots` (`src/data/ffx/builds/macalania.ts`): Tidus, Yuna, Rikku.
 */
const PARTY_SLOTS: Array<[number, number, number]> = [
  [-1.55, 0, 1.55],
  [-2.95, 0, 0.25],
  [-1.05, 0, -1.05],
  [-11.6, 0, 2.6],
  [-12.5, 0, 1.0],
  [-13.4, 0, -0.6],
  [-14.3, 0, -2.2],
];

/**
 * Enemy slots, index = the formation's `slot` field
 * (`src/data/ffx/enemies/seymour-anima-macalania.ts`): 0 Guardian A, 1 Seymour
 * (M2), 2 Guardian B, 3 Anima (M4, hidden until the summon).
 *
 * The layout is the picked one, not a guess: options.json `cast` canon notes
 * "Two identical retainers flank Seymour" and research §9.3 "one per side", so
 * Seymour stands centre with a Guardian either side of him in depth (A nearer
 * the party, B further back), which is how a side-on FFX field reads "one per
 * side". Anima rises behind them, right of centre, where concept frame B
 * (`arrival/b.png`) puts her, and the Guardians are gone by then (§5.2, the
 * summon kills every living Guardian).
 *
 * Projected at `idle`, 16:9 (`tests/unit/chapters/macalania-scene.test.ts`
 * measures this with a real three.js camera): every enemy lies left of the FFX
 * HUD rail at 0.79 of the width (`docs/ENGINE-API.md#hud-safe-area`), and no
 * two ground figures overlap by more than a sliver.
 */
const ENEMY_SLOTS: Array<[number, number, number]> = [
  [0.7, 0, -1.5], // 0 Guado Guardian A: in front of him, party side
  [1.95, 0, -2.7], // 1 Seymour: centre, the focal point
  [3.35, 0, -4.0], // 2 Guado Guardian B: behind him, far side
  [2.6, 0, -4.8], // 3 Anima: rises here, behind the three
];

/**
 * Where Seymour steps back to as she rises (concept B's beat, folded into A's
 * tail by the driver's recommendation): out of the light, back-left, still on
 * screen and idle for all of act two, untargetable (decision C-2).
 */
export const SEYMOUR_STEP_BACK: [number, number, number] = [0.55, 0, -5.2];

/**
 * World heights. **Seymour's is sourced** (research §9.2: "a tall Guado-human
 * hybrid, 187 cm"). The rest are presentation estimates, not game data
 * (AGENTS.md rule 6): party heights are Chapter 1's (`GAGAZET_ACTOR_HEIGHTS`,
 * Rikku from the Leblanc scene); the Guardians are "tall and narrow" (§9.3,
 * no number) but "subordinate in silhouette to Seymour", so his height, no
 * taller; Anima is "towering" (§9.4, no
 * number) and **the smaller model** of the two Animas (§9.4 note 1), so she is
 * staged a little under Braska's Final Aeon (3.45, `dreams-end.ts`) plus her
 * hover, not at an aeon-of-legend scale.
 */
export const MACALANIA_TEMPLE_ACTOR_HEIGHTS = {
  tidus: 1.75,
  yuna: 1.68,
  rikku: 1.6,
  seymour: 1.87,
  guadoGuardian: 1.85,
  anima: 3.6,
} as const;

/** Anima's hover once risen: she floats in her chains (her sidecar's baseline is her lowest point). */
export const ANIMA_HOVER = 0.3;

/** Index of each combatant's slot in {@link MACALANIA_TEMPLE_SLOTS}.enemy. */
export const MACALANIA_ENEMY_SLOT = {
  'guado-guardian-a': 0,
  'seymour-macalania': 1,
  'guado-guardian-b': 2,
  'anima-macalania': 3,
} as const;

/** The published slots, same shape every other scene exports. */
export const MACALANIA_TEMPLE_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.slice(0, 3).map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: MACALANIA_TEMPLE_ACTOR_HEIGHTS.tidus,
  enemyHeight: MACALANIA_TEMPLE_ACTOR_HEIGHTS.seymour,
};

/** Every rig, exported for the projection test and the arrival module. */
export const MACALANIA_TEMPLE_RIGS: Readonly<Record<string, CameraRig>> = RIGS;

/** The backdrop plane's geometry, exported for the framing test. */
export const MACALANIA_TEMPLE_BACKDROP = BACKDROP;

/**
 * Ice lit by fire: cold glacier shadows, warm brazier highlights. Its own grade,
 * deliberately not Gagazet's (plan §6.2: "Must not share a palette with
 * Gagazet"): the shadow tint is cyan-green (the "faint green core in thick
 * ice"), the gain leans warm so the braziers stay gold, and bloom is generous
 * because the doors are light *through* ice, the room's own light source.
 */
export const MACALANIA_TEMPLE_PALETTE: ScenePalette = {
  name: 'macalania-temple',
  lift: [0.004, 0.014, 0.03],
  gamma: [1.0, 0.99, 0.97],
  gain: [1.06, 1.0, 0.98],
  saturation: 1.06,
  vignette: 0.42,
  vignetteRadius: 0.64,
  shadowTint: [0.3, 0.62, 0.72],
  shadowTintAmount: 0.18,
  grain: 0.022,
  exposure: 1.02,
  bloomThreshold: 0.8,
  bloomStrength: 0.7,
  bloomRadius: 0.62,
  tiltFocus: 0.42,
  tiltBandWidth: 0.16,
  tiltMaxBlur: 3.8,
};

/** **Macalania Temple**, as a {@link SceneFactory}. Owns no actors (`docs/ENGINE-API.md#scene-builder-contract`). */
export const buildMacalaniaTempleScene: SceneFactory = async (
  opts: SceneBuildOptions = {},
): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:macalania-temple';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? CAMERA_REF;
  const url = artUrl('art/backdrops/macalania-temple.png');

  const backdropOptions = {
    url,
    width: BACKDROP.width,
    distance: BACKDROP.distance,
    centreY: BACKDROP.centreY,
    cameraRef,
    /**
     * Two masked bands: the column/door band (0.3-0.7, the strongest vertical
     * lines) and the braziers and seam (0.66-0.9), which sit nearest the
     * fighters and so move most.
     */
    layers: low
      ? [{ from: 0.66, to: 0.9, feather: 0.1, featherBottom: 0.05, z: -12, opacity: 0.5 }]
      : [
          { from: 0.3, to: 0.7, feather: 0.1, featherBottom: 0.08, z: -16, opacity: 0.5 },
          { from: 0.66, to: 0.9, feather: 0.1, featherBottom: 0.05, z: -12, opacity: 0.55 },
        ],
    /**
     * `key` is the braziers' band (the painting's warm light), `horizon` the
     * glowing doors, `ground` the mirror-ice floor strip, so the 3D ice under
     * the fighters takes the painted floor's blue.
     */
    sampleBands: {
      sky: [0.0, 0.12],
      horizon: [0.5, 0.7],
      ground: [0.9, 0.99],
      key: [0.72, 0.8],
    },
    // Blue from the painted ice. Opaque under the fighters, fading out before
    // the painting's seam (z -20) so the painted mirror floor shows through
    // at the back instead of being paved over.
    ground: {
      size: 40,
      repeat: 5,
      tintMix: 0.34,
      luma: 0.56,
      fade: true,
      fadeCore: 0.28,
      center: [0.5, -3.5] as [number, number],
    },
    fog: { near: 16, far: 42, colorMix: 0.18 },
    fogPlanes: [
      { z: -14, y: 1.4, width: 44, height: 7, opacity: 0.1, speed: 0.01, additive: true },
      { z: -7, y: 0.5, width: 30, height: 3, opacity: 0.08, speed: 0.016, additive: true },
    ],
    background: 0x07162c,
  } satisfies BackdropOptions;

  let backdrop = await Backdrop.create(backdropOptions);
  backdrop.applyTo(group);

  const lights = new LightRig({
    palette: backdrop.palette,
    // The two braziers are the painting's warm sources; the key comes from the
    // right one, above and behind the enemy line.
    keyFrom: [4.5, 5.4, -8.0],
    keyIntensity: 1.0,
    // Cold light through the ice doors, behind the fighters: the rim.
    rimFrom: [-1.5, 3.2, -9.0],
    rimColor: 0x8fd4ff,
    rimIntensity: 0.95,
    fillIntensity: 0.9,
    ambientIntensity: 0.6,
    luma: { key: 0.8, fill: 0.58, rim: 0.9, ambient: 0.5 },
    shadows: low ? false : { mapSize: 1024, area: 14, radius: 3.2, bias: -0.0013 },
  });
  group.add(lights.group);

  const k = low ? 0.5 : 1;
  /** Ice glitter hanging in the air: fine, cold, barely drifting. */
  const glitter = new ParticleField(
    ParticlePresets.snow({
      count: Math.round(110 * k),
      bounds: { x: 10, y: 4.5, z: 7 },
      colors: [0xdff4ff, 0xffffff, 0xa8dcff],
      size: 2.4,
      drift: [0.01, -0.03, 0],
      wobble: [0.18, 0.08, 0.14],
      wobbleSpeed: 0.35,
      twinkle: 0.7,
      opacity: 0.55,
      additive: true,
      gravity: 0,
    }),
  );
  glitter.position.set(0.5, 2.0, -2.0);
  /** Pyreflies near the Chamber door: the fayth is in the next room. */
  const pyreflies = new ParticleField(
    ParticlePresets.pyreflies({
      count: Math.round(40 * k),
      bounds: { x: 12, y: 3.2, z: 4 },
      size: 5.2,
      opacity: 0.6,
    }),
  );
  pyreflies.position.set(0.8, 2.2, -12);
  const particles = [glitter, pyreflies];
  for (const p of particles) group.add(p);

  const pools = [
    ...PARTY_SLOTS.slice(0, 3).map((s) => {
      const pool = makeLightPool({ color: 0xffd9a0, radius: 1.0, opacity: 0.14 });
      pool.position.set(s[0], 0.02, s[2]);
      return pool;
    }),
    ...ENEMY_SLOTS.slice(0, 3).map((s) => {
      const pool = makeLightPool({ color: 0x9fd8ff, radius: 1.1, opacity: 0.16 });
      pool.position.set(s[0], 0.018, s[2]);
      return pool;
    }),
  ];
  for (const p of pools) group.add(p);

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
        lights.key.color.setHex(backdrop.palette.key);
        lights.ambient.color.setHex(backdrop.palette.horizon);
      })();
    });
  }

  return {
    group,
    get backdrop(): Backdrop {
      return backdrop;
    },
    lights,
    particles,
    rigs: RIGS,
    partySlots: PARTY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    enemySlots: ENEMY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    palette: { ...MACALANIA_TEMPLE_PALETTE },
    update(dt: number): void {
      backdrop.update(dt);
      lights.update(dt);
      for (const p of particles) p.update(dt);
    },
    dispose(): void {
      watcher?.stop();
      for (const p of particles) p.dispose();
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
