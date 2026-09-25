import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { artUrl, watchAssets, type AssetWatcher } from '../engine/PaintedArt.ts';
import { ParticleField, ParticlePresets } from '../engine/Particles.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory, SceneRigName } from './types.ts';
import type { SceneSlots } from './index.ts';
import { AirshipRangeDirector, attachAirshipRange } from './evrae-airship-director.ts';
import { DECK, EVRAE_WORLD_HEIGHT, RANGE_STAGING, type RigNumbers } from './evrae-airship-range.ts';
import { buildAirshipDeck } from './evrae-airship-sky.ts';
import { applyDaylightFill, EVRAE_DAYLIGHT, showPlateAsPainted } from './evrae-airship-daylight.ts';

// ---------------------------------------------------------------------------
// The Fahrenheit's foredeck, on the approach to Bevelle (FFX)
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. Evrae, Cid's airship and the range
// mechanic are `research/ffx-evrae-airship.md`'s own encounter; nothing here is
// FFX-2's. The shared plumbing it leans on (the `userData` channel) is the
// pattern `StageArrivals.ts` already set.
//
// INTEGRATOR TODO (one line each, this track does not edit shared registries):
// `src/scenes/index.ts`: `'evrae-airship-deck': buildEvraeAirshipDeckScene` in
// SCENE_FACTORIES and a SCENES entry with `slots: EVRAE_AIRSHIP_DECK_SLOTS`;
// `src/debug/api.ts`: `app.register('scene-evrae-airship-deck', () => new
// EvraeAirshipSceneScreen())` from `./evrae-airship-debug.ts`. The presenter
// and HUD hooks are in docs/handoff/chapter-evrae-scene.md §6.
//
// THE PAINTING. `public/art/backdrops/evrae-airship-deck.png` (2688x1536,
// CANDIDATE, from Bailey's pick backdrop B: "looking up at the hull from the
// rail") is a sky plate: the hull fills the upper left, bright cloud the lower
// left and the right, and the rail it was painted from runs diagonally across
// the bottom (row 0.93 at the left edge to 0.57 at the right, 11.6 degrees in
// pixels). There is no deck in it to stand on. So the deck and the rail are
// geometry (`evrae-airship-sky.ts`, §12.3's "hard-edged metal platform ...
// with a railing and then nothing"), and the painting stands far out (z -45,
// 90 wide), **rolled 11.6 degrees** about its own centre so its rail lies level,
// with the rail's top edge (y -8.0 after the roll) below where the deck's far
// edge crosses the plane at every rig (y -5.1 NEAR, -6.5 FAR, -6.0 intro). The painted rail
// stays hidden behind our deck and the painting reads as the sky past our own
// rail, down to the bright cloud under the hull. Measured in
// docs/handoff/chapter-evrae-scene.md §2.

/** The camera the parallax stack is solved for: NEAR's `idle`. */
const CAMERA_REF = RANGE_STAGING.near.rigs.idle.position;

/**
 * Painting plane: 90 wide at z -45 (H 51.43), centre y 3.0, rolled -11.6 degrees
 * (`roll`, radians) about its centre so the painted rail is level. The rail's
 * centre line then sits at centre - 12.6 = y -9.6, its top edge about y -8.0.
 */
const BACKDROP = { width: 90, distance: -45, centreY: 3.0, roll: -0.2025 } as const;

const rig = (r: RigNumbers): CameraRig => ({
  position: [...r.position],
  lookAt: [...r.lookAt],
  fov: r.fov,
  ...(r.sway !== undefined ? { sway: r.sway } : {}),
});

/**
 * FFX framing (fov 32-36, as chapters 1 to 3), but low: the painting is an
 * upward view and the fight is a deck under a sky. `idle`, `action` and `enemy`
 * are NEAR's; the range director swaps in FAR's under the same names
 * (`evrae-airship-range.ts` RANGE_STAGING). The `-far` copies are there for the
 * debug screen's `rig:` beat and the projection test.
 */
