import {
  AdditiveBlending,
  BackSide,
  ClampToEdgeWrapping,
  Color,
  CylinderGeometry,
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
 * fastest way to make a painted scene look like a sticker sheet.
 *
 * **Re-measured for the X-2 party.** The first pass zig-zagged (front at
 * x -1.5, middle swung out to -2.9, back back in to -1.0), which is the FFX
 * arc and is wrong for the one camera this scene actually fights at: `action`
 * swings right, so a slot at x -2.9 projected to **screen x 101 of 1600** —
 * a figure ~170px wide with her centre 101px from the edge — while the front
 * slot landed at 317 and the two overlapped at every rig between. Measured at
 * `idle`/`action`/`party` (`stage.project`, 1600x900), these three read as
 * three:
 *
 * | slot | idle | action | party |
 * |------|------|--------|-------|
 * | 0 front-left | 381 | 203 | 406 |
 * | 1 middle     | 565 | 415 | 643 |
 * | 2 back-right | 710 | 577 | 822 |
 *
 * Separations stay above ~145px against silhouettes ~170px wide at the front
 * slot and ~125px at the back one, so the three touch at most at the shoulder
 * — a formation, not a pile. Depth still falls away left-to-right, so the row
 * reads front to back the way the FFX scenes do.
 *
 * Slot order is the party build's `members` order (`src/battle/ffx2/setup.ts`
 * numbers them 0,1,2 in that order), i.e. Yuna, Rikku, Paine — left to right,
 * matching `docs/screenshots/mockups/A-ffx2-battle.jpg`.
 */
