import {
  NoToneMapping,
  PCFSoftShadowMap,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Camera,
} from 'three';
import { setPaintedAnisotropy } from './PaintedArt.ts';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { maskBloomHighPass, setFigureBloomMask } from './BloomMask.ts';
import { TiltShiftShader } from './shaders/TiltShiftShader.ts';
import { GradeShader } from './shaders/GradeShader.ts';

export interface RendererOptions {
  /** Element the <canvas> is appended to. Defaults to #game. */
  container?: HTMLElement;
  /** Vertical field of view for the default camera. HD-2D wants a long lens. */
  fov?: number;
  /** Hard ceiling on devicePixelRatio, to keep the post chain affordable. */
  maxPixelRatio?: number;
}

/** Tunables surfaced for scenes and the debug API. */
export interface PostSettings {
  bloomThreshold: number;
  bloomStrength: number;
  bloomRadius: number;
  tiltFocus: number;
  tiltBandWidth: number;
  tiltMaxBlur: number;
}

const DEFAULT_POST: PostSettings = {
  bloomThreshold: 0.9,
  bloomStrength: 0.5,
  bloomRadius: 0.55,
  tiltFocus: 0.34,
  tiltBandWidth: 0.22,
  tiltMaxBlur: 6,
};

/**
 * The whole look of one scene in one object: post-chain settings plus the
 * colour grade. Scenes ship a `ScenePalette`, the debug API can patch it, and
 * `docs/ENGINE-API.md` documents the fields.
 *
 * Grade semantics match `GradeShader`: `out = ((in * gain) + lift) ^ (1/gamma)`,
 * then a shadow split-tone, saturation, grain and vignette.
 */
export interface ScenePalette {
  /** For debugging / snapshots only. */
  name?: string;
  /** Shadow offset per channel. Neutral = [0, 0, 0]. */
  lift?: [number, number, number];
  /** Midtone curve per channel. Neutral = [1, 1, 1]. */
  gamma?: [number, number, number];
  /** Highlight multiplier per channel. Neutral = [1, 1, 1]. */
  gain?: [number, number, number];
  saturation?: number;
  vignette?: number;
  vignetteRadius?: number;
  /** Hue pushed into the shadows, as a 0..1 RGB triple. */
  shadowTint?: [number, number, number];
  shadowTintAmount?: number;
  /** Animated film grain, 0..0.08. */
  grain?: number;
  /** Renderer exposure; painted backdrops usually want a touch under 1. */
  exposure?: number;
  bloomThreshold?: number;
  bloomStrength?: number;
  bloomRadius?: number;
  tiltFocus?: number;
  tiltBandWidth?: number;
  tiltMaxBlur?: number;
  /** How far the painted figures are kept out of the bloom, 0..1 (`BloomMask.ts`). Unset is 0, not "keep". */
  figureBloomMask?: number;
}

/**
 * Owns the WebGL renderer, the default perspective camera and the HD-2D post
 * chain:
 *
 *   RenderPass -> UnrealBloomPass -> TiltShift(H) -> TiltShift(V) -> Grade
 *
 * Call {@link render} every frame with the scene and camera to draw.
 */
export class Renderer {
  readonly renderer: WebGLRenderer;
  readonly camera: PerspectiveCamera;
  readonly composer: EffectComposer;
  readonly container: HTMLElement;

  readonly bloomPass: UnrealBloomPass;
  readonly tiltH: ShaderPass;
  readonly tiltV: ShaderPass;
  readonly gradePass: ShaderPass;

  private readonly renderPass: RenderPass;
  private readonly maxPixelRatio: number;
  private readonly onWindowResize = (): void => this.resize();
  private disposed = false;

