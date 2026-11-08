/**
 * **The lake's sky** (the hidden Wendigo chapter's 3D stage; FFX only): one dome that follows the camera, drawn by one shader: a deep indigo night rising to a glowing teal horizon, a field of twinkling stars, a low cold
 * moon with a halo, and the **aurora**: three curtains of green, teal and violet that hang over the north (-z, behind the enemies), each a ribbon whose base undulates across the sky, with vertical rays that stream and
 * fade upward. The ice mirrors all of it (the floor's reflection renders the dome), which is most of the picture.
 *
 * Nothing here is game data (the lake's sky is not in the sources: staging, `docs/handoff/ch-wendigo.md`). The shader works in linear light and the chapter's grade encodes. `skyDir` and `AURORA` are exported so a test can
 * read the numbers; the dome's colours are one table.
 *
 * Needs three.js; no DOM. Game case: FFX only.
 */

import { BackSide, Color, Mesh, ShaderMaterial, SphereGeometry, Vector3, type Camera } from 'three';

/** The sky's numbers. Colours are sRGB hex (stored linear by `Color`); `moon` is a direction. */
export const SKY = {
  zenith: 0x050a1c,
  mid: 0x0a1f3c,
  horizon: 0x2c6a86,
  glow: 0x6fe3d2,
  moon: { dir: [-0.42, 0.34, -0.84] as const, colour: 0xe4f2ff, radius: 0.035, halo: 0.55 },
  stars: { density: 0.9, size: 2.4 },
  radius: 300,
} as const;

/** The aurora: how far it spreads round the north (degrees either side of -z), its three curtains' base height and colours. */
export const AURORA = {
  spanDeg: 74,
  strength: 1.1,
  curtains: [
    { base: 0.17, height: 0.46, rate: 0.05, rays: 46, colour: [0.12, 1.0, 0.42] as const, top: [0.08, 0.72, 1.0] as const },
    { base: 0.28, height: 0.55, rate: 0.035, rays: 32, colour: [0.2, 0.95, 0.7] as const, top: [0.62, 0.3, 1.0] as const },
    { base: 0.12, height: 0.38, rate: 0.065, rays: 62, colour: [0.35, 1.0, 0.35] as const, top: [0.15, 0.85, 0.9] as const },
  ],
} as const;

const VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uZenith; uniform vec3 uMid; uniform vec3 uHorizon; uniform vec3 uGlow;
uniform vec3 uMoonDir; uniform vec3 uMoonCol; uniform float uMoonR; uniform float uMoonHalo;
uniform float uStars; uniform float uStarSize;
uniform float uAurora; uniform float uSpan;
varying vec3 vDir;

float h11(float p) { return fract(sin(p * 127.1) * 43758.5453); }
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float h31(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return s;
}

// one curtain: a ribbon whose base undulates across the sky, bright at its base and fading upward, streaked by vertical rays
vec3 curtain(vec3 d, float az, float base, float height, float rate, float rays, vec3 low, vec3 top, float seed) {
  float t = uTime * rate;
  float bend = 0.07 * sin(az * 2.0 + t * 3.0 + seed) + 0.045 * sin(az * 5.3 - t * 4.1 + seed * 2.0) + 0.02 * sin(az * 11.0 + t * 7.0);
  float u = (d.y - (base + bend)) / height;
  if (u < 0.0 || u > 1.0) return vec3(0.0);
  float body = smoothstep(0.0, 0.05, u) * exp(-u * 2.6);
  float ray = vnoise(vec2(az * rays + vnoise(vec2(az * 3.0, t * 5.0 + seed)) * 5.0, u * 1.6 - t * 6.0 + seed));
  ray = 0.25 + 0.95 * smoothstep(0.25, 0.85, ray);
  float shimmer = 0.75 + 0.25 * sin(az * rays * 0.7 + t * 40.0 + seed);
  vec3 c = mix(low, top, smoothstep(0.15, 0.95, u));
  return c * body * ray * shimmer;
}

