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
import { ExponentialSpring, BandNoise } from './dynamics.ts';

/**
 * The frontal key's own 11-layer breakdown (`art/rig.json`'s
 * `artMeta.layers.frontal`), drawn separately instead of the flattened
 * `head-flat.png` whenever every one of these is present. This is what lets
 * the pinned body sit correctly *between* `hairBack` and the rest (the
 * authored `zOrder` the art pass wrote: `hairBack, body, headCore, ...`) and
 * what lets the iris travel and the loose parts swing on their own lag —
 * none of which a single flattened texture can do. Falls back to the old
 * single-texture fill-in when the art delivery doesn't have all of these
 * (a coarser yaw key, or a future rig missing one file) — see `load()`.
 */
const FRONTAL_SUB_LAYERS = [
  'hairBack',
  'headCore',
  'eyeApertureR',
  'eyeApertureL',
  'irisR',
  'irisL',
  'hairFront',
  'strand1',
  'strand2',
  'earring',
] as const;

/**
 * Not measured — the motion spec has nothing on iris travel range or loose-part
 * lag (see its own §12, "eye-lead over the head could not be measured"). These
 * are rig-geometry tuning choices, kept separate from `constants.ts` (which is
 * reserved for numbers the spec actually measured) and small enough that the
 * iris stays inside `eyeAperture*.filled.png`'s painted socket and the loose
 * parts read as trailing the turn, not detaching from it.
 */
const IRIS_TRAVEL_PX: readonly [number, number] = [11, 7];
/** Seconds. Independent of the head spring's own tau (0.14s, `constants.ts`) on purpose: these parts must visibly trail the turn, not arrive with it ("the earring lag, strands crossing the eye on their own lag"). */
const LOOSE_LAG_TAU: Record<'earring' | 'strand1' | 'strand2', number> = { earring: 0.5, strand1: 0.32, strand2: 0.38 };
/** px of swing per unit of (target yawNorm - lagged yawNorm); how far behind the head this part visibly falls mid-turn. */
const LOOSE_SWING_PX: Record<'earring' | 'strand1' | 'strand2', number> = { earring: 16, strand1: 20, strand2: 18 };
/** px amplitude of the extra continuous idle jiggle (BandNoise, same band as head/chest sway) so a loose part still moves when the head is still — spec §6: "the strand pattern changes independently of head position." */
const LOOSE_IDLE_PX: Record<'earring' | 'strand1' | 'strand2', number> = { earring: 3, strand1: 5, strand2: 4 };

/**
 * Interpupillary distance in plate pixels — sampled directly from the frontal
 * plate's own pixels (README Part 1: the green-eye pupil at (338,422), the
 * blue-eye pupil at (609,406), both colour-sampled, not eyeballed), not a
 * guess. `RIG_CONSTANTS.sway.chestAmpPctIpd` is a percentage of IPD; this is
 * the only place that percentage needs an actual pixel distance to multiply.
 */
const PLATE_IPD_PX = Math.hypot(609 - 338, 406 - 422);
/**
 * How the pinned body layer's own breathing sway (`RenderFrame.chestSample`,
 * `state.ts`'s `chestSway()`) splits between a mostly-vertical rise/fall and a
 * smaller sideways component — a rig-geometry tuning choice (the spec gives
 * an amplitude as a percentage of IPD, section 11, but not an axis split for
 * a layer that doesn't rotate), not a measured constant, same reasoning as
 * `IRIS_TRAVEL_PX`/`LOOSE_SWING_PX` above.
 */
