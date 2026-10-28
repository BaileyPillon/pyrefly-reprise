/**
 * The rest of the state of a painted actor (the fields its constructor assigns), and the constructor.
 *
 * `PaintedActor` was one 2,700-line class. It is now a chain of classes, one responsibility each, every layer calling only the layers below it:
 * `PaintedActorState` (the fields that start at rest) -> `PaintedActorBase` (the other fields, the constructor) -> `PaintedActorPlacement` ->`PaintedActorSizing` -> `PaintedActorEffects` -> `PaintedActorLife` -> `PaintedActorPoses` -> `PaintedActorReaders` -> `PaintedActor`
 * (import that one from `PaintedActor.ts`). A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 * The constructor calls eight methods that live in later layers; `PaintedActorBase` declares them abstract.
 */

import { AdditiveBlending, CircleGeometry, Color, Mesh, MeshBasicMaterial, Vector2, type Texture } from 'three';
import { ActorLife, facingForSide, INTERIM_YAW_DEG, type ArtFacing } from './BattlePresenterActors.ts';
import type { BaselineFitOptions, MatteOptions, PaintedTexture } from './PaintedArt.ts';
import { paintPlaceholderFigure } from './ProceduralArt.ts';
import { SmearDirector } from './motion/SmearDirector.ts'; // motion pass (lane "core", step 2): big pose changes cut inside a smear; idle unless `?smear=`/`?pack=demo` in a demo chapter (`motion/SmearSwitch.ts`)
import { PoseBlend, poseBlendShape } from './PoseBlend.ts';
import { demoMotionOn } from './motion/DemoMotion.ts'; // `?motion=demo` (conference demo; default off = exactly as before): the four hooks below
import type { PaintedActorOptions, PlaneSlot } from './PaintedActorTypes.ts';
import { noiseTexture, blobTexture, ringTexture, beatOffsetFor } from './PaintedActorKit.ts';
import { PaintedActorState } from './PaintedActorState.ts';

export abstract class PaintedActorBase extends PaintedActorState {
  readonly shadow: Mesh | null;

  protected readonly slots: [PlaneSlot, PlaneSlot];

  /** FB-1: the one pose blend this actor owns (`PoseBlend.ts`); it writes both planes' fades on the real clock (`update`'s `realDt`). */
  protected readonly blend: PoseBlend;

  protected worldHeight: number;

  protected readonly crossfadeMs: number;

  protected readonly poseShiftPx: Readonly<Record<string, number>> | undefined;

  protected readonly placeholderFactory: () => HTMLCanvasElement;

  protected readonly placeholderBaseline: number;

  protected readonly matte: MatteOptions;

  protected readonly fitBaseline: false | BaselineFitOptions;

  protected readonly hoverHeight: number;

  protected readonly hoverBobAmp: number;

  protected readonly hoverBobSpeed: number;

  protected shadowBaseRadius: number;

  protected readonly shadowBaseOpacity: number;

  protected readonly shadowSquash: number;

  protected readonly referencePose: string;

  protected readonly sizeFromReference: boolean;

  protected readonly extents: { maxExtent: number; minExtent: number; proneAspect: number };

  /** What this subject's paintings face when a sidecar does not say. */
  protected artFacing: ArtFacing;

  /** This actor's interim turn, in degrees. 0 = flat to camera. */
  protected interimYaw: number;

  protected baseBrightness: number;

  protected readonly castsShadow: boolean;

  /** False for a figure-less actor ({@link PaintedActorOptions.figure}). */
  protected readonly showFigure: boolean;

  protected readonly shadowAlphaTest: number;

  protected readonly bloomMasked: boolean;

  // shared uniform cells (one object per uniform, referenced by both planes)
  protected readonly u: {
    brightness: { value: number };
    tint: { value: Color };
    flashColor: { value: Color };
    flashAmount: { value: number }; flashFloorCut: { value: number };
    rimColor: { value: Color };
    rimStrength: { value: number };
    rimDir: { value: Vector2 };
    rimWidth: { value: number };
    bounceColor: { value: Color };
    bounceStrength: { value: number };
    dissolve: { value: number };
    dissolveColor: { value: Color };
    dissolveSweep: { value: number };
    groundShade: { value: number };
    desaturate: { value: number };
    alphaCut: { value: number };
    erode: { value: number };
    edgeFade: { value: number };
    edgeFadeBase: { value: number };
    edgeJag: { value: number };
    noiseMap: { value: Texture };
    smearAmt: { value: number }; smearStyle: { value: number }; smearVec: { value: Vector2 }; // the smear window (`motion/SmearApply.ts`); amount 0 = off
  };

