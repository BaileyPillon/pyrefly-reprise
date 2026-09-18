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
  party: { position: [0.6, 2.15, 8.1], lookAt: [-0.05, 1.5, 0.7], fov: 32, sway: 0.7 },
  enemy: { position: [0.7, 2.25, 7.6], lookAt: [1.9, 1.95, -2.0], fov: 32, sway: 0.7 },
  /** The Yunalesca angle: low on the floor, tilted up at the dais. */
  yunalesca: { position: [0.7, 1.0, 6.2], lookAt: [2.05, 1.2, -2.4], fov: 30, sway: 0.5 },
  victory: { position: [0.65, 2.1, 8.3], lookAt: [0.0, 1.55, 0.9], fov: 32, sway: 1.2 },
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
 * off `public/art/backdrops/zanarkand-dome.png`, whose gold pixels bound to
 * u 0.10..0.36, v 0.635..0.86 — projects at the `idle` rig to the frame's
 * bottom-left corner: screen x 0.00..0.32, y 0.72..1.0. The arc used to sit far
 * enough left that the middle slot's boots landed inside that disc, and the one
 * bright thing in the lower half of the painting was cut in half by a pair of
 * feet.
 *
 * The whole arc is shifted **+0.43 in x** from the version that was solved
 * against the grey stand-in painting. On that matte the disc did not exist, so
 * a leftmost figure whose silhouette ran from screen x 0.308 to 0.394 cost
 * nothing; against the restored painting its left shoulder overlapped the
 * disc's right edge (0.323) by a hair, and — worse — sat inside
 * {@link sphereHalo}, which is the additive quad that puts the sphere's own
 * emission back on the paint. A figure standing in the halo picks up a warm
 * fringe the cut-out shader never asked for. At the numbers below the leftmost
 * silhouette starts at screen x ≈ 0.35 and the halo dies by 0.34, so nothing in
 * the party touches the sphere or its glow.
 *
 * The last +0.15 of that came with the re-light, and 0.15 is as far as it can
 * go: the wet floor's left fade has to finish before the disc's screen column,
 * which wants the leftmost fighter standing on solid pool, but the *right* end
 * of the arc is pinned by the boss — at +0.30 the front fighter's shoulder was
 * crowding the dais and the composition lost the gap between the party block
 * and the enemy block that makes an FFX frame readable. The arc's shape and its
 * quarter of the frame are unchanged.
 *
 * The arc keeps its shape and stays inside the command window's quarter of the
 * frame. The `party` and `victory` rigs moved with it (see {@link RIGS});
 * nothing else in the scene is keyed to these positions.
 */
