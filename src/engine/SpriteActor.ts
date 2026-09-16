/**
 * RETIRED — the pixel-art path.
 *
 * The game renders painted 2.5D (`src/engine/PaintedActor.ts`, backdrops and
 * character PNGs generated through `docs/ART-PIPELINE.md`). Nothing here is
 * reachable from `src/main.ts`; `node tools/orphans.mjs` lists this file as an
 * orphan by design. Kept for reference only — do not extend it, and do not
 * build new work against it.
 */
import {
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PlaneGeometry,
  SRGBColorSpace,
  ShaderMaterial,
  Vector3,
  type Camera,
} from 'three';
import { makeBlobShadow } from './BlobShadow.ts';
import { spriteFragmentShader, spriteVertexShader } from './shaders/SpriteShader.ts';
import { Easing, TweenGroup, type EasingFn, type EasingName } from './Tween.ts';

/** 1 logical sprite pixel = this many world units. */
export const LOGICAL_PIXEL = 0.03;

export interface SpriteStateOptions {
  /** Milliseconds per frame; ignored where `durations` supplies a value. */
  durationMs?: number;
  /** Per-frame durations in ms, index-aligned with the frame list. */
  durations?: number[];
  /** Default true. A non-looping state holds its last frame. */
  loop?: boolean;
  /** State to fall through to when a non-looping state finishes. */
  next?: string;
}

export interface SpriteActorOptions {
  /** Debug/lookup name; also set on the Group. */
  name?: string;
  /** World units per logical sprite pixel. Default {@link LOGICAL_PIXEL}. */
  logicalPixelSize?: number;
  /** 'feet' puts the group origin on the ground line (default), 'center' centres it. */
  anchor?: 'feet' | 'center';
  /**
   * Empty logical pixels between the sprite's feet line and the bottom edge of
   * its canvas. Only used with `anchor: 'feet'`: the plane is sunk by this much
   * so the feet, not the canvas edge, land on the ground. `SpriteDef` authors
   * get this for free via `buildSpriteActorInput`, which derives it from
   * `size[1] - anchor[1]`.
   */
  anchorOffsetPx?: number;
  /** State to play on creation. Defaults to 'idle', else the first state given. */
  initialState?: string;
  /** Default milliseconds per frame when a state does not override it. */
  frameDurationMs?: number;
  /** Per-state playback options. */
  states?: Record<string, SpriteStateOptions>;
  /** Blob shadow; pass false to omit. */
  shadow?: boolean | { radiusPx?: number; opacity?: number; color?: number };
  /** Face +x ("right", default) or -x. Flips the billboard horizontally. */
  facing?: 1 | -1;
  /** Billboard toward the camera each render. Default true. */
  billboard?: boolean;
  /** Extra brightness multiplier, e.g. to sit a sprite into a dark scene. */
  brightness?: number;
}

interface CompiledState {
  frames: CanvasTexture[];
  durations: number[];
  loop: boolean;
  next: string | undefined;
  widthPx: number;
  heightPx: number;
}

/**
 * A billboarded pixel-art actor: one textured plane, a blob shadow, and a tiny
 * animation state machine. See `docs/ENGINE-API.md` for the contract the sprite
 * pipeline builds against.
 */
export class SpriteActor extends Group {
  readonly plane: Mesh;
  readonly shadow: Mesh | null;
  readonly tweens = new TweenGroup();

  /** Inner group carrying shake / hop offsets so `position` stays authoritative. */
  private readonly inner = new Group();
  private readonly material: ShaderMaterial;
  private readonly states = new Map<string, CompiledState>();
  private readonly pxSize: number;
  private readonly anchor: 'feet' | 'center';
  private readonly anchorOffsetPx: number;
  private readonly billboard: boolean;
  private readonly baseBrightness: number;

  private current: CompiledState | null = null;
  private currentName = '';
  private frameIndex = 0;
  private frameClock = 0;
  private stateDone = false;
  private onStateComplete: (() => void) | null = null;

  private shakeAmpPx = 0;
  private shakeLeftMs = 0;
  private shakeTotalMs = 1;
  private shakePhase = 0;

  private _alpha = 1;

