import {
  AdditiveBlending,
  ClampToEdgeWrapping,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  NoColorSpace,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  type PerspectiveCamera,
} from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import { BattleCamera, type CameraRig } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { PaintedActor } from '../engine/PaintedActor.ts';
import {
  artUrl,
  characterUrl,
  normaliseLuma,
  paintedCanvasTexture,
  watchAssets,
  type AssetWatcher,
} from '../engine/PaintedArt.ts';
import { ParticleField, ParticlePresets } from '../engine/Particles.ts';
import { paintBossSilhouette, radialCanvas, rng } from '../engine/ProceduralArt.ts';
import { ScenePalettes } from '../engine/ScenePalettes.ts';
import { HitEffects } from '../engine/VFX.ts';
import { FARPLANE_STAGING } from './farplane-parts.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import type { AssetReport, PaintedScene } from './demo.ts';
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
 *
 * The Farplane rig sits **lower and flatter** than Gagazet's (2.7 high, a 6.4°
 * downward pitch rather than 9°). The painting is a high-horizon composition —
 * its flower field is only the bottom quarter of the image and everything above
 * is sky — so a steep FFX-style look-down would drive the painted horizon off
 * the bottom of the frame and stand the party in front of painted clouds. A
 * shallow pitch keeps the painted horizon at ~78% of frame height, below the
 * geometric horizon at ~30%, which is the ordering that makes the painting read
 * as distance rather than as wallpaper.
 */
const CAMERA_REF: [number, number, number] = [0, 2.7, 9.8];

/**
 * FFX framing (fov 30–34, slight elevation, party in a shallow left-facing arc
 * lower-left, enemies right and further back), plus the Farplane's own `reveal`
 * rig: the wide, almost level "arrival" shot the visual bible calls the game's
 * prettiest single image — the party small against an enormous pink-violet sky
 * with petals and light rising through the whole frame.
 */
const RIGS: Record<SceneRigName, CameraRig> & Record<string, CameraRig> = {
  intro: { position: [-2.2, 4.2, 13.2], lookAt: [1.0, 2.4, -3.0], fov: 30, sway: 1.4 },
  idle: { position: CAMERA_REF, lookAt: [0.5, 1.45, -1.4], fov: 32 },
  // Far enough back that the attacker (mid-lunge, ~x 0.4) and the boss (x 2.75)
  // are both in frame; an action rig that frames only the target turns every
  // attack beat into a shot of the target.
  action: { position: [-0.15, 2.55, 9.6], lookAt: [1.05, 1.5, -1.2], fov: 32, sway: 0.7 },
  party: { position: [-1.6, 2.0, 6.6], lookAt: [-2.9, 1.2, 0.4], fov: 32, sway: 0.7 },
  enemy: { position: [1.5, 2.4, 5.8], lookAt: [3.1, 1.8, -2.5], fov: 32, sway: 0.7 },
  victory: { position: [-1.2, 1.9, 6.8], lookAt: [-2.5, 1.2, 0.8], fov: 32, sway: 1.2 },
  // The wide one. Nearly level (2.1° up), so the sky, the light-spire and the
  // whole rising column of petals are in shot at once.
  reveal: { position: [-1.2, 2.2, 13.6], lookAt: [0.2, 2.9, -5.5], fov: 34, sway: 1.5 },
};

/**
 * Three active slots in the FFX arc, then four reserve slots off frame-left.
 *
 * **Re-measured for the X-2 party**, the same way and for the same reason as
 * `bevelle-underground.ts` (see the long note on `PARTY_SLOTS` there): the old
 * zig-zag swung the middle slot out to x -2.95, which this scene's `action` rig
 * projects almost off the left edge, and the three girls collapsed into one
 * pile (`docs/screenshots/53-ffx2-vegnagun.png`). Measured at `idle`/`action`
 * with `stage.project` at 1600x900, these land at 295/498/648 and 194/408/562 —
 * staggered front to back, none closer than ~150px to her neighbour.
 *
 * Slot order is the build's `members` order: Yuna, Rikku, Paine, left to right.
 */
const PARTY_SLOTS: Array<[number, number, number]> = [
  [-2.3, 0, 1.45], // front-left  (Yuna)
  [-1.45, 0, 0.1], // middle, stepped right and back (Rikku)
  [-0.55, 0, -1.3], // back-right, furthest from camera (Paine)
  // Reserve — parked well outside every rig's frustum, frame-left.
  [-11.5, 0, 2.6],
  [-12.4, 0, 1.0],
  [-13.3, 0, -0.6],
  [-14.2, 0, -2.2],
];

/**
 * Boss centre-right, then flanking slots for the parts of a big machine.
 *
 * **Solved against the HUD safe area** (`docs/ENGINE-API.md#hud-safe-area`).
 * The FFX-2 rail is 0.72 of the canvas — the command stack's left edge is
 * 0.745, the party column's is 0.725 — and the Vegnagun tail is the widest
 * figure in the game: 0.49 of the frame across. At `[2.75, 0, -2.3]` it
 * measured **0.436..0.926**, so the last quarter of the tail, the part with the
 * tip on it, was drawn under the menu or past the right edge
 * (`docs/handoff/playability-round-1.md` §4 issue 3).
 *
 * 1.95 units left and 2.7 back bring it to 0.303..0.713. The blade is still
 * 0.41 of the frame wide and 0.50 tall and still sweeps corner to corner, which
 * is the shot; what changed is that it now *ends* inside the frame, so the tail
 * reads as a tail rather than as a wall.
 *
 * Four slots: `vegnagun-leg` fields three Nodes on slots 1-3. They are
 * figure-less now (`farplane-parts.ts`, D-044), so only the count matters.
 */
