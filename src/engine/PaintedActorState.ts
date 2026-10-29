/**
 * The state of a painted actor that starts at rest: the tween group, the pose maps, the motion, life and accent fields, and everything else with an initial value.
 *
 * `PaintedActor` was one 2,700-line class. It is now a chain of classes, one responsibility each, every layer calling only the layers below it:
 * `PaintedActorState` (the fields that start at rest) -> `PaintedActorBase` (the other fields, the constructor) -> `PaintedActorPlacement` -> `PaintedActorSizing` -> `PaintedActorEffects` -> `PaintedActorLife` -> `PaintedActorPoses` -> `PaintedActorReaders` -> `PaintedActor`
 * (import that one from `PaintedActor.ts`). A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 * The constructor calls eight methods that live in later layers; `PaintedActorBase` declares them abstract.
 */

import { Color, Group, Matrix4, Mesh, Vector2, type Texture } from 'three';
import type { PaintedSubject, PaintedTexture, PoseMeta } from './PaintedArt.ts';
import { HeadLockStats } from './HeadLock.ts'; // D-510: the engine keeps the head steady
import { ShadowFollow } from './feel/ContactShadow.ts'; // `?shadow=follow` (demo chapters, off by default): the contact shadow stays under the feet
import { TweenGroup, type Tween } from './Tween.ts';
import { CurveDriver } from './motion/CurveDriver.ts'; // motion pass (lane "core"): the new curves; idle unless the presenter starts one (default OFF, `motion/CurvesSwitch.ts`)
import { HitReaction, type HitOffset } from './motion/HitReaction.ts'; // MF-03: the struck figure's ramped rattle or directional knock-back (`?hit=`); idle by default
import { StringStance } from './motion/StringStance.ts';
import type { PoseMap, HeadRef } from './PaintedActorTypes.ts';
import { HURT_TINT, LIE_TILT } from './PaintedActorKit.ts';
import { PoseClaims } from './PoseStream.ts'; // load diet: which pose set owns a pose name, so a late painting of a replaced set is dropped

export abstract class PaintedActorState extends Group {
  readonly tweens = new TweenGroup();

  /** Set by {@link PaintedActor.fromSubject}: what the loader actually found. */
  subject: PaintedSubject | null = null;

  /** Inner group carrying every procedural motion layer. */
  protected readonly inner = new Group();

  protected active = 0;

  /** W5: how the last pose change under `?swap=aligned` was made (`dissolve` or `aligned`); read by the tests and the capture. */
  swapPolicyLast: 'dissolve' | 'aligned' | null = null;

  protected readonly poses = new Map<string, PaintedTexture>();

  /** Set by `dispose`: a pose that lands after it (`PaintedActorPoses.installLate`) is freed, not installed. */
  protected streamDead = false;

  /** Load diet (review M1): the pose set that installed each name last; a late pose installs only while its own set still holds the name (`PaintedActorPoses.installLate`). */
  protected readonly claims = new PoseClaims();

  readonly poseUrls: PoseMap = {};

  /**
   * Textures this actor loaded itself, and is therefore responsible for
   * freeing. Textures that arrived through {@link adoptPoses} are *borrowed* —
   * another actor may still be drawing them — so they are never disposed here.
   */
  protected readonly owned = new Set<Texture>();

  /** The selection accent is the upright halo (a lifted or levitating figure), not the floor pool. */
  protected accentHalo = false;

  protected readonly shadowAir = new ShadowFollow();

  /**
   * The pose whose pixel scale every other pose inherits — idle, normally.
   * `null` until a real (non-placeholder) pose set has loaded, which is exactly
   * when each pose should fall back to sizing itself.
   */
  protected reference: PoseMeta | null = null;

  /** World units per pixel of {@link PaintedActor.reference}'s own plane: what every other pose's stance is lined up against. */
  protected referenceUpp = 0;

  /**
   * D-510 (`HeadLock.ts`): the idle's head box, its sizing and its art subject: what every other pose's head is held to on screen.
   * Null when there is nothing to hold it to (no registered head on the idle, a reference that lies down, a per-pose pixel shift).
   */
  protected headRef: HeadRef | null = null;

  /** The view-projection `holdHead` last saw, so a plane re-pointed between two frames is sized at once and never drawn unlocked. */
  protected readonly headView = new Matrix4();

  protected headViewed = false;

  /** What the head lock did, and every time its band bit (`holdHead`; read by the harness and the tests). */
  readonly headLock = new HeadLockStats();

