/**
 * The actor's types: the options it is built from, the pose map and swap options, a pose's shape, and the two plane records the layers share.
 *
 * `PaintedActor` was one 2,700-line class. It is now a chain of classes, one responsibility each, every layer calling only the layers below it:
 * `PaintedActorState` (the fields that start at rest) -> `PaintedActorBase` (the other fields, the constructor) -> `PaintedActorPlacement` ->`PaintedActorSizing` -> `PaintedActorEffects` -> `PaintedActorLife` -> `PaintedActorPoses` -> `PaintedActorReaders` -> `PaintedActor`
 * (import that one from `PaintedActor.ts`). A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 * The constructor calls eight methods that live in later layers; `PaintedActorBase` declares them abstract.
 */

import type { Mesh, MeshDepthMaterial, ShaderMaterial, Vector3, Texture } from 'three';
import type { ActorSide, ArtFacing } from './BattlePresenterActors.ts';
import type { BaselineFitOptions, MatteOptions, PaintedTexture, PoseMeta } from './PaintedArt.ts';
import type { PoseScale } from './PaintedScale.ts';
import type { HeadBox } from './HeadLock.ts'; // D-510: the engine keeps the head steady
import type { SlotTip } from './KoTip.ts'; // FA-2: the KO fall tips the standing plane about its feet (KoFall.ts)

/** One painted pose: a URL now, a texture once it has loaded. */
export type PoseMap = Record<string, string>;

/**
 * How a replaced pose set reaches a figure that is on screen (r43-motion2, both games; `PaintedActor.loadPoses` and `adoptPoses`).
 * `blend` is for a set swapped under a figure the player is looking at (the range director's charge painting, a boss in the middle of its
 * action): see {@link PaintedActor.showPoseSet}. Left out it is what the loader has always done.
 */
export interface PoseSwapOptions {
  blend?: boolean;
}

/** A pose seen without showing it (`PaintedActor.poseShape`): its painted box in the world, and what its alpha is read from (`motion/Silhouette.ts`). */
export interface PoseShape {
  corners: [Vector3, Vector3, Vector3, Vector3];
  /** The painting, and its painted box in the painting's own uv (v up), the mirror already told. */
  tex: Texture;
  u0: number;
  u1: number;
  v0: number;
  v1: number;
  mirrored: boolean;
}

export interface PaintedActorRimOptions {
  color?: number | string;
  strength?: number;
  /** Direction the rim comes *from*, in plane space. `[-1, 0.3]` = upper left. */
  dir?: [number, number];
  /** Rim band width in texels. */
  width?: number;
}

export interface PaintedActorShadowOptions {
  /** Radius in world units. Defaults to 0.42 * worldHeight. */
  radius?: number;
  opacity?: number;
  /** How much wider than tall the blob is. */
  squash?: number;
  color?: number | string;
}

