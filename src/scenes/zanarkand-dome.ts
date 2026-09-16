import {
  AdditiveBlending,
  CanvasTexture,
  ClampToEdgeWrapping,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  NoColorSpace,
  PlaneGeometry,
  PointLight,
  Scene,
  Vector3,
  type Material,
  type PerspectiveCamera,
  type Texture,
} from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import { BattleCamera, type CameraRig } from '../engine/BattleCamera.ts';
import { makePillar } from '../engine/Diorama.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import {
  artUrl,
  normaliseLuma,
  paintedCanvasTexture,
  watchAssets,
  type AssetWatcher,
} from '../engine/PaintedArt.ts';
import { ParticleField, ParticlePresets } from '../engine/Particles.ts';
import { radialCanvas } from '../engine/ProceduralArt.ts';
import { ScenePalettes } from '../engine/ScenePalettes.ts';
import type { BackdropPalette } from '../engine/Backdrop.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import type { AssetReport, PaintedScene } from './demo.ts';
import type { SceneSlots } from './index.ts';
import {
  mountScene,
  type SceneBuild,
  type SceneBuildOptions,
  type SceneFactory,
  type SceneRigName,
} from './types.ts';

// ---------------------------------------------------------------------------
// Framing
// ---------------------------------------------------------------------------

/**
 * The camera the parallax stack and the backdrop framing are solved for —
 * identical to the `idle` rig's position (see "Framing the backdrop" in
 * `docs/ENGINE-API.md`).
 */
const CAMERA_REF: [number, number, number] = [0, 2.55, 9.8];

/**
 * Backdrop plane, solved for `idle` and checked against all seven rigs. See the
 * "Framing maths" block inside the factory for where these three numbers come
 * from and what they cost.
 */
const BACKDROP = { width: 82, distance: -56, centreY: -4 } as const;

/**
 * Zanarkand Dome rigs.
 *
 * Two constraints shape every number here, and they pull against each other.
 *
 * 1. **The visual bible's money shot is axial** (§2.2: "camera on the hall's
 *    centre axis, the two pillar rows converging on the dais"). So is FFX's own
 *    framing for this fight.
 * 2. **A flat painting cannot be panned off.** The matte fills the frame at its
 *    own depth for the `idle` rig; every degree of extra *yaw or pitch* (as
 *    opposed to a dolly) swings frame edge past the edge of the plane. The
 *    painting is a 7:4 image displayed at a 16:9 frame aspect, so it covers the
 *    idle frame with only a few percent to spare in both axes — there is no
 *    slack to spend.
 *
 * So the rigs differ mostly by **dolly and height**, and only slightly by
 * look-at, and the plane is sized (82 wide at z = -56) so that the **worst**
 * rig leaves under 5% of one frame edge uncovered. That last 5% is caught by
 * the near-black `background`, by the two foreground pillars that bracket the
 * frame, and by the palette's vignette.
 *
 * `yunalesca` is the low dramatic angle the brief asks for, and it is built
 * from *height* rather than from tilt: the camera drops to a metre off the wet
 * floor and stays almost level, because a steep tilt-up is exactly the move a
 * flat backdrop cannot survive. From down there a 2.9-unit boss fills the frame
 * from a tenth to two thirds of its height and the party crowds the left edge —
 * the composition the bible's money shot 2 is after, without the black band a
 * real tilt-up would put across the top.
 */
const RIGS: Record<SceneRigName, CameraRig> & Record<string, CameraRig> = {
  // Establishing: the processional, straight down the hall's axis.
  intro: { position: [0, 3.05, 14.2], lookAt: [0.3, 2.45, -2.0], fov: 30, sway: 1.5 },
  idle: { position: CAMERA_REF, lookAt: [0.35, 1.9, -1.2], fov: 32 },
  // Pushed in and nudged toward the dais, but still holding the attacker
  // (mid-lunge around x 0.4) inside the left half of the frame.
  action: { position: [0.35, 2.28, 8.3], lookAt: [1.0, 1.8, -1.4], fov: 32, sway: 0.7 },
  // Moved right with the party arc (see {@link PARTY_SLOTS}). Both of the
  // party-side rigs swing the view axis left, so they are the two that cost the
  // painting plane the most margin; walking them 1.15 units back toward the
  // hall's axis hands some of that margin back.
  party: { position: [0.6, 2.15, 8.1], lookAt: [-0.3, 1.5, 0.7], fov: 32, sway: 0.7 },
  enemy: { position: [0.7, 2.25, 7.6], lookAt: [1.9, 1.95, -2.0], fov: 32, sway: 0.7 },
  /** The Yunalesca angle: low on the floor, tilted up at the dais. */
  yunalesca: { position: [0.7, 1.0, 6.2], lookAt: [2.05, 1.2, -2.4], fov: 30, sway: 0.5 },
  victory: { position: [0.65, 2.1, 8.3], lookAt: [-0.25, 1.55, 0.9], fov: 32, sway: 1.2 },
};

/**
 * Three active slots in the FFX arc — front to back, staggered left — then four
 * reserve slots parked well outside every rig's frustum, frame-left.
 *
 * The active arc sits left of the hall's axis on purpose: the glowing sphere is
 * in the painting's lower-left quadrant, so the party stands *in front of* it
 * and reads as three backlit silhouettes with a gold edge — which is also why
 * the actors are handed a gold bounce and a cold violet rim.
 *
 * **In front of the sphere, not on it.** The painted sphere's disc — measured
 * off `public/art/backdrops/zanarkand-dome.png` — runs u 0.09..0.38 and
 * v 0.62..0.90 of the image, which at the `idle` rig projects to the frame's
 * bottom-left corner: screen x 0..0.31, y 0.72..1.0. The arc used to sit far
 * enough left that the middle slot's boots landed inside that disc, and the one
 * bright thing in the lower half of the painting was cut in half by a pair of
 * feet. Every slot here is shifted right until the *widest* figure's silhouette
 * clears x 0.31 with room to spare — the middle slot, the leftmost of the
 * three, now stands at screen x ≈ 0.35. The arc keeps its shape and stays
 * inside the command window's quarter of the frame. The `party` and `victory`
 * rigs moved with it (see {@link RIGS}); nothing else in the scene is keyed to
 * these positions.
 */