const RIGS: Record<SceneRigName, CameraRig> & Record<string, CameraRig> = {
  /** Over the party's shoulder from the bridge, the sky ahead (§12.3 money shot 1). */
  intro: { position: [-2.6, 2.1, 12.2], lookAt: [0.6, 1.9, -8.0], fov: 36, sway: 1.3 },
  idle: rig(RANGE_STAGING.near.rigs.idle),
  action: rig(RANGE_STAGING.near.rigs.action),
  enemy: rig(RANGE_STAGING.near.rigs.enemy),
  /**
   * `party` and `victory` frame the R13-04 arc (option B): from left of it, so
   * Wakka at the rail reads left of Tidus instead of behind him, with the
   * three spread across 0.36..0.69 of the frame (live's arc under live's rigs:
   * 0.31..0.72). Were [-1.2, 1.6, 7.4] -> [-2.6, 1.2, 0.4] and
   * [-1.6, 1.7, 7.6] -> [-2.6, 1.3, 0.6], aimed at the old arc's centre.
   */
  party: { position: [-0.45, 1.6, 6.75], lookAt: [0.25, 1.2, 0], fov: 32, sway: 0.7 },
  victory: { position: [-0.4, 1.7, 6.95], lookAt: [0.35, 1.3, 0.2], fov: 32, sway: 1.2 },
  'idle-far': rig(RANGE_STAGING.far.rigs.idle),
  'action-far': rig(RANGE_STAGING.far.rigs.action),
  'enemy-far': rig(RANGE_STAGING.far.rigs.enemy),
};

/**
 * Party, then four reserve spots off frame-left. Order is the build's
 * `activeSlots` (`src/data/ffx/builds/fahrenheit.ts`): Tidus, Wakka, Rikku.
 *
 * R13-04 (Bailey picked option B on 2026-09-25, "I'll go with all your
 * recommendations"; `docs/concepts/layout/r13-04-evrae/`): the D-041 recipe
 * (Chapters 1 and 3, `docs/concepts/layout/pr-0002/`) on the deck. The whole
 * arc is re-laid right of the FFX command stack's footprint, which hid Tidus
 * at NEAR (0.23 of him in frame) and Wakka at FAR (0.14). Evrae holds the
 * space right of that, so the back row stands at the rail instead, 0.2 to 0.4
 * in front of its line (edge z -2.7): Tidus front-centre, Wakka back-left,
 * Rikku back-right. Tidus stands 0.15 right of the sheet's [0.1, 0, 0.9]: there
 * he covered Wakka's right edge at FAR (0.93 of Wakka clear at 2000x1012; 1.00
 * now). The approved stack is untouched, and the deck holds the
 * arc ({@link EVRAE_AIRSHIP_DECK_STAGING}). Staging, not game data.
 */
const PARTY_SLOTS: Array<[number, number, number]> = [
  [0.25, 0, 0.9],
  [-0.95, 0, -2.5],
  [2.2, 0, -2.3],
  [-11.6, 0, 2.6],
  [-12.5, 0, 1.0],
  [-13.4, 0, -0.6],
  [-14.3, 0, -2.2],
];

/**
 * Enemy slots, index = the formation's `slot` field
 * (`src/data/ffx/enemies/evrae.ts`): 0 Evrae (M1), 1 Cid.
 *
 * **Slot 0 is NEAR's spot**, beyond the rail and below the deck line, so the
 * deck edge hides its coils and only the head and forequarters rise over the
 * rail (§12.2: "At NEAR it is a head-and-claws threat ... jaw level with the
 * deck"; "It is longer than the frame"). FAR is the director's to apply.
 *
 * **Slot 1 repeats slot 0 on purpose.** Cid is on the enemy side only so he
 * gets a CTB row; he is "invisible in the real encounter" (options.json) and is
 * not a figure on the deck. A distinct mark would widen the formation lane
 * (`BattlePresenterStage.laneFrom` reads every slot) and pull Evrae off its
 * spot; the stage should not draw him at all (handoff §7 finding F-1).
 */