export interface PaintedActorOptions {
  name?: string;
  /**
   * How tall the figure is in world units, measured from its feet
   * (`meta.baselineY`) to the top of the PNG's content. A human is 1.8.
   */
  worldHeight?: number;
  /**
   * Which way this fighter is turned: 1 = toward +x, -1 = toward -x.
   *
   * This is the *world* facing — it aims the lunge, the recoil and the lean.
   * It no longer mirrors the plane on its own; that is decided against
   * {@link PaintedActorOptions.artFacing} and the pose's own sidecar, so art
   * that already faces the right way is never flipped. Prefer
   * {@link PaintedActorOptions.side}, which sets it from the team.
   */
  facing?: 1 | -1;
  /** Party and aeons face +x, enemies face -x. Sets `facing` when given. */
  side?: ActorSide;
  /**
   * Which way this subject's paintings face, when their sidecars do not say.
   *
   * Default `'auto'`: assume the art obeys the contract for its side (party
   * right, enemies left) and never mirror it. `'front'` is the old
   * facing-camera art, which is also never mirrored. A pose whose sidecar
   * declares its own `facing` overrides this for that pose only.
   */
  artFacing?: ArtFacing;
  /**
   * The interim turn, in degrees: how far a still-frontal painting's plane is
   * yawed toward the enemy so it is not meeting the camera's eye mid-fight.
   *
   * Defaults to
   * {@link import('./BattlePresenterActors.ts').INTERIM_YAW_DEG}. `false` or
   * `0` opts this actor out — art painted to the v3 contract opts *itself* out
   * through its sidecar, so this is for a screen that wants a flat billboard
   * on purpose (a menu portrait, a diorama shot straight down the axis).
   */
  interimYaw?: number | false;
  /**
   * The soft ground ring that marks whose turn it is.
   *
   * **Off unless you ask for it.** The ring answers a question only a battle
   * has — *whose decision is this?* — so it is the battle stage that opts in
   * (`BattlePresenterStage`), with a gold ring under the party and a colder one
   * under the fiends. A cutscene or a scene demo drives the same poses for
   * staging reasons, and a highlight under a character who is not taking a turn
   * is a lie in every screenshot it lands in.
   */
  turnRing?: false | true | { color?: number | string; radius?: number; opacity?: number };
  /**
   * `false` stages the actor with **no painted figure**: the planes are never
   * drawn, while the group, the turn ring, the selection accent and every
   * projection point still work. For a destructible part that is a ring on its
   * parent's painting rather than a figure of its own (Vegnagun's Bulwarks,
   * Redoubts and Nodes, D-044; `src/engine/PartAnchors.ts`). Default `true`.
   */
  figure?: boolean;
  /**
   * The life layer: breathing weight, the ready step, the guard brace, the KO
   * fall, the victory hop. `false` leaves `setPose` a plain texture swap, which
   * is what hand-animated scene demos want.
   */
  life?: false;
  /** Crossfade duration between poses. */
  crossfadeMs?: number;
  /**
   * A horizontal shift per pose, in that painting's own pixels (+ = toward the painting's right), so poses whose
   * canvases were centred on different points still stand on one stance (FF7's Film set,
   * `src/data/ff7/filmPoseAnchors.ts`). Unset everywhere else: every upright plane is centred on the spot.
   */
  poseShiftPx?: Readonly<Record<string, number>>;
  /** Multiply tint. Used to mark stand-in party members. */
  tint?: number | string;
  brightness?: number;
  /** Strength of the contact darkening ramp at the figure's feet, 0..1. */
  groundShade?: number;
  alphaCut?: number;
  /** Erode the silhouette by this many texels (0, default: off), trimming a pale matte fringe (FF7's Film art). */
  erode?: number;
  /**
   * Feather the outer band of the plane, as a fraction of half-width, so art
   * whose aura bleeds to the PNG border does not end on a hard rectangle.
   * 0 (default) is off; 0.12–0.2 is enough for a full-bleed glow.
   */
  edgeFade?: number;
  /**
   * Whether {@link edgeFade} also feathers the plane's base (default `true`, the
   * whole rectangle). `false` feathers the sides and top only, for a figure whose
   * feet or coils meet the floor at the bottom edge (PR-0164, `ActorEdgeFeather.ts`).
   */
  edgeFadeBase?: boolean;
  /** How far the {@link edgeFade} start wanders in along each edge (0, default: straight; PR-0164). */
  edgeJag?: number;
  shadow?: false | PaintedActorShadowOptions;
  /**
   * Whether this figure writes the whole-frame bloom's figure mask
   * (`BloomMask.ts`, PR-0097). Default `true`; the scene's palette strength
   * decides how much the mask does. `false` blooms the figure unmasked.
   */
  bloomMask?: boolean;
  /** Subtle idle breathing. `false` disables. */
  breathe?: false | { amplitude?: number; speed?: number };
  /** Subtle idle sway (a fraction of a degree). `false` disables. */
  sway?: false | { amplitude?: number; speed?: number };
  rim?: PaintedActorRimOptions;
  /** Bounce light from the ground, added into the lower part of the figure. */
  bounce?: { color?: number | string; strength?: number };
  renderOrder?: number;
  /**
   * Cast a real shadow from the painted silhouette (via an alpha-tested
   * `MeshDepthMaterial`). Default true; the key light has to `castShadow` and
   * the ground has to `receiveShadow` for it to show.
   */
  castShadow?: boolean;
  /** Alpha threshold used by the shadow pass only. Default 0.4. */
  shadowAlphaTest?: number;
  /**
   * Leftover-white-background cleanup for generated PNGs. Defaults to `'auto'`,
   * which only fires when a big near-white region wraps the image border.
   */
  matte?: MatteOptions;
  /**
   * Measure each pose's feet from its alpha instead of trusting the sidecar's
   * `baselineY` (which the art tool usually writes as a flat `height - 16`).
   * On by default — it is what plants a figure on the ground plane instead of
   * a few pixels above or below it. Pass `false` for hand-measured art.
   */
  fitBaseline?: false | BaselineFitOptions;
  /**
   * Lift the figure off its ground point, in world units, for something that
   * is *meant* to hover — Seymour Flux, an aeon mid-summon. The contact shadow
   * stays on the ground and shrinks, which is what reads as levitation rather
   * than as a mistake.
   */
  hover?: number | { height?: number; bobAmplitude?: number; bobSpeed?: number };
  /** Canvas used when a pose PNG is missing. */
  placeholder?: () => HTMLCanvasElement;
  /** Where the feet are in the placeholder canvas, as a fraction of height. */
  placeholderBaseline?: number;
  /**
   * How poses are sized against each other.
   *
   * By default every pose of a subject shares one **pixels-per-world-unit**,
   * derived once from the idle painting, so a KO render (a landscape image of a
   * body lying down) comes out wide and low at the same pixel scale instead of
   * being stretched to a standing figure's height. See
   * {@link computePoseScale}.
   *
   * `false` restores the old per-pose behaviour (every pose is exactly
   * `worldHeight` tall) — only correct for art where each pose is cropped to
   * the same standing figure.
   */
  poseScaling?:
    | false
    | {
        /** Which pose sets the pixel scale. Default `'idle'`. */
        referencePose?: string;
        /** Longest side allowed, as a multiple of `worldHeight`. Default 2.2. */
        maxExtent?: number;
        /** Shortest longest-side allowed, same units. Default 0.35. */
        minExtent?: number;
        /** Width/height ratio at which a pose counts as prone. Default 1.15. */
        proneAspect?: number;
      };
  /** Poses to load on {@link PaintedActor.create}. */
  poses?: PoseMap;
  initialPose?: string;
}

