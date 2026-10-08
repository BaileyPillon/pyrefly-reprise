import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool, type LightRigOptions } from '../engine/Lighting.ts';
import { artUrl, watchAssets, type AssetWatcher } from '../engine/PaintedArt.ts';
import { ParticleField, ParticlePresets } from '../engine/Particles.ts';
import { ScenePalettes } from '../engine/ScenePalettes.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import type {
  SceneBuild,
  SceneBuildOptions,
  SceneFactory,
  SceneRigName,
} from './types.ts';
import type { SceneSlots } from './index.ts';
import {
  LEBLANC_ENEMY_LANE_X,
  LEBLANC_ENEMY_SLOTS,
  LEBLANC_ENEMY_SPOTS,
  LEBLANC_FIGURE_HEIGHTS,
  LEBLANC_PARTY_HEIGHT,
  LEBLANC_TRIO_POOL,
} from './leblanc-staging.ts';

// The staging numbers (heights, spots, lane, pool) live in `./leblanc-staging.ts`; Chapter VI's tests read them from here.
export { LEBLANC_ENEMY_LANE_X, LEBLANC_ENEMY_SPOTS, LEBLANC_FIGURE_HEIGHTS };

// ---------------------------------------------------------------------------
// Chateau Leblanc — the Last Room (FFX-2 Ch.2, "Faking and Entering", Act III)
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only [AGENTS.md rule 14]. Nothing here exists in FFX; the
// Leblanc Syndicate is `research/ffx2-leblanc-syndicate.md`'s own chapter.
//
// The painting (`public/art/backdrops/leblanc-last-room.png`, 2688x1536, see
// its sidecar) is a **symmetric front-on composition**: a single ornate door
// dead-centre with a glowing magenta heart-shaped inlay above it, flanked by
// tall crate towers, cool cyan door-light and warm amber floor-light meeting
// at a soft seam roughly halfway down the frame. Unlike Gagazet or Bevelle it
// has no off-axis vanishing point to solve the camera against — but the FFX-2
// battle framing (party lower-left arc, trio right-of-centre and back) is kept
// anyway, per house rule 9's "camera and depth layering consistent with the
// other FFX-2 chapters": Bevelle Underground and Heart of the Farplane both
// stage an off-axis fight in front of a symmetric or wide backdrop, and a
// player who has cleared either chapter should not have to relearn the frame
// here.
//
// Picked target (`docs/target/targets.json` "The Leblanc Syndicate (FFX-2)",
// `docs/target/decisions.json` D-018): backdrop **C** (mixed magenta/cyan,
// visible door, heart panel — production re-rendered it stronger, which is
// the file this scene reads), Leblanc pose **B** (fan fully open, warm
// magenta), Ormi **A** re-rendered heavier, Logos **C** re-rendered with a
// plainer helmet. The enemy formation itself — Leblanc centre-back, Ormi and
// Logos flanking — is this track's own presentation call (not sourced; the
// research and the concept round fix costumes and poses, not battle-stage
// geometry), following `src/data/ffx2/enemies/leblanc-syndicate.ts`'s slot
// order (0 Leblanc, 1 Logos, 2 Ormi).

/**
 * The camera the parallax stack and the backdrop framing are solved for —
 * identical to the `idle` rig's position. See "Framing the backdrop" in
 * `docs/ENGINE-API.md`.
 */
const CAMERA_REF: [number, number, number] = [0, 2.8, 9.4];

const BACKDROP = { width: 74, distance: -47, centreY: -1.9 } as const;

/**
 * FFX-2 framing: fov 30-34, party lower-left, trio right-of-centre and back.
 * Only the four rigs the contract requires — nothing in `ffx2-leblanc.ts`'s
 * `midScripts` or `pre`/`post` names a bespoke rig (unlike Bevelle's
 * `bahamut` money shot), so none is authored here.
 */
export const LEBLANC_LAST_ROOM_RIGS: Record<SceneRigName, CameraRig> & Record<string, CameraRig> = {
  /** The ambush's establishing shot: wide and a little high, door and trio both readable before the fight starts. */
  intro: { position: [0.3, 4.4, 14.6], lookAt: [0.9, 2.1, -3.4], fov: 30, sway: 1.4 },
  idle: { position: CAMERA_REF, lookAt: [0.55, 1.55, -1.35], fov: 32 },
  action: { position: [0.2, 2.55, 8.9], lookAt: [1.05, 1.5, -1.15], fov: 32, sway: 0.7 },
  victory: { position: [0.35, 2.15, 8.4], lookAt: [-0.55, 1.4, 0.85], fov: 32, sway: 1.2 },
};