const ENEMY_SLOTS: Array<[number, number, number]> = [
  [0.8, 0, -5.0], // boss -> x 0.303..0.713, y 0.135..0.633 at `idle`
  [2.3, 0, -8.0],
  [-0.5, 0, -6.6],
  [1.0, 0, -9.4],
];

/** Canonical world heights for the figures the preview stages. */
export const FARPLANE_ACTOR_HEIGHTS = {
  tidus: 1.75,
  yuna: 1.68,
  seymourFlux: 2.6,
} as const;

/**
 * The scene's default cut-out protection for a painted actor parked on
 * {@link SceneBuild.enemySlots} — spread it into the actor options rather than
 * restating the numbers:
 *
 * ```ts
 * const boss = await PaintedActor.fromSubject('seymour-flux', {
 *   ...FARPLANE_ENEMY_ACTOR_DEFAULTS,
 *   worldHeight: FARPLANE_ACTOR_HEIGHTS.seymourFlux,
 * });
 * ```
 *
 * Boss art is generated **full-bleed**. `seymour-flux/idle.png` is 832x1214
 * with a `cropBox` covering the whole image and roughly 90% of its pixels
 * opaque: the aura runs off all four sides, so the "cut-out" ends on the
 * plane's own rectangle. Three things together stop that reading as a frame:
 *
 * - `matte: 'force'` runs the border flood fill, which takes out the white
 *   studio background — about a fifth of the image — wherever it is continuous
 *   with the outside of the figure. It cannot reach the white *enclosed* by the
 *   aura, which is why those pockets survive as the aura's white wings;
 * - `edgeFade` feathers the outer band of the plane, which is the only thing
 *   that can help where the surviving paint *is* the aura. It is much wider
 *   here than at the other two locations: against Gagazet's near-black valley a
 *   surviving border of dark aura is invisible, but this frame is bright pastel
 *   paint edge to edge and the same border drew a hard dark rectangle across
 *   the sky at the top-left of the figure;
 * - `alphaCut` is kept **low**. Raising it does not remove the remnant — it is
 *   opaque enough to survive any threshold — and a hard cut only puts a crisp
 *   border back on the tail of the feather.
 *
 * The real fix is a regenerated PNG with a genuinely transparent background;
 * this is what the scene can do from its own side until that lands.
 */
export const FARPLANE_ENEMY_ACTOR_DEFAULTS = {
  matte: { mode: 'force' as const },
  edgeFade: 0.34,
  alphaCut: 0.03,
} as const;

/** The slot table `src/scenes/index.ts` hands to the battle. */
export const FARPLANE_SLOTS = {
  party: PARTY_SLOTS.slice(0, 3) as Array<[number, number, number]>,
  enemy: ENEMY_SLOTS,
  partyHeight: 1.78,
  enemyHeight: 3.4,
};

// ---------------------------------------------------------------------------
// The glowing flower field
// ---------------------------------------------------------------------------

interface FlowerTints {
  soil: string;
  leaf: string;
  bloomA: string;
  bloomB: string;
  bloomC: string;
  core: string;
}

function hex(c: Color): string {
  return `#${c.getHexString()}`;
}

/** `rgba()` string for a THREE colour at a given alpha. */
function rgba(c: string, a: number): string {
  const col = new Color(c);
  return `rgba(${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)},${a})`;
}

/**
 * The ground texture: a tiling mat of glowing flowers, painted procedurally
 * from colours **sampled out of the backdrop painting** so the 3D field and the
 * painted field are the same flowers.
 *
 * Two canvases come back, drawn from the same seeded RNG so they register
 * exactly: `base` is the lit diffuse mat (a Lambert map, so the light rig and
 * the actors' shadows land on it), `glow` is only the blossom cores on
 * transparent black, drawn additively a hair above the ground. Splitting them
 * is what lets the blooms cross the palette's 0.82 bloom threshold and glow
 * while the mat itself stays a lit surface instead of a light box.
 */
