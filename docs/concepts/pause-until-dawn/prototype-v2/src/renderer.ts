/**
 * WebGL2 renderer for the v3 living-portrait rig (art/rig.json `artMeta.v3`).
 *
 * v3 replaces v2's single-target compositing (the source of the collar seam:
 * at every yaw, including dead centre, the non-frontal key of the bracket was
 * drawn OPAQUE underneath the frontal stack, so its rectangular crop showed
 * wherever the frontal stack was transparent - across the collar, around the
 * hair) with one COMPLETE composite per key:
 *
 *   frontal   hairBack, body, headCore, mouth patch, irises, lids, eye patch,
 *             brow patch, hairFront, strands, earring - each on its own motion
 *   yaw key   key.back (hair below the jaw), body, key.front (face + head hair)
 *
 * A yaw between two keys renders each key's composite into its own target and
 * mixes the two. v3.1: both composites are first WARPED onto the same
 * interpolated landmarks (`warp/mesh.ts`: a per-triangle, piecewise-affine
 * mesh warp), so eyes, nose, mouth, chin and head outline of the two
 * paintings sit on the same pixels and only the paint cross-fades - no
 * double exposure. The body is pinned (never warped). A yaw on (or within a
 * hair of) one key renders that key alone and unwarped, so the rest pose is
 * the plate itself (proved pixel-exact by `art/rest-diff.png`; `?post=0`
 * shows it live). Degrades to a no-op when WebGL2 is missing (jsdom in
 * tests/unit).
 */
import type { EyeState, MouthPatch, BrowPatch } from './face.ts';
import { type Rig, type RigKey, sortedKeys, bracketForYaw } from './rig.ts';
import { createFramebufferTarget, loadImage, type FrameBufferTarget } from './gl-utils.ts';
import { relightGainForYaw } from './light.ts';
import { PostPass } from './post.ts';
import { RIG_CONSTANTS } from './constants.ts';
import { LayerGL } from './gl-layer.ts';
import { readV3, loadArt, uploadTexture, type LoadedArt, type Motion, type Tex } from './layers.ts';
import { LooseMotion, chestOffsetPx, irisOffsetPx, yawNormFor, smootherstep, type Px } from './motion.ts';
import { WarpCache, type PairFrame } from './warp/cache.ts';
import { paintWeight } from './warp/mesh.ts';

type KeyPart = 'all' | 'back' | 'front';

export interface RenderFrame {
  yawDeg: number;
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
}

/** Below this cross-dissolve weight a key is not drawn at all (no faint crop ghost). */
const KEY_EPS = 0.002;
const BG: [number, number, number] = [0.03, 0.02, 0.03];