const ENEMY_SLOTS: Array<[number, number, number]> = [
  [...RANGE_STAGING.near.evrae],
  [...RANGE_STAGING.near.evrae],
];

/** Index of each combatant's slot in {@link EVRAE_AIRSHIP_DECK_SLOTS}.enemy. */
export const EVRAE_ENEMY_SLOT = { evrae: 0, cid: 1 } as const;

/**
 * World heights. Evrae's is the stage's boss height (no source gives a size,
 * `EVRAE_WORLD_HEIGHT`). The party heights are Chapter 1's
 * (`GAGAZET_ACTOR_HEIGHTS`), Wakka's and Rikku's from the other FFX scenes.
 */
export const EVRAE_AIRSHIP_ACTOR_HEIGHTS = {
  tidus: 1.75,
  wakka: 1.85,
  rikku: 1.6,
  evrae: EVRAE_WORLD_HEIGHT,
} as const;

/** R13-03 (FFX only): the party held on its slots. Evrae is re-planted on its range spot by the director, so the shared relax step moved only the party, by a different amount each run. */
const EVRAE_AIRSHIP_DECK_STAGING = { holdParty: true } as const;

/** The published slots, same shape every other scene exports. */
export const EVRAE_AIRSHIP_DECK_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.slice(0, 3).map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: EVRAE_AIRSHIP_ACTOR_HEIGHTS.tidus,
  enemyHeight: EVRAE_AIRSHIP_ACTOR_HEIGHTS.evrae,
  ...EVRAE_AIRSHIP_DECK_STAGING,
};

/** Every rig, exported for the projection test. */
export const EVRAE_AIRSHIP_DECK_RIGS: Readonly<Record<string, CameraRig>> = RIGS;

/** The backdrop plane's geometry, exported for the framing test. */
export const EVRAE_AIRSHIP_DECK_BACKDROP = BACKDROP;

/**
 * High altitude, full daylight: "cold and reptilian against a warm sky"
 * (§12.2), graded to B, Bailey's approved plate. The plate itself is shown as
 * painted (`evrae-airship-daylight.ts`), so the grade stays close to neutral:
 * no warm gain (it pushed B's cloud tops to salmon), a light steel shadow tint
 * so the deck and Evrae's teal stay cold, a soft vignette, and a bloom
 * threshold above B's brightest cloud (0.93 of white) so the sky does not glow.
 */
export const EVRAE_AIRSHIP_DECK_PALETTE: ScenePalette = {
  name: 'evrae-airship-deck',
  lift: [0.004, 0.006, 0.012],
  gamma: [1.0, 1.0, 1.0],
  gain: [1.0, 1.0, 1.01],
  saturation: 1.0,
  vignette: 0.26,
  vignetteRadius: 0.72,
  shadowTint: [0.34, 0.46, 0.66],
  shadowTintAmount: 0.08,
  grain: 0.02,
  exposure: 1.0,
  bloomThreshold: 0.95,
  bloomStrength: 0.32,
  bloomRadius: 0.5,
  tiltFocus: 0.5,
  tiltBandWidth: 0.26,
  tiltMaxBlur: 2.6,
};

