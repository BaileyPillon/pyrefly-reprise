import { Group, Scene, Vector3, type PerspectiveCamera } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import { BattleCamera, type CameraRig } from '../engine/BattleCamera.ts';
import { makeRock } from '../engine/Diorama.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { PaintedActor } from '../engine/PaintedActor.ts';
import {
  artUrl,
  characterUrl,
  normaliseLuma,
  PaintedArt,
  watchAssets,
  type AssetWatcher,
} from '../engine/PaintedArt.ts';
import { ParticleField, ParticlePresets } from '../engine/Particles.ts';
import { paintBossSilhouette } from '../engine/ProceduralArt.ts';
import { ScenePalettes } from '../engine/ScenePalettes.ts';
import { HitEffects } from '../engine/VFX.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import {
  mountScene,
  type SceneBuild,
  type SceneBuildOptions,
  type SceneFactory,
  type SceneRigName,
} from './types.ts';

// ---------------------------------------------------------------------------
// Framing constants
// ---------------------------------------------------------------------------

/**
 * The camera the parallax stack and the backdrop framing are solved for.
 * Identical to the `idle` rig's position; see "Framing the backdrop" in
 * `docs/ENGINE-API.md`.
 */
const CAMERA_REF: [number, number, number] = [0, 2.95, 9.4];

/**
 * FFX battle framing: a long-ish lens (fov 32, inside the 30–34 band the art
 * direction fixes), slight elevation, the party in a shallow left-facing arc in
 * the lower left, the boss right of centre and further back.
 */
const RIGS: Record<SceneRigName, CameraRig> & Record<string, CameraRig> = {
  intro: { position: [-2.4, 4.6, 12.2], lookAt: [1.1, 2.1, -2.6], fov: 30, sway: 1.4 },
  idle: { position: CAMERA_REF, lookAt: [0.55, 1.3, -1.1], fov: 32 },
  // Far enough back that the attacker (mid-lunge, ~x 0.3) and the boss (x 3.05)
  // are both inside the frame; an action rig that only frames the target turns
  // every attack beat into a shot of the target.
  action: { position: [0.1, 2.72, 9.1], lookAt: [1.25, 1.4, -1.0], fov: 32, sway: 0.7 },
  party: { position: [-1.5, 2.15, 6.4], lookAt: [-2.9, 1.1, 0.5], fov: 32, sway: 0.7 },
  enemy: { position: [1.45, 2.6, 5.6], lookAt: [3.2, 1.7, -2.4], fov: 32, sway: 0.7 },
  victory: { position: [-1.35, 1.95, 6.7], lookAt: [-2.8, 1.15, 0.7], fov: 32, sway: 1.2 },
};

/** Three active slots in the FFX arc, then four reserve slots off frame-left. */
const PARTY_SLOTS: Array<[number, number, number]> = [
  // Shifted right of the FFX arc's natural centre so the command window
  // (bottom-left, 26% of the frame) never buries a character.
  [-1.45, 0, 1.4],
  [-2.8, 0, 0.2],
  [-0.9, 0, -1.05],
  // reserve — parked well outside the idle rig's frustum
  [-11.5, 0, 2.6],
  [-12.4, 0, 1.0],
  [-13.3, 0, -0.6],
  [-14.2, 0, -2.2],
];

const ENEMY_SLOTS: Array<[number, number, number]> = [
  [3.05, 0, -2.2],
  [5.4, 0, -0.9],
  [1.5, 0, -4.3],
];

/** Canonical world heights. A human is ~1.75; the boss looms at 2.6. */
export const ACTOR_HEIGHTS = {
  tidus: 1.75,
  yuna: 1.68,
  auron: 1.86,
  seymourFlux: 2.6,
} as const;

// ---------------------------------------------------------------------------
// The scene: Mt. Gagazet — the Prominence
// ---------------------------------------------------------------------------

