/**
 * Option A3 and A1c in one composer pass, inserted after the bloom (`GoldenHour.ts`):
 *
 * - **Light shafts** (both games): a screen-space radial gather (GPU Gems 3, ch. 13) from up to
 *   three light sources the painting itself holds (Gagazet's moon, Macalania's skylight and
 *   braziers, Bevelle's grate and lamps, Djose's work lamps). The source is a point on the
 *   painting plane, projected every frame, so the shafts follow the camera. The gather reads
 *   the painting's own bright, light-coloured pixels near the source, so a figure in the way
 *   (dark, and alpha 0 where the bloom mask writes it) cuts the rays.
 * - **Beams and air**: the gathered light is broken into slow-turning beams (a few sines of the
 *   angle round the source; still under Reduce motion), and each source lights the air round it
 *   with a soft haze in its own colour. Figures (alpha 0 in the bloom mask) take less of both,
 *   so they stand in front of the light.
 * - **Streaks** on the brightest emissive peaks, per game: **FFX** an anamorphic horizontal
 *   streak (the cinema lens), **FFX-2** a four-point star, the rhyme with the FFX-2 sparkle
 *   cursor and the `spark4` sparkles.
 *
 * Everything is in the WebGL canvas; the HUD is DOM above it and cannot be touched.
 * Quarter resolution throughout; the composite writes the frame's alpha through unchanged.
 */

import { HalfFloatType, LinearFilter, ShaderMaterial, Vector2, Vector3, WebGLRenderTarget, type WebGLRenderer } from 'three';
import { FullScreenQuad, Pass } from 'three/addons/postprocessing/Pass.js';

export const MAX_SOURCES = 3;

export interface GlowSource {
  /** Screen position, 0..1 with y up (may lie outside the frame). */
  pos: Vector2;
  color: Vector3;
  /** How far (in frame heights) the source's light is gathered from. */
  reach: number;
  /** Shaft strength for this source. */
  gain: number;
  /** A soft disc drawn at the source itself (0 = none). */
  disc: number;
  /** The air lit round the source, in its colour (0 = none). */
  haze: number;
}

/** How the streak pass draws: one horizontal axis (FFX anamorphic) or two (FFX-2 star). */
export type StreakMode = 'anamorphic' | 'star';

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

/** Bright field: rgb = light-coloured paint above the threshold, a = star peaks. */
const PRE = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float uThreshold;
  uniform float uStarThreshold;
  uniform float uWhiteDamp;
  uniform vec2 uTexel;
  varying vec2 vUv;
  float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
  void main() {
    vec4 t = texture2D(tDiffuse, vUv);
    float mx = max(t.r, max(t.g, t.b));
    float mn = min(t.r, min(t.g, t.b));
    float sat = (mx - mn) / max(mx, 1e-3);
    float l = lum(t.rgb);
    float mean = 0.0;
    for (int k = 0; k < 6; k++) {
      float a = float(k) * 1.0472;
      mean += lum(texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * uTexel * 20.0).rgb);
    }
    mean /= 6.0;
    float stands = smoothstep(0.0, 0.25, l - mean);
    float occl = mix(0.1, 1.0, clamp(t.a, 0.0, 1.0));
    float w = smoothstep(uThreshold, uThreshold + 0.3, l) * mix(uWhiteDamp, 1.0, smoothstep(0.12, 0.45, sat)) * (0.3 + 0.7 * stands);
    w = max(w, smoothstep(0.98, 1.35, l));
    vec2 o = uTexel * 24.0;
    float sideX = max(lum(texture2D(tDiffuse, vUv + vec2(o.x, 0.0)).rgb), lum(texture2D(tDiffuse, vUv - vec2(o.x, 0.0)).rgb));
    float sideY = max(lum(texture2D(tDiffuse, vUv + vec2(0.0, o.y)).rgb), lum(texture2D(tDiffuse, vUv - vec2(0.0, o.y)).rgb));
    float compact = smoothstep(0.06, 0.24, l - max(sideX, sideY));
    float star = smoothstep(uStarThreshold, uStarThreshold + 0.2, l) * smoothstep(0.08, 0.3, l - mean);
    star = max(star, smoothstep(1.05, 1.5, l)) * compact;
    gl_FragColor = vec4(min(t.rgb, vec3(2.0)) * w * occl, star * occl);
  }