function paintFlowerField(
  size: number,
  seed: number,
  tints: FlowerTints,
): { base: HTMLCanvasElement; glow: HTMLCanvasElement } {
  const base = document.createElement('canvas');
  base.width = base.height = size;
  const glow = document.createElement('canvas');
  glow.width = glow.height = size;
  const b = base.getContext('2d')!;
  const g = glow.getContext('2d')!;
  const rand = rng(seed);

  // ------------------------------------------------------------- the mat
  b.fillStyle = tints.soil;
  b.fillRect(0, 0, size, size);

  // Broad pale sweeps first: the painted field is lit in long bright swathes,
  // and without them the mat is one flat value under the blossoms.
  for (let i = 0; i < 14; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = size * (0.18 + rand() * 0.3);
    const sweep = b.createRadialGradient(x, y, 0, x, y, r);
    sweep.addColorStop(0, rgba(tints.core, 0.2 + rand() * 0.14));
    sweep.addColorStop(1, rgba(tints.core, 0));
    b.fillStyle = sweep;
    b.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Broad tonal drifts, so the field is not a flat colour under the flowers.
  for (let i = 0; i < 26; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = size * (0.09 + rand() * 0.22);
    const grad = b.createRadialGradient(x, y, 0, x, y, r);
    const tone = rand() < 0.5 ? tints.leaf : tints.bloomB;
    grad.addColorStop(0, rgba(tone, 0.24));
    grad.addColorStop(1, rgba(tone, 0));
    b.fillStyle = grad;
    b.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Leaf strokes: a short blade at a random lean, low alpha, dense.
  b.lineCap = 'round';
  for (let i = 0; i < Math.round(size * 1.6); i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = size * (0.006 + rand() * 0.014);
    const ang = -Math.PI / 2 + (rand() - 0.5) * 1.5;
    b.strokeStyle = rgba(tints.leaf, 0.08 + rand() * 0.13);
    b.lineWidth = Math.max(1, size * 0.0016);
    b.beginPath();
    b.moveTo(x, y);
    b.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    b.stroke();
  }

  // Long sweeping streaks: the painted field is combed by the wind into
  // curving lanes, and a mat of evenly scattered dots reads as static instead.
  for (let i = 0; i < 34; i++) {
    const y = rand() * size;
    const x = rand() * size;
    const len = size * (0.12 + rand() * 0.3);
    const lean = (rand() - 0.5) * 1.1;
    const tone = rand() < 0.6 ? tints.bloomA : tints.leaf;
    b.strokeStyle = rgba(tone, 0.025 + rand() * 0.035);
    b.lineWidth = size * (0.016 + rand() * 0.034);
    b.beginPath();
    b.moveTo(x, y);
    b.quadraticCurveTo(x + len * 0.5, y + len * lean, x + len, y + len * lean * 0.4);
    b.stroke();
  }

  // ---------------------------------------------------------- the blooms
  /**
   * One blossom, drawn into both canvases and wrapped across every edge.
   *
   * Everything about the blossoms is deliberately **small, dense and low
   * contrast**. An earlier pass drew them three times this size at nearly
   * double the alpha, and at the idle rig each one covered forty screen pixels:
   * the field read as a scatter of coloured *blobs* lying on violet plastic,
   * and the eye counted them instead of reading a meadow. A flower the painting
   * can plausibly contain is a few pixels across on screen, so the mat needs
   * thousands of them — and once there are thousands, each one has to be quiet,
   * or the field turns to noise. The glow canvas keeps the same restraint: it
   * is what crosses the bloom threshold, so a hot core there is a hot core in
   * the final frame.
   */
  const blossom = (x: number, y: number, r: number, colour: string, bright: number): void => {
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        const px = x + dx;
        const py = y + dy;
        const reach = r * 2.6;
        if (px < -reach || px > size + reach || py < -reach || py > size + reach) continue;

        // Five petals around a bright pip. A plain round gradient at this size
        // reads as a bubble on water; the lobes are what make it a flower.
        const spin = px * 0.7 + py * 1.3;
        for (let k = 0; k < 5; k++) {
          const a = spin + (k / 5) * Math.PI * 2;
          const lx = px + Math.cos(a) * r * 0.32;
          const ly = py + Math.sin(a) * r * 0.32;
          const lobe = b.createRadialGradient(lx, ly, 0, lx, ly, r * 0.78);
          lobe.addColorStop(0, rgba(colour, 0.26 * bright));
          lobe.addColorStop(1, rgba(colour, 0));
          b.fillStyle = lobe;
          b.fillRect(lx - r * 0.78, ly - r * 0.78, r * 1.56, r * 1.56);
        }
        const pip = b.createRadialGradient(px, py, 0, px, py, r * 0.6);
        pip.addColorStop(0, rgba(tints.core, 0.42 * bright));
        pip.addColorStop(0.55, rgba(colour, 0.17 * bright));
        pip.addColorStop(1, rgba(colour, 0));
        b.fillStyle = pip;
        b.fillRect(px - r * 0.6, py - r * 0.6, r * 1.2, r * 1.2);

        const halo = g.createRadialGradient(px, py, 0, px, py, r * 2.2);
        halo.addColorStop(0, rgba(tints.core, 0.3 * bright));
        halo.addColorStop(0.3, rgba(colour, 0.09 * bright));
        halo.addColorStop(1, rgba(colour, 0));
        g.fillStyle = halo;
        g.fillRect(px - r * 2.2, py - r * 2.2, r * 4.4, r * 4.4);
      }
    }
  };

  /**
   * The colour wheel the field is picked from.
   *
   * Five entries used to do this, which meant five distinguishable colours of
   * blob. Blending each bloom tint halfway toward its neighbours (and toward
   * the near-white core) adds the in-between hues a real meadow has, so no two
   * adjacent patches land on exactly the same pink — and the two *saturated*
   * tints, the violet and the green, are held to a fifth of the wheel between
   * them, because those are the two that were reading as blue and green rings
   * on the ground rather than as flowers.
   */
  const mix = (a: string, b: string, t: number): string =>
    hex(new Color(a).lerp(new Color(b), t));
  const petalColours = [
    tints.bloomA,
    tints.bloomA,
    tints.bloomA,
    tints.bloomA,
    mix(tints.bloomA, tints.core, 0.4),
    mix(tints.bloomA, tints.core, 0.62),
    mix(tints.bloomA, tints.bloomB, 0.35),
    mix(tints.bloomA, tints.bloomB, 0.6),
    mix(tints.bloomA, tints.bloomC, 0.4),
    mix(tints.bloomB, tints.core, 0.45),
    mix(tints.bloomC, tints.core, 0.5),
    tints.bloomB,
    tints.bloomC,
  ];
  const pick = (): string => petalColours[(rand() * petalColours.length) | 0]!;

  // Clumps first — flowers grow in patches, and an evenly random field is the
  // one arrangement that never occurs in nature or in the painting. Twice as
  // many patches as before, each holding half again as many blossoms at a third
  // of the radius: the patch structure survives, the individual blob does not.
  for (let c = 0; c < 64; c++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const spread = size * (0.05 + rand() * 0.1);
    const colour = pick();
    // Per-clump size band, so one patch is fine forget-me-nots and the next is
    // a coarser bloom — variety the eye reads before it reads hue.
    const rBase = 0.0032 + rand() * 0.0034;
    const n = 20 + ((rand() * 34) | 0);
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * spread;
      const r = size * (rBase + rand() * 0.0042);
      blossom(
        cx + Math.cos(a) * d,
        cy + Math.sin(a) * d * 0.7,
        r,
        rand() < 0.7 ? colour : pick(),
        0.55 + rand() * 0.45,
      );
    }
  }

  // Then a thick scatter between the clumps, so the field has no gaps and no
  // countable objects: at this radius the scatter is the *texture* of the mat.
  for (let i = 0; i < Math.round(size * 1.7); i++) {
    blossom(
      rand() * size,
      rand() * size,
      size * (0.0026 + rand() * 0.004),
      pick(),
      0.4 + rand() * 0.5,
    );
  }

  return { base, glow };
}

