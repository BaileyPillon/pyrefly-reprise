import { NoBlending, ShaderMaterial, type WebGLRenderTarget, type WebGLRenderer } from 'three';
import { FullScreenQuad, Pass } from 'three/addons/postprocessing/Pass.js';

/**
 * Contrast adaptive sharpening, written for this game (the idea is AMD FidelityFX CAS's: a five-tap cross, a soft local minimum and
 * maximum, and a per-channel weight that shrinks where the neighbourhood has no headroom, so the dark ink lines and the blown
 * highlights are not pushed over the edge of the range). Crisper, never a different style: the strength is the one number, the
 * sharpening fades out with the tilt-shift band so the soft top and bottom of the frame stay soft, and the alpha (the bloom mask) is
 * passed through untouched.
 *
 * Placed before the grade (`casAt: 'pre'`), the film grain is added after it and is not sharpened; placed after it (`'post'`) the
 * grain is sharpened with everything else (the page shows both).
 *
 * Original shader code (AGENTS.md rule 8).
 */
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec2 uTexel;
  uniform float uAmount;    // 0..1: how much of the sharpening is applied (a gain on the weight, so 0 is none and the effect grows from there)
  uniform float uSharp;     // 0..1: the filter's own shape, CAS's -1/8 (soft) to -1/5 (hard) lobe
  uniform float uFocus;     // tilt-shift centre, 0 = bottom
  uniform float uBand;      // tilt-shift half band
  uniform float uMask;      // 1 = fade with the tilt-shift band, 0 = everywhere
  uniform float uFloor;     // local contrast below this is left alone (painted grain, soft gradients); full strength from 3x
  varying vec2 vUv;

  void main() {
    vec4 e4 = texture2D(tDiffuse, vUv);
    vec3 e = e4.rgb;
    vec3 b = texture2D(tDiffuse, vUv + vec2(0.0, uTexel.y)).rgb;
    vec3 d = texture2D(tDiffuse, vUv - vec2(uTexel.x, 0.0)).rgb;
    vec3 f = texture2D(tDiffuse, vUv + vec2(uTexel.x, 0.0)).rgb;
    vec3 h = texture2D(tDiffuse, vUv - vec2(0.0, uTexel.y)).rgb;
    vec3 a = texture2D(tDiffuse, vUv + vec2(-uTexel.x, uTexel.y)).rgb;
    vec3 c = texture2D(tDiffuse, vUv + vec2(uTexel.x, uTexel.y)).rgb;
    vec3 g = texture2D(tDiffuse, vUv + vec2(-uTexel.x, -uTexel.y)).rgb;
    vec3 i = texture2D(tDiffuse, vUv + vec2(uTexel.x, -uTexel.y)).rgb;

    // Soft minimum and maximum: the cross and the box, added (so both are twice their size).
    vec3 mnC = min(min(min(d, e), min(f, b)), h);
    vec3 mnB = min(min(min(a, c), min(g, i)), mnC);
    vec3 mxC = max(max(max(d, e), max(f, b)), h);
    vec3 mxB = max(max(max(a, c), max(g, i)), mxC);
    vec3 mn = mnC + mnB;
    vec3 mx = mxC + mxB;

    // Headroom: how far the neighbourhood is from clipping, against its own peak. Zero in the blacks and above the range.
    vec3 amp = clamp(min(mn, 2.0 - mx) / max(mx, vec3(1e-4)), 0.0, 1.0);
    amp = sqrt(amp);

    // Gates, all continuous: the tilt-shift band (the soft far field stays soft) and a noise floor on the cross range of the
    // neighbourhood (the painted sky and the soft gradients sit under it, the figures' lines over it).
    float gate = uAmount;
    if (uMask > 0.5) {
      float t = clamp((abs(vUv.y - uFocus) - uBand) / max(1.0 - uBand, 1e-4), 0.0, 1.0);
      gate *= 1.0 - smoothstep(0.0, 0.25, t);
    }
    vec3 rngV = mxC - mnC;
    float rng = max(max(rngV.r, rngV.g), rngV.b);
    gate *= uFloor > 0.0 ? smoothstep(uFloor, uFloor * 3.0, rng) : 1.0;
    float peak = -1.0 / mix(8.0, 5.0, clamp(uSharp, 0.0, 1.0));
    vec3 w = amp * peak * gate;
    vec3 rcp = 1.0 / (1.0 + 4.0 * w);
    vec3 outc = (b * w + d * w + f * w + h * w + e) * rcp;
    gl_FragColor = vec4(max(outc, vec3(0.0)), e4.a);
  }
`;

export class CasPass extends Pass {
  private readonly material: ShaderMaterial;
  private readonly quad: FullScreenQuad;

  constructor() {
    super();
    this.material = new ShaderMaterial({
      name: 'CasPass',
      uniforms: {
        tDiffuse: { value: null },
        uTexel: { value: { x: 1 / 1600, y: 1 / 900 } },
        uAmount: { value: 0 },
        uSharp: { value: 0.5 },
        uFocus: { value: 0.42 },
        uBand: { value: 0.16 },
        uMask: { value: 1 },
        uFloor: { value: 0.05 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.material);
  }

  /** How much of the sharpening is applied, 0..1 (a gain on the filter's weight: 0 is none). */
  set amount(v: number) {
    this.material.uniforms['uAmount']!.value = v;
  }

  /** The filter's own shape, 0..1: CAS's weight runs from -1/8 (soft) to -1/5 (hard). */
  set shape(v: number) {
    this.material.uniforms['uSharp']!.value = v;
  }

  /** The noise floor: local contrast under it is not sharpened (0 = sharpen everything). */
  set floor(v: number) {
    this.material.uniforms['uFloor']!.value = v;
  }

  /** Follow the tilt-shift band (so the soft far field stays soft): `focus` 0 = bottom, `band` the half band. */
  followFocus(focus: number, band: number, on = true): void {
    this.material.uniforms['uFocus']!.value = focus;
    this.material.uniforms['uBand']!.value = band;
    this.material.uniforms['uMask']!.value = on ? 1 : 0;
  }

  override setSize(width: number, height: number): void {
    const t = this.material.uniforms['uTexel']!.value as { x: number; y: number };
    t.x = 1 / Math.max(1, width);
    t.y = 1 / Math.max(1, height);
  }

  override render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget): void {
    this.material.uniforms['tDiffuse']!.value = readBuffer.texture;
    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
    }
    this.quad.render(renderer);
  }

  override dispose(): void {
    this.material.dispose();
    this.quad.dispose();
  }
}
