import {
  HalfFloatType,
  NearestFilter,
  NoBlending,
  ShaderMaterial,
  WebGLRenderTarget,
  type Camera,
  type Scene,
  type WebGLRenderer,
} from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import type { CrispFilter } from './CrispConfig.ts';

/**
 * Supersampling of the scene pass, resolved with a real reconstruction filter (the crispness options round, option D).
 *
 * The scene is drawn into a half-float target `scale` times wider and taller than the composer's buffer, then resolved down to it
 * by a separable filter (Lanczos, Catmull-Rom, Mitchell or a box) BEFORE the bloom, so the rest of the chain (bloom, glow,
 * tilt-shift, grade, grain) runs at the size it always did and keeps its look. Every texture is sampled `log2(scale)` mip levels
 * finer, which is where the crispness comes from; the resolve is the low-pass that keeps it alias-free. An anti-ringing clamp
 * (to the range of the texels inside the output pixel's own footprint) takes the halo off the dark ink lines.
 *
 * The scene draws unchanged: no MSAA (`samples` 0), the same clear, the same frame alpha (the bloom mask) filtered like colour.
 */
const VERT = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D tSrc;
  uniform vec2 uDir;       // (1,0) horizontal, (0,1) vertical
  uniform float uScale;    // source texels per output texel along the axis (>= 1)
  uniform int uKernel;     // 0 box, 1 lanczos3, 2 lanczos2, 3 catmull-rom, 4 mitchell
  uniform float uRing;     // 0..1: how much of the anti-ringing clamp to apply

  float sinc(float x) {
    x *= 3.14159265;
    return abs(x) < 1e-5 ? 1.0 : sin(x) / x;
  }

  float support() {
    if (uKernel == 0) return 0.5;
    if (uKernel == 1) return 3.0;
    return 2.0;
  }

  float kern(float x) {
    x = abs(x);
    if (uKernel == 0) return x < 0.5 ? 1.0 : 0.0;
    if (uKernel == 1) return x < 3.0 ? sinc(x) * sinc(x / 3.0) : 0.0;
    if (uKernel == 2) return x < 2.0 ? sinc(x) * sinc(x / 2.0) : 0.0;
    if (uKernel == 3) {
      if (x < 1.0) return 1.5 * x * x * x - 2.5 * x * x + 1.0;
      if (x < 2.0) return -0.5 * x * x * x + 2.5 * x * x - 4.0 * x + 2.0;
      return 0.0;
    }
    if (x < 1.0) return (7.0 * x * x * x - 12.0 * x * x + 16.0 / 3.0) / 6.0;
    if (x < 2.0) return (-7.0 / 3.0 * x * x * x + 12.0 * x * x - 20.0 * x + 32.0 / 3.0) / 6.0;
    return 0.0;
  }

  void main() {
    ivec2 p = ivec2(gl_FragCoord.xy);
    bool horiz = uDir.x > 0.5;
    ivec2 size = textureSize(tSrc, 0);
    int n = horiz ? size.x : size.y;
    float c = horiz ? float(p.x) : float(p.y);
    float xs = (c + 0.5) * uScale - 0.5;
    float R = support() * uScale;
    int i0 = int(ceil(xs - R));
    int i1 = int(floor(xs + R));
    vec4 acc = vec4(0.0);
    float wsum = 0.0;
    vec4 mn = vec4(1e9);
    vec4 mx = vec4(-1e9);
    for (int k = 0; k < 48; k++) {
      int i = i0 + k;
      if (i > i1) break;
      float d = float(i) - xs;
      float w = kern(d / uScale);
      ivec2 q = horiz ? ivec2(clamp(i, 0, n - 1), p.y) : ivec2(p.x, clamp(i, 0, n - 1));
      vec4 t = texelFetch(tSrc, q, 0);
      acc += w * t;
      wsum += w;
      if (abs(d) <= 0.5 * uScale + 1e-3) {
        mn = min(mn, t);
        mx = max(mx, t);
      }
    }
    vec4 r = acc / max(wsum, 1e-6);
    if (uRing > 0.0 && mx.x >= mn.x) r = mix(r, clamp(r, mn, mx), uRing);
    gl_FragColor = max(r, vec4(0.0));
  }