/**
 * Three active slots in the FFX-2 arc, then four reserve slots parked off
 * frame-left. Carried over from `bevelle-underground.ts`'s HUD-safe-area-
 * measured arc rather than re-derived from scratch: that scene's camera
 * geometry (`CAMERA_REF` height 3.0 vs this scene's 2.8, both ~9.5 back) is
 * close enough that the same arc reads correctly here, and it was re-checked
 * against this scene's own idle/action rigs in the one browser pass this
 * track ran (`docs/handoff/chapter-leblanc-scene.md`).
 *
 * Slot order is the build's `members` order (`src/data/ffx2/builds/chateau.ts`
 * numbers them 0,1,2): Yuna, Rikku, Paine — left to right.
 */
const PARTY_SLOTS: Array<[number, number, number]> = [
  [-2.05, 0, 1.45], // front-left (Yuna)
  [-1.3, 0, 0.1], // middle, stepped right and back (Rikku)
  [-0.9, 0, -1.5], // back-right (Paine)
  // reserve — outside every rig's frustum
  [-12.0, 0, 2.6],
  [-12.9, 0, 1.0],
  [-13.8, 0, -0.6],
  [-14.7, 0, -2.2],
];

/**
 * The trio's enemy slot table, in `leblanc-syndicate.ts`'s slot order (0 Leblanc, 1 Logos, 2 Ormi): Leblanc centre-back with Ormi and Logos flanking
 * her, as the first design had it and as 39.4 stood them. The whole staging, act by act, with the numbers and the reasons, is `./leblanc-staging.ts`:
 * every fiend of the three acts has a spot there, so these slots are the table the stage reads the lane's depth from and a fiend added later would start from.
 */
const ENEMY_SLOTS: Array<[number, number, number]> = LEBLANC_ENEMY_SLOTS.map((s) => [...s] as [number, number, number]);

/**
 * Canonical world heights for the cast that fights here. The girls' are presentation estimates (Yuna's stands for all three: the stage gives the party one
 * height); the three Syndicate bosses' are **sourced**: the girls' height times each model's ratio to the girls (`data/ffx2/syndicate-stature.ts`,
 * `research/ffx2-leblanc-syndicate.md` §20), which replaces the first estimates (Ormi 1.5 "short and stout", Logos 1.95) the models contradict.
 */
export const LEBLANC_LAST_ROOM_ACTOR_HEIGHTS: Readonly<Record<'yuna' | 'rikku' | 'paine' | 'leblanc' | 'logos' | 'ormi', number>> = {
  yuna: LEBLANC_PARTY_HEIGHT,
  rikku: 1.6,
  paine: 1.72,
  leblanc: LEBLANC_FIGURE_HEIGHTS['leblanc']!,
  logos: LEBLANC_FIGURE_HEIGHTS['logos']!,
  ormi: LEBLANC_FIGURE_HEIGHTS['ormi']!,
};

/**
 * The trio's paintings are ordinary `--composition full` standing figures
 * (`docs/concepts/chapters/leblanc/production.md`), not full-bleed auras like
 * Bahamut or Seymour Flux, so none of the enemy-actor aura defaults those two
 * scenes need apply here — the plain `PaintedActor` defaults are correct.
 */
export const LEBLANC_LAST_ROOM_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.slice(0, 3).map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.yuna,
  enemyHeight: LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.leblanc,
  enemyLaneX: LEBLANC_ENEMY_LANE_X,
  figureHeights: LEBLANC_FIGURE_HEIGHTS,
  enemySpots: LEBLANC_ENEMY_SPOTS,
};

/**
 * Which painting a Last Room draws, and the art namespace its figures come from (`src/data/art/artNamespace.ts`). Chapter VI's is
 * `{ key: 'leblanc-last-room' }` (no namespace: every id resolves as it always did); the experimental chapter's
 * (`./exp-leblanc-last-room.ts`) is its own plate and the `exp-leblanc` namespace.
 */
export interface LeblancPlate {
  readonly key: string;
  readonly artNamespace?: string;
  /** The room's light, grade and floor, for a plate painted differently from Chapter VI's. Absent: Chapter VI's, exactly as it always was. */
  readonly look?: LeblancPlateLook;
}

