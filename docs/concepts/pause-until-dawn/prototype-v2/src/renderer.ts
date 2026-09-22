/**
 * WebGL2 layered renderer: the pinned body/warped-head mesh, patch overlays
 * (eyes/mouth), and the post pass. Degrades to a no-op (`ok === false`) when
 * WebGL2 isn't available — jsdom's canvas has no GPU, and the driver seam
 * needs to keep working there for `tests/unit`.
 */
import type { EyeState } from './face.ts';
import type { MouthPatch, BrowPatch } from './face.ts';
import { type Rig, type RigKey, sortedKeys, bracketForYaw, CHIN_LANDMARK_INDEX } from './rig.ts';
import { BODY_VERT, BODY_FRAG, PATCH_VERT, PATCH_FRAG } from './shaders.ts';
import { linkProgram, loadImage, createTextureFromImage, createFramebufferTarget, buildGridMesh } from './gl-utils.ts';
import { relightGainForYaw } from './light.ts';
import { PostPass } from './post.ts';
import { RIG_CONSTANTS } from './constants.ts';

export interface RenderFrame {
  /** Real degrees. Bracketed against the rig's own keys when there's more than one. */
  yawDeg: number;
  pitchNorm: number; // -1..1, a small procedural nod only (no separate pitch keys exist)
  eyeState: EyeState;
  eyeAperture: number; // 1 open .. 0 closed
  mouth: MouthPatch;
  mouthWeight: number;
  brow: BrowPatch;
  browWeight: number;
  timeSeconds: number;
  reducedMotion: boolean;
}

interface PatchQuad {
  tex: WebGLTexture;
  /** NDC half-size and center, precomputed once from the rig's pixel box. */
  center: [number, number];
  halfSize: [number, number];
  feather: number;
}

const GRID_COLS = 24;
const GRID_ROWS = 32;

export class Renderer {
  readonly ok: boolean;
  private readonly gl: WebGL2RenderingContext | null;
  private readonly rig: Rig;
  private readonly assetBaseUrl: string;
  private bodyProgram!: WebGLProgram;
  private patchProgram!: WebGLProgram;
  private bodyVao!: WebGLVertexArrayObject;
  private patchVao!: WebGLVertexArrayObject;
  private indexCount = 0;
  private bodyTex: WebGLTexture | null = null;
  private eyesHalf: PatchQuad | null = null;
  private eyesClosed: PatchQuad | null = null;
  private mouthQuads = new Map<MouthPatch, PatchQuad>();
  private scene: { fbo: WebGLFramebuffer; tex: WebGLTexture } | null = null;
  private post: PostPass | null = null;
  private width = 1;
  private height = 1;
  private loaded = false;
  /** Multi-key path only (an authored rig with more than one yaw key). */
  private readonly keyTextures = new Map<string, WebGLTexture>();
  private readonly keysByYaw: RigKey[];
  private readonly multiKey: boolean;

