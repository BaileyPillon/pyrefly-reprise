import { AdditiveBlending, Color, Mesh, NormalBlending, PlaneGeometry, ShaderMaterial, Vector2 } from 'three';

/**
 * Option B "Living Paintings": a sheet of flowing air (blizzard haze, cold mist over ice, steam
 * banks, dust in lamp light). Domain-warped value-noise FBM scrolled on the clock, soft on every
 * edge, drawn at a real depth so it sits **between** the depth plates and parallaxes with them.
 * `gust` pulses the opacity in slow waves (Gagazet's wind comes in gusts).
 *
 * Game case: both (plumbing); every sheet is a room's own (`ambient/*.ts`).
 */

export interface HazeSpec {
  /** Centre and size in world units (the sheet faces +z). */
  x?: number;
  y: number;
  z: number;
  w: number;
  h: number;
  color: number;
  opacity: number;
  /** Noise scroll, uv units a second. */
  flow: [number, number];
  /** Noise scale: cells across and down. */
  scale: [number, number];
  /** 0..1: how much the opacity rides slow gusts. */
  gust?: number;
  /** Threshold on the noise: higher = thinner wisps. */
  cover?: number;
  additive?: boolean;
  renderOrder: number;
  /** Fraction of the height faded at the bottom and top. */
  fadeBottom?: number;
  fadeTop?: number;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform vec2 uFlow;
  uniform vec2 uScale;
  uniform float uGust;
  uniform float uCover;
  uniform vec2 uFade;
  uniform float uSeed;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.3); a *= 0.5; }
    return s;
  }
  void main() {
    vec2 p = vUv * uScale + vec2(uSeed * 13.0, uSeed * 7.0);
    vec2 q = vec2(fbm(p + uFlow * uTime * 0.6), fbm(p + vec2(5.2, 1.3) - uFlow.yx * uTime * 0.4));
    float n = fbm(p + q * 1.6 + uFlow * uTime);
    float a = smoothstep(uCover, uCover + 0.32, n);
    float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x)
               * smoothstep(0.0, uFade.x, vUv.y) * smoothstep(1.0, 1.0 - uFade.y, vUv.y);
    float gust = 1.0 - uGust + uGust * smoothstep(0.25, 0.85, 0.5 + 0.5 * sin(uTime * 0.45 + vUv.x * 2.2 + uSeed * 9.0));
    gl_FragColor = vec4(uColor, clamp(a * edge * gust * uOpacity, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`;

export class Haze {
  readonly mesh: Mesh;
  private readonly material: ShaderMaterial;
  private readonly base: number;

  constructor(spec: HazeSpec, seed = 1) {
    this.base = spec.opacity;
    this.material = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(spec.color) },
        uOpacity: { value: spec.opacity },
        uFlow: { value: new Vector2(...spec.flow) },
        uScale: { value: new Vector2(...spec.scale) },
        uGust: { value: spec.gust ?? 0 },
        uCover: { value: spec.cover ?? 0.38 },
        uFade: { value: new Vector2(spec.fadeBottom ?? 0.3, spec.fadeTop ?? 0.4) },
        uSeed: { value: seed * 0.618 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      fog: false,
      blending: spec.additive ? AdditiveBlending : NormalBlending,
    });
    this.mesh = new Mesh(new PlaneGeometry(spec.w, spec.h), this.material);
    this.mesh.position.set(spec.x ?? 0, spec.y, spec.z);
    this.mesh.renderOrder = spec.renderOrder;
    this.mesh.frustumCulled = false;
    this.mesh.name = 'fx-b-haze';
  }

  update(time: number, gain: number): void {
    this.material.uniforms['uTime']!.value = time;
    this.material.uniforms['uOpacity']!.value = this.base * gain;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.mesh.removeFromParent();
  }
}
