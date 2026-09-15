import {
  ACESFilmicToneMapping,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  Vector2,
  WebGLRenderer,
  type Camera,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
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
  bloomThreshold: 0.82,
  bloomStrength: 0.55,
  bloomRadius: 0.4,
  tiltFocus: 0.34,
  tiltBandWidth: 0.22,
  tiltMaxBlur: 6,
};

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
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setClearColor(0x04060b, 1);
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