  private constructor(opts: SpriteActorOptions) {
    super();
    this.name = opts.name ?? 'sprite';
    this.pxSize = opts.logicalPixelSize ?? LOGICAL_PIXEL;
    this.anchor = opts.anchor ?? 'feet';
    this.anchorOffsetPx = opts.anchorOffsetPx ?? 0;
    this.billboard = opts.billboard !== false;
    this.baseBrightness = opts.brightness ?? 1;

    this.material = new ShaderMaterial({
      uniforms: {
        map: { value: null },
        opacity: { value: 1 },
        brightness: { value: this.baseBrightness },
        tintColor: { value: new Color(0xffffff) },
        tintAmount: { value: 0 },
        flipX: { value: opts.facing === -1 ? 1 : 0 },
      },
      vertexShader: spriteVertexShader,
      fragmentShader: spriteFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: DoubleSide,
    });

    this.plane = new Mesh(new PlaneGeometry(1, 1), this.material);
    this.plane.frustumCulled = false;
    this.plane.renderOrder = 10;
    this.inner.add(this.plane);
    this.add(this.inner);

    this.shadow =
      opts.shadow === false
        ? null
        : makeBlobShadow(typeof opts.shadow === 'object' ? opts.shadow : {}, this.pxSize);
    if (this.shadow) this.add(this.shadow);

    if (this.billboard) {
      this.plane.onBeforeRender = (_r, _s, camera: Camera): void => {
        this.faceCamera(camera);
      };
    }
  }

  /**
   * Build an actor from pre-rasterised canvases.
   *
   * @param frames state name -> ordered frame canvases (all frames of one state
   *   must share dimensions; different states may differ).
   */
  static fromCanvases(
    frames: Record<string, HTMLCanvasElement[]>,
    opts: SpriteActorOptions = {},
  ): SpriteActor {
    const actor = new SpriteActor(opts);
    const defaultDur = opts.frameDurationMs ?? 160;

    for (const [stateName, canvases] of Object.entries(frames)) {
      if (!canvases.length) continue;
      const cfg = opts.states?.[stateName] ?? {};
      const textures = canvases.map((c) => {
        const tex = new CanvasTexture(c);
        tex.colorSpace = SRGBColorSpace;
        tex.magFilter = NearestFilter;
        tex.minFilter = NearestFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
        return tex;
      });
      const per = cfg.durationMs ?? defaultDur;
      const durations = canvases.map((_, i) => cfg.durations?.[i] ?? per);
      const first = canvases[0]!;
      actor.states.set(stateName, {
        frames: textures,
        durations,
        loop: cfg.loop !== false,
        next: cfg.next,
        widthPx: first.width,
        heightPx: first.height,
      });
    }

    const initial =
      opts.initialState ?? (actor.states.has('idle') ? 'idle' : [...actor.states.keys()][0]);
    if (initial) actor.setState(initial, { restart: true });
    return actor;
  }

  // ---------------------------------------------------------------- animation

  /** Name of the state currently playing. */
  get state(): string {
    return this.currentName;
  }

  /** Every state this actor knows. */
  get stateNames(): string[] {
    return [...this.states.keys()];
  }

  setState(name: string, opts?: { restart?: boolean; onComplete?: () => void }): void {
    const next = this.states.get(name);
    if (!next) return;
    if (this.currentName === name && !opts?.restart) {
      if (opts?.onComplete) this.onStateComplete = opts.onComplete;
      return;
    }
    this.current = next;
    this.currentName = name;
    this.frameIndex = 0;
    this.frameClock = 0;
    this.stateDone = false;
    this.onStateComplete = opts?.onComplete ?? null;
    this.applyFrame();
  }

  private applyFrame(): void {
    const st = this.current;
    if (!st) return;
    const tex = st.frames[Math.min(this.frameIndex, st.frames.length - 1)];
    if (tex) this.material.uniforms['map']!.value = tex;

    const w = st.widthPx * this.pxSize;
    const h = st.heightPx * this.pxSize;
    this.plane.scale.set(w, h, 1);
    this.plane.position.y =
      this.anchor === 'feet' ? h / 2 - this.anchorOffsetPx * this.pxSize : 0;
  }

  // ------------------------------------------------------------------ effects

  /** Blend the sprite toward `colour` and back over `ms`. */
  flash(colour: number | string = 0xffffff, ms = 180): void {
    (this.material.uniforms['tintColor']!.value as Color).set(colour as never);
    this.tweens.to(1, 0, {
      durationMs: ms,
      easing: 'quadOut',
      onUpdate: (v) => {
        this.material.uniforms['tintAmount']!.value = v;
      },
    });
  }

