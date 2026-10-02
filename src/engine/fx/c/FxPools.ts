/**
 * Option C's GPU particle pools (eye-candy options round, 2026-09-29).
 *
 * Two instanced pools, simulated entirely in the vertex shader from a birth time, a start, a
 * velocity, gravity and drag, so emitting is one attribute upload and every other frame costs
 * the CPU one uniform (the phone budget):
 * - `SegmentPool`: screen-width segments. Velocity-stretched streaks (C3's hit sparks, the
 *   dissolve's embers, Mega Flare's debris) and fixed segments (C5's lightning).
 * - `SpritePool`: world-sized billboards and floor decals: soft glows, four-point stars (FFX-2),
 *   shock rings, the dissolve's light pillar.
 *
 * Colours are linear and may exceed 1, so the post chain's bloom takes them. Their clock is the
 * stage's, so C2's hit-stop freezes them mid-flight like everything else on the field.
 * Game case: both; the callers pick the skin.
 */

import {
  AdditiveBlending,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  type Object3D,
} from 'three';

type V3 = [number, number, number];

abstract class Pool {
  readonly mesh: Mesh;
  protected readonly geo: InstancedBufferGeometry;
  protected readonly mat: ShaderMaterial;
  protected next = 0;
  private readonly attrs: Record<string, InstancedBufferAttribute> = {};
  private dirty = new Map<string, [number, number]>();
  time = 0;

  constructor(readonly capacity: number, layout: Record<string, number>, vertex: string, fragment: string, depthTest: boolean) {
    const base = new PlaneGeometry(1, 1, 1, 1);
    this.geo = new InstancedBufferGeometry();
    this.geo.index = base.index;
    this.geo.setAttribute('position', base.getAttribute('position'));
    for (const [name, size] of Object.entries(layout)) {
      const a = new InstancedBufferAttribute(new Float32Array(capacity * size), size);
      a.setUsage(35048); // DynamicDrawUsage
      if (name === 'aTime') for (let i = 0; i < capacity; i++) a.array[i * size] = -1e6;
      this.attrs[name] = a;
      this.geo.setAttribute(name, a);
    }
    this.geo.instanceCount = capacity;
    this.mat = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uViewport: { value: new Vector2(1600, 900) } },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      depthTest,
      blending: AdditiveBlending,
    });
    this.mesh = new Mesh(this.geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 60;
  }

  attach(parent: Object3D): void {
    parent.add(this.mesh);
  }

  /** Drawing-buffer size in pixels (segment widths are in CSS px times this ratio). */
  setViewport(w: number, h: number): void {
    (this.mat.uniforms['uViewport']!.value as Vector2).set(w, h);
  }

  update(dt: number): void {
    this.time += dt;
    this.mat.uniforms['uTime']!.value = this.time;
    for (const [name, [lo, hi]] of this.dirty) {
      const a = this.attrs[name]!;
      a.clearUpdateRanges();
      a.addUpdateRange(lo * a.itemSize, (hi - lo + 1) * a.itemSize);
      a.needsUpdate = true;
    }
    this.dirty.clear();
  }

  protected slot(): number {
    const i = this.next;
    this.next = (this.next + 1) % this.capacity;
    return i;
  }

  protected write(name: string, i: number, v: readonly number[]): void {
    const a = this.attrs[name]!;
    const arr = a.array as Float32Array;
    for (let k = 0; k < a.itemSize; k++) arr[i * a.itemSize + k] = v[k] ?? 0;
    const d = this.dirty.get(name);
    if (!d) this.dirty.set(name, [i, i]);
    else if (i < d[0] || i > d[1]) {
      // A wrap: upload the whole buffer rather than tracking two ranges.
      this.dirty.set(name, [Math.min(d[0], i), Math.max(d[1], i)]);
    }
  }

  /** Kill every live instance (the option switched off, a battle cleared). */
  clear(): void {
    for (let i = 0; i < this.capacity; i++) this.write('aTime', i, [-1e6, 0, 0, 0]);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.geo.dispose();
    this.mat.dispose();
  }
}

const KINEMATICS = /* glsl */ `
  vec3 kin(vec3 p0, vec3 v, float g, float d, float t) {
    float s = d > 0.0 ? (1.0 - exp(-d * t)) / d : t;
    return p0 + v * s + vec3(0.0, -0.5 * g * t * t, 0.0);
  }
`;

