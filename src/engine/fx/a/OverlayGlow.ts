/**
 * Option A1b, the spell glow. The approved option-B spells are drawn after the post chain, so
 * nothing ever made them glow into the scene. This draws the spell's additive layer once more
 * into a sixth-resolution target, blurs it (Kawase, 5 passes on desktop, 3 on the phone
 * tier), and lays it additively over the frame **under** the crisp quads, which then draw
 * exactly as approved. The spell keeps its look and gains a halo.
 *
 * Game case: both; the halo is the spell's own colours (the FFX and FFX-2 skins as today).
 * Off at the low tier (the low spell tier already draws only the bloom).
 */

import {
  AdditiveBlending,
  Color,
  HalfFloatType,
  LinearFilter,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  type WebGLRenderer,
} from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import type { FxBatch } from '../../spellfx/FxBatch.ts';

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const KAWASE = /* glsl */ `
  uniform sampler2D tSrc;
  uniform vec2 uTexel;
  uniform float uOff;
  varying vec2 vUv;
  void main() {
    vec2 o = uTexel * (uOff + 0.5);
    vec4 c = texture2D(tSrc, vUv + vec2(o.x, o.y)) + texture2D(tSrc, vUv + vec2(-o.x, o.y))
           + texture2D(tSrc, vUv + vec2(o.x, -o.y)) + texture2D(tSrc, vUv + vec2(-o.x, -o.y));
    gl_FragColor = c * 0.25;
  }
`;

const COMP = /* glsl */ `
  uniform sampler2D tSrc;
  uniform float uGain;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tSrc, vUv).rgb * uGain;
    // soft-clip toward 0.6 so a dense spell core halos instead of washing out the approved strokes
    c = c / (1.0 + max(max(c.r, c.g), c.b) * 1.6);
    gl_FragColor = vec4(c, 1.0);
  }
`;

export class OverlayGlow {
  gain = 1.5;
  passes = 5;
  /** The halo target is the drawing buffer divided by this. */
  div = 6;
  private readonly a = new WebGLRenderTarget(1, 1, { type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false });
  private readonly b = this.a.clone();
  private readonly quad = new FullScreenQuad();
  private readonly blur = new ShaderMaterial({
    uniforms: { tSrc: { value: null }, uTexel: { value: new Vector2() }, uOff: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: KAWASE,
    depthTest: false,
    depthWrite: false,
  });
  private readonly comp = new ShaderMaterial({
    uniforms: { tSrc: { value: null }, uGain: { value: 1 } },
    vertexShader: VERT,
    fragmentShader: COMP,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    blending: AdditiveBlending,
  });
  private readonly clear = new Color();
  private readonly size = new Vector2();

  /** Draw the halo of this frame's spell over the finished frame (the default framebuffer). */
  render(renderer: WebGLRenderer, batch: FxBatch): void {
    renderer.getDrawingBufferSize(this.size);
    const w = Math.max(1, Math.round(this.size.x / this.div));
    const h = Math.max(1, Math.round(this.size.y / this.div));
    if (this.a.width !== w || this.a.height !== h) {
      this.a.setSize(w, h);
      this.b.setSize(w, h);
    }
    const prevTarget = renderer.getRenderTarget();
    renderer.getClearColor(this.clear);
    const prevAlpha = renderer.getClearAlpha();

    renderer.setRenderTarget(this.a);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, false, false);
    batch.renderAdditive(renderer);

    let src = this.a;
    let dst = this.b;
    (this.blur.uniforms['uTexel']!.value as Vector2).set(1 / w, 1 / h);
    this.quad.material = this.blur;
    for (let i = 0; i < this.passes; i++) {
      this.blur.uniforms['tSrc']!.value = src.texture;
      this.blur.uniforms['uOff']!.value = i + 0.5;
      renderer.setRenderTarget(dst);
      this.quad.render(renderer);
      [src, dst] = [dst, src];
    }

    renderer.setRenderTarget(prevTarget);
    renderer.setClearColor(this.clear, prevAlpha);
    this.comp.uniforms['tSrc']!.value = src.texture;
    this.comp.uniforms['uGain']!.value = this.gain;
    this.quad.material = this.comp;
    const auto = renderer.autoClear;
    renderer.autoClear = false;
    this.quad.render(renderer);
    renderer.autoClear = auto;
  }

  dispose(): void {
    this.a.dispose();
    this.b.dispose();
    this.blur.dispose();
    this.comp.dispose();
    this.quad.dispose();
  }
}