/** What a different plate changes about the room's look (each field replaces Chapter VI's value; the experimental chapter's is `./exp-leblanc-last-room.ts`). */
export interface LeblancPlateLook {
  /** The grade (`ScenePalettes`). */
  readonly palette?: ScenePalette;
  /** The 3D floor: Chapter VI's is a tinted plane that fades out; a plate with a floor worth showing takes `{ shadowOnly: true }`. */
  readonly ground?: BackdropOptions['ground'];
  readonly fog?: BackdropOptions['fog'];
  readonly fogPlanes?: BackdropOptions['fogPlanes'];
  /** The flat colour behind the plate, which a held shot (a push-in past the plate's edge) can show; Chapter VI's is a near-black violet. */
  readonly background?: number;
  /** Light-rig fields over the room's own (key, rim, fill and ambient strength, the rim colour). */
  readonly lights?: Partial<Omit<LightRigOptions, 'palette'>>;
  /** The floor pools under the party (one each) and under the trio (one shared). */
  readonly pools?: { readonly party?: { readonly color: number; readonly opacity: number }; readonly trio?: { readonly color: number; readonly opacity: number } };
  /** The dust in the air. */
  readonly dust?: { readonly colors: number[]; readonly opacity: number };
}

const BASE_PLATE: LeblancPlate = { key: 'leblanc-last-room' };

/**
 * **Heart of the Syndicate**, as a {@link SceneFactory}. Owns no actors — see
 * `docs/ENGINE-API.md#scene-builder-contract`.
 */
export const buildLeblancLastRoomScene: SceneFactory = (opts: SceneBuildOptions = {}): Promise<SceneBuild> => buildLastRoom(BASE_PLATE, opts);

/** The same room (rigs, slots, lights, particles) over another plate and art namespace. Game case: FFX-2 only. */
export function makeLeblancLastRoomScene(plate: LeblancPlate): SceneFactory {
  return (opts: SceneBuildOptions = {}): Promise<SceneBuild> => buildLastRoom(plate, opts);
}