const PARTY_SLOTS: Array<[number, number, number]> = [
  [-0.15, 0, 1.8],
  [-1.1, 0, 0.75],
  [0.2, 0, -0.75],
  // reserve
  [-11.6, 0, 2.8],
  [-12.5, 0, 1.2],
  [-13.4, 0, -0.4],
  [-14.3, 0, -2.0],
];

/**
 * Enemy slots: the boss on the dais centre-right, plus two flanking slots for
 * the parts a multi-part boss puts on the field (Yunalesca's serpent coils, a
 * Mortiorchis-style mount, Dark Bahamut's wings).
 */
const ENEMY_SLOTS: Array<[number, number, number]> = [
  [2.95, 0, -2.9],
  [5.1, 0, -1.8],
  [1.0, 0, -4.4],
];

/**
 * The scene's default cut-out protection for a painted actor parked on
 * {@link SceneBuild.enemySlots}.
 *
 * Boss art is generated **full-bleed** — the aura runs off every side of the
 * PNG — so without this the "cut-out" ends on the plane's own rectangle.
 * `matte: 'force'` removes the white studio background the border flood fill
 * can reach; `edgeFade` feathers whatever painted aura is still touching the
 * border, so the plane edge reads as atmosphere rather than as a frame; and
 * `alphaCut` stays *low*, because a high cut re-hardens the tail of the feather.
 *
 * ```ts
 * const boss = await PaintedActor.fromSubject('seymour-flux', {
 *   ...ZANARKAND_DOME_ENEMY_ACTOR_DEFAULTS,
 *   worldHeight: ZANARKAND_DOME_HEIGHTS.boss,
 * });
 * ```
 */
export const ZANARKAND_DOME_ENEMY_ACTOR_DEFAULTS = {
  matte: { mode: 'force' as const },
  edgeFade: 0.2,
  alphaCut: 0.04,
} as const;

/** Canonical world heights for this location. */
export const ZANARKAND_DOME_HEIGHTS = {
  party: 1.78,
  /** Yunalesca form 3 towers; a stand-in boss uses the same figure. */
  boss: 2.9,
} as const;

/** The slot table {@link SCENES} in `./index.ts` stages fighters against. */
export const ZANARKAND_DOME_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.slice(0, 3).map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: ZANARKAND_DOME_HEIGHTS.party,
  enemyHeight: ZANARKAND_DOME_HEIGHTS.boss,
};

// ---------------------------------------------------------------------------
// Procedural textures owned by this scene
// ---------------------------------------------------------------------------

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/**
 * One godray: bright at the top where it leaves the oculus, feathered on both
 * sides, dying out before it reaches the floor. Drawn into alpha only — the
 * plane's material carries the colour, so all three shafts share one texture.
 */
function beamCanvas(softness = 0.34): HTMLCanvasElement {
  const w = 256;
  const h = 512;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d')!;
  // Vertical falloff: a shaft is brightest where it enters and fades as it
  // spreads, so the bottom end never draws a hard line on the floor.
  const v = ctx.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0, 'rgba(255,255,255,0)');
  v.addColorStop(0.06, 'rgba(255,255,255,0.95)');
  v.addColorStop(0.42, 'rgba(255,255,255,0.55)');
  v.addColorStop(0.78, 'rgba(255,255,255,0.16)');
  v.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  // Horizontal feather, multiplied in.
  ctx.globalCompositeOperation = 'destination-in';
  const hg = ctx.createLinearGradient(0, 0, w, 0);
  hg.addColorStop(0, 'rgba(0,0,0,0)');
  hg.addColorStop(softness, 'rgba(0,0,0,1)');
  hg.addColorStop(1 - softness, 'rgba(0,0,0,1)');
  hg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

/**
 * The wet floor.
 *
 * Not a stone texture: a *mirror*. Standing water over cracked stone reads as
 * long vertical smears of whatever is above it, so the canvas is painted as
 * bands running away from the camera — gold on the left where the sphere is,
 * cooling to violet on the right where the twilight comes through the pillars —
 * broken by horizontal ripple lines. The alpha is a radial falloff centred just
 * behind the party, so the plane exists where the figures need a floor to stand
 * on and dissolves before it reaches the painting's own waterline.
 */
