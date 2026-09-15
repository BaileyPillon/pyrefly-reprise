import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  NormalBlending,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three';

export interface ParticleFieldOptions {
  count?: number;
  /** Box the motes live inside, centred on the field's position. */
  bounds?: { x: number; y: number; z: number };
  /** Palette sampled per particle. */
  colors?: number[];
  /** Base point size in world units (scaled by size attenuation). */
  size?: number;
  sizeJitter?: number;
  /** Constant drift in world units/second. */
  drift?: [number, number, number];
  /** Per-axis sine wobble amplitude (world units). */
  wobble?: [number, number, number];
  /** Wobble frequency in Hz. */
  wobbleSpeed?: number;
  /** 0..1 how strongly a mote pulses in brightness. */
  twinkle?: number;
  /** Overall opacity. */
  opacity?: number;
  /** Additive (glowy motes) or normal (snow, petals). */
  additive?: boolean;
  /** Soft round core hardness: 0 = very soft, 1 = disc. */
  hardness?: number;
  /** Gravity applied on top of drift (negative = falls). */
  gravity?: number;
  /** Multiplies every point size; set from render height for resolution parity. */
  pixelScale?: number;
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform vec3 uBounds;
  uniform vec3 uDrift;
  uniform vec3 uWobble;
  uniform float uWobbleSpeed;
  uniform float uGravity;
  uniform float uTwinkle;
  uniform float uPixelScale;

  attribute float aPhase;
  attribute float aScale;
  attribute float aSpeed;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vBright;

  // Wrap a coordinate into [-limit, limit]. ("half" is a reserved GLSL word.)
  float wrapAxis(float v, float limit) {
    float span = limit * 2.0;
    return mod(v + limit, span) - limit;
  }

  void main() {
    float t = uTime * aSpeed;

    vec3 p = position;
    p += uDrift * t;
    p.y += 0.5 * uGravity * t * t * 0.02;
    p.x += sin(t * uWobbleSpeed + aPhase) * uWobble.x;
    p.y += sin(t * uWobbleSpeed * 0.71 + aPhase * 1.7) * uWobble.y;
    p.z += cos(t * uWobbleSpeed * 0.53 + aPhase * 2.3) * uWobble.z;

    p.x = wrapAxis(p.x, uBounds.x);
    p.y = wrapAxis(p.y, uBounds.y);
    p.z = wrapAxis(p.z, uBounds.z);

    vColor = aColor;
    vBright = mix(1.0, 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * 2.1 + aPhase * 4.0)), uTwinkle);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // Size attenuation. uSize is "pixels at 10 world units from the camera",
    // scaled by uPixelScale so the look holds at any render height.
    gl_PointSize = uSize * aScale * uPixelScale * (10.0 / max(-mv.z, 0.001));
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  uniform float uHardness;

  varying vec3 vColor;
  varying float vBright;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d) * 2.0;
    if (r > 1.0) discard;

    // soft round core with a wide glow skirt
    float core = 1.0 - smoothstep(0.0, mix(1.0, 0.35, uHardness), r);
    float glow = pow(1.0 - r, 2.5);
    float a = clamp(core * 0.85 + glow * 0.5, 0.0, 1.0) * uOpacity * vBright;
    if (a < 0.004) discard;

    vec3 c = mix(vColor, vec3(1.0), glow * 0.35);
    gl_FragColor = vec4(c * vBright, a);
  }
