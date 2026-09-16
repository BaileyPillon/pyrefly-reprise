import {
  AdditiveBlending,
  ClampToEdgeWrapping,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  NoColorSpace,
  PlaneGeometry,
  PointLight,
  RepeatWrapping,
  Vector3,
  type Material,
} from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { makePillar } from '../engine/Diorama.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import {
  artUrl,
  normaliseLuma,
  paintedCanvasTexture,
  watchAssets,
  type AssetWatcher,
} from '../engine/PaintedArt.ts';
import { ParticleField } from '../engine/Particles.ts';
import { radialCanvas, rng } from '../engine/ProceduralArt.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import { ScenePalettes } from '../engine/ScenePalettes.ts';
import type { SceneSlots } from './index.ts';
import type {
  SceneBuild,
  SceneBuildOptions,
  SceneFactory,
  SceneRigName,
} from './types.ts';

// ---------------------------------------------------------------------------
// Bevelle Underground — Vegnagun's empty chamber, deep under the holy city
// ---------------------------------------------------------------------------
//
// The painting (`public/art/backdrops/bevelle-underground.png`, 2688x1536) is a
// machina cathedral: ribbed vaults and two lit apertures across the top third, a
// vast riveted turbine disc on the axis at 44–60% of the image height, catwalks
// raking in from both sides, banks of rust-orange lamp cylinders down both
// edges, and a dark gantry wall with a black archway under it. Its own floor is
// the bright plated band across the bottom seventh.
//
// Two facts about that image drive every number in this file:
//
//  1. **It is an up-shot.** The painted floor plates converge at roughly 86% of
//     the image height, which is where *its* horizon is. Our battle camera sits
//     3 units up and looks slightly down, so *our* horizon is a quarter of the
//     way down the frame. The two can never be registered, so the painted floor
//     is not used as floor at all — the 3D plate deck covers it, and the seam is
//     placed on the painting's darkest horizontal band (the gantry wall under
//     the turbine) where a dissolve has nothing to give it away.
//  2. **It is lit by its own practicals.** Every warm value in the frame comes
//     from the lamp cylinders, and every cool one from the apertures above. So
//     the rig is built the same way round: a teal key from the vault, and real
//     rust-orange point lights standing where the painted lamps stand, three of
//     which flicker.

/**
 * The camera the parallax stack and the backdrop framing are solved for —
 * identical to the `idle` rig's position. See "Framing the backdrop" in
 * `docs/ENGINE-API.md`.
 */
const CAMERA_REF: [number, number, number] = [0, 3.0, 9.6];

/**
 * The painting plane, solved for `idle` and checked against all seven rigs.
 *
 * At 78 wide and 56 units from the idle camera the frame sees 34.2 x 60.8 world
 * units of a 78 x 44.6 plane — 77% of the painting's height and 75% of its
 * width, which leaves every other rig a margin to swing into. `centreY` then
 * slides that window down the image until its top edge sits at 17%: high enough
 * to keep the second vault aperture and the whole turbine disc, low enough that
 * the plane's own bottom edge stays *below* the bottom of the frame instead of
 * showing a line of background under the painting.
 */
const BACKDROP = { width: 78, distance: -50, centreY: -2.82 } as const;

/**
 * FFX battle framing: fov 32 (inside the 30–34 band), the party in a shallow
 * left-facing arc in the lower left, the boss right of centre and further back.
 *
 * The rigs differ mostly by **dolly and height** and only slightly by look-at,
 * for the reason `zanarkand-dome.ts` spells out: a flat matte cannot be panned
 * off. Every rig here is checked against the plane's 78 x 44.6 rectangle, and
 * the worst of them (`party`, `enemy`) leaves under 4% of one frame edge
 * uncovered — caught by the near-black `background`, by the two foreground
 * conduits that bracket the frame, and by the palette's vignette.
 */
const RIGS: Record<SceneRigName, CameraRig> & Record<string, CameraRig> = {
  /**
   * The bible's establishing shot — "the empty cradle": high and well back, the
   * whole chamber in frame, no boss yet. The presenter pushes in from here to
   * `idle`; it sits on nearly the same view axis, so the move reads as a dolly
   * and not as a cut.
   */
  intro: { position: [0.15, 5.5, 16.4], lookAt: [0.5, 2.5, -3.0], fov: 30, sway: 1.5 },
  idle: { position: CAMERA_REF, lookAt: [0.15, 1.5, -1.3], fov: 32 },
  /**
   * Pushed in for an ability beat. The attacker (slot 0, x ≈ -0.4 mid-lunge)
   * and the boss (x 3.3) are both well inside the frame — an action rig that
   * frames only the target turns every attack into a shot of the target.
   */
  /**
   * The swing right is held to the point where party slot 1 still keeps a
   * whole figure inside the left edge. A first pass pushed a third of a unit
   * further and clipped Yuna's sleeve on the frame border — a bystander cut to
   * a glowing sliver reads as a rendering fault, not as framing.
   */
  action: { position: [0.15, 2.7, 9.0], lookAt: [1.0, 1.5, -1.2], fov: 32, sway: 0.7 },
  party: { position: [0.5, 2.3, 8.2], lookAt: [-0.35, 1.4, 0.9], fov: 32, sway: 0.7 },
  enemy: { position: [0.8, 3.1, 7.2], lookAt: [2.0, 1.9, -2.8], fov: 32, sway: 0.7 },
  /**
   * **The Bahamut angle** (visual bible §2.4, money shot 2): "three-quarter low,
   * Bahamut's wings spread wide enough to exceed the frame".
   *
   * Built from *height*, not from tilt — the camera drops to a metre off the
   * deck and stays almost level, because a steep tilt-up is the one move a flat
   * backdrop cannot survive. From down there a 3.5-unit dragon fills the frame
   * from a twentieth to two thirds of its height and the party crowd the left
   * edge, which is the composition the bible is after without the black band a
   * real tilt-up would put across the top.
   */
  bahamut: { position: [0.9, 1.15, 6.4], lookAt: [2.2, 1.65, -2.8], fov: 30, sway: 0.5 },
  victory: { position: [0.4, 2.2, 8.6], lookAt: [-0.5, 1.45, 0.9], fov: 32, sway: 1.2 },
};

