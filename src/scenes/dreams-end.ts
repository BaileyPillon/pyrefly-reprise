import {
  AdditiveBlending,
  ClampToEdgeWrapping,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  Vector3,
  type Material,
} from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { makeRock, makeSlab } from '../engine/Diorama.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import {
  artUrl,
  normaliseLuma,
  paintedCanvasTexture,
  watchAssets,
  type AssetWatcher,
} from '../engine/PaintedArt.ts';
import { ParticleField, ParticlePresets } from '../engine/Particles.ts';
import { rng } from '../engine/ProceduralArt.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import { ScenePalettes } from '../engine/ScenePalettes.ts';
import type {
  SceneBuild,
  SceneBuildOptions,
  SceneFactory,
  SceneRigName,
} from './types.ts';

// ---------------------------------------------------------------------------
// Dream's End — the innermost chamber of Sin
// ---------------------------------------------------------------------------
//
// The painting (`public/art/backdrops/dreams-end.png`, 2688x1536) is a red
// void: a black-crimson cloud ceiling, a burning eye of fire hanging at ~21%
// of the image height, the tiered silhouette of the ruined stadium filling the
// middle, a wall of flame along its base at ~58%, and dark cracked stone
// running out of the bottom of the frame. Every number below is solved against
// *that* image:
//
//  - the **key** is sampled from the burning eye, so the one hot colour in the
//    scene is the painting's own fire and not a hex somebody picked;
//  - the **fill** is the one thing the painting does not supply. It is forced
//    cold blue, because a frame that is red from edge to edge has no second
//    hue, and three red cut-outs standing in red haze read as a single flat
//    shape. The cold fill is what gives every figure a cool shadow side to be
//    separated by;
//  - the **framing** shows the painting from 19% to 94% of its height at the
//    idle rig — the fire eye clipped along the top edge of the frame like a
//    setting sun, the stadium behind the boss, and the flame wall landing
//    exactly where the 3D ground dissolves. The intro tilts up into the 19%
//    that idle throws away.

/**
 * The camera the parallax stack and the backdrop framing are solved for —
 * identical to the `idle` rig's position. See "Framing the backdrop" in
 * `docs/ENGINE-API.md`.
 */
const CAMERA_REF: [number, number, number] = [0, 2.75, 9.8];

/** World z of the painting plane, and the plane's world width. */
const BACKDROP_DISTANCE = -50;
const BACKDROP_WIDTH = 80;

/**
 * Centre of the painting plane.
 *
 * The idle rig's view axis crosses `z = -50` at `y = -1.79`, and the frame is
 * 34.4 world units tall there — 75% of the 45.7-unit painting. Centring the
 * plane at `+1.23` puts the frame's top edge on 19% of the image, which is the
 * row that cuts the burning eye roughly in half: the fire hangs over the top of
 * the frame like a low sun instead of floating in the middle of it like a lamp.
 *
 * The other thing that row buys is the **intro**. Everything above 19% — the
 * whole cloud ceiling and the top of the eye — is off-frame at idle, so the
 * opening shot has somewhere to tilt up *into*. A plane framed to show all of
 * the painting at idle has no reveal left in it.
 */
const BACKDROP_CENTRE_Y = 1.23;

/**
 * FFX battle framing: fov 30–32, a nearly level camera, the party in a shallow
 * left-facing arc in the lower left, the boss right of centre and further back.
 *
 * The camera here is much **flatter** than Gagazet's. Dream's End has no
 * valley to look down into: the drama is overhead — the fire, the ceiling, the
 * stadium tiers — and a rig pitched down to show a floor would crop all three
 * away. A level rig also drops the 3D ground's far edge to 51% of the frame,
 * which is where the painted flame wall sits, and that is the whole reason the
 * seam between geometry and paint disappears.
 *
 * Every rig is checked against the painting plane: `intro` sees 33.9 x 60.3
 * units at the plane's depth and `victory` swings the view axis out to
 * x = -8.1 — both inside the 80 x 45.7 plane.
 */
const RIGS: Record<SceneRigName, CameraRig> & Record<string, CameraRig> = {
  /**
   * The establishing shot: wide, low and **tilted up** — the one rig in the
   * game that looks at the sky. It frames the whole burning eye and the cloud
   * ceiling with the arena floor a thin strip along the bottom, and the
   * presenter tilts *down* into `idle` over ~2.5s. The move is a tilt and a
   * push on nearly the same view axis, so it reads as the camera lowering its
   * gaze onto the fight rather than as a cut.
   *
   * Its top edge lands 0.7% from the top of the painting: that is the whole
   * budget this reveal has, and it is why `BACKDROP_CENTRE_Y` is what it is.
   */
  intro: { position: [0.1, 2.35, 13.2], lookAt: [0.3, 3.6, -4.5], fov: 30, sway: 1.4 },
  idle: { position: CAMERA_REF, lookAt: [0.15, 1.9, -1.4], fov: 32 },
  /**
   * Pushed in for an ability beat. Solved so the attacker (slot 0, and x ≈ 1.4
   * mid-lunge) and the boss (x 2.9) are both well inside the frame — an action
   * rig framed on the target alone turns every attack into a shot of the thing
   * being hit — while the swing right stops where party slot 1 still grazes the
   * left edge.
   */
  action: { position: [0.25, 2.55, 9.1], lookAt: [0.98, 1.95, -1.2], fov: 32, sway: 0.7 },
  party: { position: [-1.5, 2.15, 6.8], lookAt: [-2.4, 1.6, 0.5], fov: 32, sway: 0.7 },
  enemy: { position: [1.4, 2.7, 5.9], lookAt: [2.9, 2.1, -2.3], fov: 32, sway: 0.7 },
  victory: { position: [-1.7, 2.1, 7.2], lookAt: [-2.4, 1.6, 0.9], fov: 32, sway: 1.2 },
};

