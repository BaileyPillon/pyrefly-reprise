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
import { LayerGL, WARP_FRAG } from './gl-layer.ts';
import { DenseMeshes, readFlow } from './warp/dense.ts';
import { readV3, readV4, loadArt, uploadTexture, type LoadedArt, type Tex, type V4Meta } from './layers.ts';
import { LooseMotion, chestOffsetPx, headSwayPx, irisOffsetPx, yawNormFor, smootherstep, type Px } from './motion.ts';
import { WarpCache, type WarpPose } from './warp/cache.ts';
import { PaintSelector, WARP_PAINT, type PaintState } from './paint.ts';
import { Composer, KEY_EPS, type Meshes, type Motions, type TasselDraw } from './compose.ts';

/** v4 ('warp'): adjacent keys warped onto the same landmarks and mixed by the rendered yaw; 'switch': v3.3's one painting at a time. */
export type PaintMode = 'warp' | 'switch';

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
  /** How the painted keys follow the yaw: the rig's own `artMeta.v4.paint` unless overridden (`?paint=switch`). */
  paintMode: PaintMode = 'switch';
  private readonly v4: V4Meta | null;
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
  /** v4.1 'warp': the same one-painting selector, tuned for feature-registered keys (`WARP_PAINT`). */
  private readonly warpPaint: PaintSelector;
  private dense: DenseMeshes | null = null;
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
    this.warpPaint = new PaintSelector(this.keysByYaw, WARP_PAINT.hysteresisDeg, WARP_PAINT.dissolveS, WARP_PAINT.dissolveDeg);
    this.v4 = readV4(rig.artMeta);
    this.paintMode = this.v4?.paint ?? 'switch';
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
      this.art = await loadArt(gl, this.base, v3, Boolean(this.v4?.tassel), this.v4?.tassel?.faceOver ?? {});
      this.composer = new Composer(this.layers!, this.art, (t, c) => this.bindTarget(t, c));
      const flow = readFlow(this.rig.artMeta);
      if (flow) {
        try {
          const dense = new DenseMeshes(gl, WARP_FRAG);
          await dense.load(this.base, flow);
          this.dense = dense;
          this.layers!.useDense(dense);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('[living-portrait] dense pair meshes unavailable; sparse landmark mesh used:', err);
        }
      }
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

  /**
   * The pose's geometry: the bracket of the rendered yaw, carried by the chest
   * and the head's sway. v4.1: the bracket weight is the plain linear t (v4's
   * smootherstep stopped every landmark at each key, so a steady turn moved in
   * pulses), and the ends of the range sit on their outer pair at g = 0 or 1.
   */
  private pose(yawDeg: number, chest: Px, head: Px): WarpPose {
    const { a, b, t } = bracketForYaw(this.keysByYaw, yawDeg);
    if (b) return { a, b, g: t, head, chest };
    const i = this.keysByYaw.indexOf(a);
    if (i === 0 && this.keysByYaw[1]) return { a, b: this.keysByYaw[1], g: 0, head, chest };
    if (i > 0) return { a: this.keysByYaw[i - 1]!, b: a, g: 1, head, chest };
    return { a, b: null, g: 0, head, chest };
  }

  /**
   * The painted key lies outside the geometry's bracket (the paint's
   * hysteresis, or a jump of more than a key in one frame): pose it on the
   * pair that joins it to the geometry, at that pair's end nearest the
   * geometry, so it is drawn as close to the rendered yaw as its own mesh
   * reaches.
   */
  private nearestPose(key: RigKey, pose: WarpPose): WarpPose {
    const i = this.keysByYaw.indexOf(key);
    const toward = key.yawDeg < pose.a.yawDeg ? this.keysByYaw[i + 1] : this.keysByYaw[i - 1];
    if (!toward) return { a: key, b: null, g: 0, head: pose.head, chest: pose.chest };
    return toward.yawDeg > key.yawDeg
      ? { a: key, b: toward, g: 1, head: pose.head, chest: pose.chest }
      : { a: toward, b: key, g: 0, head: pose.head, chest: pose.chest };
  }

  /** A painted key's meshes for this pose; NO_MESH = plain quads (a still pose exactly on its own key). */
  private meshes(key: RigKey, pose: WarpPose, moving: boolean): Meshes | null {
    const onKey = (pose.g <= KEY_EPS && key.id === pose.a.id) || (pose.b !== null && pose.g >= 1 - KEY_EPS && key.id === pose.b.id) || (!pose.b && key.id === pose.a.id);
    if (onKey && !moving) return NO_MESH;
    const body = this.warps.bodyMesh(this.keyById('frontal'), pose);
    if (this.dense && pose.b && this.paintMode === 'warp') {
      const sway: Px = [pose.head[0] - pose.chest[0], pose.head[1] - pose.chest[1]];
      const d = this.dense.draw(pose.a.id, pose.b.id, key.id, pose.g, pose.chest, sway);
      if (d) return { head: d, body };
    }
    const sparse: WarpPose = pose.b && pose.g <= KEY_EPS ? { ...pose, b: null, g: 0 } : pose.b && pose.g >= 1 - KEY_EPS ? { ...pose, a: pose.b, b: null, g: 0 } : pose;
    const head = this.warps.keyMesh(key, sparse);
    if (!head) return null;
    return { head, body };
  }

  /** Advances the paint choice on the frame's own clock (a frozen debug clock freezes a dissolve too). */
  private paintFor(frame: RenderFrame): PaintState {
    const dt = this.lastT === null ? 0 : Math.max(0, Math.min(0.1, frame.timeSeconds - this.lastT));
    this.lastT = frame.timeSeconds;
    const sel = this.paintMode === 'warp' ? this.warpPaint : this.paint;
    return sel.update(frame.baseYawDeg ?? frame.yawDeg, dt);
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
    const pose = this.pose(frame.yawDeg, chest, head);
    const to = this.keyById(paint.to);
    const mTo = this.meshes(to, pose, moving) ?? this.meshes(to, this.nearestPose(to, pose), moving) ?? NO_MESH;
    const td = this.tasselFor(frame.yawDeg, head, loose.earring);
    const from = paint.from && paint.w < 1 - KEY_EPS ? this.keyById(paint.from) : null;
    const mFrom = from ? (this.meshes(from, pose, moving) ?? this.meshes(from, this.nearestPose(from, pose), moving)) : null;
    if (!from || !mFrom) {
      this.bindTarget(scene);
      C.drawKey(to, frame, m, gain, mTo, 'all', td);
      return;
    }
    C.drawDissolve(from, to, paint.w, mFrom, mTo, frame, m, gain, this.targets, td);
  }

  /**
   * Where the plate's tassel goes for this yaw. Its x offset at each key is
   * where that key's painting carries her right ear (`artMeta.v4.tassel.dx`),
   * interpolated linearly with the geometry; it rides the head's translation
   * and its own loose swing. v4.1: it is always drawn on top, and while the ear
   * turns away (yaw < 0) each key's cheek is drawn back over it
   * (`Composer.drawFaceOver`), so it passes behind the jaw instead of across
   * the cheek (v4 cross-faded an 'over' and an 'under' copy between -20 and
   * -40: a ghost over cheek and mouth). Past `underToDeg` the ear is behind
   * the skull: the tassel fades out by `hiddenBelowDeg`.
   */
  private tasselFor(yawDeg: number, head: Px, earring: Px): TasselDraw | null {
    const tv = this.v4?.tassel;
    const t = this.art?.tassel;
    if (!tv || !t) return null;
    const { a, b, t: g } = bracketForYaw(this.keysByYaw, yawDeg);
    const da = tv.dx[a.id] ?? 0;
    const dx = b ? da + ((tv.dx[b.id] ?? da) - da) * g : da;
    const lo = tv.hiddenBelowDeg ?? -90;
    const h = Math.max(0, Math.min(1, (yawDeg - lo) / Math.max(1e-6, tv.underToDeg - lo)));
    const over = h * h * (3 - 2 * h);
    return { t, offset: [dx + head[0] + earring[0], head[1] + earring[1]], under: 0, over, occlude: yawDeg < 0 };
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
    this.dense?.dispose();
    this.post?.dispose();
  }
}

/** Pitch degrees -> the [-1, 1] fraction the iris travel uses (the spec's documented cap). */
export function yawToNorm(yawDeg: number): number {
  return Math.max(-1, Math.min(1, yawDeg / RIG_CONSTANTS.yaw.maxDeg));
}
