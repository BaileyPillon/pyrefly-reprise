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
 * mixes the two; a yaw on (or within a hair of) one key renders that key
 * alone, so the rest pose is the plate itself (proved pixel-exact by
 * `art/rest-diff.png`; `?post=0` shows it live). Degrades to a no-op when
 * WebGL2 is missing (jsdom in tests/unit).
 */
import type { EyeState, MouthPatch, BrowPatch } from './face.ts';
import { type Rig, type RigKey, sortedKeys, bracketForYaw, CHIN_LANDMARK_INDEX } from './rig.ts';
import { createFramebufferTarget, loadImage, type FrameBufferTarget } from './gl-utils.ts';
import { relightGainForYaw } from './light.ts';
import { PostPass } from './post.ts';
import { RIG_CONSTANTS } from './constants.ts';
import { LayerGL } from './gl-layer.ts';
import { readV3, loadArt, uploadTexture, type LoadedArt, type Motion, type Tex } from './layers.ts';
import { LooseMotion, chestOffsetPx, irisOffsetPx, yawNormFor, smootherstep, type Px } from './motion.ts';

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
  private width = 832;
  private height = 1216;

  constructor(canvas: HTMLCanvasElement, rig: Rig, assetBaseUrl: string) {
    this.rig = rig;
    this.base = assetBaseUrl;
    this.keysByYaw = sortedKeys(rig);
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

  /** Head translation that lands two keys' chins on the same point mid-dissolve (plate px). */
  private chinOffsets(a: RigKey, b: RigKey | null, w: number): { offA: Px; offB: Px } {
    const ca = a.landmarks?.[CHIN_LANDMARK_INDEX];
    const cb = b?.landmarks?.[CHIN_LANDMARK_INDEX];
    if (!b || !ca || !cb) return { offA: [0, 0], offB: [0, 0] };
    const tx = ca[0] + (cb[0] - ca[0]) * w;
    const ty = ca[1] + (cb[1] - ca[1]) * w;
    return { offA: [tx - ca[0], ty - ca[1]], offB: [tx - cb[0], ty - cb[1]] };
  }

  private bindTarget(t: FrameBufferTarget | null): void {
    const gl = this.gl!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.fbo : null);
    gl.viewport(0, 0, this.width, this.height);
    gl.disable(gl.BLEND);
    gl.clearColor(BG[0], BG[1], BG[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  private drawFrontal(frame: RenderFrame, m: Motions, gain: number): void {
    const art = this.art!;
    const L = this.layers!;
    const add = (a: Px, b: Px): Px => [a[0] + b[0], a[1] + b[1]];
    const offsetFor = (motion: Motion): Px => (motion === 'chest' ? m.chest : motion === 'head' ? m.head : add(m.head, m[motion]));
    for (const { layer, t } of art.frontal) {
      L.draw(t.tex, t.box, offsetFor(layer.motion), 1, layer.motion === 'chest' ? 1 : gain);
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

  private drawKey(key: RigKey, frame: RenderFrame, m: Motions, gain: number): void {
    const art = this.art!;
    const L = this.layers!;
    L.beginLayers();
    if (key.id === 'frontal') {
      this.drawFrontal(frame, m, gain);
      return;
    }
    const k = art.keys.get(key.id);
    const body = art.frontal.find((f) => f.layer.motion === 'chest');
    if (!k || !body) return;
    L.draw(k.back.tex, k.back.box, m.head, 1, gain);
    L.draw(body.t.tex, body.t.box, m.chest, 1, 1);
    L.draw(k.front.tex, k.front.box, m.head, 1, gain);
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
      const w = b ? smootherstep(t) : 0;
      const { offA, offB } = this.chinOffsets(a, b, w);
      const motions = (head: Px): Motions => ({
        head,
        chest: chestOffsetPx(frame.chestSample),
        iris: irisOffsetPx(yn, frame.pitchNorm),
        fringe: [0, lift],
        strand1: loose.strand1,
        strand2: loose.strand2,
        earring: loose.earring,
      });
      if (!b || w <= KEY_EPS) {
        this.bindTarget(scene);
        this.drawKey(a, frame, motions(offA), gain);
      } else if (w >= 1 - KEY_EPS) {
        this.bindTarget(scene);
        this.drawKey(b, frame, motions(offB), gain);
      } else {
        this.bindTarget(ta);
        this.drawKey(a, frame, motions(offA), gain);
        this.bindTarget(tb);
        this.drawKey(b, frame, motions(offB), gain);
        this.bindTarget(scene);
        this.layers.mix(ta.tex, tb.tex, w);
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