function wetFloorCanvas(gold: string, violet: string, deep: string): HTMLCanvasElement {
  const size = 512;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = deep;
  ctx.fillRect(0, 0, size, size);

  /**
   * Reflected light, smeared along +z (v in texture space). The gold is kept to
   * the left **third** and the violet is given the rest.
   *
   * It used to run gold most of the way across, on the theory that the sphere is
   * the only warm source so the water owes it a reflection everywhere. Against
   * the restored painting that was the single biggest mistake in the scene: a
   * warm plane under a warm key under two warm additive smears stacked into one
   * flat orange wash over the whole lower-left, and the painted sphere — which
   * the wash sits directly on top of — lost every bit of its own contrast and
   * read as a dull terracotta dome. Water reflects what is *above* it; only the
   * strip beside the sphere is above gold, and everything from the hall's axis
   * rightward is under violet twilight.
   */
  const smear = ctx.createLinearGradient(0, 0, size, 0);
  smear.addColorStop(0, gold);
  smear.addColorStop(0.26, gold);
  smear.addColorStop(0.58, violet);
  smear.addColorStop(1, violet);
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = smear;
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 1;

  // Vertical smears: the actual "reflection" cue.
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 110; i++) {
    const x = Math.random() * size;
    const w = 2 + Math.random() * 18;
    const warm = x < size * 0.34;
    const a = (warm ? 0.09 : 0.045) + Math.random() * 0.12;
    const g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, warm ? `rgba(255,214,150,${a})` : `rgba(196,186,255,${a})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, w, size);
  }

  // Ripple lines across the smears — this is what stops it reading as a blur.
  for (let i = 0; i < 70; i++) {
    const y = Math.random() * size;
    const h = 1 + Math.random() * 2.5;
    ctx.fillStyle = `rgba(214,204,255,${0.03 + Math.random() * 0.07})`;
    ctx.fillRect(0, y, size, h);
  }
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

/**
 * A soft elongated blob: the sphere's reflection lying on the water, and the
 * gold ring under the dais. Stretched by the mesh, never by the texture.
 */
function blobCanvas(inner = 0.0, outer = 1.0): HTMLCanvasElement {
  const size = 256;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, (size / 2) * inner, size / 2, size / 2, (size / 2) * outer);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.14)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

/** A thin glowing ring — the Yevon inlay ringing the dais. */
function ringCanvas(): HTMLCanvasElement {
  const size = 512;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  const cx = size / 2;
  for (const [r, w, a] of [
    [0.46, 5, 0.75],
    [0.39, 2.5, 0.4],
    [0.27, 2, 0.28],
  ] as Array<[number, number, number]>) {
    ctx.beginPath();
    ctx.arc(cx, cx, size * r, 0, Math.PI * 2);
    ctx.lineWidth = w;
    ctx.strokeStyle = `rgba(255,236,178,${a})`;
    ctx.stroke();
  }
  // Radial ticks, so it reads as carved rather than as a lens flare.
  ctx.strokeStyle = 'rgba(255,230,168,0.34)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 24; i++) {
    const t = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(t) * size * 0.4, cx + Math.sin(t) * size * 0.4);
    ctx.lineTo(cx + Math.cos(t) * size * 0.455, cx + Math.sin(t) * size * 0.455);
    ctx.stroke();
  }
  // Feather the outer edge so the disc never shows its own rectangle.
  ctx.globalCompositeOperation = 'destination-in';
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(0.86, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

function clampTexture(tex: CanvasTexture): CanvasTexture {
  tex.wrapS = tex.wrapT = ClampToEdgeWrapping;
  return tex;
}

// ---------------------------------------------------------------------------
// The scene: Zanarkand Dome — the great hall
// ---------------------------------------------------------------------------

/**
 * **Zanarkand Dome — the great hall**, as a {@link SceneFactory}.
 *
 * Violet twilight falls through the ruptured dome; the fayth sphere on the
 * hall's left burns gold and throws the only warm light in the room. Between
 * them the floor is under a film of water that mirrors both.
 *
 * Three decisions carry the look:
 *
 * 1. **The light rig's hues are overridden, not sampled.** `Backdrop` samples
 *    full-width bands, and every full-width band of this painting averages to
 *    violet — the gold is a *local* source in the lower-left quadrant, so a
 *    band average reads mauve and lights nothing warm. The rig keeps the
 *    painting's violet for fill, rim and ambient and is handed an explicit gold
 *    for key and bounce. That is the whole "warm bounce from the sphere".
 * 2. **The 3D floor is the scene's, not the backdrop's.** `Backdrop.ground` is
 *    an opaque lit plane; here it would bury the painting's lower half, which
 *    is where the sphere is. The floor below is a mirror smear with a radial
 *    alpha that dies out well before the painted waterline.
 * 3. **Three additive shafts, and the dust lives inside them.** The godrays are
 *    quads; the dust field's bounds are the shaft volume, so the motes only
 *    ever twinkle where there is light to catch.
 */
export const buildZanarkandDomeScene: SceneFactory = async (
  opts: SceneBuildOptions = {},
): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:zanarkand-dome';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? CAMERA_REF;

  // ---------------------------------------------------------------- backdrop
  const url = artUrl('art/backdrops/zanarkand-dome.png');

  /**
   * Framing maths.
   *
   * The painting is 2688x1536 (7:4) and the frame is 16:9 — close enough that a
   * plane sized to fill the frame's *width* also very nearly fills its height.
   * At the idle rig the visible size at z = -56 is 37.9 x 67.4 world units, so
   * an 82-wide plane centred at y = -4 covers that frame with ~20% to spare
   * horizontally and ~10% vertically — the margin the other six rigs spend, and
   * they spend almost all of it (worst case under 5% of one edge).
   *
   * What the margin costs is paid **off the bottom**, which is why `centreY` is
   * -4 rather than centred on the view axis: the painting's bottom eighth is its
   * own waterline, and the 3D floor is standing in for that anyway, so it is
   * dropped below the frame. The top keeps the ruptured dome and its oculus —
   * the shot's light source and the only thing in the painting bright enough to
   * cross the bloom threshold.
   *
   * The sample bands are picked for what they are *used for*, not for where the
   * painting's thirds fall: `horizon` is the fog colour, so it is taken from
   * the twilight showing between the pillars; `ground` is the water; `sky` is
   * the dome itself.
   */
  const backdropOptions = {
    url,
    width: BACKDROP.width,
    distance: BACKDROP.distance,
    centreY: BACKDROP.centreY,
    cameraRef,
    layers: low
      ? [{ from: 0.36, to: 0.98, feather: 0.1, featherBottom: 0.05, z: -30, opacity: 0.5 }]
      : [
          // The far pillar row.
          { from: 0.18, to: 0.72, feather: 0.12, featherBottom: 0.1, z: -40, opacity: 0.45 },
          // The near pillar bases + the sphere, pulled forward so a dolly makes
          // the hall's columns slide against the dome behind them. Only to -26:
          // a masked layer is a *rectangle*, and the further forward it comes
          // the sooner an off-axis rig walks its vertical edge into frame. -26
          // still parallaxes visibly on the sway and keeps every edge outside
          // every rig's frustum.
          { from: 0.5, to: 0.99, feather: 0.12, featherBottom: 0.05, z: -26, opacity: 0.55 },
        ],
    sampleBands: {
      sky: [0.0, 0.14] as [number, number],
      horizon: [0.52, 0.72] as [number, number],
      ground: [0.87, 1.0] as [number, number],
      key: [0.66, 0.86] as [number, number],
    },
    // The scene owns its floor; see the class doc above.
    ground: false as const,
    fog: { near: 16, far: 62, colorMix: 0.3 },
    // Thin sheets, and thinner than they were. Mist is the scene's cheapest way
    // to gain depth and its cheapest way to lose a painting: three sheets at the
    // old values put roughly a quarter of a stop of haze over the *whole* lower
    // half, and the lower half is where the sphere is.
    fogPlanes: [
      { z: -30, y: 4.4, width: 66, height: 20, opacity: 0.1, speed: 0.006 },
      { z: -17, y: 2.4, width: 44, height: 11, opacity: 0.06, speed: 0.013 },
      { z: -7.0, y: 1.3, width: 30, height: 6, opacity: 0.035, speed: 0.026, additive: true },
    ],
    // Deliberately *not* the fog colour, and deliberately not black either.
    // Any sliver a rig swings past the painting's edge should read as the far
    // end of this hall: the sampled horizon violet is too bright and would look
    // like a hole in the wall, but near-black is now *darker than anything in
    // the painting* — against a violet twilight matte it reads as a torn edge.
    // This is the painting's own deep-shadow violet (its mid-hall columns
    // average 0x363663) taken down two stops.
    background: 0x14102b,
  } satisfies BackdropOptions;

  let backdrop = await Backdrop.create(backdropOptions);
  backdrop.applyTo(group);

  // ------------------------------------------------------------------ lights
  /** Gold in, violet kept. See decision 1 in the factory's doc comment. */
  const litPalette = (p: BackdropPalette): BackdropPalette => ({
    ...p,
    key: 0xffc074,
    bounce: 0xffcf96,
  });

  const lights = new LightRig({
    palette: litPalette(backdrop.palette),
    // The sphere: low, far left, slightly into the hall.
    keyFrom: [-9.5, 3.4, -7.5],
    // The key is the *sphere*, and it is a gold key in a violet room — it has to
    // be readable as a direction without becoming the room's exposure. Cut back
    // from 1.85, which on the restored painting drove the 3D floor a full stop
    // warmer than the water behind it.
    keyIntensity: 1.5,
    // The oculus and the twilight between the right-hand pillars.
    rimFrom: [7.4, 6.2, 3.0],
    rimColor: 0xc7c4ff,
    rimIntensity: 1.25,
    // …and the violet comes up to meet it, so the balance between the sphere's
    // gold and the dome's twilight is the painting's balance and not a warm wash.
    fillIntensity: 0.84,
    ambientIntensity: 0.46,
    // The fill and ambient are the *painting's* violet twilight, and this matte
    // is a bright one — a hall lit to roughly 40% luma with a pink-violet sky
    // behind every colonnade. Lit at the values a near-black hall wanted, the
    // 3D floor and pillars sat a full stop under the painting behind them and
    // the seam showed. These are set to the painting's own mid-tones.
    luma: { key: 0.86, fill: 0.56, rim: 0.9, ambient: 0.42 },
    shadows: low ? false : { mapSize: 1024, area: 12, radius: 3.8, bias: -0.0014 },
  });
  group.add(lights.group);

  /**
   * The sphere's own practical. `LightRig.practical` belongs to the presenter
   * (spells and impacts flicker it), so the room's standing warm source is a
   * second light the scene owns and breathes itself.
   */
  const spherePractical = new PointLight(0xffb867, 1.9, 19, 1.8);
  spherePractical.position.set(-8.0, 1.7, -9.0);
  spherePractical.name = 'fayth-sphere';
  group.add(spherePractical);

  /**
   * The sphere's **bounce** on the party, as a second, near light.
   *
   * The practical above is where the sphere *is* — far back down the hall — and
   * at that distance its falloff leaves the water under the party almost cold.
   * What the composition needs is the light the sphere throws back off the
   * flooded floor: low, close, gold, and on the party's left, so the wet stone
   * around their feet carries a warm gradient that dies out before the dais.
   * It is deliberately short-ranged — it is a bounce, not a second sun — and it
   * breathes with the sphere so the two never drift out of step.
   *
   * The actors' own half of this is `lights.bounceColorHex`, which `litPalette`
   * above forces to gold for exactly the same reason; a `PointLight` cannot
   * touch them, because painted cut-outs are unlit by design.
   */
  const sphereBounce = new PointLight(0xffc178, 0.98, 8.0, 2.0);
  sphereBounce.position.set(-3.6, 0.6, 0.9);
  sphereBounce.name = 'fayth-sphere-bounce';
  group.add(sphereBounce);

  // ------------------------------------------------------------------- floor
  const floorTex = paintedCanvasTexture(
    wetFloorCanvas(
      '#a8763c',
      `#${new Color(normaliseLuma(backdrop.palette.horizon, 0.42)).getHexString()}`,
      `#${new Color(normaliseLuma(backdrop.palette.ground, 0.16)).getHexString()}`,
    ),
  );
  floorTex.wrapS = floorTex.wrapT = ClampToEdgeWrapping;

  /**
   * The floor's alpha falls off fast. It is a *pool* around the fighters, not a
   * plane running to the horizon: an opaque floor here would cover the frame
   * from the horizon down, and the painting's lower third is where the sphere
   * is — the one bright thing in the shot.
   *
   * And it has to fall off **faster than it used to**, because "the horizon
   * down" is not a figure of speech here. The painted sphere sits at screen
   * y 0.72..0.95, which is well below the 3D horizon line (y ≈ 0.40 at `idle`),
   * so every pixel of the painted sphere has this plane in front of it. At the
   * old falloff the plane still carried 20–50% alpha out there and the sphere
   * was being *veiled* — warm-milky when the floor was tinted bright, dull grey
   * once it was tinted dark. Dying by 0.4 of the radius instead of 0.76 keeps
   * the pool under the fighters, where it is doing work, and hands the sphere's
   * quarter of the frame back to the painting.
   */
  const floorAlpha = paintedCanvasTexture(
    radialCanvas(
      512,
      [
        [0, 1],
        [0.1, 0.9],
        [0.24, 0.5],
        [0.4, 0.17],
        [0.6, 0.03],
        [1, 0],
      ],
      true,
    ),
  );
  // An alpha map is data, not colour.
  floorAlpha.colorSpace = NoColorSpace;
  floorAlpha.wrapS = floorAlpha.wrapT = ClampToEdgeWrapping;

  const floor = new Mesh(
    new PlaneGeometry(32, 27, 1, 1),
    new MeshLambertMaterial({
      map: floorTex,
      alphaMap: floorAlpha,
      // The painting's water is a *dark* mirror carrying bright reflections, not
      // a pale floor: at 0.64 this plane was brighter than the water it stands
      // in for and the join showed as a milky step.
      color: new Color(normaliseLuma(backdrop.palette.ground, 0.5)),
      transparent: true,
      depthWrite: false,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  // Nudged right and toward the camera with the pool: the fighters are the only
  // reason this plane exists, and everything left of x ≈ -6 is the sphere's.
  floor.position.set(-0.5, 0, 2.6);
  floor.receiveShadow = true;
  floor.renderOrder = -40;
  floor.name = 'wet-floor';
  group.add(floor);

  const blobTex = clampTexture(paintedCanvasTexture(blobCanvas()));

  /**
   * **The sphere's glow, put back on the painting.**
   *
   * The matte's cracked golden sphere is the composition's only warm source and
   * the reason every light in this scene is gold, but as *paint* it is fixed at
   * whatever value it was painted at — around 0.72 luma in its core. That is
   * below every bloom threshold this scene can afford (drop the threshold far
   * enough to catch it and the whole violet sky starts to glow), so the one
   * thing the shot is lit by was the one thing in the frame that did not emit.
   *
   * Two additive quads laid over the painting at the sphere's own position fix
   * that without touching the grade: a wide gold halo that re-lights the paint
   * around the disc, and a small near-white core that sits *above* the bloom
   * threshold so the sphere blooms. Both are glued to the main painting plane,
   * so they parallax with it and never slide off the disc.
   *
   * The placement is measured, not eyeballed: the painted disc occupies
   * u 0.09..0.38, v 0.62..0.90 of a 2688x1536 image on an 82-wide plane whose
   * centre is at y = {@link BACKDROP}.centreY, which puts its centre at world
   * (-21.7, -16.7) and its size at 23.8 x 13.1.
   *
   * **They draw last of the scene's own transparents, not first.** These used to
   * sit at `renderOrder` -70, immediately after the parallax layers — which put
   * the wet floor (-40), the reflection smears (-30, -31) and the godray feet
   * (-20…) all *in front of* the room's light source, because the painted sphere
   * is below the 3D horizon and everything the scene lays on its floor crosses
   * it. Whatever those layers happened to be tinted, they veiled it. At -13/-12
   * the gold goes back on top of the lot and only the painted cut-outs (render
   * order 0) can stand in front of it — which is the one thing that *should*.
   */
  const paintU = (u: number): number => (u - 0.5) * BACKDROP.width;
  const paintV = (v: number): number =>
    BACKDROP.centreY + (0.5 - v) * (BACKDROP.width * (1536 / 2688));
  const SPHERE_ON_PAINTING = {
    x: paintU(0.235),
    y: paintV(0.77),
    w: (0.38 - 0.09) * BACKDROP.width,
    h: (0.9 - 0.62) * (BACKDROP.width * (1536 / 2688)),
  };

  const sphereGlow = (color: number, opacity: number, k: number, z: number, order: number): Mesh => {
    const mesh = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({
        map: blobTex,
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: AdditiveBlending,
        fog: false,
        toneMapped: false,
      }),
    );
    mesh.scale.set(SPHERE_ON_PAINTING.w * k, SPHERE_ON_PAINTING.h * k, 1);
    mesh.position.set(SPHERE_ON_PAINTING.x, SPHERE_ON_PAINTING.y, z);
    mesh.renderOrder = order;
    return mesh;
  };
  /**
   * The halo: gold, **tight**, and quiet.
   *
   * A soft blob wider than the disc it sits on is not a halo, it is a veil: the
   * previous 1.24 / 0.4 version spread a low-alpha wash across the whole
   * lower-left quadrant and lifted the painted sphere's *shadows* as much as its
   * highlights, which is exactly how a cracked gold dome turns into a flat
   * terracotta hemisphere. Pulled inside the disc's own footprint and taken down
   * to a fifth, it now adds value where the paint is already bright and leaves
   * the cracks their contrast.
   */
  const sphereHalo = sphereGlow(0xffb95c, 0.34, 1.12, BACKDROP.distance + 1.0, -13);
  sphereHalo.name = 'sphere-halo';
  group.add(sphereHalo);
  /** The core: small, near-white, and the only thing here meant to bloom. */
  const sphereCore = sphereGlow(0xfff0d0, 0.44, 0.52, BACKDROP.distance + 1.2, -12);
  sphereCore.position.y += SPHERE_ON_PAINTING.h * 0.08;
  sphereCore.name = 'sphere-core';
  group.add(sphereCore);

  /**
   * The sphere's reflection: one long gold smear running out of the painting's
   * glow toward the camera. A real mirror would cost a second render pass; a
   * stretched additive blob laid on the water buys ninety percent of the read
   * for one quad, and it is the single element that makes the floor look wet.
   *
   * It is aimed, not placed: it runs along +z out of the painted disc's own
   * screen column (x ≈ 0.15 at `idle`) and past the party's feet, so the gold on
   * the water is plainly the sphere's and not an unexplained warm patch.
   *
   * **Narrow is the whole point.** At 8.8 units wide and 0.68 opacity this quad
   * was seen almost edge-on, which spread it into a horizontal band across the
   * bottom of the frame rather than a streak running away from the camera — a
   * reflection you can only read as a reflection if it is longer than it is
   * wide. Halved in width, moved back under the disc, and taken down about a
   * third in value: still the second-brightest thing in the lower half of the
   * frame, but now shaped like a smear on wet stone.
   */
  const sphereReflection = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({
      map: blobTex,
      color: 0xffdca8,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
    }),
  );
  /**
   * **Yawed, not axis-aligned.** A streak laid straight down +z holds one world
   * x while the frame's own left edge walks outward with distance, so on screen
   * it slides off the side of the picture before it has run half its length —
   * which is why the last version of this quad was invisible at the `idle` rig
   * even at full brightness. Solved on the screen instead: the sphere's column
   * is screen x ≈ 0.13, and the floor points that project there are
   * (-3.3, 0, 1) near the camera and (-7.9, 0, -13) back at the colonnade. The
   * quad is laid along that line — 18° off the hall's axis — so the reflection
   * stays under the painted disc for its whole run and reads as one smear of
   * gold receding on wet stone.
   *
   * `rotation.z` on a plane already tipped flat by `rotation.x = -π/2` is a yaw
   * about world Y (three.js composes Euler 'XYZ' as `RX·RY·RZ`, so the Z spin
   * happens in the plane's own surface first).
   */
  sphereReflection.rotation.set(-Math.PI / 2, 0, 0.315);
  sphereReflection.scale.set(5.6, 24, 1);
  sphereReflection.position.set(-5.5, 0.012, -5.6);
  sphereReflection.renderOrder = -30;
  sphereReflection.name = 'sphere-reflection';
  group.add(sphereReflection);

  /**
   * The smear's near end: a second, much shorter blob under the party's own
   * feet, so the wet stone they stand on carries the same gold the water behind
   * them does. Without it the reflection stops dead at the point the party
   * occludes it and the floor in front of the camera goes inert.
   */
  const nearWet = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({
      map: blobTex,
      color: 0xffd7a6,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
    }),
  );
  nearWet.rotation.x = -Math.PI / 2;
  nearWet.scale.set(8.0, 8.0, 1);
  nearWet.position.set(-2.9, 0.01, 1.4);
  nearWet.renderOrder = -31;
  nearWet.name = 'sphere-reflection-near';
  group.add(nearWet);

  /** The Yevon inlay ringing the dais, under the boss slot. */
  const daisRing = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({
      map: clampTexture(paintedCanvasTexture(ringCanvas())),
      color: 0xffd48a,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
    }),
  );
  daisRing.rotation.x = -Math.PI / 2;
  daisRing.scale.set(7.6, 7.6, 1);
  daisRing.position.set(ENEMY_SLOTS[0]![0], 0.014, ENEMY_SLOTS[0]![2]);
  daisRing.renderOrder = -28;
  daisRing.name = 'dais-ring';
  group.add(daisRing);

  // ------------------------------------------------------------- light shafts
  const beamTex = clampTexture(paintedCanvasTexture(beamCanvas()));
  const shaftSpecs: Array<{
    w: number;
    h: number;
    pos: [number, number, number];
    tilt: number;
    yaw: number;
    opacity: number;
    speed: number;
  }> = [
    // The main shaft off the oculus, landing left of the dais. At `idle` it
    // falls down screen x ≈ 0.36 — directly below the painted oculus, which
    // sits at x ≈ 0.33 — so the 3D shaft reads as the continuation of the
    // painted one rather than as a second, unexplained light.
    // Lifted and lengthened so that the part of it crossing the *painted*
    // oculus is its faint upper tail, not the bright head six percent down the
    // beam texture. A godray drawn additively over the light source it comes out
    // of is the fastest way to blow a highlight in this scene: at y 8.2 / h 22
    // this shaft was laying ~0.29 of extra additive value straight onto paint
    // that is already at 0.95, and the oculus went from a sun to a white hole.
    { w: 5.6, h: 30, pos: [-2.6, 11.0, -14.0], tilt: 0.17, yaw: 0.1, opacity: 0.6, speed: 0.31 },
    // A narrower one further back and to the right, through a crack.
    { w: 3.4, h: 20, pos: [4.2, 8.0, -19.0], tilt: -0.12, yaw: -0.14, opacity: 0.5, speed: 0.23 },
    // A broad, faint wash close to the camera, so the near air is not empty.
    // Lifted and shortened as well as dimmed: at y 6.8 / h 17 its dead soft foot
    // landed on the painted sphere, and a godray is the one thing in this scene
    // allowed to cross a colonnade but never a light source.
    { w: 9.5, h: 14, pos: [1.2, 7.8, -8.0], tilt: 0.24, yaw: 0.04, opacity: 0.15, speed: 0.17 },
  ];
  const shafts = (low ? shaftSpecs.slice(0, 2) : shaftSpecs).map((s, i) => {
    const mesh = new Mesh(
      new PlaneGeometry(s.w, s.h),
      new MeshBasicMaterial({
        map: beamTex,
        color: 0xcfd6ff,
        transparent: true,
        opacity: s.opacity,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        fog: false,
      }),
    );
    mesh.position.set(s.pos[0], s.pos[1], s.pos[2]);
    mesh.rotation.set(0, s.yaw, s.tilt);
    mesh.renderOrder = -20 + i;
    mesh.name = `light-shaft-${i}`;
    group.add(mesh);
    return { mesh, base: s.opacity, speed: s.speed, phase: i * 1.9 };
  });

  // --------------------------------------------------------------- particles
  const k = low ? 0.45 : 1;

  /**
   * Dust in the godrays. Bounds match the shaft volume so the motes only
   * twinkle where there is light for them to catch, and the drift is almost
   * nothing — §2.2 of the bible is explicit that there is **no wind** in here.
   */
  const dust = new ParticleField({
    count: Math.round(440 * k),
    bounds: { x: 5.6, y: 7.2, z: 5.5 },
    colors: [0xeef2ff, 0xd6cffa, 0xfff2d8],
    size: 3.8,
    sizeJitter: 0.7,
    drift: [0.012, -0.035, 0.004],
    wobble: [0.4, 0.22, 0.32],
    wobbleSpeed: 0.26,
    twinkle: 0.6,
    opacity: 0.6,
    additive: true,
    hardness: 0.3,
  });
  // Centred on the main shaft and dropped 1.2 units, so the field spans the
  // whole visible length of the beam instead of only its bright top end.
  dust.position.set(-2.4, 4.0, -13.0);

  /**
   * Golden pyreflies, near band: big, slow, in front of the party.
   *
   * **Many and slow** is the whole brief for these. FFX's Zanarkand dome is
   * thick with them, and they are the one element that sells the room as the
   * place a thousand summoners died in — so the counts are high, the drift is
   * barely a crawl (0.12 u/s up against the preset's 0.42) and the twinkle is
   * the only fast thing about them. They are golden-*white*: a pure gold mote
   * disappears against the painted sphere, and a pure white one reads as snow.
   */
  const pyrefliesNear = new ParticleField(
    ParticlePresets.pyreflies({
      count: Math.round(320 * k),
      bounds: { x: 9.5, y: 3.4, z: 5.5 },
      colors: [0xffeec4, 0xfff6e4, 0xffe9bc, 0xffd89a, 0xffe2b8],
      size: 9.2,
      drift: [0.014, 0.12, 0.008],
      wobble: [0.5, 0.2, 0.36],
      wobbleSpeed: 0.38,
      twinkle: 0.7,
      opacity: 0.86,
    }),
  );
  pyrefliesNear.position.set(-0.8, 1.9, -0.5);

  /** Mid band: between the party and the dais, so the hall's air has depth. */
  const pyrefliesMid = new ParticleField(
    ParticlePresets.pyreflies({
      count: Math.round(370 * k),
      bounds: { x: 11, y: 4.2, z: 6.5 },
      colors: [0xffe9b8, 0xfff3dc, 0xffd894, 0xffeecb],
      size: 7.2,
      drift: [0.012, 0.13, 0.004],
      wobble: [0.52, 0.2, 0.38],
      wobbleSpeed: 0.32,
      twinkle: 0.78,
      opacity: 0.85,
    }),
  );
  pyrefliesMid.position.set(-1.2, 2.8, -6.2);

  /** Far band: smaller and denser, drifting up between the pillars. */
  const pyrefliesFar = new ParticleField(
    ParticlePresets.pyreflies({
      count: Math.round(480 * k),
      bounds: { x: 14, y: 5.6, z: 9 },
      colors: [0xffe8b4, 0xfff0cc, 0xffdc9c, 0xffc978],
      size: 5.6,
      drift: [0.01, 0.1, 0.0],
      wobble: [0.55, 0.22, 0.4],
      wobbleSpeed: 0.3,
      twinkle: 0.82,
      opacity: 0.8,
    }),
  );
  pyrefliesFar.position.set(-1.6, 3.6, -12.0);

  const particles = [dust, pyrefliesFar, pyrefliesMid, pyrefliesNear];
  for (const p of particles) group.add(p);

  // ------------------------------------------------------------------- props
  /**
   * Broken pillars.
   *
   * Two, both at the frame edges, and that is the whole prop list. They are the
   * scene's **bracket**: near-black columns close to the camera that frame the
   * composition, cover whatever a rig swings past the painting's edge, and —
   * because they are lit by the same rig and drop into the same water — prove
   * the 3D layer and the painting share a light.
   */
  // Dark, but never black: at a rig that swings one of them toward the middle
  // of the frame a pure silhouette stops reading as stone and becomes a hole.
  const pillarDark = normaliseLuma(backdrop.palette.sky, 0.34);
  const pillars = (
    [
      // [x, z, height, radius, colour, cap]
      // The bracket: tall enough that no top edge ever enters the frame.
      [-4.15, 2.6, 24, 0.72, pillarDark, false],
      [6.5, -2.0, 24, 1.15, pillarDark, false],
      // …and nothing else. Two rounds of mid-ground ruins were tried here and
      // both were cut: a *tall* broken column out at the frame's sides projects
      // as a vertical black bar that halves the picture, and a *low* one inside
      // the lit area reads as a dark lump sitting on the composition. The
      // painting already contains a hall's worth of columns, drawn with the
      // right perspective and the right light; the only 3D architecture that
      // earns its place is the pair too close to the camera for the painting to
      // have any say about.
    ] as Array<[number, number, number, number, number, boolean]>
  ).map(([x, z, height, radius, color, cap], i) => {
    const pillar = makePillar({ height, radius, taper: 0.9, sides: 14, color, cap });
    pillar.position.set(x, 0, z);
    pillar.rotation.y = i * 0.37;
    pillar.name = `pillar-${i}`;
    group.add(pillar);
    return pillar;
  });

  // ------------------------------------------------------------- light pools
  // A faint pool under each standing spot — the cheapest thing that stops a
  // cut-out figure reading as a sticker pasted on a painting.
  const pools = [
    // Offset a third of a unit toward the sphere, and warmer than the pool
    // under the boss: the light in this room comes from frame-left, so a pool
    // centred exactly under a figure reads as a lamp the figure is carrying.
    ...PARTY_SLOTS.slice(0, 3).map((s) => {
      const pool = makeLightPool({ color: 0xffc178, radius: 1.6, opacity: 0.2 });
      pool.position.set(s[0] - 0.34, 0.02, s[2] + 0.12);
      return pool;
    }),
    (() => {
      const pool = makeLightPool({ color: 0xf2d24a, radius: 2.4, opacity: 0.22 });
      const s = ENEMY_SLOTS[0]!;
      pool.position.set(s[0], 0.018, s[2]);
      pool.name = 'boss-pool';
      return pool;
    })(),
  ];
  for (const p of pools) group.add(p);
  const bossPool = pools[pools.length - 1]!;

  // ------------------------------------------------------------ dev hot-swap
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
        lights.key.color.setHex(normaliseLuma(0xffc074, 0.82));
        lights.ambient.color.setHex(normaliseLuma(backdrop.palette.horizon, 0.3));
      })();
    });
  }

  // -------------------------------------------------------------------- loop
  const ownedTextures: Texture[] = [floorTex, floorAlpha, blobTex, beamTex];
  const ownedMeshes: Mesh[] = [
    floor,
    sphereHalo,
    sphereCore,
    sphereReflection,
    nearWet,
    daisRing,
    ...shafts.map((s) => s.mesh),
  ];
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
    /**
     * The engine's Zanarkand grade, re-solved for the painting that is actually
     * on disk.
     *
     * Three changes, each one a measurement off
     * `public/art/backdrops/zanarkand-dome.png`:
     *
     * 1. **The vignette is opened up.** `ScenePalettes.zanarkandDome` was
     *    authored for a frame whose subject sits in the middle; this
     *    composition puts the party in the lower **left** with the glowing
     *    sphere beside them, and the stock 0.58 vignette at radius 0.54 costs
     *    that corner 45% of its value — the sphere, which is the reason the
     *    scene is lit the way it is, goes out. At 0.44/0.72 the corner loses
     *    about a fifth, which still shapes the frame.
     * 2. **The midtone lift is put back in balance.** `gamma` here is an
     *    exponent of `1/γ`, so anything over 1 is a *lift* — and the lift this
     *    scene was carrying, `[1.18, 1.24, 1.04]`, lifted red and green by two
     *    to three times as much as blue. On a grey stand-in painting that reads
     *    as warmth. On the painting that is actually on disk it is a bleach: it
     *    pulls a violet hall toward khaki, takes most of the blue out of the
     *    twilight, and flattens the gold sphere by raising its shadows as hard
     *    as its highlights. `[1.09, 1.06, 1.12]` is the same amount of lift with
     *    the *blue* fractionally ahead, which is what a twilight matte wants —
     *    and because a `1/γ` curve pins 1.0 to 1.0, all of that brightness is
     *    bought without pushing a single highlight into clipping. `saturation`
     *    goes up to 1.14 to match: the grade is no longer doing the job of
     *    holding the gold apart from the violet, so the saturation has to.
     * 3. **Exposure and bloom flatter the painting again.** Tone mapping here is
     *    `NoToneMapping` — exposure is a linear multiply with a hard clip — so
     *    the headroom is spent carefully: 1.07 is as far as the oculus will go
     *    before it stops being a glow and becomes a white hole. Threshold stays
     *    at 0.90 (only ~1.4% of the painting sits above it: the oculus and the
     *    sphere's core) and strength comes *down* from 0.5 to 0.36 with a wider
     *    radius, which spreads the oculus's bloom instead of stacking it — the
     *    previous pass's one genuinely blown highlight (measured: 19% of the
     *    oculus crop clipped, against 0.1% anywhere in the painting). The sphere
     *    still blooms, because {@link sphereCore} is an additive emitter sitting
     *    on the disc, not paint hoping to cross a line.
     * 4. **The vignette opens a little further.** 0.29 at radius 0.82: the
     *    sphere is in the bottom-left corner and it is the reason the room is
     *    lit, so the corner it lives in cannot be the darkest part of the frame.
     *
     * The numbers are checked against the painting, not against taste: over the
     * band of the matte the idle rig actually sees (v 0..0.85) the paint means
     * r 88 / g 81 / b 128 at 0.34 luma, and the graded frame is solved to land
     * near that. The green lift runs a hair ahead of the other two because a
     * violet room with a violet 3D fill in it drifts magenta otherwise.
     */
    palette: {
      ...ScenePalettes.zanarkandDome,
      vignette: 0.29,
      vignetteRadius: 0.82,
      exposure: 1.0,
      lift: [0.002, 0.002, 0.01],
      gamma: [1.3, 1.38, 1.22],
      gain: [1.0, 1.0, 1.0],
      saturation: 1.12,
      bloomThreshold: 0.95,
      bloomStrength: 0.18,
      bloomRadius: 0.55,
    } satisfies ScenePalette,
    update(dt: number): void {
      clock += dt;
      backdrop.update(dt);
      lights.update(dt);
      for (const p of particles) p.update(dt);

      // The sphere breathes; everything warm in the room breathes with it, so
      // the bloom always has something living in it.
      const pulse = 0.82 + Math.sin(clock * 0.53) * 0.18;
      spherePractical.intensity = 1.95 * pulse;
      sphereBounce.intensity = 1.05 * pulse;
      (sphereReflection.material as MeshBasicMaterial).opacity = 0.38 + pulse * 0.18;
      (nearWet.material as MeshBasicMaterial).opacity = 0.2 + pulse * 0.1;
      // The painted sphere breathes with its own light. The halo swings wider
      // than the core: a core that pumped this hard would pop in and out of the
      // bloom threshold and strobe.
      (sphereHalo.material as MeshBasicMaterial).opacity = 0.24 + pulse * 0.14;
      (sphereCore.material as MeshBasicMaterial).opacity = 0.34 + pulse * 0.12;
      (bossPool.material as MeshBasicMaterial).opacity = 0.17 + Math.sin(clock * 0.81) * 0.05;
      (daisRing.material as MeshBasicMaterial).opacity = 0.23 + Math.sin(clock * 0.62) * 0.06;

      // Shafts drift in and out as the dust in them thickens.
      for (const s of shafts) {
        (s.mesh.material as MeshBasicMaterial).opacity =
          s.base * (0.82 + Math.sin(clock * s.speed + s.phase) * 0.18);
      }
    },
    dispose(): void {
      watcher?.stop();
      for (const p of particles) p.dispose();
      for (const m of [...ownedMeshes, ...pools, ...pillars]) {
        m.geometry.dispose();
        (m.material as Material).dispose();
      }
      for (const t of ownedTextures) t.dispose();
      spherePractical.dispose();
      sphereBounce.dispose();
      lights.dispose();
      backdrop.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
  return build;
};

