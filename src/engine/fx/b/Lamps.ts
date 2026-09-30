import { AddEquation, Color, CustomBlending, Mesh, OneFactor, ShaderMaterial, Vector2, type DataTexture } from 'three';

/**
 * Option B "Living Paintings": the painting's own lights come alive (B3's lamp flicker and ice
 * shimmer), as an additive layer riding each depth plate. Nothing is positioned by hand: the
 * shader finds the lights in the plate's pixels.
 *
 * - **Warm**: bright, warm pixels (braziers, rust lamps, work lamps) get a halo read from a deep
 *   mip of the same plate (a soft glow that spills past the painted lamp, the way a real one
 *   does) and a flicker from smooth space-time noise, so two lamps never pulse in step and a
 *   lamp never splits down a seam.
 * - **Cool**: bright, cold pixels (Macalania's ice panes, Bevelle's cyan hole, the moon) get a
 *   slow caustic ripple of light climbing through them.
 * The painted pixels underneath are never changed; switch option B off and the layer is gone.
 *
 * Game case: both (plumbing). FFX rooms use gold/amber warm and ice-blue cool; FFX-2 rooms use
 * rust-orange warm and cyan/violet cool, from each room's own palette (`ambient/*.ts`).
 */

export interface LampSpec {
  warm?: { color: number; gain: number; halo: number; lum: [number, number]; flicker: number; hz: number };
  cool?: { color: number; gain: number; lum: [number, number]; speed: number; scale: number; halo?: number };
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D map;
  uniform float uTime;
  uniform vec3 uWarm;
  uniform vec4 uWarmK;   // gain, halo, flicker, hz
  uniform vec2 uWarmLum;
  uniform vec3 uCool;
  uniform vec4 uCoolK;   // gain, speed, scale, halo
  uniform vec2 uCoolLum;
  uniform vec2 uAspect;
  varying vec2 vUv;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float vnoise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), u.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), u.x), u.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), u.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), u.x), u.y), u.z);
  }
  float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
  float warmth(vec3 c) { return clamp((c.r - c.b) * 2.2, 0.0, 1.0); }
  float coldness(vec3 c) { return clamp((c.b - c.r) * 2.0, 0.0, 1.0); }
  void main() {
    vec4 sharp = texture2D(map, vUv);
    vec3 col = vec3(0.0);
    float own = sharp.a;
    if (uWarmK.x > 0.0) {
      vec4 h1 = texture2D(map, vUv, 4.0);
      vec4 h2 = texture2D(map, vUv, 6.0);
      float ms = smoothstep(uWarmLum.x, uWarmLum.y, luma(sharp.rgb)) * warmth(sharp.rgb);
      float m1 = smoothstep(uWarmLum.x * 0.7, uWarmLum.y, luma(h1.rgb)) * warmth(h1.rgb);
      float m2 = smoothstep(uWarmLum.x * 0.5, uWarmLum.y, luma(h2.rgb)) * warmth(h2.rgb);
      float n = vnoise3(vec3(vUv * uAspect * 7.0, uTime * uWarmK.w)) * 0.6 + vnoise3(vec3(vUv * uAspect * 3.0 + 9.0, uTime * uWarmK.w * 1.9)) * 0.4;
      float flick = 1.0 + uWarmK.z * (n * 2.0 - 1.0);
      // Light spills onto the dark around a lamp; the painted lamp itself, already near white, is
      // barely lifted, so a flame never clips to a flat white disc.
      float room = 1.0 - luma(sharp.rgb);
      col += uWarm * (ms * 0.3 * room + (m1 * 0.9 + m2 * 1.4) * uWarmK.y * (1.0 - 0.85 * ms) * (0.2 + 0.8 * room)) * flick * uWarmK.x;
    }
    if (uCoolK.x > 0.0) {
      float mc = smoothstep(uCoolLum.x, uCoolLum.y, luma(sharp.rgb)) * (0.35 + 0.65 * coldness(sharp.rgb));
      vec2 p = vUv * uAspect * uCoolK.z;
      float t = uTime * uCoolK.y;
      float c1 = vnoise3(vec3(p * vec2(1.0, 0.45) + vec2(0.0, -t), t * 0.3));
      float c2 = vnoise3(vec3(p * vec2(1.7, 0.8) + vec2(3.1, -t * 1.3), t * 0.5 + 4.0));
      float caustic = pow(1.0 - abs(c1 - c2) * 2.0, 6.0);
      col += uCool * mc * (0.25 + caustic * 1.1) * uCoolK.x;
      vec4 hc = texture2D(map, vUv, 5.5);
      float mh = smoothstep(uCoolLum.x * 0.8, uCoolLum.y, luma(hc.rgb)) * (0.4 + 0.6 * coldness(hc.rgb));
      col += uCool * mh * uCoolK.w * uCoolK.x;
    }
    // Premultiplied by the plate's own alpha; the alpha written is the glow's own weight, so on an
    // FFX-2 stage (where the frame alpha is the bloom mask) only the lights bloom, never the plate.
    gl_FragColor = vec4(col * own, clamp(max(col.r, max(col.g, col.b)) * 0.8, 0.0, 1.0) * own);
    #include <colorspace_fragment>
  }
