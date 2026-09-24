import {
  AdditiveBlending,
  ClampToEdgeWrapping,
  Color,
  Group,
  Mesh,
  MeshLambertMaterial,
  MeshPhongMaterial,
  NoColorSpace,
  PlaneGeometry,
  RepeatWrapping,
  Vector3,
  type Material,
} from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { makeRock } from '../engine/Diorama.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import {
  artUrl,
  normaliseLuma,
  paintedCanvasTexture,
  watchAssets,
  type AssetWatcher,
} from '../engine/PaintedArt.ts';
import { ParticleField, ParticlePresets } from '../engine/Particles.ts';
import { noiseCanvas, radialCanvas, rng } from '../engine/ProceduralArt.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import { ScenePalettes } from '../engine/ScenePalettes.ts';
import type {
  SceneBuild,
  SceneBuildOptions,
  SceneFactory,
  SceneRigName,
} from './types.ts';

// ---------------------------------------------------------------------------
// Mt. Gagazet — the trail near the summit, at night
// ---------------------------------------------------------------------------
//
// The painting (`public/art/backdrops/gagazet.png`, 2688x1536) is a night
// valley: a low moon at the upper left, black cliff teeth framing the top, a
// wall of snow peaks through the middle and a bright snowfield across the
// bottom fifth. Every number below is solved against *that* image:
//
//  - the **key** is sampled from the moon band and stays blue, because the only
//    light in the painting is moonlight;
//  - the **rim** is the one thing the painting does not supply — it is Seymour,
//    off to the right of frame, and it is deliberately warm so the figures
//    separate from a frame that is otherwise entirely blue;
//  - the **framing** shows the painting from roughly 4.5% to 76% of its height,
//    which is what keeps the moon in shot instead of cropping the scene down to
//    anonymous blue rock (the mistake a plane sized for the idle frame makes).

/**
 * The camera the parallax stack and the backdrop framing are solved for —
 * identical to the `idle` rig's position. See "Framing the backdrop" in
 * `docs/ENGINE-API.md`.
 */
const CAMERA_REF: [number, number, number] = [0, 3.05, 9.5];

/** World z of the painting plane, and the plane's world width. */
const BACKDROP_DISTANCE = -48;
const BACKDROP_WIDTH = 82;

/**
 * Centre of the painting plane.
 *
 * The idle rig's view axis crosses `z = -48` at `y = -6.09`; a plane centred
 * there shows the painting's middle band and nothing else. Dropping the centre
 * to -10.7 slides the frame up the painting until its top edge sits at 4.5% of
 * the image height — the first row that still has the **moon** whole in it. The
 * moon is the scene's only light source and the only non-blue thing in the
 * painting; cropping it is what turns this location into anonymous blue rock.
 *
 * The 82-unit width is the other half of that: at 96 the moon (23% across the
 * painting) landed 2% from the left edge of the idle frame and read as a lens
 * flare. Narrowing the plane walks it inboard to 11%.
 */
const BACKDROP_CENTRE_Y = -10.7;

/**
 * FFX battle framing: fov 32 (inside the 30–34 band), slight elevation, the
 * party in a shallow left-facing arc in the lower left, the boss right of
 * centre and further back.
 *
 * Every rig is checked against the painting plane. `intro`, pulled back to
 * z = 16, sees 35.1 x 62.5 world units at the plane's depth and `victory` swings
 * the view axis out to x = -9.7 — both inside the 82 x 46.9 plane, which is why
 * the plane is 82 wide and not the ~59 that just covers `idle`. Rigs that swing
 * further than this need the plane widened, not the rig clamped.
 */