/**
 * Three active slots in the FFX arc, front to back and staggered into the lower
 * left, then four reserve slots parked off frame-left.
 *
 * The arc is offset in **both** x and z at every step so no figure stands
 * directly behind another at any rig — a straight line of three cut-outs is the
 * fastest way to make a painted scene look like a sticker sheet — and it sits
 * far enough right of the deck's rim that the command window (bottom left, ~26%
 * of the frame) never buries the front character.
 */
const PARTY_SLOTS: Array<[number, number, number]> = [
  [-1.5, 0, 1.6], // front
  [-2.9, 0, 0.35], // middle, further left and back
  [-1.0, 0, -0.95], // back, stepped in again
  // reserve — outside every rig's frustum, including `victory`'s left swing
  [-12.0, 0, 2.6],
  [-12.9, 0, 1.0],
  [-13.8, 0, -0.6],
  [-14.7, 0, -2.2],
];

/**
 * Enemy formation: the boss on the chamber's axis-right and further back, over
 * the place the painted gantry cradled Vegnagun, with two flanking slots for
 * the parts a multi-part boss puts on the field (Bahamut's wings, Vegnagun's
 * leg and tail).
 */
const ENEMY_SLOTS: Array<[number, number, number]> = [
  [3.3, 0, -2.6], // boss
  [5.6, 0, -1.1], // right part
  [1.8, 0, -4.6], // left / back part
];

/** Canonical world heights for the cast that fights here. */
export const BEVELLE_UNDERGROUND_ACTOR_HEIGHTS = {
  tidus: 1.75,
  yuna: 1.68,
  auron: 1.86,
  /** The possessed Bahamut: wings wide, meant to crowd the frame. */
  bahamut: 3.5,
} as const;

/**
 * The scene's default cut-out protection for a painted actor parked on
 * {@link SceneBuild.enemySlots}.
 *
 * Boss art is generated **full-bleed**: the aura runs off every side of the
 * PNG, so without this the "cut-out" ends on the plane's own rectangle.
 * `matte: 'force'` takes out the white studio background the border flood fill
 * can reach, `edgeFade` feathers whatever painted aura is still touching the
 * border so the plane's edge reads as atmosphere instead of as a frame, and
 * `alphaCut` stays *low* on purpose — a high cut re-hardens the tail of the
 * feather.
 *
 * Bevelle needs more of it than Gagazet does, not less: this frame has a bright
 * cool deck and a lit wall behind the boss, so a surviving rectangle of dark
 * aura would be visible against both.
 *
 * ```ts
 * const boss = await PaintedActor.fromSubject('ffx2-bahamut', {
 *   ...BEVELLE_UNDERGROUND_ENEMY_ACTOR_DEFAULTS,
 *   worldHeight: BEVELLE_UNDERGROUND_ACTOR_HEIGHTS.bahamut,
 * });
 * ```
 */
export const BEVELLE_UNDERGROUND_ENEMY_ACTOR_DEFAULTS = {
  matte: { mode: 'force' as const },
  edgeFade: 0.2,
  alphaCut: 0.04,
} as const;

/** The slot table `SCENES` in `./index.ts` stages fighters against. */
export const BEVELLE_UNDERGROUND_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.slice(0, 3).map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: BEVELLE_UNDERGROUND_ACTOR_HEIGHTS.tidus,
  enemyHeight: BEVELLE_UNDERGROUND_ACTOR_HEIGHTS.bahamut,
};

/**
 * The Bevelle grade. `ScenePalettes.bevelleUnderground` is the bible's
 * cold-dominant teal-and-orange split tone; the two departures here are a
 * slightly deeper vignette (the chamber is a pit, and the frame wants to close
 * on the deck) and a higher bloom threshold, because the painting's lamp banks
 * are already near-white and bloom at the table's 0.86 turns both frame edges
 * into a smear.
 */
