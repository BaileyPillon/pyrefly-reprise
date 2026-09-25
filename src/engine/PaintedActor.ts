import {
  AdditiveBlending,
  CircleGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  PlaneGeometry,
  RGBADepthPacking,
  ShaderMaterial,
  Vector2,
  Vector3,
  type Camera,
  type Texture,
} from 'three';
import {
  ActorLife,
  approach,
  attackOffset,
  clampYawToCamera,
  facingForSide,
  INTERIM_YAW_DEG,
  interimYawFor,
  lifeStateForPose,
  mirrorFor,
  nextLifeState,
  resolvePoseName,
  type ActorSide,
  type ArtFacing,
  type LifeCue,
} from './BattlePresenterActors.ts';
import {
  loadPainted,
  paintedCanvasTexture,
  PaintedArt,
  type BaselineFitOptions,
  type MatteOptions,
  type PaintedSubject,
  type PaintedTexture,
  type PoseMeta,
} from './PaintedArt.ts';
import { computePoseScale, contactBandFor, type PoseScale } from './PaintedScale.ts';
import { placePlane } from './PaintedRest.ts';
import { LIE_FLAT_TILT, lieOffset } from './LieFlat.ts';
import { PAINTED_BLENDING, syncPaintedBloom } from './BloomMask.ts';
import { noiseCanvas, paintPlaceholderFigure, radialCanvas } from './ProceduralArt.ts';
import { paintedFragmentShader, paintedVertexShader } from './shaders/PaintedShader.ts';
import { TweenGroup, type EasingFn, type EasingName, type Tween } from './Tween.ts';

/** One painted pose: a URL now, a texture once it has loaded. */
export type PoseMap = Record<string, string>;

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
  /** Multiply tint. Used to mark stand-in party members. */
  tint?: number | string;
  brightness?: number;
  /** Strength of the contact darkening ramp at the figure's feet, 0..1. */
  groundShade?: number;
  alphaCut?: number;
  /**
   * Feather the outer band of the plane, as a fraction of half-width, so art
   * whose aura bleeds to the PNG border does not end on a hard rectangle.
   * 0 (default) is off; 0.12–0.2 is enough for a full-bleed glow.
   */
  edgeFade?: number;
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

interface PlaneSlot {
  mesh: Mesh;
  material: ShaderMaterial;
  /** Alpha-tested depth material, so the painted cutout casts a real shadow. */
  depth: MeshDepthMaterial | null;
  fade: number;
  pose: string;
  meta: PoseMeta;
  /** What {@link computePoseScale} worked out for this slot's pose. */
  scale: PoseScale;
}

/** A pose that has not been sized yet: 1x1, upright, no footprint. */
const UNSIZED: PoseScale = {
  unitsPerPixel: 1,
  width: 1,
  height: 1,
  offsetY: 0.5,
  topY: 1,
  anchorY: 1,
  prone: false,
  footprint: 0,
  clamped: false,
  contentBox: { x0: -0.5, x1: 0.5, y0: 0, y1: 1 },
};

let sharedNoise: Texture | null = null;
function noiseTexture(): Texture {
  if (!sharedNoise) sharedNoise = paintedCanvasTexture(noiseCanvas(256, 5, 5));
  return sharedNoise;
}

let sharedBlob: Texture | null = null;
function blobTexture(): Texture {
  if (!sharedBlob) {
    sharedBlob = paintedCanvasTexture(
      radialCanvas(256, [
        [0, 0.95],
        [0.3, 0.6],
        [0.62, 0.2],
        [1, 0],
      ]),
    );
  }
  return sharedBlob;
}

let sharedRing: Texture | null = null;
/** The turn highlight: a soft annulus, brightest just inside its rim. */
function ringTexture(): Texture {
  if (!sharedRing) {
    sharedRing = paintedCanvasTexture(
      radialCanvas(256, [
        [0, 0],
        [0.52, 0.04],
        [0.74, 0.34],
        [0.87, 0.95],
        [0.95, 0.3],
        [1, 0],
      ]),
    );
  }
  return sharedRing;
}

const TAU = Math.PI * 2;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/** How long the interim turn takes to settle, seconds. */
const YAW_TAU = 0.18;

/**
 * The global A/B switch behind `window.__pyrefly.interimYaw(on)`.
 *
 * Module-level rather than per-actor on purpose: the toggle exists to compare
 * two captures of the *same staged field*, and every actor has to answer to it
 * on the same frame. Each actor keeps its own angle
 * ({@link PaintedActor.setInterimYaw}); this only says whether the angle is
 * being applied at all.
 */
let interimYawOn = true;

/** Turn the interim yaw on or off for every painted actor on the field. */
export function setInterimYawEnabled(on: boolean): void {
  interimYawOn = on;
}

/** Whether the interim yaw is currently being applied. */
export function isInterimYawEnabled(): boolean {
  return interimYawOn;
}

/** Scratch for the per-frame camera azimuth. Read and dropped inside one call. */
const yawScratchA = new Vector3();
const yawScratchB = new Vector3();

/** Where a hit tints the painting for a moment — a warm, bruised red. */
const HURT_TINT = 0xff9f8e;

/** How long the KO takes to tip over and hit the ground. */
const FALL_MS = 300;
/** {@link PaintedActor.lieDown}'s roll: flat on the floor (1.5 left the head tilted up, Chapter VII e2e). */
const LIE_ANGLE = Math.PI / 2;
/** ...then tipped back about its long axis flat onto the floor, face up (`LieFlat.ts`). */
const LIE_TILT = LIE_FLAT_TILT;
/** What a petrified figure's painting is tinted toward ({@link PaintedActor.setStone}). */
const STONE_TINT = new Color(0xb4afa6);