export interface PlaneSlot {
  mesh: Mesh;
  material: ShaderMaterial;
  /** Alpha-tested depth material, so the painted cutout casts a real shadow. */
  depth: MeshDepthMaterial | null;
  fade: number;
  pose: string;
  meta: PoseMeta;
  /** What {@link computePoseScale} worked out for this slot's pose, with the head lock's factor on it (`HeadLock.ts`). */
  scale: PoseScale;
  /** The painting this plane draws (release 39: `ArtGovernor` reads which master its texture holds). */
  painted: PaintedTexture | null;
  /** D-510: the pose's scale as the table gives it, before the head lock; `scale` is this times `lock`. */
  base: PoseScale;
  /** D-510: the factor the head lock holds on the table's scale (1 = none: no head box, no camera yet, or the idle itself). */
  lock: number;
  /** D-510: the art subject of `painted` (`yuna`, `exp-leblanc-yuna`), so the lock only compares planes of one figure. */
  subject: string | null;
  /** FA-2 and FA-3 (`KoTip.ts`): the KO fall (and the revive's rise) tips this plane about its feet; `placeSlot` applies it after every placement, so the head lock's per-frame `sizeSlot` keeps it. */
  tip: SlotTip | null;
  /** W5 (`PoseSwap.ts`): how far this plane drifts toward the meeting point at full weight (world x); 0 outside an aligned dissolve. */
  meet: number;
  /** W5: the drift applied now, `meet` times the weight of this plane's fade (`PoseAlign.alignWeight`); `placeSlot` adds it. */
  align: number;
}

/** D-510: what every other pose's head is held to: the idle's head box, its sizing and its art subject (`PaintedActor.headRefOf`). */
export interface HeadRef {
  head: HeadBox;
  scale: PoseScale;
  subject: string | null;
}
