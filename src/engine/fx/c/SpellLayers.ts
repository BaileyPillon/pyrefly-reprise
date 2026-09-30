/**
 * Option C5's spell layers in the 3D field (eye-candy options round, 2026-09-29): they sit in
 * the scene, so they sort with the figures and the post chain's bloom takes them. They are laid
 * on top of the approved option-B spell effects (D-227), which keep drawing exactly as before.
 *
 * - `FireColumns`: a domain-warped FBM flame column (black, ember red, orange, gold, white).
 * - `IceBurst`: hexagonal crystal spikes that grow out of the floor round the target in 180 ms,
 *   faceted with a Fresnel rim, and shatter into glints at 600 ms.
 * - `ShockSpheres`: Mega Flare's expanding shell (FFX-2, Chapter IV).
 *
 * Game case: both; FFX-2's Mega Flare shell is FFX-2 only (the caller decides).
 */

import {
  AdditiveBlending,
  CylinderGeometry,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  Mesh,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type Camera,
  type Object3D,
} from 'three';

const NOISE = /* glsl */ `
  float h21(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) { float s = 0.0; float a = 0.5; for (int i = 0; i < 3; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }
`;

// ----------------------------------------------------------------- fire

const FIRE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uRise;
  uniform float uFade;
  uniform float uGain;
  varying vec2 vUv;
  ${NOISE}
  vec3 ramp(float t) {
    vec3 c = mix(vec3(0.0), vec3(0.545, 0.10, 0.0), smoothstep(0.0, 0.25, t));
    c = mix(c, vec3(1.0, 0.415, 0.0), smoothstep(0.2, 0.5, t));
    c = mix(c, vec3(1.0, 0.82, 0.48), smoothstep(0.45, 0.78, t));
    return mix(c, vec3(1.0, 0.98, 0.92), smoothstep(0.75, 1.0, t));
  }
  void main() {
    vec2 uv = vUv;
    vec2 q = vec2(uv.x * 2.4 + uSeed, uv.y * 1.7 - uTime * 2.1);
    float warp = fbm(q * 1.6 + vec2(0.0, uTime * 0.7));
    float n = fbm(q + warp * 0.9);
    float x = (uv.x - 0.5) * 2.0;
    float width = mix(0.92, 0.1, pow(uv.y, 0.75));
    float shape = 1.0 - smoothstep(width * 0.45, width, abs(x + (n - 0.5) * 0.45));
    float top = 1.0 - smoothstep(uRise - 0.25, uRise, uv.y);
    float heat = shape * top * (1.05 - uv.y * 0.75) * (n * 1.35 + 0.1);
    heat *= smoothstep(0.0, 0.06, uv.y) * uFade;
    float t = clamp(heat * 1.25, 0.0, 1.0);
    vec3 col = ramp(t * 0.92) * (0.7 + 0.35 * t * t) * uGain;
    float a = clamp(heat * 1.15, 0.0, 0.85);
    gl_FragColor = vec4(col * a, a);
  }
