import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  ClampToEdgeWrapping,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  NoColorSpace,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  Vector3,
  type BufferGeometry,
  type Material,
  type Texture,
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
   * being hit — while the swing right leaves party slot 1 whole at the left
   * edge.
   *
   * "Whole" is the change. At `[0.25, …, 0.98]` the view axis crossed slot 1's
   * depth (z 0.3, 8.8 units along the axis) at x = 0.87, and at fov 32 on a
   * 16:9 frame the half-width there is 4.48 — a left edge at x = -3.61 against
   * a slot at -3.0 whose figure is ~0.45 wide and whose staff reaches further
   * still. That is 0.16 units of margin before `sway` spends any of it, and the
   * captures show exactly what it buys: Yuna cut off through the sleeve.
   *
   * Sliding the eye and the target left by the same 0.16–0.18 rotates nothing
   * and re-frames nothing — the axis lands on 0.69 instead, the left edge on
   * -3.79, and the margin roughly doubles to 0.34 with the boss's right side
   * still 2.2 units inside the opposite edge at his own greater depth.
   */
  action: { position: [0.08, 2.55, 9.1], lookAt: [0.8, 1.95, -1.2], fov: 32, sway: 0.7 },
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
/**
 * **Solved against the HUD safe area** (`docs/ENGINE-API.md#hud-safe-area`).
 * The FFX HUD's CTB queue starts at 0.843 of the canvas, so nothing on the
 * field may pass 0.79, and the old numbers broke that on both enemies at once:
 * Braska's Final Aeon ran to 0.878 and **`yu-pagoda-left` sat at 0.887..1.009**
 * — a whole destructible part drawn behind the queue and off the right edge of
 * the screen, in a fight whose entire tactic is "take the pillars"
 * (`docs/handoff/playability-round-1.md` §4 issue 3).
 *
 * This is the widest boss in the FFX half (0.31 of the frame), so pulling him
 * inside the rail takes both levers: 0.85 units left and 1.5 back. The depth is
 * what pays for most of it — it narrows him to 0.29 *and* lifts his feet from
 * 0.754 to 0.717, clear of the party-status panel's 0.684 top edge — and he
 * still opens the fight 0.29 wide by 0.52 tall, centred at 0.64.
 *
 * **2.05, not the 2.2 this was first solved to.** At 2.2 he measured 0.785 at
 * 1600x900 and 0.789 at 1920x1080 — inside the 0.79 rail, but by 0.001, which
 * is not a margin. He is the widest boss in the FFX half and the rail exists to
 * absorb exactly the sway-and-quad spread that 0.004 gap is a sample of, so he
 * takes the same 0.15-unit answer Chapter 1's boss and Chapter 4's did. It buys
 * 0.010 of frame — measured 0.779 at both 1600x900 and 1920x1080, against
 * 0.785/0.789 before — costs nothing in size or depth (still 0.288 wide), and
 * leaves the gutter to party slot 2 (which ends at 0.443) untouched.
 *
 * The two pagodas then read as what they are: a matched pair flanking him at
 * 0.482..0.567 and 0.674..0.755, both whole, instead of one visible pillar and
 * one rumour behind the HUD.
 */