  protected breatheAmp: number;

  protected breatheSpeed: number;

  protected swayAmp: number;

  protected swaySpeed: number;

  protected readonly smear: SmearDirector; // `RigActor` plays its own window on the same state

  // --- life ----------------------------------------------------------------
  /** Posture + state machine. Null when `life: false`. */
  protected readonly life: ActorLife | null;

  protected readonly baseTint: Color;

  protected readonly turnRing: Mesh | null;

  protected ringBaseRadius: number;

  protected readonly ringBaseOpacity: number;

  /** A stable per-name offset, so a party does not breathe (or cheer) in step. */
  protected readonly beatOffset: number;

  /** Which of the two pose-change lengths this figure had (`?motion=demo` re-times a swap per side, `motion/DemoBlend.ts`). */
  protected readonly blendSide: 'party' | 'foe';

  // The later layers implement these; the constructor below calls them.
  protected abstract demoIdle(breathes: boolean, sways: boolean): void;
  abstract setInterimYaw(deg: number): void;
  protected abstract makeSlot(renderOrder: number): PlaneSlot;
  protected abstract makeSmear(): SmearDirector;
  abstract setFacing(dir: 1 | -1): void;
  protected abstract makePlaceholderPose(url: string): PaintedTexture;
  protected abstract applyPose(slotIndex: number, name: string, tex: PaintedTexture): void;
  protected abstract syncOpacity(): void;

  constructor(opts: PaintedActorOptions = {}) {
    super();
    this.name = opts.name ?? 'painted-actor';
    this.worldHeight = opts.worldHeight ?? 1.8;
    this.crossfadeMs = opts.crossfadeMs ?? 120;
    this.poseShiftPx = opts.poseShiftPx;
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
    this.blendSide = opts.side === 'enemy' ? 'foe' : 'party';
    if (demoMotionOn() && (breathe || sway)) this.demoIdle(breathe !== null, sway !== null); // `?motion=demo`: a slow breath and a slight sway, each figure on a phase of its own (`motion/DemoIdle.ts`)

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
      flashAmount: { value: 0 }, flashFloorCut: { value: 0 },
      rimColor: { value: new Color(rim.color ?? 0xbfe0ff) },
      rimStrength: { value: rim.strength ?? 0 },
      rimDir: { value: this.rimDirBase.clone() },
      rimWidth: { value: rim.width ?? 3.2 },
      bounceColor: { value: new Color(opts.bounce?.color ?? 0xffd6a8) },
      bounceStrength: { value: opts.bounce?.strength ?? 0 },
      dissolve: { value: 0 },
      dissolveColor: { value: new Color(0x9dffc4) },
      dissolveSweep: { value: 0 },
      groundShade: { value: opts.groundShade ?? 0.24 },
      desaturate: { value: 0 },
      alphaCut: { value: opts.alphaCut ?? 0.02 },
      erode: { value: opts.erode ?? 0 },
      edgeFade: { value: opts.edgeFade ?? 0 },
      edgeFadeBase: { value: opts.edgeFadeBase === false ? 0 : 1 },
      edgeJag: { value: opts.edgeJag ?? 0 },
      noiseMap: { value: noiseTexture() },
      smearAmt: { value: 0 }, smearStyle: { value: 1 }, smearVec: { value: new Vector2() },
    };

    const renderOrder = opts.renderOrder ?? 10;
    this.castsShadow = opts.castShadow !== false;
    this.showFigure = opts.figure !== false;
    this.shadowAlphaTest = opts.shadowAlphaTest ?? 0.4;
    this.bloomMasked = opts.bloomMask !== false;
    this.slots = [this.makeSlot(renderOrder), this.makeSlot(renderOrder)];
    this.blend = new PoseBlend(this.slots, poseBlendShape()); // the plain dissolve; FB-2's stepped one only behind `?poseblend=stepped` (off by default since 2026-10-11)
    this.smear = this.makeSmear();
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

  /** REDUCE MOTION (D-285): no hit jitter while this answers true; set by `PaintedStage`. */
  still?: () => boolean;

  /** REDUCE FLASHES (PR-0032): {@link flash} runs through `flashRules.softActorFlash` while this answers true; set by `PaintedStage`. */
  softFlash?: () => boolean;
}