  /** World facing: which way this fighter is turned. Never mirrors on its own. */
  protected facing: 1 | -1 = 1;

  /** The eased, applied yaw in degrees — what is on `inner.rotation.y`. */
  protected appliedYaw = 0;

  /**
   * Which way the camera lies from this figure, as a yaw in degrees
   * (`atan2(dx, dz)`), harvested in `onBeforeRender` so the actor never has to
   * be handed a camera. Null until the first frame has rendered.
   */
  protected viewAzimuth: number | null = null;

  /** False until the first `update`, which lands the yaw rather than easing it. */
  protected yawPrimed = false;

  protected _alpha = 1;

  // --- motion layers --------------------------------------------------------
  protected clock = Math.random() * 100;

  protected lungeOffset = 0;

  protected recoilOffset = 0;

  protected hopHeight = 0;

  protected squashAmount = 0;

  /** The new curves' channels (strike, cast lift, leap), summed; all at rest unless started. */
  protected readonly curves = new CurveDriver();

  protected readonly squashScratch = { x: 1, y: 1 };

  protected readonly lightPins = new Set<string>(); // the normal maps this figure pinned (`prefetchLights`)

  /** Motion pass, step 3: the victory cheer. `cheerDue` is set by the victory cue inside `enterLife`; `cheerWait` holds the victory painting back until the spring's fastest frame. */
  protected cheerDue = false;

  protected cheering = false;

  protected cheerWait: { name: string; opts?: { immediate?: boolean; force?: boolean } } | null = null;

  protected shakeAmp = 0;

  protected shakeLeftMs = 0;

  protected shakeTotalMs = 1;

  protected shakePhase = 0;

  protected readonly hit = new HitReaction();

  protected readonly hitOut: HitOffset = { x: 0, y: 0, sy: 1 };

  protected rimDirBase = new Vector2(-1, 0.32);

  /** The one live flash decay, so a second flash cannot fight the first. */
  protected flashTween: Tween | null = null;

  /** The pose name that was *asked* for, before any fallback, and the painting it was drawn with when that differs (MF-05: `setPose('ready', { paint: 'idle' })`, the ready stance on the idle painting). */
  protected requested = ''; protected requestedPaint: string | undefined;

  /** Extra tilt and drop the KO fall (and the revive rise) contribute. */
  protected fallTilt = 0;

  protected fallDrop = 0;

  /**
   * How much of that tilt and drop shows, 0 to 1 (default 1). KO COLLAPSE (`fx/mix/living.ts`) takes it to 0 while the standing plane is toppled by `KoTip`
   * (the topple is the rotation: the tilt would double it) and for a cross with no buckle (a standing painting already prone), and puts it back when the run ends.
   */
  fallGain = 1;

  /** 0 standing, 1 lying on its back ({@link lieDown}). */
  protected lieRoll = 0;

  /** The tip back while lying, radians ({@link lieDown}). */
  protected lieTilt = LIE_TILT;

  protected proneShift = 0;

  /** 0..1 damage tint, lerped from `baseTint` toward {@link HURT_TINT}. */
  protected hurtTint = 0;

  protected readonly hurtTintColour = new Color(HURT_TINT);

  protected readonly tintScratch = new Color();

  /** Set while {@link flinch} owns the pose, so it never fights a real change. */
  protected flinchToken = 0;

  /** Suppresses the `hurt` life state re-entering its own flinch. */
  protected flinching = false;

  protected readonly stance = new StringStance(); // MF-12 (`?hurtstring=hold`): the stance a held string of blows hands back

  /** Hand control of the ring, or null to leave it to the life layer. */
  protected ringOverride: number | null = null;

  /**
   * The selection accent — see {@link setSelectAccent}. Built on first use, so
   * an actor that is never targeted (a cutscene figure, a diorama demo) never
   * allocates a mesh or a material for it.
   */
  protected accent: Mesh | null = null;

  protected accentWanted = 0;

  /** Eased 0..1, so the pool fades in rather than snapping on. */
  protected accentLevel = 0;

  protected readonly accentColour = new Color(0xf2c21e);

  protected dimAmount = 0;

  protected stoneAmount = 0;

  /** Breathing phase in cycles, so a tempo change never snaps the chest. */
  protected breathPhase = Math.random();

  protected fallDue = false; // MF-09: a KO's landing is still to play (`fall` sets it, `landFall` takes it)

  protected landHeld = false; // MF-09/17: the KO run owns the landing; the fall tween's end leaves it alone
}