  constructor(canvas: HTMLCanvasElement, rig: Rig, assetBaseUrl: string) {
    this.rig = rig;
    this.assetBaseUrl = assetBaseUrl;
    this.keysByYaw = sortedKeys(rig);
    this.multiKey = this.keysByYaw.length > 1;
    // jsdom (tests/unit) has no GPU: getContext either returns null or throws
    // "not implemented" depending on version. Either way this degrades to a
    // no-op renderer instead of taking the driver seam down with it.
    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl2', { alpha: false, antialias: true });
    } catch {
      gl = null;
    }
    this.gl = gl;
    this.ok = gl !== null;
    if (!gl) return;
    this.width = canvas.width;
    this.height = canvas.height;
    this.bodyProgram = linkProgram(gl, BODY_VERT, BODY_FRAG);
    this.patchProgram = linkProgram(gl, PATCH_VERT, PATCH_FRAG);
    this.buildBodyMesh(gl);
    this.buildPatchQuadGeometry(gl);
    this.post = new PostPass(gl);
    this.scene = createFramebufferTarget(gl, this.width, this.height);
  }

  private buildBodyMesh(gl: WebGL2RenderingContext): void {
    const { positions, uvs, indices } = buildGridMesh(GRID_COLS, GRID_ROWS);
    this.indexCount = indices.length;
    const vao = gl.createVertexArray();
    if (!vao) throw new Error('createVertexArray failed');
    this.bodyVao = vao;
    gl.bindVertexArray(vao);
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
  }

  private buildPatchQuadGeometry(gl: WebGL2RenderingContext): void {
    const vao = gl.createVertexArray();
    if (!vao) throw new Error('createVertexArray failed');
    this.patchVao = vao;
    gl.bindVertexArray(vao);
    // Unit quad, corners in [-1,1]; UVs [0,1] (Y flipped to match image coordinates).
    const pos = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const uv = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  private pixelBoxToPatchQuad(box: [number, number, number, number], pad: number, feather: number): { center: [number, number]; halfSize: [number, number]; feather: number } {
    const [x, y, w, h] = box;
    const cw = this.rig.canvas.width;
    const ch = this.rig.canvas.height;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const halfW = w / 2 + pad;
    const halfH = h / 2 + pad;
    // Pixel space (y-down) -> NDC (y-up).
    const centerNdc: [number, number] = [(cx / cw) * 2 - 1, 1 - (cy / ch) * 2];
    const halfSizeNdc: [number, number] = [(halfW / cw) * 2, (halfH / ch) * 2];
    const featherFrac = feather / Math.max(halfW, halfH);
    return { center: centerNdc, halfSize: halfSizeNdc, feather: featherFrac };
  }

  /** A pixel box -> NDC center + half-size, no padding (for placing a key/body layer). */
  private pixelBoxToNdc(box: [number, number, number, number]): { center: [number, number]; scale: [number, number] } {
    const [x, y, w, h] = box;
    const cw = this.rig.canvas.width;
    const ch = this.rig.canvas.height;
    const cx = x + w / 2;
    const cy = y + h / 2;
    return {
      center: [(cx / cw) * 2 - 1, 1 - (cy / ch) * 2],
      scale: [(w / 2 / cw) * 2, (h / 2 / ch) * 2],
    };
  }

  async load(): Promise<void> {
    const gl = this.gl;
    if (!gl) return;
    if (this.multiKey) {
      const bodyImg = await loadImage(this.assetBaseUrl + this.rig.bodyFile);
      this.bodyTex = createTextureFromImage(gl, bodyImg);
      for (const key of this.keysByYaw) {
        const img = await loadImage(this.assetBaseUrl + key.file);
        this.keyTextures.set(key.id, createTextureFromImage(gl, img));
      }
    } else {
      const bodyImg = await loadImage(this.assetBaseUrl + this.rig.bodyFile);
      this.bodyTex = createTextureFromImage(gl, bodyImg);
    }

    const eyes = this.rig.patches.eyes;
    if (eyes) {
      const geo = this.pixelBoxToPatchQuad(eyes.box, eyes.pad, eyes.feather);
      const halfFile = eyes.states.half?.file;
      const closedFile = eyes.states.closed?.file;
      if (halfFile) {
        const img = await loadImage(this.assetBaseUrl + halfFile);
        this.eyesHalf = { tex: createTextureFromImage(gl, img), ...geo };
      }
      if (closedFile) {
        const img = await loadImage(this.assetBaseUrl + closedFile);
        this.eyesClosed = { tex: createTextureFromImage(gl, img), ...geo };
      }
    }

    const mouth = this.rig.patches.mouth;
    if (mouth) {
      const geo = this.pixelBoxToPatchQuad(mouth.box, mouth.pad, mouth.feather);
      for (const key of ['parted', 'smile', 'pressed'] as MouthPatch[]) {
        const file = mouth.states[key]?.file;
        if (!file) continue;
        const img = await loadImage(this.assetBaseUrl + file);
        this.mouthQuads.set(key, { tex: createTextureFromImage(gl, img), ...geo });
      }
    }
    this.loaded = true;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    const gl = this.gl;
    if (!gl || !this.scene) return;
    gl.deleteFramebuffer(this.scene.fbo);
    gl.deleteTexture(this.scene.tex);
    this.scene = createFramebufferTarget(gl, width, height);
  }

  private drawPatch(quad: PatchQuad, opacity: number): void {
    const gl = this.gl!;
    gl.useProgram(this.patchProgram);
    gl.bindVertexArray(this.patchVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, quad.tex);
    gl.uniform1i(gl.getUniformLocation(this.patchProgram, 'uTex'), 0);
    gl.uniform2f(gl.getUniformLocation(this.patchProgram, 'uCenter'), quad.center[0], quad.center[1]);
    gl.uniform2f(gl.getUniformLocation(this.patchProgram, 'uHalfSize'), quad.halfSize[0], quad.halfSize[1]);
    gl.uniform2f(gl.getUniformLocation(this.patchProgram, 'uOffset'), 0, 0);
    gl.uniform1f(gl.getUniformLocation(this.patchProgram, 'uOpacity'), opacity);
    gl.uniform1f(gl.getUniformLocation(this.patchProgram, 'uFeather'), quad.feather);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** Yaw normalised against however far this rig's head can actually turn (asymmetric for an authored rig). */
  private yawNormFor(yawDeg: number): number {
    if (yawDeg >= 0) {
      const max = this.multiKey ? (this.keysByYaw.at(-1)?.yawDeg ?? RIG_CONSTANTS.yaw.maxDeg) : RIG_CONSTANTS.yaw.maxDeg;
      return max === 0 ? 0 : Math.max(0, Math.min(1, yawDeg / max));
    }
    const min = this.multiKey ? (this.keysByYaw[0]?.yawDeg ?? -RIG_CONSTANTS.yaw.maxDeg) : -RIG_CONSTANTS.yaw.maxDeg;
    return min === 0 ? 0 : Math.max(-1, Math.min(0, yawDeg / min) * -1);
  }

  /** Common draw setup for one head layer — a full-canvas warped mesh (stand-in) or a placed key crop (authored). */
  private drawHeadProgramCommon(uniforms: {
    tex: WebGLTexture;
    headBoxOverride?: [number, number, number, number];
    yawNorm: number;
    pitchNorm: number;
    warpScale: number;
    scale: [number, number];
    center: [number, number];
    offset: [number, number];
    opacity: number;
  }): void {
    const gl = this.gl!;
    gl.useProgram(this.bodyProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, uniforms.tex);
    gl.uniform1i(gl.getUniformLocation(this.bodyProgram, 'uTex'), 0);
    const hb = uniforms.headBoxOverride ?? [this.rig.headBox.x, this.rig.headBox.y, this.rig.headBox.w, this.rig.headBox.h];
    gl.uniform4f(gl.getUniformLocation(this.bodyProgram, 'uHeadBox'), hb[0], hb[1], hb[2], hb[3]);
    gl.uniform1f(gl.getUniformLocation(this.bodyProgram, 'uYawNorm'), uniforms.yawNorm);
    gl.uniform1f(gl.getUniformLocation(this.bodyProgram, 'uPitchNorm'), uniforms.pitchNorm);
    gl.uniform1f(gl.getUniformLocation(this.bodyProgram, 'uWarpScale'), uniforms.warpScale);
    gl.uniform1f(gl.getUniformLocation(this.bodyProgram, 'uRelightGain'), relightGainForYaw(uniforms.yawNorm));
    gl.uniform1f(gl.getUniformLocation(this.bodyProgram, 'uOpacity'), uniforms.opacity);
    gl.uniform2f(gl.getUniformLocation(this.bodyProgram, 'uScale'), uniforms.scale[0], uniforms.scale[1]);
    gl.uniform2f(gl.getUniformLocation(this.bodyProgram, 'uCenter'), uniforms.center[0], uniforms.center[1]);
    gl.uniform2f(gl.getUniformLocation(this.bodyProgram, 'uOffset'), uniforms.offset[0], uniforms.offset[1]);
  }

  /** landmarks[CHIN_LANDMARK_INDEX] -> NDC delta needed to land two keys' chins on the same point mid-dissolve. */
  private chinAlignmentNdc(a: RigKey, b: RigKey | null, t: number): { offsetA: [number, number]; offsetB: [number, number] } {
    const zero: [number, number] = [0, 0];
    const chinA = a.landmarks?.[CHIN_LANDMARK_INDEX];
    const chinB = b?.landmarks?.[CHIN_LANDMARK_INDEX];
    if (!b || !chinA || !chinB) return { offsetA: zero, offsetB: zero };
    const cw = this.rig.canvas.width;
    const ch = this.rig.canvas.height;
    const targetX = chinA[0] + (chinB[0] - chinA[0]) * t;
    const targetY = chinA[1] + (chinB[1] - chinA[1]) * t;
    const toNdc = (dxPx: number, dyPx: number): [number, number] => [(dxPx / cw) * 2, -((dyPx / ch) * 2)];
    return { offsetA: toNdc(targetX - chinA[0], targetY - chinA[1]), offsetB: toNdc(targetX - chinB[0], targetY - chinB[1]) };
  }

  render(frame: RenderFrame): void {
    const gl = this.gl;
    if (!gl || !this.loaded || !this.bodyTex || !this.scene || !this.post) return;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.scene.fbo);
    gl.viewport(0, 0, this.width, this.height);
    gl.disable(gl.BLEND);
    gl.clearColor(0.03, 0.02, 0.03, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindVertexArray(this.bodyVao); // rebound per-layer below where a different mesh is needed

    if (this.multiKey) {
      // Every authored layer below is a cutout with real per-pixel alpha —
      // blending must stay on for all of them, not just the cross-dissolved
      // top key, or a transparent texel overwrites whatever is underneath
      // with black instead of showing it through (this bit us once: see
      // git history/README "known issues" for the symptom).
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      // The pinned body layer: never warped, never relit (a huge/offscreen
      // head box forces its mask to 0 — see BODY_FRAG's `vMask`).
      gl.bindVertexArray(this.patchVao);
      const bodyBox = this.rig.bodyPlacementBox ?? [0, 0, this.rig.canvas.width, this.rig.canvas.height];
      const bodyPlacement = this.pixelBoxToNdc(bodyBox);
      this.drawHeadProgramCommon({
        tex: this.bodyTex,
        headBoxOverride: [-5, -5, 0.001, 0.001],
        yawNorm: 0,
        pitchNorm: 0,
        warpScale: 0,
        scale: bodyPlacement.scale,
        center: bodyPlacement.center,
        offset: [0, 0],
        opacity: 1,
      });
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Fill-in: draw the frontal key underneath the active bracket first.
      // The art pipeline's own knownIssues disclose that "hidden region"
      // inpainting (forehead under bangs, neck under a turned jaw) was never
      // attempted, so a turned key's crop can leave a gap outside its own
      // box; showing the frontal hair/collar there instead of bare canvas
      // is a strictly smaller defect than a hard-edged black cutout, even
      // though it is not itself correct at extreme yaw. See README.md.
      const frontalKey = this.keysByYaw.find((k) => k.yawDeg === 0);
      const frontalTex = frontalKey ? this.keyTextures.get(frontalKey.id) : null;
      if (frontalKey && frontalTex) {
        const placement = this.pixelBoxToNdc(frontalKey.placementBox ?? [0, 0, this.rig.canvas.width, this.rig.canvas.height]);
        this.drawHeadProgramCommon({
          tex: frontalTex,
          yawNorm: 0,
          pitchNorm: 0,
          warpScale: 0,
          scale: placement.scale,
          center: placement.center,
          offset: [0, 0],
          opacity: 1,
        });
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      const { a, b, t } = bracketForYaw(this.keysByYaw, frame.yawDeg);
      const { offsetA, offsetB } = this.chinAlignmentNdc(a, b, t);
      const yawNorm = this.yawNormFor(frame.yawDeg);
      const texA = this.keyTextures.get(a.id);
      if (texA) {
        const placementA = this.pixelBoxToNdc(a.placementBox ?? [0, 0, this.rig.canvas.width, this.rig.canvas.height]);
        this.drawHeadProgramCommon({
          tex: texA,
          yawNorm,
          pitchNorm: frame.pitchNorm,
          warpScale: 0,
          scale: placementA.scale,
          center: placementA.center,
          offset: offsetA,
          opacity: 1,
        });
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      const texB = b ? this.keyTextures.get(b.id) : null;
      if (b && texB && t > 0.001) {
        const placementB = this.pixelBoxToNdc(b.placementBox ?? [0, 0, this.rig.canvas.width, this.rig.canvas.height]);
        this.drawHeadProgramCommon({
          tex: texB,
          yawNorm,
          pitchNorm: frame.pitchNorm,
          warpScale: 0,
          scale: placementB.scale,
          center: placementB.center,
          offset: offsetB,
          opacity: t,
        });
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      gl.bindVertexArray(this.bodyVao);
    } else {
      const yawNorm = this.yawNormFor(frame.yawDeg);
      this.drawHeadProgramCommon({
        tex: this.bodyTex,
        yawNorm,
        pitchNorm: frame.pitchNorm,
        warpScale: 0.14,
        scale: [1, 1],
        center: [0, 0],
        offset: [0, 0],
        opacity: 1,
      });
      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    }
    const hb = this.rig.headBox;

    // Eyes: cross-fade toward the target patch as the aperture closes.
    const closeAmount = 1 - frame.eyeAperture;
    if (closeAmount > 0.01) {
      const quad = frame.eyeState === 'half' ? this.eyesHalf : this.eyesClosed;
      if (quad) this.drawPatch(quad, Math.min(1, closeAmount));
    }

    if (frame.mouth !== 'neutral' && frame.mouthWeight > 0.01) {
      const quad = this.mouthQuads.get(frame.mouth);
      if (quad) this.drawPatch(quad, Math.min(1, frame.mouthWeight));
    }
    // Brows: no delivered art (art/patches/patches.md, both states FAIL) —
    // the scheduler still runs (face.ts) for the diagnostics log, nothing to draw.

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    this.post.apply(this.scene.tex, {
      headBox: hb,
      timeSeconds: frame.timeSeconds,
      reducedMotion: frame.reducedMotion,
      width: this.width,
      height: this.height,
    });
  }

  dispose(): void {
    const gl = this.gl;
    if (!gl) return;
    gl.deleteProgram(this.bodyProgram);
    gl.deleteProgram(this.patchProgram);
    gl.deleteVertexArray(this.bodyVao);
    gl.deleteVertexArray(this.patchVao);
    if (this.bodyTex) gl.deleteTexture(this.bodyTex);
    for (const tex of this.keyTextures.values()) gl.deleteTexture(tex);
    if (this.scene) {
      gl.deleteFramebuffer(this.scene.fbo);
      gl.deleteTexture(this.scene.tex);
    }
    this.post?.dispose();
  }
}

/** Yaw degrees -> the [-1, 1] fraction the shaders and light math use. */
export function yawToNorm(yawDeg: number): number {
  return Math.max(-1, Math.min(1, yawDeg / RIG_CONSTANTS.yaw.maxDeg));
}