  /** Jitter the sprite by up to `px` logical pixels for `ms`, damping out. */
  shake(px = 4, ms = 260): void {
    this.shakeAmpPx = px;
    this.shakeLeftMs = ms;
    this.shakeTotalMs = Math.max(1, ms);
    this.shakePhase = Math.random() * Math.PI * 2;
  }

  /** Tween overall opacity (sprite + shadow). */
  fadeTo(alpha: number, ms = 300, easing: EasingName | EasingFn = 'quadInOut'): Promise<void> {
    return this.tweens.toAsync(this._alpha, alpha, {
      durationMs: ms,
      easing,
      onUpdate: (v) => this.setAlpha(v),
    });
  }

  setAlpha(alpha: number): void {
    this._alpha = alpha;
    this.material.uniforms['opacity']!.value = alpha;
    const sm = this.shadow?.material as MeshBasicMaterial | undefined;
    if (sm) sm.opacity = (this.shadow!.userData['baseOpacity'] as number) * alpha;
  }

  get alpha(): number {
    return this._alpha;
  }

  /** Move the group to a world position over `ms`. */
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
        this.position.set(
          from.x + (to.x - from.x) * t,
          from.y + (to.y - from.y) * t,
          from.z + (to.z - from.z) * t,
        );
      },
    });
  }

  /** Flip the billboard horizontally. */
  setFacing(dir: 1 | -1): void {
    this.material.uniforms['flipX']!.value = dir === -1 ? 1 : 0;
  }

  /** Extra brightness on top of the constructor value. */
  setBrightness(mult: number): void {
    this.material.uniforms['brightness']!.value = this.baseBrightness * mult;
  }

  // ------------------------------------------------------------------- update

  /** @param dt seconds */
  update(dt: number): void {
    this.tweens.update(dt);
    this.advanceAnimation(dt);
    this.advanceShake(dt);
  }

  private advanceAnimation(dt: number): void {
    const st = this.current;
    if (!st || st.frames.length <= 1 || this.stateDone) return;
    this.frameClock += dt * 1000;
    let guard = 0;
    while (this.frameClock >= (st.durations[this.frameIndex] ?? 160) && guard++ < 64) {
      this.frameClock -= st.durations[this.frameIndex] ?? 160;
      if (this.frameIndex + 1 >= st.frames.length) {
        if (st.loop) {
          this.frameIndex = 0;
        } else {
          this.stateDone = true;
          const done = this.onStateComplete;
          this.onStateComplete = null;
          const next = st.next;
          done?.();
          if (next) this.setState(next, { restart: true });
          return;
        }
      } else {
        this.frameIndex++;
      }
      this.applyFrame();
    }
  }

  private advanceShake(dt: number): void {
    if (this.shakeLeftMs <= 0) {
      if (this.inner.position.x !== 0 || this.inner.position.y !== 0) {
        this.inner.position.set(0, 0, 0);
      }
      return;
    }
    this.shakeLeftMs -= dt * 1000;
    const k = Math.max(0, this.shakeLeftMs / this.shakeTotalMs);
    this.shakePhase += dt * 58;
    const amp = this.shakeAmpPx * this.pxSize * k;
    this.inner.position.x = Math.sin(this.shakePhase) * amp;
    this.inner.position.y = Math.sin(this.shakePhase * 1.7) * amp * 0.35;
  }

  private faceCamera(camera: Camera): void {
    const cam = camera.position;
    const dx = cam.x - this.position.x;
    const dz = cam.z - this.position.z;
    this.plane.rotation.set(0, Math.atan2(dx, dz), 0);
  }

  // ------------------------------------------------------------------ teardown

  override dispose(): void {
    this.tweens.killAll();
    for (const st of this.states.values()) for (const t of st.frames) t.dispose();
    this.states.clear();
    this.plane.geometry.dispose();
    this.material.dispose();
    if (this.shadow) {
      this.shadow.geometry.dispose();
      const m = this.shadow.material as MeshBasicMaterial;
      m.map?.dispose();
      m.dispose();
    }
    this.removeFromParent();
  }
}

/** Re-exported so scene code can use the same easing names as the engine. */
export { Easing };