const RIGS: Record<SceneRigName, CameraRig> & Record<string, CameraRig> = {
  /**
   * The establishing shot the battle opens on: high and well back, the ledge,
   * both sides of the field and the moon all in frame. The presenter pushes in
   * from here to `idle` over ~2.5s, which is the slow dolly the scene is
   * written for — the rig sits on nearly the same view axis as `idle`, so the
   * move reads as a push-in and not as a cut.
   */
  intro: { position: [0.2, 6.2, 16.0], lookAt: [1.0, 2.0, -3.2], fov: 30, sway: 1.5 },
  idle: { position: CAMERA_REF, lookAt: [0.15, 1.35, -1.2], fov: 32 },
  /**
   * Pushed in for an ability beat. Two things are solved here: the attacker
   * (slot 0, and x ≈ 1.5 mid-lunge) and the boss (x 3.1) are both well inside
   * the frame — an action rig that frames only the target turns every attack
   * into a shot of the target. (Since PR-0002 A no party slot is near the left edge.)
   */
  action: { position: [0.25, 2.8, 8.85], lookAt: [1.15, 1.45, -1.1], fov: 32, sway: 0.7 },
  party: { position: [-0.05, 2.2, 7.2], lookAt: [-0.95, 1.15, 0.45], fov: 32, sway: 0.7 },
  enemy: { position: [1.5, 2.9, 5.9], lookAt: [2.9, 1.6, -2.2], fov: 32, sway: 0.7 },
  victory: { position: [-0.1, 2.05, 7.5], lookAt: [-0.95, 1.15, 0.9], fov: 32, sway: 1.2 },
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
  // PR-0002 A (D-041, FFX only): Yuna (slot 1) was 73-78% under the command stack, now front-right; `holdParty` holds all three.
  [-1.31, 0, 1.55], // front (was -1.55; live settled here)
  [0.3, 0, 1.0], // Yuna: front-right (was [-2.95, 0, 0.25])
  [-0.61, 0, -1.05], // back (was -1.05; live settled here)
  // reserve — outside every rig's frustum, including `victory`'s left swing
  [-11.6, 0, 2.6],
  [-12.5, 0, 1.0],
  [-13.4, 0, -0.6],
  [-14.3, 0, -2.2],
];

/**
 * Enemy formation: the boss centre-right and further back, with two flanking
 * slots a multi-part boss parks its parts on (Mortiorchis, a summon's
 * outriders).
 *
 * **Solved against the HUD safe area** (`docs/ENGINE-API.md#hud-safe-area`),
 * which for the FFX HUD ends at 0.79 of the canvas width — the CTB queue's
 * column can travel as far left as 0.843. The previous numbers predate that
 * measurement and both figures were partly behind it: Seymour reached 0.862 at
 * `idle`, and slot 1 put **Mortiorchis at 0.815..1.128**, i.e. ~70% of the
 * second enemy was under the queue or past the right edge of the screen
 * (`docs/handoff/playability-round-1.md` §4 issue 3).
 *
 * The boss keeps his depth, so he is the same size on screen as he ever was
 * (0.245 of the frame wide, 0.60 tall) and still sits centre-right; only his x
 * moves.
 *
 * **1.95, not the 2.2 this was first solved to.** 2.2 was computed from the
 * actor's nominal width and came out at 0.783 — inside the rail on paper. The
 * measured quad is wider than the figure (the aura runs to the plane's edge,
 * and `sway` spends a little more), and at 1600x900 and 1920x1080 the real
 * right edge was **0.793**: over the 0.79 rail, at both resolutions, at every
 * sway phase sampled. 0.25 further left buys 0.021 of frame and lands it at
 * 0.763, which holds the rail with the margin the rail is supposed to have.
 * Nothing else moves: he is the same size, the same height and the same depth.
 *
 * Slot 1 is the interesting one. There is no room left of the queue for a
 * second 0.2-wide figure *beside* a 0.23-wide boss, so the slot stops being a
 * flank and becomes a **high back-left float**: 4.6 units behind the boss and
 * 1.85 up, which lands it at 0.487..0.700 across his shoulder rather than off
 * the edge of the screen. That is also the right reading for this encounter —
 * Mortiorchis is the thing Seymour is riding, not a second soldier stood next
 * to him — and the lift is what keeps the two silhouettes from merging.
 *
 * Slot 2 stays a ground slot, moved back with the rest of the formation so a
 * part parked on it (nothing in this chapter uses it) is inside the rail too.
 */
const ENEMY_SLOTS: Array<[number, number, number]> = [
  [1.95, 0, -2.45], // boss          -> x 0.531..0.763, y 0.060..0.673 at `idle`
  [1.8, 1.85, -7.0], // high float    -> x 0.487..0.700, y 0.108..0.358
  [3.35, 0, -6.6], // ground, back-right
];