async function buildLastRoom(plate: LeblancPlate, opts: SceneBuildOptions): Promise<SceneBuild> {
  const group = new Group();
  group.name = `scene:${plate.key}`;
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? CAMERA_REF;
  const look = plate.look ?? {}; // Chapter VI's room has none: every field below falls back to what it always was

  // ---------------------------------------------------------------- backdrop
  const url = artUrl(`art/backdrops/${plate.key}.png`);

  const backdropOptions = {
    url,
    width: BACKDROP.width,
    distance: BACKDROP.distance,
    centreY: BACKDROP.centreY,
    cameraRef,
    /**
     * Two masked bands: the crate towers and door (0.22-0.62, the strongest
     * parallax lines — the crate edges converge toward the door) and the floor
     * seam where warm amber meets the dark tile (0.72-0.96).
     */
    layers: low
      ? [{ from: 0.6, to: 0.94, feather: 0.1, featherBottom: 0.06, z: -18, opacity: 0.55 }]
      : [
          { from: 0.22, to: 0.62, feather: 0.1, featherBottom: 0.08, z: -30, opacity: 0.55 },
          { from: 0.6, to: 0.94, feather: 0.1, featherBottom: 0.06, z: -18, opacity: 0.58 },
        ],
    /**
     * `key` is the heart's own glow — the one light source the picture
     * actually contains — so the 3D key light inherits its magenta hue rather
     * than a generic warm white. `horizon` is the seam where the cyan door
     * light and the amber floor light meet, `ground` the amber floor itself.
     */
    sampleBands: {
      sky: [0.0, 0.08],
      horizon: [0.46, 0.56],
      ground: [0.85, 0.97],
      key: [0.08, 0.3],
    },
    // The painting already carries its own amber floor light; the 3D ground is
    // only there to catch the actors' shadows and dissolve into it.
    ground: look.ground ?? {
      size: 42,
      repeat: 4,
      tintMix: 0.1,
      luma: 0.5,
      fade: true,
      fadeCore: 0.06,
      center: [0, -1.6] as [number, number],
    },
    fog: look.fog ?? { near: 15, far: 44, colorMix: 0.22 },
    fogPlanes: look.fogPlanes ?? [
      { z: -26, y: 3.2, width: 60, height: 16, opacity: 0.14, speed: 0.008 },
      { z: -14, y: 1.6, width: 36, height: 8, opacity: 0.1, speed: 0.02, additive: true },
    ],
    background: look.background ?? 0x160f24,
  } satisfies BackdropOptions;

  let backdrop = await Backdrop.create(backdropOptions);
  backdrop.applyTo(group);

  // ------------------------------------------------------------------ lights
  const lights = new LightRig({
    palette: backdrop.palette,
    // From above and slightly behind the heart, where the glow actually is.
    keyFrom: [0.2, 7.6, -6.0],
    keyIntensity: 1.1,
    // The cyan door slits, roughly at the party's eye line.
    rimFrom: [-3.2, 2.4, 2.0],
    rimColor: 0x8fe8ff,
    rimIntensity: 0.85,
    fillIntensity: 0.95,
    ambientIntensity: 0.62,
    luma: { key: 0.82, fill: 0.62, rim: 0.86, ambient: 0.52 },
    shadows: low ? false : { mapSize: 1024, area: 14, radius: 3.4, bias: -0.0013 },
    ...(look.lights ?? {}),
  });
  group.add(lights.group);

  // --------------------------------------------------------------- particles
  const k = low ? 0.5 : 1;

  // D-225 (Bailey, 2026-09-26; FFX-2 only): no glow motes here. The room is
  // an interior, "Indoor dust at most. No pyreflies." (research/ffx-vs-ffx2-
  // presentation.md §8, Chateau Leblanc); the magenta and cyan motes that
  // stood in for the neon signage are gone. The warm dust stays.

  /** Fine warm dust hanging in the floor's light shaft — non-additive, so it reads as motes in air rather than as more glow. */
  const dust = new ParticleField(
    ParticlePresets.snow({
      count: Math.round(90 * k),
      bounds: { x: 6, y: 3, z: 5 },
      colors: look.dust?.colors ?? [0xffd9a8, 0xffe9c8, 0xffffff],
      size: 2.6,
      drift: [0.02, -0.06, 0],
      wobble: [0.2, 0.08, 0.16],
      wobbleSpeed: 0.4,
      twinkle: 0.15,
      opacity: look.dust?.opacity ?? 0.35,
      additive: false,
      hardness: 0.5,
      gravity: 0,
    }),
  );
  dust.position.set(0, 1.2, 1.0);

  const particles = [dust];
  for (const p of particles) group.add(p);

  // ------------------------------------------------------------- light pools
  const pools = [
    ...PARTY_SLOTS.slice(0, 3).map((s) => {
      const pool = makeLightPool({ color: look.pools?.party?.color ?? 0xffcf9e, radius: 1.05, opacity: look.pools?.party?.opacity ?? 0.15 });
      pool.position.set(s[0], 0.02, s[2]);
      return pool;
    }),
    (() => {
      // One shared magenta pool under the trio, in the middle of the fiends'
      // spots (`LEBLANC_TRIO_POOL`) — the picture's own floor spotlight is already there.
      const pool = makeLightPool({ color: look.pools?.trio?.color ?? 0xff8fd6, radius: 3.1, opacity: look.pools?.trio?.opacity ?? 0.2 });
      pool.position.set(LEBLANC_TRIO_POOL[0], 0.018, LEBLANC_TRIO_POOL[1]);
      pool.name = 'trio-pool';
      return pool;
    })(),
  ];
  for (const p of pools) group.add(p);
  const trioPool = pools[pools.length - 1]!;

  // ----------------------------------------------------------- dev hot-swap
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

  // -------------------------------------------------------------------- loop
  let clock = 0;
  const build: SceneBuild = {
    group,
    get backdrop(): Backdrop {
      return backdrop;
    },
    lights,
    particles,
    rigs: LEBLANC_LAST_ROOM_RIGS,
    partySlots: PARTY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    enemySlots: ENEMY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    // PR-0093: the trio is human-sized, not a boss the scale of Bahamut or
    // Vegnagun's tail, so it must not stage at the 4.1-unit Gagazet-boss fallback
    // (`fromSceneBuild` in `src/scenes/index.ts`). `enemyHeight` is the stage's
    // default for a fiend with no height of its own, and Leblanc's own height
    // stands in for it; every Syndicate fiend has one below (`figureHeights`),
    // so the default only sizes a fiend's ring and shadow against it.
    partyHeight: LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.yuna,
    enemyHeight: LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.leblanc,
    enemyLaneX: LEBLANC_ENEMY_LANE_X,
    // Every Syndicate fiend stands at its real height (39.4.1's table) and at the spot it stood at in 39.4 (`./leblanc-staging.ts`).
    figureHeights: LEBLANC_FIGURE_HEIGHTS,
    enemySpots: LEBLANC_ENEMY_SPOTS,
    ...(plate.artNamespace ? { artNamespace: plate.artNamespace } : {}),
    palette: {
      ...(look.palette ?? ScenePalettes.chateauLeblanc),
    } satisfies ScenePalette,
    update(dt: number): void {
      clock += dt;
      backdrop.update(dt);
      lights.update(dt);
      for (const p of particles) p.update(dt);
      // The heart's own glow breathes, very slowly — the picture's light
      // source living, not a static painting behind live figures.
      const pulse = 0.86 + Math.sin(clock * 0.55) * 0.14;
      (trioPool.material as { opacity: number }).opacity = 0.18 + pulse * 0.05;
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
  return build;
}