const SEGMENT_VERTEX = /* glsl */ `
  attribute vec3 aStart;
  attribute vec3 aEnd;
  attribute vec3 aVel;
  attribute vec4 aTime;   // birth, life, trail (s; < 0 = fixed endpoints), gravity
  attribute vec4 aColor;  // linear rgb (may exceed 1), width in px
  attribute vec4 aMisc;   // drag, seed, flicker, head bias
  uniform float uTime;
  uniform vec2 uViewport;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vHead;
  ${KINEMATICS}
  void main() {
    float age = uTime - aTime.x;
    if (age < 0.0 || age > aTime.y) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vAlpha = 0.0; return; }
    float k = age / aTime.y;
    vec3 a = aStart;
    vec3 b = aEnd;
    if (aTime.z >= 0.0) {
      a = kin(aStart, aVel, aTime.w, aMisc.x, max(0.0, age - aTime.z));
      b = kin(aStart, aVel, aTime.w, aMisc.x, age);
    }
    mat4 vp = projectionMatrix * viewMatrix;
    vec4 ca = vp * vec4(a, 1.0);
    vec4 cb = vp * vec4(b, 1.0);
    vec2 sa = ca.xy / ca.w;
    vec2 sb = cb.xy / cb.w;
    vec2 dpx = (sb - sa) * uViewport * 0.5;
    float len = length(dpx);
    vec2 dir = len > 0.001 ? dpx / len : vec2(1.0, 0.0);
    vec2 n = vec2(-dir.y, dir.x);
    float w = aColor.a * (1.0 - 0.45 * k);
    vec2 px2ndc = 2.0 / uViewport;
    sa -= dir * w * 0.5 * px2ndc;
    sb += dir * w * 0.5 * px2ndc;
    float along = position.x + 0.5;
    vec2 s = mix(sa, sb, along) + n * position.y * w * px2ndc;
    float cw = mix(ca.w, cb.w, along);
    float cz = mix(ca.z / ca.w, cb.z / cb.w, along);
    gl_Position = vec4(s * cw, cz * cw, cw);
    vUv = vec2(along, position.y * 2.0);
    float flick = aMisc.z > 0.0 ? 0.55 + 0.45 * step(0.35, fract(sin(floor(uTime * 30.0) * 12.9898 + aMisc.y * 78.233) * 43758.5453)) : 1.0;
    vAlpha = smoothstep(0.0, 0.05, k) * (1.0 - smoothstep(0.45, 1.0, k)) * flick;
    vColor = aColor.rgb;
    vHead = aMisc.w;
  }
`;

const SEGMENT_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vHead;
  void main() {
    float y = vUv.y;
    float core = exp(-y * y * 9.0);
    float glow = exp(-y * y * 2.2) * 0.5;
    // max(): under MSAA an edge pixel is shaded at its centre, outside the quad, so vUv.x can dip
    // below 0, and pow() of a negative base is NaN, which the bloom then spreads over the frame.
    float along = mix(1.0, mix(0.22, 1.0, pow(max(vUv.x, 0.0), 1.3)), vHead);
    float cap = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
    float m = max(vColor.r, max(vColor.g, vColor.b));
    vec3 hot = mix(vColor, vec3(m), 0.55 * core);
    float a = (core + glow) * along * cap * vAlpha;
    gl_FragColor = vec4(hot * a, a);
  }
`;

export interface SegmentSpec {
  start: V3;
  /** Fixed segments (lightning): the far end. */
  end?: V3;
  vel?: V3;
  life: number;
  /** Seconds of motion drawn behind the head; ignored for fixed segments. */
  trail?: number;
  gravity?: number;
  drag?: number;
  color: V3;
  widthPx: number;
  flicker?: boolean;
  /** 1 = bright head and fading tail (streaks); 0 = even (bolts). */
  head?: number;
  /** Seconds from now before it appears. */
  delay?: number;
}

export class SegmentPool extends Pool {
  constructor(capacity = 1024) {
    super(capacity, { aStart: 3, aEnd: 3, aVel: 3, aTime: 4, aColor: 4, aMisc: 4 }, SEGMENT_VERTEX, SEGMENT_FRAGMENT, false);
  }

  emit(s: SegmentSpec): void {
    const i = this.slot();
    const fixed = s.end !== undefined;
    this.write('aStart', i, s.start);
    this.write('aEnd', i, s.end ?? s.start);
    this.write('aVel', i, s.vel ?? [0, 0, 0]);
    this.write('aTime', i, [this.time + (s.delay ?? 0), s.life, fixed ? -1 : (s.trail ?? 0.045), s.gravity ?? 0]);
    this.write('aColor', i, [...s.color, s.widthPx]);
    this.write('aMisc', i, [s.drag ?? 0, Math.random(), s.flicker ? 1 : 0, s.head ?? (fixed ? 0 : 1)]);
  }
}

const SPRITE_VERTEX = /* glsl */ `
  attribute vec3 aPos;
  attribute vec3 aVel;
  attribute vec4 aTime;   // birth, life, gravity, drag
  attribute vec4 aColor;  // linear rgb, peak alpha
  attribute vec4 aSize;   // size0, size1 (world), aspect (h / w), flat (1 = on the floor)
  attribute vec4 aMisc;   // shape, seed, wobble, fade-out start (0..1)
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vShape;
  varying float vK;
  ${KINEMATICS}
  void main() {
    float age = uTime - aTime.x;
    if (age < 0.0 || age > aTime.y) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vAlpha = 0.0; return; }
    float k = age / aTime.y;
    vec3 p = kin(aPos, aVel, aTime.z, aTime.w, age);
    p.x += sin(age * 1.9 + aMisc.y * 6.2831) * aMisc.z;
    p.z += cos(age * 1.3 + aMisc.y * 4.1) * aMisc.z * 0.6;
    float grow = 1.0 - pow(1.0 - k, 3.0);
    float size = mix(aSize.x, aSize.y, grow);
    vec2 c = position.xy * vec2(size, size * aSize.z);
    if (aSize.w > 0.5) {
      vec4 wp = vec4(p + vec3(c.x, 0.0, c.y), 1.0);
      gl_Position = projectionMatrix * viewMatrix * wp;
    } else {
      vec4 mv = viewMatrix * vec4(p, 1.0);
      mv.xy += c;
      gl_Position = projectionMatrix * mv;
    }
    vUv = position.xy * 2.0;
    vColor = aColor.rgb;
    vAlpha = aColor.a * smoothstep(0.0, 0.06, k) * (1.0 - smoothstep(aMisc.w, 1.0, k));
    vShape = aMisc.x;
    vK = k;
  }