const CHEST_SWAY_AXIS_WEIGHT: { x: number; y: number } = { x: 0.35, y: 1 };

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
  /** `state.ts`'s `chestSample` — unit-RMS band noise, independent phase from head sway, 0 when reduced motion. */
  chestSample: number;
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
  /** The frontal key's own sub-layers (see `FRONTAL_SUB_LAYERS`); empty until `load()` confirms every one exists. */
  private readonly frontalLayers = new Map<string, { tex: WebGLTexture; box: [number, number, number, number] }>();
  private lastRenderTime: number | null = null;
  private readonly earringLag = new ExponentialSpring(0, LOOSE_LAG_TAU.earring);
  private readonly strand1Lag = new ExponentialSpring(0, LOOSE_LAG_TAU.strand1);
  private readonly strand2Lag = new ExponentialSpring(0, LOOSE_LAG_TAU.strand2);
  private readonly earringNoise = new BandNoise({ seed: 0xe001, phaseOffset: 0 });
  private readonly strand1Noise = new BandNoise({ seed: 0xe002, phaseOffset: 1.1 });
  private readonly strand2Noise = new BandNoise({ seed: 0xe003, phaseOffset: 2.3 });

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
      // The frontal key's own layer breakdown, for correct z-order (the
      // pinned body sits *between* hairBack and the rest) and per-layer
      // motion (iris travel, earring/strand lag) — see FRONTAL_SUB_LAYERS's
      // doc comment. Loaded best-effort: any missing/broken file just leaves
      // `frontalLayers` short of the full set, and `render()` falls back to
      // the flattened `head-flat.png` already loaded above.
      const frontalFiles = this.rig.artMeta?.layers?.frontal?.files;
      if (frontalFiles) {
        for (const name of FRONTAL_SUB_LAYERS) {
          const entry = frontalFiles[name];
          if (!entry?.box) continue;
          try {
            const img = await loadImage(this.assetBaseUrl + entry.file);
            this.frontalLayers.set(name, { tex: createTextureFromImage(gl, img), box: entry.box });
          } catch {
            // Missing/broken sub-layer: leaves the set short of
            // FRONTAL_SUB_LAYERS.length, so render() uses the flattened
            // fallback instead of drawing a partial, wrongly-ordered stack.
          }
        }
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
    /**
     * This draw's own quad in canvas-normalised UV space — see the FIX note
     * on `uUVBox` in `shaders.ts`. Omitted only for the stand-in's one
     * full-canvas grid mesh, where the quad's local UV already IS canvas UV
     * (identity, the shader's own default uniform value of 0 would be wrong,
     * so this always sets it explicitly rather than relying on a GL default).
     */
    uvBox?: [number, number, number, number];
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
    const uv = uniforms.uvBox ?? [0, 0, 1, 1];
    gl.uniform4f(gl.getUniformLocation(this.bodyProgram, 'uUVBox'), uv[0], uv[1], uv[2], uv[3]);
  }

  /** A pixel box (rig canvas units) -> its own box in canvas-normalised UV space, for `uUVBox`. */
  private boxToUvBox(box: [number, number, number, number]): [number, number, number, number] {
    const cw = this.rig.canvas.width;
    const ch = this.rig.canvas.height;
    return [box[0] / cw, box[1] / ch, box[2] / cw, box[3] / ch];
  }

  /** A pixel-space delta (rig canvas units) -> the NDC offset `uOffset` expects. */
  private pxDeltaToNdc(dxPx: number, dyPx: number): [number, number] {
    const cw = this.rig.canvas.width;
    const ch = this.rig.canvas.height;
    return [(dxPx / cw) * 2, -((dyPx / ch) * 2)];
  }

  /**
   * `RenderFrame.chestSample` (unit-RMS band noise, `state.ts`) -> the small
   * NDC nudge applied to the pinned body layer only, so it breathes instead
   * of sitting perfectly still (the architecture brief's own words: "a
   * pinned body layer ... that never moves except breathing"). Was computed
   * every frame and never read by anything (AGENTS.md hard rule 4) — fixed
   * this pass by threading it through `state.ts: Frame.chestSample` ->
   * `driver.ts` -> `RenderFrame.chestSample` -> here.
   */
  private chestOffsetNdc(chestSample: number): [number, number] {
    const ampPx = (RIG_CONSTANTS.sway.chestAmpPctIpd / 100) * PLATE_IPD_PX;
    return this.pxDeltaToNdc(chestSample * ampPx * CHEST_SWAY_AXIS_WEIGHT.x, chestSample * ampPx * CHEST_SWAY_AXIS_WEIGHT.y);
  }

  /** Draws one of the frontal key's own sub-layers (see FRONTAL_SUB_LAYERS) at its authored box, optionally nudged by `offset` (NDC). No-op if that layer didn't load. */
  private drawFrontalLayer(name: string, opacity: number, offset: [number, number] = [0, 0]): void {
    const gl = this.gl;
    if (!gl) return;
    const layer = this.frontalLayers.get(name);
    if (!layer) return;
    const placement = this.pixelBoxToNdc(layer.box);
    this.drawHeadProgramCommon({
      tex: layer.tex,
      yawNorm: 0,
      pitchNorm: 0,
      warpScale: 0,
      scale: placement.scale,
      center: placement.center,
      offset,
      opacity,
      uvBox: this.boxToUvBox(layer.box),
    });
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * Everything in the frontal recipe *except* hairBack (which sits behind
   * the body and is drawn once, unconditionally — see `render()`): headCore
   * through earring, in zOrder, each at `opacity` and nudged by `baseOffset`
   * (the chin-alignment rigid NDC nudge `chinAlignmentNdc` computes when
   * frontal is blending against another key) plus its own per-layer motion
   * (iris travel, earring/strand lag). Used both for the unconditional
   * gap-mitigation fill-in (`baseOffset = [0,0]`, `opacity = 1`) and for
   * frontal's own slot in the yaw bracket (its cross-dissolve opacity and
   * chin offset) — see the "the seam this pass found" note in README.md for
   * why a bare redraw of the flattened texture there is wrong.
   */
  private drawFrontalFrontStack(
    opacity: number,
    baseOffset: [number, number],
    perLayer: { iris: [number, number]; strand1: [number, number]; strand2: [number, number]; earring: [number, number] },
    full: boolean,
  ): void {
    const add = (o: [number, number]): [number, number] => [baseOffset[0] + o[0], baseOffset[1] + o[1]];
    this.drawFrontalLayer('headCore', opacity, baseOffset);
    // The small decorative/detail layers (eyes, strands, earring) only make
    // sense at their authored frontal-pose position when frontal is the
    // pose actually showing (`full`, set when frontal is genuinely part of
    // the yaw bracket). Drawing them under a *different*, already-opaque key
    // as blind gap-filler doesn't fill a gap — that key's own crop already
    // covers this area — it just floats a second earring/eye over a turned
    // head at the wrong spot (found in this pass's own browser check: a
    // duplicate earring ghosting at q34-left/q34-right, worse than the small
    // hair/skin-coverage gaps the fill-in exists for). `headCore`+`hairFront`
    // read as a plausible face/hair smudge in a gap; these don't.
    if (full) {
      this.drawFrontalLayer('eyeApertureR', opacity, baseOffset);
      this.drawFrontalLayer('eyeApertureL', opacity, baseOffset);
      this.drawFrontalLayer('irisR', opacity, add(perLayer.iris));
      this.drawFrontalLayer('irisL', opacity, add(perLayer.iris));
    }
    this.drawFrontalLayer('hairFront', opacity, baseOffset);
    if (full) {
      this.drawFrontalLayer('strand1', opacity, add(perLayer.strand1));
      this.drawFrontalLayer('strand2', opacity, add(perLayer.strand2));
      this.drawFrontalLayer('earring', opacity, add(perLayer.earring));
    }
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
      gl.bindVertexArray(this.patchVao);

      // Advance the loose-part lag springs + idle noise once per frame.
      // `render()` gets absolute `timeSeconds`, not `dt`, so it's recovered
      // here the same way `driver.ts` recovers it from `performance.now()`.
      const rawDt = this.lastRenderTime === null ? 0 : frame.timeSeconds - this.lastRenderTime;
      const dt = Math.max(0, Math.min(0.1, rawDt));
      this.lastRenderTime = frame.timeSeconds;
      const yawNormTarget = this.yawNormFor(frame.yawDeg);
      this.earringLag.setTarget(yawNormTarget);
      this.strand1Lag.setTarget(yawNormTarget);
      this.strand2Lag.setTarget(yawNormTarget);
      const earringLagged = this.earringLag.step(dt);
      const strand1Lagged = this.strand1Lag.step(dt);
      const strand2Lagged = this.strand2Lag.step(dt);
      // Swing = how far this part still is behind the head's own turn, so it
      // reads as trailing during a turn and settles back to its rest pose
      // once the head holds — plus a small continuous idle jiggle so it
      // still moves independently while the head is still (spec §6).
      const earringSwingPx = (yawNormTarget - earringLagged) * LOOSE_SWING_PX.earring + this.earringNoise.sample(frame.timeSeconds) * LOOSE_IDLE_PX.earring;
      const strand1SwingPx = (yawNormTarget - strand1Lagged) * LOOSE_SWING_PX.strand1 + this.strand1Noise.sample(frame.timeSeconds) * LOOSE_IDLE_PX.strand1;
      const strand2SwingPx = (yawNormTarget - strand2Lagged) * LOOSE_SWING_PX.strand2 + this.strand2Noise.sample(frame.timeSeconds) * LOOSE_IDLE_PX.strand2;
      const earringOffset = this.pxDeltaToNdc(earringSwingPx, this.earringNoise.sample(frame.timeSeconds + 50) * LOOSE_IDLE_PX.earring * 0.6);
      const strand1Offset = this.pxDeltaToNdc(strand1SwingPx, this.strand1Noise.sample(frame.timeSeconds + 50) * LOOSE_IDLE_PX.strand1 * 0.6);
      const strand2Offset = this.pxDeltaToNdc(strand2SwingPx, this.strand2Noise.sample(frame.timeSeconds + 50) * LOOSE_IDLE_PX.strand2 * 0.6);
      // Iris travel within its painted socket — not measured (§12: "eye-lead
      // over the head could not be measured"), so this moves *with* the head
      // turn exactly as the spec's own gaze rule says to (§5: "gaze changes
      // happen with the head turn, not instead of it"), never on its own.
      const irisOffset = this.pxDeltaToNdc(yawNormTarget * IRIS_TRAVEL_PX[0], -frame.pitchNorm * IRIS_TRAVEL_PX[1]);

      const frontalReady = this.frontalLayers.size >= FRONTAL_SUB_LAYERS.length;

      // Computed here (once) instead of after the fill-in, as the previous
      // pass had it: the fill-in below needs to know *before* it draws
      // whether frontal is genuinely part of the active bracket, or it draws
      // frontal's headCore+hairFront a second time at a different offset —
      // see the fix note on `frontalInBracket` below.
      const bracket = bracketForYaw(this.keysByYaw, frame.yawDeg);
      const { a, b, t } = bracket;
      const frontalInBracket = a.id === 'frontal' || b?.id === 'frontal';

      // Both the pinned body and hairBack move together for breathing (see
      // chestOffsetNdc's own doc comment): hairBack's box (0,0,832,702)
      // overlaps the body's own box along the collar, and the two are
      // pixel-identical crops of the same plate there (rig-cut.py cut both
      // from the same source). Giving the body a chest-sway offset without
      // giving hairBack the SAME offset desyncs that shared boundary —
      // found this pass, rendering a mid-turn frame with chest sway active:
      // a visible seam opened and closed at the collar as the body slid a
      // few pixels against a hairBack that hadn't moved. Both are part of
      // the one rigid "pinned assembly" the brief describes ("a pinned body
      // layer... that never moves except breathing") — hairBack breathes
      // with it, it just isn't warped by the head's own yaw/pitch spring
      // the way the head layers are.
      const chestOffset = this.chestOffsetNdc(frame.chestSample);
      if (frontalReady) {
        // hairBack is BEHIND the pinned body in the art pass's own zOrder
        // (`hairBack, body, headCore, ...` — art/rig.json's artMeta.layers.
        // frontal.zOrder). Drawing it first, body second, matches that; the
        // flattened head-flat.png fallback below draws hairBack baked in
        // *front* of body instead, which is the seam this pass found (the
        // hair silhouette clashing with the collar edge — see README).
        this.drawFrontalLayer('hairBack', 1, chestOffset);
      }

      // The pinned body layer: never warped, never relit (a huge/offscreen
      // head box forces its mask to 0 — see BODY_FRAG's `vMask`).
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
        offset: chestOffset,
        opacity: 1,
        uvBox: this.boxToUvBox(bodyBox),
      });
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      const perLayerOffsets = { iris: irisOffset, strand1: strand1Offset, strand2: strand2Offset, earring: earringOffset };

      if (frontalReady && !frontalInBracket) {
        // Gap mitigation, ONLY when frontal is not itself the pose being
        // shown (see `frontalInBracket` above): frontal's own front stack
        // under whatever the yaw bracket draws next, so a key with no
        // hidden-region art (q34-right, profile-left) shows frontal
        // hair/collar through its own gaps instead of bare canvas.
        //
        // FIX (this pass): this used to run unconditionally, every frame,
        // at a fixed [0,0] offset, even for every yaw in (-40, 40] where
        // frontal is ALSO the bracket's own `a` or `b` key (drawn again a
        // few lines down, at the bracket's own non-zero chin-alignment
        // offset — nonzero everywhere except exactly yaw 0, since the two
        // keys being blended don't share a chin position). That produced two
        // full-opacity copies of frontal's headCore+hairFront, one at [0,0]
        // and one nudged sideways — a hard, growing-with-|t| double exposure
        // at every yaw away from dead centre, confirmed at native resolution
        // (see README "Fix pass" section). Scoping the fill-in to only the
        // yaws where frontal ISN'T already being drawn by the bracket step
        // removes the duplicate without losing any coverage: the bracket
        // step below draws frontal's full stack, at the correct offset,
        // for every yaw where it's part of the bracket.
        this.drawFrontalFrontStack(1, [0, 0], perLayerOffsets, false);
      } else if (!frontalReady) {
        // Fallback: the art delivery is missing one of FRONTAL_SUB_LAYERS
        // (or this is an older rig.json with no artMeta at all) — fill in
        // with the flattened head-flat.png, as this pass's predecessor did.
        // Known to mis-order hairBack in front of the body (see above).
        const frontalKey = this.keysByYaw.find((k) => k.yawDeg === 0);
        const frontalTex = frontalKey ? this.keyTextures.get(frontalKey.id) : null;
        if (frontalKey && frontalTex) {
          const box = frontalKey.placementBox ?? [0, 0, this.rig.canvas.width, this.rig.canvas.height];
          const placement = this.pixelBoxToNdc(box);
          this.drawHeadProgramCommon({
            tex: frontalTex,
            yawNorm: 0,
            pitchNorm: 0,
            warpScale: 0,
            scale: placement.scale,
            center: placement.center,
            offset: [0, 0],
            opacity: 1,
            uvBox: this.boxToUvBox(box),
          });
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }

      // FIX (this pass, second finding): a plain linear cross-dissolve
      // (opacity = t, all the way across each 40deg bracket segment) means
      // `b`'s own alpha-1 pixels still show through `a` at every t strictly
      // between 0 and 1 — even at t=0.91 (yaw a couple of degrees off dead
      // centre), 9% of a structurally different painted key bleeds through
      // "opaque" face content, reading as a soft rectangular double-exposure.
      // Measured this pass: the refutation's own sampled yaws (2.7, -13.4,
      // -20..-25deg etc.) all land at |t| meaningfully away from both 0 and
      // 1 under a LINEAR blend. `easedT` (smootherstep) doesn't remove that —
      // two different paintings of a turned head still don't share pixel
      // positions, so blending them at ANY nonzero weight always shows a
      // soft double exposure; only a real per-triangle mesh warp of the
      // interior (Part 2's own table: "NOT built", judged too much added
      // risk/build time for that pass) removes it outright, and building
      // that is out of this pass's own scope too (see README "Not fixed,
      // and why"). What `easedT` DOES do, honestly: it shrinks the yaw RANGE
      // over which the blend weight is large enough to be visible — flat
      // near 0 and near 1, it spends most of each 40deg segment close to a
      // single key, so only a narrower band near each segment's own midpoint
      // shows a strong double-exposure, instead of the whole segment showing
      // a weaker one (linear). Position (`chinAlignmentNdc`) uses the same
      // eased weight so the rigid chin-anchor offset and the opacity move
      // together, never disagreeing mid-blend.
      const easedT = smootherstep(t);
      const { offsetA, offsetB } = this.chinAlignmentNdc(a, b, easedT);
      const yawNorm = yawNormTarget;
      // `a` is drawn opaque, `b` blended on top at weight `easedT` — this is
      // what actually produces the cross-dissolve; the fill-in above only
      // fills gaps outside it. Frontal is *always* one end of the bracket for
      // yaw in [-40, 40] (bracketForYaw), so this redraws it there — with
      // its own zOrder-correct layer stack, not the flattened texture, or
      // the earlier hairBack/body fix would be undone the moment frontal
      // re-entered the bracket (the bug this pass's own first attempt shipped
      // — a hard rectangle where the flattened q34-left texture painted over
      // the correctly-layered fill-in; see README "known issues").
      if (a.id === 'frontal' && frontalReady) {
        this.drawFrontalFrontStack(1, offsetA, perLayerOffsets, true);
      } else {
        const texA = this.keyTextures.get(a.id);
        if (texA) {
          const boxA = a.placementBox ?? [0, 0, this.rig.canvas.width, this.rig.canvas.height];
          const placementA = this.pixelBoxToNdc(boxA);
          this.drawHeadProgramCommon({
            tex: texA,
            yawNorm,
            pitchNorm: frame.pitchNorm,
            warpScale: 0,
            scale: placementA.scale,
            center: placementA.center,
            offset: offsetA,
            opacity: 1,
            uvBox: this.boxToUvBox(boxA),
          });
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }
      if (b && easedT > 0.001) {
        if (b.id === 'frontal' && frontalReady) {
          this.drawFrontalFrontStack(easedT, offsetB, perLayerOffsets, true);
        } else {
          const texB = this.keyTextures.get(b.id);
          if (texB) {
            const boxB = b.placementBox ?? [0, 0, this.rig.canvas.width, this.rig.canvas.height];
            const placementB = this.pixelBoxToNdc(boxB);
            this.drawHeadProgramCommon({
              tex: texB,
              yawNorm,
              pitchNorm: frame.pitchNorm,
              warpScale: 0,
              scale: placementB.scale,
              center: placementB.center,
              offset: offsetB,
              opacity: easedT,
              uvBox: this.boxToUvBox(boxB),
            });
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          }
        }
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
    for (const layer of this.frontalLayers.values()) gl.deleteTexture(layer.tex);
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

/**
 * Ken Perlin's "smootherstep": 0 and 1 at the ends (exactly, so a bracket
 * boundary still hands off at a clean 0/1 with no pop), first AND second
 * derivative zero there too — flatter near both ends than `smoothstep`,
 * which is the point (see the fix note above `easedT` in `render()`): most
 * of a 40deg bracket segment stays close to a single key, and only a
 * narrower band near its middle carries a visible two-key blend.
 */
function smootherstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}