`;

export class Lamps {
  readonly mesh: Mesh;
  private readonly material: ShaderMaterial;
  private readonly spec: LampSpec;

  /** One overlay for one plate: `plate` shares its geometry and transform, `tex` its pixels. */
  constructor(plate: Mesh, tex: DataTexture, spec: LampSpec) {
    this.spec = spec;
    const w = spec.warm;
    const c = spec.cool;
    const img = tex.image as { width: number; height: number };
    this.material = new ShaderMaterial({
      uniforms: {
        map: { value: tex },
        uTime: { value: 0 },
        uWarm: { value: new Color(w?.color ?? 0) },
        uWarmK: { value: [w?.gain ?? 0, w?.halo ?? 0, w?.flicker ?? 0, w?.hz ?? 4] },
        uWarmLum: { value: new Vector2(...(w?.lum ?? [0.5, 0.9])) },
        uCool: { value: new Color(c?.color ?? 0) },
        uCoolK: { value: [c?.gain ?? 0, c?.speed ?? 0.3, c?.scale ?? 6, c?.halo ?? 0] },
        uCoolLum: { value: new Vector2(...(c?.lum ?? [0.5, 0.9])) },
        uAspect: { value: new Vector2(img.width / img.height, 1) },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      fog: false,
      blending: CustomBlending,
      blendEquation: AddEquation,
      blendSrc: OneFactor,
      blendDst: OneFactor,
      blendSrcAlpha: OneFactor,
      blendDstAlpha: OneFactor,
    });
    this.mesh = new Mesh(plate.geometry, this.material);
    this.mesh.position.copy(plate.position);
    this.mesh.scale.copy(plate.scale);
    this.mesh.renderOrder = plate.renderOrder + 1;
    this.mesh.name = `${plate.name}-lamps`;
    this.mesh.frustumCulled = false;
    plate.parent?.add(this.mesh);
  }

  /**
   * @param gain the `lamps` dial; `flicker` 0 freezes the flicker (Reduce motion: the glow stays,
   * nothing pulses), `still` stops the caustics crawling.
   */
  update(time: number, gain: number, flicker: number, visible: boolean): void {
    this.mesh.visible = visible && gain > 0;
    const u = this.material.uniforms;
    u['uTime']!.value = time;
    const wk = u['uWarmK']!.value as number[];
    wk[0] = (this.spec.warm?.gain ?? 0) * gain;
    wk[2] = (this.spec.warm?.flicker ?? 0) * flicker;
    const ck = u['uCoolK']!.value as number[];
    ck[0] = (this.spec.cool?.gain ?? 0) * gain;
  }

  dispose(): void {
    this.material.dispose();
    this.mesh.removeFromParent();
  }
}
