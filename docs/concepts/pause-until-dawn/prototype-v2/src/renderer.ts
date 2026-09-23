/**
 * WebGL2 renderer for the v3 living-portrait rig (art/rig.json `artMeta.v3`).
 *
 * Each key renders as one COMPLETE composite (`compose.ts`) over the plate's
 * own pinned body. v3.1 warped the two bracket keys onto interpolated
 * landmarks and cross-faded their paint by the rendered yaw. v3.2 splits the
 * two:
 *
 *   geometry  follows the rendered yaw (spring + a small wander) through the
 *             per-triangle mesh warp (`warp/`), carried by the chest and the
 *             head's own translation sway (the neck stretches between the jaw
 *             landmarks and the shoulder pins instead of sliding under them)
 *   paint     is ONE key, picked from the spring's base yaw with hysteresis
 *             (`paint.ts`), with a 0.2 s dissolve only when it changes
 *
 * so a held gaze is always exactly one painting (v3.1 left two paintings 10-90
 * percent mixed 78 percent of the time at a held 20-25 degrees). With no
 * motion at all (reduced motion, eyes open, centred) no mesh is used and the
 * rest pose is the plate itself (`?post=0` shows it live). Degrades to a no-op
 * when WebGL2 is missing (jsdom in tests/unit).
 */
import type { EyeState, MouthPatch, BrowPatch } from './face.ts';
import { type Rig, type RigKey, sortedKeys, bracketForYaw } from './rig.ts';
import { createFramebufferTarget, loadImage, type FrameBufferTarget } from './gl-utils.ts';
import { relightGainForYaw } from './light.ts';
import { PostPass } from './post.ts';
import { RIG_CONSTANTS } from './constants.ts';
import { LayerGL } from './gl-layer.ts';
import { readV3, loadArt, uploadTexture, type LoadedArt, type Tex } from './layers.ts';
import { LooseMotion, chestOffsetPx, headSwayPx, irisOffsetPx, yawNormFor, smootherstep, type Px } from './motion.ts';
import { WarpCache, type WarpPose } from './warp/cache.ts';
import { PaintSelector, type PaintState } from './paint.ts';
import { Composer, KEY_EPS, type Meshes, type Motions } from './compose.ts';

export interface RenderFrame {
  yawDeg: number;
  /** v3.2: the spring's yaw without the idle wander; the painted key is chosen from it (defaults to `yawDeg`). */
  baseYawDeg?: number;
  pitchNorm: number;
  eyeState: EyeState;
  eyeAperture: number;
  mouth: MouthPatch;
  mouthWeight: number;
  brow: BrowPatch;
  browWeight: number;
  timeSeconds: number;
  reducedMotion: boolean;
  chestSample: number;
  /** v3.2: the chest's horizontal sample (its own phase); 0 when absent. */
  chestSampleX?: number;
  /** v3.2: the head's own translation wander, unit-RMS [x, y]; zeros when absent. */
  headSample?: [number, number];
}

const BG: [number, number, number] = [0.03, 0.02, 0.03];
const NO_MESH: Meshes = { head: null, body: null };

export class Renderer {
  readonly ok: boolean;
  /** Debug (`?post=0`): skip the grade/grain/focus pass so the rest pose can be compared to the plate byte for byte. */
  debugNoPost = false;
  /** Debug (`?warp=0`): the v3 plain cross-dissolve, for a before/after of the mesh warp. */
  debugNoWarp = false;
  private readonly gl: WebGL2RenderingContext | null;
  private readonly rig: Rig;
  private readonly base: string;
  private readonly keysByYaw: RigKey[];
  private layers: LayerGL | null = null;
  private post: PostPass | null = null;
  private targets: FrameBufferTarget[] = [];
  private art: LoadedArt | null = null;
  private plate: Tex | null = null;
  private readonly loose = new LooseMotion();
  private readonly warps: WarpCache;
  private readonly paint: PaintSelector;
  private composer: Composer | null = null;
  private lastT: number | null = null;
  private lastPaint: PaintState | null = null;
  private width = 832;
  private height = 1216;

