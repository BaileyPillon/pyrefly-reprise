import {
  AdditiveBlending,
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Float32BufferAttribute,
  Mesh,
  NormalBlending,
  ShaderMaterial,
  Vector3,
} from 'three';

/**
 * Option B "Living Paintings": a GPU particle field of camera-facing quads. Every quad's place is
 * computed in the vertex shader from its seed and the clock, so the CPU cost is one uniform write
 * a frame however many there are (the phone runs at 4x CPU throttle).
 *
 * Shapes: `flake` (soft disc; big near ones read as out-of-focus bokeh), `crystal` (a six-ray ice
 * glint that twinkles, FFX Macalania), `dust` (a tiny mote), `streak` (a thin line stretched along
 * its own velocity: Gagazet's wind), `plume` (a rising, growing puff of steam from a list of vents).
 *
 * Game case: both (plumbing); each room picks its own shapes and colours (`ambient/*.ts`).
 */

export type QuadShape = 'flake' | 'crystal' | 'dust' | 'streak' | 'plume';

export interface QuadFieldSpec {
  shape: QuadShape;
  count: number;
  /** World box the quads wrap inside: min corner and size. */
  min: [number, number, number];
  size: [number, number, number];
  /** Base velocity (world units a second); each quad runs at 0.6..1.4x. */
  vel: [number, number, number];
  /** Turbulence amplitude (world units). */
  turb?: number;
  /** Quad half-size range in world units. */
  scale: [number, number];
  color: number;
  opacity: number;
  /** Length / width for `streak`. */
  stretch?: number;
  additive?: boolean;
  renderOrder?: number;
  /** Fade quads nearer than this to the camera (world units). */
  near?: number;
  /** `plume`: vent positions (up to 8) and seconds per puff. */
  vents?: Array<[number, number, number]>;
  life?: number;
  /** Which dial scales its opacity (`weather` by default). */
  dial?: 'weather' | 'lamps';
}

const VERT = /* glsl */ `
  attribute vec2 corner;
  attribute vec4 seed;
  uniform float uTime;
  uniform vec3 uMin;
  uniform vec3 uSize;
  uniform vec3 uVel;
  uniform float uTurb;
  uniform vec2 uScale;
  uniform float uStretch;
  uniform float uNear;
  uniform float uLife;
  uniform vec3 uVents[8];
  uniform float uVentCount;
  varying vec2 vCorner;
  varying float vAlpha;
  varying float vSeed;
  varying float vAge;
  void main() {
    vec3 speed = uVel * (0.6 + 0.8 * seed.w);
    float size = mix(uScale.x, uScale.y, fract(seed.w * 7.31 + seed.x * 3.7));
    vec3 world;
    float alpha = 1.0;
    vAge = 0.0;
  #ifdef PLUME
    float life = fract(uTime / uLife + seed.w);
    int vi = int(floor(seed.x * uVentCount));
    vec3 vent = uVents[0];
    for (int i = 1; i < 8; i++) if (i == vi) vent = uVents[i];
    world = vent + vec3((seed.y - 0.5) * 0.6, 0.0, (seed.z - 0.5) * 0.6)
      + speed * life * uLife
      + vec3(sin(life * 5.0 + seed.y * 20.0), 0.0, cos(life * 4.0 + seed.z * 20.0)) * uTurb * life;
    size *= 0.35 + 1.4 * life;
    alpha = smoothstep(0.0, 0.18, life) * (1.0 - smoothstep(0.55, 1.0, life));
    vAge = life;
  #else
    vec3 p = seed.xyz * uSize + speed * uTime;
    p += vec3(sin(uTime * 0.7 + seed.w * 40.0), sin(uTime * 0.53 + seed.x * 31.0), cos(uTime * 0.61 + seed.y * 17.0)) * uTurb;
    vec3 m = mod(p, uSize);
    vec3 e = min(m, uSize - m) / max(uSize * 0.08, vec3(1e-3));
    alpha = clamp(min(min(e.x, e.y), e.z), 0.0, 1.0);
    world = uMin + m;
  #endif
    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    vec2 c = corner;
  #ifdef STREAK
    vec3 vv = (viewMatrix * vec4(speed, 0.0)).xyz;
    vec2 dir = length(vv.xy) > 1e-5 ? normalize(vv.xy) : vec2(1.0, 0.0);
    mv.xy += dir * c.x * size * uStretch + vec2(-dir.y, dir.x) * c.y * size;
  #else
    mv.xy += c * size;
  #endif
    gl_Position = projectionMatrix * mv;
    vCorner = corner;
    vSeed = seed.w;
    vAlpha = alpha * smoothstep(uNear, uNear * 1.8 + 0.01, -mv.z);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vCorner;
  varying float vAlpha;
  varying float vSeed;
  varying float vAge;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  void main() {
    vec2 c = vCorner;
    float r2 = dot(c, c);
    float a = 0.0;
  #if defined(CRYSTAL)
    float ang = atan(c.y, c.x);
    float rays = pow(abs(cos(ang * 3.0)), 24.0) * exp(-sqrt(r2) * 2.6);
    float core = exp(-r2 * 26.0);
    float tw = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (1.3 + vSeed * 2.2) + vSeed * 60.0), 3.0);
    a = (core + rays * 0.9) * tw;
  #elif defined(STREAK)
    a = (1.0 - abs(c.x)) * exp(-c.y * c.y * 6.0);
    a *= a;
  #elif defined(PLUME)
    float n = vnoise(c * 2.3 + vec2(vSeed * 31.0, -uTime * 0.35 - vAge * 2.0)) * 0.65
            + vnoise(c * 5.1 + vec2(-uTime * 0.2, vSeed * 17.0)) * 0.35;
    a = smoothstep(1.0, 0.15, sqrt(r2)) * smoothstep(0.25, 0.8, n);
  #elif defined(DUST)
    a = exp(-r2 * 9.0);
  #else
    // flake: a soft disc with a faint brighter rim, which reads as bokeh when it is big and near
    float r = sqrt(r2);
    a = smoothstep(1.0, 0.55, r) * (0.75 + 0.25 * smoothstep(0.5, 0.9, r));
  #endif
    if (r2 > 1.0 && a < 0.004) discard;
    gl_FragColor = vec4(uColor, clamp(a * vAlpha * uOpacity, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`;