`;

const GATHER = /* glsl */ `
  #define N_MAX 64
  uniform sampler2D tPre;
  uniform vec2 uSrc[${MAX_SOURCES}];
  uniform vec3 uCol[${MAX_SOURCES}];
  uniform float uReach[${MAX_SOURCES}];
  uniform float uGain[${MAX_SOURCES}];
  uniform float uDisc[${MAX_SOURCES}];
  uniform float uHaze[${MAX_SOURCES}];
  uniform int uCount;
  uniform int uSamples;
  uniform float uDecay;
  uniform float uDensity;
  uniform float uAspect;
  uniform float uTintMix;
  uniform float uRays;
  uniform float uTime;
  varying vec2 vUv;
  float fall(vec2 p, vec2 s, float reach) {
    vec2 d = (p - s) * vec2(uAspect, 1.0);
    return exp(-dot(d, d) / max(1e-4, reach * reach));
  }
  // slow-turning beams: a few sines of the angle round the source, about 0..1.2
  float beams(float a, float t, float seed) {
    float b = sin(a * 7.0 + t * 0.19 + seed) * 0.5 + 0.5;
    b *= sin(a * 13.0 - t * 0.13 + seed * 2.3) * 0.35 + 0.65;
    b += 0.35 * (sin(a * 3.0 + t * 0.07 + seed * 0.7) * 0.5 + 0.5);
    return b * 1.1;
  }
  void main() {
    vec3 total = vec3(0.0);
    for (int s = 0; s < ${MAX_SOURCES}; s++) {
      if (s >= uCount) break;
      vec2 src = uSrc[s];
      vec2 delta = (vUv - src) * uDensity / float(uSamples);
      vec2 uv = vUv;
      float illum = 1.0;
      vec3 acc = vec3(0.0);
      for (int i = 0; i < N_MAX; i++) {
        if (i >= uSamples) break;
        uv -= delta;
        vec2 cuv = clamp(uv, 0.0, 1.0);
        vec3 c = texture2D(tPre, cuv).rgb;
        float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
        acc += c * (fall(uv, src, uReach[s]) * illum * inside);
        illum *= uDecay;
      }
      acc /= float(uSamples);
      float l = dot(acc, vec3(0.2126, 0.7152, 0.0722));
      vec3 tinted = mix(acc, uCol[s] * l, uTintMix);
      vec2 dd = (vUv - src) * vec2(uAspect, 1.0);
      float bm = beams(atan(dd.y, dd.x), uTime, float(s) * 1.7);
      float r2 = dot(dd, dd);
      float disc = uDisc[s] * exp(-r2 / 0.0035);
      float haze = uHaze[s] * exp(-r2 / max(1e-4, uReach[s] * uReach[s] * 0.45)) * mix(1.0, bm, uRays * 0.3);
      total += (tinted * mix(1.0, bm, uRays) + uCol[s] * (disc * 0.08 + haze * 0.22)) * uGain[s];
    }
    gl_FragColor = vec4(total, 1.0);
  }
`;

const STAR = /* glsl */ `
  uniform sampler2D tPre;
  uniform vec2 uTexel;
  uniform float uLen;
  uniform float uFall;
  uniform int uTaps;
  uniform float uCross;
  varying vec2 vUv;
  void main() {
    float acc = texture2D(tPre, vUv).a;
    float w = 1.0;
    for (int k = 1; k <= 32; k++) {
      if (k > uTaps) break;
      w *= uFall;
      float o = float(k) * uLen;
      acc += w * (texture2D(tPre, vUv + vec2(uTexel.x * o, 0.0)).a + texture2D(tPre, vUv - vec2(uTexel.x * o, 0.0)).a);
      acc += uCross * w * (texture2D(tPre, vUv + vec2(0.0, uTexel.y * o)).a + texture2D(tPre, vUv - vec2(0.0, uTexel.y * o)).a);
    }
    gl_FragColor = vec4(vec3(acc * 0.18), 1.0);
  }