`;

/**
 * A field of soft glowing motes drawn as a single {@link Points} object.
 * Motion is entirely in the vertex shader (drift + wobble + wrap), so the CPU
 * cost per frame is one uniform write.
 */
export class ParticleField extends Points {
  private readonly uniforms: ShaderMaterial['uniforms'];
  private clock = 0;

  constructor(opts: ParticleFieldOptions = {}) {
    const count = opts.count ?? 160;
    const bounds = opts.bounds ?? { x: 8, y: 5, z: 6 };
    const palette = (opts.colors ?? [0xffffff]).map((c) => new Color(c));

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const scales = new Float32Array(count);
    const speeds = new Float32Array(count);
    const jitter = opts.sizeJitter ?? 0.55;

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() * 2 - 1) * bounds.x;
      positions[i * 3 + 1] = (Math.random() * 2 - 1) * bounds.y;
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * bounds.z;

      const c = palette[(Math.random() * palette.length) | 0]!;
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      phases[i] = Math.random() * Math.PI * 2;
      scales[i] = 1 - jitter + Math.random() * jitter * 2;
      speeds[i] = 0.7 + Math.random() * 0.6;
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new BufferAttribute(colors, 3));
    geo.setAttribute('aPhase', new BufferAttribute(phases, 1));
    geo.setAttribute('aScale', new BufferAttribute(scales, 1));
    geo.setAttribute('aSpeed', new BufferAttribute(speeds, 1));
    geo.computeBoundingSphere();

    const drift = opts.drift ?? [0, 0.35, 0];
    const wobble = opts.wobble ?? [0.35, 0.12, 0.2];

    const mat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: opts.size ?? 6 },
        uBounds: { value: new Vector3(bounds.x, bounds.y, bounds.z) },
        uDrift: { value: new Vector3(drift[0], drift[1], drift[2]) },
        uWobble: { value: new Vector3(wobble[0], wobble[1], wobble[2]) },
        uWobbleSpeed: { value: opts.wobbleSpeed ?? 1.1 },
        uGravity: { value: opts.gravity ?? 0 },
        uTwinkle: { value: opts.twinkle ?? 0.6 },
        uPixelScale: { value: opts.pixelScale ?? 1 },
        uOpacity: { value: opts.opacity ?? 0.9 },
        uHardness: { value: opts.hardness ?? 0.15 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: opts.additive === false ? NormalBlending : AdditiveBlending,
    });

    super(geo, mat);
    this.uniforms = mat.uniforms;
    this.frustumCulled = false;
    this.renderOrder = 20;
  }

  /** @param dt seconds */
  update(dt: number): void {
    this.clock += dt;
    this.uniforms['uTime']!.value = this.clock;
  }

  setOpacity(v: number): void {
    this.uniforms['uOpacity']!.value = v;
  }

  /** Keep mote size consistent across render sizes (1 = authored at 900px tall). */
  setPixelScale(v: number): void {
    this.uniforms['uPixelScale']!.value = v;
  }

  override dispose(): void {
    this.geometry.dispose();
    (this.material as ShaderMaterial).dispose();
    this.removeFromParent();
  }
}

/** Ready-made looks. Each returns a fresh options object you can tweak. */
export const ParticlePresets = {
  /** Spira's pyreflies: green / white / pink motes drifting up with a sine wobble. */
  pyreflies(overrides: ParticleFieldOptions = {}): ParticleFieldOptions {
    return {
      count: 170,
      bounds: { x: 9, y: 4.2, z: 6 },
      colors: [0x9dffc4, 0xd6ffe9, 0xffffff, 0xffc2e6, 0x7fe3d0],
      size: 7.5,
      sizeJitter: 0.6,
      drift: [0.05, 0.42, 0.02],
      wobble: [0.45, 0.16, 0.3],
      wobbleSpeed: 0.9,
      twinkle: 0.8,
      opacity: 0.95,
      additive: true,
      hardness: 0.1,
      ...overrides,
    };
  },

  snow(overrides: ParticleFieldOptions = {}): ParticleFieldOptions {
    return {
      count: 420,
      bounds: { x: 13, y: 7, z: 9 },
      colors: [0xffffff, 0xdce9ff, 0xbcd4f2],
      size: 4.6,
      sizeJitter: 0.7,
      drift: [-0.22, -0.55, 0],
      wobble: [0.5, 0.06, 0.35],
      wobbleSpeed: 0.55,
      twinkle: 0.25,
      opacity: 0.75,
      additive: false,
      hardness: 0.45,
      ...overrides,
    };
  },

  embers(overrides: ParticleFieldOptions = {}): ParticleFieldOptions {
    return {
      count: 140,
      bounds: { x: 8, y: 5, z: 5 },
      colors: [0xffb347, 0xff7a2f, 0xffe1a8, 0xff4d2e],
      size: 6,
      sizeJitter: 0.6,
      drift: [0.1, 0.75, 0],
      wobble: [0.4, 0.2, 0.25],
      wobbleSpeed: 1.6,
      twinkle: 0.9,
      opacity: 0.9,
      additive: true,
      hardness: 0.2,
      ...overrides,
    };
  },

  petals(overrides: ParticleFieldOptions = {}): ParticleFieldOptions {
    return {
      count: 110,
      bounds: { x: 10, y: 6, z: 7 },
      colors: [0xffd7e8, 0xffb9d6, 0xfff0f6],
      size: 7,
      sizeJitter: 0.5,
      drift: [-0.35, -0.3, 0],
      wobble: [0.8, 0.25, 0.5],
      wobbleSpeed: 0.7,
      twinkle: 0.2,
      opacity: 0.85,
      additive: false,
      hardness: 0.6,
      ...overrides,
    };
  },
} as const;

export type ParticlePresetName = keyof typeof ParticlePresets;

/** Convenience: `makeParticles('snow', { count: 600 })`. */
export function makeParticles(
  preset: ParticlePresetName,
  overrides: ParticleFieldOptions = {},
): ParticleField {
  return new ParticleField(ParticlePresets[preset](overrides));
}