export class QuadField {
  readonly mesh: Mesh;
  readonly spec: QuadFieldSpec;
  private readonly material: ShaderMaterial;
  private readonly baseOpacity: number;

  constructor(spec: QuadFieldSpec, countScale = 1, seedSalt = 1) {
    this.spec = spec;
    const n = Math.max(1, Math.round(spec.count * countScale));
    const geo = new InstancedBufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    geo.setAttribute('corner', new Float32BufferAttribute([-1, -1, 1, -1, 1, 1, -1, 1], 2));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    const seeds = new Float32Array(n * 4);
    let s = (seedSalt * 9301 + 49297) % 233280;
    const rnd = (): number => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    for (let i = 0; i < seeds.length; i++) seeds[i] = rnd();
    geo.setAttribute('seed', new InstancedBufferAttribute(seeds, 4));
    geo.instanceCount = n;
    const vents = (spec.vents ?? [[0, 0, 0]]).slice(0, 8).map((v) => new Vector3(...v));
    while (vents.length < 8) vents.push(vents[0]!.clone());
    const defines: Record<string, string> = {};
    if (spec.shape === 'crystal') defines['CRYSTAL'] = '';
    if (spec.shape === 'streak') defines['STREAK'] = '';
    if (spec.shape === 'plume') defines['PLUME'] = '';
    if (spec.shape === 'dust') defines['DUST'] = '';
    this.baseOpacity = spec.opacity;
    this.material = new ShaderMaterial({
      defines,
      uniforms: {
        uTime: { value: 0 },
        uMin: { value: new Vector3(...spec.min) },
        uSize: { value: new Vector3(...spec.size) },
        uVel: { value: new Vector3(...spec.vel) },
        uTurb: { value: spec.turb ?? 0 },
        uScale: { value: spec.scale },
        uStretch: { value: spec.stretch ?? 1 },
        uNear: { value: spec.near ?? 0.6 },
        uLife: { value: spec.life ?? 6 },
        uVents: { value: vents },
        uVentCount: { value: Math.min(8, spec.vents?.length ?? 1) },
        uColor: { value: new Color(spec.color) },
        uOpacity: { value: spec.opacity },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      fog: false,
      blending: spec.additive === false ? NormalBlending : AdditiveBlending,
    });
    this.mesh = new Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = spec.renderOrder ?? -40;
    this.mesh.name = `fx-b-${spec.shape}`;
  }

  /** @param time seconds on option B's own clock; `gain` is the dial times any flash envelope. */
  update(time: number, gain: number): void {
    this.material.uniforms['uTime']!.value = time;
    this.material.uniforms['uOpacity']!.value = this.baseOpacity * gain;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.mesh.removeFromParent();
  }
}