interface Motions {
  head: Px;
  chest: Px;
  iris: Px;
  fringe: Px;
  strand1: Px;
  strand2: Px;
  earring: Px;
}

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
  private width = 832;
  private height = 1216;

  constructor(canvas: HTMLCanvasElement, rig: Rig, assetBaseUrl: string) {
    this.rig = rig;
    this.base = assetBaseUrl;
    this.keysByYaw = sortedKeys(rig);
    this.warps = new WarpCache(rig);
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

  private drawFrontal(frame: RenderFrame, m: Motions, gain: number, part: KeyPart): void {
    const art = this.art!;
    const L = this.layers!;
    const add = (a: Px, b: Px): Px => [a[0] + b[0], a[1] + b[1]];
    const offsetFor = (motion: Motion): Px => (motion === 'chest' ? m.chest : motion === 'head' ? m.head : add(m.head, m[motion]));
    let behindBody = true;
    for (const { layer, t } of art.frontal) {
      const pinned = layer.motion === 'chest';
      if (pinned) behindBody = false;
      if (part !== 'all' && (pinned || (part === 'back') !== behindBody)) continue;
      L.draw(t.tex, t.box, offsetFor(layer.motion), 1, pinned ? 1 : gain, pinned);
      if (layer.name === 'headCore' && frame.mouth !== 'neutral') {
        const p = art.mouth.get(frame.mouth);
        if (p) L.draw(p.tex, p.box, m.head, frame.mouthWeight, gain);
      }
      if (layer.name === 'eyeApertureL') {
        // nearest measured lid state: crisp lids, no cross-faded double lash line
        let best: Tex | null = null;
        let bestD = 1 - Math.max(0, Math.min(1, frame.eyeAperture));
        for (const { state, t: pt } of art.eyes) {
          const d = Math.abs(state.aperture - frame.eyeAperture);
          if (d < bestD) {
            bestD = d;
            best = pt;
          }
        }
        if (best) L.draw(best.tex, best.box, m.head, 1, gain);
        if (frame.brow !== 'neutral') {
          const p = art.brows.get(frame.brow);
          if (p) L.draw(p.tex, p.box, m.head, frame.browWeight, gain);
        }
      }
    }
  }

  /**
   * One key's composite (`all`), or just its head behind the body (`back`)
   * or in front of it (`front`) - the two halves of a warped blend, each
   * drawn into a transparent target and mixed around the one pinned body.
   */
  private drawKey(key: RigKey, frame: RenderFrame, m: Motions, gain: number, warp: Float32Array | null = null, part: KeyPart = 'all'): void {
    const art = this.art!;
    const L = this.layers!;
    L.beginLayers(warp);
    if (key.id === 'frontal') {
      this.drawFrontal(frame, m, gain, part);
      return;
    }
    const k = art.keys.get(key.id);
    if (!k) return;
    if (part !== 'front') L.draw(k.back.tex, k.back.box, m.head, 1, gain);
    if (part === 'all') this.drawBody(m, true);
    if (part !== 'back') L.draw(k.front.tex, k.front.box, m.head, 1, gain);
  }

  /** The pinned body: the plate's own, or (`turned`) the one with the frontal tassel's footprint filled. */
  private drawBody(m: Motions, turned: boolean): void {
    const art = this.art!;
    const body = turned && art.bodyTurned ? art.bodyTurned : art.frontal.find((f) => f.layer.motion === 'chest')?.t;
    if (body) this.layers!.draw(body.tex, body.box, m.chest, 1, 1, true);
  }

  /**
   * The body between the two head halves. Frontal-to-turn: the plate's body
   * and the turned body, an exact premultiplied lerp at the paint weight (both
   * are the same pixels outside the tassel's footprint); otherwise one body.
   */
  private drawBlendBody(a: RigKey, b: RigKey, w: number, m: Motions): void {
    const [scene, ta, tb] = this.targets as [FrameBufferTarget, FrameBufferTarget, FrameBufferTarget];
    const turnedWeight = a.id === 'frontal' ? w : b.id === 'frontal' ? 1 - w : 1;
    if (turnedWeight <= KEY_EPS || turnedWeight >= 1 - KEY_EPS || !this.art!.bodyTurned) {
      this.bindTarget(scene, 'keep');
      this.layers!.beginLayers(null);
      this.drawBody(m, turnedWeight >= 0.5);
      return;
    }
    this.bindTarget(ta, 'clear');
    this.layers!.beginLayers(null);
    this.drawBody(m, false);
    this.bindTarget(tb, 'clear');
    this.layers!.beginLayers(null);
    this.drawBody(m, true);
    this.bindTarget(scene, 'keep');
    this.layers!.mixUnion(ta.tex, tb.tex, turnedWeight, false);
  }

  /** Warped blend: back halves, the pinned body once, front halves; each pair mixed by coverage. */
  private drawWarpedBlend(a: RigKey, b: RigKey, w: number, pair: PairFrame, frame: RenderFrame, m: Motions, gain: number): void {
    const [scene, ta, tb] = this.targets as [FrameBufferTarget, FrameBufferTarget, FrameBufferTarget];
    this.bindTarget(scene, 'bg');
    for (const part of ['back', 'front'] as const) {
      this.bindTarget(ta, 'clear');
      this.drawKey(a, frame, m, gain, pair.a, part);
      this.bindTarget(tb, 'clear');
      this.drawKey(b, frame, m, gain, pair.b, part);
      this.bindTarget(scene, 'keep');
      this.layers!.mixUnion(ta.tex, tb.tex, w);
      if (part === 'back') this.drawBlendBody(a, b, w, m);
    }
  }

  render(frame: RenderFrame): void {
    const gl = this.gl;
    if (!gl || !this.layers || !this.post || this.targets.length < 3) return;
    const [scene, ta, tb] = this.targets as [FrameBufferTarget, FrameBufferTarget, FrameBufferTarget];
    if (!this.art) {
      if (!this.plate) return;
      this.bindTarget(scene);
      this.layers.beginLayers();
      this.layers.draw(this.plate.tex, this.plate.box);
    } else {
      const yn = this.yawNorm(frame.yawDeg);
      const loose = this.loose.step(frame.timeSeconds, yn, frame.reducedMotion);
      const lift = frame.brow === 'raised' ? -this.art.fringeLiftPx * frame.browWeight : 0;
      const gain = relightGainForYaw(yn);
      const { a, b, t } = bracketForYaw(this.keysByYaw, frame.yawDeg);
      // geometry moves across the whole span; the paint swaps only in its middle half
      const g = b ? smootherstep(t) : 0;
      const c = b ? paintWeight(t) : 0;
      const m: Motions = {
        head: [0, 0],
        chest: chestOffsetPx(frame.chestSample),
        iris: irisOffsetPx(yn, frame.pitchNorm),
        fringe: [0, lift],
        strand1: loose.strand1,
        strand2: loose.strand2,
        earring: loose.earring,
      };
      const pair = b && g > KEY_EPS && g < 1 - KEY_EPS && !this.debugNoWarp ? this.warps.frame(a, b, g) : null;
      if (!b || g <= KEY_EPS) {
        this.bindTarget(scene);
        this.drawKey(a, frame, m, gain);
      } else if (g >= 1 - KEY_EPS) {
        this.bindTarget(scene);
        this.drawKey(b, frame, m, gain);
      } else if (pair && c <= KEY_EPS) {
        this.bindTarget(scene);
        this.drawKey(a, frame, m, gain, pair.a);
      } else if (pair && c >= 1 - KEY_EPS) {
        this.bindTarget(scene);
        this.drawKey(b, frame, m, gain, pair.b);
      } else if (pair) {
        // both keys warped onto the same interpolated landmarks, then mixed by coverage
        this.drawWarpedBlend(a, b, c, pair, frame, m, gain);
      } else {
        // v3's plain cross-dissolve of two complete composites (no landmarks, or `?warp=0`)
        this.bindTarget(ta);
        this.drawKey(a, frame, m, gain);
        this.bindTarget(tb);
        this.drawKey(b, frame, m, gain);
        this.bindTarget(scene);
        this.layers.mix(ta.tex, tb.tex, g);
      }
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