/**
 * Three active slots in the FFX arc, front to back and staggered, then four
 * reserve slots parked off frame-left.
 *
 * The arc is pushed right of its natural centre so the command window (bottom
 * left, ~26% of the frame) never buries the front character, and each slot is
 * offset in **both** x and z so no figure stands directly behind another at any
 * rig — a straight line of three cut-outs is the fastest way to make a painted
 * scene look like a sticker sheet.
 */
const PARTY_SLOTS: Array<[number, number, number]> = [
  [-1.6, 0, 1.6], // front
  [-3.0, 0, 0.3], // middle, further left and back
  [-1.1, 0, -1.0], // back, stepped in again
  // reserve — outside every rig's frustum, including `victory`'s left swing
  [-11.8, 0, 2.6],
  [-12.7, 0, 1.0],
  [-13.6, 0, -0.6],
  [-14.5, 0, -2.2],
];

/**
 * Enemy formation: the boss centre-right and further back, with two flanking
 * slots for the parts of a multi-part boss — Braska's Final Aeon's Yu Pagodas
 * stand on these two.
 */
const ENEMY_SLOTS: Array<[number, number, number]> = [
  [2.9, 0, -2.5], // boss
  [5.2, 0, -1.1], // right part
  [1.4, 0, -4.6], // left / back part
];

/** The slot table `src/scenes/index.ts` can hand to a battle. */
export const DREAMS_END_SLOTS = {
  party: PARTY_SLOTS.slice(0, 3) as Array<[number, number, number]>,
  enemy: ENEMY_SLOTS,
  partyHeight: 1.8,
  enemyHeight: 4.2,
};

/**
 * The molten crack network the arena floor glows through, as an **additive
 * mask**.
 *
 * Modelling cracks as geometry cannot work at this scale — a groove cut into a
 * plane is invisible from a camera this shallow, and a dark painted line reads
 * as dirt. What sells "the floor of Sin is splitting" is *light coming up from
 * under it*: a branching network of thin hot lines, brightest at their core,
 * that adds to whatever the ground already is.
 *
 * The network is grown rather than drawn: eight trunks walk outward from near
 * the centre with a wandering heading, spawning shorter branches as they go, so
 * no two runs of the same seed look like the same crack twice. Everything is
 * feathered to nothing well inside the canvas, so the quad can never show its
 * own rectangle.
 */
