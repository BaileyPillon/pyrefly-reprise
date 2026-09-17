import {
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
  type Texture,
} from 'three';
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
import { noiseCanvas, paintPlaceholderFigure, radialCanvas } from './ProceduralArt.ts';
import { paintedFragmentShader, paintedVertexShader } from './shaders/PaintedShader.ts';
import { TweenGroup, type EasingFn, type EasingName } from './Tween.ts';

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
  /** 1 faces +x, -1 mirrors the plane. */
  facing?: 1 | -1;
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

const TAU = Math.PI * 2;

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

  private facing: 1 | -1 = 1;
  private _alpha = 1;
  private baseBrightness: number;
  private readonly castsShadow: boolean;
  private readonly shadowAlphaTest: number;

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

    this.u = {
      brightness: { value: this.baseBrightness },
      tint: { value: new Color(opts.tint ?? 0xffffff) },
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
      alphaCut: { value: opts.alphaCut ?? 0.02 },
      edgeFade: { value: opts.edgeFade ?? 0 },
      noiseMap: { value: noiseTexture() },
    };

    const renderOrder = opts.renderOrder ?? 10;
    this.castsShadow = opts.castShadow !== false;
    this.shadowAlphaTest = opts.shadowAlphaTest ?? 0.4;
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

    this.setFacing(opts.facing ?? 1);

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
      depthWrite: false,
      depthTest: true,
      side: DoubleSide,
    });
    const mesh = new Mesh(new PlaneGeometry(1, 1), material);
    mesh.frustumCulled = false;
    mesh.renderOrder = renderOrder;
    mesh.visible = false;

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

  /** Crossfade to a pose. Unknown poses are ignored. */
  setPose(name: string, opts?: { immediate?: boolean; force?: boolean }): void {
    const next = this.poses.get(name);
    if (!next) return;
    if (this.pose === name && !opts?.force) return;

    const from = this.active;
    const to = from === 0 ? 1 : 0;
    this.applyPose(to, name, next);

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
    slot.mesh.visible = true;
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
    // pose's own orientation is painted into the texture. A prone figure is a
    // wide plane standing upright, not a tall plane tipped over.
    slot.mesh.rotation.set(0, 0, 0);
    slot.mesh.scale.set(scale.width * this.facing, scale.height, 1);
    slot.mesh.position.y = scale.offsetY;
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
      slot.mesh.visible = o > 0.001;
      // Only the dominant plane casts, so a crossfade never doubles the shadow.
      if (this.castsShadow) slot.mesh.castShadow = slot.fade > 0.5 && this._alpha > 0.3;
    }
  }

  // ------------------------------------------------------------------ effects

  /** Additive flash toward `colour`, decaying over `ms`. */
  flash(colour: number | string = 0xffffff, ms = 180, peak = 1): void {
    this.u.flashColor.value.set(colour as never);
    this.tweens.to(peak, 0, {
      durationMs: ms,
      easing: 'quadOut',
      onUpdate: (v) => {
        this.u.flashAmount.value = v;
      },
    });
  }

  /** Step forward along `facing` and settle back. */
  lunge(distance = 0.9, ms = 320): Promise<void> {
    const outMs = ms * 0.34;
    this.tweens.to(this.lungeOffset, distance, {
      durationMs: outMs,
      easing: 'cubicOut',
      onUpdate: (v) => {
        this.lungeOffset = v;
      },
    });
    return this.tweens.toAsync(distance, 0, {
      durationMs: ms - outMs,
      delayMs: outMs,
      easing: 'quadInOut',
      onUpdate: (v) => {
        this.lungeOffset = v;
      },
    });
  }

  /** Knocked back and springing home. */
  recoil(ms = 340, distance = 0.28): Promise<void> {
    return this.tweens.toAsync(1, 0, {
      durationMs: ms,
      easing: 'elasticOut',
      onUpdate: (v) => {
        this.recoilOffset = -v * distance;
      },
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

  /** Pyrefly dissolve: 0 = solid, 1 = gone. */
  dissolveTo(value: number, ms = 900, colour?: number | string): Promise<void> {
    if (colour !== undefined) this.u.dissolveColor.value.set(colour as never);
    return this.tweens.toAsync(this.u.dissolve.value, value, {
      durationMs: ms,
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

  /** Mirror the figure. Implemented as a negative plane scale.x. */
  setFacing(dir: 1 | -1): void {
    this.facing = dir;
    for (const slot of this.slots) {
      slot.mesh.scale.x = Math.abs(slot.mesh.scale.x) * dir;
    }
    this.u.rimDir.value.set(this.rimDirBase.x * dir, this.rimDirBase.y);
  }

  get facingDir(): 1 | -1 {
    return this.facing;
  }

  setBrightness(mult: number): void {
    this.u.brightness.value = this.baseBrightness * mult;
  }

  setTint(colour: number | string): void {
    this.u.tint.value.set(colour as never);
  }

  /** Drive the rim light from the scene's light rig. */
  setRimLight(colour: number | string, strength: number, dir?: [number, number]): void {
    this.u.rimColor.value.set(colour as never);
    this.u.rimStrength.value = strength;
    if (dir) {
      this.rimDirBase.set(dir[0], dir[1]);
      this.u.rimDir.value.set(dir[0] * this.facing, dir[1]);
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
    this.clock += dt;

    // --- how much of what is on screen is a downed figure ------------------
    // Blended across the crossfade, so the standing idle's breathing eases out
    // as the KO painting eases in rather than stopping dead.
    const prone = this.proneWeight();
    const upright = 1 - prone;

    // --- stack the motion layers into one transform ------------------------
    const breatheAmp = this.breatheAmp * upright;
    const breathe = breatheAmp ? Math.sin(this.clock * this.breatheSpeed * TAU) * 0.5 + 0.5 : 0;
    const breatheScale = 1 + breatheAmp * (breathe - 0.5) * 2;

    const squashY = 1 - 0.18 * this.squashAmount;
    const squashX = 1 + 0.14 * this.squashAmount;

    this.inner.scale.set(squashX, breatheScale * squashY, 1);

    const hover =
      this.hoverHeight +
      (this.hoverBobAmp
        ? Math.sin(this.clock * this.hoverBobSpeed * TAU) * this.hoverBobAmp
        : 0);

    let ox = (this.lungeOffset + this.recoilOffset) * this.facing;
    let oy = this.hopHeight + hover;

    if (this.shakeLeftMs > 0) {
      this.shakeLeftMs -= dt * 1000;
      const k = Math.max(0, this.shakeLeftMs / this.shakeTotalMs);
      this.shakePhase += dt * 62;
      ox += Math.sin(this.shakePhase) * this.shakeAmp * k;
      oy += Math.sin(this.shakePhase * 1.63) * this.shakeAmp * k * 0.42;
    }

    this.inner.position.set(ox, oy, 0);
    // Sway is a standing figure's weight shifting; rotating a body that is
    // already lying down just wobbles the whole painting, and on a wide plane
    // the corners swing far enough to show the PNG's rectangle.
    const swayAmp = this.swayAmp * upright;
    this.inner.rotation.z = swayAmp ? Math.sin(this.clock * this.swaySpeed * TAU) * swayAmp : 0;

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
    this.removeFromParent();
  }
}
