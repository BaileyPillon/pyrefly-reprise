import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
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
const RIGS: Record<SceneRigName, CameraRig> & Record<string, CameraRig> = {
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
 * The trio: Leblanc centre-back, Ormi and Logos flanking (see the class doc
 * above). Slot **index** matches `leblanc-syndicate.ts`'s `slot` field
 * (0 Leblanc, 1 Logos, 2 Ormi) so a formation built from that file's
 * `EnemyGroupDef` lands its members on the geometry their canon size implies.
 *
 * **Solved against the HUD safe area** (`docs/ENGINE-API.md#hud-safe-area`;
 * the FFX-2 rail is 0.72 of the canvas). These three are human-sized, not a
 * boss the scale of Bahamut or Vegnagun's tail, so all three sit closer to
 * camera than either chapter's single boss slot — checked at `idle`/`action`
 * in the browser pass this track ran and adjusted once (Logos moved 0.4 units
 * left) when his silhouette crossed the rail; see the handoff for the numbers.
 */
const ENEMY_SLOTS: Array<[number, number, number]> = [
  [1.1, 0, -5.0], // Leblanc — centre-back, the fight's focal point
  [2.2, 0, -6.2], // Logos — tall and slim, flanks right and further back
  [-0.3, 0, -3.8], // Ormi — short and stout, flanks left and closer to camera
];

/** Canonical world heights for the cast that fights here (presentation estimates, not sourced game data — see AGENTS.md rule 6; the stat block in `leblanc-syndicate.ts` carries no physical height). */
export const LEBLANC_LAST_ROOM_ACTOR_HEIGHTS = {
  yuna: 1.68,
  rikku: 1.6,
  paine: 1.72,
  leblanc: 1.66,
  /** "Tall and slim" [options.json cast_logos]. */
  logos: 1.95,
  /** "Short and stout" [options.json cast_ormi]. */
  ormi: 1.5,
} as const;

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
};

/**
 * **Heart of the Syndicate**, as a {@link SceneFactory}. Owns no actors — see
 * `docs/ENGINE-API.md#scene-builder-contract`.
 */
export const buildLeblancLastRoomScene: SceneFactory = async (
  opts: SceneBuildOptions = {},
): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:leblanc-last-room';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? CAMERA_REF;

  // ---------------------------------------------------------------- backdrop
  const url = artUrl('art/backdrops/leblanc-last-room.png');

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
    ground: {
      size: 42,
      repeat: 4,
      tintMix: 0.1,
      luma: 0.5,
      fade: true,
      fadeCore: 0.06,
      center: [0, -1.6] as [number, number],
    },
    fog: { near: 15, far: 44, colorMix: 0.22 },
    fogPlanes: [
      { z: -26, y: 3.2, width: 60, height: 16, opacity: 0.14, speed: 0.008 },
      { z: -14, y: 1.6, width: 36, height: 8, opacity: 0.1, speed: 0.02, additive: true },
    ],
    background: 0x160f24,
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
  });
  group.add(lights.group);

  // --------------------------------------------------------------- particles
  const k = low ? 0.5 : 1;

  /** Drifting Syndicate glow — magenta and cyan motes standing in for the neon signage and the terminal screens. */
  const glowMotes = new ParticleField(
    ParticlePresets.pyreflies({
      count: Math.round(120 * k),
      bounds: { x: 9, y: 4.2, z: 6 },
      colors: [0xff8fd6, 0xffffff, 0x9de8ff, 0xe7a8ff],
      size: 6.4,
      drift: [0.03, 0.28, 0],
      wobble: [0.4, 0.14, 0.26],
      twinkle: 0.85,
      opacity: 0.85,
    }),
  );
  glowMotes.position.set(0.4, 1.8, -2.4);

  /** Fine warm dust hanging in the floor's light shaft — non-additive, so it reads as motes in air rather than as more glow. */
  const dust = new ParticleField(
    ParticlePresets.snow({
      count: Math.round(90 * k),
      bounds: { x: 6, y: 3, z: 5 },
      colors: [0xffd9a8, 0xffe9c8, 0xffffff],
      size: 2.6,
      drift: [0.02, -0.06, 0],
      wobble: [0.2, 0.08, 0.16],
      wobbleSpeed: 0.4,
      twinkle: 0.15,
      opacity: 0.35,
      additive: false,
      hardness: 0.5,
      gravity: 0,
    }),
  );
  dust.position.set(0, 1.2, 1.0);

  const particles = [glowMotes, dust];
  for (const p of particles) group.add(p);

  // ------------------------------------------------------------- light pools
  const pools = [
    ...PARTY_SLOTS.slice(0, 3).map((s) => {
      const pool = makeLightPool({ color: 0xffcf9e, radius: 1.05, opacity: 0.15 });
      pool.position.set(s[0], 0.02, s[2]);
      return pool;
    }),
    (() => {
      // One shared magenta pool under the trio, centred on Leblanc's own
      // slot — the picture's own floor spotlight is already there.
      const pool = makeLightPool({ color: 0xff8fd6, radius: 3.1, opacity: 0.2 });
      const s = ENEMY_SLOTS[0]!;
      pool.position.set(s[0], 0.018, s[2] + 1.0);
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
    rigs: RIGS,
    partySlots: PARTY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    enemySlots: ENEMY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    // PR-0093: the trio is human-sized, not a boss the scale of Bahamut or
    // Vegnagun's tail (`LEBLANC_LAST_ROOM_SLOTS` above already documented this,
    // but nothing published it to `fromSceneBuild` in `src/scenes/index.ts`,
    // which staged every enemy here at the 4.1-unit Gagazet-boss fallback —
    // "short and stout" Ormi included). Leblanc's own sourced height stands in
    // for the enemy side the same way it already does in `LEBLANC_LAST_ROOM_SLOTS`;
    // a single scalar cannot give Ormi and Logos their own distinct heights
    // (every Syndicate member is `isBoss`, so `worldHeightFor` scales all three
    // off this one number) — that would need `BattlePresenterStage.ts` to read
    // a per-slot height table, which is out of this fix's scope.
    partyHeight: LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.yuna,
    enemyHeight: LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.leblanc,
    palette: {
      ...ScenePalettes.chateauLeblanc,
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
};