// ---------------------------------------------------------------------------
// The far-layer heat haze
// ---------------------------------------------------------------------------

const HAZE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * A band of the painting re-sampled through a slow travelling sine and blended
 * back over itself: the air above the flower field wobbles the way hot air
 * does, except here it is the Farplane's rising energy. The band is masked to
 * nothing at both edges so the effect has no border.
 */
const HAZE_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uFrom;
  uniform vec2 uTo;
  uniform float uTime;
  uniform float uAmp;
  uniform float uFreq;
  uniform float uSpeed;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    vec2 uv = mix(uFrom, uTo, vUv);
    float w =
      sin(vUv.y * uFreq + uTime * uSpeed) * 0.6 +
      sin(vUv.x * uFreq * 0.43 - uTime * uSpeed * 0.77) * 0.4;
    uv.x += w * uAmp;
    uv.y += w * uAmp * 0.38;
    vec4 c = texture2D(uMap, uv);
    // Fade the band in and out, and weight the wobble toward the bottom of it,
    // where the rising air would be strongest.
    float mask = smoothstep(0.0, 0.30, vUv.y) * (1.0 - smoothstep(0.62, 1.0, vUv.y));
    gl_FragColor = vec4(c.rgb, c.a * mask * uOpacity);
  }
`;

// ---------------------------------------------------------------------------
// The scene: Heart of the Farplane
// ---------------------------------------------------------------------------

/**
 * **Heart of the Farplane**, as a {@link SceneFactory}.
 *
 * The painting on a parallax stack, a procedural field of glowing flowers on
 * the 3D ground tinted from the painting's own bottom rows, a pastel
 * pink/lavender light rig, petals and pink pyreflies rising (never falling —
 * the Farplane's air goes up), a rising light-spray at the far rim, a heat-haze
 * shimmer over the far layer, and the bloom-heavy Farplane grade.
 *
 * It owns **no actors** — see `docs/ENGINE-API.md#scene-builder-contract`.
 */