/**
 * One wind-blown snow drift, as an **alpha mask**.
 *
 * A drift modelled as geometry cannot work at this scale. Flatten an
 * icosahedron until it is ankle-high and every normal on its top face points
 * straight up: the whole crest shades to one flat value and the mesh reads as a
 * pale *slab* with a hard polygon rim — pack ice, not snow. What the eye
 * actually reads a drift from is the gradient across its crest and the fact
 * that its margin has no edge at all.
 *
 * So the drift is a mask lying on the snow: a soft off-centre body, brighter on
 * the windward side, with fine streaks torn downwind off the crest, and the
 * whole thing feathered to nothing well inside the canvas so the quad can never
 * show its own rectangle. The material is Lambert, so the drifts take the same
 * moonlight as the ground they lie on.
 */
function driftCanvas(seed: number): HTMLCanvasElement {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const rand = rng(seed);

  // The body, pushed windward (left) of centre: a drift is steep where the wind
  // packs it and long where it spills away.
  const g = ctx.createRadialGradient(size * 0.4, size * 0.47, 0, size * 0.5, size * 0.5, size * 0.5);
  g.addColorStop(0, 'rgba(255,255,255,0.92)');
  g.addColorStop(0.32, 'rgba(255,255,255,0.58)');
  g.addColorStop(0.62, 'rgba(255,255,255,0.2)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // Streaks torn off the crest and laid downwind.
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 30; i++) {
    const y = size * (0.18 + rand() * 0.64);
    const x = size * (0.24 + rand() * 0.38);
    const len = size * (0.14 + rand() * 0.38);
    const h = 1 + rand() * 3.2;
    const streak = ctx.createLinearGradient(x, 0, x + len, 0);
    streak.addColorStop(0, 'rgba(255,255,255,0)');
    streak.addColorStop(0.3, `rgba(255,255,255,${(0.1 + rand() * 0.17).toFixed(3)})`);
    streak.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = streak;
    ctx.fillRect(x, y, len, h);
  }
  ctx.globalCompositeOperation = 'source-over';

  // Feather everything, so no quad ever shows its own border.
  ctx.globalCompositeOperation = 'destination-in';
  const fade = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(0.42, 'rgba(0,0,0,0.92)');
  fade.addColorStop(0.78, 'rgba(0,0,0,0.3)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

/**
 * The Gagazet grade with a violet push: the painting is a single cold blue, so
 * the grade's job is to keep the *shadows* from collapsing into that same blue.
 * The violet shadow tint and the blue-heavy gain open a second hue in the frame
 * without touching the painting's own colour decisions.
 */
const PALETTE: ScenePalette = {
  ...ScenePalettes.gagazet,
  name: 'gagazet',
  lift: [0.01, 0.012, 0.028],
  gamma: [1.0, 1.0, 1.02],
  gain: [1.02, 0.97, 1.08],
  saturation: 1.08,
  vignette: 0.4,
  vignetteRadius: 0.66,
  shadowTint: [0.46, 0.4, 0.92],
  shadowTintAmount: 0.22,
  grain: 0.024,
  exposure: 1.12,
  bloomThreshold: 0.9,
  bloomStrength: 0.56,
  bloomRadius: 0.64,
  tiltFocus: 0.4,
  tiltBandWidth: 0.16,
  tiltMaxBlur: 4.2,
};

/** Canonical world heights for the cast that fights here. */
export const GAGAZET_ACTOR_HEIGHTS = {
  tidus: 1.75,
  yuna: 1.68,
  auron: 1.86,
  seymourFlux: 2.6,
} as const;

/**
 * The scene's default cut-out protection for a painted actor parked on
 * {@link SceneBuild.enemySlots}.
 *
 * Boss art is generated **full-bleed**: the aura runs off every side of the
 * PNG, so the "cut-out" ends on the plane's own rectangle. `matte: 'force'`
 * takes out the white studio background the flood fill can reach, and
 * `edgeFade` feathers whatever painted aura is still touching the border so the
 * plane's edge reads as atmosphere instead of as a frame. `alphaCut` is kept
 * *low* on purpose — a high cut re-hardens the tail of the feather.
 *
 * Spread this into the actor options rather than restating the numbers:
 *
 * ```ts
 * const boss = await PaintedActor.fromSubject('seymour-flux', {
 *   ...GAGAZET_ENEMY_ACTOR_DEFAULTS,
 *   worldHeight: GAGAZET_ACTOR_HEIGHTS.seymourFlux,
 * });
 * ```
 *
 * Gagazet needs the least of it — the frame is near-black, so a surviving
 * border of dark aura is invisible — but the default is published here too so
 * every location has the same protection and no presenter has to remember it.
 */
export const GAGAZET_ENEMY_ACTOR_DEFAULTS = {
  matte: { mode: 'force' as const },
  edgeFade: 0.18,
  alphaCut: 0.04,
} as const;

/**
 * **Mt. Gagazet — the trail near the summit**, at night, as a
 * {@link SceneFactory}.
 *
 * A matte painting parallax stack behind a lit ground plane tinted from the
 * painting's own snowfield, an icy specular sheet over it, wind-blown snow in
 * three depth bands, sparse pyreflies rising off the ledge, drifting mist,
 * snow-buried boulders and two summoner memorial stones, a moonlit light rig
 * with a warm rim from Seymour's side, and the Gagazet grade with a violet
 * shadow push.
 *
 * It owns **no actors** — see `docs/ENGINE-API.md#scene-builder-contract`.
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

  const backdropOptions = {
    url,
    width: BACKDROP_WIDTH,
    distance: BACKDROP_DISTANCE,
    centreY: BACKDROP_CENTRE_Y,
    cameraRef,
    /**
     * Two masked bands carved out of the same painting and scaled toward the
     * reference camera: the peak wall (0.30–0.62) and the near ridge shoulders
     * (0.58–0.88). At rest they register exactly with the painting; the moment
     * the camera sways or cuts to `action` they part, and the flat matte reads
     * as depth.
     */
    layers: low
      ? [{ from: 0.58, to: 0.88, feather: 0.1, featherBottom: 0.06, z: -20, opacity: 0.55 }]
      : [
          { from: 0.3, to: 0.62, feather: 0.1, featherBottom: 0.08, z: -32, opacity: 0.6 },
          { from: 0.58, to: 0.88, feather: 0.1, featherBottom: 0.06, z: -20, opacity: 0.55 },
        ],
    /**
     * Where the palette is read from. `key` is the moon band, not a sun band —
     * the only light in this painting is moonlight, so the key must come out
     * blue and get its *value* from `LightRig`'s luma, not from the paint.
     * `horizon` is the band where the peaks meet the valley haze: that is the
     * fog colour, and taking it from a dark ridge instead would fog the scene
     * to near-black.
     */
    sampleBands: {
      sky: [0.01, 0.12],
      horizon: [0.6, 0.74],
      ground: [0.9, 1.0],
      key: [0.03, 0.13],
    },
    /**
     * The painting already contains its own snowfield, so the 3D ground is not
     * an opaque plane running to the horizon — it is a faded disc under the
     * fighters that catches their shadows and dissolves into the painted snow.
     * Its hue is the painting's own bottom rows; only its value is set here
     * (`luma`), because a band average is not an exposure.
     */
    ground: {
      size: 44,
      repeat: 4,
      tintMix: 0.08,
      brightness: 1.0,
      luma: 0.54,
      fade: true,
      fadeCore: 0.05,
      center: [0, -2] as [number, number],
    },
    fog: { near: 22, far: 56, colorMix: 0.22 },
    /**
     * Four mist sheets. The far two sit exactly on the seam where the 3D ground
     * dissolves into the painted peaks (~38% down the idle frame) and are the
     * reason that seam has no edge; the near two are blizzard haze at knee
     * height, which is what stops the figures looking like they are standing on
     * a clean tabletop.
     */
    fogPlanes: [
      { z: -30, y: 3.0, width: 74, height: 20, opacity: 0.24, speed: 0.007 },
      { z: -21, y: 2.2, width: 58, height: 14, opacity: 0.2, speed: 0.013 },
      { z: -13, y: 1.5, width: 40, height: 9, opacity: 0.17, speed: 0.024 },
      { z: -5.5, y: 0.8, width: 30, height: 5.5, opacity: 0.1, speed: 0.04, additive: true },
    ],
  } satisfies BackdropOptions;

  let backdrop = await Backdrop.create(backdropOptions);
  backdrop.applyTo(group);

  // ------------------------------------------------------------------ lights
  /**
   * Moonlight key from the upper left — the moon's own position in the
   * painting, so the 3D shadows fall the way the painted ones do — a cool sky
   * fill, and a **warm** rim from the right.
   *
   * The rim is the only warm thing in the scene and it is not the painting's:
   * it is Seymour's aura, off frame-right. Against an all-blue frame a rim of
   * the same blue is invisible, and the cut-outs go back to being stickers; a
   * faint warm one draws the outline of every figure.
   */
  const lights = new LightRig({
    palette: backdrop.palette,
    keyFrom: [-9.2, 6.0, -3.0],
    keyIntensity: low ? 1.6 : 1.75,
    rimFrom: [7.6, 3.8, 4.6],
    rimColor: 0xffc9a6,
    rimIntensity: 0.72,
    fillIntensity: 0.85,
    ambientIntensity: 0.38,
    luma: { key: 0.74, fill: 0.58, rim: 0.86, ambient: 0.46 },
    shadows: low ? false : { mapSize: 1024, area: 15, radius: 3.8, bias: -0.0014 },
  });
  group.add(lights.group);

  // ------------------------------------------------------------- icy ground
  /**
   * The specular half of the ground.
   *
   * `Backdrop`'s ground plane is Lambert — correct for snow, which has no
   * highlight, but this is a wind-scoured trail near the summit: packed snow
   * over ice. A second, **purely specular** sheet (diffuse black, additive) lays
   * a moon glint over the same disc. Because it is additive with a black
   * diffuse it can only ever *add* a highlight, so it cannot wash out the
   * carefully-matched ground tint underneath, and the noise bump breaks the
   * lobe into drifts instead of one mirror band.
   */
  const sheenBump = paintedCanvasTexture(noiseCanvas(512, 21, 4));
  sheenBump.wrapS = sheenBump.wrapT = RepeatWrapping;
  sheenBump.repeat.set(7, 7);
  const sheenAlpha = paintedCanvasTexture(
    radialCanvas(
      512,
      [
        [0, 0.95],
        [0.18, 0.86],
        [0.48, 0.34],
        [0.8, 0.07],
        [1, 0],
      ],
      true,
    ),
  );
  sheenAlpha.colorSpace = NoColorSpace;
  sheenAlpha.wrapS = sheenAlpha.wrapT = ClampToEdgeWrapping;
  const sheenMat = new MeshPhongMaterial({
    color: 0x000000,
    specular: new Color(normaliseLuma(backdrop.palette.sky, 0.86)).lerp(new Color(0xdceeff), 0.5),
    shininess: 26,
    bumpMap: sheenBump,
    bumpScale: 0.15,
    alphaMap: sheenAlpha,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const iceSheen = new Mesh(new PlaneGeometry(40, 40, 1, 1), sheenMat);
  iceSheen.rotation.x = -Math.PI / 2;
  iceSheen.position.set(0, 0.012, -2);
  iceSheen.renderOrder = -48;
  iceSheen.name = 'ice-sheen';
  group.add(iceSheen);

  // --------------------------------------------------------------- particles
  const k = low ? 0.4 : 1;

  /**
   * Snow in three depth bands, blown left to right and downward.
   *
   * Depth is what makes weather read as weather: the far band is small, slow
   * and dim and sits behind the fighters; the mid band crosses them; the near
   * band is large, fast and in front of the lens, and is what sells the storm.
   * They share a wind vector, so the three bands never look like three
   * unrelated effects.
   */
  const snowFar = new ParticleField(
    ParticlePresets.snow({
      count: Math.round(1150 * k),
      bounds: { x: 24, y: 11, z: 18 },
      size: 4.4,
      opacity: 0.6,
      drift: [0.42, -0.5, 0],
      wobble: [0.4, 0.05, 0.3],
      wobbleSpeed: 0.5,
    }),
  );
  snowFar.position.set(1.5, 5.2, -13);

  const snowMid = new ParticleField(
    ParticlePresets.snow({
      count: Math.round(700 * k),
      bounds: { x: 14, y: 6.5, z: 8 },
      size: 8.5,
      opacity: 0.6,
      drift: [0.78, -0.78, 0],
      wobble: [0.62, 0.08, 0.36],
      wobbleSpeed: 0.62,
    }),
  );
  snowMid.position.set(0.6, 3.6, -2.4);

  const snowNear = new ParticleField(
    ParticlePresets.snow({
      count: Math.round(320 * k),
      bounds: { x: 11, y: 5.2, z: 4.5 },
      size: 17,
      opacity: 0.38,
      drift: [1.25, -1.15, 0],
      wobble: [0.9, 0.1, 0.45],
      wobbleSpeed: 0.8,
    }),
  );
  snowNear.position.set(0, 3.0, 4.2);

  /**
   * Pyreflies — deliberately sparse. Gagazet is not the Farplane: the Ronso
   * have just been killed here, and a handful of motes rising off the ledge is
   * the note the scene wants. A cloud of them would be a different location.
   */
  const pyreflies = new ParticleField(
    ParticlePresets.pyreflies({
      count: Math.round(80 * k),
      bounds: { x: 8.5, y: 3.1, z: 5 },
      size: 10,
      opacity: 0.95,
      drift: [0.1, 0.34, 0.02],
      twinkle: 0.85,
    }),
  );
  pyreflies.position.set(1.0, 1.9, -2.0);

  /**
   * Ground glitter: a flat sheet of tiny hard twinkling motes lying on the
   * snow. This is the other half of "icy ground" — a specular lobe gives the
   * broad sheen, and these give the individual crystals catching the moon.
   */
  const glitter = new ParticleField({
    count: Math.round(150 * k),
    bounds: { x: 9.5, y: 0.09, z: 6.5 },
    colors: [0xffffff, 0xdcecff, 0xbcd8ff],
    size: 2.6,
    sizeJitter: 0.8,
    drift: [0, 0, 0],
    wobble: [0.05, 0.01, 0.05],
    wobbleSpeed: 0.3,
    twinkle: 1,
    opacity: 0.8,
    additive: true,
    hardness: 0.75,
  });
  glitter.position.set(0, 0.07, -1.2);

  /**
   * Spindrift: loose snow torn off the drifts and driven across the trail at
   * ankle height. A thin, fast, almost horizontal band hugging the ground in
   * front of the party — the moving half of the drift mounds below, and what
   * makes the blizzard look like it is *on* the ledge rather than only falling
   * past the lens.
   */
  const spindrift = new ParticleField(
    ParticlePresets.snow({
      count: Math.round(260 * k),
      bounds: { x: 7.5, y: 0.42, z: 3.4 },
      size: 6.5,
      sizeJitter: 0.8,
      opacity: 0.42,
      drift: [2.3, -0.04, 0],
      wobble: [0.5, 0.1, 0.34],
      wobbleSpeed: 1.2,
      hardness: 0.3,
    }),
  );
  spindrift.position.set(-2.1, 0.3, 1.7);

  const particles = [snowFar, snowMid, snowNear, pyreflies, glitter, spindrift];
  for (const p of particles) group.add(p);

  // ------------------------------------------------------- rock and monuments
  /**
   * Snow-buried boulders along the ledge. These and the memorial stones are the
   * only real geometry besides the ground, and they earn their place twice
   * over: they break up the empty middle of the frame, and — lit by the same
   * rig and casting the same shadows as the figures — they are the proof that
   * the 3D layer and the painting share a light. Each is sunk into the ground
   * so it reads as embedded in snow rather than resting on a plane.
   */
  const rockColor = normaliseLuma(backdrop.palette.ground, 0.62);
  const props: Mesh[] = [];
  for (const [x, z, size, seed] of [
    [-6.2, -1.2, 0.34, 3],
    [0.9, -5.2, 0.5, 11],
    [7.1, -4.4, 0.48, 17],
    [-7.3, 2.7, 0.28, 23],
    [5.5, 1.5, 0.34, 29],
    [2.4, -7.9, 0.56, 37],
    [-3.2, -6.6, 0.4, 41],
    [8.6, -1.4, 0.38, 47],
    [-4.6, 3.4, 0.26, 53],
    // Foreground: big, close and cut by the bottom edge, so the ledge has a
    // near plane and the empty lower corners of the frame have something in
    // them. The tilt-shift band defocuses them, which is exactly what a
    // foreground element should do.
    [-4.4, 5.4, 0.9, 59],
    [4.6, 5.0, 0.8, 67],
    [1.7, -2.9, 0.3, 71],
  ] as Array<[number, number, number, number]>) {
    const rock = makeRock({
      size,
      color: rockColor,
      // Wide and very low: a snow-buried boulder, not a boulder on a table.
      scale: [1.55, 0.48, 1.2],
      jitter: 0.27,
      seed,
      detail: 2,
      flatShading: false,
    });
    rock.position.set(x, -size * 0.3, z);
    rock.rotation.y = (seed % 7) * 0.41;
    group.add(rock);
    props.push(rock);
  }

  /**
   * Two snow-capped rock outcrops — the crags the trail threads between. One
   * stands wide of the party arc at the left of the idle frame and one behind
   * and right of the boss, so whichever way the camera cuts there is something
   * vertical in the composition to hang the horizon off.
   *
   * They used to be capped pentagonal columns ("summoner memorial stones"), and
   * that was the wrong note twice over: a plumb column with a slab on top reads
   * as a **doorframe**, and two of them at the frame's edges read as the ruins
   * of a building rather than as a mountain trail. A crag has no plumb line and
   * no straight top edge, so each one here is a cluster: a broad tilted mass, a
   * lower shoulder beside it so the silhouette is never one lump, and a
   * wind-packed snow cap over the summit. All three are Lambert and share the
   * scene's rig, which is what keeps them in the same moonlight as the painting.
   *
   * The left one is deliberately *wide* of the party arc rather than just
   * behind it. A prop on the same view ray as a character is a tangent from
   * every rig on that side at once — the old monument grew out of party slot
   * 1's head in `victory` — and no amount of nudging it in z separates them.
   */
  const cragColor = new Color(normaliseLuma(backdrop.palette.ground, 0.5))
    .lerp(new Color(0x7e8ca6), 0.28)
    .getHex();
  /**
   * Wind-packed snow. Bright, but not white: the 3D snow has to sit in the same
   * exposure as the painted snowfield behind it, and a cap read off pure white
   * is the one element in the frame brighter than the moon.
   */
  const snowColor = new Color(normaliseLuma(backdrop.palette.ground, 0.86))
    .lerp(new Color(0xdfecff), 0.42)
    .getHex();
  for (const [x, z, s, top, ry, seed, side] of [
    [-6.6, -3.7, 1.45, 2.3, 0.7, 83, -1],
    [8.7, -9.4, 1.6, 2.75, 2.1, 91, 1],
  ] as Array<[number, number, number, number, number, number, number]>) {
    // The mass. Taller than wide and faceted at a finer subdivision than the
    // snow-buried boulders above (which are smooth and 0.48 high) — the crags
    // are the only thing on this ledge with an edge the moon can catch.
    const bodyHalf = s * 1.4;
    const body = makeRock({
      size: s,
      color: cragColor,
      scale: [0.9, 1.4, 0.8],
      jitter: 0.42,
      seed,
      detail: 2,
      flatShading: true,
    });
    body.position.set(x, top - bodyHalf, z);
    body.rotation.set(0.08, ry, -0.05 * side);
    group.add(body);
    props.push(body);

    // A lower shoulder to one side, so the silhouette is never one lump.
    const shoulder = makeRock({
      size: s * 0.7,
      color: cragColor,
      scale: [1.15, 0.88, 0.95],
      jitter: 0.4,
      seed: seed + 4,
      detail: 2,
      flatShading: true,
    });
    shoulder.position.set(x + s * 0.95 * side, top - bodyHalf * 1.2, z + s * 0.35);
    shoulder.rotation.set(-0.06, ry * 1.7, 0.07 * side);
    group.add(shoulder);
    props.push(shoulder);

    /**
     * The cap: snow packed onto the summit by the same wind driving the blizzard
     * across the frame.
     *
     * It is **narrower than the summit and sunk into it**. A cap as wide as the
     * crag, resting on top, overhangs the rock on every side and reads as a
     * mushroom — the snow has to start below the skyline and let the rock's own
     * edges come through it, which is what makes it snow *lying on* the crag.
     */
    const cap = makeRock({
      size: s * 0.52,
      color: snowColor,
      scale: [1.05, 0.38, 0.95],
      jitter: 0.3,
      seed: seed + 9,
      detail: 2,
      flatShading: false,
    });
    cap.position.set(x + s * 0.07 * side, top - s * 0.4, z - s * 0.05);
    cap.rotation.set(0.05, ry + 0.6, -0.04 * side);
    group.add(cap);
    props.push(cap);

    // A second, smaller patch on the shoulder — snow never lands in one place.
    const capLow = makeRock({
      size: s * 0.34,
      color: snowColor,
      scale: [1.25, 0.32, 1.0],
      jitter: 0.26,
      seed: seed + 13,
      detail: 2,
      flatShading: false,
    });
    capLow.position.set(
      x + s * 0.95 * side,
      top - bodyHalf * 1.2 + s * 0.48,
      z + s * 0.35 - s * 0.06,
    );
    capLow.rotation.set(0, ry * 1.7 + 0.4, 0);
    group.add(capLow);
    props.push(capLow);
  }

  /**
   * Wind-blown snow drifts at the party's feet.
   *
   * Long, low, smooth mounds lying along the wind vector the three snow bands
   * share (left to right), crowded into the lower-left of the idle frame where
   * the party stands. They do two jobs: they give the empty foreground snow a
   * shape, and — because they run the same way as the falling snow — they are
   * the thing that says the blizzard has been blowing here for a while rather
   * than starting at the moment the camera cut. They never cast: a drift's own
   * shadow is a soft smear, and a blob shadow under one reads as a rock.
   *
   * See {@link driftCanvas} for why these are masks lying on the snow rather
   * than geometry standing on it.
   */
  const driftTex = paintedCanvasTexture(driftCanvas(917));
  driftTex.colorSpace = NoColorSpace;
  driftTex.wrapS = driftTex.wrapT = ClampToEdgeWrapping;
  /**
   * Barely brighter than the snow it lies on.
   *
   * The drift colour is the one number here that has to be *restrained*: read
   * off the same 0.86 luma as the crags' caps it renders as a pale ellipse
   * lying on the ledge — a light pool, not a drift. Wind-packed snow on
   * moonlit snow is a few percent of exposure, not a different material.
   */
  const driftColor = new Color(normaliseLuma(backdrop.palette.ground, 0.7))
    .lerp(new Color(0xdfecff), 0.38)
    .getHex();
  const driftMat = new MeshLambertMaterial({
    color: driftColor,
    alphaMap: driftTex,
    transparent: true,
    opacity: 0.44,
    depthWrite: false,
  });
  const driftGeo = new PlaneGeometry(1, 1, 1, 1);
  for (const [x, z, w, d, yaw, flip] of [
    [-2.6, 2.6, 3.1, 1.25, 0.16, 1],
    [-4.2, 1.15, 2.5, 1.05, -0.12, -1],
    [-0.9, 3.3, 2.2, 0.9, 0.3, -1],
    [-2.25, -0.4, 2.0, 0.8, 0.2, 1],
    [-5.7, 3.4, 1.7, 0.72, 0.06, -1],
  ] as Array<[number, number, number, number, number, number]>) {
    const drift = new Mesh(driftGeo, driftMat);
    drift.rotation.set(-Math.PI / 2, 0, yaw);
    // One mask, mirrored on alternate drifts, so five of them are not five
    // copies of the same silhouette.
    drift.scale.set(w * flip, d, 1);
    drift.position.set(x, 0.016, z);
    drift.renderOrder = -47;
    drift.name = 'snow-drift';
    group.add(drift);
  }

  // ------------------------------------------------------------- light pools
  // A faint additive pool under each standing spot — the single cheapest trick
  // that stops a cut-out figure reading as a sticker on a painting.
  const pools: Mesh[] = PARTY_SLOTS.slice(0, 3).map((s) => {
    const pool = makeLightPool({ color: backdrop.palette.bounce, radius: 1.3, opacity: 0.2 });
    pool.position.set(s[0], 0.02, s[2]);
    return pool;
  });
  const bossPool = makeLightPool({ color: 0x8affd0, radius: 1.95, opacity: 0.22 });
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
    holdParty: true, // PARTY_SLOTS is the composition (PR-0002 A, D-041)
    palette: { ...PALETTE },
    update(dt: number): void {
      clock += dt;
      backdrop.update(dt);
      lights.update(dt);
      for (const p of particles) p.update(dt);
      // The blizzard drags the ice glint across the ledge, so the ground is
      // never a static highlight, and the enemy pool breathes so the bloom
      // always has something living in it.
      sheenBump.offset.x = (clock * 0.012) % 1;
      sheenBump.offset.y = Math.sin(clock * 0.07) * 0.02;
      (bossPool.material as { opacity: number }).opacity = 0.18 + Math.sin(clock * 0.9) * 0.05;
    },
    dispose(): void {
      watcher?.stop();
      for (const p of particles) p.dispose();
      for (const m of [...pools, ...props, iceSheen]) {
        m.geometry.dispose();
        (m.material as Material).dispose();
      }
      // The drifts share one geometry, one material and one mask between them.
      driftGeo.dispose();
      driftMat.dispose();
      driftTex.dispose();
      sheenBump.dispose();
      sheenAlpha.dispose();
      lights.dispose();
      backdrop.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
  return build;
};

export default buildGagazetScene;