const ENEMY_SLOTS: Array<[number, number, number]> = [
  [2.05, 0, -4.0], // boss      -> x 0.491..0.779, y 0.190..0.716 at `idle`
  [4.0, 0, -7.4], // right part -> x 0.674..0.755
  [0.6, 0, -6.0], // left/back  -> x 0.482..0.567
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

/**
 * A directional rim for one mesh, as an **offset additive shell**.
 *
 * The obvious way to rim the drifting ruins is a lamp that lights only them.
 * It does not work: `WebGLRenderer` tests a light's layers against the
 * *camera's*, not against each object's (`projectObject`:
 * `object.isLight && object.layers.test( camera.layers )`), so a lamp parked on
 * a private layer is dropped from the frame entirely and a lamp the camera can
 * see lights the floor and the rubble too. Anything strong enough to rim a rock
 * twenty units back blows out the ground the party is standing on.
 *
 * So the rim is drawn rather than lit. A copy of the same geometry, grown a few
 * percent and rendered **back faces only** with additive blending, shows up as
 * a band of light everywhere the enlarged silhouette spills past the real one —
 * the body's own opaque front faces occlude the rest of it. Shifting that copy
 * a little toward the light makes the band thick on the lit side and nothing on
 * the other, which is what turns an outline into a *rim*.
 *
 * `fog` is off deliberately. The haze here is a warm ember, and fogging an
 * additive surface mixes that colour in and then adds it, so distance would
 * make these brighter rather than fainter; depth is applied through `opacity`
 * by the caller instead.
 *
 * **`map` is the thing that stops this being an outline**, and it is not
 * optional. Offsetting the shell empties the arc *opposite* the light, but the
 * two arcs **perpendicular** to it get no separation at all — the offset has no
 * component across itself — so a uniform shell always leaves a constant-width
 * band running three-quarters of the way round the silhouette. Brightened, that
 * band is a stair-stepped ribbon of one value: ink.
 *
 * Multiplying the additive colour by the fragment's own masonry map fixes the
 * half the offset cannot reach. The band picks up the same mortar courses,
 * cracks and blotching as the surface it belongs to, so its value swings across
 * its own length (the canvas runs 0.14–1.0) and the eye reads *stone catching
 * the fire* instead of a line drawn round a shape. It is free: the shell
 * already shares `src.geometry`, and `emberStone` has already box-projected
 * that geometry's UVs by the time a shell is built off it.
 */
function rimShell(
  src: Mesh,
  color: number,
  opacity: number,
  offset: [number, number, number],
  grow: number,
  map: Texture,
): Mesh {
  const shell = new Mesh(
    src.geometry,
    new MeshBasicMaterial({
      color,
      map,
      transparent: true,
      opacity,
      blending: AdditiveBlending,
      depthWrite: false,
      side: BackSide,
      fog: false,
    }),
  );
  shell.scale.copy(src.scale).multiplyScalar(grow);
  shell.position.set(
    src.position.x + offset[0],
    src.position.y + offset[1],
    src.position.z + offset[2],
  );
  shell.rotation.copy(src.rotation);
  shell.castShadow = false;
  shell.receiveShadow = false;
  shell.name = 'ruin-rim';
  return shell;
}

/**
 * Ruined Zanarkand masonry, as one **tileable** 256px canvas.
 *
 * The drifting fragments were flat black polygons with a thin hot edge, and the
 * reason was not the light: it was that every facet was one uniform value, so a
 * shape whose whole job is to be the only *hard-edged* thing in a frame made of
 * haze had nothing inside its outline. A surface needs variation smaller than
 * its own facets before a light can describe it.
 *
 * Everything here is generated on a **periodic lattice**, so the canvas wraps
 * exactly and the UVs below can tile it at any scale without a seam:
 *
 *  - `grain` is four octaves of value noise: the broad blotching of weathered
 *    stone, and the layer that gives each facet its own value;
 *  - `vein` is *ridged* noise (`1 - |2n - 1|`, raised to a high power), which
 *    turns the noise's zero crossings into thin dark lines — mortar courses and
 *    hairline cracks, the thing that says "cut and laid" rather than "eroded";
 *  - `course` is a soft horizontal banding, warped by its own noise so the
 *    bands are not ruled lines: the stadium's stacked construction, surviving
 *    in a lump torn out of it.
 *
 * The canvas is kept **bright** (mean ≈ 0.85) on purpose. It is a multiplier
 * over the fragment's albedo, which is deliberately near-black so the floaters
 * stay behind the haze they hang in; a mid-grey map would halve that albedo
 * again and hand back the flat black shape this exists to fix. Bright map, dark
 * colour: the map contributes *variation*, the colour contributes value.
 */
function stoneCanvas(seed: number, size = 256): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const data = img.data;

  const hash = (x: number, y: number, s: number): number => {
    const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };

  /** Value noise on a lattice of `period` cells, wrapped — so the tile seams. */
  const noise = (u: number, v: number, period: number, s: number): number => {
    const x = u * period;
    const y = v * period;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const w = (i: number): number => ((i % period) + period) % period;
    const x0 = w(ix);
    const x1 = w(ix + 1);
    const y0 = w(iy);
    const y1 = w(iy + 1);
    const a = hash(x0, y0, s);
    const b = hash(x1, y0, s);
    const d = hash(x0, y1, s);
    const e = hash(x1, y1, s);
    return (a + (b - a) * sx) * (1 - sy) + (d + (e - d) * sx) * sy;
  };

  /** Octaves double the lattice period, so every octave wraps too. */
  const fbm = (u: number, v: number, period: number, s: number, octaves: number): number => {
    let sum = 0;
    let norm = 0;
    let amp = 1;
    let p = period;
    for (let i = 0; i < octaves; i++) {
      sum += noise(u, v, p, s + i * 37) * amp;
      norm += amp;
      amp *= 0.5;
      p *= 2;
    }
    return sum / norm;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const grain = fbm(u, v, 4, seed, 4);
      const vein = Math.pow(1 - Math.abs(fbm(u, v, 3, seed + 91, 3) * 2 - 1), 7);
      const course = 0.5 + 0.5 * Math.sin((v * 5 + fbm(u, v, 2, seed + 17, 2) * 0.55) * Math.PI * 2);

      let value = 0.87 + (grain - 0.5) * 0.44 + (course - 0.5) * 0.11 - vein * 0.52;
      // Per-pixel grit, under the noise: what keeps a facet from banding when
      // the tilt-shift pass softens everything around it.
      value += (hash(x * 1.7, y * 2.3, seed + 5) - 0.5) * 0.07;
      value = Math.max(0.14, Math.min(1, value));

      const i = (y * size + x) * 4;
      // Faintly warm, so the map never cools the oxblood it multiplies.
      data[i] = Math.min(255, Math.round(value * 255 * 1.04));
      data[i + 1] = Math.round(value * 255 * 0.95);
      data[i + 2] = Math.round(value * 255 * 0.89);
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/**
 * Box-project UVs onto a fragment's geometry, `tiles` tiles per local unit.
 *
 * `makeRock` builds an `IcosahedronGeometry`, whose UVs are the polyhedron's
 * spherical unwrap: it pinches at both poles and carries a seam down one side,
 * which on a stone texture shows up as a smeared band exactly where the
 * silhouette is. So the UVs are thrown away and re-derived **per triangle**
 * from the face's dominant axis — the projection stays square on whichever
 * plane the facet most faces, which is the whole trick behind box mapping and
 * is free of poles by construction.
 *
 * Writing per-triangle into a per-vertex attribute means **no vertex may be
 * shared between two faces**, or the second face's projection overwrites the
 * first's and the texture shears across whichever triangle lost. That is why
 * {@link emberStone} un-indexes anything indexed before calling this:
 * `IcosahedronGeometry` is already non-indexed, but the `CylinderGeometry`
 * behind `makeSlab` shares a column of vertices between every pair of adjacent
 * side faces — exactly the case that breaks.
 *
 * Scale lives here rather than on the texture's `repeat`, so one shared canvas
 * can tile at a different density on every mesh.
 */
function stoneUVs(geo: BufferGeometry, tiles: number): void {
  const pos = geo.getAttribute('position');
  const index = geo.getIndex();
  const count = index ? index.count : pos.count;
  const uv = new Float32Array(pos.count * 2);
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const e1 = new Vector3();
  const e2 = new Vector3();
  const n = new Vector3();

  const write = (i: number, p: Vector3, axis: number): void => {
    // 0: the facet faces +/-y, so it is mapped in x/z; 1: +/-x, mapped z/y;
    // 2: +/-z, mapped x/y.
    const u = axis === 0 ? p.x : axis === 1 ? p.z : p.x;
    const v = axis === 0 ? p.z : p.y;
    uv[i * 2] = u * tiles;
    uv[i * 2 + 1] = v * tiles;
  };

  for (let t = 0; t + 2 < count; t += 3) {
    const i0 = index ? index.getX(t) : t;
    const i1 = index ? index.getX(t + 1) : t + 1;
    const i2 = index ? index.getX(t + 2) : t + 2;
    a.fromBufferAttribute(pos, i0);
    b.fromBufferAttribute(pos, i1);
    c.fromBufferAttribute(pos, i2);
    n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a));
    const nx = Math.abs(n.x);
    const ny = Math.abs(n.y);
    const nz = Math.abs(n.z);
    const axis = ny >= nx && ny >= nz ? 0 : nx >= nz ? 1 : 2;
    write(i0, a, axis);
    write(i1, b, axis);
    write(i2, c, axis);
  }
  geo.setAttribute('uv', new BufferAttribute(uv, 2));
}