`;

const BILLBOARD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

interface Flame {
  mesh: Mesh;
  mat: ShaderMaterial;
  age: number;
  life: number;
}

export class FireColumns {
  private readonly flames: Flame[] = [];
  private readonly geo = new PlaneGeometry(1, 1).translate(0, 0.5, 0);
  private t = 0;

  constructor(private readonly parent: Object3D, private readonly max = 4) {}

  /** A column rising out of the floor at `base`, `height` tall. */
  play(base: Vector3, height: number, gain = 1): void {
    let f = this.flames.find((x) => x.age >= x.life);
    if (!f) {
      if (this.flames.length >= this.max) f = this.flames[0]!;
      else {
        const mat = new ShaderMaterial({
          uniforms: { uTime: { value: 0 }, uSeed: { value: 0 }, uRise: { value: 0 }, uFade: { value: 1 }, uGain: { value: 1 } },
          vertexShader: BILLBOARD_VERTEX,
          fragmentShader: FIRE_FRAGMENT,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          side: DoubleSide,
        });
        const mesh = new Mesh(this.geo, mat);
        mesh.frustumCulled = false;
        mesh.renderOrder = 55;
        this.parent.add(mesh);
        f = { mesh, mat, age: 0, life: 0 };
        this.flames.push(f);
      }
    }
    f.age = 0;
    f.life = 1.05;
    f.mesh.position.copy(base);
    f.mesh.scale.set(height * 0.72, height, 1);
    f.mat.uniforms['uSeed']!.value = Math.random() * 10;
    f.mat.uniforms['uGain']!.value = gain;
    f.mesh.visible = true;
  }

  update(dt: number, camera: Camera): void {
    this.t += dt;
    for (const f of this.flames) {
      f.age += dt;
      if (f.age >= f.life) {
        f.mesh.visible = false;
        continue;
      }
      const k = f.age / f.life;
      f.mat.uniforms['uTime']!.value = this.t;
      f.mat.uniforms['uRise']!.value = Math.min(1.25, 0.2 + (f.age / 0.16) * 1.05);
      f.mat.uniforms['uFade']!.value = 1 - Math.pow(Math.max(0, (k - 0.55) / 0.45), 1.5);
      // A cylindrical billboard: turn round the vertical only, so the column stays upright.
      const c = camera.position;
      f.mesh.rotation.set(0, Math.atan2(c.x - f.mesh.position.x, c.z - f.mesh.position.z), 0);
    }
  }

  get live(): number {
    return this.flames.filter((f) => f.age < f.life).length;
  }

  clear(): void {
    for (const f of this.flames) {
      f.age = f.life;
      f.mesh.visible = false;
    }
  }

  dispose(): void {
    for (const f of this.flames) {
      f.mesh.removeFromParent();
      f.mat.dispose();
    }
    this.geo.dispose();
  }
}

// ------------------------------------------------------------------ ice

const ICE_VERTEX = /* glsl */ `
  varying vec3 vWorld;
  varying float vH;
  void main() {
    vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vH = position.y + 0.5;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const ICE_FRAGMENT = /* glsl */ `
  uniform vec3 uRim;
  uniform vec3 uBody;
  uniform float uFade;
  varying vec3 vWorld;
  varying float vH;
  void main() {
    vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
    vec3 v = normalize(cameraPosition - vWorld);
    float fres = pow(1.0 - abs(dot(n, v)), 2.2);
    float facet = 0.55 + 0.45 * abs(n.x * 0.6 + n.y * 0.3 + n.z * 0.74);
    vec3 col = uBody * facet * (0.35 + 0.65 * vH) + uRim * fres * 1.6 + uRim * smoothstep(0.82, 1.0, vH) * 0.8;
    float a = (0.14 + fres * 0.75) * uFade;
    gl_FragColor = vec4(col * a, a);
  }
`;

interface Shard {
  pos: Vector3;
  axis: Quaternion;
  len: number;
  rad: number;
  delay: number;
}

interface Burst {
  shards: Shard[];
  age: number;
  first: number;
}

export class IceBurst {
  private readonly mesh: InstancedMesh;
  private readonly mat: ShaderMaterial;
  private readonly bursts: Burst[] = [];
  private readonly m = new Matrix4();
  private readonly s = new Vector3();
  /** Called with each shard's tip as it shatters (the caller throws glints there). */
  onShatter: ((tip: Vector3, big: boolean) => void) | null = null;

  constructor(parent: Object3D, private readonly capacity = 72) {
    const geo = new CylinderGeometry(0.04, 0.5, 1, 6, 1).translate(0, 0.5, 0);
    this.mat = new ShaderMaterial({
      uniforms: { uRim: { value: new Vector3(0.55, 1.0, 1.35) }, uBody: { value: new Vector3(0.1, 0.24, 0.4) }, uFade: { value: 1 } },
      vertexShader: ICE_VERTEX,
      fragmentShader: ICE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
    this.mesh = new InstancedMesh(geo, this.mat, capacity);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 54;
    parent.add(this.mesh);
  }

  /** Spikes erupting from the floor round `foot`, sized to a figure `height` tall. */
  play(foot: Vector3, height: number, count: number): void {
    const shards: Shard[] = [];
    const ring = height * 0.5;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const r = ring * (0.35 + Math.random() * 0.75);
      const pos = new Vector3(foot.x + Math.cos(ang) * r, foot.y, foot.z + Math.sin(ang) * r * 0.7);
      const out = new Vector3(Math.cos(ang), 2.2 + Math.random() * 1.4, Math.sin(ang) * 0.7).normalize();
      shards.push({
        pos,
        axis: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), out),
        len: height * (0.45 + Math.random() * 0.6) * (i % 5 === 0 ? 1.5 : 1),
        rad: height * (0.045 + Math.random() * 0.04),
        delay: Math.random() * 0.09,
      });
    }
    this.bursts.push({ shards, age: 0, first: 1 });
    while (this.bursts.reduce((n, b) => n + b.shards.length, 0) > this.capacity) this.bursts.shift();
  }

  update(dt: number): void {
    let n = 0;
    for (const b of this.bursts) b.age += dt;
    for (let i = this.bursts.length - 1; i >= 0; i--) if (this.bursts[i]!.age > 0.68) this.shatter(this.bursts.splice(i, 1)[0]!);
    for (const b of this.bursts) {
      for (const s of b.shards) {
        const t = Math.max(0, b.age - s.delay);
        const g = Math.min(1, t / 0.18);
        const grow = 1 - Math.pow(1 - g, 3);
        this.s.set(s.rad * (0.6 + 0.4 * grow), s.len * grow, s.rad * (0.6 + 0.4 * grow));
        this.m.compose(s.pos, s.axis, this.s);
        this.mesh.setMatrixAt(n++, this.m);
      }
    }
    this.mesh.count = n;
    if (n) this.mesh.instanceMatrix.needsUpdate = true;
  }

  private shatter(b: Burst): void {
    if (!this.onShatter) return;
    const up = new Vector3();
    for (const s of b.shards) {
      up.set(0, 1, 0).applyQuaternion(s.axis).multiplyScalar(s.len);
      this.onShatter(s.pos.clone().add(up), s.len > b.shards[0]!.len * 1.2);
    }
  }

  get live(): number {
    return this.bursts.length;
  }

  clear(): void {
    this.bursts.length = 0;
    this.mesh.count = 0;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
    this.mesh.dispose();
  }
}