void main() {
  vec3 d = normalize(vDir);
  float y = d.y;
  // the dome's colours: a glowing teal horizon under an indigo night
  vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.22, y));
  col = mix(col, uZenith, smoothstep(0.18, 0.9, y));
  col += uGlow * 0.16 * exp(-max(y, 0.0) * 9.0);                       // the lake's light under the horizon
  if (y < 0.0) col = mix(col, uHorizon * 0.55, 1.0 - smoothstep(-0.2, 0.0, y));

  // stars: a jittered grid on the sphere, twinkling, dimmer toward the horizon and behind the aurora
  float up = smoothstep(0.02, 0.35, y);
  vec3 sp = d * 96.0;
  vec3 cell = floor(sp);
  vec3 f = fract(sp) - 0.5;
  float on = step(1.0 - 0.06 * uStars, h31(cell));
  vec3 off = (vec3(h31(cell + 1.7), h31(cell + 3.1), h31(cell + 5.3)) - 0.5) * 0.6;
  float sd = length(f - off);
  float star = on * (1.0 - smoothstep(0.0, 0.075 * uStarSize * 0.5, sd));
  star *= 0.55 + 0.45 * sin(uTime * (1.5 + 3.0 * h31(cell + 9.0)) + h31(cell) * 40.0);
  col += vec3(0.85, 0.92, 1.0) * star * up * 1.6;

  // the moon and its halo
  float md = dot(d, normalize(uMoonDir));
  float disc = smoothstep(cos(uMoonR), cos(uMoonR * 0.82), md);
  col += uMoonCol * disc * 2.6;
  col += uMoonCol * uMoonHalo * 0.18 * pow(max(md, 0.0), 90.0);
  col += uMoonCol * 0.05 * pow(max(md, 0.0), 8.0);

  // the aurora: over the north (-z), fading away to the sides and behind
  float az = atan(d.x, -d.z);
  float cone = 1.0 - smoothstep(uSpan, uSpan + 1.0, abs(az));
  if (cone > 0.0 && y > 0.0) {
    float edge = 1.0 - smoothstep(uSpan * 0.35, uSpan, abs(az));
    vec3 a = vec3(0.0);
    a += curtain(d, az, 0.17, 0.46, 0.05, 46.0, vec3(0.12, 1.0, 0.42), vec3(0.08, 0.72, 1.0), 1.0);
    a += curtain(d, az, 0.28, 0.55, 0.035, 32.0, vec3(0.2, 0.95, 0.7), vec3(0.62, 0.3, 1.0), 4.0) * 0.8;
    a += curtain(d, az, 0.12, 0.38, 0.065, 62.0, vec3(0.35, 1.0, 0.35), vec3(0.15, 0.85, 0.9), 7.0) * 0.7;
    col += a * uAurora * edge * (0.45 + 0.55 * fbm(vec2(az * 3.0, uTime * 0.03)));
  }
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

export interface Sky {
  readonly mesh: Mesh;
  /** Advance the aurora and the stars to absolute time `t` seconds. */
  update(t: number): void;
  dispose(): void;
}

/** The unit direction a sky pixel looks along, from the dome's position (a test's read of the dome's convention: the aurora hangs where `az` 0 is -z). */
export function skyDir(azimuthDeg: number, elevationDeg: number, out: Vector3 = new Vector3()): Vector3 {
  const a = (azimuthDeg * Math.PI) / 180;
  const e = (elevationDeg * Math.PI) / 180;
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
}

/** Build the dome. It follows whatever camera draws it (the floor's mirror camera too), so it stays infinitely far. */
export function buildSky(): Sky {
  const geometry = new SphereGeometry(SKY.radius, 48, 24);
  const material = new ShaderMaterial({
    name: 'lake-sky',
    side: BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uZenith: { value: new Color(SKY.zenith) },
      uMid: { value: new Color(SKY.mid) },
      uHorizon: { value: new Color(SKY.horizon) },
      uGlow: { value: new Color(SKY.glow) },
      uMoonDir: { value: new Vector3(...SKY.moon.dir) },
      uMoonCol: { value: new Color(SKY.moon.colour) },
      uMoonR: { value: SKY.moon.radius },
      uMoonHalo: { value: SKY.moon.halo },
      uStars: { value: SKY.stars.density },
      uStarSize: { value: SKY.stars.size },
      uAurora: { value: AURORA.strength },
      uSpan: { value: (AURORA.spanDeg * Math.PI) / 180 },
    },
  });
  const mesh = new Mesh(geometry, material);
  mesh.name = 'lake-sky';
  mesh.renderOrder = -100;
  mesh.frustumCulled = false;
  mesh.onBeforeRender = (_renderer, _scene, camera: Camera): void => {
    mesh.position.copy(camera.position); // a camera inside a mirror (the floor's reflection) is a camera too
    mesh.updateMatrixWorld();
  };
  return {
    mesh,
    update(t: number): void {
      material.uniforms['uTime']!.value = t;
    },
    dispose(): void {
      geometry.dispose();
      material.dispose();
      mesh.removeFromParent();
    },
  };
}