const PARTY_SLOTS: Array<[number, number, number]> = [
  [0.28, 0, 1.8],
  [-0.67, 0, 0.75],
  [0.63, 0, -0.75],
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
/**
 * **Solved against the HUD safe area** (`docs/ENGINE-API.md#hud-safe-area`):
 * the FFX HUD's CTB queue owns everything right of 0.815 of the canvas, so an
 * enemy has to finish by 0.79, and the party-status panel's top edge — 0.717
 * once `.ffxhud .ig-stat-list` came down to `bottom: 12px`, 0.684 before it —
 * is what a figure's feet may not sink far past.
 *
 * At `[2.95, 0, -2.9]` Yunalesca measured 0.581..0.803 x, 0.194..0.746 y — over
 * the queue's rail on one side and into the status panel on the other. The
 * 1.1 units of extra depth do both jobs at once: further away is further *left*
 * of the queue and further *up* the frame, so she lands at 0.541..0.746 and
 * 0.199..0.718 with no change to the rig. It costs 7% of her on-screen height,
 * which is the cheapest of the three ways out of the collision (the other two
 * are yawing the camera, which this scene's flat painting cannot afford — see
 * {@link RIGS} — and narrowing the queue, which would ellipsise names).
 *
 * Slots 1 and 2 hold nothing in this chapter; they move with the boss so a
 * future part cannot land where Mortiorchis used to (`gagazet.ts`).
 */
const ENEMY_SLOTS: Array<[number, number, number]> = [
  [2.5, 0, -4.0], // boss -> x 0.541..0.746, y 0.199..0.718 at `idle`
  [3.9, 0, -7.4],
  [0.9, 0, -6.2],
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
   * the left **two fifths** and the violet is given the rest.
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
  // The gold runs to 0.42, not 0.26. The texture's u axis is world x across the
  // whole plane, so a stop at 0.26 put the warm half of the water out at
  // x < -7 — left of everything the camera actually frames, and the party stood
  // on the cold half with the room's only warm source directly beside them.
  smear.addColorStop(0.42, gold);
  smear.addColorStop(0.68, violet);
  smear.addColorStop(1, violet);
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = smear;
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 1;

  // Vertical smears: the actual "reflection" cue, and there are 220 of them.
  // The base colour above went *down* for the restored painting and this went
  // *up*, which is the whole idea — a smooth wash is not water, it is haze lying
  // on the floor. A mirror is *structure*: with the base dark and the bands
  // bright the plane carries the painting's own contrast range instead of
  // averaging to a lavender sheet across the bottom of the frame.
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * size;
    const w = 2 + Math.random() * 18;
    const warm = x < size * 0.46;
    // Held where they were, with the base taken down under them (see `deep` at
    // the call site). Raising *these* as well was tried and measured worse: the
    // bands are drawn with `lighter` at random overlaps, so a broad alpha rise
    // lifts the gaps as much as the peaks and the water's darkest pixel went
    // 0.137 -> 0.157 for no gain in spread. The contrast has to come out of the
    // base, which is one number and affects only the gaps.
    const a = (warm ? 0.26 : 0.12) + Math.random() * 0.26;
    const g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, warm ? `rgba(255,214,150,${a})` : `rgba(196,186,255,${a})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, w, size);
  }

  // Ripple lines across the smears — this is what stops it reading as a blur.
  for (let i = 0; i < 170; i++) {
    const y = Math.random() * size;
    const h = 1 + Math.random() * 2.5;
    ctx.fillStyle = `rgba(214,204,255,${0.06 + Math.random() * 0.17})`;
    ctx.fillRect(0, y, size, h);
  }
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

/**
 * The wet floor's **alpha**, and it is deliberately not a circle.
 *
 * This is the most load-bearing shape in the scene, because the 3D floor is a
 * *lit lavender plane* and the painting's one light source — the cracked golden
 * sphere — is painted into the frame's bottom-left corner, below the 3D
 * horizon. Anywhere this pool has alpha in that corner it is not a floor, it is
 * a veil pulled across the room's only warm source.
 *
 * Measured, with the symmetric `radialCanvas` falloff this replaces: the
 * floor point that projects onto the painted disc's centre is about
 * (-2.9, 0, 1.1), only 3.3 world units from the pool's centre — a quarter of
 * the way out — so the disc was carrying **~0.5 alpha** of lit plane rather
 * than the 0.06 tail the old falloff's comment claimed for it. Hiding the plane
 * and re-shooting the same frame moved the disc from 0.498 mean luma / 0.106
 * warmth to 0.605 / 0.151 against the painting's own 0.540 / 0.125, and its
 * blacks from a filled-in 0.080 back down to 0.133. That is a cracked gold dome
 * turning into a dull terracotta lump and back again, with nothing else in the
 * scene touched.
 *
 * So the pool is **biased off the sphere**: an ellipse centred right of the
 * hall's axis and near the camera, multiplied by a left-hand fade that takes
 * the alpha to nothing before the disc's screen column. The party and the dais
 * keep a floor to stand in and cast onto; the painting keeps its own water in
 * the corner, which is what it was painted with.
 *
 * `cx/cy` and the radii are in texture space, which for this plane is world x
 * across and world z away — see the mesh below for the mapping.
 */
function floorAlphaCanvas(): HTMLCanvasElement {
  const size = 512;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const cx = 0.545;
  const cy = 0.63;
  const rx = 0.27;
  const ry = 0.35;
  // `uFull` is where the floor is at full strength and `uGone` is where it has
  // stopped existing; between them it rolls off with a smoothstep, so the plane
  // dissolves toward the sphere instead of showing an edge.
  const uFull = 0.55;
  const uGone = 0.44;
  const smooth = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const d = Math.hypot((u - cx) / rx, (v - cy) / ry);
      // A bright core under the fighters, a hard shoulder, then a thin tail.
      let a = d >= 1 ? 0 : d < 0.34 ? 1 - d * 0.22 : (1 - (d - 0.34) / 0.66) ** 1.9 * 0.92;
      a *= smooth((u - uGone) / (uFull - uGone));
      const i = (y * size + x) * 4;
      const b = Math.max(0, Math.min(255, Math.round(a * 255)));
      img.data[i] = img.data[i + 1] = img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
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
    // Thin sheets, and a fifth of what they were. Mist is the scene's cheapest
    // way to gain depth and its cheapest way to lose a painting, and a sheet's
    // cost scales with the display transform laid on top of it: at a correct
    // ~2.2 encode these three were putting a quarter of a stop of haze over the
    // *whole* lower half, which is where the sphere is. Composited over paint
    // that already contains its own atmosphere, almost nothing is enough.
    fogPlanes: [
      { z: -30, y: 4.4, width: 66, height: 20, opacity: 0.017, speed: 0.006 },
      { z: -17, y: 2.4, width: 44, height: 11, opacity: 0.007, speed: 0.013 },
      { z: -7.0, y: 1.3, width: 30, height: 6, opacity: 0.003, speed: 0.026, additive: true },
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
    // The key is the *sphere*, and it is a gold key in a violet room.
    //
    // The ceiling on this number is the display transform, not taste: the rig
    // was once tuned against a frame written to the canvas *linearly* (see the
    // palette's note 1), so it burned light to be seen at all, and with the
    // transform put right the same values composited a stop and a half over the
    // paint — 0.475 mean luma against 0.337, with 55k clipped pixels per
    // megapixel. That is why it is not 2.
    //
    // The floor is why it is no longer 1.12 either. 1.12 was solved with a pool
    // whose lit lavender plane covered the painted sphere; the only way to stop
    // that plane washing the gold out was to keep every light in the room low,
    // which cost the *direction* — the party's left side had no more gold on it
    // than their right. With the pool pulled off the sphere
    // ({@link floorAlphaCanvas}) the key can do its job again: 1.28 lays a warm
    // gradient across the wet stone and up the near pillar's left face, dying
    // out before the dais, and nothing else in the room is warm at all.
    keyIntensity: 1.28,
    // The oculus and the twilight between the right-hand pillars.
    rimFrom: [7.4, 6.2, 3.0],
    rimColor: 0xc7c4ff,
    rimIntensity: 0.72,
    // …and the violet is held in proportion to it, so the balance between the
    // sphere's gold and the dome's twilight stays the painting's balance and
    // does not become a warm wash. These move *with* the key, never on their
    // own: a gold key raised by itself is how two earlier passes turned a violet
    // hall amber.
    fillIntensity: 0.62,
    ambientIntensity: 0.32,
    // The fill and ambient are the *painting's* violet twilight, and this matte
    // is a bright one: rgb 90/81/125 at 0.337 luma, its colonnades at 0.273 and
    // the twilight between them at 0.394. These lumas are set to those mid-tones
    // so the 3D floor and the pillar brackets sit on the paint behind them
    // rather than a stop under it, and the intensities above decide how much of
    // that hue actually lands.
    luma: { key: 0.9, fill: 0.62, rim: 0.92, ambient: 0.5 },
    shadows: low ? false : { mapSize: 1024, area: 12, radius: 3.8, bias: -0.0014 },
  });
  group.add(lights.group);

  /**
   * The sphere's own practical. `LightRig.practical` belongs to the presenter
   * (spells and impacts flicker it), so the room's standing warm source is a
   * second light the scene owns and breathes itself.
   */
  const spherePractical = new PointLight(0xffb867, 1.4, 21, 1.8);
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
  const sphereBounce = new PointLight(0xffc178, 0.85, 10.5, 2.0);
  sphereBounce.position.set(-3.2, 0.55, 1.2);
  sphereBounce.name = 'fayth-sphere-bounce';
  group.add(sphereBounce);

  // ------------------------------------------------------------------- floor
  const floorTex = paintedCanvasTexture(
    wetFloorCanvas(
      '#a8763c',
      `#${new Color(normaliseLuma(backdrop.palette.horizon, 0.42)).getHexString()}`,
      // The gaps *between* the reflections, and they are meant to be nearly
      // black. 0.12 left the water with a floor of 0.137 luma where the
      // painting's own water bottoms out at 0.043 — a mirror whose dark side is
      // a sixth of a stop off its bright side is not a mirror, it is a sheen.
      `#${new Color(normaliseLuma(backdrop.palette.ground, 0.085)).getHexString()}`,
    ),
  );
  floorTex.wrapS = floorTex.wrapT = ClampToEdgeWrapping;

  /**
   * The floor's alpha is a *pool* around the fighters, not a plane running to
   * the horizon, and it is offset off the sphere — see {@link floorAlphaCanvas}
   * for why that offset is the whole ballgame here.
   *
   * The profile still has to answer the opposite failure, which is just as
   * real: cut too near and there is no wet floor left at all, and the bottom of
   * the frame measures 0.244 luma against the painting's own waterline at
   * 0.383 — a full stop of black where the matte has moving water. The canvas
   * keeps a near-flat core out to a third of the ellipse (under the fighters,
   * where the plane does its actual job of catching shadows and pools), then
   * falls away on a 1.9 power so the last quarter is a few percent. That thin
   * tail is what the party's own reflection needs to look like it is lying *on*
   * something.
   */
  const floorAlpha = paintedCanvasTexture(floorAlphaCanvas());
  // An alpha map is data, not colour.
  floorAlpha.colorSpace = NoColorSpace;
  floorAlpha.wrapS = floorAlpha.wrapT = ClampToEdgeWrapping;

  const floor = new Mesh(
    // 26 x 23, and the size is what turns {@link floorAlphaCanvas}'s texture
    // coordinates into world ones: u 0 is x = -12.9 and u 1 is x = 13.1, v 0.5
    // is z = 2.6 and v rises toward the dais. So the canvas's `uGone = 0.44`
    // lands at world x = -1.46 and its `uFull = 0.55` at x = 1.4 — solid under
    // the party and the dais, gone before the painted sphere's screen column.
    //
    // That column is the number the fade is actually solved against, and it is
    // *near* the camera that it bites: at the very bottom of the frame the
    // painted disc's right edge (screen x 0.32) is only world x ≈ -1.25, so a
    // fade that finished at -2.3 still left ~0.2 alpha of lit plane on the
    // disc's bright belly.
    new PlaneGeometry(26, 23, 1, 1),
    new MeshLambertMaterial({
      map: floorTex,
      alphaMap: floorAlpha,
      // The painting's water is a *dark* mirror carrying bright reflections, not
      // a pale floor, and this number is the line between the two. Too high and
      // the plane veils the painted sphere it lies in front of: at 0.72 the
      // disc's darkest pixel went from 0.08 luma to 0.33, which is a cracked
      // gold dome with its cracks filled in. Too low and the near half of the
      // frame goes dead against a painting whose own waterline runs at 0.416.
      // 0.38 is a base the lit rig multiplies up to about the paint, with the
      // *reflections* — the smears below and the texture's own bands — carrying
      // the brightness instead of the base colour. It came down from 0.44 in
      // the pass that re-lit the hall for the restored painting, because the
      // gold key went up at the same time: a base that was right under a 1.12
      // key composites as a pale sheet under a 1.36 one, which is the failure
      // this plane keeps walking back into. Dark base, bright bands, is a
      // mirror; the other way round is haze lying on the floor.
      color: new Color(normaliseLuma(backdrop.palette.ground, 0.38)),
      transparent: true,
      depthWrite: false,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  // The pool's offset lives in the **alpha canvas**, not here. Moving the mesh
  // would drag the wet-floor texture's own gold/violet split along with it, and
  // that split is solved against world x — the gold belongs beside the sphere
  // whether or not the plane is opaque there.
  floor.position.set(0.1, 0, 2.6);
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
   * A soft blob wider than the disc it sits on is not a halo, it is a veil: a
   * 1.24-scale version spread a low-alpha wash across the whole lower-left
   * quadrant and lifted the painted sphere's *shadows* as much as its
   * highlights, which is exactly how a cracked gold dome turns into a flat
   * terracotta hemisphere. Held inside the disc's own footprint, it adds value
   * where the paint is already bright and leaves the cracks their contrast.
   *
   * The number here is the peak of the breath driven in `update`, not a second
   * opinion about it — see the note there. It is small because an additive quad
   * over paint that is already the brightest thing in the frame is the fastest
   * way in this scene to turn a light source into a white hole: at 0.28 the
   * sphere's quadrant composited at 0.852 mean luma against the painting's
   * 0.387, i.e. blown flat.
   */
  const sphereHalo = sphereGlow(0xffb95c, 0.022, 0.92, BACKDROP.distance + 1.0, -13);
  // Biased **down** the disc. The painting's dome is brightest across its lower
  // belly (its own brightest pixel is at v 0.83) and carries a hard painted rim
  // along its top edge at v ≈ 0.66; a halo centred on the disc's geometric
  // middle put its own peak on that rim and clipped a 1300-px hole there, which
  // is the painted silhouette of the sphere being erased by the sphere's glow.
  // Biased down, and with the pair now running at about half the alpha the
  // grey-matte pass used, that hole measures 26 px at `idle` — the painting
  // itself clips 34 px on the same rim at this resolution, so the added glow now
  // does less damage to the paint than the paint does to itself.
  sphereHalo.position.y -= SPHERE_ON_PAINTING.h * 0.09;
  sphereHalo.name = 'sphere-halo';
  group.add(sphereHalo);
  /**
   * The core: small, near-white, and the brightest thing the scene lays on the
   * paint. It stays *inside* the painted dome's bright belly, and it is kept
   * quiet enough that it lifts the paint toward the bloom threshold rather than
   * straight through it — an additive quad that crosses the threshold on top of
   * paint already sitting at 0.95 does not make the sphere glow, it punches a
   * white hole where the sphere was. With the grade's highlight rolloff (see
   * `palette` note 3) the disc still runs from 0.11 luma in its cracks to 0.97
   * at its belly, which is the contrast range the paint was made in.
   */
  const sphereCore = sphereGlow(0xfff0d0, 0.07, 0.29, BACKDROP.distance + 1.2, -12);
  sphereCore.position.y += SPHERE_ON_PAINTING.h * 0.08;
  sphereCore.name = 'sphere-core';
  group.add(sphereCore);

  /**
   * The sphere's reflection: one long gold smear running out of the painting's
   * glow toward the camera. A real mirror would cost a second render pass; a
   * stretched additive blob laid on the water buys ninety percent of the read
   * for one quad, and it is the single element that makes the floor look wet.
   *
   * It is aimed, not placed: it runs out of the painted disc toward the camera
   * and past the party's feet, so the gold on the water is plainly the sphere's
   * and not an unexplained warm patch.
   *
   * **Beside the disc, not across it.** This is the one thing the framing forces
   * and it is easy to get backwards. The painting's sphere occupies screen
   * y 0.72..1.0 at `idle` — the painted water *underneath* it is cropped off the
   * bottom of the frame — so a smear laid in the disc's own screen column has
   * nothing to lie on but the disc, and every version that did it turned the
   * lower left milky: the whole quadrant measured no pixel darker than 0.37 luma
   * against the painting's 0.12. Moved one column to the right, it runs on the
   * water *between* the sphere and the party, which is the only water in frame
   * the sphere can plausibly be reflected in, and the disc keeps its own blacks.
   *
   * **Narrow is the other half.** Wide and bright, this quad is seen almost
   * edge-on and spreads into a horizontal band across the bottom of the frame
   * rather than a streak running away from the camera. 2.9 units across 26 long
   * is nine to one, and a reflection only reads as a reflection if it is much
   * longer than it is wide.
   *
   * It is narrower **and** brighter than the pass before it, and the two go
   * together. That pass split the same energy between this streak and the broad
   * {@link nearWet} blob beside it, and the broad one won: the water between the
   * sphere and the party measured 0.110 sd with its darkest pixel at 0.157,
   * against 0.134 and 0.043 in the painting — a low, even veil with no streak
   * visible in it at all, which is the one thing this quad exists to draw. Half
   * the blob's alpha moved into this quad instead. Same light in the room, but
   * spent on structure rather than on a wash, which is the same trade the wet
   * floor's own texture makes (dark base, bright bands).
   */
  const sphereReflection = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({
      map: blobTex,
      color: 0xffc271,
      transparent: true,
      // The peak of the breath in `update`, not a second opinion about it.
      opacity: 0.5,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
    }),
  );
  /**
   * **Yawed, not axis-aligned.** A streak laid straight down +z holds one world
   * x while the frame's own left edge walks outward with distance, so on screen
   * it slides off the side of the picture before it has run half its length —
   * which is why an earlier version of this quad was invisible at the `idle` rig
   * even at full brightness. Solved on the screen instead. The target column is
   * the strip immediately right of the painted disc (screen x ≈ 0.30..0.40), and
   * the floor points that project there are about (-2.0, 0, 2) near the camera
   * and (-5.4, 0, -13) back at the colonnade — the frame's edge walks outward
   * with distance, so holding a screen column means drifting 3.4 units left over
   * that run. The quad is laid along exactly that line, 13° off the hall's axis,
   * so the gold stays in one column of the picture for its whole length and
   * reads as a single smear receding on wet stone.
   *
   * `rotation.z` on a plane already tipped flat by `rotation.x = -π/2` is a yaw
   * about world Y (three.js composes Euler 'XYZ' as `RX·RY·RZ`, so the Z spin
   * happens in the plane's own surface first).
   */
  sphereReflection.rotation.set(-Math.PI / 2, 0, 0.223);
  sphereReflection.scale.set(2.9, 26, 1);
  sphereReflection.position.set(-3.5, 0.012, -4.2);
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
      color: 0xffc98a,
      transparent: true,
      // Halved, and the half went into `sphereReflection` above. A broad soft
      // blob laid on the near floor raises every pixel under it by the same
      // amount, so it costs the water its darkest values and buys no shape;
      // this is now just enough to stop the stone in front of the camera going
      // inert where the party occludes the streak.
      opacity: 0.037,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
    }),
  );
  nearWet.rotation.x = -Math.PI / 2;
  nearWet.scale.set(6.2, 8.0, 1);
  nearWet.position.set(-2.2, 0.01, 1.6);
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
      opacity: 0.145,
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
  // A harder horizontal feather than the default. At 0.34 the three quads
  // overlapped into one broad pale cone that filled the middle of the frame and
  // read as haze; the painting's own light is a *shaft*, with an edge.
  const beamTex = clampTexture(paintedCanvasTexture(beamCanvas(0.17)));
  /**
   * **A shaft has an edge; haze does not.** These are additive quads over paint
   * that already contains its own light, so the painting is the exposure
   * reference and not the quad — the band the main shaft crosses composites at
   * 0.313 mean luma against the painting's own 0.273 for the same band, which is
   * about as far over as a light the painting does not contain is allowed to go.
   * What buys the read at that budget is the *feather*, not the alpha: at the
   * stock 0.34 horizontal softness the three quads dissolve into one broad pale
   * cone standing in the middle of the hall, and at 0.17 the same energy has
   * sides and lands as light falling through a hole in a roof.
   */
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
    // falls down screen x ≈ 0.36, and the painted oculus sits at screen
    // x 0.345..0.418 — so the 3D shaft reads as the continuation of the painted
    // one rather than as a second, unexplained light.
    //
    // **Its top edge is solved so the quad stops exactly where the painted
    // oculus stops.** A godray drawn additively over the light source it comes
    // out of is the fastest way to blow a highlight in this scene, and this one
    // kept doing it: the painting's oculus is rgb 242/205/253 — luma 0.847 with
    // its blue channel already two values off the top — and a shaft crossing it
    // at 60% of the beam texture's alpha was laying ~0.30 of extra additive
    // value onto paint that has nowhere to go. Measured: 26% of the oculus crop
    // clipped, against 0.01% in the painting itself. Lifting and lengthening the
    // quad did not fix it, because a longer quad only moves *which* part of the
    // gradient crosses the paint.
    //
    // So it is aimed instead. The painted oculus's lower edge is screen y 0.10,
    // which is world y 13.8 on the backdrop plane at z = -56; the ray through it
    // passes y ≈ 6.6 at this shaft's own depth of z = -14. Top edge at 6.6
    // (centre -1.4, height 16) puts the beam texture's bright head just *below*
    // the painted sun, where the dome interior is dark violet — which is both
    // the safe place for it and the correct one: a shaft is visible where it
    // leaves the aperture, not on top of it.
    //
    // The **bottom** edge is solved too, which is why the quad is 16 long rather
    // than 20. At 20 its dead-soft foot reached y = -13 and crossed the water in
    // front of the party, where an almost-invisible beam is indistinguishable
    // from fog lying on the floor — the frame's lower left held no pixel darker
    // than 0.37 luma with it there. Stopping it at y = -9.4 leaves the shaft in
    // the air, which is the only place a shaft exists.
    { w: 4.4, h: 16, pos: [-2.6, -1.4, -14.0], tilt: 0.17, yaw: 0.1, opacity: 0.27, speed: 0.31 },
    // A narrower one further back and to the right, through a crack.
    { w: 3.4, h: 20, pos: [4.2, 8.0, -19.0], tilt: -0.12, yaw: -0.14, opacity: 0.2, speed: 0.23 },
    // A broad, faint wash close to the camera, so the near air is not empty.
    // Lifted and shortened as well as dimmed: at y 6.8 / h 17 its dead soft foot
    // landed on the painted sphere, and a godray is the one thing in this scene
    // allowed to cross a colonnade but never a light source.
    { w: 9.5, h: 14, pos: [1.2, 7.8, -8.0], tilt: 0.24, yaw: 0.04, opacity: 0.032, speed: 0.17 },
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
    count: Math.round(1150 * k),
    // The shaft is 4.4 across and 16 long, tilted 0.17; these bounds are that
    // volume with a little slack, so a mote is only ever somewhere the beam can
    // actually be lighting it. Widen them and the "dust in the godrays" becomes
    // dust in the room, which is fog with extra steps.
    bounds: { x: 3.4, y: 7.0, z: 3.2 },
    colors: [0xe6ecff, 0xd0c8f6, 0xffeccb],
    size: 4.0,
    sizeJitter: 0.8,
    drift: [0.01, -0.03, 0.004],
    wobble: [0.4, 0.22, 0.32],
    wobbleSpeed: 0.26,
    twinkle: 0.62,
    opacity: 0.62,
    additive: true,
    hardness: 0.3,
  });
  // On the main shaft's own axis, dropped so the field spans the whole visible
  // length of the beam instead of only its bright top end.
  dust.position.set(-2.5, 3.2, -13.4);

  /**
   * Golden pyreflies, near band: big, slow, in front of the party.
   *
   * **Many and slow** is the whole brief for these. FFX's Zanarkand dome is
   * thick with them, and they are the one element that sells the room as the
   * place a thousand summoners died in — so the counts are high (620 / 760 /
   * 1000 across the three bands, halved by `quality: 'low'`), the drift is
   * barely a crawl (0.07 u/s against the preset's 0.42) and the twinkle is the
   * only fast thing about them.
   *
   * The **opacities** are about a third of what they were, for the same reason
   * every additive element in this scene came down: they were set against a
   * frame that was reaching the canvas linearly, and at a correct display
   * transform an 0.84-alpha mote is a hard white dot. Count carries the room;
   * alpha only decides whether they are pyreflies or snow.
   *
   * They came down a second time when the tilt-shift band was widened, and that
   * is not a coincidence — it is the trade. While the bottom of the frame was
   * carrying 1.6 px of lens blur, the blur was quietly doing this job: it spread
   * each mote's saturated core into its own gold fringe. Sharpen the frame and
   * the motes go back to being hard specks, and a hard additive speck at 0.5
   * alpha clips its red channel first, then its green, and photographs white —
   * the hall reads as snowing indoors. Alpha 0.34..0.44 over the *same* counts
   * keeps every mote inside the gold, and the count is what the brief is
   * actually asking for.
   *
   * The **colours** went a step deeper at the same time (0xffcd78 -> 0xffc163,
   * and the far band to a near-amber 0xff9f2e) for the reason spelled out below:
   * additive plus bloom only ever travels *toward* white, so wherever the
   * palette starts is the warmest the mote will ever be, and the far band — the
   * smallest, densest, highest motes, the ones that read as snow first — needs
   * the most headroom of the three.
   *
   * They are golden-*white*, and the gold has to be in the **source** colour: a
   * pure white mote reads as snow, and so does a pale gold one, because an
   * additive sprite under a bloom pass climbs toward white on its own. The
   * palette below starts one step warmer than the mote should look and the
   * compositing does the rest.
   */
  const pyrefliesNear = new ParticleField(
    ParticlePresets.pyreflies({
      count: Math.round(1020 * k),
      // Dropped and deepened: the near band used to float at chest height and
      // above, so the bottom third of the frame — the water, the sphere, the
      // party's feet — had no pyreflies in it at all, and the hall read as
      // snowing near the ceiling. y 4.6 around a centre at 1.5 puts motes from
      // the waterline to just over the party's heads.
      bounds: { x: 10.5, y: 4.6, z: 6.0 },
      // Golden-white, and the gold is the *base*: at 0xfff2d4 the near band
      // photographed as white specks — an additive mote under a bloom pass
      // climbs toward white on its own, so a palette that starts near white
      // finishes there and the hall looks like it is snowing indoors.
      colors: [0xffc163, 0xffd486, 0xffb44e, 0xffa93c, 0xffca74],
      size: 8.0,
      drift: [0.01, 0.07, 0.005],
      wobble: [0.5, 0.2, 0.36],
      wobbleSpeed: 0.3,
      twinkle: 0.7,
      opacity: 0.44,
    }),
  );
  pyrefliesNear.position.set(-0.8, 1.5, -0.5);

  /** Mid band: between the party and the dais, so the hall's air has depth. */
  const pyrefliesMid = new ParticleField(
    ParticlePresets.pyreflies({
      count: Math.round(1240 * k),
      bounds: { x: 12, y: 5.2, z: 7.0 },
      colors: [0xffc169, 0xffd48b, 0xffb149, 0xffc477],
      size: 7.2,
      drift: [0.008, 0.075, 0.003],
      wobble: [0.52, 0.2, 0.38],
      wobbleSpeed: 0.26,
      twinkle: 0.78,
      opacity: 0.4,
    }),
  );
  pyrefliesMid.position.set(-1.2, 2.4, -6.2);

  /** Far band: smaller and denser, drifting up between the pillars. */
  const pyrefliesFar = new ParticleField(
    ParticlePresets.pyreflies({
      count: Math.round(1600 * k),
      bounds: { x: 15, y: 6.4, z: 9.5 },
      colors: [0xffbe62, 0xffcb7d, 0xffb047, 0xff9f2e],
      size: 5.4,
      drift: [0.006, 0.06, 0.0],
      wobble: [0.55, 0.22, 0.4],
      wobbleSpeed: 0.24,
      twinkle: 0.82,
      opacity: 0.34,
    }),
  );
  pyrefliesFar.position.set(-1.6, 3.2, -12.0);

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
      // Thinner and pushed a unit further out than it was. A bracket is a *band*
      // at the edge of the frame; at radius 1.15 and x 6.5 this one projected as
      // a near-black slab over the last seventh of the picture, and the seventh
      // it covered is where the restored painting keeps its brightest twilight
      // (that band measures 0.438 luma in the paint and read 0.288 composited,
      // almost all of the loss being this column). At 0.86 / 7.35 it still seals
      // the frame edge for every rig and gives the pink sky back.
      [8.1, -2.0, 24, 0.78, pillarDark, false],
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
      const pool = makeLightPool({ color: 0xffc178, radius: 1.6, opacity: 0.085 });
      pool.position.set(s[0] - 0.34, 0.02, s[2] + 0.12);
      return pool;
    }),
    (() => {
      const pool = makeLightPool({ color: 0xf2d24a, radius: 2.4, opacity: 0.115 });
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
     * The Zanarkand grade, solved against the painting that is on disk.
     *
     * The reference is `public/art/backdrops/zanarkand-dome.png` itself: mean
     * rgb 90/81/125 at **0.337 luma**, sd 0.220, HSV saturation 0.446, its
     * colonnades at 0.273, the twilight on the right at 0.394, the water at its
     * foot at 0.416, the sphere's quadrant at 0.387, and 494 eroded-clipped
     * pixels per megapixel — all of that its own oculus core. Those six numbers
     * are what this grade is scored against.
     *
     * 1. **`gamma` here is the display transform, not a taste control.** This is
     *    the one thing about grading this engine that has to be understood
     *    before any number below makes sense, because every pass that has got it
     *    wrong has got it wrong the same way.
     *
     *    `EffectComposer`'s render targets carry `NoColorSpace`, so the whole
     *    post chain runs on **linear** values, and `GradeShader` — a raw
     *    `ShaderMaterial` with no `<colorspace_fragment>` include — is the last
     *    pass and writes straight to the canvas. Nothing in the chain applies
     *    the sRGB encode. `GradeShader`'s own `pow(c, 1/gamma)` is therefore the
     *    display transform for this scene, and the neutral value for it is not
     *    1.0 but **≈2.2**.
     *
     *    That is measurable rather than theoretical. The painting's 0.337 mean
     *    is an sRGB number; decoded it is 0.093 linear, and an unlit plane hands
     *    the compositor exactly that. `0.093 ^ (1/2.2) = 0.340` — the painting
     *    reproduced to within a value. At `gamma 1.0` the same plane composites
     *    at 0.093, which is the dim hall every pass before this one has been
     *    fighting with lights.
     *
     *    So gamma is pinned at the transform and the *look* is cut with `gain`,
     *    `lift` and `saturation`, which is where a look belongs.
     * 2. **Nothing is bought with exposure.** `Renderer` runs `NoToneMapping`,
     *    and three.js only applies `toneMappingExposure` inside a tone-mapping
     *    function — with none compiled in, the uniform does nothing at all. It
     *    stays at 1.0 so the next pass does not spend a day on a dead control.
     * 3. **The look is in `gain` and `lift`.** `gain` carries the stock palette's
     *    violet split — red and blue over one, green under — so the hall keeps
     *    the painting's magenta-violet instead of drifting to grey-blue, and the
     *    gold from the sphere keeps its bite. `lift` is barely negative: under a
     *    2.2 gamma a negative lift bites very hard in the darks, and a few
     *    thousandths is all it takes to hold the pillar brackets and the deep
     *    hall black. `saturation` comes down to 1.02 because a linear-composited
     *    frame is *already* over-saturated by the encode — the pass this
     *    replaces measured HSV 0.67 against the painting's 0.446 — and because
     *    `shadowTintAmount` is putting violet into the shadows underneath it.
     *    The shipping frame measures 0.469 against the painting's 0.445.
     * 4. **Bloom's threshold is a linear number, which is why 0.98 was off.**
     *    `UnrealBloomPass` runs before the grade, so it thresholds the *linear*
     *    frame. The painting's brightest paint — the oculus, the sphere's core —
     *    is sRGB 0.95, i.e. **0.89 linear**, and the frame's mean is 0.093: a
     *    0.98 threshold sat above everything in the picture and the scene's own
     *    light source did not glow. 0.86 catches the painted oculus, the
     *    sphere's belly, the pyreflies and the VFX and nothing else.
     *
     *    The **strength** is the other half, and the painted oculus is what
     *    caps it. That one patch of paint is already sRGB 0.95..1.0 with its own
     *    ironwork detail inside it, so every point of bloom strength is spent
     *    filling that detail in: at 0.20 the oculus crop measured 0.855 mean
     *    with its darkest pixel at 0.453, against the painting's 0.786 / 0.228,
     *    and it read as a flat white hole punched in the roof. 0.082 with the
     *    radius opened to the full 1.0 spreads the same energy instead of
     *    stacking it — the sphere, the motes and the boss's aura all still
     *    cross the line.
     *
     *    Strength came down the last notch (0.095 -> 0.082) and the radius went
     *    up (0.9 -> 1.0) off a clip *map* rather than a clip count: binned into
     *    a 10x10 grid of the frame, every eroded-clipped pixel in the shipping
     *    shot fell in **one** cell, screen x 0.2..0.3 by y 0.0..0.1 — the
     *    painted oculus, and nothing else in the picture. Not the sphere, not
     *    the pyreflies, not the boss's near-white wing flares. So the only
     *    highlight worth spending anything on is that one patch of paint, and
     *    the cheapest way to hold it is to stop stacking bloom on top of paint
     *    that is already sRGB 0.95..1.0.
     * 5. **Scored on blown highlights, not eyeballed.** The metric is clipped
     *    pixels surviving a 5x5 erosion, normalised per megapixel so the shot's
     *    resolution does not flatter it. The painting scores 494/Mpx. The frame
     *    that came before this pass scored **5685/Mpx while sitting a full stop
     *    under the paint** — crushed and blown at once, which is what a wrong
     *    display transform does. This grade lands the composite inside the
     *    painting's own numbers. Shipping, at the `idle` rig, against the crop
     *    of the painting that rig actually frames (u 0.116..0.935,
     *    v 0.069..0.845):
     *
     *    | | painting | frame |
     *    |---|---|---|
     *    | mean luma / sd | 0.355 / 0.213 | 0.361 / 0.211 |
     *    | HSV saturation | 0.445 | 0.469 |
     *    | eroded clip / Mpx | 31 | 431 |
     *    | sphere quadrant | 0.540, warm +0.125 | 0.586, warm +0.143 |
     *    | near water | 0.384 | 0.378 |
     *
     *    Every one of the 431 clipped pixels is in the painted oculus. The pass
     *    this replaces scored 1088 while the sphere sat at 0.498 / +0.106 and
     *    the water at 0.306 — dimmer than the paint *and* more blown than it.
     */
    palette: {
      ...ScenePalettes.zanarkandDome,
      // The painting carries its own falloff into the corners, and this
      // composition puts its one warm source in the bottom-left corner. A
      // stock 0.58/0.54 vignette takes 45% of the sphere's value away.
      vignette: 0.16,
      vignetteRadius: 0.86,
      // Dead control under NoToneMapping; see note 2.
      exposure: 1.0,
      lift: [-0.006, -0.008, -0.004],
      // The display transform (note 1), with a half-step of extra red so the
      // gold reads warm and a half-step off green so the violet stays violet.
      gamma: [2.34, 2.26, 2.3],
      gain: [0.828, 0.795, 0.885],
      saturation: 1.02,
      shadowTintAmount: 0.16,
      bloomThreshold: 0.86,
      bloomStrength: 0.082,
      bloomRadius: 1.0,
      /**
       * **The tilt-shift band is moved down onto the subject.**
       *
       * `ScenePalettes.zanarkandDome` focuses at screen y 0.38 with a 0.14 band
       * and 5 px of blur, which is the right band for a scene whose subject is
       * on the horizon. This composition's two subjects are the **party** (feet
       * at screen y ≈ 0.90) and the **painted sphere** (y 0.72..1.0), and both
       * of them sat four band-widths outside the focus, under the full 5 px.
       *
       * That is the single largest reason the restored painting stopped reading
       * down there: measured over the sphere's disc the frame kept the paint's
       * mean but lost its *floor* — no pixel darker than 0.375 luma survived,
       * against 0.131 in the painting itself. A 5 px blur laid over a cracked
       * gold dome does not dim it, it fills its cracks with its own highlights,
       * and a lens blur is the one effect a grade cannot take back out.
       *
       * Focus at 0.66 with a 0.50 band keeps everything from the colonnade's
       * feet (screen y 0.41) to screen y 0.91 sharp, which is the party, the
       * boss's feet, the whole painted sphere **and the water in front of it**,
       * and 1.2 px is enough to throw the dome's ironwork soft — which is all
       * the band was ever for.
       *
       * The band came down the frame once more (from 0.62/0.42/1.6) because the
       * sharp zone still stopped at 0.83 and the two things this composition is
       * *about* live below that line. Measured against the painting's own crop:
       * the water between the sphere and the party ran 0.114 sd with its
       * darkest pixel at 0.137, against 0.134 and **0.043** in the paint, and
       * the sphere's disc ran 0.189/0.149 against 0.207/0.121. Those are not
       * dimming errors — the means were within 0.03 — they are a blur filling
       * the cracks in a cracked gold dome and the gaps between the reflections
       * on wet stone with their own highlights. Sharp to 0.91 hands both back.
       *
       * The blur keeps coming down, and the reason is always the same: a lens
       * blur costs more the brighter the frame it is laid over, and it is the
       * one effect a grade cannot take back out. At 2.4 px it was pulling the
       * painted oculus's ironwork into the oculus itself and adding to the one
       * blown region in the shot.
       */
      tiltFocus: 0.66,
      tiltBandWidth: 0.5,
      tiltMaxBlur: 1.2,
    } satisfies ScenePalette,
    update(dt: number): void {
      clock += dt;
      backdrop.update(dt);
      lights.update(dt);
      for (const p of particles) p.update(dt);

      // The sphere breathes; everything warm in the room breathes with it, so
      // the bloom always has something living in it.
      const pulse = 0.82 + Math.sin(clock * 0.53) * 0.18;
      spherePractical.intensity = 1.7 * pulse;
      sphereBounce.intensity = 0.88 * pulse;
      (sphereReflection.material as MeshBasicMaterial).opacity = 0.27 + pulse * 0.23;
      (nearWet.material as MeshBasicMaterial).opacity = 0.021 + pulse * 0.016;
      /**
       * The painted sphere breathes with its own light.
       *
       * **These four lines are the sphere, not the constructor's.** `update` runs
       * on the first frame, so whatever the materials were built with is dead
       * the moment the scene starts — the pass this replaces left the halo built
       * at 0.30 and driven here at 0.055..0.090, and the 0.30 in the constructor
       * was read by two later passes as the value that was shipping. It was not:
       * the room's only light source was compositing at a fifteenth of the alpha
       * its own comment claimed, which is most of why the restored painting's
       * gold dome photographed as a dead terracotta lump.
       *
       * The halo swings wider than the core, because a core that pumped this
       * hard would cross the bloom threshold and back on every breath and
       * strobe. Both are additive over paint that is already bright, so they are
       * scored on the clipped-pixel count, not on how gold they look paused.
       */
      (sphereHalo.material as MeshBasicMaterial).opacity = 0.01 + pulse * 0.012;
      (sphereCore.material as MeshBasicMaterial).opacity = 0.038 + pulse * 0.032;
      (bossPool.material as MeshBasicMaterial).opacity = 0.09 + Math.sin(clock * 0.81) * 0.026;
      (daisRing.material as MeshBasicMaterial).opacity = 0.115 + Math.sin(clock * 0.62) * 0.03;

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