const PALETTE: ScenePalette = {
  ...ScenePalettes.bevelleUnderground,
  name: 'bevelle-underground',
  /**
   * The painting is the darkest of the five locations before anything is done
   * to it, and the table's `exposure: 1.0` / `vignette: 0.46` renders it as a
   * black frame with three orange dots in it. The exposure is pushed up a fifth
   * and the shadows are lifted until the chamber's architecture survives the
   * grade — the whole point of the location is the *scale* of the machinery,
   * and scale you cannot see is not scale.
   */
  lift: [0.014, 0.024, 0.034],
  exposure: 1.26,
  vignette: 0.34,
  vignetteRadius: 0.74,
  bloomThreshold: 0.88,
  bloomStrength: 0.66,
  bloomRadius: 0.62,
  tiltFocus: 0.54,
  tiltBandWidth: 0.15,
  tiltMaxBlur: 3.8,
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
 * The machina deck: riveted plate with grating slots cut through it.
 *
 * Painted as a **tile** (it is repeated across the floor), and deliberately
 * mostly value rather than colour — the scene tints the material with a hue
 * sampled from the painting's own plating, so the deck and the painted chamber
 * cannot drift apart when the art is regenerated.
 *
 * Three things have to be in it for a floor to read as machina rather than as
 * a texture: the **plate seams** (a 4x4 grid of panels with a dark gap), the
 * **grating slots** (fine dark lines cut in one direction, alternating per
 * panel so the deck is not one corduroy sheet), and the **rivets**, which are
 * what gives the specular lobe something to break on.
 */
function deckCanvas(size = 512, seed = 41): HTMLCanvasElement {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  const rand = rng(seed);

  ctx.fillStyle = '#5b6880';
  ctx.fillRect(0, 0, size, size);

  // Blotchy wear, so no two panels read as the same casting.
  for (let i = 0; i < 90; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = size * (0.03 + rand() * 0.12);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = rand() > 0.45;
    g.addColorStop(0, dark ? 'rgba(24,30,42,0.5)' : 'rgba(158,172,194,0.34)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const n = 4;
  const cell = size / n;
  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) {
      const x0 = gx * cell;
      const y0 = gy * cell;

      // Grating slots, direction alternating per panel.
      const along = (gx + gy) % 2 === 0;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0 + 3, y0 + 3, cell - 6, cell - 6);
      ctx.clip();
      /**
       * Six slots, not the dozen a real grating has, and at a third of the
       * contrast the drawing wants. A deck is seen almost edge-on from a battle
       * rig, and a fine high-contrast rib pattern at that angle aliases into
       * moiré bands that read as a *staircase* running away from the camera.
       * Coarse and low-contrast survives the grazing angle; fine and crisp
       * does not.
       */
      const slots = 6;
      for (let s = 1; s < slots; s++) {
        const t = (s / slots) * cell;
        ctx.fillStyle = 'rgba(10,14,22,0.34)';
        if (along) ctx.fillRect(x0 + 4, y0 + t, cell - 8, 3);
        else ctx.fillRect(x0 + t, y0 + 4, 3, cell - 8);
        // The lit lip on the far side of each slot.
        ctx.fillStyle = 'rgba(196,212,232,0.12)';
        if (along) ctx.fillRect(x0 + 4, y0 + t + 3, cell - 8, 1.5);
        else ctx.fillRect(x0 + t + 3, y0 + 4, 1.5, cell - 8);
      }
      ctx.restore();

      // Panel seam.
      ctx.strokeStyle = 'rgba(8,11,18,0.85)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x0 + 1.5, y0 + 1.5, cell - 3, cell - 3);
      ctx.strokeStyle = 'rgba(176,192,214,0.22)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 4, y0 + 4, cell - 8, cell - 8);

      // Rivets around the panel edge.
      const step = cell / 6;
      for (let i = 1; i < 6; i++) {
        for (const [rx, ry] of [
          [x0 + i * step, y0 + 7],
          [x0 + i * step, y0 + cell - 7],
          [x0 + 7, y0 + i * step],
          [x0 + cell - 7, y0 + i * step],
        ] as Array<[number, number]>) {
          ctx.fillStyle = 'rgba(206,220,238,0.55)';
          ctx.beginPath();
          ctx.arc(rx, ry, 1.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(10,14,22,0.5)';
          ctx.beginPath();
          ctx.arc(rx + 0.9, ry + 0.9, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
  return c;
}

/**
 * The deck's alpha, and the reason it is not a plain radial falloff.
 *
 * A centred radial fade on a floor fades in *every* direction, so the plate
 * directly under the lens — the nearest, most-lit, most-looked-at part of the
 * frame — comes out semi-transparent over near-black and the whole foreground
 * goes muddy. What a floor actually wants is to be solid from the lens to a
 * little past the fighters and then gone, so this gradient is pushed **toward
 * the camera** (v = 0 is near; see the plane's rotation) and given a wide
 * opaque core. The far edge then lands on the painting's dark gantry wall,
 * which is the one band in the image a dissolve can hide in.
 */
function deckFadeCanvas(size = 512): HTMLCanvasElement {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  const g = ctx.createRadialGradient(
    size * 0.5,
    size * 0.34,
    0,
    size * 0.5,
    size * 0.34,
    size * 0.48,
  );
  for (const [at, a] of [
    [0, 1],
    [0.42, 1],
    [0.62, 0.86],
    [0.82, 0.34],
    [0.95, 0.04],
    [1, 0],
  ] as Array<[number, number]>) {
    const v = Math.round(a * 255);
    g.addColorStop(at, `rgb(${v},${v},${v})`);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

/**
 * What the deck reflects.
 *
 * Polished plate under a chamber lit only by practicals does not mirror the
 * room — it smears the *sources* along the line of sight. So this is painted as
 * bands running away from the camera (v is world z): rust-orange down both
 * thirds where the lamp banks stand, a cold teal core on the axis under the
 * vault apertures and the light beams, and nothing anywhere else. Horizontal
 * ripple lines break each smear so it reads as metal with a grain rather than
 * as a gradient, and the whole canvas is feathered to nothing at its border so
 * the additive sheet can never show its own rectangle.
 */
function deckReflectionCanvas(size = 512): HTMLCanvasElement {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  const rand = rng(77);

  const smear = (u: number, w: number, colour: string, alpha: number): void => {
    const g = ctx.createLinearGradient((u - w) * size, 0, (u + w) * size, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, colour.replace('ALPHA', alpha.toFixed(3)));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect((u - w) * size, 0, w * 2 * size, size);
  };

  const rust = 'rgba(224,116,46,ALPHA)';
  const teal = 'rgba(110,210,238,ALPHA)';
  ctx.globalCompositeOperation = 'lighter';
  smear(0.13, 0.07, rust, 0.6);
  smear(0.26, 0.04, rust, 0.3);
  smear(0.5, 0.13, teal, 0.5);
  smear(0.74, 0.04, rust, 0.32);
  smear(0.88, 0.07, rust, 0.62);

  /**
   * The breaks that stop a smear reading as a gradient — **few, wide and
   * feathered**.
   *
   * The first pass of this used 120 one-pixel lines across the full width, on
   * the theory that a reflection has a grain. Seen at the deck's grazing angle
   * those lines compress into an evenly-spaced ladder that the eye reads,
   * unmistakably and disastrously, as a **flight of stairs** climbing away
   * toward the boss. Reflections on plate do not have a regular period; a dozen
   * soft bands at random spacings do the same job and cannot alias into a
   * staircase.
   */
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 13; i++) {
    const y = rand() * size;
    const h = size * (0.012 + rand() * 0.05);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    const a = 0.16 + rand() * 0.24;
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, `rgba(0,0,0,${a.toFixed(3)})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, size, h);
  }

  // Feather to nothing at the border.
  ctx.globalCompositeOperation = 'destination-in';
  const fade = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(0.45, 'rgba(0,0,0,0.9)');
  fade.addColorStop(0.8, 'rgba(0,0,0,0.22)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

/**
 * One light beam, drawn into alpha only — the plane's material carries the
 * colour, so every shaft in the scene shares this one texture.
 *
 * Brightest where it leaves the vault and dying out before it reaches the deck,
 * because a shaft that ends on the floor draws a hard line there and stops
 * being volume.
 */
function beamCanvas(softness = 0.36): HTMLCanvasElement {
  const w = 256;
  const h = 512;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d')!;
  const v = ctx.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0, 'rgba(255,255,255,0)');
  v.addColorStop(0.07, 'rgba(255,255,255,0.9)');
  v.addColorStop(0.4, 'rgba(255,255,255,0.46)');
  v.addColorStop(0.76, 'rgba(255,255,255,0.13)');
  v.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
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

// ---------------------------------------------------------------------------
// The scene
// ---------------------------------------------------------------------------

/** One rust lamp: the point light, its visible bulb, and its flicker phase. */
interface Practical {
  light: PointLight;
  bulb: Mesh;
  base: number;
  /** Two incommensurate rates, so no two lamps ever beat together. */
  rateA: number;
  rateB: number;
  /** 0 for the steady lamp, ~1 for the bad ones. */
  jitter: number;
}

/** One rotating shaft: the yaw group, its two crossed quads, its rate. */
interface Beam {
  yaw: Group;
  quads: Mesh[];
  speed: number;
  phase: number;
  opacity: number;
}

/**
 * **Bevelle Underground — Vegnagun's empty chamber**, as a {@link SceneFactory}.
 *
 * A matte painting parallax stack over a riveted machina deck with its own
 * specular lobe and a reflected-light sheet; a teal key from the vault with a
 * rust rim; three flickering orange practicals standing where the painted lamp
 * banks stand; three slowly rotating light shafts; dust hanging in them; slow
 * pulsing glows on the machinery at depth; two foreground conduits bracketing
 * the frame; and the Bevelle teal-and-orange split-tone grade.
 *
 * It owns **no actors** — see `docs/ENGINE-API.md#scene-builder-contract`.
 */
export const buildBevelleUndergroundScene: SceneFactory = async (
  opts: SceneBuildOptions = {},
): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:bevelle-underground';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? CAMERA_REF;

  // ---------------------------------------------------------------- backdrop
  const url = artUrl('art/backdrops/bevelle-underground.png');

  const backdropOptions = {
    url,
    width: BACKDROP.width,
    distance: BACKDROP.distance,
    centreY: BACKDROP.centreY,
    cameraRef,
    /**
     * Two masked bands carved out of the same painting and scaled toward the
     * reference camera: the turbine-and-catwalk band (0.34–0.64) and the gantry
     * wall below it (0.60–0.90). At rest they register exactly with the
     * painting; the moment the camera sways or cuts to `action` they part, and
     * the flat matte reads as a room with depth in it. Those two bands are also
     * the ones with the strongest converging perspective lines, which is what
     * makes the parallax legible instead of merely present.
     */
    layers: low
      ? [{ from: 0.6, to: 0.9, feather: 0.1, featherBottom: 0.06, z: -20, opacity: 0.6 }]
      : [
          { from: 0.34, to: 0.64, feather: 0.09, featherBottom: 0.08, z: -32, opacity: 0.62 },
          { from: 0.6, to: 0.9, feather: 0.1, featherBottom: 0.06, z: -20, opacity: 0.6 },
        ],
    /**
     * Where the palette is read from.
     *
     * `key` is the **vault aperture** at the very top — the only cool source in
     * the painting and the one the 3D key stands in for. `horizon` is the dark
     * gantry wall, which is both the fog colour and the band our deck dissolves
     * into, so taking it from anywhere brighter would fog the chamber grey.
     * `ground` is the painting's own plating, which is where the deck's hue
     * comes from even though its floor is never shown.
     */
    sampleBands: {
      sky: [0.0, 0.1],
      horizon: [0.66, 0.82],
      ground: [0.9, 1.0],
      key: [0.0, 0.07],
    },
    // The deck below is this scene's own, so `Backdrop` supplies no ground.
    ground: false,
    /**
     * Tight and deep: a sealed chamber has no distance haze to speak of, and a
     * far plane much past the parallax stack lets the painting's own lamps read
     * as being in the same air as the party.
     */
    fog: { near: 18, far: 50, colorMix: 0.14 },
    /**
     * Four sheets of chamber air. The far two sit exactly on the band where the
     * deck dissolves into the painted gantry wall and are the reason that seam
     * has no edge; the near two are the steam and machine haze at knee height,
     * which is what stops the figures looking like they are standing on a clean
     * tabletop.
     */
    fogPlanes: [
      { z: -30, y: 4.4, width: 70, height: 22, opacity: 0.2, speed: 0.006 },
      { z: -19, y: 2.8, width: 54, height: 15, opacity: 0.22, speed: 0.011 },
      { z: -11, y: 1.5, width: 38, height: 9, opacity: 0.16, speed: 0.021 },
      { z: -4.5, y: 0.75, width: 28, height: 5, opacity: 0.09, speed: 0.036, additive: true },
    ],
  } satisfies BackdropOptions;

  let backdrop = await Backdrop.create(backdropOptions);
  backdrop.applyTo(group);

  // ------------------------------------------------------------------ lights
  /**
   * Teal key from high on the left — the vault aperture's own side of the
   * painting, so the 3D shadows rake the deck the way the painted ones do — a
   * cold fill, and a **rust** rim from the right.
   *
   * The rim is the inverse of Gagazet's decision and for the same reason:
   * against a frame that is dominated by cold steel, a cold rim is invisible
   * and the cut-outs go back to being stickers. Rust is also the truthful
   * choice here, because the lamp banks really are the only warm thing in the
   * room.
   */
  const lights = new LightRig({
    palette: backdrop.palette,
    keyFrom: [-8.4, 9.5, -1.5],
    keyIntensity: low ? 2.0 : 2.15,
    rimFrom: [8.2, 3.4, 4.2],
    rimColor: 0xff9a52,
    rimIntensity: 0.85,
    fillIntensity: 0.95,
    ambientIntensity: 0.46,
    luma: { key: 0.86, fill: 0.6, rim: 0.86, ambient: 0.5 },
    shadows: low ? false : { mapSize: 1024, area: 14, radius: 3.4, bias: -0.0013 },
  });
  /**
   * `LightRig` warms every key it builds by 30% toward candlelight, which is
   * right for a sun or a moon and wrong for a lamp-lit machine room. Push it
   * back to the aperture's cyan by hand: the split tone the grade is built on
   * only exists if the key and the practicals are genuinely on opposite sides
   * of the wheel.
   */
  lights.key.color.set(
    new Color(normaliseLuma(backdrop.palette.key, 0.74)).lerp(new Color(0x6ed2ee), 0.62),
  );
  group.add(lights.group);

  // ------------------------------------------------------------- machina deck
  /**
   * The deck.
   *
   * Phong, not Lambert: riveted plate is the one surface in this project that
   * genuinely has a highlight, and the brief's "subtle reflections" are that
   * lobe plus the additive sheet below. The bump map is the colour map itself,
   * so the grating slots and the rivets are what the lobe breaks on.
   *
   * Its alpha is a radial falloff centred a little behind the party: the deck
   * exists where the figures need something to stand on and is gone by the time
   * it reaches the painting, which is what puts the seam on the painted gantry
   * wall rather than in mid-air.
   */
  const deckTex = paintedCanvasTexture(deckCanvas(512, 41));
  deckTex.wrapS = deckTex.wrapT = RepeatWrapping;
  deckTex.repeat.set(3, 3);
  const deckFade = paintedCanvasTexture(deckFadeCanvas(512));
  deckFade.colorSpace = NoColorSpace;
  deckFade.wrapS = deckFade.wrapT = ClampToEdgeWrapping;
  const deckMat = new MeshPhongMaterial({
    map: deckTex,
    color: new Color(normaliseLuma(backdrop.palette.ground, 0.56)).lerp(new Color(0x4e6280), 0.3),
    specular: new Color(normaliseLuma(backdrop.palette.key, 0.8)).lerp(new Color(0xcfeef8), 0.55),
    shininess: 26,
    bumpMap: deckTex,
    bumpScale: 0.3,
    alphaMap: deckFade,
    transparent: true,
    depthWrite: false,
  });
  const deck = new Mesh(new PlaneGeometry(46, 46, 1, 1), deckMat);
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(0, 0, -5.0);
  deck.receiveShadow = true;
  deck.renderOrder = -50;
  deck.name = 'machina-deck';
  group.add(deck);

  /**
   * The reflected light, as a separate additive sheet.
   *
   * Additive over a black-free canvas means it can only ever *add* the lamps
   * and the shafts back into the plate — it cannot wash out the hue the deck
   * took from the painting, which a reflective material with a real environment
   * map would immediately do.
   */
  const reflectTex = paintedCanvasTexture(deckReflectionCanvas(512));
  reflectTex.wrapS = reflectTex.wrapT = ClampToEdgeWrapping;
  const reflectMat = new MeshBasicMaterial({
    map: reflectTex,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: false,
  });
  const reflections = new Mesh(new PlaneGeometry(44, 36, 1, 1), reflectMat);
  reflections.rotation.x = -Math.PI / 2;
  reflections.position.set(0, 0.014, -2.0);
  reflections.renderOrder = -49;
  reflections.name = 'deck-reflections';
  group.add(reflections);

  // ------------------------------------------------------------- practicals
  /**
   * The rust lamps, standing where the painting's lamp cylinders stand: two
   * banks wide of the deck and one further back on the axis-left catwalk.
   *
   * Each is a real {@link PointLight} *and* a visible bulb quad, because a point
   * light on its own lights the deck without ever appearing in frame, and a
   * glow quad on its own lights nothing. Three of the four flicker (the bible
   * asks for three of eight; at our four that is the same proportion of the
   * room misbehaving), each on its own pair of incommensurate rates so the
   * chamber never pulses in time with itself.
   */
  const glowTex = paintedCanvasTexture(
    radialCanvas(256, [
      [0, 1],
      [0.16, 0.82],
      [0.42, 0.3],
      [0.72, 0.06],
      [1, 0],
    ]),
  );
  const practicals: Practical[] = [];
  for (const [x, y, z, w, h, intensity, jitter] of [
    [-6.4, 3.2, -8.5, 1.4, 2.4, 5.5, 1],
    [6.8, 3.6, -10.5, 1.5, 2.7, 6.0, 1],
    [-8.2, 2.3, -15.5, 1.1, 2.0, 4.0, 0.75],
    [5.9, 1.8, -4.0, 0.9, 1.5, 3.0, 0],
  ] as Array<[number, number, number, number, number, number, number]>) {
    const light = new PointLight(0xe0742e, intensity, 26, 2);
    light.position.set(x, y, z);
    light.name = 'practical-rust';
    group.add(light);

    const bulb = new Mesh(
      new PlaneGeometry(w, h),
      new MeshBasicMaterial({
        map: glowTex,
        color: 0xffa14a,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: AdditiveBlending,
        fog: false,
      }),
    );
    bulb.position.set(x, y, z);
    bulb.renderOrder = -20;
    bulb.name = 'practical-bulb';
    group.add(bulb);

    practicals.push({
      light,
      bulb,
      base: intensity,
      rateA: 5.3 + practicals.length * 2.7,
      rateB: 11.9 + practicals.length * 3.1,
      jitter,
    });
  }

  // ------------------------------------------------------------ light shafts
  /**
   * Three shafts turning slowly through the chamber's air.
   *
   * Each is **two quads crossed at a right angle** inside a yaw group, for the
   * obvious reason: a single billboard-free quad vanishes as it turns edge-on
   * and the shaft blinks once per half-turn. Crossed, one is always near
   * face-on, so the pair sums to a nearly constant brightness and the rotation
   * reads as a beam sweeping rather than as a light failing. The tilt lives on
   * an inner group, so yawing the outer one sweeps a cone instead of spinning a
   * plank.
   */
  const beamTex = paintedCanvasTexture(beamCanvas(0.36));
  const beams: Beam[] = [];
  const beamGeoCache: PlaneGeometry[] = [];
  const beamMats: MeshBasicMaterial[] = [];
  /**
   * A battle rig looks slightly *down*, so the top of the frame at the depth
   * these stand is only six or seven units off the deck. A 22-unit shaft hung
   * from a painted vault therefore puts its bright head far above the frame and
   * leaves nothing on screen but the dead tail of its falloff — which is why
   * the first pass of this scene appeared to have no shafts in it at all. Each
   * one is sized and hung so its **bright head sits just under the top edge of
   * the idle frame**, and it dies before it reaches the deck.
   */
  for (const [x, z, w, h, top, tilt, colour, speed, opacity] of [
    [-5.4, -9.5, 5.2, 13, 8.6, 0.14, 0x8fdcf0, 0.075, 0.42],
    [6.6, -13.0, 6.0, 14, 9.4, -0.18, 0x9fe4f2, -0.055, 0.36],
    [1.2, -18.0, 4.6, 12, 9.0, 0.09, 0xffb070, 0.11, 0.3],
  ] as Array<
    [number, number, number, number, number, number, number, number, number]
  >) {
    const yaw = new Group();
    yaw.position.set(x, 0, z);
    const tiltGroup = new Group();
    tiltGroup.rotation.z = tilt;
    yaw.add(tiltGroup);

    const geo = new PlaneGeometry(w, h);
    beamGeoCache.push(geo);
    const quads: Mesh[] = [];
    for (let i = 0; i < 2; i++) {
      const mat = new MeshBasicMaterial({
        map: beamTex,
        color: colour,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        fog: false,
      });
      beamMats.push(mat);
      const quad = new Mesh(geo, mat);
      quad.position.y = top - h * 0.5;
      quad.rotation.y = i * Math.PI * 0.5;
      quad.renderOrder = -18;
      quad.name = 'light-shaft';
      tiltGroup.add(quad);
      quads.push(quad);
    }
    group.add(yaw);
    beams.push({ yaw, quads, speed, phase: beams.length * 2.1, opacity });
  }

  // --------------------------------------------------- machinery at depth
  /**
   * Slow pulsing glows on the machinery behind the parallax stack.
   *
   * These are the scene's only lights the *painting* does not already contain,
   * and they are what stops the chamber looking like a photograph of a chamber:
   * a still matte with six sources breathing at six different rates in front of
   * it is read as a working machine room. They sit between the painting plane
   * and the near parallax band, so they parallax with the architecture rather
   * than floating in front of it, and none of them is near the party — a
   * breathing glow on the same view ray as a character reads as a bug.
   */
  const machineGlows: Array<{ mesh: Mesh; base: number; rate: number; phase: number }> = [];
  const glowGeoCache: PlaneGeometry[] = [];
  for (const [x, y, z, w, h, colour, base, rate] of [
    [-15.5, 5.5, -30, 7, 5, 0xe0742e, 0.36, 0.5],
    [14.0, 7.0, -28, 6.5, 4.5, 0xe0742e, 0.32, 0.37],
    [-2.5, 12.5, -36, 9, 5.5, 0x7fd0e8, 0.22, 0.29],
    [-9.0, 2.4, -22, 4.2, 2.4, 0xffa14a, 0.24, 0.63],
    [10.5, 1.8, -24, 3.6, 2.2, 0xffa14a, 0.2, 0.44],
    [4.5, 9.0, -34, 3.0, 7.5, 0x7fd0e8, 0.18, 0.23],
  ] as Array<[number, number, number, number, number, number, number, number]>) {
    const geo = new PlaneGeometry(w, h);
    glowGeoCache.push(geo);
    const mesh = new Mesh(
      geo,
      new MeshBasicMaterial({
        map: glowTex,
        color: colour,
        transparent: true,
        opacity: base,
        depthWrite: false,
        blending: AdditiveBlending,
        fog: false,
      }),
    );
    mesh.position.set(x, y, z);
    mesh.renderOrder = -40;
    mesh.name = 'machinery-glow';
    group.add(mesh);
    machineGlows.push({ mesh, base, rate, phase: machineGlows.length * 1.7 });
  }

  // --------------------------------------------------------------- particles
  const k = low ? 0.4 : 1;

  /**
   * Dust, in three depth bands.
   *
   * Depth is what makes air read as air: the far band is small, slow and dim
   * and hangs in the shafts behind the fighters; the mid band crosses them; the
   * near band is large and slow in front of the lens. All three drift *upward*,
   * barely — this is a sealed pit with machines running in it, not weather, so
   * the motion has to be convection rather than wind.
   */
  const dustFar = new ParticleField({
    count: Math.round(620 * k),
    bounds: { x: 20, y: 10, z: 14 },
    colors: [0xc8d8e4, 0xa8c4d8, 0xdfeaf2],
    size: 3.4,
    sizeJitter: 0.7,
    drift: [0.06, 0.16, 0],
    wobble: [0.5, 0.2, 0.4],
    wobbleSpeed: 0.26,
    twinkle: 0.45,
    opacity: 0.4,
    additive: true,
    hardness: 0.25,
  });
  dustFar.position.set(0, 6.0, -12);

  const dustMid = new ParticleField({
    count: Math.round(320 * k),
    bounds: { x: 12, y: 4.5, z: 7 },
    colors: [0xdfeaf2, 0xc8d8e4, 0xffcf9a],
    size: 6.5,
    sizeJitter: 0.7,
    drift: [0.1, 0.22, 0],
    wobble: [0.45, 0.22, 0.35],
    wobbleSpeed: 0.34,
    twinkle: 0.5,
    opacity: 0.34,
    additive: true,
    hardness: 0.2,
  });
  dustMid.position.set(0.5, 2.9, -2.5);

  const dustNear = new ParticleField({
    count: Math.round(130 * k),
    bounds: { x: 10, y: 4.0, z: 4 },
    colors: [0xdfeaf2, 0xb8ccdc],
    size: 13,
    sizeJitter: 0.8,
    drift: [0.14, 0.18, 0],
    wobble: [0.6, 0.25, 0.4],
    wobbleSpeed: 0.4,
    twinkle: 0.35,
    opacity: 0.16,
    additive: true,
    hardness: 0.12,
  });
  dustNear.position.set(0, 2.6, 4.4);

  /**
   * Sparks off the lamp banks: a handful of hot motes rising past each side of
   * the frame. Sparse on purpose — this is a dead machine room, and anything
   * denser reads as a fire.
   */
  const sparksLeft = new ParticleField({
    count: Math.round(46 * k),
    bounds: { x: 1.6, y: 3.6, z: 2.2 },
    colors: [0xffb347, 0xff8a3a, 0xffe1a8],
    size: 6,
    sizeJitter: 0.6,
    drift: [0.04, 0.5, 0],
    wobble: [0.3, 0.12, 0.2],
    wobbleSpeed: 0.9,
    twinkle: 0.9,
    opacity: 0.55,
    additive: true,
    hardness: 0.35,
  });
  sparksLeft.position.set(-8.6, 4.2, -6.5);

  const sparksRight = new ParticleField({
    count: Math.round(40 * k),
    bounds: { x: 1.6, y: 3.8, z: 2.2 },
    colors: [0xffb347, 0xff8a3a, 0xffe1a8],
    size: 6,
    sizeJitter: 0.6,
    drift: [-0.03, 0.46, 0],
    wobble: [0.3, 0.12, 0.2],
    wobbleSpeed: 0.85,
    twinkle: 0.9,
    opacity: 0.5,
    additive: true,
    hardness: 0.35,
  });
  sparksRight.position.set(8.9, 4.6, -8.5);

  /**
   * Steam off a floor vent at the party's left, drifting up and out. It is the
   * one soft-edged thing at deck level, and it is what proves the deck is a
   * surface with holes in it rather than a printed sheet.
   */
  const steam = new ParticleField({
    count: Math.round(110 * k),
    bounds: { x: 2.6, y: 1.9, z: 1.8 },
    colors: [0xc8d8e4, 0xa4bccc, 0xe4eef4],
    size: 26,
    sizeJitter: 0.7,
    drift: [0.26, 0.5, 0],
    wobble: [0.45, 0.1, 0.3],
    wobbleSpeed: 0.5,
    twinkle: 0.1,
    opacity: 0.08,
    additive: true,
    hardness: 0.05,
  });
  steam.position.set(-5.6, 1.5, -1.0);

  const particles = [dustFar, dustMid, dustNear, sparksLeft, sparksRight, steam];
  for (const p of particles) group.add(p);

  // ---------------------------------------------------- conduits and plating
  /**
   * Two foreground conduits, cut by the frame's edges.
   *
   * They earn their place three times over: they bracket a composition whose
   * left and right thirds are otherwise empty deck, they are the sliver of
   * cover for the two rigs that swing furthest off the painting's centre, and —
   * lit by the same rig and casting the same shadows as the figures — they are
   * the proof that the 3D layer and the painting share a light. The tilt-shift
   * band defocuses them, which is exactly what a foreground element should do.
   */
  const props: Mesh[] = [];
  const steel = new Color(normaliseLuma(backdrop.palette.ground, 0.34))
    .lerp(new Color(0x2c3a4e), 0.45)
    .getHex();
  /**
   * Where they stand is arithmetic, not taste. A conduit three units in front
   * of the lens has to be 1.6 units off the axis to graze the frame edge, which
   * puts it on top of the party; back at z = -5 the frame is 7.8 units wide
   * either side, so a conduit at ±7.7 is cut by the edge *and* is out in the
   * room where the key can rake it and the lamps can hang off it. The first
   * pass had them at ±9 and three units ahead of the camera, where they were
   * simply outside the frustum and drew nothing at all.
   */
  for (const [x, z, r, h] of [
    [-7.9, -5.0, 0.58, 11],
    [8.5, -6.2, 0.62, 12],
  ] as Array<[number, number, number, number]>) {
    const conduit = makePillar({ height: h, radius: r, taper: 0.94, sides: 10, color: steel });
    conduit.position.set(x, 0, z);
    group.add(conduit);
    props.push(conduit);
  }

  /**
   * **There are deliberately no other props out on the deck.**
   *
   * A first pass scattered five low plate stacks around the pit's rim to break
   * up the middle distance. Every one of them failed the same way: a wide, low,
   * capped cylinder seen from a battle rig is a *disc*, its dark top face reads
   * against the dark deck as a hole rather than as a mass, and five of them
   * hovering at head height behind the party looked like flying debris. The
   * painting already supplies every piece of machinery this chamber needs; what
   * the 3D layer owes it is a floor, a light and some air, and nothing else.
   */

  // ------------------------------------------------------------- light pools
  /**
   * A faint additive pool under each standing spot — the single cheapest trick
   * that stops a cut-out figure reading as a sticker on a painting. The party
   * take the deck's own bounce; the boss pool is the bible's **possession
   * violet**, which is also the only violet anywhere in the frame.
   */
  const pools: Mesh[] = PARTY_SLOTS.slice(0, 3).map((s) => {
    const pool = makeLightPool({ color: backdrop.palette.bounce, radius: 1.55, opacity: 0.3 });
    pool.position.set(s[0]!, 0.02, s[2]!);
    return pool;
  });
  const bossPool = makeLightPool({ color: 0xb048f0, radius: 2.3, opacity: 0.24 });
  bossPool.position.set(ENEMY_SLOTS[0]![0], 0.018, ENEMY_SLOTS[0]![2]);
  bossPool.name = 'enemy-pool';
  pools.push(bossPool);
  /**
   * The boss's reflection: the same violet, stretched **along the line of
   * sight** instead of pooled around its feet.
   *
   * Polished plate does not put a disc under a light, it puts a smear running
   * away from the viewer, and that smear is the one thing in the frame that
   * proves the deck is a reflective surface rather than a painted one. It is
   * kept dimmer and longer than the pool it sits on, and it reaches toward the
   * camera rather than away, because that is the half of the reflection a
   * viewer standing where this camera stands could actually see.
   */
  const bossSmear = makeLightPool({
    color: 0x9a3ad8,
    radius: 1.7,
    opacity: 0.17,
    squash: 2.7,
  });
  bossSmear.position.set(ENEMY_SLOTS[0]![0], 0.016, ENEMY_SLOTS[0]![2] + 2.6);
  bossSmear.name = 'enemy-reflection';
  pools.push(bossSmear);
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
        lights.key.color.set(
          new Color(normaliseLuma(backdrop.palette.key, 0.74)).lerp(new Color(0x6ed2ee), 0.62),
        );
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

      // Lamps. The product of two sines at incommensurate rates never repeats
      // on any audible period, so a "flickering" lamp never becomes a blinking
      // one; the steady lamp still breathes a few percent, because a perfectly
      // constant light in a frame where three others move reads as dead.
      for (const p of practicals) {
        const noise =
          0.86 +
          0.14 * Math.sin(clock * p.rateA) * Math.sin(clock * p.rateB) * (0.25 + p.jitter * 0.75);
        const dip = p.jitter > 0 && Math.sin(clock * p.rateA * 0.19) > 0.985 ? 0.45 : 1;
        const v = p.base * noise * dip;
        p.light.intensity = v;
        (p.bulb.material as MeshBasicMaterial).opacity = 0.62 + (v / p.base) * 0.28;
      }

      // Shafts: a slow yaw, plus a breath on the brightness so the sweep is not
      // a mechanism running at a constant rate.
      for (const b of beams) {
        b.yaw.rotation.y += b.speed * dt;
        const breath = 0.8 + 0.2 * Math.sin(clock * 0.23 + b.phase);
        for (const q of b.quads) (q.material as MeshBasicMaterial).opacity = b.opacity * breath;
      }

      // Distant machinery, breathing out of phase with itself.
      for (const g of machineGlows) {
        const v = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(clock * g.rate + g.phase));
        (g.mesh.material as MeshBasicMaterial).opacity = g.base * v;
      }

      // The reflected light crawls along the plate as the shafts turn, and the
      // boss pool breathes so the bloom always has something living in it.
      reflectTex.offset.y = Math.sin(clock * 0.05) * 0.015;
      reflectMat.opacity = 0.72 + Math.sin(clock * 0.31) * 0.08;
      (bossPool.material as { opacity: number }).opacity = 0.2 + Math.sin(clock * 0.85) * 0.06;
    },
    dispose(): void {
      watcher?.stop();
      for (const p of particles) p.dispose();
      for (const m of [...pools, ...props, deck, reflections]) {
        m.geometry.dispose();
        (m.material as Material).dispose();
      }
      for (const p of practicals) {
        p.light.dispose();
        (p.bulb.material as Material).dispose();
        p.bulb.geometry.dispose();
      }
      for (const m of beamMats) m.dispose();
      for (const g of beamGeoCache) g.dispose();
      for (const g of machineGlows) (g.mesh.material as Material).dispose();
      for (const g of glowGeoCache) g.dispose();
      deckTex.dispose();
      deckFade.dispose();
      reflectTex.dispose();
      beamTex.dispose();
      glowTex.dispose();
      lights.dispose();
      backdrop.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
  return build;
};

export default buildBevelleUndergroundScene;