  constructor(opts: RendererOptions = {}) {
    const container =
      opts.container ?? (document.getElementById('game') as HTMLElement | null) ?? document.body;
    this.container = container;
    this.maxPixelRatio = opts.maxPixelRatio ?? 2;

    this.renderer = new WebGLRenderer({
      antialias: false, // the tilt-shift + grade passes read better without MSAA edges
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      // Keeps the framebuffer readable after compositing so e2e tests and the
      // critic can sample the canvas (drawImage / toDataURL / readPixels).
      preserveDrawingBuffer: true,
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    // NoToneMapping, per research/visual-bible.md 6.4: the painted planes are
    // unlit ShaderMaterials that never see the tone mapper, so tone-mapping the
    // lit geometry would leave the ground several stops darker than the
    // characters standing on it. Grading happens in GradeShader instead.
    this.renderer.toneMapping = NoToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.setClearColor(0x04060b, 1);
    // Painted 2.5D wants real ground shadows under the figures and the props.
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    setPaintedAnisotropy(this.renderer.capabilities.getMaxAnisotropy());
    this.renderer.domElement.setAttribute('data-role', 'game-canvas');
    container.appendChild(this.renderer.domElement);

    const { width, height } = this.measure();

    this.camera = new PerspectiveCamera(opts.fov ?? 34, width / height, 0.1, 400);
    this.camera.position.set(0, 3.4, 9);
    this.camera.lookAt(0, 1.4, 0);

    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(this.pixelRatio());
    this.composer.setSize(width, height);

    // RenderPass wants a scene up front; the real one is swapped in per frame.
    this.renderPass = new RenderPass(new Scene(), this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomPass = new UnrealBloomPass(
      new Vector2(width, height),
      DEFAULT_POST.bloomStrength,
      DEFAULT_POST.bloomRadius,
      DEFAULT_POST.bloomThreshold,
    );
    // The painted characters mask themselves out of the bloom (PR-0097, BloomMask.ts).
    maskBloomHighPass(this.bloomPass);
    this.composer.addPass(this.bloomPass);

    this.tiltH = new ShaderPass(TiltShiftShader);
    this.tiltV = new ShaderPass(TiltShiftShader);
    (this.tiltH.uniforms['direction']!.value as Vector2).set(1, 0);
    (this.tiltV.uniforms['direction']!.value as Vector2).set(0, 1);
    this.composer.addPass(this.tiltH);
    this.composer.addPass(this.tiltV);

    this.gradePass = new ShaderPass(GradeShader);
    this.gradePass.renderToScreen = true;
    this.composer.addPass(this.gradePass);

    this.applyPost(DEFAULT_POST);
    this.resize();

    window.addEventListener('resize', this.onWindowResize, { passive: true });
  }

  /** The canvas element, for pointer handling and screenshots. */
  get domElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  private pixelRatio(): number {
    return Math.min(window.devicePixelRatio || 1, this.maxPixelRatio);
  }

  private measure(): { width: number; height: number } {
    const rect = this.container.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || window.innerWidth));
    const height = Math.max(1, Math.round(rect.height || window.innerHeight));
    return { width, height };
  }

  /** Patch any subset of the post settings. */
  applyPost(patch: Partial<PostSettings>): void {
    if (patch.bloomThreshold !== undefined) this.bloomPass.threshold = patch.bloomThreshold;
    if (patch.bloomStrength !== undefined) this.bloomPass.strength = patch.bloomStrength;
    if (patch.bloomRadius !== undefined) this.bloomPass.radius = patch.bloomRadius;
    for (const pass of [this.tiltH, this.tiltV]) {
      if (patch.tiltFocus !== undefined) pass.uniforms['focus']!.value = patch.tiltFocus;
      if (patch.tiltBandWidth !== undefined) pass.uniforms['bandWidth']!.value = patch.tiltBandWidth;
      if (patch.tiltMaxBlur !== undefined) pass.uniforms['maxBlur']!.value = patch.tiltMaxBlur;
    }
  }

  /** Patch the grade uniforms (lift / gamma / gain are THREE.Vector3). */
  gradeUniform(name: keyof typeof GradeShader.uniforms, value: number): void {
    const u = this.gradePass.uniforms[name as string];
    if (u) u.value = value;
  }

  /**
   * Apply a whole {@link ScenePalette}: grade, vignette, grain, exposure and
   * the post-chain settings, in one call. Every field is optional, so a scene
   * can patch a single value without restating the rest.
   */
  applyPalette(palette: ScenePalette): void {
    const vec = (name: string, v: [number, number, number] | undefined): void => {
      if (!v) return;
      const u = this.gradePass.uniforms[name];
      if (u) (u.value as Vector3).set(v[0], v[1], v[2]);
    };
    vec('lift', palette.lift);
    vec('gamma', palette.gamma);
    vec('gain', palette.gain);
    vec('shadowTint', palette.shadowTint);
    const num = (name: string, v: number | undefined): void => {
      if (v === undefined) return;
      const u = this.gradePass.uniforms[name];
      if (u) u.value = v;
    };
    num('saturation', palette.saturation);
    num('vignette', palette.vignette);
    num('vignetteRadius', palette.vignetteRadius);
    num('shadowTintAmount', palette.shadowTintAmount);
    num('grain', palette.grain);
    if (palette.exposure !== undefined) this.renderer.toneMappingExposure = palette.exposure;

    this.applyPost({
      ...(palette.bloomThreshold !== undefined ? { bloomThreshold: palette.bloomThreshold } : {}),
      ...(palette.bloomStrength !== undefined ? { bloomStrength: palette.bloomStrength } : {}),
      ...(palette.bloomRadius !== undefined ? { bloomRadius: palette.bloomRadius } : {}),
      ...(palette.tiltFocus !== undefined ? { tiltFocus: palette.tiltFocus } : {}),
      ...(palette.tiltBandWidth !== undefined ? { tiltBandWidth: palette.tiltBandWidth } : {}),
      ...(palette.tiltMaxBlur !== undefined ? { tiltMaxBlur: palette.tiltMaxBlur } : {}),
    });
    setFigureBloomMask(this.bloomPass, palette.figureBloomMask ?? 0);
    this.palette = palette;
  }

  /** The palette last applied, for the debug snapshot. */
  palette: ScenePalette | null = null;

  resize(): void {
    if (this.disposed) return;
    const { width, height } = this.measure();
    const dpr = this.pixelRatio();

    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.composer.setPixelRatio(dpr);
    this.composer.setSize(width, height);
    this.bloomPass.setSize(width, height);

    const invW = 1 / Math.max(1, width * dpr);
    const invH = 1 / Math.max(1, height * dpr);
    (this.tiltH.uniforms['resolution']!.value as Vector2).set(invW, invH);
    (this.tiltV.uniforms['resolution']!.value as Vector2).set(invW, invH);
  }

  /** Draw one frame through the post chain. */
  render(scene: Scene, camera: Camera = this.camera): void {
    if (this.disposed) return;
    this.renderPass.scene = scene;
    this.renderPass.camera = camera;
    const t = this.gradePass.uniforms['time'];
    if (t) t.value = performance.now() / 1000;
    this.composer.render();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    window.removeEventListener('resize', this.onWindowResize);
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