`;

const KERNEL_INDEX: Record<CrispFilter, number> = { box: 0, lanczos: 1, lanczos2: 2, catmull: 3, mitchell: 4 };

export class SsaaRenderPass extends RenderPass {
  private readonly target: WebGLRenderTarget;
  private readonly mid: WebGLRenderTarget;
  private readonly quad: FullScreenQuad;
  private readonly material: ShaderMaterial;
  private outW = 1;
  private outH = 1;
  private want = 1;
  private got = 1;
  private cap = 16384;
  private sized = false;

  constructor(scene: Scene, camera: Camera) {
    super(scene, camera);
    this.target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: true, samples: 0 });
    this.target.texture.name = 'SsaaRenderPass.target';
    this.mid = new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: false, minFilter: NearestFilter, magFilter: NearestFilter });
    this.mid.texture.name = 'SsaaRenderPass.mid';
    this.material = new ShaderMaterial({
      name: 'SsaaResolve',
      uniforms: {
        tSrc: { value: null },
        uDir: { value: { x: 1, y: 0 } },
        uScale: { value: 2 },
        uKernel: { value: 2 },
        uRing: { value: 0.5 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.material);
  }

  /** The scale asked for (the effective one is {@link effective}). */
  setScale(scale: number, maxTexture = this.cap): void {
    this.want = Math.max(1, scale);
    this.cap = maxTexture;
    this.applySize();
  }

  setFilter(filter: CrispFilter, ring: number): void {
    this.material.uniforms['uKernel']!.value = KERNEL_INDEX[filter];
    this.material.uniforms['uRing']!.value = ring;
  }

  /** The scale really drawn: the one asked for, held to the largest texture the GPU has and to about 36 megapixels. */
  get effective(): number {
    return this.got;
  }

  /** Give the supersampled targets back to the GPU (they come back, at the right size, the next time the pass draws). */
  release(): void {
    this.target.dispose();
    this.mid.dispose();
    this.sized = false;
  }

  override setSize(width: number, height: number): void {
    this.outW = Math.max(1, Math.round(width));
    this.outH = Math.max(1, Math.round(height));
    this.applySize();
  }

  private applySize(): void {
    const byTex = this.cap / Math.max(this.outW, this.outH);
    const byPixels = Math.sqrt(36e6 / (this.outW * this.outH));
    this.got = Math.max(1, Math.min(this.want, byTex, byPixels));
    this.sized = true;
    this.target.setSize(Math.round(this.outW * this.got), Math.round(this.outH * this.got));
    this.mid.setSize(this.outW, Math.round(this.outH * this.got));
  }

  /** Make sure the targets have their size before a draw (after a {@link release}, or before the first size arrived). */
  ensure(): void {
    if (!this.sized) this.applySize();
  }

  override render(renderer: WebGLRenderer, _writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget): void {
    this.ensure();
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(this.target);
    renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
    renderer.render(this.scene, this.camera);
    renderer.autoClear = autoClear;

    const u = this.material.uniforms;
    // horizontal: the big target into `mid` (output width x big height)
    u['tSrc']!.value = this.target.texture;
    (u['uDir']!.value as { x: number; y: number }).x = 1;
    (u['uDir']!.value as { x: number; y: number }).y = 0;
    u['uScale']!.value = this.target.width / this.outW;
    renderer.setRenderTarget(this.mid);
    this.quad.render(renderer);
    // vertical: `mid` into the composer's read buffer
    u['tSrc']!.value = this.mid.texture;
    (u['uDir']!.value as { x: number; y: number }).x = 0;
    (u['uDir']!.value as { x: number; y: number }).y = 1;
    u['uScale']!.value = this.target.height / this.outH;
    renderer.setRenderTarget(readBuffer);
    this.quad.render(renderer);
  }

  override dispose(): void {
    this.target.dispose();
    this.mid.dispose();
    this.material.dispose();
    this.quad.dispose();
    super.dispose();
  }
}