`;

const COMPOSITE = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform sampler2D tShaft;
  uniform sampler2D tStar;
  uniform float uShaft;
  uniform float uStar;
  uniform vec3 uStarTint;
  uniform float uFigureKeep;
  varying vec2 vUv;
  void main() {
    vec4 base = texture2D(tDiffuse, vUv);
    // a figure (alpha 0 in the bloom mask) stands in front of the light: it takes less of it
    float keep = mix(uFigureKeep, 1.0, clamp(base.a, 0.0, 1.0));
    vec3 add = texture2D(tShaft, vUv).rgb * uShaft * keep + texture2D(tStar, vUv).r * uStarTint * uStar;
    // a partial screen blend: dark paint takes the light fully, paint already near white takes
    // little, so a painted lamp or moon keeps its drawn detail instead of burning out
    gl_FragColor = vec4(base.rgb + add * max(vec3(0.0), 1.0 - base.rgb * 0.85), base.a);
  }
`;

const target = (): WebGLRenderTarget =>
  new WebGLRenderTarget(1, 1, { type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false });

export class GlowPass extends Pass {
  readonly sources: GlowSource[] = [];
  /** Global shaft and star strengths (the controller animates these). */
  shaft = 1;
  star = 0;
  samples = 48;
  /** Beam structure depth (0 = a smooth glow) and its clock (seconds; frozen = still). */
  rays = 0.5;
  time = 0;
  /** Streak shape: taps per side, spacing (quarter-res texels), falloff per tap. */
  streakMode: StreakMode = 'star';
  streakTaps = 10;
  streakLen = 1.4;
  streakFall = 0.8;
  private readonly rtPre = target();
  private readonly rtShaft = target();
  private readonly rtStar = target();
  private readonly pre: ShaderMaterial;
  private readonly gather: ShaderMaterial;
  private readonly streak: ShaderMaterial;
  private readonly comp: ShaderMaterial;
  private readonly quad = new FullScreenQuad();
  private aspect = 16 / 9;