/** Stable per-name jitter so a party does not breathe, or cheer, in lockstep. */
function beatOffsetFor(name: string): number {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  return ((h >>> 8) % 1000) / 1000;
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * A painted character in the 2.5D scene.
 *
 * A `THREE.Group` holding **two** textured planes (so poses crossfade rather
 * than popping) plus a soft contact shadow on the ground. Sizing is driven by a
 * *world height*, not by pixels: a human is 1.8 world units tall whether the
 * painting is 900 px or 1600 px, and the figure's feet — `baselineY` from the
 * sidecar JSON — sit exactly on the group's origin.
 *
 * On top of the pose animation sit independent procedural motion layers that
 * **stack**: breathing, sway, lunge, recoil, squash, hop and shake all
 * contribute to one transform each frame, so an actor can be mid-lunge, mid-hop
 * and shaking without any of them fighting.
 *
 * Over those sits the **life layer** (`BattlePresenterActors.ts`): the pose name
 * is also a *state*, so `setPose('ready')` leans the fighter forward and lights
 * the turn ring under their feet, `setPose('defend')` braces them, `setPose`
 * ('ko') drops the body, a revive brings it back up with a glow, and `recoil`
 * flinches through the `hurt` painting with a warm tint. The presenter did not
 * have to learn any of it: it still just names poses.
 *
 * **Facing is two numbers, not one.** The body's facing (party +x, enemies -x)
 * aims the lunge and the lean; whether the *plane* is mirrored depends on which
 * way the painting was painted (`artFacing`, or the pose sidecar's `facing`).
 * Art that already faces the right way for its side is never flipped.
 *
 * On top of that sits the **interim turn**: until a subject is re-rendered to
 * the v3 contract (painted at ~45° toward the enemy), its straight-on plane is
 * *yawed* toward the other team so it is not addressing the camera mid-fight.
 * A pose whose sidecar already declares `right` or `left` is left flat.
 * `window.__pyrefly.interimYaw(false)` turns the whole thing off for an A/B.
 *
 * The API is deliberately parallel to {@link SpriteActor}: `update(dt)`,
 * `flash`, `shake`, `fadeTo`, `setAlpha`, `moveTo`, `setFacing`,
 * `setBrightness`, `dispose`.
 */
export class PaintedActor extends Group {
  readonly tweens = new TweenGroup();
  readonly shadow: Mesh | null;
  /** Set by {@link PaintedActor.fromSubject}: what the loader actually found. */
  subject: PaintedSubject | null = null;

  /** Inner group carrying every procedural motion layer. */
  private readonly inner = new Group();
  private readonly slots: [PlaneSlot, PlaneSlot];
  private active = 0;

  private readonly poses = new Map<string, PaintedTexture>();
  private readonly poseUrls: PoseMap = {};
  /**
   * Textures this actor loaded itself, and is therefore responsible for
   * freeing. Textures that arrived through {@link adoptPoses} are *borrowed* —
   * another actor may still be drawing them — so they are never disposed here.
   */
  private readonly owned = new Set<Texture>();

  private readonly worldHeight: number;
  private readonly crossfadeMs: number;
  private readonly placeholderFactory: () => HTMLCanvasElement;
  private readonly placeholderBaseline: number;
  private readonly matte: MatteOptions;
  private readonly fitBaseline: false | BaselineFitOptions;
  private readonly hoverHeight: number;
  private readonly hoverBobAmp: number;
  private readonly hoverBobSpeed: number;
  private readonly shadowBaseRadius: number;
  private readonly shadowBaseOpacity: number;
  private readonly shadowSquash: number;

  /**
   * The pose whose pixel scale every other pose inherits — idle, normally.
   * `null` until a real (non-placeholder) pose set has loaded, which is exactly
   * when each pose should fall back to sizing itself.
   */
  private reference: PoseMeta | null = null;
  private readonly referencePose: string;
  private readonly sizeFromReference: boolean;
  private readonly extents: { maxExtent: number; minExtent: number; proneAspect: number };

  /** World facing: which way this fighter is turned. Never mirrors on its own. */
  private facing: 1 | -1 = 1;
  /** What this subject's paintings face when a sidecar does not say. */
  private artFacing: ArtFacing;
  /** This actor's interim turn, in degrees. 0 = flat to camera. */
  private interimYaw: number;
  /** The eased, applied yaw in degrees — what is on `inner.rotation.y`. */
  private appliedYaw = 0;
  /**
   * Which way the camera lies from this figure, as a yaw in degrees
   * (`atan2(dx, dz)`), harvested in `onBeforeRender` so the actor never has to
   * be handed a camera. Null until the first frame has rendered.
   */
  private viewAzimuth: number | null = null;
  /** False until the first `update`, which lands the yaw rather than easing it. */
  private yawPrimed = false;
  private _alpha = 1;
  private baseBrightness: number;
  private readonly castsShadow: boolean;
  /** False for a figure-less actor ({@link PaintedActorOptions.figure}). */
  private readonly showFigure: boolean;
  private readonly shadowAlphaTest: number;
  private readonly bloomMasked: boolean;

  // shared uniform cells (one object per uniform, referenced by both planes)
  private readonly u: {
    brightness: { value: number };
    tint: { value: Color };
    flashColor: { value: Color };
    flashAmount: { value: number };
    rimColor: { value: Color };
    rimStrength: { value: number };
    rimDir: { value: Vector2 };
    rimWidth: { value: number };
    bounceColor: { value: Color };
    bounceStrength: { value: number };
    dissolve: { value: number };
    dissolveColor: { value: Color };
    groundShade: { value: number };
    desaturate: { value: number };
    alphaCut: { value: number };
    edgeFade: { value: number };
    noiseMap: { value: Texture };
  };

  // --- motion layers --------------------------------------------------------
  private clock = Math.random() * 100;
  private breatheAmp: number;
  private breatheSpeed: number;
  private swayAmp: number;
  private swaySpeed: number;

  private lungeOffset = 0;
  private recoilOffset = 0;
  private hopHeight = 0;
  private squashAmount = 0;
  private shakeAmp = 0;
  private shakeLeftMs = 0;
  private shakeTotalMs = 1;
  private shakePhase = 0;
  private rimDirBase = new Vector2(-1, 0.32);
  /** The one live flash decay, so a second flash cannot fight the first. */
  private flashTween: Tween | null = null;

  // --- life ----------------------------------------------------------------
  /** Posture + state machine. Null when `life: false`. */
  private readonly life: ActorLife | null;
  /** The pose name that was *asked* for, before any fallback. */
  private requested = '';
  /** Extra tilt and drop the KO fall (and the revive rise) contribute. */
  private fallTilt = 0;
  private fallDrop = 0;
  /** 0 standing, 1 lying on its back ({@link lieDown}). */
  private lieRoll = 0;
  private proneShift = 0;
  /** 0..1 damage tint, lerped from `baseTint` toward {@link HURT_TINT}. */
  private hurtTint = 0;
  private readonly baseTint: Color;
  private readonly hurtTintColour = new Color(HURT_TINT);
  private readonly tintScratch = new Color();
  /** Set while {@link flinch} owns the pose, so it never fights a real change. */
  private flinchToken = 0;
  /** Suppresses the `hurt` life state re-entering its own flinch. */
  private flinching = false;
  private readonly turnRing: Mesh | null;
  private readonly ringBaseRadius: number;
  private readonly ringBaseOpacity: number;
  /** Hand control of the ring, or null to leave it to the life layer. */
  private ringOverride: number | null = null;
  /**
   * The selection accent — see {@link setSelectAccent}. Built on first use, so
   * an actor that is never targeted (a cutscene figure, a diorama demo) never
   * allocates a mesh or a material for it.
   */
  private accent: Mesh | null = null;
  private accentWanted = 0;
  /** Eased 0..1, so the pool fades in rather than snapping on. */
  private accentLevel = 0;
  private readonly accentColour = new Color(0xf2c21e);
  private dimAmount = 0;
  private stoneAmount = 0;
  /** Breathing phase in cycles, so a tempo change never snaps the chest. */
  private breathPhase = Math.random();
  /** A stable per-name offset, so a party does not breathe (or cheer) in step. */
  private readonly beatOffset: number;

  constructor(opts: PaintedActorOptions = {}) {
    super();
    this.name = opts.name ?? 'painted-actor';
    this.worldHeight = opts.worldHeight ?? 1.8;
    this.crossfadeMs = opts.crossfadeMs ?? 120;
    this.baseBrightness = opts.brightness ?? 1;
    this.placeholderFactory =
      opts.placeholder ?? ((): HTMLCanvasElement => paintPlaceholderFigure({ seed: 7 }));
    this.placeholderBaseline = opts.placeholderBaseline ?? 0.965;
    this.matte = opts.matte ?? { mode: 'auto' };
    this.fitBaseline = opts.fitBaseline ?? {};
    const hover = typeof opts.hover === 'number' ? { height: opts.hover } : (opts.hover ?? {});
    this.hoverHeight = hover.height ?? 0;
    this.hoverBobAmp = hover.bobAmplitude ?? (this.hoverHeight ? this.hoverHeight * 0.22 : 0);
    this.hoverBobSpeed = hover.bobSpeed ?? 0.19;

    const breathe = opts.breathe === false ? null : (opts.breathe ?? {});
    this.breatheAmp = breathe ? (breathe.amplitude ?? 0.016) : 0;
    this.breatheSpeed = breathe ? (breathe.speed ?? 0.55) : 0;
    const sway = opts.sway === false ? null : (opts.sway ?? {});
    this.swayAmp = sway ? (sway.amplitude ?? 0.012) : 0;
    this.swaySpeed = sway ? (sway.speed ?? 0.33) : 0;

    const rim = opts.rim ?? {};
    this.rimDirBase.set(rim.dir?.[0] ?? -1, rim.dir?.[1] ?? 0.32);

    const sizing = opts.poseScaling === false ? {} : (opts.poseScaling ?? {});
    this.sizeFromReference = opts.poseScaling !== false;
    this.referencePose = sizing.referencePose ?? 'idle';
    this.extents = {
      maxExtent: sizing.maxExtent ?? 2.2,
      minExtent: sizing.minExtent ?? 0.35,
      proneAspect: sizing.proneAspect ?? 1.15,
    };

    this.baseTint = new Color(opts.tint ?? 0xffffff);
    this.beatOffset = beatOffsetFor(this.name);
    this.life = opts.life === false ? null : new ActorLife();
    this.artFacing = opts.artFacing ?? 'auto';
    this.interimYaw = 0;
    if (opts.interimYaw !== false) this.setInterimYaw(opts.interimYaw ?? INTERIM_YAW_DEG);

    this.u = {
      brightness: { value: this.baseBrightness },
      tint: { value: this.baseTint.clone() },
      flashColor: { value: new Color(0xffffff) },
      flashAmount: { value: 0 },
      rimColor: { value: new Color(rim.color ?? 0xbfe0ff) },
      rimStrength: { value: rim.strength ?? 0 },
      rimDir: { value: this.rimDirBase.clone() },
      rimWidth: { value: rim.width ?? 3.2 },
      bounceColor: { value: new Color(opts.bounce?.color ?? 0xffd6a8) },
      bounceStrength: { value: opts.bounce?.strength ?? 0 },
      dissolve: { value: 0 },
      dissolveColor: { value: new Color(0x9dffc4) },
      groundShade: { value: opts.groundShade ?? 0.24 },
      desaturate: { value: 0 },
      alphaCut: { value: opts.alphaCut ?? 0.02 },
      edgeFade: { value: opts.edgeFade ?? 0 },
      noiseMap: { value: noiseTexture() },
    };

    const renderOrder = opts.renderOrder ?? 10;
    this.castsShadow = opts.castShadow !== false;
    this.showFigure = opts.figure !== false;
    this.shadowAlphaTest = opts.shadowAlphaTest ?? 0.4;
    this.bloomMasked = opts.bloomMask !== false;
    this.slots = [this.makeSlot(renderOrder), this.makeSlot(renderOrder)];
    for (const s of this.slots) this.inner.add(s.mesh);
    this.add(this.inner);

    if (opts.shadow === false) {
      this.shadow = null;
      this.shadowBaseRadius = 0;
      this.shadowBaseOpacity = 0;
      this.shadowSquash = 0.58;
    } else {
      const so = opts.shadow ?? {};
      this.shadowBaseRadius = so.radius ?? this.worldHeight * 0.36;
      this.shadowBaseOpacity = so.opacity ?? 0.5;
      this.shadowSquash = so.squash ?? 0.58;
      const mat = new MeshBasicMaterial({
        map: blobTexture(),
        color: so.color ?? 0x050a14,
        transparent: true,
        opacity: this.shadowBaseOpacity,
        depthWrite: false,
      });
      this.shadow = new Mesh(new CircleGeometry(1, 40), mat);
      this.shadow.rotation.x = -Math.PI / 2;
      this.shadow.position.y = 0.012;
      this.shadow.renderOrder = 4;
      this.shadow.scale.set(this.shadowBaseRadius, this.shadowBaseRadius * this.shadowSquash, 1);
      this.shadow.name = 'contact-shadow';
      this.add(this.shadow);
    }

    if (!opts.turnRing) {
      this.turnRing = null;
      this.ringBaseRadius = 0;
      this.ringBaseOpacity = 0;
    } else {
      const ro = opts.turnRing === true ? {} : opts.turnRing;
      this.ringBaseRadius = ro.radius ?? Math.max(0.5, this.worldHeight * 0.42);
      this.ringBaseOpacity = ro.opacity ?? 0.85;
      const mat = new MeshBasicMaterial({
        map: ringTexture(),
        color: ro.color ?? 0xf0cf92,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: AdditiveBlending,
      });
      const ring = new Mesh(new CircleGeometry(1, 48), mat);
      ring.rotation.x = -Math.PI / 2;
      // Above the contact shadow, below the figure.
      ring.position.y = 0.02;
      ring.renderOrder = 5;
      ring.scale.set(this.ringBaseRadius, this.ringBaseRadius * 0.46, 1);
      ring.visible = false;
      ring.name = 'turn-ring';
      this.turnRing = ring;
      this.add(ring);
    }

    this.setFacing(opts.side ? facingForSide(opts.side) : (opts.facing ?? 1));

    // Show something immediately, before any PNG has loaded.
    const boot = this.makePlaceholderPose('placeholder');
    this.owned.add(boot.texture);
    this.applyPose(0, 'placeholder', boot);
    this.slots[0].fade = 1;
    this.slots[1].fade = 0;
    this.syncOpacity();
  }

  /** Build an actor and await its poses. Missing PNGs become placeholders. */
  static async create(opts: PaintedActorOptions = {}): Promise<PaintedActor> {
    const actor = new PaintedActor(opts);
    if (opts.poses) await actor.loadPoses(opts.poses, opts.initialPose);
    return actor;
  }

  /**
   * Build an actor from a painted **subject id**, the one-liner most scenes
   * want:
   *
   * ```ts
   * const tidus = await PaintedActor.fromSubject('tidus', { worldHeight: 1.75 });
   * ```
   *
   * Reads `public/art/characters/<id>/<state>.png` + `.json` through
   * {@link PaintedArt.load}, so a state without its own painting falls back to
   * `idle` and a subject with no painting at all falls back to a soft grey
   * silhouette (with a warning). Never rejects.
   */
  static async fromSubject(
    id: string,
    opts: Omit<PaintedActorOptions, 'poses'> & { states?: readonly string[] } = {},
  ): Promise<PaintedActor> {
    const { states, ...actorOpts } = opts;
    const subject = await PaintedArt.load(id, {
      ...(states ? { states } : {}),
      ...(actorOpts.matte ? { matte: actorOpts.matte } : {}),
      ...(actorOpts.fitBaseline !== undefined ? { fitBaseline: actorOpts.fitBaseline } : {}),
    });
    const actor = new PaintedActor({ name: id, ...actorOpts });
    // The sidecars are the art's own word on which way it faces; an explicit
    // option still wins, because a caller who says so has looked at the PNG.
    if (subject.facing && actorOpts.artFacing === undefined) actor.setArtFacing(subject.facing);
    actor.adoptPoses(subject.poses, actorOpts.initialPose);
    actor.subject = subject;
    return actor;
  }

  private makeSlot(renderOrder: number): PlaneSlot {
    const material = new ShaderMaterial({
      uniforms: {
        map: { value: null },
        opacity: { value: 0 },
        texel: { value: new Vector2(1 / 1024, 1 / 1024) },
        // Per-slot, not shared: the contact ramp is a fixed *world* distance,
        // so its UV height depends on how tall this pose's plane ended up.
        contactBand: { value: 0.1 },
        ...this.u,
      },
      vertexShader: paintedVertexShader,
      fragmentShader: paintedFragmentShader,
      transparent: true,
      ...PAINTED_BLENDING,
      depthWrite: false,
      depthTest: true,
      side: DoubleSide,
    });
    const mesh = new Mesh(new PlaneGeometry(1, 1), material);
    mesh.frustumCulled = false;
    mesh.renderOrder = renderOrder;
    mesh.visible = false;
    // The camera comes to *us*. `onBeforeRender` fires on the main pass only
    // (the shadow pass goes through `onBeforeShadow`, which `Object3D` no-ops),
    // so the interim yaw can answer to a rig that has swung round the side
    // without `PaintedStage` having to hand every actor a camera, and without
    // this class growing a reference to one it would then have to keep current.
    mesh.onBeforeRender = (_renderer, scene, camera): void => {
      if (scene) this.noteViewCamera(camera);
    };

    let depth: MeshDepthMaterial | null = null;
    if (this.castsShadow) {
      depth = new MeshDepthMaterial({
        depthPacking: RGBADepthPacking,
        alphaTest: this.shadowAlphaTest,
      });
      mesh.customDepthMaterial = depth;
      mesh.castShadow = true;
    }
    return {
      mesh,
      material,
      depth,
      fade: 0,
      pose: '',
      meta: { width: 1, height: 1, baselineY: 1 },
      scale: UNSIZED,
    };
  }

  private makePlaceholderPose(url: string): PaintedTexture {
    const canvas = this.placeholderFactory();
    return {
      texture: paintedCanvasTexture(canvas),
      meta: {
        width: canvas.width,
        height: canvas.height,
        baselineY: canvas.height * this.placeholderBaseline,
      },
      placeholder: true,
      url,
    };
  }

  // -------------------------------------------------------------------- poses

  /**
   * Load a `{ pose: url }` map. Every entry resolves — a missing PNG becomes a
   * placeholder with a console warning — so this never rejects.
   */
  async loadPoses(poses: PoseMap, initial?: string): Promise<void> {
    const names = Object.keys(poses);
    const loaded = await Promise.all(
      names.map((n) =>
        loadPainted(
          poses[n]!,
          this.placeholderFactory,
          (c) => c.height * this.placeholderBaseline,
          this.matte,
          this.fitBaseline,
        ),
      ),
    );
    names.forEach((n, i) => {
      const next = loaded[i]!;
      this.retire(this.poses.get(n));
      this.poses.set(n, next);
      this.owned.add(next.texture);
      this.poseUrls[n] = poses[n]!;
    });
    this.pickReference();
    this.resize();
    const first = initial ?? (this.poses.has('idle') ? 'idle' : names[0]);
    // `force`, because re-loading a pose set (a stand-in being swapped for the
    // real painting) keeps the same pose *name* with a different texture.
    if (first) this.setPose(first, { immediate: true, force: true });
  }

  /**
   * Adopt textures that were already loaded — what
   * {@link PaintedActor.fromSubject} uses, and the way to share one load
   * between several actors (a stand-in party member borrowing the hero's
   * painting, for instance).
   *
   * Several names may point at the same {@link PaintedTexture}; that is exactly
   * what a state falling back to `idle` looks like.
   */
  adoptPoses(poses: Record<string, PaintedTexture>, initial?: string): void {
    const names = Object.keys(poses);
    if (!names.length) return;
    for (const name of names) {
      const tex = poses[name]!;
      this.retire(this.poses.get(name));
      this.poses.set(name, tex);
      this.poseUrls[name] = tex.url;
    }
    this.pickReference();
    this.resize();
    const first = initial ?? (this.poses.has('idle') ? 'idle' : names[0]);
    if (first) this.setPose(first, { immediate: true, force: true });
  }

  /** Re-load one pose from disk; used by the dev hot-swap watcher. */
  async reloadPose(name: string, url?: string): Promise<boolean> {
    const target = url ?? this.poseUrls[name];
    if (!target) return false;
    const next = await loadPainted(
      target,
      this.placeholderFactory,
      (c) => c.height * this.placeholderBaseline,
      this.matte,
      this.fitBaseline,
      // The hot-swap watcher only ever calls this for a file it has just seen
      // appear, which is by definition newer than the build-time art manifest.
      { ignoreManifest: true },
    );
    const previous = this.poses.get(name);
    this.poses.set(name, next);
    this.owned.add(next.texture);
    this.poseUrls[name] = target;
    // The hot-swapped pose may *be* the reference (idle landing at last), in
    // which case every other plane has to be re-sized against it.
    this.pickReference();
    this.resize();
    if (this.pose === name) this.setPose(name, { immediate: true, force: true });
    this.retire(previous);
    return !next.placeholder;
  }

  /** The pose currently showing. */
  get pose(): string {
    return this.slots[this.active]!.pose;
  }

  get poseNames(): string[] {
    return [...this.poses.keys()];
  }

  /** True when every loaded pose is a procedural stand-in. */
  get isPlaceholder(): boolean {
    if (!this.poses.size) return true;
    return [...this.poses.values()].every((p) => p.placeholder);
  }

  /**
   * Crossfade to a pose, and live it.
   *
   * The name is both a painting and a *state*: `setPose('ready')` leans the
   * fighter forward and lights the turn ring, `setPose('ko')` drops the body,
   * `setPose('victory')` swaps the pose on a small hop. See
   * {@link import('./BattlePresenterActors.ts').lifeStateForPose}. A pose with
   * no painting of its own still changes the state — it falls back to the
   * nearest one there is, which is how a subject loaded with `states: ['idle']`
   * can still be asked to celebrate.
   */
  setPose(name: string, opts?: { immediate?: boolean; force?: boolean }): void {
    // A body on the ground is allowed to ignore the pose it was handed. The
    // one case is a hit landing on someone who is already KO'd: the presenter
    // still names `hurt` for it, and wincing (never mind the sit-up the rise
    // cue would put under it) is not what a corpse does. Staging (`immediate`)
    // is exempt — that is the caller declaring the state, not the fight.
    const life = this.life;
    if (life && !opts?.immediate) {
      const want = lifeStateForPose(name);
      if (nextLifeState(life.state, want) !== want) return;
    }
    // A forced pose is the caller's word: a pending flinch may not hand it back.
    if (opts?.force) this.flinchToken++;
    const resolved = resolvePoseName(name, (p) => this.poses.has(p));
    this.enterLife(name, opts?.immediate === true);
    if (!resolved) return;
    const next = this.poses.get(resolved);
    if (!next) return;
    const already = this.requested === name && this.pose === resolved;
    this.requested = name;
    if (already && !opts?.force) return;

    const from = this.active;
    const to = from === 0 ? 1 : 0;
    this.applyPose(to, resolved, next);

    if (opts?.immediate || this.crossfadeMs <= 0) {
      this.slots[to]!.fade = 1;
      this.slots[from]!.fade = 0;
      this.active = to;
      this.syncOpacity();
      return;
    }

    this.active = to;
    const fromStart = this.slots[from]!.fade;
    const toStart = this.slots[to]!.fade;
    this.tweens.to(0, 1, {
      durationMs: this.crossfadeMs,
      easing: 'quadInOut',
      onUpdate: (t) => {
        this.slots[to]!.fade = toStart + (1 - toStart) * t;
        this.slots[from]!.fade = fromStart * (1 - t);
        this.syncOpacity();
      },
    });
  }

  /**
   * Free a texture that has just been replaced, but only if this actor owns it
   * and no other pose name still points at it.
   */
  private retire(previous: PaintedTexture | undefined): void {
    if (!previous || !this.owned.has(previous.texture)) return;
    for (const p of this.poses.values()) {
      if (p.texture === previous.texture) return;
    }
    this.owned.delete(previous.texture);
    previous.texture.dispose();
  }

  private applyPose(slotIndex: number, name: string, tex: PaintedTexture): void {
    const slot = this.slots[slotIndex]!;
    slot.pose = name;
    slot.meta = tex.meta;
    slot.material.uniforms['map']!.value = tex.texture;
    (slot.material.uniforms['texel']!.value as Vector2).set(
      1 / Math.max(1, tex.meta.width),
      1 / Math.max(1, tex.meta.height),
    );
    slot.mesh.visible = this.showFigure;
    if (slot.depth) {
      slot.depth.map = tex.texture;
      slot.depth.needsUpdate = true;
    }

    // One pixel scale for the whole subject, taken from idle — so a landscape
    // KO render becomes a wide, low body instead of a standing figure's height
    // stretched across two and a half world units. A placeholder has no
    // relationship to the subject's pixel scale, so it sizes itself.
    const reference = tex.placeholder ? null : this.reference;
    const scale = computePoseScale(tex.meta, {
      worldHeight: this.worldHeight,
      reference,
      ...this.extents,
    });
    slot.scale = scale;

    // The plane itself never rotates — mirroring is a negative scale.x, and the
    // pose's own orientation is painted into the texture; a prone one is only
    // rolled to rest on the floor (`PaintedRest.placePlane`, PR-0022). (The KO fall
    // tilts the *inner group*, which carries both planes together.)
    slot.mesh.scale.set(scale.width * this.mirrorOf(tex.meta), scale.height, 1);
    this.placeSlot(slot);
    slot.material.uniforms['contactBand']!.value = contactBandFor(scale.height);

    if (scale.clamped) {
      console.warn(
        `[painted] pose "${name}" (${tex.meta.width}x${tex.meta.height}) is at a very ` +
          `different pixel scale from "${this.referencePose}"; clamped to ` +
          `${scale.width.toFixed(2)}x${scale.height.toFixed(2)} world units. ` +
          'Add a `scale` override to its sidecar JSON if that is wrong.',
      );
    }
  }

  /**
   * Pick the pose whose pixel scale the others inherit: the idle painting, or —
   * when idle is missing — the first real, upright pose there is. Placeholders
   * never qualify, because a grey silhouette's pixels mean nothing.
   */
  private pickReference(): void {
    if (!this.sizeFromReference) {
      this.reference = null;
      return;
    }
    const idle = this.poses.get(this.referencePose);
    if (idle && !idle.placeholder) {
      this.reference = idle.meta;
      return;
    }
    for (const pose of this.poses.values()) {
      if (pose.placeholder) continue;
      if (pose.meta.height >= pose.meta.width) {
        this.reference = pose.meta;
        return;
      }
    }
    this.reference = null;
  }

  /** Re-size both planes — after the reference pose has changed underneath. */
  private resize(): void {
    for (const slot of this.slots) {
      const tex = this.poses.get(slot.pose);
      if (tex) this.applyPose(this.slots.indexOf(slot), slot.pose, tex);
    }
    this.syncOpacity();
  }

  private syncOpacity(): void {
    for (const slot of this.slots) {
      const o = slot.fade * this._alpha;
      slot.material.uniforms['opacity']!.value = o;
      slot.mesh.visible = this.showFigure && o > 0.001;
      // Only the dominant plane casts, so a crossfade never doubles the shadow.
      if (this.castsShadow) slot.mesh.castShadow = slot.fade > 0.5 && this._alpha > 0.3;
    }
  }

  // ------------------------------------------------------------------ effects

  /**
   * Additive flash toward `colour`, decaying to nothing over `ms`.
   *
   * The shader adds this on top of the painting (alpha- and
   * reflectance-weighted, clamped to white), so even `peak` 1 brightens the
   * figure rather than replacing it with a flat colour-shaped hole.
   *
   * Only one flash runs at a time. Two overlapping ones used to drive the same
   * uniform from two live tweens, and whichever happened to be later in the
   * group won the frame -- so a heal landing during a cast could *raise* the
   * amount back up and hold the figure lit. The in-flight tween is killed, and
   * the new one starts from whichever of the two is brighter so a weak flash
   * never cuts a strong one short.
   */
  flash(colour: number | string = 0xffffff, ms = 180, peak = 1): void {
    this.flashTween?.kill();
    this.u.flashColor.value.set(colour as never);
    const from = Math.max(clamp01(peak), this.u.flashAmount.value);
    this.u.flashAmount.value = from;
    this.flashTween = this.tweens.to(from, 0, {
      durationMs: Math.max(1, ms),
      easing: 'quadOut',
      onUpdate: (v) => {
        this.u.flashAmount.value = v;
      },
      onComplete: () => {
        this.flashTween = null;
        this.u.flashAmount.value = 0;
      },
    });
  }

  /**
   * Step in, strike, come home — the attack move, along the *body's* facing.
   *
   * Not one ease out and back: that is a drift, and it reads as the figure
   * sliding into the enemy. The shape is punctuated — quick step, a beat of
   * stillness, the strike pushing through the top of it, then the walk back —
   * which is what makes a still painting read as hitting something. The timing
   * lives in {@link import('./BattlePresenterActors.ts').ATTACK_BEATS}; the
   * peak is still `distance` and the whole move still takes `ms`, so every
   * existing call site keeps its staging.
   */
  lunge(distance = 0.9, ms = 320): Promise<void> {
    const from = this.lungeOffset;
    return this.tweens.toAsync(0, 1, {
      durationMs: Math.max(1, ms),
      easing: 'linear',
      onUpdate: (t) => {
        // Anything already in flight is folded out over the first beat, so a
        // second lunge on top of a first does not snap back to zero.
        const carry = from * Math.max(0, 1 - t / 0.26);
        this.lungeOffset = distance * attackOffset(t) + carry;
      },
      onComplete: () => {
        this.lungeOffset = 0;
      },
    });
  }

  /**
   * Knocked back and springing home — and, when there is a `hurt` painting,
   * wearing it for the length of the flinch.
   *
   * The presenter calls this on every hit, so this is where "recoil on hit with
   * a brief tint" lives: one call from `BattlePresenterBeats.damage` gives the
   * knock-back, the pose and the bruise.
   */
  recoil(ms = 340, distance = 0.28): Promise<void> {
    this.flinch(ms);
    return this.knockBack(ms, distance);
  }

  private knockBack(ms: number, distance: number): Promise<void> {
    return this.tweens.toAsync(1, 0, {
      durationMs: Math.max(1, ms),
      easing: 'elasticOut',
      onUpdate: (v) => {
        this.recoilOffset = -v * distance;
      },
    });
  }

  /**
   * The hit reaction on its own: the `hurt` pose for a moment, a warm tint over
   * the painting, then back to whatever the fighter was doing.
   *
   * No-op on a downed fighter — a body on the ground does not flinch — and on
   * an actor whose life layer is off.
   */
  flinch(ms = 340): void {
    const life = this.life;
    if (!life || life.state === 'down' || this.flinching) return;
    const back = this.requested || 'idle';
    const token = ++this.flinchToken;
    this.flinching = true;
    try {
      this.setPose('hurt');
    } finally {
      this.flinching = false;
    }
    this.tintHurt(Math.max(160, ms * 0.7));
    // A plain timer: hold the flinch, then hand the pose back — unless someone
    // (a KO, the next action) has taken it in the meantime.
    this.tweens.to(0, 1, {
      durationMs: Math.max(1, ms),
      easing: 'linear',
      onUpdate: () => {},
      onComplete: () => {
        if (this.flinchToken !== token) return;
        if (this.life?.state !== 'hurt') return;
        this.setPose(back === 'hurt' ? 'idle' : back);
      },
    });
  }

  /** Warm damage tint over the painting, decaying to the base tint. */
  private tintHurt(ms = 240): void {
    this.tweens.to(1, 0, {
      durationMs: Math.max(1, ms),
      easing: 'quadOut',
      onUpdate: (v) => {
        this.hurtTint = v;
        this.syncTint();
      },
      onComplete: () => {
        this.hurtTint = 0;
        this.syncTint();
      },
    });
  }

  private syncTint(): void {
    this.tintScratch.copy(this.baseTint).lerp(this.hurtTintColour, clamp01(this.hurtTint));
    this.u.tint.value.copy(this.tintScratch.lerp(STONE_TINT, this.stoneAmount * 0.6));
  }

  // --------------------------------------------------------------------- life

  /** The life state this fighter is in. `'idle'` when the layer is off. */
  get lifeState(): string {
    return this.life?.state ?? 'idle';
  }

  /**
   * Turn the acting-character ring on or off by hand.
   *
   * Normally the life layer does this: the ring comes up when a fighter is
   * `ready` or acting and fades when the turn passes. This is for screens that
   * drive the field themselves.
   */
  setTurnRing(on: boolean): void {
    if (!this.turnRing) return;
    this.ringOverride = on ? 1 : 0;
  }

  /** Give the ring back to the life layer after {@link setTurnRing}. */
  clearTurnRing(): void {
    this.ringOverride = null;
  }

  // ---------------------------------------------------------- target selection

  /**
   * The **selection accent**: the soft pool on the ground under a figure the
   * player is currently aiming at (option B, "hand, ring and a quiet dim",
   * approved by Bailey 2026-09-19).
   *
   * Deliberately *not* the turn ring. The turn ring answers "whose decision is
   * this?" and belongs to the life layer; this answers "what am I about to
   * hit?", is driven by the command menu, and the two are on screen together
   * all the time — the acting character's own ring is lit while they choose an
   * enemy. Sharing one mesh made the aeon's ring flicker between two colours.
   *
   * A figure that **levitates** (`hover`) gets a halo *behind* it instead of a
   * pool under it: Vegnagun's head and both Yu Pagodas have no feet, and a gold
   * disc on the floor several units below them marks the floor, not the target.
   *
   * @param colour accent colour, or `null` to clear it.
   */
  setSelectAccent(colour: number | string | null): void {
    if (colour === null) {
      this.accentWanted = 0;
      return;
    }
    this.ensureAccent();
    this.accentColour.set(colour as never);
    (this.accent!.material as MeshBasicMaterial).color.copy(this.accentColour);
    this.accentWanted = 1;
  }

  /** Whether a selection accent is currently asked for. */
  get hasSelectAccent(): boolean {
    return this.accentWanted > 0;
  }

  /**
   * The quiet dim: how far this figure is pushed toward grey and toward dark
   * while somebody *else* is the target. 0 = untouched, 1 = fully grey.
   *
   * Option B dims a non-target "about a quarter", which is `0.25` here: the
   * shader takes it as both the desaturation amount and (at a gentler rate) a
   * brightness trim, so the change reads as the figure stepping out of the
   * light rather than as a colour-grade bug. The trim rate 0.9 lands the
   * on-screen drop at about 17 percent after tone mapping (PR-0031; 0.72 read
   * as no dim at all in the critic's frames).
   */
  setDim(amount: number): void {
    const k = clamp01(amount);
    this.dimAmount = k;
    this.u.desaturate.value = Math.max(k, this.stoneAmount);
    this.u.brightness.value = this.baseBrightness * (1 - k * 0.9);
  }

  get dim(): number {
    return this.dimAmount;
  }

  /** True when this figure is staged off the ground and wants a halo, not a pool. */
  get levitates(): boolean {
    return this.hoverHeight > 0.05;
  }

  /**
   * The painted silhouette's four corners in **world** space, in the order
   * bottom-left, bottom-right, top-right, top-left of the plane's own frame.
   *
   * Taken from the pose's tight alpha box (`PoseScale.contentBox`) rather than
   * the plane, and pushed through the plane's live world matrix, so it carries
   * the interim yaw, the mirror, the lunge, the KO tilt and the hover bob. This
   * is what `PaintedStage.projectRect` turns into the screen rectangle a target
   * bracket is drawn on and an occlusion test is run against.
   *
   * `out` must hold four vectors; one is allocated per call when omitted.
   */
  contentQuad(out?: [Vector3, Vector3, Vector3, Vector3]): [Vector3, Vector3, Vector3, Vector3] {
    const corners: [Vector3, Vector3, Vector3, Vector3] = out ?? [
      new Vector3(),
      new Vector3(),
      new Vector3(),
      new Vector3(),
    ];
    const slot = this.slots[this.active]!;
    const box = slot.scale.contentBox;
    // The mesh's own local frame is a unit plane centred on its origin, scaled
    // by `mesh.scale` and lifted by `mesh.position.y` (= `scale.offsetY`). The
    // content box is expressed against the *group* origin, so undo that lift
    // and the scale to land back in unit-plane coordinates.
    const sx = slot.mesh.scale.x;
    const sy = slot.mesh.scale.y || 1;
    const lift = slot.scale.offsetY;
    // |sx|: the box is in the painting's own frame; a negative `sx` then mirrors it with the silhouette.
    const ax = Math.abs(sx);
    const u0 = ax === 0 ? -0.5 : box.x0 / ax;
    const u1 = ax === 0 ? 0.5 : box.x1 / ax;
    const v0 = (box.y0 - lift) / sy;
    const v1 = (box.y1 - lift) / sy;
    corners[0].set(u0, v0, 0);
    corners[1].set(u1, v0, 0);
    corners[2].set(u1, v1, 0);
    corners[3].set(u0, v1, 0);
    // `updateWorldMatrix` rather than trusting the last render's matrices: the
    // HUD asks for this from its own reposition path, which can run before the
    // renderer has touched the graph this frame.
    slot.mesh.updateWorldMatrix(true, false);
    for (const c of corners) c.applyMatrix4(slot.mesh.matrixWorld);
    return corners;
  }

  /**
   * Build the selection accent the first time one is asked for: a soft pool
   * lying on the ground, or — for a figure that levitates — an upright halo
   * behind it, parented to `inner` so it follows the bob.
   */
  private ensureAccent(): void {
    if (this.accent) return;
    const mat = new MeshBasicMaterial({
      map: ringTexture(),
      color: this.accentColour,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const mesh = new Mesh(new CircleGeometry(1, 48), mat);
    mesh.name = 'select-accent';
    if (this.levitates) {
      // Behind the figure, not under it. A lower `renderOrder` than the planes,
      // with `depthWrite` off, is what makes the halo read as light around the
      // silhouette rather than a disc pasted over it.
      mesh.renderOrder = 3;
      mesh.position.y = this.worldHeight * 0.5;
      this.inner.add(mesh);
    } else {
      mesh.rotation.x = -Math.PI / 2;
      // Above the contact shadow and the turn ring, still below the figure.
      mesh.position.y = 0.026;
      mesh.renderOrder = 6;
      this.add(mesh);
    }
    this.accent = mesh;
  }

  /**
   * Move the life state on, from a pose name, and fire whatever one-shots the
   * transition asks for. Called by every {@link setPose}.
   */
  private enterLife(pose: string, immediate: boolean): void {
    const life = this.life;
    if (!life) return;
    const change = life.set(lifeStateForPose(pose), { immediate });
    if (!change) return;
    // Any real state change cancels a flinch that has not handed the pose back
    // yet, so a KO landing mid-flinch is not undone 200 ms later.
    if (change.to !== 'hurt') this.flinchToken++;
    if (immediate) {
      // Staging someone who is already down: no fall, no cheering, no glow.
      if (change.to === 'down') {
        this.fallTilt = 1;
        this.fallDrop = 1;
      } else if (change.from === 'down') {
        this.fallTilt = 0;
        this.fallDrop = 0;
      }
      return;
    }
    for (const cue of change.cues) this.playCue(cue);
  }

  private playCue(cue: LifeCue): void {
    switch (cue) {
      case 'step':
        // Their turn: the weight coming up on to the front foot.
        void this.hop(this.worldHeight * 0.035, 300);
        return;
      case 'flinch':
        // Only when something set `hurt` directly; `recoil` brings its own knock-back.
        if (this.flinching) return;
        this.tintHurt(260);
        void this.knockBack(300, this.worldHeight * 0.1);
        return;
      case 'fall':
        this.fall();
        return;
      case 'rise':
        this.rise();
        return;
      case 'hop':
        // Victory, staggered per fighter so a party does not cheer like a chorus line.
        this.after(this.beatOffset * 240, () => {
          void this.hop(this.worldHeight * 0.13, 460);
        });
        return;
    }
  }

  /** Tip over and hit the ground: the KO. */
  private fall(): void {
    this.tweens.to(0, 1, {
      durationMs: FALL_MS,
      easing: 'quadIn',
      onUpdate: (v) => {
        this.fallTilt = v;
        this.fallDrop = v;
      },
      onComplete: () => {
        // Landing: a short slap of squash and a small ground shake, then the
        // extra tilt relaxes into the `down` posture.
        void this.squash(280, 0.5);
        this.shake(this.worldHeight * 0.018, 200);
        this.tweens.to(1, 0, {
          durationMs: 420,
          easing: 'quadOut',
          onUpdate: (v) => {
            this.fallTilt = v;
            this.fallDrop = v;
          },
        });
      },
    });
  }

  /** Back on their feet, with the Phoenix Down's glow still on them. */
  private rise(): void {
    const from = this.fallTilt;
    const drop = this.fallDrop;
    this.tweens.to(1, 0, {
      durationMs: 320,
      easing: 'quadOut',
      onUpdate: (v) => {
        this.fallTilt = from * v;
        this.fallDrop = drop * v;
      },
    });
    this.flash(0xcfe9ff, 640, 0.55);
    void this.hop(this.worldHeight * 0.07, 520);
  }

  /**
   * Fall onto its back and stay there, flat on the floor over its own station
   * ({@link lieOffset}): a defeat that leaves a body with no painted `ko`
   * (Seymour at Macalania, D-046, the `'body'` departure). `ms` 0 lies down at
   * once. Both games' plumbing; only FFX's Seymour uses it today.
   */
  lieDown(ms = 520): Promise<void> {
    if (ms <= 0) {
      this.lieRoll = 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.tweens.to(this.lieRoll, 1, {
        durationMs: ms,
        easing: 'quadIn',
        onUpdate: (v) => {
          this.lieRoll = v;
        },
        onComplete: () => {
          void this.squash(260, 0.35);
          this.shake(this.worldHeight * 0.012, 220);
          resolve();
        },
      });
    });
  }

  /** Where the rolled body goes: `[dx, lift]`, on the floor over its own station (`LieFlat.ts`). */
  private lieOffset(angle: number): [number, number, number] {
    const slot = this.slots[this.active]!;
    return lieOffset(slot.scale.contentBox, slot.mesh.scale.x < 0, angle, LIE_TILT * this.lieRoll);
  }

  /** A plain delay on the actor's own tween group, so `dispose` kills it. */
  private after(ms: number, fn: () => void): void {
    if (ms <= 0) {
      fn();
      return;
    }
    this.tweens.to(0, 1, {
      durationMs: 1,
      delayMs: ms,
      easing: 'linear',
      onUpdate: () => {},
      onComplete: fn,
    });
  }

  /** Squash and stretch, springing back. `amount` 1 = the default 18%. */
  squash(ms = 320, amount = 1): Promise<void> {
    return this.tweens.toAsync(amount, 0, {
      durationMs: ms,
      easing: 'elasticOut',
      onUpdate: (v) => {
        this.squashAmount = v;
      },
    });
  }

  /** A sine arc hop. */
  hop(height = 0.5, ms = 420): Promise<void> {
    return this.tweens.toAsync(0, 1, {
      durationMs: ms,
      easing: 'linear',
      onUpdate: (t) => {
        this.hopHeight = Math.sin(Math.PI * t) * height;
      },
    });
  }

  /** Damped jitter, in world units. */
  shake(amount = 0.08, ms = 300): void {
    this.shakeAmp = amount;
    this.shakeLeftMs = ms;
    this.shakeTotalMs = Math.max(1, ms);
    this.shakePhase = Math.random() * TAU;
  }

  /**
   * Pyrefly dissolve: 0 = solid, 1 = gone.
   *
   * Dissolving all the way *is* a death, so the body goes down with it: the
   * fiend collapses and comes apart at the same time, instead of standing to
   * attention while it evaporates. (This is the enemy half of the KO — a party
   * member gets the fall from `setPose('ko')` and stays on the field.)
   */
  dissolveTo(value: number, ms = 900, colour?: number | string): Promise<void> {
    if (colour !== undefined) this.u.dissolveColor.value.set(colour as never);
    // Fall *then* come apart. The KO drop takes ~300 ms, so holding the
    // dissolve off for a beat lets the eye see the fiend go down before the
    // pyreflies take it; starting both on the same frame reads as a figure
    // evaporating on its feet, and the fall is lost inside the fade. The delay
    // is taken out of the move, not added to it, so every caller's timing
    // (`TIMING.ko`) is unchanged.
    let delayMs = 0;
    if (value >= 0.999 && this.life && this.life.state !== 'down') {
      this.setPose('ko');
      delayMs = Math.min(FALL_MS * 0.6, ms * 0.25);
    }
    return this.tweens.toAsync(this.u.dissolve.value, value, {
      durationMs: Math.max(1, ms - delayMs),
      delayMs,
      easing: 'quadInOut',
      onUpdate: (v) => {
        this.u.dissolve.value = v;
      },
    });
  }

  setDissolve(value: number): void {
    this.u.dissolve.value = value;
  }

  fadeTo(alpha: number, ms = 300, easing: EasingName | EasingFn = 'quadInOut'): Promise<void> {
    return this.tweens.toAsync(this._alpha, alpha, {
      durationMs: ms,
      easing,
      onUpdate: (v) => this.setAlpha(v),
    });
  }

  setAlpha(alpha: number): void {
    this._alpha = alpha;
    this.syncOpacity();
    const sm = this.shadow?.material as MeshBasicMaterial | undefined;
    if (sm) sm.opacity = this.shadowBaseOpacity * alpha;
  }

  get alpha(): number {
    return this._alpha;
  }

  moveTo(
    pos: Vector3 | { x: number; y: number; z: number },
    ms = 400,
    easing: EasingName | EasingFn = 'quadInOut',
  ): Promise<void> {
    const from = this.position.clone();
    const to = new Vector3(pos.x, pos.y, pos.z);
    return this.tweens.toAsync(0, 1, {
      durationMs: ms,
      easing,
      onUpdate: (t) => {
        this.position.lerpVectors(from, to, t);
      },
    });
  }

  /**
   * Turn the fighter: 1 = toward +x, -1 = toward -x.
   *
   * This is the direction the *body* faces, not a mirror instruction. Whether
   * the plane ends up flipped depends on which way the painting itself faces
   * ({@link setArtFacing} and each pose's sidecar), so art that is already
   * correct for its side is drawn exactly as painted.
   */
  setFacing(dir: 1 | -1): void {
    this.facing = dir;
    this.applyMirror();
  }

  /** {@link setFacing} from the team: party and aeons +x, enemies -x. */
  setSide(side: ActorSide): void {
    this.setFacing(facingForSide(side));
  }

  /** Declare which way this subject's paintings face. See {@link ArtFacing}. */
  setArtFacing(art: ArtFacing): void {
    this.artFacing = art;
    this.applyMirror();
  }

  get facingDir(): 1 | -1 {
    return this.facing;
  }

  get artFacingDir(): ArtFacing {
    return this.artFacing;
  }

  // ------------------------------------------------------------ interim turn

  /**
   * Set this actor's interim turn, in degrees — how far a still-frontal
   * painting's plane is yawed toward the enemy. 0 leaves it flat to camera.
   *
   * The *sign* is not this: which way the plane turns comes from the body's
   * facing (party +x, enemies -x), and a pose whose sidecar already says
   * `right` or `left` is left flat however large this is, because it was
   * painted turned and turning it again makes a profile. See
   * {@link import('./BattlePresenterActors.ts').interimYawFor}.
   */
  setInterimYaw(deg: number): void {
    this.interimYaw = Number.isFinite(deg) ? Math.abs(deg) : 0;
  }

  /** This actor's interim turn, in degrees. */
  get interimYawDeg(): number {
    return this.interimYaw;
  }

  /** The yaw actually on the planes right now, in degrees. Debug + tests. */
  get yawDeg(): number {
    return this.appliedYaw;
  }

  /** Where the yaw is easing to, in degrees: the rule, clamped to the camera. */
  private yawTarget(): number {
    if (!interimYawOn || this.interimYaw === 0) return 0;
    const art = this.slots[this.active]!.meta.facing ?? this.artFacing;
    const want = interimYawFor(art, this.facing, this.interimYaw);
    if (want === 0) return 0;
    return this.viewAzimuth === null ? want : clampYawToCamera(want, this.viewAzimuth);
  }

  /** Where the camera lies from here, as a yaw in degrees. From the renderer. */
  private noteViewCamera(camera: Camera): void {
    const here = this.getWorldPosition(yawScratchA);
    const eye = camera.getWorldPosition(yawScratchB);
    const dx = eye.x - here.x;
    const dz = eye.z - here.z;
    if (dx === 0 && dz === 0) return;
    this.viewAzimuth = Math.atan2(dx, dz) * RAD2DEG;
  }

  /** -1 when this pose has to be flipped to face the way the body is turned. */
  private mirrorOf(meta: PoseMeta): 1 | -1 {
    return mirrorFor(meta.facing ?? this.artFacing, this.facing);
  }

  /** True when the plane on screen is drawn mirrored. Debug + tests. */
  get mirrored(): boolean {
    return this.mirrorOf(this.slots[this.active]!.meta) === -1;
  }

  private placeSlot(slot: PlaneSlot): void {
    placePlane(slot.mesh, slot.scale, slot.meta, this.proneShift);
  }

  /** Slide a prone body along the floor, world units (`ProneLay` picks it). */
  setProneShift(dx: number): void {
    this.proneShift = dx;
    for (const slot of this.slots) this.placeSlot(slot);
  }

  private applyMirror(): void {
    for (const slot of this.slots) {
      slot.mesh.scale.x = Math.abs(slot.mesh.scale.x) * this.mirrorOf(slot.meta);
      this.placeSlot(slot);
    }
    // The rim direction is in the painting's own space, so it follows the
    // mirror, not the body: flipping the plane flips where its light comes from.
    const m = this.mirrorOf(this.slots[this.active]!.meta);
    this.u.rimDir.value.set(this.rimDirBase.x * m, this.rimDirBase.y);
  }

  setBrightness(mult: number): void {
    this.u.brightness.value = this.baseBrightness * mult;
  }

  setTint(colour: number | string): void {
    this.baseTint.set(colour as never);
    this.syncTint();
  }

  /** Petrified, 0..1: drained of colour and tinted stone, beside (never fighting) {@link setDim}. */
  setStone(k: number): void {
    this.stoneAmount = clamp01(k);
    this.u.desaturate.value = Math.max(this.dimAmount, this.stoneAmount);
    this.syncTint();
  }

  /** Drive the rim light from the scene's light rig. */
  setRimLight(colour: number | string, strength: number, dir?: [number, number]): void {
    this.u.rimColor.value.set(colour as never);
    this.u.rimStrength.value = strength;
    if (dir) {
      this.rimDirBase.set(dir[0], dir[1]);
      this.applyMirror();
    }
  }

  /** Ground-bounce colour added into the lower half of the figure. */
  setBounceLight(colour: number | string, strength: number): void {
    this.u.bounceColor.value.set(colour as never);
    this.u.bounceStrength.value = strength;
  }

  /** World-space point at the top of the figure — VFX and damage numbers. */
  headPoint(out = new Vector3()): Vector3 {
    return out.set(this.position.x, this.position.y + this.aimHeight * 0.92, this.position.z);
  }

  /**
   * World point of a spot on the painting on screen, through the live plane:
   * `u` across from the painting's left edge, `t` down from its top, both 0..1.
   * The plane's offset, mirror, lunge, KO tilt and bob all come with it. Used
   * to pin a figure-less part to its parent's painting (`PartAnchors.ts`).
   */
  paintPoint(u: number, t: number, out = new Vector3()): Vector3 {
    const slot = this.slots[this.active]!;
    slot.mesh.updateWorldMatrix(true, false);
    return out.set(u - 0.5, 0.5 - t, 0).applyMatrix4(slot.mesh.matrixWorld);
  }

  /** World-space point at mid-torso. */
  centerPoint(out = new Vector3()): Vector3 {
    return out.set(this.position.x, this.position.y + this.aimHeight * 0.52, this.position.z);
  }

  get height(): number {
    return this.worldHeight;
  }

  /** True while the pose on screen is a downed (wider-than-tall) painting. */
  get isProne(): boolean {
    return this.slots[this.active]!.scale.prone;
  }

  /** World size of the plane currently showing — `[width, height]`. */
  get poseSize(): [number, number] {
    const s = this.slots[this.active]!.scale;
    return [Math.abs(s.width), s.height];
  }

  /** 0 while standing, 1 once a prone pose has fully crossfaded in. */
  private proneWeight(): number {
    let total = 0;
    let prone = 0;
    for (const slot of this.slots) {
      if (slot.fade <= 0) continue;
      total += slot.fade;
      if (slot.scale.prone) prone += slot.fade;
    }
    return total > 0 ? prone / total : 0;
  }

  /** Footprint radius blended across the crossfade, in world units. */
  private footprintRadius(): number {
    let total = 0;
    let sum = 0;
    for (const slot of this.slots) {
      if (slot.fade <= 0) continue;
      total += slot.fade;
      sum += slot.scale.footprint * slot.fade;
    }
    return total > 0 ? sum / total : 0;
  }

  /**
   * The height VFX should aim at: the standing height normally, but the top of
   * the actual plane once the figure is on the ground — a damage number over a
   * KO'd character belongs just above the body, not where his head used to be.
   */
  private get aimHeight(): number {
    const slot = this.slots[this.active]!;
    return slot.scale.prone ? Math.max(0.2, slot.scale.topY) : this.worldHeight;
  }

  // ------------------------------------------------------------------- update

  /** @param dt seconds. Must be called every frame. */
  update(dt: number): void {
    this.tweens.update(dt);
    for (const s of this.slots) syncPaintedBloom(s.material, this.u.dissolve.value > 0, this.bloomMasked);
    this.clock += dt;

    // --- how much of what is on screen is a downed figure ------------------
    // Blended across the crossfade, so the standing idle's breathing eases out
    // as the KO painting eases in rather than stopping dead.
    const prone = this.proneWeight();
    // A body rolled onto its back ({@link lieDown}) is down too: no breath, lean or crouch.
    const upright = (1 - prone) * (1 - this.lieRoll);

    // --- life: posture eases toward whatever state we are in ---------------
    this.life?.update(dt);
    const p = this.life?.posture;
    const lean = p ? p.lean * this.worldHeight : 0;
    const crouch = p ? p.crouch * this.worldHeight : 0;
    const tilt = p ? p.tilt : 0;

    // --- stack the motion layers into one transform ------------------------
    // Breathing runs on its own phase accumulator rather than off the clock, so
    // a fighter holding their breath to guard — and letting it go again — eases
    // between tempos instead of jumping a quarter-cycle.
    this.breathPhase += dt * this.breatheSpeed * (p ? p.tempo : 1);
    const breatheAmp = this.breatheAmp * upright * (p ? p.breathe : 1);
    const breathe = breatheAmp ? Math.sin(this.breathPhase * TAU) * 0.5 + 0.5 : 0;
    const breatheScale = 1 + breatheAmp * (breathe - 0.5) * 2;

    const squashY = 1 - 0.18 * this.squashAmount;
    const squashX = 1 + 0.14 * this.squashAmount;

    this.inner.scale.set(squashX, breatheScale * squashY, 1);

    const hover =
      this.hoverHeight +
      (this.hoverBobAmp
        ? Math.sin(this.clock * this.hoverBobSpeed * TAU) * this.hoverBobAmp
        : 0);

    // The lean rides with the lunge: both are "forward" for this fighter, and
    // forward is the body's facing, never the mirror.
    let ox = (this.lungeOffset + this.recoilOffset + lean * upright) * this.facing;
    let oy =
      this.hopHeight + hover - (crouch + this.fallDrop * this.worldHeight * 0.05) * upright;

    if (this.shakeLeftMs > 0) {
      this.shakeLeftMs -= dt * 1000;
      const k = Math.max(0, this.shakeLeftMs / this.shakeTotalMs);
      this.shakePhase += dt * 62;
      ox += Math.sin(this.shakePhase) * this.shakeAmp * k;
      oy += Math.sin(this.shakePhase * 1.63) * this.shakeAmp * k * 0.42;
    }

    const lie = this.lieRoll * LIE_ANGLE * this.facing;
    const [lieDx, lieLift, lieDz] = this.lieOffset(lie);
    ox += lieDx;
    oy += lieLift;
    this.inner.position.set(ox, oy, lieDz);
    // Sway is a standing figure's weight shifting; on a body lying down it only
    // wobbles the painting and shows the corners of the PNG's rectangle.
    const swayAmp = this.swayAmp * upright;
    const sway = swayAmp ? Math.sin(this.clock * this.swaySpeed * TAU) * swayAmp : 0;
    // Posture tilt is a *body* rotation (forward = the way the fighter is
    // turned, so it carries the facing), kept small and faded out with the pose.
    const bodyTilt = (tilt + this.fallTilt * 0.3) * upright * -this.facing;
    this.inner.rotation.z = sway + bodyTilt + lie;
    this.inner.rotation.x = -LIE_TILT * this.lieRoll;

    // --- the interim turn --------------------------------------------------
    // The plane yawed toward the enemy, for art not yet repainted turned. It
    // rides on `inner` (both planes only: the shadow and turn ring stay flat on
    // the ground), and the lunge is applied after it, so "forward" stays world
    // ±x. Faded out with `upright` and the roll: a prone or lying painting is a
    // *wide* plane, and swinging one in depth shows the corners of its PNG.
    const yawWanted = this.yawTarget() * upright;
    if (this.yawPrimed) {
      this.appliedYaw = approach(this.appliedYaw, yawWanted, YAW_TAU, dt);
    } else {
      // The field opens already turned: nobody swings into their stance on the
      // first half-second of a battle (or mid-swing in a frame-2 capture).
      this.yawPrimed = true;
      this.appliedYaw = yawWanted;
    }
    this.inner.rotation.y = this.appliedYaw * DEG2RAD;

    // --- turn highlight ----------------------------------------------------
    if (this.turnRing) {
      const k = clamp01(this.ringOverride ?? (p ? p.ring : 0));
      const visible = k > 0.01 && this._alpha > 0.02;
      this.turnRing.visible = visible;
      if (visible) {
        const pulse = 0.82 + Math.sin(this.clock * 1.7) * 0.18;
        const r = this.ringBaseRadius * (0.93 + 0.07 * k) * (1 + 0.025 * pulse);
        this.turnRing.scale.set(r, r * 0.46, 1);
        const rm = this.turnRing.material as MeshBasicMaterial;
        rm.opacity = this.ringBaseOpacity * k * pulse * this._alpha;
      }
    }

    // --- selection accent --------------------------------------------------
    // Eased rather than switched, because the cursor moves between enemies on
    // every arrow press and a pool that pops on and off at 12 Hz is a strobe.
    if (this.accent) {
      this.accentLevel = approach(this.accentLevel, this.accentWanted, 0.075, dt);
      const visible = this.accentLevel > 0.01 && this._alpha > 0.02;
      this.accent.visible = visible;
      if (visible) {
        // A slow breathe, distinct from the turn ring's faster pulse, so the
        // two marks are still told apart when they land on the same figure.
        const pulse = 0.86 + Math.sin(this.clock * 2.4) * 0.14;
        if (this.levitates) {
          const r = Math.max(0.6, this.worldHeight * 0.62) * (0.97 + 0.05 * pulse);
          this.accent.scale.set(r, r, 1);
        } else {
          const r = Math.max(0.55, this.footprintRadius() * 1.35, this.worldHeight * 0.4);
          this.accent.scale.set(r * (1 + 0.03 * pulse), r * 0.44 * (1 + 0.03 * pulse), 1);
          this.accent.position.x = ox * 0.55;
          // On the floor even when the station lifts the figure (the Yu Pagodas stand at y 1.01): PR-0031.
          this.accent.position.y = 0.026 - this.position.y;
        }
        (this.accent.material as MeshBasicMaterial).opacity =
          0.72 * this.accentLevel * pulse * this._alpha;
      }
    }

    // --- contact shadow reacts to squash and hop ---------------------------
    if (this.shadow) {
      const lift = Math.min(1, (this.hopHeight + hover) / Math.max(0.001, this.worldHeight * 0.6));
      // Follow the pose's footprint: a body on the ground casts a long, flat
      // shadow under its whole length, not the standing figure's small disc.
      const base = Math.max(this.shadowBaseRadius, this.footprintRadius());
      const r = base * (1 + this.squashAmount * 0.3) * (1 - lift * 0.42);
      // The wider the footprint, the flatter the blob, so a prone shadow does
      // not balloon into a circle the size of the body's length.
      const squash = this.shadowSquash * (this.shadowBaseRadius / Math.max(1e-4, base)) ** 0.5;
      this.shadow.scale.set(r, r * Math.min(this.shadowSquash, squash), 1);
      this.shadow.position.x = ox * 0.55;
      const sm = this.shadow.material as MeshBasicMaterial;
      sm.opacity = this.shadowBaseOpacity * this._alpha * (1 - lift * 0.5);
    }
  }

  // ----------------------------------------------------------------- teardown

  override dispose(): void {
    this.tweens.killAll();
    for (const slot of this.slots) {
      slot.mesh.geometry.dispose();
      slot.material.dispose();
      slot.depth?.dispose();
    }
    // Only textures this actor loaded itself; borrowed ones may still be in
    // use by whoever lent them. The `Set` also collapses the several pose
    // names that share one texture when a state falls back to `idle`.
    for (const tex of this.owned) tex.dispose();
    this.owned.clear();
    this.poses.clear();
    if (this.shadow) {
      this.shadow.geometry.dispose();
      (this.shadow.material as MeshBasicMaterial).dispose();
    }
    if (this.turnRing) {
      this.turnRing.geometry.dispose();
      (this.turnRing.material as MeshBasicMaterial).dispose();
    }
    if (this.accent) {
      this.accent.geometry.dispose();
      (this.accent.material as MeshBasicMaterial).dispose();
      this.accent = null;
    }
    this.removeFromParent();
  }
}