  constructor(canvas: HTMLCanvasElement, rig: Rig, assetBaseUrl: string) {
    this.rig = rig;
    this.base = assetBaseUrl;
    this.keysByYaw = sortedKeys(rig);
    this.warps = new WarpCache(rig);
    this.paint = new PaintSelector(this.keysByYaw);
    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: true });
    } catch {
      gl = null;
    }
    this.gl = gl;
    this.ok = gl !== null;
    if (!gl) return;
    this.width = canvas.width;
    this.height = canvas.height;
    this.layers = new LayerGL(gl, rig.canvas.width, rig.canvas.height);
    this.post = new PostPass(gl);
    this.targets = [0, 1, 2].map(() => createFramebufferTarget(gl!, this.width, this.height));
  }

  async load(): Promise<void> {
    const gl = this.gl;
    if (!gl) return;
    const v3 = readV3(this.rig.artMeta);
    if (v3) {
      this.art = await loadArt(gl, this.base, v3);
      this.composer = new Composer(this.layers!, this.art, (t, c) => this.bindTarget(t, c));
    } else {
      // No v3 art (the stand-in rig): show the plate itself, unmoving.
      const img = await loadImage(this.base + this.rig.bodyFile);
      this.plate = { tex: uploadTexture(gl, img), box: [0, 0, this.rig.canvas.width, this.rig.canvas.height] };
    }
  }

  resize(width: number, height: number): void {
    const gl = this.gl;
    if (!gl) return;
    this.width = width;
    this.height = height;
    for (const t of this.targets) {
      gl.deleteFramebuffer(t.fbo);
      gl.deleteTexture(t.tex);
    }
    this.targets = [0, 1, 2].map(() => createFramebufferTarget(gl, width, height));
  }

  private yawNorm(yawDeg: number): number {
    const min = this.keysByYaw[0]?.yawDeg ?? -RIG_CONSTANTS.yaw.maxDeg;
    const max = this.keysByYaw.at(-1)?.yawDeg ?? RIG_CONSTANTS.yaw.maxDeg;
    return yawNormFor(yawDeg, min, max);
  }

  /** `bg`: the opaque backdrop; `clear`: transparent (a premultiplied head pass); `keep`: draw on top. */
  private bindTarget(t: FrameBufferTarget | null, clear: 'bg' | 'clear' | 'keep' = 'bg'): void {
    const gl = this.gl!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.fbo : null);
    gl.viewport(0, 0, this.width, this.height);
    gl.disable(gl.BLEND);
    if (clear === 'keep') return;
    if (clear === 'bg') gl.clearColor(BG[0], BG[1], BG[2], 1);
    else gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  private keyById(id: string): RigKey {
    return this.keysByYaw.find((k) => k.id === id) ?? this.keysByYaw[0]!;
  }

  /** The pose's geometry: the bracket of the rendered yaw, carried by the chest and the head's sway. */
  private pose(yawDeg: number, chest: Px, head: Px): WarpPose {
    const { a, b, t } = bracketForYaw(this.keysByYaw, yawDeg);
    const g = b ? smootherstep(t) : 0;
    if (!b || g <= KEY_EPS) return { a, b: null, g: 0, head, chest };
    if (g >= 1 - KEY_EPS) return { a: b, b: null, g: 0, head, chest };
    return { a, b, g, head, chest };
  }

  /** A painted key's meshes for this pose; NO_MESH = plain quads (a still pose on its own key). */
  private meshes(key: RigKey, pose: WarpPose, moving: boolean): Meshes | null {
    if (!pose.b && !moving && key.id === pose.a.id) return NO_MESH;
    const head = this.warps.keyMesh(key, pose);
    if (!head) return null;
    return { head, body: this.warps.bodyMesh(this.keyById('frontal'), pose) };
  }

  /** Advances the paint choice on the frame's own clock (a frozen debug clock freezes a dissolve too). */
  private paintFor(frame: RenderFrame): PaintState {
    const dt = this.lastT === null ? 0 : Math.max(0, Math.min(0.1, frame.timeSeconds - this.lastT));
    this.lastT = frame.timeSeconds;
    return this.paint.update(frame.baseYawDeg ?? frame.yawDeg, dt);
  }

  private renderArt(frame: RenderFrame): void {
    const art = this.art!;
    const C = this.composer!;
    const [scene, ta, tb] = this.targets as [FrameBufferTarget, FrameBufferTarget, FrameBufferTarget];
    const yn = this.yawNorm(frame.yawDeg);
    const loose = this.loose.step(frame.timeSeconds, yn, frame.reducedMotion);
    const lift = frame.brow === 'raised' ? -art.fringeLiftPx * frame.browWeight : 0;
    const gain = relightGainForYaw(yn);
    const m: Motions = {
      iris: irisOffsetPx(yn, frame.pitchNorm),
      fringe: [0, lift],
      strand1: loose.strand1,
      strand2: loose.strand2,
      earring: loose.earring,
    };
    const chest = chestOffsetPx(frame.chestSample, frame.chestSampleX ?? 0);
    const sway = headSwayPx(frame.headSample?.[0] ?? 0, frame.headSample?.[1] ?? 0);
    const head: Px = [chest[0] + sway[0], chest[1] + sway[1]];
    const moving = [...chest, ...head].some((v) => Math.abs(v) > 1e-3);
    const paint = this.paintFor(frame);
    this.lastPaint = paint;
    if (this.debugNoWarp) {
      // v3's plain cross-dissolve of two unwarped composites, for comparison only
      const { a, b, t } = bracketForYaw(this.keysByYaw, frame.yawDeg);
      this.bindTarget(ta);
      C.drawKey(a, frame, m, gain, NO_MESH);
      this.bindTarget(tb);
      C.drawKey(b ?? a, frame, m, gain, NO_MESH);
      this.bindTarget(scene);
      this.layers!.mix(ta.tex, tb.tex, b ? smootherstep(t) : 0);
      return;
    }
    let pose = this.pose(frame.yawDeg, chest, head);
    const to = this.keyById(paint.to);
    let mTo = this.meshes(to, pose, moving);
    if (!mTo) {
      // the painted key lies outside the geometry's bracket (a jump of more than a key in one frame): pose on it alone
      pose = { a: to, b: null, g: 0, head, chest };
      mTo = this.meshes(to, pose, moving) ?? NO_MESH;
    }
    const from = paint.from && paint.w < 1 - KEY_EPS ? this.keyById(paint.from) : null;
    const mFrom = from ? this.meshes(from, pose, moving) : null;
    if (!from || !mFrom) {
      this.bindTarget(scene);
      C.drawKey(to, frame, m, gain, mTo);
      return;
    }
    C.drawDissolve(from, to, paint.w, mFrom, mTo, frame, m, gain, this.targets);
  }

  render(frame: RenderFrame): void {
    const gl = this.gl;
    if (!gl || !this.layers || !this.post || this.targets.length < 3) return;
    const scene = this.targets[0]!;
    if (!this.art) {
      if (!this.plate) return;
      this.bindTarget(scene);
      this.layers.beginLayers();
      this.layers.draw(this.plate.tex, this.plate.box);
    } else {
      this.renderArt(frame);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    if (this.debugNoPost) {
      this.layers.mix(scene.tex, scene.tex, 0);
    } else {
      this.post.apply(scene.tex, {
        headBox: this.rig.headBox,
        timeSeconds: frame.timeSeconds,
        reducedMotion: frame.reducedMotion,
        width: this.width,
        height: this.height,
      });
    }
  }

  /** Diagnostics: which painting(s) the last frame showed. */
  paintState(): PaintState | null {
    return this.lastPaint;
  }

  dispose(): void {
    const gl = this.gl;
    if (!gl) return;
    for (const t of this.art?.all ?? []) gl.deleteTexture(t);
    if (this.plate) gl.deleteTexture(this.plate.tex);
    for (const t of this.targets) {
      gl.deleteFramebuffer(t.fbo);
      gl.deleteTexture(t.tex);
    }
    this.layers?.dispose();
    this.post?.dispose();
  }
}

/** Pitch degrees -> the [-1, 1] fraction the iris travel uses (the spec's documented cap). */
export function yawToNorm(yawDeg: number): number {
  return Math.max(-1, Math.min(1, yawDeg / RIG_CONSTANTS.yaw.maxDeg));
}