function crackCanvas(seed: number): HTMLCanvasElement {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const rand = rng(seed);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  /** One crack: a wandering polyline that thins and dims as it runs out. */
  const run = (
    x0: number,
    y0: number,
    heading: number,
    length: number,
    width: number,
    depth: number,
  ): void => {
    let x = x0;
    let y = y0;
    let a = heading;
    const steps = Math.max(4, Math.round(length / (size * 0.02)));
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      // The heading wanders, but never doubles back: a crack propagates.
      a += (rand() - 0.5) * 0.55;
      const step = length / steps;
      const nx = x + Math.cos(a) * step;
      const ny = y + Math.sin(a) * step;

      const w = Math.max(0.6, width * (1 - t * 0.85));
      // Hot core over a wider, dimmer halo — one stroke cannot be both, and a
      // single-width line reads as a scratch on the lens instead of as a seam
      // with fire behind it.
      ctx.strokeStyle = `rgba(255,110,44,${(0.1 * (1 - t) * (1 - depth * 0.28)).toFixed(3)})`;
      ctx.lineWidth = w * 4.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255,206,146,${(0.34 * (1 - t * 0.7) * (1 - depth * 0.3)).toFixed(3)})`;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      // Branch. Depth is capped at 2 so the network stays readable as cracks
      // rather than turning into a glowing net.
      if (depth < 2 && rand() < 0.16) {
        run(nx, ny, a + (rand() < 0.5 ? -1 : 1) * (0.5 + rand() * 0.6), length * (0.3 + rand() * 0.3), w * 0.62, depth + 1);
      }
      x = nx;
      y = ny;
    }
  };

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rand() * 0.7;
    const r = size * (0.04 + rand() * 0.16);
    run(
      size / 2 + Math.cos(a) * r,
      size / 2 + Math.sin(a) * r,
      a + (rand() - 0.5) * 0.9,
      size * (0.24 + rand() * 0.2),
      1.8 + rand() * 1.4,
      0,
    );
  }

  // Embers caught in the seams: a few bright points along the network, which is
  // what the bloom threshold actually catches.
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 70; i++) {
    const a = rand() * Math.PI * 2;
    const r = size * rand() * 0.42;
    const x = size / 2 + Math.cos(a) * r;
    const y = size / 2 + Math.sin(a) * r;
    const rad = 2 + rand() * 5;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(255,236,196,0.34)');
    g.addColorStop(1, 'rgba(255,120,44,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  ctx.globalCompositeOperation = 'source-over';

  // Feather everything, so the sheet has no border of its own.
  ctx.globalCompositeOperation = 'destination-in';
  const fade = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(0.4, 'rgba(0,0,0,0.9)');
  fade.addColorStop(0.72, 'rgba(0,0,0,0.28)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

/**
 * The Dream's End grade, pushed **amber** off `ScenePalettes.dreamsEnd`.
 *
 * The bible's numbers are a pure red gain, and on this painting that is one
 * note too few: the frame is already crimson, so a crimson grade on top of it
 * collapses the fire, the stone and the sky into one value. Cutting blue harder
 * than green turns the gain from red into *amber*, which leaves the painting's
 * own deep reds where they are and lifts only the fire — and the vignette and
 * the heavier bloom are what make that fire feel like it is inside the room
 * with the party rather than printed behind them.
 */
const PALETTE: ScenePalette = {
  ...ScenePalettes.dreamsEnd,
  name: 'dreams-end',
  lift: [0.01, 0.004, 0.006],
  gamma: [0.99, 0.99, 1.0],
  gain: [1.06, 1.0, 0.9],
  saturation: 0.96,
  vignette: 0.5,
  vignetteRadius: 0.58,
  shadowTint: [0.72, 0.3, 0.3],
  shadowTintAmount: 0.15,
  grain: 0.028,
  exposure: 0.9,
  bloomThreshold: 0.92,
  bloomStrength: 0.62,
  bloomRadius: 0.7,
  tiltFocus: 0.4,
  tiltBandWidth: 0.16,
  tiltMaxBlur: 4.4,
};

/** Canonical world heights for the cast that fights here. */
export const DREAMS_END_ACTOR_HEIGHTS = {
  tidus: 1.78,
  yuna: 1.7,
  auron: 1.88,
  /** Braska's Final Aeon towers: the bible's boss_wide rig exists for this. */
  braskasFinalAeon: 3.45,
  yuPagoda: 1.9,
  yuYevon: 2.4,
  /** Stand-in while the Final Aeon art is still being generated. */
  seymourFlux: 2.7,
} as const;

/**
 * The scene's default cut-out protection for a painted actor parked on
 * {@link SceneBuild.enemySlots}.
 *
 * Boss art is generated **full-bleed**: the aura runs off every side of the
 * PNG, so the "cut-out" ends on the plane's own rectangle. `matte: 'force'`
 * runs the border flood fill that takes out the white studio background, and
 * `edgeFade` feathers whatever painted aura is still touching the border so the
 * plane's edge reads as atmosphere instead of as a frame. `alphaCut` is kept
 * *low* on purpose — a high cut does not remove a remnant that is already
 * opaque, it only re-hardens the tail of the feather.
 *
 * Spread this into the actor options rather than restating the numbers:
 *
 * ```ts
 * const boss = await PaintedActor.fromSubject('braskas-final-aeon-1', {
 *   ...DREAMS_END_ENEMY_ACTOR_DEFAULTS,
 *   worldHeight: DREAMS_END_ACTOR_HEIGHTS.braskasFinalAeon,
 * });
 * ```
 *
 * The fade sits between Gagazet's 0.18 and the Farplane's 0.34. This frame is
 * dark, so a surviving border of dark aura is nearly invisible the way it is on
 * Gagazet — but the boss stands against the painting's one bright band, the
 * flame wall, and there a hard plane edge cuts a black rectangle out of the
 * fire. 0.24 covers that without eating the silhouette.
 */
export const DREAMS_END_ENEMY_ACTOR_DEFAULTS = {
  matte: { mode: 'force' as const },
  edgeFade: 0.24,
  alphaCut: 0.04,
} as const;

/** One drifting ruin, and the numbers its idle motion is driven from. */
interface Fragment {
  node: Group;
  baseY: number;
  bob: number;
  bobSpeed: number;
  spin: number;
  phase: number;
  roll: number;
}

/**
 * **Dream's End — inside Sin**, as a {@link SceneFactory}.
 *
 * A matte painting parallax stack behind a cracked stone floor tinted from the
 * painting's own bottom rows, a molten crack network glowing up through it,
 * five fragments of Zanarkand drifting unattached at mid-depth, embers rising
 * in three depth bands, sparse red pyreflies, low ground haze, a hot orange key
 * from the right with a deliberately cold blue fill and an oxblood underlight,
 * and the amber-pushed Dream's End grade.
 *
 * It owns **no actors** — see `docs/ENGINE-API.md#scene-builder-contract`.
 */
export const buildDreamsEndScene: SceneFactory = async (
  opts: SceneBuildOptions = {},
): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:dreams-end';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? CAMERA_REF;

  // ---------------------------------------------------------------- backdrop
  const url = artUrl('art/backdrops/dreams-end.png');

  const backdropOptions = {
    url,
    width: BACKDROP_WIDTH,
    distance: BACKDROP_DISTANCE,
    centreY: BACKDROP_CENTRE_Y,
    cameraRef,
    /**
     * Two masked bands carved out of the same painting and scaled toward the
     * reference camera: the stadium tiers (0.28–0.60) and the near rock spires
     * that flank the frame (0.54–0.88). At rest they register exactly with the
     * painting; the moment the camera sways, tilts down out of `intro` or cuts
     * to `action` they part, and the flat matte reads as depth.
     */
    layers: low
      ? [{ from: 0.54, to: 0.88, feather: 0.09, featherBottom: 0.05, z: -18, opacity: 0.55 }]
      : [
          { from: 0.28, to: 0.6, feather: 0.09, featherBottom: 0.07, z: -30, opacity: 0.6 },
          { from: 0.54, to: 0.88, feather: 0.09, featherBottom: 0.05, z: -18, opacity: 0.55 },
        ],
    /**
     * Where the palette is read from.
     *
     * `key` is the burning eye at 15–26%, so the scene's one hot light is the
     * painting's own fire. `horizon` is the flame wall at the stadium's base —
     * that band is the fog colour, and it is the *right* choice here for the
     * reason it usually is not: the painting has no far ground, only fire and
     * red depth, so fogging toward the flame wall is what makes the 3D floor
     * end in glare instead of in an edge.
     */
    sampleBands: {
      sky: [0.0, 0.09],
      horizon: [0.59, 0.69],
      ground: [0.88, 1.0],
      key: [0.15, 0.26],
    },
    /**
     * The painting already contains its own floor, so the 3D ground is not an
     * opaque plane running to the horizon — it is a faded disc under the
     * fighters that catches their shadows and dissolves into the painted flame
     * wall. Its hue is the painting's own bottom rows; only its value is set
     * here (`luma`), because a band average is not an exposure.
     *
     * The value is low (0.30). This is the floor of Sin lit by fire from one
     * side; a floor read up to Gagazet's 0.54 stops being stone in a dark room
     * and becomes a lit stage.
     */
    ground: {
      size: 40,
      repeat: 5,
      tintMix: 0.05,
      brightness: 1.0,
      luma: 0.26,
      fade: true,
      fadeCore: 0.06,
      center: [0, -1] as [number, number],
    },
    fog: { near: 16, far: 46, colorMix: 0.3 },
    /**
     * Four haze sheets. The far two sit on the seam where the 3D floor
     * dissolves into the painted flame wall (~51% down the idle frame) and are
     * the reason that seam has no edge; the near two are smoke at knee height,
     * which is what stops the figures looking like they are standing on a clean
     * tabletop.
     */
    fogPlanes: [
      { z: -30, y: 2.6, width: 72, height: 18, opacity: 0.22, speed: 0.006 },
      { z: -20, y: 1.9, width: 56, height: 13, opacity: 0.18, speed: 0.011 },
      { z: -15.5, y: 1.1, width: 46, height: 7, opacity: 0.22, speed: 0.016 },
      { z: -12, y: 1.2, width: 38, height: 8, opacity: 0.14, speed: 0.021 },
      { z: -5.0, y: 0.7, width: 28, height: 5.0, opacity: 0.1, speed: 0.036, additive: true },
    ],
  } satisfies BackdropOptions;

  /**
   * Pull the sampled haze toward ember.
   *
   * `sampleBand` averages a band across the **whole width** of the painting,
   * and at 59–69% this painting is mostly the black stadium silhouette and the
   * black spires that flank it — the flame wall is only the middle third. The
   * honest average is therefore a muddy near-black, and fogging the floor to it
   * is what makes the far ground look like it has simply been turned off.
   *
   * So the fog keeps the sampled *hue* and is pulled a third of the way to a
   * deep ember: dark enough to stay a void, warm enough that the floor ends in
   * glare. Applied on every rebuild, because the hot-swap makes a new one.
   */
  const emberHaze = (b: Backdrop): void => {
    b.fog?.color.lerp(new Color(0x8c2a16), 0.34);
    b.background?.lerp(new Color(0x2a0a12), 0.5);
  };

  let backdrop = await Backdrop.create(backdropOptions);
  emberHaze(backdrop);
  backdrop.applyTo(group);

  // ------------------------------------------------------------------ lights
  /**
   * A hot orange key from the **right**, a cold blue fill, and an oxblood
   * underlight.
   *
   * The key is on the right because that is where the painting's fire is
   * strongest, and it is high and slightly behind, so it rims every figure's
   * right shoulder and leaves the left side to the fill.
   *
   * The fill is the decision that makes this scene work. `LightRig` samples it
   * from `palette.sky`, which here is black-crimson — a fill of the same hue as
   * the key leaves the shadow side of every figure red, and three red cut-outs
   * against a red frame merge into one shape. It is overridden to cold blue
   * below, which is unmotivated by the painting and completely correct: it is
   * the only thing separating the party from the fire behind them.
   */
  const lights = new LightRig({
    palette: backdrop.palette,
    keyFrom: [9.6, 6.4, -3.4],
    keyIntensity: low ? 1.55 : 1.7,
    rimFrom: [7.2, 3.2, 5.2],
    rimColor: 0xffb070,
    rimIntensity: 0.9,
    fillIntensity: 0.62,
    ambientIntensity: 0.34,
    luma: { key: 0.8, fill: 0.5, rim: 0.88, ambient: 0.3 },
    shadows: low ? false : { mapSize: 1024, area: 15, radius: 4.2, bias: -0.0014 },
  });
  // Cold blue sky half, oxblood ground half. See the note above: the painting
  // cannot supply this and the scene falls apart without it.
  lights.fill.color.setHex(0x5f7bb8);
  lights.fill.groundColor.setHex(0x3a1016);
  group.add(lights.group);

  /**
   * The underlight — the bible's "key wrongness cue: faces lit from beneath".
   *
   * `LightRig` has no fourth lamp, so the scene owns this one. It is weak and
   * deep red, and it only really shows on the drifting ruins and the rubble,
   * where it lifts the *undersides* that the key can never reach. Without it
   * every floating fragment has a solid black belly and reads as a hole cut in
   * the painting.
   */
  const underlight = new DirectionalLight(0x8e1a22, low ? 0.4 : 0.55);
  underlight.position.set(-2.0, -7.0, 3.0);
  underlight.name = 'underlight';
  group.add(underlight, underlight.target);

  // -------------------------------------------------------- molten floor cracks
  /**
   * The glowing half of the floor.
   *
   * `Backdrop`'s ground plane is Lambert and, at luma 0.30, nearly black — which
   * is right for stone inside Sin and leaves the lower third of the frame with
   * nothing in it. An additive sheet of hot cracks laid over the same disc puts
   * the fire *under* the party rather than only behind them, and because it is
   * additive it can only ever add light, so it cannot wash out the ground tint
   * that was so carefully matched to the painting.
   */
  const crackTex = paintedCanvasTexture(crackCanvas(613));
  crackTex.wrapS = crackTex.wrapT = ClampToEdgeWrapping;
  const crackMat = new MeshBasicMaterial({
    map: crackTex,
    color: 0xff9a52,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: false,
  });
  const cracks = new Mesh(new PlaneGeometry(24, 24, 1, 1), crackMat);
  cracks.rotation.x = -Math.PI / 2;
  cracks.position.set(-0.6, 0.014, 0.4);
  cracks.renderOrder = -48;
  cracks.name = 'floor-cracks';
  group.add(cracks);

  // A second, smaller network rotated and offset, so the floor is not one
  // radial starburst centred on the party's feet.
  const cracksFar = new Mesh(new PlaneGeometry(13, 13, 1, 1), crackMat);
  cracksFar.rotation.set(-Math.PI / 2, 0, 2.1);
  cracksFar.position.set(5.2, 0.012, -3.2);
  cracksFar.renderOrder = -49;
  cracksFar.name = 'floor-cracks-far';
  group.add(cracksFar);

  // ------------------------------------------------------------ the rim fire
  /**
   * The wall of flame at the far rim of the arena, as a 3D element rather than
   * as paint.
   *
   * The painting has one and it is the best thing in it — but it sits at 60% of
   * the image, which at the idle framing is *behind* where the 3D floor
   * dissolves, so the frame throws away its own brightest band. Rebuilding it
   * at `z = -13` puts it back exactly where the floor ends, and because it is
   * now in front of the painting it takes the drifting ruins and the boss in
   * silhouette against it, which the painted one never could.
   *
   * It is a soft gradient, not a flame texture: anything with a recognisable
   * tongue of fire in it reads as a decal at this size, and the embers rising
   * through it are what actually say "burning".
   */
  const fireBand = document.createElement('canvas');
  fireBand.width = 512;
  fireBand.height = 128;
  {
    const ctx = fireBand.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 128, 0, 0);
    g.addColorStop(0, 'rgba(255,226,176,0)');
    g.addColorStop(0.1, 'rgba(255,226,176,0.34)');
    g.addColorStop(0.24, 'rgba(255,164,70,0.5)');
    g.addColorStop(0.5, 'rgba(206,70,26,0.19)');
    g.addColorStop(0.8, 'rgba(130,28,18,0.05)');
    g.addColorStop(1, 'rgba(90,16,14,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 128);
    // Break the band up so it is a fire line and not a strip light: a run of
    // soft bright swells along it, and a feather at both ends.
    ctx.globalCompositeOperation = 'lighter';
    const rand = rng(77);
    for (let i = 0; i < 26; i++) {
      const x = rand() * 512;
      const w = 18 + rand() * 70;
      const h = 30 + rand() * 66;
      const s = ctx.createRadialGradient(x, 116, 0, x, 116, Math.max(w, h));
      s.addColorStop(0, `rgba(255,206,132,${(0.05 + rand() * 0.1).toFixed(3)})`);
      s.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = s;
      ctx.fillRect(x - w, 116 - h, w * 2, h * 1.6);
    }
    /**
     * Feather all four edges to nothing.
     *
     * The horizontal ends are obvious. The **bottom** one is the one that
     * matters: the swells above are drawn with `lighter` and spill over the
     * last rows, so without this the band ends on a lit pixel row and draws a
     * ruled line straight across the frame at the height of the plane's
     * bottom edge. That line was visible from every rig.
     */
    ctx.globalCompositeOperation = 'destination-in';
    const ends = ctx.createLinearGradient(0, 0, 512, 0);
    ends.addColorStop(0, 'rgba(0,0,0,0)');
    ends.addColorStop(0.16, 'rgba(0,0,0,1)');
    ends.addColorStop(0.84, 'rgba(0,0,0,1)');
    ends.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ends;
    ctx.fillRect(0, 0, 512, 128);
    const rows = ctx.createLinearGradient(0, 128, 0, 0);
    rows.addColorStop(0, 'rgba(0,0,0,0)');
    rows.addColorStop(0.14, 'rgba(0,0,0,1)');
    rows.addColorStop(0.9, 'rgba(0,0,0,1)');
    rows.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rows;
    ctx.fillRect(0, 0, 512, 128);
    ctx.globalCompositeOperation = 'source-over';
  }
  const fireTex = paintedCanvasTexture(fireBand);
  // Repeat on x so the band can crawl sideways for ever; both ends are already
  // feathered to nothing, so the wrap has no seam in it.
  fireTex.wrapS = RepeatWrapping;
  fireTex.wrapT = ClampToEdgeWrapping;
  const fireMat = new MeshBasicMaterial({
    map: fireTex,
    color: 0xffa858,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: false,
  });
  const rimFire = new Mesh(new PlaneGeometry(44, 4.2, 1, 1), fireMat);
  rimFire.position.set(0.5, 1.3, -13);
  rimFire.renderOrder = -46;
  rimFire.name = 'rim-fire';
  group.add(rimFire);

  /**
   * A second band further back and **dimmer still**, so the fire has depth
   * rather than being one card standing in the dark.
   *
   * Its own material, not a shared one: a far band at the near band's strength
   * is the single fastest way to turn this scene into a light box — the two
   * add, and the sum is what the bloom sees.
   */
  const fireFarMat = fireMat.clone();
  fireFarMat.opacity = 0.2;
  fireFarMat.color.setHex(0xff8c46);
  const rimFireFar = new Mesh(new PlaneGeometry(66, 6, 1, 1), fireFarMat);
  rimFireFar.position.set(-1.5, 2.0, -22);
  rimFireFar.renderOrder = -47;
  rimFireFar.name = 'rim-fire-far';
  group.add(rimFireFar);

  // --------------------------------------------------------------- particles
  const k = low ? 0.4 : 1;

  /**
   * Embers in three depth bands, rising.
   *
   * Depth is what makes an effect read as air rather than as a decal: the far
   * band is small, slow and dim and sits behind the fighters; the mid band
   * crosses them; the near band is large, fast and in front of the lens. They
   * share an updraught, so the three never look like three unrelated systems —
   * and they all go **up**, which is the difference between a burning room and
   * a snowfall tinted orange.
   */
  const embersFar = new ParticleField(
    ParticlePresets.embers({
      count: Math.round(340 * k),
      bounds: { x: 22, y: 12, z: 16 },
      size: 3.6,
      opacity: 0.5,
      drift: [0.16, 0.5, 0],
      wobble: [0.5, 0.2, 0.35],
      wobbleSpeed: 1.0,
      twinkle: 0.85,
    }),
  );
  embersFar.position.set(1.0, 5.5, -14);

  const embersMid = new ParticleField(
    ParticlePresets.embers({
      count: Math.round(220 * k),
      bounds: { x: 13, y: 6.5, z: 8 },
      size: 6.5,
      opacity: 0.66,
      drift: [0.26, 0.86, 0],
      wobble: [0.55, 0.24, 0.4],
      wobbleSpeed: 1.5,
      twinkle: 0.9,
    }),
  );
  embersMid.position.set(0.6, 3.4, -2.6);

  const embersNear = new ParticleField(
    ParticlePresets.embers({
      count: Math.round(90 * k),
      bounds: { x: 10, y: 5.0, z: 4.2 },
      size: 14,
      opacity: 0.34,
      drift: [0.42, 1.25, 0],
      wobble: [0.85, 0.3, 0.5],
      wobbleSpeed: 1.9,
      twinkle: 0.95,
    }),
  );
  embersNear.position.set(0, 3.0, 4.4);

  /**
   * Pyreflies — deliberately sparse, and **red**.
   *
   * The bible's Dream's End pyreflies are white, and white is what they become
   * in the Yu Yevon phase when they stream inward. Here, inside Sin, the
   * pyreflies are carrying Jecht's thoughts and the room's colour with them, so
   * the preset's green/pink palette is replaced wholesale. A cloud of them
   * would be the Farplane; a dozen is a haunting.
   */
  const pyreflies = new ParticleField(
    ParticlePresets.pyreflies({
      count: Math.round(70 * k),
      bounds: { x: 9, y: 3.4, z: 5.5 },
      colors: [0xff5a48, 0xff9a70, 0xffe0c0, 0xffffff],
      size: 11,
      opacity: 0.85,
      drift: [0.06, 0.3, 0.02],
      wobble: [0.5, 0.2, 0.34],
      wobbleSpeed: 0.7,
      twinkle: 0.9,
    }),
  );
  pyreflies.position.set(1.2, 2.1, -2.2);

  /**
   * Floor glow: a flat sheet of tiny hard motes lying in the cracks. This is
   * the other half of the crack network — the sheet gives the broad seam glow,
   * and these are the individual sparks sitting in it, which is what stops the
   * floor being a static texture.
   */
  const seamSparks = new ParticleField({
    count: Math.round(130 * k),
    bounds: { x: 9.5, y: 0.12, z: 7 },
    colors: [0xffd9a0, 0xff7a2e, 0xffffff],
    size: 2.8,
    sizeJitter: 0.8,
    drift: [0, 0.03, 0],
    wobble: [0.05, 0.02, 0.05],
    wobbleSpeed: 0.4,
    twinkle: 1,
    opacity: 0.75,
    additive: true,
    hardness: 0.75,
  });
  seamSparks.position.set(0, 0.09, -1.4);

  const particles = [embersFar, embersMid, embersNear, pyreflies, seamSparks];
  for (const p of particles) group.add(p);

  // ------------------------------------------------ drifting Zanarkand ruins
  /**
   * Five fragments of Zanarkand, unattached, at mid-depth.
   *
   * These are the scene's signature and they earn their place three times over:
   * they break up the empty red middle of the frame, they put something with a
   * *hard edge* between the party and a painting made entirely of haze, and —
   * lit by the same rig as the floor — they are the proof that the 3D layer and
   * the painting share a light.
   *
   * Each is a cluster, never a single lump: a broad tilted mass with one or two
   * broken struts run through it at odd angles, which is what makes it read as
   * masonry torn out of a building rather than as an asteroid. They are placed
   * wide of both the party arc and the boss slot — a fragment on the same view
   * ray as a figure is a tangent from every rig on that side at once, and no
   * amount of nudging it in z separates them.
   *
   * They cast **no** shadows: a hard blob on the floor under a thing floating
   * ten units up is the single fastest way to flatten the depth this whole
   * scene is built to create.
   */
  const ruinColor = new Color(normaliseLuma(backdrop.palette.ground, 0.3))
    .lerp(new Color(0x4a3038), 0.4)
    .getHex();
  const strutColor = new Color(normaliseLuma(backdrop.palette.ground, 0.22))
    .lerp(new Color(0x3e2a30), 0.55)
    .getHex();

  const fragments: Fragment[] = [];
  const fragmentMeshes: Mesh[] = [];
  for (const [x, y, z, s, seed, struts] of [
    [-10.6, 5.6, -20, 1.5, 101, 2],
    [10.2, 6.4, -23, 1.7, 113, 2],
    [-6.9, 3.0, -13.5, 0.8, 127, 1],
    [7.2, 3.4, -16, 0.9, 139, 2],
    [13.4, 4.4, -26, 1.15, 151, 1],
  ] as Array<[number, number, number, number, number, number]>) {
    const node = new Group();
    node.name = 'ruin-fragment';
    node.position.set(x, y, z);

    const body = makeRock({
      size: s,
      color: ruinColor,
      // Wide and flat: a slab of arena floor torn loose, not a boulder.
      scale: [1.55, 0.46, 1.25],
      jitter: 0.3,
      seed,
      detail: 1,
      flatShading: true,
    });
    body.castShadow = false;
    body.receiveShadow = false;
    node.add(body);
    fragmentMeshes.push(body);

    // A lower shoulder, so the silhouette is never one clean ellipse.
    const shoulder = makeRock({
      size: s * 0.6,
      color: ruinColor,
      scale: [1.1, 0.62, 0.9],
      jitter: 0.36,
      seed: seed + 3,
      detail: 1,
      flatShading: true,
    });
    shoulder.castShadow = false;
    shoulder.receiveShadow = false;
    shoulder.position.set(s * 0.75, -s * 0.28, s * 0.2);
    shoulder.rotation.set(0.3, seed * 0.11, -0.2);
    node.add(shoulder);
    fragmentMeshes.push(shoulder);

    // Broken struts run through the mass at odd angles — the stadium's bones.
    for (let i = 0; i < struts; i++) {
      const strut = makeSlab(s * 0.22, s * 0.22, s * (2.1 + i * 0.5), strutColor);
      strut.castShadow = false;
      strut.position.set(
        (i === 0 ? -1 : 1) * s * 0.35,
        -s * 0.1,
        (i === 0 ? 0.3 : -0.4) * s,
      );
      strut.rotation.set(1.05 + i * 0.35, seed * 0.07 + i, 0.5 - i * 0.7);
      node.add(strut);
      fragmentMeshes.push(strut);
    }

    node.rotation.set((seed % 5) * 0.07, (seed % 7) * 0.4, ((seed % 3) - 1) * 0.16);
    group.add(node);
    fragments.push({
      node,
      baseY: y,
      bob: 0.16 + (seed % 5) * 0.04,
      bobSpeed: 0.1 + (seed % 4) * 0.018,
      spin: ((seed % 3) - 1 || 1) * 0.011,
      phase: (seed % 11) * 0.6,
      roll: 0.006 + (seed % 3) * 0.002,
    });
  }

  // ------------------------------------------------------------ floor rubble
  /**
   * Broken stone on the arena floor. Unlike the floaters these *do* cast, and
   * that is the point: their shadows and the party's are thrown by the same
   * key, from the same side, which is what welds the cut-outs to the ground.
   *
   * The two in the foreground are big, close and cut by the bottom edge, so the
   * empty lower corners have something in them and the tilt-shift band has
   * something to defocus.
   */
  const rubbleColor = new Color(normaliseLuma(backdrop.palette.ground, 0.33))
    .lerp(new Color(0x6e4a50), 0.28)
    .getHex();
  const rubble: Mesh[] = [];
  for (const [x, z, size, seed] of [
    [-6.6, -1.4, 0.42, 7],
    [1.2, -6.0, 0.6, 19],
    [7.4, -4.8, 0.52, 23],
    [-7.8, 2.4, 0.32, 31],
    [5.9, 1.8, 0.36, 37],
    [-3.6, -7.4, 0.46, 43],
    [9.0, -1.8, 0.4, 53],
    [-4.9, 3.6, 0.28, 61],
    // Foreground, cut by the bottom edge of the frame.
    [-4.0, 0.8, 0.9, 71],
    [4.4, 0.5, 0.82, 79],
  ] as Array<[number, number, number, number]>) {
    const rock = makeRock({
      size,
      color: rubbleColor,
      // Wide and low: a shard of floor, half sunk in the floor it came from.
      scale: [1.6, 0.44, 1.15],
      jitter: 0.36,
      seed,
      detail: 2,
      flatShading: true,
    });
    rock.position.set(x, -size * 0.34, z);
    rock.rotation.set((seed % 5) * 0.03, (seed % 7) * 0.43, ((seed % 3) - 1) * 0.05);
    group.add(rock);
    rubble.push(rock);
  }

  // ------------------------------------------------------------- light pools
  // A faint additive pool under each standing spot — the single cheapest trick
  // that stops a cut-out figure reading as a sticker on a painting. They are
  // warm here, not neutral: the floor under these three is on fire.
  const pools: Mesh[] = PARTY_SLOTS.slice(0, 3).map((s) => {
    const pool = makeLightPool({ color: 0xff8a46, radius: 1.35, opacity: 0.2 });
    pool.position.set(s[0]!, 0.02, s[2]!);
    return pool;
  });
  const bossPool = makeLightPool({ color: 0xffb060, radius: 2.1, opacity: 0.24 });
  bossPool.position.set(ENEMY_SLOTS[0]![0], 0.018, ENEMY_SLOTS[0]![2]);
  bossPool.name = 'enemy-pool';
  pools.push(bossPool);
  for (const p of pools) group.add(p);

  // ------------------------------------------------------------ dev hot-swap
  const watchEnabled = opts.watchAssets ?? Boolean(import.meta.env.DEV);
  let watcher: AssetWatcher | null = null;
  if (watchEnabled && backdrop.placeholder) {
    watcher = watchAssets([url], () => {
      void (async (): Promise<void> => {
        const next = await Backdrop.create(backdropOptions);
        emberHaze(next);
        const wasIn: Object3D | null = backdrop.group.parent;
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
    palette: { ...PALETTE },
    update(dt: number): void {
      clock += dt;
      backdrop.update(dt);
      lights.update(dt);
      for (const p of particles) p.update(dt);

      /**
       * The ruins drift. Very slowly, and never on the same beat: each one bobs
       * on its own period and yaws at its own rate, so five fragments never
       * pulse together and give the whole thing away as one sine wave.
       */
      for (const f of fragments) {
        f.node.position.y = f.baseY + Math.sin(clock * f.bobSpeed + f.phase) * f.bob;
        f.node.rotation.y += f.spin * dt;
        f.node.rotation.z = Math.sin(clock * f.bobSpeed * 0.7 + f.phase) * f.roll;
      }

      // The floor breathes with whatever is burning under it, and the boss pool
      // pulses on its own slower beat, so the bloom always has something living
      // in it.
      crackMat.opacity = 0.48 + Math.sin(clock * 0.55) * 0.08 + Math.sin(clock * 1.9) * 0.03;
      // The rim fire breathes on a slower, offset beat, and its texture crawls
      // sideways, so the brightest band in the frame is never a still image.
      fireMat.opacity = 0.32 + Math.sin(clock * 0.31 + 1.7) * 0.06;
      fireFarMat.opacity = 0.19 + Math.sin(clock * 0.23) * 0.04;
      fireTex.offset.x = (clock * 0.0075) % 1;
      (bossPool.material as { opacity: number }).opacity = 0.2 + Math.sin(clock * 0.8) * 0.06;
    },
    dispose(): void {
      watcher?.stop();
      for (const p of particles) p.dispose();
      for (const m of [
        ...pools,
        ...rubble,
        ...fragmentMeshes,
        cracks,
        cracksFar,
        rimFire,
        rimFireFar,
      ]) {
        m.geometry.dispose();
        (m.material as Material).dispose();
      }
      crackTex.dispose();
      fireTex.dispose();
      underlight.dispose();
      lights.dispose();
      backdrop.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
  return build;
};

export default buildDreamsEndScene;