/** The textures every ruin fragment shares. */
interface StoneSkin {
  /** Albedo: the tileable masonry canvas, sRGB. */
  map: Texture;
  /** The same canvas read as a height field — linear, or it self-flattens. */
  bump: Texture;
}

/**
 * Re-shade a `makeRock` / `makeSlab` mesh so the fire can actually land on it.
 *
 * Three things, and the scene needs all three:
 *
 *  - **Phong, not Lambert.** Lambert returns `albedo x N·L` and nothing else,
 *    and at the near-black albedo this stone needs, every facet from the lit
 *    side to the turned-away one lands within a couple of values. A broad, dim,
 *    warm specular (low `shininess`, so the highlight spreads across a whole
 *    facet instead of pin-pointing) is what lets a face angled toward the fire
 *    pick up its own ember value.
 *  - **A map.** Without one a facet is a single value however it is lit, and
 *    the mass reads as a paper cut-out no matter how good the rim is.
 *  - **A bump.** The same canvas as a height field puts relief *inside* the
 *    facets, so the key breaks up across each face rather than sliding over it.
 *    It costs one extra sampler and it is the difference between painted-on
 *    stone and stone. Flat shading and bump coexist: three takes the facet
 *    normal from screen-space derivatives and the bump perturbs that.
 *
 * `emissive` is the floor under all of it — a deep ember, modulated by the same
 * map so the veins stay dark. The undersides of a thing floating ten units up
 * are reachable by no lamp in the rig, and a belly at literal zero is a hole
 * cut in the painting; this is the smallest lift that keeps it stone.
 */