// ---------------------------------------------------------------------------
// Registry adapter
// ---------------------------------------------------------------------------

/**
 * The {@link PaintedScene} shape `src/scenes/index.ts` registers.
 *
 * It is the {@link SceneBuild} above plus the two things the registry needs and
 * a scene is forbidden to own: a `Scene` to render and a `BattleCamera` bound
 * to a real camera. `party` and `enemies` are deliberately **empty** — this
 * location ships no stand-in figures, so the battle's actors are the only
 * things ever on the field and `hideOwnActors()` has nothing to hide.
 */
export async function buildZanarkandDomeDiorama(camera: PerspectiveCamera): Promise<PaintedScene> {
  const scene = new Scene();
  scene.name = 'zanarkand-dome';

  const build = await buildZanarkandDomeScene({});
  mountScene(build, scene);

  const battleCamera = new BattleCamera(camera, {
    swayAmplitude: 0.042,
    swaySpeed: 0.21,
    rigs: RIGS,
    initial: 'idle',
  });

  const assetReport: AssetReport = {
    backdrop: !build.backdrop.placeholder,
    tidusPoses: [],
    yuna: false,
    boss: false,
    standIns: [],
  };

  return {
    ...build,
    scene,
    battleCamera,
    party: [],
    enemies: [],
    assetReport,
    trigger(name: string): boolean {
      if (!name.startsWith('rig:')) return false;
      const rig = name.slice(4);
      if (!battleCamera.rigNames.includes(rig)) return false;
      void battleCamera.moveTo(rig, 700);
      return true;
    },
    setPixelScale(v: number): void {
      for (const p of build.particles) p.setPixelScale(v);
    },
    update(dt: number): void {
      build.update(dt);
      battleCamera.update(dt);
    },
    dispose(): void {
      build.dispose();
      scene.clear();
    },
  };
}
