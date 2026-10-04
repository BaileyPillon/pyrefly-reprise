import { HalfFloatType, NoBlending, ShaderMaterial, UniformsUtils, WebGLRenderTarget, type Camera, type Scene, type WebGLRenderer } from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { CopyShader } from 'three/addons/shaders/CopyShader.js';
import type { AaMode } from './ArtBudget.ts';

export type { AaMode } from './ArtBudget.ts';

/**
 * Anti-aliasing for the post chain (release 39, "r39-hires-engine"; both games, shared plumbing).
 *
 * The renderer ran with `antialias: false` and no multisampling anywhere: a 3D silhouette (a rock, a pillar, a plate edge), the
 * alpha-cut edge of a painted figure and its alpha-derived rim light all stair-step from about 2 texels per pixel up. Two ways in,
 * measured against each other on the RTX 5070 Ti (`docs/handoff/r39-hires-engine.md`): SMAA cleans the polygon edges as well as MSAA
 * does and the figures' texture and rim edges better, for +0.05 ms (1440p) and +0.4 ms (4K) and 57 MB / 127 MB of GPU, where 4x MSAA
 * is +0.9 ms / +1.9 ms and 211 MB / 475 MB. So SMAA was the desktop default and MSAA stayed selectable (`?aa=msaa`).
 *
 * **Retired as a default (the sharpness ladder, `crisp/CrispConfig.ts`).** The crispness options round found the pass ran on top of the MAX mix's SMAA before the
 * grade (a frame was softened twice) and that a supersampled scene resolved with Lanczos-3 holds twice the fine detail of either: `ArtBudget.aa` is `off` on
 * every class now, and these stay as overrides for a capture (`?aa=smaa|msaa`, `__pyrefly.art.aa`; the SMAA pass is built only when asked for):
 *
 * - `msaa`: {@link MsaaRenderPass}, the scene drawn into its own multisampled half-float target and resolved into the composer's
 *   first buffer. Only that one target is multisampled (the composer's two ping-pong buffers stay single-sample: a full-screen
 *   post pass has no edges to resolve), so the memory is one MS target, not three.
 * - `smaa`: three's `SMAAPass` after the grade, which finds every high-contrast edge in the finished frame, geometry or shader.
 * - `off`: today's frame.
 */
/** The scene pass of an MSAA chain: render into a multisampled target, resolve, copy into the composer's read buffer. */
export class MsaaRenderPass extends RenderPass {
  private readonly target: WebGLRenderTarget;
  private readonly copy: FullScreenQuad;
  private readonly copyMaterial: ShaderMaterial;

  constructor(scene: Scene, camera: Camera, readonly samples: number) {
    super(scene, camera);
    this.target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples, depthBuffer: true });
    this.target.texture.name = 'MsaaRenderPass.target';
    this.copyMaterial = new ShaderMaterial({
      uniforms: UniformsUtils.clone(CopyShader.uniforms),
      vertexShader: CopyShader.vertexShader,
      fragmentShader: CopyShader.fragmentShader,
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
    });
    this.copy = new FullScreenQuad(this.copyMaterial);
  }

  override setSize(width: number, height: number): void {
    this.target.setSize(width, height);
  }

  override render(renderer: WebGLRenderer, _writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget): void {
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(this.target);
    renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
    renderer.render(this.scene, this.camera); // three resolves a multisampled target when the render into it ends
    renderer.autoClear = autoClear;
    renderer.setRenderTarget(readBuffer);
    this.copyMaterial.uniforms['tDiffuse']!.value = this.target.texture;
    this.copy.render(renderer);
  }

  /** The sample count the hardware really gave the target (it may clamp `samples`). */
  get gotSamples(): number {
    return this.target.samples;
  }

  override dispose(): void {
    this.target.dispose();
    this.copyMaterial.dispose();
    this.copy.dispose();
    super.dispose();
  }
}

/** Parse the `?aa=` address override (`off`, `smaa`, `msaa`); anything else is null. */
export function parseAaOverride(value: string | null | undefined): AaMode | null {
  return value === 'off' || value === 'smaa' || value === 'msaa' ? value : null;
}