function emberStone(
  mesh: Mesh,
  skin: StoneSkin,
  tiles: number,
  specular: number,
  shininess: number,
): void {
  // `makeRock` and `makeSlab` both build Lambert, which is what this reads and
  // then throws away; anything else handed in would lose its map here.
  const old = mesh.material as MeshLambertMaterial;

  // Box projection is per face, so every face needs its own vertices — see
  // {@link stoneUVs}. `makeSlab`'s cylinder is indexed and shares them.
  let geo = mesh.geometry as BufferGeometry;
  if (geo.getIndex()) {
    const unshared = geo.toNonIndexed();
    geo.dispose();
    mesh.geometry = unshared;
    geo = unshared;
  }
  stoneUVs(geo, tiles);
  const next = new MeshPhongMaterial({
    color: old.color.clone(),
    map: skin.map,
    bumpMap: skin.bump,
    bumpScale: 0.42,
    emissive: new Color(0x2e0d07),
    emissiveMap: skin.map,
    flatShading: true,
    specular,
    shininess,
  });
  old.dispose();
  mesh.material = next;
}

/** One drifting ruin, and the numbers its idle motion is driven from. */
interface Fragment {
  node: Group;
  baseX: number;
  baseY: number;
  baseZ: number;
  bob: number;
  bobSpeed: number;
  /** Lateral wander, in world units — see the note on the update loop. */
  drift: number;
  driftSpeed: number;
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
  const underlight = new DirectionalLight(0x8e1a22, low ? 0.55 : 0.78);
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
   *
   * **No entry in that list may be neutral**, and the two that were are the
   * one thing in this frame that had to be fixed at true exposure rather than
   * in a brightened crop. A quarter of the motes were literally `0xFFFFFF` and
   * another quarter `0xFFE0C0`, at `size` 11 and opacity 0.85 — and a neutral
   * white disc a dozen pixels across, in a frame where *every* other pixel
   * carries red, does not read as a spirit light. It reads as dust on the lens
   * or a dead pixel, which is exactly what a 1:1 crop of the sky showed: two
   * hard white dots sitting off the ruins like sensor faults.
   *
   * `#FFB98C` and `#FFCD9E` keep the tier structure the list is for — these are
   * still the brightest, palest motes, and they still separate from the deep
   * `#FF5A48` ones — while leaving the highlight *in the frame's own hue
   * family*. Nothing else changes: same count, same size, same twinkle. It is a
   * two-hex fix and it is the difference between a haunting and a dirty lens.
   */
  const pyreflies = new ParticleField(
    ParticlePresets.pyreflies({
      count: Math.round(70 * k),
      bounds: { x: 9, y: 3.4, z: 5.5 },
      colors: [0xff5a48, 0xff9a70, 0xffcd9e, 0xffb98c],
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
  /**
   * The fragments are painted dark and **warm**, and the warmth is the half
   * that matters.
   *
   * Two things were wrong with the first pass. The value was the rubble's 0.30,
   * which is far too bright for a mass twenty units back through the same haze
   * the party is standing in front of — it put the floaters *in front of* the
   * clouds they are supposed to hang among. And the hue was pulled toward a
   * mauve, which desaturates the one thing the key has to work with: with no
   * red left in the albedo, a hot orange key lands as flat grey and every facet
   * comes out the same value.
   *
   * 0.19 over a dark oxblood fixes both. The key-facing facets go ember, the
   * facets turned away fall to near-black, and the fragment describes itself
   * before the rim shells are asked to do anything.
   */
  /**
   * The two values are lifted a little from the first pass's 0.19/0.12 because
   * the albedo is now multiplied by {@link stoneCanvas}, whose mean is ≈0.85:
   * the product lands back on the value the framing was approved at, and the
   * 0.14–1.0 range of the map is what the fire now has to model.
   */
  const ruinColor = new Color(normaliseLuma(backdrop.palette.ground, 0.23))
    .lerp(new Color(0x3a1c18), 0.45)
    .getHex();
  const strutColor = new Color(normaliseLuma(backdrop.palette.ground, 0.15))
    .lerp(new Color(0x2a1210), 0.55)
    .getHex();

  /**
   * One canvas, two textures, shared by every mesh in every fragment.
   *
   * The bump copy is a **second** `CanvasTexture` over the same canvas rather
   * than the albedo reused: `paintedCanvasTexture` marks its output sRGB, which
   * is right for a colour map and wrong for a height field — read through the
   * sRGB transfer the mid greys land far too low and the relief flattens out.
   * A second texture object costs one upload of a 256px image.
   */
  const stone = stoneCanvas(419);
  const stoneMap = paintedCanvasTexture(stone);
  stoneMap.wrapS = stoneMap.wrapT = RepeatWrapping;
  const stoneBump = paintedCanvasTexture(stone);
  stoneBump.colorSpace = NoColorSpace;
  stoneBump.wrapS = stoneBump.wrapT = RepeatWrapping;
  const skin: StoneSkin = { map: stoneMap, bump: stoneBump };

  const fragments: Fragment[] = [];
  const fragmentMeshes: Mesh[] = [];
  /**
   * Placed against the **boss's projected silhouette**, not by eye.
   *
   * At the first pass's positions three of the five landed on top of Braska's
   * Final Aeon at the idle rig — one of them entirely inside his outline,
   * behind the horns, and another kissing the top of his head with six pixels
   * between them. A floater drawn over a boss does not read as depth; it reads
   * as clutter stuck to him, and a near-miss tangent is the worst version of it
   * because the eye keeps trying to resolve which shape owns the edge.
   *
   * The boss occupies roughly x 810–1375, y 230–690 across `idle` and `action`
   * together. These five clear that box at both rigs: two wide left, one high
   * over the stadium, one lifted above the horns, and one outside his right
   * shoulder. `intro` is wider than either and inherits the clearance.
   */
  /**
   * The last number is the fragment's **tilt**, and it is not decoration.
   *
   * Every one of these floats above the camera's eye-line, so what the frame
   * actually sees is their *undersides* — and an untilted slab presents the eye
   * one unbroken downward face, which the key (high, from the right) can never
   * reach at all. Rolling each one 20-35 degrees swings a strip of its top and
   * its broken side edge into view, and those are the faces the fire lands on.
   * It is the difference between a lit rock and a hole in the sky, and it costs
   * one number per fragment.
   */
  for (const [x, y, z, s, seed, struts, tilt] of [
    [-10.6, 5.6, -20, 1.5, 101, 2, 0.46],
    [10.6, 7.6, -23, 1.7, 113, 2, -0.34],
    [-6.9, 3.0, -13.5, 0.8, 127, 1, 0.3],
    [-3.2, 5.6, -18, 0.9, 139, 2, -0.5],
    [17.5, 5.9, -26, 1.15, 151, 1, 0.38],
  ] as Array<[number, number, number, number, number, number, number]>) {
    const node = new Group();
    node.name = 'ruin-fragment';
    node.position.set(x, y, z);

    const body = makeRock({
      size: s,
      color: ruinColor,
      /**
       * Wide and flat: a slab of arena floor torn loose, not a boulder — but
       * not as flat as the first pass made it. At `detail: 1` an icosahedron
       * squashed to 0.46 has so few facets left that the jitter resolves into
       * two long converging edges and the silhouette reads as a dart. Half a
       * subdivision more and a little more thickness give it the stepped,
       * chunky profile that says masonry.
       */
      scale: [1.42, 0.55, 1.2],
      /**
       * Dropped from 0.34. At a third of the radius the per-vertex jitter is
       * large enough to push neighbouring vertices past each other, and the
       * silhouette stops being a slab with broken corners and becomes a
       * **cog** — a ring of alternating spikes and notches that reads as torn
       * paper the moment anything outlines it. A quarter of that breaks the
       * icosahedron's regularity without inventing teeth — and not less, or the
       * slab smooths back into a lozenge and reads as a blimp.
       */
      jitter: 0.26,
      seed,
      detail: 2,
      flatShading: true,
    });
    body.castShadow = false;
    body.receiveShadow = false;
    /**
     * `1.25 / s` is "about two and a half tiles across the mass" whatever the
     * fragment's size — the UVs are box-projected from *local* coordinates, so
     * the tile density has to be divided back out by the size the icosahedron
     * was built at or the big floaters would wear a coarser stone than the
     * small ones standing next to them.
     */
    /**
     * The specular is raised from `#8A3A1C`/6 as the rim shell is cut back:
     * the two are the same budget spent in different places, and this is the
     * place that has falloff. A brighter, slightly tighter warm highlight
     * (shininess 6 -> 11 still spreads across most of a facet — this is
     * weathered stone, not polish) lets the key pick key-facing faces out of
     * the mass on its own, with an intensity that falls off as the facet turns
     * away. An additive shell cannot do that at any width.
     */
    emberStone(body, skin, 1.25 / s, 0xa84a22, 11);
    node.add(body);
    fragmentMeshes.push(body);

    // A lower shoulder, so the silhouette is never one clean ellipse.
    const shoulder = makeRock({
      size: s * 0.6,
      color: ruinColor,
      scale: [1.1, 0.62, 0.9],
      jitter: 0.22,
      seed: seed + 3,
      detail: 2,
      flatShading: true,
    });
    shoulder.castShadow = false;
    shoulder.receiveShadow = false;
    emberStone(shoulder, skin, 1.25 / (s * 0.6), 0xa84a22, 11);
    shoulder.position.set(s * 0.75, -s * 0.28, s * 0.2);
    shoulder.rotation.set(0.3, seed * 0.11, -0.2);
    node.add(shoulder);
    fragmentMeshes.push(shoulder);

    /**
     * A stub of **seating tier** on the two big fragments: two shallow plates,
     * each narrower than the one under it, sitting on the slab's tilted top.
     *
     * This is the one thing that makes these Zanarkand rather than debris. A
     * lump of rock with a beam through it is a meteor; a lump of rock with two
     * concentric steps on it is a piece of a *stadium*, because nothing in
     * nature stacks like that. They are deliberately tiny against the mass —
     * enough to catch the key on a horizontal face and throw two straight
     * shadow lines across a body made entirely of irregular ones.
     */
    if (struts > 1) {
      for (let i = 0; i < 2; i++) {
        const tier = makeSlab(s * (1.0 - i * 0.34), s * (0.78 - i * 0.26), s * 0.1, ruinColor);
        // Tighter than the mass it sits on: the steps are small, and stone at
        // the same tile density on both would make them read as one lump.
        emberStone(tier, skin, 1.9 / s, 0xa84a22, 11);
        tier.castShadow = false;
        tier.receiveShadow = false;
        tier.position.set(-s * 0.1, s * (0.2 + i * 0.11), s * 0.05);
        tier.rotation.set(0.06, seed * 0.21, -0.05);
        node.add(tier);
        fragmentMeshes.push(tier);
      }
    }

    /**
     * Broken struts run through the mass at odd angles — the stadium's bones.
     *
     * Short and thin. The first pass ran them out to 2.1x the fragment's own
     * radius, and at that length a strut stops reading as a snapped beam and
     * starts reading as a *spar*: the whole silhouette turns into a spaceship.
     * 1.25 keeps the beam inside the mass it was torn out of, which is what
     * says "this was a building".
     */
    for (let i = 0; i < struts; i++) {
      const strut = makeSlab(s * 0.15, s * 0.15, s * (1.25 + i * 0.3), strutColor);
      /**
       * The struts are dressed too, and at a much finer tile: they are thin
       * enough that two or three courses have to fit across one, and a bare
       * Lambert beam left among textured masses is the one black shape the eye
       * goes straight to.
       */
      emberStone(strut, skin, 5.5 / s, 0x6e2c16, 8);
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

    /**
     * The rim itself: one band, hot, on the side the key and the painting's
     * fire are on. Only the two rock masses get a shell — a shell on a strut
     * reads as a glowing wire, and the struts sit inside the silhouette the
     * masses already draw.
     *
     * Depth is applied here, not through fog: the far fragments are dimmer by
     * the same ratio the haze would have dimmed them, so the five read as five
     * distances rather than as five stickers at one distance.
     *
     * **This is the one element in the scene that has to be under-done.** The
     * first pass ran a wide band (`grow` 1.07, opacity 0.28) in near-white
     * orange, plus a cold blue one on the far side, and both came out as flat
     * strips of uniform brightness taped around the shape: the shell is drawn
     * by a `MeshBasicMaterial`, so its band has no falloff and reads as ink,
     * not as light. On top of that the renderer runs without MSAA, so a band
     * that bright against a near-black sky stair-steps along every facet edge
     * and looks like a rendering fault. Halving the opacity, pulling the colour
     * from `#FF9142` down to a deep ember and tightening the growth to 1.045
     * leaves a glow narrow enough to sit under the bloom threshold, and the
     * *modelling* — which is now `emberStone`'s job, not the shell's — is what
     * describes the rock. The cold side was dropped outright: against this
     * frame, blue additive over near-black is the pale edge that made these
     * look like cut-out paper.
     */
    /**
     * The tilt is applied **before** the rim shells are built, because they
     * need to know which way the fragment is facing — see below.
     */
    node.rotation.set(tilt, (seed % 7) * 0.4, ((seed % 3) - 1) * 0.16);

    const depthFade = Math.max(0.35, 1 - (Math.abs(z) - 13) / 26);
    /**
     * Where the key is, as a direction — `LightRig`'s `keyFrom` normalised.
     *
     * This is the fix for the thing that made the shells read as outlines
     * rather than as rims. `rimShell`'s offset is in the **fragment's** frame,
     * and every fragment is yawed by up to 2.4 radians, so a hard-coded `+x`
     * offset pointed somewhere different on each one — on the worst of the five
     * it pointed nearly at the camera, which spreads the band evenly around the
     * whole silhouette and draws exactly the pale ink line the first pass was
     * fighting. Rotating the world-space key direction *into* the node's frame
     * puts the band back on the side the fire is on, whatever the node's own
     * rotation is.
     */
    const toKey = new Vector3(9.6, 6.4, -3.4).normalize();
    const intoNode = node.quaternion.clone().invert();
    for (const [m, r] of [
      [body, s],
      [shoulder, s * 0.6],
    ] as Array<[Mesh, number]>) {
      /**
       * Three numbers, and they only make sense read together: opacity 0.18,
       * offset `0.22r` along the key, growth **1.016**.
       *
       * The shell is deliberately **smaller than it has ever been**, and the
       * reason is that it is no longer doing the job it was invented for. It
       * was added when the fragments were untextured Phong over a near-black
       * albedo — shapes with nothing inside their outline, where the band was
       * the only thing describing the rock. With {@link stoneCanvas} on the
       * albedo and the bump, and the specular below raised to let the fire pick
       * out key-facing facets, the *modelling* is the material's work. Anything
       * the shell adds past a hint is now a second, competing edge.
       *
       * And a shell is bad at being an edge, structurally: a `MeshBasicMaterial`
       * has no falloff, so the band is one flat value across its whole width,
       * and its width in screen space grows wherever the silhouette is oblique
       * to the camera. A 7x crop of the middle floater at the previous 1.024
       * showed exactly that — a pale wedge along its broken right side, wider
       * than the facets it sat on, reading as a torn paper flap rather than as
       * light. Backing the growth off to 1.016 caps the band at `0.029r` of the
       * body's largest world half-extent, which is a line rather than a wedge
       * at any obliquity.
       *
       * That width has to be read in *world* space, which is the part every
       * earlier pass got wrong. A fragment is tilted and yawed, so its thin
       * local axis (y, half-extent `0.55r`) does not stay vertical, and the
       * band the grow spills past the silhouette can be `(grow - 1)` times the
       * body's *largest* world half-extent — `1.79r` once `makeRock`'s 0.26
       * jitter is counted — in any screen direction at all. 1.05 meant `0.09r`,
       * 1.03 meant `0.054r`, 1.024 meant `0.043r`; 1.016 means `0.029r`.
       *
       * The offset sets **how much of the perimeter** that band survives on.
       * `0.22r` along the key resolves to `0.176r` horizontally and `0.117r`
       * vertically, both many times `0.029r`, so the arc facing away from the
       * fire is not merely dim but empty whatever the fragment's rotation is.
       *
       * What neither number can fix is the two arcs **perpendicular** to the
       * key, because an offset has no component across itself. That is what
       * {@link rimShell}'s `map` is for: the surviving band picks up the same
       * mortar courses as the stone under it, so its value swings along its own
       * length. A ribbon of one value is ink; a ribbon that breaks where the
       * stone breaks is a lit edge.
       *
       * 0.18 through a map whose mean is ≈0.85 peaks well under the bloom
       * threshold, which is the real ceiling: past it the band blooms and the
       * un-antialiased facet edges stair-step.
       */
      const off = toKey.clone().multiplyScalar(r * 0.22).applyQuaternion(intoNode);
      const hot = rimShell(m, 0xe0621f, 0.18 * depthFade, [off.x, off.y, off.z], 1.016, skin.map);
      node.add(hot);
      fragmentMeshes.push(hot);
    }

    group.add(node);
    fragments.push({
      node,
      baseX: x,
      baseY: y,
      baseZ: z,
      bob: 0.16 + (seed % 5) * 0.04,
      bobSpeed: 0.1 + (seed % 4) * 0.018,
      /**
       * Kept under a third of a unit, and that ceiling is not timidity: the
       * five positions above are solved against the boss's projected
       * silhouette, and a floater that wanders a metre would walk back into the
       * box they were moved out of.
       */
      drift: 0.18 + (seed % 4) * 0.035,
      driftSpeed: 0.055 + (seed % 5) * 0.009,
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
    /**
     * Two more, **much** closer and much bigger, in the bottom corners.
     *
     * Everything above sits on the arena floor at mid-depth, and at a camera
     * this level that whole band compresses into a strip around the fighters'
     * feet — which left the bottom corners of every rig as flat black nothing,
     * and left the tilt-shift's near band with no subject at all (a defocus
     * over an empty gradient is invisible, so the scene was paying for the pass
     * and getting nothing back).
     *
     * These two are in front of the party's own z, outside its x, and low
     * enough that the frame cuts them: a cut-off shape at the edge reads as
     * *foreground* the instant it appears, which is what gives the shot a near
     * plane, a middle and a far one rather than figures on a backdrop. They are
     * kept clear of the lower-left quadrant the command window fills.
     */
    [-7.4, 5.4, 1.35, 83],
    [7.2, 4.6, 1.2, 89],
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
  /**
   * `squash: 1` is load-bearing here, and it is the second thing the first pass
   * got wrong.
   *
   * `makeLightPool` squashes to 0.62 in z by default, which is the right shape
   * for a rig that looks *down* at the floor — the squash cancels the
   * foreshortening and the pool comes out round on screen. This scene's rigs are
   * almost level on purpose, so the floor is already foreshortened to nearly
   * nothing, and squashing it again collapsed the enemy pool into a horizontal
   * **bar** with a hard top edge lying across the frame behind the boss. It was
   * the most obvious seam in the shot and it was not a seam at all.
   *
   * Round on the ground, spread wider and dimmed to compensate for the extra
   * area, it goes back to being a glow the boss is standing in.
   */
  const pools: Mesh[] = PARTY_SLOTS.slice(0, 3).map((s) => {
    const pool = makeLightPool({ color: 0xff8a46, radius: 1.5, opacity: 0.16, squash: 1 });
    pool.position.set(s[0]!, 0.02, s[2]!);
    return pool;
  });
  const bossPool = makeLightPool({ color: 0xffb060, radius: 2.9, opacity: 0.15, squash: 1 });
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
        /**
         * Lateral drift, on a slower period than the bob and a third of one out
         * of phase with it. Bobbing alone is a float; a mass that also slides,
         * and slides on a beat that never lines up with the one it rises on, is
         * a mass with nothing holding it — which is the thing about these
         * fragments the whole scene is built around.
         */
        f.node.position.x = f.baseX + Math.sin(clock * f.driftSpeed + f.phase) * f.drift;
        f.node.position.z = f.baseZ + Math.cos(clock * f.driftSpeed * 0.63 + f.phase) * f.drift * 0.6;
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
      (bossPool.material as { opacity: number }).opacity = 0.14 + Math.sin(clock * 0.8) * 0.04;
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
      stoneMap.dispose();
      stoneBump.dispose();
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