export const buildFarplaneScene: SceneFactory = async (
  opts: SceneBuildOptions = {},
): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:farplane';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? CAMERA_REF;

  // ---------------------------------------------------------------- backdrop
  const url = artUrl('art/backdrops/farplane.png');

  /**
   * Framing maths (see `docs/ENGINE-API.md`, "Framing the backdrop").
   *
   * At the idle rig the visible band at z = -48 is 33.3 units tall and 59.3
   * wide. The plane ships at **88** — sized for the `reveal` and `victory`
   * rigs, which swing the view axis up and sideways far enough that a plane cut
   * to the idle frame would run out at the edge mid-cut — and `centreY = -0.5`
   * puts the painting's own horizon (78% down the image) at 78% of frame
   * height, comfortably below the geometric horizon at 30%. That ordering is
   * the whole trick: painted terrain must sit *below* where an infinite ground
   * plane ends, or the painting stops reading as distance.
   */
  const backdropOptions = {
    url,
    width: 88,
    distance: -48,
    centreY: -0.5,
    cameraRef,
    layers: low
      ? [{ from: 0.56, to: 0.9, feather: 0.12, featherBottom: 0.06, z: -20, opacity: 0.5 }]
      : [
          { from: 0.3, to: 0.68, feather: 0.12, featherBottom: 0.09, z: -32, opacity: 0.38 },
          { from: 0.56, to: 0.9, feather: 0.12, featherBottom: 0.06, z: -18, opacity: 0.52 },
        ],
    /**
     * Sampling bands, read off the painting itself:
     * 0.00–0.20 is the deep blue zenith, 0.28–0.44 the pastel lavender-pink
     * glow around the light-spire (the key), 0.70–0.82 the pale haze where the
     * field meets the sky (the fog), 0.78–0.90 the flower field (the ground).
     * The bottom 5% is deliberately excluded — it is the dark foreground clumps
     * and it would drag the ground tint to mud.
     */
    sampleBands: {
      sky: [0.02, 0.2],
      horizon: [0.7, 0.82],
      ground: [0.78, 0.9],
      key: [0.28, 0.44],
    },
    // The flower field is built here instead, so the backdrop's snow-coloured
    // default ground is switched off entirely.
    ground: false,
    fog: { near: 12, far: 40, colorMix: 0.34 },
    fogPlanes: [
      { z: -30, y: 4.6, width: 76, height: 22, opacity: 0.3, speed: 0.006 },
      { z: -17, y: 2.3, width: 48, height: 12, opacity: 0.2, speed: 0.014 },
      { z: -7.5, y: 0.9, width: 32, height: 6.5, opacity: 0.16, speed: 0.03, additive: true },
    ],
  } satisfies BackdropOptions;

  let backdrop = await Backdrop.create(backdropOptions);
  backdrop.applyTo(group);

  // ------------------------------------------------------------------ lights
  /**
   * The bible's rig is lit from *below* (elevation -20°) because the Farplane
   * glows upward. A directional light under a ground plane lights nothing, so
   * the key is kept a few degrees above the horizon and very low, the flower
   * glow layer supplies the actual up-light, and the ambient is pushed
   * unusually high (this place has almost no real shadows).
   */
  const lights = new LightRig({
    palette: backdrop.palette,
    keyFrom: [-5.4, 8.6, 5.2],
    keyIntensity: 1.35,
    rimFrom: [6.6, 3.4, -4.6],
    rimColor: 0xffd2ea,
    rimIntensity: 1.0,
    fillIntensity: 1.05,
    ambientIntensity: 0.72,
    luma: { key: 0.86, fill: 0.74, rim: 0.9, ambient: 0.6 },
    /**
     * No shadow map at all. The bible's rig for this location is ambient-heavy
     * precisely because the Farplane has almost no real shadows, and a low key
     * over a flat field draws one long merged smudge out of three figures and a
     * hard line where the shadow camera's frustum ends. The actors' own soft
     * contact shadows and the additive light pools do the grounding instead.
     */
    shadows: false,
  });
  group.add(lights.group);

  // --------------------------------------------------------- flower ground
  // The mat is deliberately *pale*: it is standing in for the painting's own
  // sun-struck flower field, and a field darker than the painted one puts a
  // hard band across the horizon exactly where the two are supposed to meet.
  const soil = new Color(normaliseLuma(backdrop.palette.ground, 0.76))
    .lerp(new Color(0xb8a0f0), 0.16)
    // Toward white: the painted field is *pale*, and a fully saturated mat
    // multiplied by an equally saturated material colour reads as violet
    // plastic rather than as flowers in haze.
    .lerp(new Color(0xffffff), 0.56);
  const leaf = new Color(normaliseLuma(backdrop.palette.ground, 0.8)).lerp(
    new Color(0x8be8b0),
    0.24,
  );
  const bloomA = new Color(normaliseLuma(backdrop.palette.ground, 0.92)).lerp(
    new Color(0xffd9ec),
    0.45,
  );
  // The two accent tints, pulled a long way toward white. At their old
  // saturation each accent blossom read as a *blue ring* or a *green ring* lying
  // on the violet mat — the highest-contrast thing in the lower half of the
  // frame, and the reason the field read as blobs. Pale, they are the colour
  // variation inside a pink meadow, which is all they were ever for.
  const bloomB = new Color(0xb8a0f0).lerp(new Color(0xffffff), 0.52);
  const bloomC = new Color(0x8be8b0).lerp(new Color(0xffffff), 0.62);

  const fieldSize = low ? 512 : 1024;
  const field = paintFlowerField(fieldSize, 20260915, {
    soil: hex(soil),
    leaf: hex(leaf),
    bloomA: hex(bloomA),
    bloomB: hex(bloomB),
    bloomC: hex(bloomC),
    core: '#fff3fb',
  });

  const GROUND_SIZE = 86;
  const GROUND_CENTRE: [number, number] = [0, -7];
  const groundGeo = new PlaneGeometry(GROUND_SIZE, GROUND_SIZE, 1, 1);

  const fieldTex = paintedCanvasTexture(field.base);
  fieldTex.wrapS = fieldTex.wrapT = RepeatWrapping;
  fieldTex.repeat.set(7, 7);
  // Rotate the field's UVs off the camera axes. The tile boundaries then never
  // line up with the frame or with the view direction, which is what stops a
  // repeating texture reading as wallpaper.
  fieldTex.center.set(0.5, 0.5);
  fieldTex.rotation = 0.42;
  const glowTex = paintedCanvasTexture(field.glow);
  glowTex.wrapS = glowTex.wrapT = RepeatWrapping;
  glowTex.repeat.set(7, 7);
  glowTex.center.set(0.5, 0.5);
  glowTex.rotation = 0.42;

  /**
   * The same radial fade the painted scenes all use: the 3D ground exists only
   * where it is needed — under the figures, catching their shadows — and the
   * painting supplies everything past it. An alpha map is *data*, so it is
   * built as luminance on black and kept out of sRGB, or the falloff bends and
   * leaves a visible ring.
   */
  const fadeTex = paintedCanvasTexture(
    radialCanvas(
      512,
      [
        [0, 1],
        [0.1, 1],
        [0.42, 0.82],
        [0.74, 0.2],
        [1, 0],
      ],
      true,
    ),
  );
  fadeTex.colorSpace = NoColorSpace;
  fadeTex.wrapS = fadeTex.wrapT = ClampToEdgeWrapping;

  const groundMat = new MeshLambertMaterial({
    map: fieldTex,
    // Near-neutral: the hue lives in the painted canvas, not here, or the two
    // multiply and the field turns to grape.
    color: new Color(0xffffff).lerp(new Color(normaliseLuma(backdrop.palette.ground, 1)), 0.26),
    alphaMap: fadeTex,
    transparent: true,
    depthWrite: false,
  });
  const ground = new Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(GROUND_CENTRE[0], 0, GROUND_CENTRE[1]);
  ground.receiveShadow = true;
  ground.renderOrder = -50;
  ground.name = 'farplane-field';
  group.add(ground);

  const glowMat = new MeshBasicMaterial({
    map: glowTex,
    alphaMap: fadeTex,
    color: new Color(0xffffff),
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    blending: AdditiveBlending,
    // Additive + fog would blend the distant blossoms toward the fog colour and
    // then *add* that, washing the far field with lavender. The radial alpha
    // fade is what takes the field into the distance instead.
    fog: false,
    toneMapped: false,
  });
  const fieldGlow = new Mesh(groundGeo, glowMat);
  fieldGlow.rotation.x = -Math.PI / 2;
  fieldGlow.position.set(GROUND_CENTRE[0], 0.014, GROUND_CENTRE[1]);
  fieldGlow.renderOrder = -49;
  fieldGlow.name = 'farplane-field-glow';
  group.add(fieldGlow);

  // ------------------------------------------------------------- heat haze
  const painting = backdrop.group.getObjectByName('backdrop-painting') as Mesh | undefined;
  const paintingTex = painting
    ? ((painting.material as MeshBasicMaterial).map ?? null)
    : null;

  let haze: Mesh | null = null;
  let hazeMat: ShaderMaterial | null = null;
  if (paintingTex && !low) {
    const W = backdropOptions.width;
    const H = W / 1.75;
    const F0 = 0.4;
    const F1 = 0.84;
    hazeMat = new ShaderMaterial({
      uniforms: {
        uMap: { value: paintingTex },
        // Plane v runs bottom-to-top; image fractions run top-to-bottom.
        uFrom: { value: new Vector2(0, 1 - F1) },
        uTo: { value: new Vector2(1, 1 - F0) },
        uTime: { value: 0 },
        uAmp: { value: 0.0026 },
        uFreq: { value: 26 },
        uSpeed: { value: 0.55 },
        uOpacity: { value: 0.55 },
      },
      vertexShader: HAZE_VERT,
      fragmentShader: HAZE_FRAG,
      transparent: true,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    haze = new Mesh(new PlaneGeometry(W, H * (F1 - F0)), hazeMat);
    haze.position.set(
      0,
      backdropOptions.centreY + (0.5 - (F0 + F1) / 2) * H,
      backdropOptions.distance + 0.06,
    );
    haze.renderOrder = -89;
    haze.name = 'farplane-haze';
    group.add(haze);
  }

  // --------------------------------------------------------------- particles
  const k = low ? 0.45 : 1;

  /** Petals rise here; they never fall. High band, drifting up and right. */
  const petalsFar = new ParticleField(
    ParticlePresets.petals({
      count: Math.round(260 * k),
      bounds: { x: 17, y: 7.5, z: 11 },
      colors: [0xffd9ec, 0xf7b6d9, 0xffffff, 0xd9c2ff],
      size: 6.4,
      opacity: 0.68,
      drift: [0.2, 0.44, 0],
      wobble: [0.9, 0.3, 0.55],
      wobbleSpeed: 0.5,
      hardness: 0.55,
    }),
  );
  petalsFar.position.set(0, 4.6, -7);

  const petalsNear = new ParticleField(
    ParticlePresets.petals({
      count: Math.round(120 * k),
      bounds: { x: 10.5, y: 4.6, z: 5 },
      colors: [0xffd9ec, 0xffb9d6, 0xfff0f6],
      size: 12,
      opacity: 0.55,
      drift: [0.3, 0.58, 0],
      wobble: [1.1, 0.35, 0.6],
      wobbleSpeed: 0.62,
      hardness: 0.62,
    }),
  );
  petalsNear.position.set(-0.4, 2.8, 2.8);

  /** Pink pyreflies with white cores — the Farplane's signature mote. */
  const pyreflies = new ParticleField(
    ParticlePresets.pyreflies({
      count: Math.round(160 * k),
      bounds: { x: 9.5, y: 3.4, z: 5.5 },
      colors: [0xffc2e6, 0xffffff, 0xffe4f2, 0xe7d0ff, 0xffa8d8],
      size: 10.5,
      opacity: 1,
      drift: [0.03, 0.5, 0],
      wobble: [0.5, 0.2, 0.34],
      twinkle: 0.85,
    }),
  );
  pyreflies.position.set(0.3, 1.9, -1.2);

  /** Light-fall spray: the upward waterfalls at the island rim, seen far off. */
  const lightfall = new ParticleField({
    count: Math.round(190 * k),
    bounds: { x: 16, y: 7.5, z: 3.2 },
    colors: [0xe9fff4, 0xffffff, 0xd8fff0, 0xffe4f2],
    size: 6.2,
    sizeJitter: 0.6,
    drift: [0, 2.1, 0],
    wobble: [0.22, 0.12, 0.14],
    wobbleSpeed: 0.45,
    twinkle: 0.6,
    opacity: 0.62,
    additive: true,
    hardness: 0.3,
  });
  lightfall.position.set(0, 4.4, -11.5);

  const particles = [petalsFar, petalsNear, pyreflies, lightfall];
  for (const p of particles) group.add(p);

  // ------------------------------------------------------------- light pools
  // A faint additive pool under each standing spot: the single cheapest trick
  // that stops a painted cut-out reading as a sticker on a painting.
  const pools = [
    ...PARTY_SLOTS.slice(0, 3).map((s) => {
      const pool = makeLightPool({ color: 0xffd2ea, radius: 1.15, opacity: 0.14 });
      pool.position.set(s[0], 0.02, s[2]);
      return pool;
    }),
    (() => {
      const pool = makeLightPool({ color: 0xd8b4ff, radius: 2.0, opacity: 0.26 });
      const s = ENEMY_SLOTS[0]!;
      pool.position.set(s[0], 0.02, s[2]);
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
    ...FARPLANE_STAGING, // Vegnagun's figure-less parts and the body's own spot (D-044)
    /**
     * The shared Farplane grade, pulled back.
     *
     * `ScenePalettes.farplane` is authored for a scene whose *emissive* layer
     * does the glowing. This painting is bright pastel paint edge to edge, so at
     * threshold 0.82 / strength 0.95 the whole sky crosses the line and the
     * image turns to white mush. Raising the threshold to 0.9 and halving the
     * strength leaves the flare, the blossoms and the pyreflies glowing and
     * nothing else — which is what the bloom was for.
     */
    palette: {
      ...ScenePalettes.farplane,
      exposure: 0.9,
      bloomThreshold: 0.9,
      bloomStrength: 0.5,
      bloomRadius: 0.6,
      tiltFocus: 0.44,
      tiltBandWidth: 0.17,
      tiltMaxBlur: 4.4,
      vignette: 0.22,
      shadowTintAmount: 0.07,
      gain: [1.0, 0.985, 1.02],
      lift: [0.016, 0.01, 0.02],
      saturation: 0.97,
    } satisfies ScenePalette,
    update(dt: number): void {
      clock += dt;
      backdrop.update(dt);
      lights.update(dt);
      for (const p of particles) p.update(dt);
      if (hazeMat) hazeMat.uniforms['uTime']!.value = clock;
      // The field breathes: the blossoms swell and fade together, very slowly,
      // so the bloom always has something living in it.
      glowMat.opacity = 0.19 + Math.sin(clock * 0.37) * 0.045;
      (bossPool.material as { opacity: number }).opacity = 0.22 + Math.sin(clock * 0.8) * 0.06;
    },
    dispose(): void {
      watcher?.stop();
      for (const p of particles) p.dispose();
      for (const p of pools) {
        p.geometry.dispose();
        (p.material as { dispose(): void }).dispose();
      }
      groundGeo.dispose();
      groundMat.dispose();
      glowMat.dispose();
      fieldTex.dispose();
      glowTex.dispose();
      fadeTex.dispose();
      if (haze) {
        haze.geometry.dispose();
        (haze.material as ShaderMaterial).dispose();
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
// The staged composition: the scene with the cast standing on its slots
// ---------------------------------------------------------------------------

const POSES = ['idle', 'attack', 'cast', 'hurt', 'ko', 'victory'] as const;

interface Timer {
  left: number;
  fn: () => void;
}

/**
 * {@link buildFarplaneScene} with Tidus, Yuna and Seymour Flux staged on its
 * slots, an FFX battle camera bound to its rigs, and the action beats the
 * screenshot tool fires — the `PaintedScene` shape `src/scenes/index.ts`
 * registers and the debug screen previews.
 */
export async function buildFarplanePainted(camera: PerspectiveCamera): Promise<PaintedScene> {
  const scene = new Scene();
  scene.name = 'farplane';

  const build = await buildFarplaneScene({});
  mountScene(build, scene);
  const { lights } = build;

  const rimHex = lights.rimColorHex;
  const bounceHex = lights.bounceColorHex;

  const commonActor = {
    facing: 1 as const,
    crossfadeMs: 120,
    rim: { color: rimHex, strength: 0.9, dir: lights.rimDir, width: 3.4 },
    bounce: { color: bounceHex, strength: 0.34 },
    // The Farplane has almost no real shadows: a light contact ramp and a wide,
    // soft, low-opacity contact shadow, or the figures look stamped on.
    groundShade: 0.3,
    shadow: { radius: 0.78, opacity: 0.82, squash: 0.48 },
    breathe: { amplitude: 0.018, speed: 0.42 },
    sway: { amplitude: 0.011, speed: 0.21 },
  };

  const hero = await PaintedActor.fromSubject('tidus', {
    ...commonActor,
    worldHeight: FARPLANE_ACTOR_HEIGHTS.tidus,
    states: POSES,
  });
  const yuna = await PaintedActor.fromSubject('yuna', {
    ...commonActor,
    worldHeight: FARPLANE_ACTOR_HEIGHTS.yuna,
    states: POSES,
  });
  const auron = await PaintedActor.fromSubject('auron', {
    ...commonActor,
    worldHeight: 1.86,
    states: POSES,
  });

  const standIns: string[] = [];
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
    // Full-bleed art protection, as a scene-level default rather than a number
    // remembered per screen. See {@link FARPLANE_ENEMY_ACTOR_DEFAULTS}.
    ...FARPLANE_ENEMY_ACTOR_DEFAULTS,
    facing: -1,
    worldHeight: FARPLANE_ACTOR_HEIGHTS.seymourFlux,
    crossfadeMs: 140,
    states: ['idle'],
    placeholder: () => paintBossSilhouette({ seed: 57 }),
    placeholderBaseline: 0.985,
    brightness: 0.92,
    rim: { color: rimHex, strength: 0.8, dir: [1, 0.3], width: 4 },
    bounce: { color: 0xd8b4ff, strength: 0.26 },
    groundShade: 0.08,
    hover: { height: 0.42, bobAmplitude: 0.085, bobSpeed: 0.16 },
    shadow: { radius: 1.35, opacity: 0.4, squash: 0.5 },
    breathe: { amplitude: 0.012, speed: 0.22 },
    sway: { amplitude: 0.006, speed: 0.15 },
  });
  boss.position.copy(build.enemySlots[0]!);
  build.group.add(boss);

  /**
   * Seymour's own darkness, as a soft quad behind him.
   *
   * This is the other half of {@link FARPLANE_ENEMY_ACTOR_DEFAULTS}, and it is
   * doing something the feather cannot. `edgeFade` can only ever lower the
   * *alpha* at the plane's border; what makes the border read as a rectangle
   * here is **contrast** — near-black aura paint against a sky that is the
   * brightest pastel in the game. Feather it hard enough to beat that contrast
   * and the same band takes the top of his hair with it, because the box fade
   * is the same width on every side and his head reaches the top of the PNG.
   *
   * So the sky around him is darkened instead: a wide, very soft violet veil
   * centred on the figure, drawn before him, that drops the backdrop a stop
   * exactly where his aura is bleeding into it. The feathered edge then fades
   * into something nearly its own value and stops being an edge at all — and
   * for a boss whose prompt is "dark aura, dark energy swirling", a hole in the
   * Farplane's light is the read the scene wanted anyway.
   */
  const auraAlpha = paintedCanvasTexture(
    radialCanvas(
      512,
      [
        [0, 0.96],
        [0.16, 0.84],
        [0.4, 0.44],
        [0.72, 0.12],
        [1, 0],
      ],
      true,
    ),
  );
  auraAlpha.colorSpace = NoColorSpace;
  auraAlpha.wrapS = auraAlpha.wrapT = ClampToEdgeWrapping;
  const bossAuraMat = new MeshBasicMaterial({
    color: 0x2d1442,
    alphaMap: auraAlpha,
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
    fog: false,
  });
  const bossAura = new Mesh(new PlaneGeometry(5.8, 6.6), bossAuraMat);
  bossAura.position.set(boss.position.x + 0.05, 1.95, boss.position.z - 0.4);
  // The actor's planes sit at renderOrder 10; the veil has to be under them.
  bossAura.renderOrder = 8;
  bossAura.name = 'boss-aura';
  build.group.add(bossAura);

  // --------------------------------------------------------------------- VFX
  const hits = new HitEffects(
    { size: 5.0, coreColor: 0xfff0fa, edgeColor: 0xff9fd6, arc: 2.5, radius: 0.6, thickness: 0.09, trail: 0.62 },
    { count: 110, speed: 6.4, life: 0.5, size: 10, bias: [0.4, 0.45, 0.2], focus: 0.5 },
    { color: 0xffe2f4, size: 3.0 },
  );
  build.group.add(hits);

  // ------------------------------------------------------------------ camera
  const battleCamera = new BattleCamera(camera, {
    swayAmplitude: 0.05,
    swaySpeed: 0.24,
    rigs: build.rigs,
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
    void hero.lunge(2.9, 500);
    void hero.squash(280, 0.5);
    lights.placePractical(hero.position.x + 1, 1.4, hero.position.z);

    after(170, () => {
      boss.centerPoint(bossHit);
      bossHit.x -= 0.85;
      bossHit.z += 0.75;
      void hits.slash.play(bossHit, 380, -0.62);
      lights.flicker(0xffd2ea, 4.2, 420, 14);
    });
    after(250, () => {
      hits.sparks.emit(bossHit, 1);
      hits.flash.play(bossHit, 260, 0.7);
      boss.flash(0xffe6f6, 200, 0.5);
      boss.shake(0.13, 380);
      void boss.recoil(420, 0.34);
      battleCamera.shake(0.13, 300);
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
    yuna.setPose('cast');
    lights.placePractical(yuna.position.x, 1.6, yuna.position.z + 0.4);
    lights.flicker(0xffc2e6, 3.2, 900, 11);
    yuna.flash(0xffd9ec, 700, 0.5);
    after(900, () => {
      yuna.setPose('idle');
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
    void boss.dissolveTo(1, 1600, 0xffc2e6);
    after(1700, () => boss.setDissolve(0));
  };

  const trigger = (name: string): boolean => {
    if (name.startsWith('rig:')) {
      const rig = name.slice(4);
      if (!battleCamera.getRig(rig)) return false;
      void battleCamera.moveTo(rig, 700, 'cubicInOut');
      return true;
    }
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
  for (const pose of POSES) {
    if (!assetReport.tidusPoses.includes(pose)) watched.push(characterUrl('tidus', pose));
  }
  let watcher: AssetWatcher | null = null;
  if (watched.length && import.meta.env.DEV) {
    watcher = watchAssets(
      watched,
      (u) => {
        for (const pose of POSES) {
          if (u === characterUrl('tidus', pose)) {
            void hero.reloadPose(pose, u).then((ok) => {
              if (ok && !assetReport.tidusPoses.includes(pose)) assetReport.tidusPoses.push(pose);
            });
            return;
          }
        }
      },
      { intervalMs: 5000 },
    );
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
    const bossPulse = 0.82 + Math.sin(clock * 0.85) * 0.18;
    boss.setBrightness(0.88 + bossPulse * 0.22);
    // The veil breathes with him, so the hole in the light is his and not a
    // smudge someone left on the backdrop.
    bossAuraMat.opacity = 0.4 + bossPulse * 0.09;
  };

  const setPixelScale = (v: number): void => {
    for (const p of build.particles) p.setPixelScale(v);
    hits.sparks.setPixelScale(v);
  };

  const dispose = (): void => {
    watcher?.stop();
    for (const a of party) a.dispose();
    boss.dispose();
    bossAura.geometry.dispose();
    bossAuraMat.dispose();
    auraAlpha.dispose();
    hits.dispose();
    build.dispose();
    scene.clear();
  };

  return {
    ...build,
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