// ---------------------------------------------------------------- shell

const SHELL_VERTEX = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const SHELL_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uFade;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
    float a = (f * 1.4 + 0.06) * uFade;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

export class ShockSpheres {
  private readonly mesh: Mesh;
  private readonly mat: ShaderMaterial;
  private age = 1e9;
  private life = 1.1;
  private radius = 6;

  constructor(parent: Object3D) {
    this.mat = new ShaderMaterial({
      uniforms: { uColor: { value: new Vector3(3.0, 1.4, 2.4) }, uFade: { value: 0 } },
      vertexShader: SHELL_VERTEX,
      fragmentShader: SHELL_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.mesh = new Mesh(new SphereGeometry(1, 40, 20), this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 53;
    this.mesh.visible = false;
    parent.add(this.mesh);
  }

  play(centre: Vector3, radius: number, color: [number, number, number]): void {
    this.mesh.position.copy(centre);
    this.radius = radius;
    this.age = 0;
    (this.mat.uniforms['uColor']!.value as Vector3).set(...color);
    this.mesh.visible = true;
  }

  update(dt: number): void {
    if (this.age > this.life) return;
    this.age += dt;
    const k = Math.min(1, this.age / this.life);
    const r = this.radius * (1 - Math.pow(1 - k, 3)) + 0.05;
    this.mesh.scale.set(r, r * 0.8, r);
    this.mat.uniforms['uFade']!.value = (1 - k) * Math.min(1, this.age / 0.05);
    this.mesh.visible = this.age <= this.life;
  }

  clear(): void {
    this.age = 1e9;
    this.mesh.visible = false;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}