`;

const SPRITE_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vShape;
  varying float vK;
  void main() {
    vec2 p = vUv;
    float r = length(p);
    float a = 0.0;
    if (vShape < 0.5) {
      a = exp(-r * r * 5.0) + exp(-r * r * 40.0) * 0.8;
    } else if (vShape < 1.5) {
      float arms = exp(-abs(p.x) * 38.0) * exp(-abs(p.y) * 3.2) + exp(-abs(p.y) * 38.0) * exp(-abs(p.x) * 3.2);
      a = arms * 0.95 + exp(-r * r * 60.0) * 0.8;
    } else if (vShape < 2.5) {
      float w = mix(0.06, 0.022, vK);
      float q1 = (r - 0.86) / w;
      float q2 = q1 / 2.5;
      a = exp(-q1 * q1) + exp(-q2 * q2) * 0.18; // squares, not pow(): pow of a negative base is NaN
    } else {
      float x = exp(-p.x * p.x * 6.0);
      float y = smoothstep(-1.0, -0.8, p.y) * (1.0 - smoothstep(-0.2, 1.0, p.y));
      a = x * y + exp(-p.x * p.x * 60.0) * y * 0.8;
    }
    a *= vAlpha * step(r, 1.42);
    float m = max(vColor.r, max(vColor.g, vColor.b));
    gl_FragColor = vec4(mix(vColor, vec3(m), 0.35 * a) * a, min(1.0, a));
  }
`;

export const SPRITE_SHAPE = { glow: 0, star: 1, ring: 2, pillar: 3 } as const;

export interface SpriteSpec {
  pos: V3;
  vel?: V3;
  life: number;
  gravity?: number;
  drag?: number;
  color: V3;
  alpha?: number;
  size: number;
  sizeEnd?: number;
  /** Height over width (the pillar). */
  aspect?: number;
  /** Lie on the floor (a ground ring). */
  flat?: boolean;
  shape: keyof typeof SPRITE_SHAPE;
  wobble?: number;
  /** Where in its life (0..1) it starts to fade. */
  fadeFrom?: number;
  delay?: number;
}

export class SpritePool extends Pool {
  constructor(capacity = 512, depthTest = false) {
    super(capacity, { aPos: 3, aVel: 3, aTime: 4, aColor: 4, aSize: 4, aMisc: 4 }, SPRITE_VERTEX, SPRITE_FRAGMENT, depthTest);
  }

  /**
   * A pool drawn before the figures (render order 8: after their floor shadow and ring, before the
   * figures at 10), so a shock ring sits behind the fighter it hits instead of over its face
   * (eye-candy D must-fix 4, 2026-09-29: Paine vanished under the ring in Chapter XVI).
   */
  static behind(capacity = 128): SpritePool {
    const p = new SpritePool(capacity);
    p.mesh.renderOrder = 8;
    return p;
  }

  emit(s: SpriteSpec): void {
    const i = this.slot();
    this.write('aPos', i, s.pos);
    this.write('aVel', i, s.vel ?? [0, 0, 0]);
    this.write('aTime', i, [this.time + (s.delay ?? 0), s.life, s.gravity ?? 0, s.drag ?? 0]);
    this.write('aColor', i, [...s.color, s.alpha ?? 1]);
    this.write('aSize', i, [s.size, s.sizeEnd ?? s.size, s.aspect ?? 1, s.flat ? 1 : 0]);
    this.write('aMisc', i, [SPRITE_SHAPE[s.shape], Math.random(), s.wobble ?? 0, s.fadeFrom ?? 0.5]);
  }
}