/** **The Fahrenheit's foredeck**, as a {@link SceneFactory}. Owns no actors (`docs/ENGINE-API.md#scene-builder-contract`). */
export const buildEvraeAirshipDeckScene: SceneFactory = async (
  opts: SceneBuildOptions = {},
): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:evrae-airship-deck';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? [...CAMERA_REF];
  const url = artUrl('art/backdrops/evrae-airship-deck.png');

  const backdropOptions = {
    url,
    width: BACKDROP.width,
    distance: BACKDROP.distance,
    centreY: BACKDROP.centreY,
    cameraRef,
    /**
     * No masked parallax bands: a band is the plane scaled toward `cameraRef`,
     * and the roll would pull it out of register. The air in front of the
     * painting moves instead (`buildAirshipDeck`'s cloud layers).
     */
    layers: [],
    /** `key` is the sunburst off the hull's stern, `horizon` the cloud band, `ground` the sea of cloud under the rail. */
    sampleBands: {
      sky: [0.02, 0.2],
      horizon: [0.42, 0.56],
      ground: [0.8, 0.96],
      key: [0.3, 0.44],
    },
    // The deck is geometry (`buildAirshipDeck`); the painting has no floor.
    ground: false,
    fog: { near: 40, far: 150, colorMix: 0.12 },
    fogPlanes: false,
    background: EVRAE_DAYLIGHT.background,
  } satisfies BackdropOptions;

  // The roll: a pivot at the painting's centre, so the plane turns in place.
  const skyPivot = new Group();
  skyPivot.name = 'sky-roll';
  skyPivot.position.set(0, BACKDROP.centreY, BACKDROP.distance);
  skyPivot.rotation.z = BACKDROP.roll;
  const skyInner = new Group();
  skyInner.position.set(0, -BACKDROP.centreY, -BACKDROP.distance);
  skyPivot.add(skyInner);
  group.add(skyPivot);

  let backdrop = await Backdrop.create(backdropOptions);
  backdrop.applyTo(skyInner);
  // B's own pixels, not a dusk grade of them (`evrae-airship-daylight.ts`).
  showPlateAsPainted(skyInner);

  const deck = buildAirshipDeck({ low });
  group.add(deck.group);

  const lights = new LightRig({
    palette: backdrop.palette,
    // The sun is off-frame upper right (§12.3: "the sun off-frame so the deck
    // can take a hard key"); the director re-colours the key per range.
    keyFrom: [6.5, 9.0, 3.0],
    keyIntensity: RANGE_STAGING.near.key.intensity,
    rimFrom: [-4.0, 4.5, -9.0],
    rimColor: 0xcfe4ff,
    rimIntensity: 0.9,
    fillIntensity: 0.85,
    ambientIntensity: RANGE_STAGING.near.ambient,
    luma: { key: 0.85, fill: 0.62, rim: 0.9, ambient: 0.55 },
    shadows: low ? false : { mapSize: 1024, area: 14, radius: 3.0, bias: -0.0012 },
  });
  applyDaylightFill(lights);
  group.add(lights.group);

  // Wind-borne grit crossing the deck: "Wind: constant" (§12.3). Driven at the
  // ship's speed, so it too answers a manoeuvre.
  const grit = new ParticleField(
    ParticlePresets.snow({
      count: Math.round((low ? 40 : 90) * 1),
      bounds: { x: 14, y: 4, z: 9 },
      colors: [0xffffff, 0xe6f0ff],
      size: 2.0,
      drift: [-2.6, -0.05, 0],
      wobble: [0.1, 0.12, 0.1],
      wobbleSpeed: 0.6,
      twinkle: 0.3,
      opacity: 0.4,
      additive: true,
      gravity: 0,
    }),
  );
  grit.position.set(0, 2.0, 1.0);
  const particles = [grit];
  group.add(grit);

  const pools = PARTY_SLOTS.slice(0, 3).map((s) => {
    const pool = makeLightPool({ color: 0xffe2b8, radius: 0.95, opacity: 0.12 });
    pool.position.set(s[0], 0.02, s[2]);
    group.add(pool);
    return pool;
  });

  const director = new AirshipRangeDirector(deck, lights);
  attachAirshipRange(group, director);

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
        showPlateAsPainted(skyInner);
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
    ...EVRAE_AIRSHIP_DECK_STAGING,
    palette: { ...EVRAE_AIRSHIP_DECK_PALETTE },
    update(dt: number): void {
      backdrop.update(dt);
      lights.update(dt);
      deck.update(dt);
      director.update(dt);
      grit.update(dt * deck.wind);
    },
    dispose(): void {
      watcher?.stop();
      director.dispose();
      for (const p of particles) p.dispose();
      for (const p of pools) {
        p.geometry.dispose();
        (p.material as { dispose(): void }).dispose();
      }
      deck.dispose();
      lights.dispose();
      backdrop.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
};

/** The deck's far edge, for the test that keeps the painted rail behind it. */
export const EVRAE_AIRSHIP_DECK_EDGE = DECK;