/**
 * **Mt. Gagazet — the Prominence**, as a {@link SceneFactory}.
 *
 * A matte painting parallax stack behind a lit ground plane whose tint is
 * sampled from the painting's own bottom rows, mist sheets, two depth bands of
 * snow, drifting pyreflies, a light rig coloured from the painting, and the
 * Gagazet grade.
 *
 * It owns **no actors** — see `docs/ENGINE-API.md#scene-builder-contract`. The
 * demo screen below is what puts figures on {@link SceneBuild.partySlots}.
 */
export const buildGagazetScene: SceneFactory = async (
  opts: SceneBuildOptions = {},
): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:gagazet';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? CAMERA_REF;

  // ---------------------------------------------------------------- backdrop
  const url = artUrl('art/backdrops/gagazet.png');

  /**
   * Framing maths (see `docs/ENGINE-API.md`, "Framing the backdrop").
   *
   * The painting **fills the frame** at its own depth: with the idle rig the
   * visible height at z = -48 is 33.3 world units and the visible width 59.2,
   * so a 64-unit-wide plane centred on the view axis there (y = -6) covers the
   * frame with ~8% overshoot for the camera sway.
   *
   * The painting already contains its own snow valley, so the 3D ground is
   * **not** an opaque plane running to the horizon — that would bury the
   * painted landscape under flat geometry. It is a faded disc under the
   * fighters that catches their shadows and blends into the painted snow: its
   * tint is `normaliseLuma(palette.ground, 0.46)`, i.e. the painting's own
   * bottom-row hue re-exposed to a value that reads as lit snow, which is what
   * makes the seam disappear.
   */
  const backdropOptions = {
    url,
    // 92, not the ~64 that just covers the idle frame: the `party`, `action`
    // and `enemy` rigs swing the view axis far enough sideways that a plane
    // sized for `idle` runs out at the frame edge mid-cut. Sized for the
    // widest rig instead, and `scene.background` catches the rest.
    width: 92,
    distance: -48,
    centreY: -6,
    cameraRef,
    layers: low
      ? [{ from: 0.42, to: 0.9, feather: 0.1, featherBottom: 0.06, z: -18, opacity: 0.5 }]
      : [
          { from: 0.12, to: 0.58, feather: 0.09, featherBottom: 0.07, z: -30, opacity: 0.55 },
          { from: 0.42, to: 0.9, feather: 0.1, featherBottom: 0.06, z: -18, opacity: 0.5 },
        ],
    sampleBands: {
      sky: [0.02, 0.16],
      horizon: [0.56, 0.7],
      ground: [0.86, 1.0],
      key: [0.06, 0.18],
    },
    ground: {
      size: 74,
      repeat: 5,
      tintMix: 0.07,
      brightness: 1.0,
      luma: 0.47,
      fade: true,
      fadeCore: 0.06,
      center: [0, -3] as [number, number],
    },
    fog: { near: 20, far: 52, colorMix: 0.2 },
    fogPlanes: [
      { z: -26, y: 2.6, width: 62, height: 14, opacity: 0.22, speed: 0.008 },
      { z: -14, y: 1.6, width: 40, height: 9, opacity: 0.16, speed: 0.018 },
      { z: -6.5, y: 0.8, width: 26, height: 5.5, opacity: 0.12, speed: 0.034, additive: true },
    ],
  } satisfies BackdropOptions;

  let backdrop = await Backdrop.create(backdropOptions);
  backdrop.applyTo(group);

  // ------------------------------------------------------------------ lights
  const lights = new LightRig({
    palette: backdrop.palette,
    keyFrom: [-8.4, 5.2, -2.6],
    keyIntensity: 1.9,
    rimFrom: [7.2, 4.6, 5.2],
    rimIntensity: 0.9,
    fillIntensity: 0.9,
    ambientIntensity: 0.4,
    shadows: low ? false : { mapSize: 1024, area: 14, radius: 3.6, bias: -0.0014 },
  });
  group.add(lights.group);

  // --------------------------------------------------------------- particles
  const k = low ? 0.45 : 1;
  const snowFar = new ParticleField(
    ParticlePresets.snow({
      count: Math.round(620 * k),
      bounds: { x: 20, y: 9, z: 16 },
      size: 3.6,
      opacity: 0.5,
      drift: [-0.5, -0.5, 0],
    }),
  );
  snowFar.position.set(0, 4.4, -10);

  const snowNear = new ParticleField(
    ParticlePresets.snow({
      count: Math.round(300 * k),
      bounds: { x: 11, y: 5.5, z: 6 },
      size: 8.5,
      opacity: 0.4,
      drift: [-0.9, -0.95, 0],
      wobble: [0.7, 0.08, 0.4],
    }),
  );
  snowNear.position.set(0, 3.2, 2.2);

  const pyreflies = new ParticleField(
    ParticlePresets.pyreflies({
      count: Math.round(140 * k),
      bounds: { x: 7.5, y: 2.6, z: 4.5 },
      size: 8,
      opacity: 0.9,
    }),
  );
  pyreflies.position.set(0.4, 1.7, -1.4);

  const particles = [snowFar, snowNear, pyreflies];
  for (const p of particles) group.add(p);

  // --------------------------------------------------------------- boulders
  /**
   * Snow-buried boulders along the ledge.
   *
   * These are the only *real geometry* in the scene besides the ground, and
   * they earn their place twice over: they break up the empty middle of the
   * frame, and — because they are lit by the same rig and cast the same
   * shadows as the figures — they are the proof that the 3D layer and the
   * painting share a light. Each is sunk into the ground so it reads as
   * embedded in snow rather than resting on a plane.
   */
  const rockColor = normaliseLuma(backdrop.palette.ground, 0.54);
  const rocks = (
    [
      [-5.9, -1.4, 0.3, 3],
      [0.7, -5.2, 0.42, 11],
      [6.9, -4.6, 0.46, 17],
      [-7.0, 2.9, 0.26, 23],
      [5.3, 1.6, 0.28, 29],
      [2.3, -7.8, 0.5, 37],
      [-3.0, -6.4, 0.34, 41],
      [8.4, -1.6, 0.33, 47],
    ] as Array<[number, number, number, number]>
  ).map(([x, z, size, seed]) => {
    const rock = makeRock({
      size,
      color: rockColor,
      // Wide and very low: a snow-buried boulder, not a boulder on a table.
      scale: [1.5, 0.5, 1.2],
      jitter: 0.26,
      seed,
      detail: 2,
      flatShading: false,
    });
    rock.position.set(x, -size * 0.28, z);
    rock.rotation.y = (seed % 7) * 0.41;
    group.add(rock);
    return rock;
  });

  // ------------------------------------------------------------- light pools
  // A faint additive pool under each standing spot. This is the single cheapest
  // trick that stops a cut-out figure reading as a sticker on a painting.
  const pools = [
    ...PARTY_SLOTS.slice(0, 3).map((s) => {
      const pool = makeLightPool({ color: backdrop.palette.bounce, radius: 1.35, opacity: 0.2 });
      pool.position.set(s[0], 0.008, s[2]);
      return pool;
    }),
    (() => {
      const pool = makeLightPool({ color: 0x8affd0, radius: 1.9, opacity: 0.22 });
      const s = ENEMY_SLOTS[0]!;
      pool.position.set(s[0], 0.006, s[2]);
      pool.name = 'enemy-pool';
      return pool;
    })(),
  ];
  for (const p of pools) group.add(p);
  const bossPool = pools[pools.length - 1]!;

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
    palette: { ...ScenePalettes.gagazet } satisfies ScenePalette,
    update(dt: number): void {
      clock += dt;
      backdrop.update(dt);
      lights.update(dt);
      for (const p of particles) p.update(dt);
      // The enemy pool breathes, so the bloom always has something living in it.
      (bossPool.material as { opacity: number }).opacity = 0.18 + Math.sin(clock * 0.9) * 0.05;
    },
    dispose(): void {
      watcher?.stop();
      for (const p of particles) p.dispose();
      for (const p of [...pools, ...rocks]) {
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

// ---------------------------------------------------------------------------
// The demo screen's scene: the reference composition, with actors and beats
// ---------------------------------------------------------------------------

/** What the painted demo screen drives. A {@link SceneBuild} plus the cast. */
export interface PaintedScene extends SceneBuild {
  scene: Scene;
  battleCamera: BattleCamera;
  party: PaintedActor[];
  enemies: PaintedActor[];
  /** Which assets are still procedural stand-ins. */
  assetReport: AssetReport;
  /** Fire a named beat: 'attack' | 'cast' | 'hurt' | 'ko'. */
  trigger(name: string): boolean;
  /** Keep particle and spark sizes consistent across render heights. */
  setPixelScale(v: number): void;
}

export interface AssetReport {
  backdrop: boolean;
  /** Tidus states with a painting of their own (not a fallback to idle). */
  tidusPoses: string[];
  yuna: boolean;
  boss: boolean;
  /** Party slots currently drawn with a borrowed or silhouette stand-in. */
  standIns: string[];
}

/** Back-compat alias: the old pixel demo exported this name. */
export type DioramaScene = PaintedScene;

const TIDUS_POSES = ['idle', 'attack', 'cast', 'hurt', 'ko', 'victory'] as const;

/** Scheduled callback driven from `update`, so beats are frame-deterministic. */
interface Timer {
  left: number;
  fn: () => void;
}

/**
 * The painted-2.5D reference composition: {@link buildGagazetScene} with Tidus,
 * Yuna and Auron standing on the party slots, Seymour Flux on enemy slot 0, the
 * FFX battle camera rigs bound to a real camera, and the action beats the demo
 * screen's keys fire.
 */
export async function buildDemoScene(camera: PerspectiveCamera): Promise<PaintedScene> {
  const scene = new Scene();
  scene.name = 'gagazet';

  const build = await buildGagazetScene({});
  mountScene(build, scene);
  const { lights } = build;

  // ------------------------------------------------------------------ actors
  const rimHex = lights.rimColorHex;
  const bounceHex = lights.bounceColorHex;

  const commonActor = {
    facing: 1 as const,
    crossfadeMs: 120,
    rim: { color: rimHex, strength: 0.85, dir: lights.rimDir, width: 3.4 },
    bounce: { color: bounceHex, strength: 0.28 },
    groundShade: 0.26,
    shadow: { radius: 0.82, opacity: 0.74, squash: 0.5 },
    breathe: { amplitude: 0.018, speed: 0.42 },
    sway: { amplitude: 0.01, speed: 0.23 },
  };

  const hero = await PaintedActor.fromSubject('tidus', {
    ...commonActor,
    worldHeight: ACTOR_HEIGHTS.tidus,
    states: TIDUS_POSES,
  });

  const yuna = await PaintedActor.fromSubject('yuna', {
    ...commonActor,
    worldHeight: ACTOR_HEIGHTS.yuna,
    states: TIDUS_POSES,
  });

  const auron = await PaintedActor.fromSubject('auron', {
    ...commonActor,
    worldHeight: ACTOR_HEIGHTS.auron,
    states: TIDUS_POSES,
  });

  const standIns: string[] = [];
  /**
   * A party slot with no painting of its own borrows the hero's, tinted. It is
   * obviously a stand-in, but at least it is the right *kind* of figure, and
   * the frame stays composed while the art pipeline catches up.
   */
  const standInFor = (actor: PaintedActor, who: string, tint: string): void => {
    if (!actor.subject?.placeholder) return;
    standIns.push(who);
    if (!hero.subject?.placeholder) actor.adoptPoses(hero.subject!.poses, 'idle');
    actor.setTint(tint);
  };
  standInFor(yuna, 'yuna', '#ffd9b0');
  standInFor(auron, 'auron', '#d89a8a');

  const party = [hero, yuna, auron];
  party.forEach((a, i) => {
    a.position.copy(build.partySlots[i]!);
    a.setFacing(1);
    build.group.add(a);
  });

  const boss = await PaintedActor.fromSubject('seymour-flux', {
    facing: -1,
    worldHeight: ACTOR_HEIGHTS.seymourFlux,
    crossfadeMs: 140,
    states: ['idle'],
    placeholder: () => paintBossSilhouette({ seed: 31 }),
    placeholderBaseline: 0.985,
    // The generated Seymour PNG ships with an opaque white studio background
    // still baked in around the aura; `force` strips it at load time. Harmless
    // once the art agent regenerates it with a clean matte.
    matte: { mode: 'force' },
    // Seymour's painting is not a clean cut-out: his aura is opaque magenta
    // out to the PNG's border, so the plane would end on a hard rectangle the
    // moment anything lights it (a hit flash, a bright backdrop). Feathering
    // the outer 16% turns that border into haze.
    edgeFade: 0.16,
    alphaCut: 0.05,
    rim: { color: rimHex, strength: 0.7, dir: [1, 0.3], width: 4 },
    bounce: { color: 0x8affd0, strength: 0.22 },
    groundShade: 0.1,
    // Seymour Flux does not stand — he hangs in the air over the ledge. The
    // hover is explicit (with the contact shadow left on the ground, shrunk
    // and softened) so it reads as levitation rather than as a figure that
    // failed to land.
    hover: { height: 0.36, bobAmplitude: 0.075, bobSpeed: 0.17 },
    shadow: { radius: 1.3, opacity: 0.55, squash: 0.5 },
    breathe: { amplitude: 0.012, speed: 0.22 },
    sway: { amplitude: 0.006, speed: 0.15 },
  });
  boss.position.copy(build.enemySlots[0]!);
  build.group.add(boss);

  // --------------------------------------------------------------------- VFX
  const hits = new HitEffects(
    {
      size: 5.0,
      coreColor: 0xeaf6ff,
      edgeColor: 0x6fb4ff,
      arc: 2.5,
      radius: 0.6,
      // The ring's half-width is read against `radius`, so anything much over
      // 0.1 stops being an annulus and fills the quad — an additive white
      // blob rather than a blade sweep.
      thickness: 0.09,
      trail: 0.62,
    },
    { count: 110, speed: 6.4, life: 0.5, size: 10, bias: [0.4, 0.45, 0.2], focus: 0.5 },
    { color: 0xdff0ff, size: 3.0 },
  );
  build.group.add(hits);

  // ------------------------------------------------------------------ camera
  const battleCamera = new BattleCamera(camera, {
    swayAmplitude: 0.05,
    swaySpeed: 0.26,
    rigs: RIGS,
    initial: 'idle',
  });

  // ------------------------------------------------------------------- beats
  const timers: Timer[] = [];
  const after = (ms: number, fn: () => void): void => {
    timers.push({ left: ms / 1000, fn });
  };

  const bossHit = new Vector3();
  let busy = false;

  const attackBeat = (): void => {
    if (busy) return;
    busy = true;
    void battleCamera.moveTo('action', 240, 'cubicOut');
    hero.setPose('attack');
    // Far enough to actually close on the boss: FFX's attacker crosses the
    // field, it does not lean.
    void hero.lunge(3.1, 500);
    void hero.squash(280, 0.5);
    lights.placePractical(hero.position.x + 1, 1.4, hero.position.z);

    after(170, () => {
      boss.centerPoint(bossHit);
      // On the near side of the boss, over the darker ground, so the additive
      // arc is not competing with his own glow.
      bossHit.x -= 0.85;
      bossHit.z += 0.75;
      void hits.slash.play(bossHit, 380, -0.62);
      lights.flicker(0xdcefff, 4.6, 420, 14);
    });

    after(250, () => {
      hits.sparks.emit(bossHit, 1);
      // Kept well under a full white-out: the boss is a painting with its own
      // lighting, and blowing it to flat white for six frames throws away the
      // one thing the shot is selling.
      hits.flash.play(bossHit, 260, 0.72);
      boss.flash(0xdff4ff, 200, 0.5);
      boss.shake(0.13, 380);
      void boss.recoil(420, 0.34);
      battleCamera.shake(0.14, 300);
      void battleCamera.punch(0.1, 480);
    });

    after(760, () => {
      hero.setPose('idle');
      void battleCamera.moveTo('idle', 760, 'cubicInOut');
    });
    after(1250, () => {
      busy = false;
    });
  };

  const castBeat = (): void => {
    if (busy) return;
    busy = true;
    hero.setPose('cast');
    lights.placePractical(hero.position.x, 1.6, hero.position.z + 0.4);
    lights.flicker(0x8affd0, 3.4, 900, 11);
    hero.flash(0x9fffd8, 700, 0.5);
    after(900, () => {
      hero.setPose('idle');
      busy = false;
    });
  };

  const hurtBeat = (): void => {
    party[0]?.setPose('hurt');
    for (const a of party) {
      a.flash(0xff9a8a, 220, 0.7);
      a.shake(0.07, 280);
    }
    battleCamera.shake(0.1, 240);
    after(520, () => party[0]?.setPose('idle'));
  };

  const koBeat = (): void => {
    void boss.dissolveTo(1, 1600, 0x9dffc4);
    after(1700, () => boss.setDissolve(0));
  };

  const trigger = (name: string): boolean => {
    switch (name) {
      case 'attack':
        attackBeat();
        return true;
      case 'cast':
        castBeat();
        return true;
      case 'hurt':
        hurtBeat();
        return true;
      case 'ko':
        koBeat();
        return true;
      default:
        return false;
    }
  };

  // ---------------------------------------------------------------- hot-swap
  const assetReport: AssetReport = {
    backdrop: !build.backdrop.placeholder,
    tidusPoses: hero.subject?.real ?? [],
    yuna: !standIns.includes('yuna'),
    boss: !boss.subject?.placeholder,
    standIns,
  };

  const watched: string[] = [];
  for (const pose of TIDUS_POSES) {
    if (!assetReport.tidusPoses.includes(pose)) watched.push(characterUrl('tidus', pose));
  }
  if (!assetReport.yuna) watched.push(characterUrl('yuna', 'idle'));
  if (!assetReport.boss) watched.push(characterUrl('seymour-flux', 'idle'));

  let watcher: AssetWatcher | null = null;
  const onAssetAppeared = async (url: string): Promise<void> => {
    console.info('[painted] hot-swapping newly generated art:', url);
    for (const pose of TIDUS_POSES) {
      if (url === characterUrl('tidus', pose)) {
        const ok = await hero.reloadPose(pose, url);
        if (ok && !assetReport.tidusPoses.includes(pose)) assetReport.tidusPoses.push(pose);
        return;
      }
    }
    if (url === characterUrl('yuna', 'idle')) {
      yuna.adoptPoses((await PaintedArt.load('yuna', { states: ['idle'] })).poses, 'idle');
      yuna.setTint(0xffffff);
      assetReport.yuna = true;
      const i = standIns.indexOf('yuna');
      if (i >= 0) standIns.splice(i, 1);
      return;
    }
    if (url === characterUrl('seymour-flux', 'idle')) {
      await boss.loadPoses({ idle: url }, 'idle');
      assetReport.boss = true;
    }
  };
  if (watched.length) {
    watcher = watchAssets(watched, (u) => void onAssetAppeared(u), { intervalMs: 5000 });
  }

  // -------------------------------------------------------------------- loop
  let clock = 0;
  const update = (dt: number): void => {
    clock += dt;

    for (let i = timers.length - 1; i >= 0; i--) {
      const t = timers[i]!;
      t.left -= dt;
      if (t.left <= 0) {
        timers.splice(i, 1);
        t.fn();
      }
    }

    build.update(dt);
    for (const a of party) a.update(dt);
    boss.update(dt);
    hits.update(dt, camera);
    battleCamera.update(dt);

    // The boss's core breathes, so the bloom has something living in it.
    boss.setBrightness(0.85 + (0.82 + Math.sin(clock * 0.9) * 0.18) * 0.25);
  };

  const setPixelScale = (v: number): void => {
    for (const p of build.particles) p.setPixelScale(v);
    hits.sparks.setPixelScale(v);
  };

  const dispose = (): void => {
    watcher?.stop();
    for (const a of party) a.dispose();
    boss.dispose();
    hits.dispose();
    build.dispose();
    scene.clear();
  };

  return {
    ...build,
    // `...build` copies the `backdrop` getter's *current* value, which is what
    // we want here: the demo never hot-swaps the painting out from under it.
    scene,
    battleCamera,
    party,
    enemies: [boss],
    assetReport,
    trigger,
    setPixelScale,
    update,
    dispose,
  };
}
