/**
 * **The falling snow** (the hidden Wendigo chapter's 3D stage; FFX only): five thousand flakes in a box round the fight, all moved by the vertex shader (nothing is updated on the CPU but the clock): each falls at a speed of
 * its own, drifts on a slow wind with a sway, wraps round the box, and is drawn as a soft round point whose size shrinks with distance (a flake near the lens is a big soft disc, a far one a speck, which is the depth of
 * field of a night lens). The box follows the camera's ground position loosely so a flight through the air never leaves the snow behind.
 *
 * Linear light; the flakes are tinted cold white and lit faintly by the aurora's green. The floor's mirror draws them too. Needs three.js; no DOM. Game case: FFX only.
 */

import { BufferAttribute, BufferGeometry, Color, NormalBlending, Points, ShaderMaterial, Vector2, Vector3, type Camera, type WebGLRenderer } from 'three';
import { ARENA, type V3 } from './layout.ts';

export const SNOW = { count: ARENA.snow.count, box: ARENA.snow.box, centre: ARENA.snow.centre, fall: [0.55, 1.35] as const, wind: [0.35, 0.05, -0.12] as V3, size: 0.034, opacity: 0.85 } as const;

const VERT = /* glsl */ `
uniform float uTime; uniform vec3 uBox; uniform vec3 uCentre; uniform vec3 uWind; uniform float uSize; uniform float uScale;
attribute vec4 aSeed;     // x, y, z: where in the box; w: speed seed
varying float vAlpha;
varying float vDepth;
void main() {
  float speed = mix(0.55, 1.35, aSeed.w);
  vec3 p = aSeed.xyz * uBox;
  p.y -= uTime * speed;
  p += uWind * uTime * (0.5 + aSeed.w);
  p.x += sin(uTime * 0.7 + aSeed.w * 40.0) * 0.35;
  p.z += cos(uTime * 0.55 + aSeed.x * 40.0) * 0.35;
  p = mod(p, uBox) - uBox * 0.5;
  vec3 world = p + uCentre;
  vec4 mv = viewMatrix * vec4(world, 1.0);
  float dist = max(0.3, -mv.z);
  gl_Position = projectionMatrix * mv;
  float size = uSize * (0.35 + aSeed.w * 0.9);
  gl_PointSize = clamp(size * uScale / dist, 1.0, 38.0);
  // flakes near the lens fade (they would cover the picture), the far ones fade into the haze
  vAlpha = smoothstep(0.4, 2.2, dist) * (1.0 - smoothstep(34.0, 58.0, dist));
  vDepth = dist;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uColour; uniform float uOpacity;
varying float vAlpha;
varying float vDepth;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float a = (1.0 - smoothstep(0.35, 1.0, d)) * vAlpha * uOpacity;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColour, a);
  #include <colorspace_fragment>
}
`;

export interface Snow {
  readonly points: Points;
  update(t: number): void;
  dispose(): void;
}

/** A seeded unit random. */
function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507) >>> 0;
    s = (Math.imul(s ^ (s >>> 13), 3266489909) ^ (s >>> 16)) >>> 0;
    return s / 4294967296;
  };
}

/** The seed table (x, y, z in the box's unit cube and a speed seed per flake). */
export function snowSeeds(count: number, seed = 11): Float32Array {
  const rnd = seeded(seed);
  const out = new Float32Array(count * 4);
  for (let i = 0; i < out.length; i++) out[i] = rnd();
  return out;
}

export function buildSnow(count: number = SNOW.count): Snow {
  const size = new Vector2();
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3)); // (unused: the shader places each flake; three wants the attribute for the draw count)
  geometry.setAttribute('aSeed', new BufferAttribute(snowSeeds(count), 4));
  const material = new ShaderMaterial({
    name: 'lake-snow',
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uBox: { value: new Vector3(...SNOW.box) },
      uCentre: { value: new Vector3(...SNOW.centre) },
      uWind: { value: new Vector3(...SNOW.wind) },
      uSize: { value: SNOW.size },
      uScale: { value: 450 },
      uColour: { value: new Color(0xcfe6ff) },
      uOpacity: { value: SNOW.opacity },
    },
  });
  const points = new Points(geometry, material);
  points.name = 'lake-snow';
  points.frustumCulled = false;
  points.renderOrder = 5;
  points.onBeforeRender = (renderer: WebGLRenderer, _scene, camera: Camera): void => {
    const target = renderer.getRenderTarget();
    const height = target ? target.height : renderer.getDrawingBufferSize(size).y;
    const fov = (camera as { fov?: number }).fov ?? 32;
    material.uniforms['uScale']!.value = height / (2 * Math.tan((fov * Math.PI) / 360)); // pixels per metre at 1 m: a flake is a few centimetres, its size on the screen follows the frame
  };
  return {
    points,
    update(t: number): void {
      material.uniforms['uTime']!.value = t;
    },
    dispose(): void {
      geometry.dispose();
      material.dispose();
      points.removeFromParent();
    },
  };
}