const PARTY_SLOTS: Array<[number, number, number]> = [
  [-2.05, 0, 1.45], // front-left  (Yuna)
  [-1.3, 0, 0.1], // middle, stepped right and back (Rikku)
  [-0.45, 0, -1.35], // back-right, furthest from camera (Paine)
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

/**
 * **The torn floor hole** — visual bible §2.4, key set piece 1 and the thing
 * the bible calls "the signature look": Vegnagun's exit wound, venting cyan
 * light up out of the pit.
 *
 * Two decisions about *where*, and they are the whole difference between a set
 * piece and a lens flare on the floor:
 *
 * 1. **Behind the boss, not under it.** The bible frames Bahamut "over the
 *    hole", which is right for a modelled dragon lit from below and wrong for a
 *    painted cut-out, whose lighting is baked and cannot be relit from
 *    underneath. Put the vent *behind* him instead and the same light does the
 *    same job by a route that works on a flat plane: it throws a cyan ground
 *    and a rising shaft **behind** a near-black silhouette, which is what
 *    actually separates the boss from a dark chamber. He hovers a metre in
 *    front of its near rim.
 * 2. **Clear of every enemy slot.** An ellipse rather than a circle, wide in x
 *    and shallow in z, so it fills the dead middle-right of the frame without
 *    swallowing the two flanking part-slots — a boss part standing in a hole
 *    is the sort of thing nobody notices until the fight ships.
 */
const HOLE = { x: 3.4, z: -7.2, rx: 3.4, rz: 2.2 } as const;

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

      /**
       * Panel seam — half the weight it started at, and two texels instead of
       * three.
       *
       * At 0.85 alpha and three texels this was a near-black line, and a plate
       * deck's seams run *along* the view axis, so each one projects to a hard
       * vertical stripe converging on the vanishing point. One of them landing
       * near the middle of the frame does not read as plating at all; it reads
       * as a rendering seam splitting the floor in two. Halved, it still tells
       * the eye where one casting ends and the next begins and no longer draws
       * a line down the picture.
       */
      ctx.strokeStyle = 'rgba(8,11,18,0.42)';
      ctx.lineWidth = 2;
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
 * the camera** and given a wide opaque core. The far edge then lands on the
 * painting's dark gantry wall, which is the one band in the image a dissolve
 * can hide in.
 *
 * **The canvas's y axis is world z, increasing away from the far edge**: the
 * row at `y / size = (z + 28) / 46`, the same mapping the hole punch at the
 * bottom of this function is written in and verified against. Canvas *top* is
 * therefore the far end of the deck, not the near one. Reading it the other way
 * round is what put the opaque core twelve metres up-chamber, left the plate
 * about half transparent under the party's own feet, and let the painting's lit
 * floor band — and the hard vertical wall corner that band ends on — show
 * through the floor in the lower third of the frame.
 */
function deckFadeCanvas(size = 512): HTMLCanvasElement {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  /**
   * The falloff is an **ellipse centred just behind the party**, not a circle
   * centred half the chamber away.
   *
   * Canvas y is world z through the same mapping the hole punch below uses —
   * `y / size = (z + 28) / 46` — so a centre at `0.62` is z = +0.5, a metre
   * behind the front rank. The first pass centred it at `0.34`, which is
   * z = -12.4: twelve metres *up-chamber*, so the plate was only about half
   * opaque under the party's own feet and the painting's lit floor band showed
   * straight through it. That band ends on a painted wall corner, and a wall
   * corner seen through a floor is a hard vertical line down the lower third of
   * the frame — the one seam this scene had.
   *
   * It is stretched 1.55x in z because the deck has to do two different jobs on
   * its two axes: reach far enough up-chamber to dissolve into the painted
   * gantry wall rather than ending in mid-air, and fall off well inside its own
   * 46-unit width so the plane's left and right edges never reach a frame.
   */
  const cy = size * 0.62;
  const zStretch = 1.55;
  ctx.save();
  ctx.translate(size * 0.5, cy);
  ctx.scale(1, zStretch);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.42);
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
  ctx.fillRect(-size * 0.5, -cy / zStretch, size, size / zStretch);
  ctx.restore();

  /**
   * And then punch {@link HOLE} clean out of it.
   *
   * The deck plane is 46 x 46 centred at `(0, 0, -5)` and rotated flat, so u is
   * world x over `[-23, 23]` and v runs **toward** the camera: v = 0 is the near
   * edge at z = +18. The hole is written in those coordinates rather than as a
   * second mesh because an alpha cut-out is the only way to get a hole with no
   * z-fighting rim and no second surface for the specular lobe to catch.
   *
   * **Canvas y is not v.** `CanvasTexture` leaves `flipY` on, so v = 0 is the
   * canvas's *bottom* row and the mapping needs the extra inversion below —
   * `(HOLE.z + 28) / 46` rather than the `(18 - HOLE.z) / 46` that the world
   * maths hands you. Getting this wrong does not throw and does not look
   * broken: it mirrors the cut about z = -5, so the plate opens up five metres
   * nearer the camera than the rim and the shaft that are supposed to be
   * standing in it, and the frame quietly shows painted wall through the floor.
   *
   * The edge is feathered by about a texel and a half and no more. Torn plate
   * ends where it ends; a soft vignette around a hole reads as a stain.
   */
  const hx = ((HOLE.x + 23) / 46) * size;
  const hy = ((HOLE.z + 28) / 46) * size;
  const hrx = (HOLE.rx / 46) * size;
  const hry = (HOLE.rz / 46) * size;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.scale(hrx, hry);
  const punch = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  punch.addColorStop(0, 'rgba(0,0,0,1)');
  punch.addColorStop(0.9, 'rgba(0,0,0,1)');
  punch.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = punch;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

/**
 * The bent plate teeth around the torn hole's rim, plus the lit lip.
 *
 * Drawn as an **annulus with a jagged inner boundary** — an outer circle and a
 * torn polygon filled even-odd — so one transparent quad laid over the deck
 * both dirties the plate around the wound and draws the teeth. Two things make
 * it read as torn steel rather than as a decal:
 *
 * - the teeth **alternate long and short** on top of their jitter. Pure noise
 *   on a radius gives a scalloped edge, which is what erosion looks like; plate
 *   torn by something forcing its way through comes away in uneven tongues.
 * - the inner boundary is stroked **twice**, a tight near-white line inside a
 *   wide soft cyan one. That is the light coming up the shaft catching the
 *   upturned lip of every tooth, and it is the single cue that says the hole
 *   has something bright down it rather than being a dark patch on the floor.
 */
function holeRimCanvas(size = 512, seed = 23): HTMLCanvasElement {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  const rand = rng(seed);
  const cx = size / 2;
  const cy = size / 2;

  /**
   * The teeth are spaced **irregularly in angle**, not just jittered in radius.
   *
   * A fixed angular step with a random radius gives every tooth the same width,
   * and forty of those around an ellipse read unmistakably as a doily — the
   * eye picks up the period long before it picks up the noise. Letting the step
   * itself vary between a third and twice its mean is what turns the same
   * jitter into plate that came away in tongues of different sizes.
   */
  const pts: Array<[number, number]> = [];
  const step = (Math.PI * 2) / 34;
  for (let a = 0; a < Math.PI * 2; a += step * (0.45 + rand() * 1.5)) {
    const r = size * (0.29 + rand() * 0.075);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  const tracePolygon = (): void => {
    ctx.moveTo(pts[0]![0], pts[0]![1]);
    for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
    ctx.closePath();
  };

  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
  tracePolygon();
  const g = ctx.createRadialGradient(cx, cy, size * 0.26, cx, cy, size * 0.5);
  /**
   * The stain hugs the teeth and is gone within about a tooth's length of them.
   * Run it further out and, from a low rig where the deck is nearly edge-on, the
   * ring stops reading as dirt around a hole and starts reading as the *edge of
   * a raised platform* the boss is standing on — the annulus is wide enough on
   * screen to be mistaken for a face rather than a mark.
   */
  g.addColorStop(0, 'rgba(23,30,44,0.95)');
  g.addColorStop(0.33, 'rgba(20,27,40,0.55)');
  g.addColorStop(0.46, 'rgba(18,24,36,0.12)');
  g.addColorStop(0.58, 'rgba(18,24,36,0)');
  g.addColorStop(1, 'rgba(18,24,36,0)');
  ctx.fillStyle = g;
  ctx.fill('evenodd');

  /**
   * The lit lip, stroked **segment by segment at varying brightness**.
   *
   * One continuous stroke around the torn edge is a neon outline, and a neon
   * outline is the single thing that would make this read as a UI decal rather
   * than as steel. Light coming up a shaft catches the teeth that happen to be
   * bent toward it and misses the ones that are not, so each segment gets its
   * own weight and roughly one in six gets almost none.
   */
  ctx.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    const wide = pass === 0;
    ctx.lineWidth = size * (wide ? 0.016 : 0.005);
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[i]!;
      const p1 = pts[(i + 1) % pts.length]!;
      const lit = Math.max(0, rand() * 1.18 - 0.18);
      ctx.strokeStyle = wide
        ? `rgba(94,200,232,${(0.34 * lit).toFixed(3)})`
        : `rgba(200,242,255,${(0.82 * lit).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.stroke();
    }
  }
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

  /**
   * One smear, shaped as a **raised cosine** rather than as a triangle.
   *
   * The three-stop gradient this started as (0 -> peak at 0.5 -> 0) is linear
   * on both sides of its peak, so its slope flips sign in a single texel. On a
   * deck seen at a grazing angle that midpoint stretches across a third of the
   * frame and the eye reads the slope change as a **hard vertical line down the
   * middle of the floor** — the one seam this scene had, and it sat at screen
   * x 800 of 1600 because the brightest smear is centred on the camera's own
   * axis. Sampling cos gives a profile whose first derivative is continuous, so
   * there is no crease anywhere to read.
   */
  const smear = (u: number, w: number, colour: string, alpha: number): void => {
    const g = ctx.createLinearGradient((u - w) * size, 0, (u + w) * size, 0);
    const STEPS = 16;
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const shape = 0.5 - 0.5 * Math.cos(t * Math.PI * 2);
      g.addColorStop(t, colour.replace('ALPHA', (alpha * shape).toFixed(4)));
    }
    ctx.fillStyle = g;
    ctx.fillRect((u - w) * size, 0, w * 2 * size, size);
  };

  const rust = 'rgba(224,116,46,ALPHA)';
  const teal = 'rgba(110,210,238,ALPHA)';
  ctx.globalCompositeOperation = 'lighter';
  smear(0.13, 0.07, rust, 0.6);
  smear(0.26, 0.04, rust, 0.3);
  /**
   * The cool core is deliberately the *weakest* smear, not the strongest.
   *
   * It lies on the camera's own axis, so whatever brightness it is given lands
   * in the bottom-centre of every rig — the part of the deck nearest the lens,
   * where the plate is already carrying the phong lobe and the grazing-angle
   * specular. A first pass ran it at 0.5 and the three effects summed into a
   * bright wedge across the bottom seventh of the frame that read as a *lit
   * ramp* leading up to the boss: high-contrast, in focus, and pulling the eye
   * straight off the characters. Half the alpha, and it goes back to being what
   * it is, the vault's light lying on wet-looking plate.
   */
  smear(0.5, 0.13, teal, 0.26);
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

/**
 * A **Yevon-glyph stone insert**, the bible's key set piece 3: proof that
 * Bevelle built its holy city on top of a war machine, laid into the deck
 * plating as a disc of white stone.
 *
 * It is here for a compositional reason as much as a narrative one. From the
 * `idle` rig the lower right quarter of the frame is bare plate — the party are
 * left, the boss is centre-right and well back, and nothing at all happens in
 * between. Two of these, breathing very slowly in the light coming out of the
 * vent, give that quarter something to be without putting an object in the
 * fighters' way or a silhouette anywhere near the boss's read.
 *
 * Drawn in white on transparent: the material tints it, so the same canvas can
 * be the cool stone of one insert and the vent-lit one of the other.
 */
function yevonGlyphCanvas(size = 512): HTMLCanvasElement {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  const cx = size / 2;
  const r = size * 0.44;

  // The stone disc itself: a soft field, so the insert reads as a *material*
  // set into the plate rather than as a line drawing lying on it.
  const bed = ctx.createRadialGradient(cx, cx, r * 0.1, cx, cx, r);
  bed.addColorStop(0, 'rgba(255,255,255,0.62)');
  bed.addColorStop(0.72, 'rgba(255,255,255,0.46)');
  bed.addColorStop(0.95, 'rgba(255,255,255,0.14)');
  bed.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = bed;
  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  ctx.fill();

  /**
   * The engraving is kept **below** the stone it is cut into.
   *
   * A first pass drew the lines at 0.85 over a faint bed and the insert came
   * out as a bright hard-edged ring on a dark deck — which is not a slab of
   * masonry, it is a summoning circle, and the frame already has a boss to
   * carry that kind of signal. Strong bed, weak line: the eye reads the disc
   * first as a lighter *material*, and the glyph only afterwards.
   */
  ctx.strokeStyle = 'rgba(255,255,255,0.42)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Two concentric rings.
  for (const [rr, lw] of [
    [r * 0.94, size * 0.012],
    [r * 0.6, size * 0.008],
  ] as Array<[number, number]>) {
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(cx, cx, rr, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Four teardrop lobes on the cardinals — the shape Yevon's seal is built out
  // of — and a hairline spoke between each pair.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const ox = cx + Math.cos(a) * r * 0.77;
    const oy = cx + Math.sin(a) * r * 0.77;
    ctx.lineWidth = size * 0.01;
    ctx.beginPath();
    ctx.ellipse(ox, oy, r * 0.17, r * 0.1, a, 0, Math.PI * 2);
    ctx.stroke();

    const b = a + Math.PI / 4;
    ctx.lineWidth = size * 0.005;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(b) * r * 0.6, cx + Math.sin(b) * r * 0.6);
    ctx.lineTo(cx + Math.cos(b) * r * 0.94, cx + Math.sin(b) * r * 0.94);
    ctx.stroke();
  }

  // The centre: a diamond inside a small ring.
  ctx.lineWidth = size * 0.009;
  ctx.beginPath();
  ctx.arc(cx, cx, r * 0.26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const px = cx + Math.cos(a) * r * 0.17;
    const py = cx + Math.sin(a) * r * 0.17;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  return c;
}

/**
 * The skin of a foreground conduit.
 *
 * The first pass ran the conduits bare, on a flat Lambert colour, and from the
 * low `bahamut` rig — where one of them is three metres off the lens and fills
 * a tenth of the frame — an untextured ten-sided cylinder is not a pipe. It is
 * a grey rectangle laid over the painting, and because it is *lighter* than the
 * chamber behind it, it reads as a fog artefact rather than as a near object.
 *
 * So the canvas carries the three things that make a close pipe a pipe:
 *
 *  - **flutes** — vertical light/dark stripes. The texture wraps around the
 *    cylinder, so stripes in x become the specular banding that tells the eye
 *    the surface is round rather than flat;
 *  - **collars** — a rivetted band every quarter of the tile, which gives the
 *    silhouette a length and a scale to be read against;
 *  - **rust weeping down from each collar**, which is the only warm thing on
 *    the object and ties it to the chamber's lamp banks.
 *
 * It is drawn dark on purpose. A foreground bracket belongs *below* the value
 * of everything it brackets; the rig's rim is what will pick its near edge out.
 */
function conduitCanvas(w = 256, h = 512, seed = 77): HTMLCanvasElement {
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d')!;
  const rand = rng(seed);

  ctx.fillStyle = '#2c3546';
  ctx.fillRect(0, 0, w, h);

  // Flutes. Sixteen around the pipe, their contrast varied so the banding is
  // not a perfect comb (a perfect comb aliases into moiré as the camera moves).
  const flutes = 16;
  for (let i = 0; i < flutes; i++) {
    const x = (i / flutes) * w;
    const fw = w / flutes;
    const g = ctx.createLinearGradient(x, 0, x + fw, 0);
    const lift = 0.1 + rand() * 0.14;
    g.addColorStop(0, 'rgba(6,9,15,0.55)');
    g.addColorStop(0.45, `rgba(150,168,194,${lift.toFixed(3)})`);
    g.addColorStop(1, 'rgba(6,9,15,0.5)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, fw, h);
  }

  // Collars, with a rivet row on each and a cast shadow under it.
  const collars = 4;
  for (let i = 0; i < collars; i++) {
    const y = ((i + 0.5) / collars) * h;
    const ch = h * 0.045;
    ctx.fillStyle = 'rgba(122,140,166,0.34)';
    ctx.fillRect(0, y - ch * 0.5, w, ch);
    ctx.fillStyle = 'rgba(4,6,11,0.66)';
    ctx.fillRect(0, y + ch * 0.5, w, ch * 0.42);
    ctx.fillStyle = 'rgba(178,196,220,0.2)';
    ctx.fillRect(0, y - ch * 0.5, w, 2);
    for (let r = 0; r < 18; r++) {
      const rx = ((r + 0.5) / 18) * w;
      ctx.fillStyle = 'rgba(198,214,236,0.4)';
      ctx.beginPath();
      ctx.arc(rx, y, 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(6,9,15,0.55)';
      ctx.beginPath();
      ctx.arc(rx + 0.9, y + 1, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rust weeping down from the collar.
    for (let s = 0; s < 9; s++) {
      const sx = rand() * w;
      const sl = h * (0.04 + rand() * 0.11);
      const g = ctx.createLinearGradient(0, y, 0, y + sl);
      g.addColorStop(0, 'rgba(154,76,32,0.42)');
      g.addColorStop(1, 'rgba(154,76,32,0)');
      ctx.fillStyle = g;
      ctx.fillRect(sx, y, 1 + rand() * 3.5, sl);
    }
  }

  // Blotchy corrosion, to break the repeat up.
  for (let i = 0; i < 40; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = w * (0.03 + rand() * 0.1);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rand() > 0.5 ? 'rgba(8,11,18,0.44)' : 'rgba(120,62,30,0.2)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
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

/**
 * One rotating shaft: the yaw group, its two crossed quads, its rate, and the
 * per-quad grazing-angle weights the update loop recomputes each frame (kept on
 * the struct so the loop allocates nothing).
 */
interface Beam {
  /** Per-quad "how squarely does this face the lens" weight, 0..1. */
  facing: number[];
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
  /**
   * 3.25, not 3 — and the quarter matters more than the three.
   *
   * The canvas paints a 4x4 grid of castings, so a repeat of `r` puts a panel
   * seam wherever `u * 4` is a whole number. The plane is symmetric about the
   * camera's own axis, so `u(x = 0) = r / 2`, and **any whole or half repeat
   * puts a seam exactly on that axis** — a dark line straight down the middle
   * of every frame, converging on the vanishing point, which is the one place
   * on a floor the eye will not accept a line. At 3.25 the axis falls halfway
   * between two seams and the nearest pair land about 1.8 units out, where
   * they read as what they are: plating running away from the lens.
   */
  deckTex.repeat.set(3.25, 3.25);
  const deckFade = paintedCanvasTexture(deckFadeCanvas(512));
  deckFade.colorSpace = NoColorSpace;
  deckFade.wrapS = deckFade.wrapT = ClampToEdgeWrapping;
  const deckMat = new MeshPhongMaterial({
    map: deckTex,
    color: new Color(normaliseLuma(backdrop.palette.ground, 0.56)).lerp(new Color(0x4e6280), 0.3),
    specular: new Color(normaliseLuma(backdrop.palette.key, 0.62)).lerp(new Color(0xcfeef8), 0.55),
    /**
     * Low, and on purpose. A tight lobe on a plane this large puts its whole
     * highlight in the few metres of deck directly under the lens, because that
     * is where the reflection vector lines up; widening the lobe spreads the
     * same energy back down the chamber, which is what "subtle reflections"
     * actually looks like on plate.
     */
    shininess: 14,
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
    opacity: 0.6,
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
  /**
   * The point the grazing-angle fade is solved against. Every rig in this
   * scene sits within a couple of units of the reference camera and none of
   * them pans, so the idle position is close enough for a weighting term and
   * costs nothing to keep — a scene cannot see the live camera through
   * {@link SceneBuild.update}, which takes only `dt`.
   */
  const BEAM_VIEW_POINT = new Vector3(cameraRef[0], cameraRef[1], cameraRef[2]);
  const beamNormal = new Vector3();
  const beamToCam = new Vector3();
  const beamTex = paintedCanvasTexture(beamCanvas(0.42));
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
    [-6.7, -10.4, 5.2, 13, 8.6, 0.14, 0x8fdcf0, 0.075, 0.32],
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
    beams.push({ yaw, quads, speed, phase: beams.length * 2.1, opacity, facing: quads.map(() => 1) });
  }

  // ------------------------------------------------------ the torn floor hole
  /**
   * Four pieces, in the order the eye reads them.
   *
   * The deck's alpha already has the hole cut out of it (see
   * {@link deckFadeCanvas}), so what shows through the gap is the flat
   * near-black `background` — a pit with nothing in it. These four put the
   * light back:
   *
   * 1. **The vent** — a cyan disc lying in the gap, the light itself.
   * 2. **The rim** — bent plate teeth with a lit lip, laid over the deck.
   * 3. **The shaft** — the same crossed-quad trick the ceiling beams use, but
   *    inverted, so the bright end is at the floor and it dies out overhead.
   * 4. **A real point light** just above the gap, which is what actually puts a
   *    cyan gradient on the deck plate and up the near conduit, and is why the
   *    hole lights the room instead of merely being bright.
   */
  /**
   * **The pit itself**, and the reason it has to exist.
   *
   * Cutting the deck's alpha does not make a hole, it makes a *window* — and
   * what is behind the deck is the matte painting, forty-five units back and
   * two storeys up. The first pass of this read exactly like that: a cyan pool
   * with a piece of lit gantry wall lying inside it, seen through the floor.
   *
   * So the gap gets an inside: an open-ended cylinder, `BackSide` so the camera
   * sees its far wall, scaled to the same ellipse and hung deep enough that no
   * rig can look past its bottom. It is unlit `MeshBasicMaterial` on purpose —
   * the shaft wall is the one surface in the scene that should stay flatly,
   * unreadably black, because that is what makes the light climbing out of it
   * look like it is coming from somewhere much further down.
   *
   * Its `renderOrder` is the load-bearing detail. The deck is `depthWrite:
   * false` (it is a transparent plane), so anything drawn *after* it ignores it
   * and paints straight over the plate. The pit is therefore drawn **before**
   * the deck, at -58, and the deck then blends over it — solid where the plate
   * is solid, absent where the alpha is cut.
   */
  const holePitGeo = new CylinderGeometry(1, 0.86, 11, 40, 1, true);
  const holePitMat = new MeshBasicMaterial({ color: 0x0a1220, side: BackSide, fog: false });
  const holePit = new Mesh(holePitGeo, holePitMat);
  holePit.scale.set(HOLE.rx, 1, HOLE.rz);
  holePit.position.set(HOLE.x, -5.5, HOLE.z);
  holePit.renderOrder = -58;
  holePit.name = 'hole-pit';
  group.add(holePit);

  const holeGlowTex = paintedCanvasTexture(
    radialCanvas(256, [
      [0, 1],
      [0.28, 0.9],
      [0.58, 0.5],
      [0.84, 0.13],
      [1, 0],
    ]),
  );
  const holeVentMat = new MeshBasicMaterial({
    map: holeGlowTex,
    color: 0x9eeaff,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: false,
  });
  /**
   * The vent sits **inside** the mouth, not across it. A glow disc flush with
   * the deck fills the aperture edge to edge and the hole goes back to being a
   * bright decal on a floor; dropped a metre down the shaft it is occluded by
   * the near lip at every rig, which is what makes the light read as coming
   * from below rather than lying on top.
   */
  const holeVent = new Mesh(new PlaneGeometry(HOLE.rx * 1.9, HOLE.rz * 1.9), holeVentMat);
  holeVent.rotation.x = -Math.PI / 2;
  /**
   * A metre down was a third of a metre too far. At -1.05 the near lip hid the
   * disc from every rig at once and the set piece came out as a flat dark
   * ellipse with a wire outline round it — the hole read as a *shape cut in the
   * floor*, not as a hole with light in it. At -0.72 the far half of the disc
   * clears the lip from a standing rig while the near half stays occluded,
   * which is the asymmetry that makes an aperture look deep.
   */
  holeVent.position.set(HOLE.x, -0.72, HOLE.z);
  /**
   * Drawn **before** the deck, for the same reason the pit is: the deck writes
   * no depth, so a glow with a later `renderOrder` ignores the plate entirely
   * and lands on the floor as a lit puddle hanging a couple of metres in front
   * of the hole it is supposed to be inside. At -55 the plate blends over it,
   * and the only part that reaches the frame is the part framed by the cut.
   */
  holeVent.renderOrder = -55;
  holeVent.name = 'hole-vent';
  group.add(holeVent);

  /**
   * The rim quad is sized from the canvas, not by eye: the torn boundary is
   * drawn at a mean radius of 0.328 of the canvas — 0.655 of its half-width — so
   * a quad `2 * rx / 0.63` wide lands those teeth exactly on the alpha cut in
   * the deck below. Get this wrong in either direction and the hole either
   * wears a ring of plate floating inside it or shows a bare alpha edge.
   */
  const holeRimTex = paintedCanvasTexture(holeRimCanvas(512, 23));
  holeRimTex.wrapS = holeRimTex.wrapT = ClampToEdgeWrapping;
  const holeRimMat = new MeshBasicMaterial({
    map: holeRimTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.95,
    fog: false,
  });
  const holeRim = new Mesh(
    new PlaneGeometry((HOLE.rx * 2) / 0.655, (HOLE.rz * 2) / 0.655),
    holeRimMat,
  );
  holeRim.rotation.x = -Math.PI / 2;
  holeRim.position.set(HOLE.x, 0.022, HOLE.z);
  holeRim.renderOrder = -47;
  holeRim.name = 'hole-rim';
  group.add(holeRim);

  /**
   * The shaft. `beamTex` runs bright-to-dim down its own v, so the quads are
   * mirrored in y (`scale.y = -1`, safe here because the material is
   * `DoubleSide`) to stand it on its head: brightest where it leaves the floor,
   * gone before the vault. It does not rotate — the ceiling beams sweep because
   * something up there is turning, and a hole in the floor is not.
   */
  const holeShaftMats: MeshBasicMaterial[] = [];
  const holeShaftGeo = new PlaneGeometry(HOLE.rx * 1.6, 12);
  for (let i = 0; i < 2; i++) {
    const mat = new MeshBasicMaterial({
      map: beamTex,
      color: 0x8fe6fa,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      fog: false,
    });
    holeShaftMats.push(mat);
    const quad = new Mesh(holeShaftGeo, mat);
    quad.scale.y = -1;
    quad.position.set(HOLE.x, 6.0, HOLE.z);
    quad.rotation.y = i * Math.PI * 0.5;
    quad.renderOrder = -19;
    quad.name = 'hole-shaft';
    group.add(quad);
  }

  const holeLight = new PointLight(0x6ed2ee, low ? 5.0 : 6.2, 26, 2);
  holeLight.position.set(HOLE.x, 0.85, HOLE.z);
  holeLight.name = 'hole-uplight';
  group.add(holeLight);

  // ------------------------------------------------------ Yevon stone inserts
  /**
   * Two glyph inserts laid into the plate, one either side of the fight.
   *
   * Both are normal-blended rather than additive: an additive glyph on a dark
   * deck is a *neon sign*, and these are meant to be pale stone catching the
   * room's light. The right-hand one is larger, closer to the lens and tinted
   * toward the vent's cyan because it lies in the vent's throw; the left-hand
   * one is smaller, further back and warmer, because the lamp bank is what
   * reaches it.
   */
  const glyphTex = paintedCanvasTexture(yevonGlyphCanvas(512));
  glyphTex.wrapS = glyphTex.wrapT = ClampToEdgeWrapping;
  const glyphs: Array<{ mesh: Mesh; base: number; rate: number; phase: number }> = [];
  /**
   * Both placements are solved against the `idle` rig rather than eyeballed —
   * the first pass put them at x ±6 and both came out bisected by a frame edge,
   * which is the one place a circle must not land. Projected through `idle`
   * (pos [0,3,9.6], fov 32, 16:9) the near insert centres at about 70% of the
   * frame's width and 80% of its height — the empty plate between the party and
   * the pit — and the far one at about 13% / 58%, in the dark back-left corner
   * the lamp bank half reaches. Both sit a comfortable margin inside the edges
   * at every other rig too, `bahamut`'s low swing included.
   */
  for (const [x, z, r, colour, base, rate] of [
    [2.2, 0.2, 1.5, 0xa8d6e8, 0.16, 0.19],
    [-6.0, -6.85, 1.7, 0xc2a888, 0.13, 0.13],
  ] as Array<[number, number, number, number, number, number]>) {
    const mesh = new Mesh(
      new PlaneGeometry(r * 2, r * 2),
      new MeshBasicMaterial({
        map: glyphTex,
        color: colour,
        transparent: true,
        opacity: base,
        depthWrite: false,
        fog: false,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.024, z);
    /**
     * After the deck (-50) and the reflection sheet (-49) so the plate does not
     * paint over it, but before the hole rim (-47), which must stay the
     * brightest thing lying on the floor.
     */
    mesh.renderOrder = -48;
    mesh.name = 'yevon-insert';
    group.add(mesh);
    glyphs.push({ mesh, base, rate, phase: glyphs.length * 2.3 });
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

  /**
   * **Dust in the up-shaft** (visual bible §2.4). The bible asks for sixty
   * motes and sixty is what it gets — this is the one field in the scene that
   * must not be a haze, because its job is to make the column of light
   * *visible* as a column. Sparse, fast and rising hard, so each mote traces the
   * shaft rather than filling it, and cold, because it is lit by the vent and
   * nothing else.
   */
  const holeDust = new ParticleField({
    count: Math.round(60 * k),
    bounds: { x: HOLE.rx, y: 4.6, z: HOLE.rz },
    colors: [0xc8f2ff, 0x5ec8e8, 0xdff4ff],
    size: 7,
    sizeJitter: 0.7,
    drift: [0.02, 0.86, 0],
    wobble: [0.28, 0.1, 0.22],
    wobbleSpeed: 0.55,
    twinkle: 0.7,
    opacity: 0.5,
    additive: true,
    hardness: 0.4,
  });
  holeDust.position.set(HOLE.x, 2.6, HOLE.z);

  const particles = [dustFar, dustMid, dustNear, sparksLeft, sparksRight, steam, holeDust];
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
  /**
   * Darker than the first pass by a third.
   *
   * A foreground bracket is read as a *silhouette*, and the value it needs is
   * whatever keeps it under the chamber it brackets. At 0.34 luma these sat
   * above the painting's own mid-tones from the low `bahamut` rig and came
   * forward as pale slabs; at 0.21, with the flute texture doing the shaping
   * and the lamp strip picking out the near edge, they go back where a
   * foreground object belongs.
   */
  const steel = new Color(normaliseLuma(backdrop.palette.ground, 0.21))
    .lerp(new Color(0x232f41), 0.5)
    .getHex();
  const conduitTex = paintedCanvasTexture(conduitCanvas(256, 512, 77));
  conduitTex.wrapS = conduitTex.wrapT = RepeatWrapping;
  /** Four collar bands per pipe, which puts one roughly every 4.5 units. */
  conduitTex.repeat.set(1, 3);
  /**
   * Where they stand is arithmetic, not taste. A conduit three units in front
   * of the lens has to be 1.6 units off the axis to graze the frame edge, which
   * puts it on top of the party; back at z = -5 the frame is 7.8 units wide
   * either side, so a conduit at ±7.7 is cut by the edge *and* is out in the
   * room where the key can rake it and the lamps can hang off it. The first
   * pass had them at ±9 and three units ahead of the camera, where they were
   * simply outside the frustum and drew nothing at all.
   */
  const conduitLampMats: MeshBasicMaterial[] = [];
  /**
   * Seventeen and eighteen units, not eleven and twelve.
   *
   * At the shorter heights the `intro` rig — which sits at y 5.5 and sees more
   * of the room than any other — cleared the tops of both, and a capped
   * cylinder ending in mid-air three storeys up is not a conduit running to the
   * vault, it is a post. Both are now tall enough to leave the top of the frame
   * at every rig, and both lose their cap, because the cap is only ever seen
   * when the pipe is failing to run anywhere.
   */
  for (const [x, z, r, h] of [
    [-7.9, -5.0, 0.58, 17],
    [8.9, -6.8, 0.6, 18],
  ] as Array<[number, number, number, number]>) {
    const conduit = makePillar({
      height: h,
      radius: r,
      taper: 0.94,
      /** Sixteen, to match the flute count the texture paints. */
      sides: 16,
      color: steel,
      texture: conduitTex,
      cap: false,
    });
    conduit.position.set(x, 0, z);
    group.add(conduit);
    props.push(conduit);

    /**
     * A strip of rust lamps clamped to the pipe, facing the camera.
     *
     * This is the half of the job the texture cannot do. A Lambert cylinder
     * three metres off the lens is lit by a key twenty metres away, so its near
     * face has almost no gradient to separate it from the chamber; an additive
     * strip of warm bulbs *on* that face gives the silhouette an edge to be
     * read against and, not incidentally, puts the painting's own lamp colour
     * in the corner of the frame where there is otherwise nothing.
     */
    for (let i = 0; i < 3; i++) {
      const lamp = new Mesh(
        /**
         * The quad is twice the pipe's radius, but `glowTex` is a radial
         * falloff, so the *bulb* the eye sees is a fraction of that and the
         * rest is halo. Sized to the bulb instead, the lamp came out at ten
         * pixels from the `intro` rig — a dot, which is not a light.
         */
        new PlaneGeometry(r * 2.1, r * 2.1),
        new MeshBasicMaterial({
          map: glowTex,
          color: 0xffa252,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
          blending: AdditiveBlending,
          fog: false,
        }),
      );
      conduitLampMats.push(lamp.material as MeshBasicMaterial);
      /**
       * Hung at fixed *world* heights rather than as a fraction of the pipe:
       * the frame is what these have to land in, and the frame is 1–7 units off
       * the deck at every battle rig no matter how far the pipe runs past it.
       */
      lamp.position.set(x + (x < 0 ? r * 0.82 : -r * 0.82), 1.9 + i * 2.2, z + r * 0.55);
      lamp.renderOrder = 4;
      lamp.name = 'conduit-lamp';
      group.add(lamp);
      props.push(lamp);
    }
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
  /**
   * The party pools are **offset half a metre behind the slot**, and dimmer
   * than they were.
   *
   * Centred and bright, an additive pool does the opposite of its job: it adds
   * light to the exact patch of deck the figure's own contact shadow is trying
   * to darken, the two cancel, and three characters who each have a shadow
   * nonetheless appear to hover a hand's width off the plate. Pushed back, the
   * pool lights the deck *around and behind* the feet while the shadow keeps
   * the deck *under* them — which is the contrast that plants a cut-out.
   */
  const pools: Mesh[] = PARTY_SLOTS.slice(0, 3).map((s) => {
    const pool = makeLightPool({ color: backdrop.palette.bounce, radius: 1.5, opacity: 0.17 });
    pool.position.set(s[0]!, 0.02, s[2]! - 0.55);
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

      /**
       * Shafts: a slow yaw, a breath on the brightness so the sweep is not a
       * mechanism running at a constant rate, and — the part that matters —
       * a **grazing-angle fade** on each of the two crossed quads.
       *
       * A quad turning edge-on does not disappear; it compresses. Its 36%
       * horizontal feather, five world units wide when the quad faces the
       * lens, squeezes into a fraction of a pixel at ten degrees of incidence,
       * and the soft-edged shaft becomes a hard-edged bright plank standing in
       * the room. Weighting each quad by how squarely it faces the camera
       * retires it before it gets there.
       *
       * The two weights are then renormalised to the pair's old constant sum,
       * so the near-face-on quad simply carries the light its partner gave up
       * and the shaft's brightness does not pulse once per half-turn — which
       * is the whole reason the quads are crossed in the first place.
       */
      for (const b of beams) {
        b.yaw.rotation.y += b.speed * dt;
        const breath = 0.8 + 0.2 * Math.sin(clock * 0.23 + b.phase);
        let sum = 0;
        for (let i = 0; i < b.quads.length; i++) {
          const q = b.quads[i]!;
          q.getWorldDirection(beamNormal);
          q.getWorldPosition(beamToCam);
          beamToCam.subVectors(BEAM_VIEW_POINT, beamToCam).normalize();
          const face = Math.abs(beamNormal.dot(beamToCam));
          // smoothstep(0.08, 0.5), floored so a shaft never blinks out.
          const t = Math.min(1, Math.max(0, (face - 0.08) / 0.42));
          b.facing[i] = 0.18 + 0.82 * t * t * (3 - 2 * t);
          sum += b.facing[i]!;
        }
        const norm = sum > 1e-4 ? b.quads.length / sum : 1;
        for (let i = 0; i < b.quads.length; i++) {
          (b.quads[i]!.material as MeshBasicMaterial).opacity =
            b.opacity * breath * b.facing[i]! * norm;
        }
      }

      /**
       * The conduit lamps share the *room's* flicker rather than owning one:
       * they are driven off the first practical's current output, so when the
       * bad lamp behind the party dips, the bulbs on the pipe in the corner of
       * the frame dip with it and the chamber reads as one failing circuit.
       */
      const circuit = practicals[0] ? practicals[0].light.intensity / practicals[0].base : 1;
      for (const m of conduitLampMats) m.opacity = 0.34 + 0.24 * circuit;

      /**
       * The inserts breathe with the vent rather than on a rate of their own:
       * stone does not pulse, but the light falling on it does, and tying them
       * to the same clock is what says which source is lighting them.
       */
      for (const g of glyphs) {
        (g.mesh.material as MeshBasicMaterial).opacity =
          g.base * (0.82 + 0.18 * Math.sin(clock * g.rate + g.phase));
      }

      // Distant machinery, breathing out of phase with itself.
      for (const g of machineGlows) {
        const v = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(clock * g.rate + g.phase));
        (g.mesh.material as MeshBasicMaterial).opacity = g.base * v;
      }

      // The reflected light crawls along the plate as the shafts turn, and the
      // boss pool breathes so the bloom always has something living in it.
      reflectTex.offset.y = Math.sin(clock * 0.05) * 0.015;
      reflectMat.opacity = 0.55 + Math.sin(clock * 0.31) * 0.07;

      /**
       * The vent breathes, on two rates that do not divide into each other, and
       * the point light breathes **with** it. Letting the glow quad pulse while
       * the real light held steady was the first version, and it looked exactly
       * like what it was: a sprite fading on top of a lit floor.
       */
      const vent = 0.82 + 0.18 * Math.sin(clock * 0.37) + 0.06 * Math.sin(clock * 1.13);
      holeVentMat.opacity = 0.86 * vent;
      holeLight.intensity = (low ? 5.0 : 6.2) * (0.86 + 0.14 * vent);
      for (const m of holeShaftMats) m.opacity = 0.34 * vent;
      (bossPool.material as { opacity: number }).opacity = 0.2 + Math.sin(clock * 0.85) * 0.06;
    },
    dispose(): void {
      watcher?.stop();
      for (const p of particles) p.dispose();
      holeLight.dispose();
      for (const m of holeShaftMats) m.dispose();
      holeShaftGeo.dispose();
      holeGlowTex.dispose();
      holeRimTex.dispose();
      for (const m of [...pools, ...props, deck, reflections, holeVent, holeRim, holePit]) {
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
      for (const g of glyphs) {
        g.mesh.geometry.dispose();
        (g.mesh.material as Material).dispose();
      }
      glyphTex.dispose();
      for (const g of glowGeoCache) g.dispose();
      deckTex.dispose();
      deckFade.dispose();
      conduitTex.dispose();
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
