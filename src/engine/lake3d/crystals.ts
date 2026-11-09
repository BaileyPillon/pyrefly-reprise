/**
 * **The ice crystals** (the hidden Wendigo chapter's 3D stage; FFX only): faceted hexagonal spires of glassy ice, grown in clusters out of the lake and along the shore, drawn as one instanced mesh with one shader. A crystal
 * is a six-sided prism with a pointed tip (a lathe, flat-shaded: every facet catches the light on its own); the shader gives it a deep teal body that brightens toward its tip, a bright rim where a facet turns from the lens
 * (the fresnel of glass), a cold highlight from the moon's side and a faint inner glow at the root. They are the lake's foreground: a cluster stands left of the party and one right of Wendigo, so the frame has near edges
 * to look past, and the aurora's colours run along their edges. The floor's mirror draws them (the ice shows each one twice).
 *
 * Placement is seeded, so a retry builds the same lake. Linear light. Needs three.js; no DOM. Game case: FFX only.
 */

import { Color, DoubleSide, InstancedMesh, LatheGeometry, Matrix4, Quaternion, ShaderMaterial, Vector2, Vector3, Euler, type BufferGeometry } from 'three';
import type { V3 } from './layout.ts';

/** A cluster: where it stands (x, z), how wide it spreads, how many spires, and their height range in metres. */
export interface Cluster {
  readonly at: readonly [number, number];
  readonly spread: number;
  readonly count: number;
  readonly height: readonly [number, number];
}

/**
 * The standing clusters of procedural spires. **None**: the first GPU run's flat pale prisms stood in front of the Meshy crystal clusters (`./props.ts`) and read as untextured next to them, so the field of the lake is
 * the Meshy crystals alone and the procedural spires are only the shore's. The table stays (a place and a count per cluster) for a lane that wants fill back. Staging, not game data.
 */
export const CLUSTERS: readonly Cluster[] = [];

/** The shore: spires round the ice's edge, from `inner` to `outer` metres from the middle (the far edge of the picture, where their flatness does not show). */
export const SHORE_SPIRES = { count: 40, inner: 38, outer: 46, height: [1.2, 5.5] as const };

function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507) >>> 0;
    s = (Math.imul(s ^ (s >>> 13), 3266489909) ^ (s >>> 16)) >>> 0;
    return s / 4294967296;
  };
}

/** One spire's place: position, tilt, yaw, height and width. */
export interface Spire {
  readonly pos: V3;
  readonly tilt: number;
  readonly yaw: number;
  readonly height: number;
  readonly width: number;
  readonly tint: number;
}

/** Every spire of the lake, seeded. Nothing stands inside the fight (a 6 m disc round the party and the enemies' marks). */
export function spires(seed = 5): Spire[] {
  const rnd = seeded(seed);
  const out: Spire[] = [];
  const clear = (x: number, z: number): boolean => Math.hypot(x - 0.9, z + 1.6) > 6.2 && Math.hypot(x - 2.6, z + 5.8) > 3.2;
  const add = (x: number, z: number, hr: readonly [number, number], lean: number): void => {
    if (!clear(x, z)) return;
    const height = hr[0] + (hr[1] - hr[0]) * Math.pow(rnd(), 1.6);
    out.push({ pos: [x, 0, z], tilt: (rnd() - 0.3) * lean, yaw: rnd() * Math.PI * 2, height, width: height * (0.07 + rnd() * 0.05) + 0.06, tint: rnd() });
  };
  for (const c of CLUSTERS) {
    for (let i = 0; i < c.count; i++) {
      const a = rnd() * Math.PI * 2;
      const r = c.spread * Math.sqrt(rnd());
      add(c.at[0] + Math.cos(a) * r, c.at[1] + Math.sin(a) * r, c.height, 0.55);
    }
  }
  for (let i = 0; i < SHORE_SPIRES.count; i++) {
    const a = rnd() * Math.PI * 2;
    const r = SHORE_SPIRES.inner + (SHORE_SPIRES.outer - SHORE_SPIRES.inner) * rnd();
    add(Math.cos(a) * r, Math.sin(a) * r, SHORE_SPIRES.height, 0.4);
  }
  return out;
}

const VERT = /* glsl */ `
varying vec3 vN; varying vec3 vV; varying float vH; varying float vTint;
void main() {
  mat4 im = instanceMatrix;
  vec4 wp = modelMatrix * im * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * mat3(im) * normal);
  vV = cameraPosition - wp.xyz;
  vH = clamp(position.y, 0.0, 1.0);
  vTint = instanceColor.r;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uDeep; uniform vec3 uGlow; uniform vec3 uRim; uniform vec3 uKey;
varying vec3 vN; varying vec3 vV; varying float vH; varying float vTint;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  if (!gl_FrontFacing) n = -n;
  float fr = pow(1.0 - abs(dot(n, v)), 2.4);
  float l = 0.3 + 0.7 * max(0.0, dot(n, normalize(uKey)));
  vec3 body = mix(uDeep, uGlow, smoothstep(0.0, 1.0, vH) * 0.8 + vTint * 0.15) * l;
  body += uGlow * (1.0 - vH) * 0.35;                       // the root glows from inside
  vec3 h = normalize(normalize(uKey) + v);
  float spec = pow(max(0.0, dot(n, h)), 70.0);
  vec3 col = body + uRim * fr * 0.7 + vec3(0.8, 0.95, 1.0) * spec * 1.2;
  gl_FragColor = vec4(col, clamp(0.62 + 0.35 * fr + 0.1 * spec, 0.0, 1.0));
  #include <colorspace_fragment>
}
`;

/** The crystals' profile: a hexagonal prism of unit height and radius 1 (scaled per spire) with a pointed tip. */
export function crystalGeometry(): BufferGeometry {
  const profile = [new Vector2(0.0, 0.0), new Vector2(1.0, 0.0), new Vector2(0.92, 0.7), new Vector2(0.0, 1.0)];
  const lathe = new LatheGeometry(profile, 6);
  const flat = lathe.toNonIndexed();
  flat.computeVertexNormals();
  lathe.dispose();
  return flat;
}

export interface Crystals {
  readonly mesh: InstancedMesh;
  readonly count: number;
  dispose(): void;
}

/** The instanced crystal field. `key` is the direction toward the light that gives each facet its highlight. */
export function buildCrystals(key: V3 = [-0.4, 0.8, 0.45], list: readonly Spire[] = spires()): Crystals {
  const geometry = crystalGeometry();
  const material = new ShaderMaterial({
    name: 'lake-crystals',
    transparent: true,
    side: DoubleSide,
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: { uDeep: { value: new Color(0x03243a) }, uGlow: { value: new Color(0x2fa8cc) }, uRim: { value: new Color(0x6fd0e8) }, uKey: { value: new Vector3(...key) } },
  });
  const mesh = new InstancedMesh(geometry, material, list.length);
  mesh.name = 'lake-crystals';
  mesh.frustumCulled = false;
  const m = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const colour = new Color();
  list.forEach((s, i) => {
    e.set(s.tilt * Math.cos(s.yaw), s.yaw, s.tilt * Math.sin(s.yaw), 'YXZ');
    q.setFromEuler(e);
    m.compose(new Vector3(...s.pos), q, new Vector3(s.width, s.height, s.width));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, colour.setRGB(s.tint, 0, 0));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return {
    mesh,
    count: list.length,
    dispose(): void {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
      mesh.removeFromParent();
    },
  };
}