  constructor() {
    super();
    this.pre = new ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, uThreshold: { value: 0.62 }, uStarThreshold: { value: 0.9 }, uWhiteDamp: { value: 0.35 }, uTexel: { value: new Vector2(1 / 1600, 1 / 900) } },
      vertexShader: VERT,
      fragmentShader: PRE,
      depthTest: false,
      depthWrite: false,
    });
    this.gather = new ShaderMaterial({
      uniforms: {
        tPre: { value: this.rtPre.texture },
        uSrc: { value: Array.from({ length: MAX_SOURCES }, () => new Vector2()) },
        uCol: { value: Array.from({ length: MAX_SOURCES }, () => new Vector3(1, 1, 1)) },
        uReach: { value: new Array<number>(MAX_SOURCES).fill(0.5) },
        uGain: { value: new Array<number>(MAX_SOURCES).fill(0) },
        uDisc: { value: new Array<number>(MAX_SOURCES).fill(0) },
        uHaze: { value: new Array<number>(MAX_SOURCES).fill(0) },
        uRays: { value: 0.5 },
        uTime: { value: 0 },
        uCount: { value: 0 },
        uSamples: { value: 48 },
        uDecay: { value: 0.972 },
        uDensity: { value: 0.85 },
        uAspect: { value: 16 / 9 },
        uTintMix: { value: 0.45 },
      },
      vertexShader: VERT,
      fragmentShader: GATHER,
      depthTest: false,
      depthWrite: false,
    });
    this.streak = new ShaderMaterial({
      uniforms: {
        tPre: { value: this.rtPre.texture },
        uTexel: { value: new Vector2(1, 1) },
        uLen: { value: 1.4 },
        uFall: { value: 0.8 },
        uTaps: { value: 10 },
        uCross: { value: 1 },
      },
      vertexShader: VERT,
      fragmentShader: STAR,
      depthTest: false,
      depthWrite: false,
    });
    this.comp = new ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tShaft: { value: this.rtShaft.texture },
        tStar: { value: this.rtStar.texture },
        uShaft: { value: 1 },
        uStar: { value: 0 },
        uStarTint: { value: new Vector3(1, 0.8, 0.92) },
        uFigureKeep: { value: 0.25 },
      },
      vertexShader: VERT,
      fragmentShader: COMPOSITE,
      depthTest: false,
      depthWrite: false,
    });
  }

  /** Uniform access for the controller (thresholds, decay, tints). */
  get preUniforms(): ShaderMaterial['uniforms'] {
    return this.pre.uniforms;
  }
  get gatherUniforms(): ShaderMaterial['uniforms'] {
    return this.gather.uniforms;
  }
  get compositeUniforms(): ShaderMaterial['uniforms'] {
    return this.comp.uniforms;
  }
  get streakUniforms(): ShaderMaterial['uniforms'] {
    return this.streak.uniforms;
  }

  override setSize(width: number, height: number): void {
    const w = Math.max(1, Math.round(width / 4));
    const h = Math.max(1, Math.round(height / 4));
    this.rtPre.setSize(w, h);
    this.rtShaft.setSize(w, h);
    this.rtStar.setSize(w, h);
    this.aspect = width / Math.max(1, height);
    (this.pre.uniforms['uTexel']!.value as Vector2).set(1 / Math.max(1, width), 1 / Math.max(1, height));
    (this.streak.uniforms['uTexel']!.value as Vector2).set(1 / w, 1 / h);
  }

  override render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget): void {
    const g = this.gather.uniforms;
    const n = Math.min(MAX_SOURCES, this.sources.length);
    g['uCount']!.value = this.shaft > 0 ? n : 0;
    g['uSamples']!.value = Math.min(64, Math.max(8, Math.round(this.samples)));
    g['uAspect']!.value = this.aspect;
    for (let i = 0; i < n; i++) {
      const s = this.sources[i]!;
      (g['uSrc']!.value as Vector2[])[i]!.copy(s.pos);
      (g['uCol']!.value as Vector3[])[i]!.copy(s.color);
      (g['uReach']!.value as number[])[i] = s.reach;
      (g['uGain']!.value as number[])[i] = s.gain;
      (g['uDisc']!.value as number[])[i] = s.disc;
      (g['uHaze']!.value as number[])[i] = s.haze;
    }
    g['uRays']!.value = this.rays;
    g['uTime']!.value = this.time;
    const st = this.streak.uniforms;
    st['uTaps']!.value = Math.min(32, Math.max(1, Math.round(this.streakTaps)));
    st['uLen']!.value = this.streakLen;
    st['uFall']!.value = this.streakFall;
    st['uCross']!.value = this.streakMode === 'star' ? 1 : 0;
    const doShaft = this.shaft > 0 && n > 0;
    const doStar = this.star > 0;

    if (doShaft || doStar) {
      this.pre.uniforms['tDiffuse']!.value = readBuffer.texture;
      this.quad.material = this.pre;
      renderer.setRenderTarget(this.rtPre);
      this.quad.render(renderer);
    }
    if (doShaft) {
      this.quad.material = this.gather;
      renderer.setRenderTarget(this.rtShaft);
      this.quad.render(renderer);
    }
    if (doStar) {
      this.quad.material = this.streak;
      renderer.setRenderTarget(this.rtStar);
      this.quad.render(renderer);
    }
    const c = this.comp.uniforms;
    c['tDiffuse']!.value = readBuffer.texture;
    c['uShaft']!.value = doShaft ? this.shaft : 0;
    c['uStar']!.value = doStar ? this.star : 0;
    this.quad.material = this.comp;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }

  override dispose(): void {
    this.rtPre.dispose();
    this.rtShaft.dispose();
    this.rtStar.dispose();
    this.pre.dispose();
    this.gather.dispose();
    this.streak.dispose();
    this.comp.dispose();
    this.quad.dispose();
  }
}
