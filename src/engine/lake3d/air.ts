/**
 * **The air over the ice** (the hidden Wendigo chapter's 3D stage; FFX only): the **volumetric light shafts** and the ground mist.
 *
 * A shaft is a tall open cylinder along the light's slant, drawn additive and **raymarched analytically**: each fragment takes the view ray through the cylinder, solves for where the ray enters and leaves it
 * (a quadratic), clips that to the shaft's length, and lights the pixel by the chord's length through the haze (`1 - exp(-chord * density)`), faded along the shaft and shimmering with a noise that drifts down it. So a
 * shaft is dense where the ray crosses its middle and thins to nothing at its edge, at any angle and from inside it, with no cards and no sorting. Four stand over the lake on the slant of the moon's light through the
 * aurora's haze; they are staging, not game data.
 *
 * The mist is a low sheet of two scrolling noises over the ice (additive, pale teal, thinning with the camera's height and distance), which gives the mirror a near and a far.
 *
 * Linear light. Needs three.js; no DOM. Game case: FFX only.
 */

import { AdditiveBlending, BackSide, Color, CylinderGeometry, Group, Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from 'three';
import type { V3 } from './layout.ts';

/** A shaft: where its foot is on the ice, which way and how far it climbs, its radius, strength and colour. */
export interface ShaftSpec {
  readonly foot: V3;
  readonly climb: V3;
  readonly radius: number;
  readonly strength: number;
  readonly colour: number;
}

export const SHAFTS: readonly ShaftSpec[] = [
  { foot: [-15, 0, -13], climb: [-9, 38, -17], radius: 2.6, strength: 0.5, colour: 0x7fc8ff },
  { foot: [-2.5, 0, -21], climb: [-8, 40, -16], radius: 3.6, strength: 0.4, colour: 0x9fe8ff },
  { foot: [9.5, 0, -15], climb: [-9, 38, -16], radius: 2.2, strength: 0.45, colour: 0x7fd8ff },
  { foot: [17, 0, -5], climb: [-8, 36, -15], radius: 3.0, strength: 0.35, colour: 0x8fd0ff },
];

const SHAFT_VERT = /* glsl */ `
varying vec3 vWP;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const SHAFT_FRAG = /* glsl */ `
uniform vec3 uFoot; uniform vec3 uAxis; uniform float uLen; uniform float uR;
uniform vec3 uColour; uniform float uStrength; uniform float uTime; uniform float uSeed;
varying vec3 vWP;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  vec3 O = cameraPosition;
  vec3 D = normalize(vWP - O);
  vec3 oc = O - uFoot;
  vec3 dPerp = D - dot(D, uAxis) * uAxis;
  vec3 oPerp = oc - dot(oc, uAxis) * uAxis;
  float a = dot(dPerp, dPerp);
  if (a < 1e-6) discard;
  float b = dot(dPerp, oPerp);
  float c = dot(oPerp, oPerp) - uR * uR;
  float disc = b * b - a * c;
  if (disc <= 0.0) discard;
  float sq = sqrt(disc);
  float t1 = max((-b - sq) / a, 0.0);
  float t2 = (-b + sq) / a;
  float da = dot(D, uAxis);
  float sO = dot(oc, uAxis);
  float tA = (0.0 - sO) / (abs(da) < 1e-5 ? 1e-5 : da);
  float tB = (uLen - sO) / (abs(da) < 1e-5 ? 1e-5 : da);
  float tLo = max(t1, min(tA, tB));
  float tHi = min(t2, max(tA, tB));
  float chord = tHi - tLo;
  if (chord <= 0.0) discard;
  vec3 mid = O + D * (0.5 * (tLo + tHi));
  float sMid = dot(mid - uFoot, uAxis) / uLen;
  float along = smoothstep(0.0, 0.12, sMid) * (1.0 - smoothstep(0.45, 1.0, sMid));
  vec3 radial = mid - uFoot - dot(mid - uFoot, uAxis) * uAxis;
  float ang = atan(radial.z, radial.x);
  float shimmer = 0.6 + 0.4 * vnoise(vec2(sMid * 7.0 - uTime * 0.18 + uSeed, ang * 1.4 + uSeed * 3.0));
  float dens = 1.0 - exp(-chord * 0.055 * uStrength);
  gl_FragColor = vec4(uColour * dens * along * shimmer * 0.9, 1.0);
  #include <colorspace_fragment>
}
`;

const MIST_FRAG = /* glsl */ `
uniform float uTime; uniform vec3 uColour; uniform float uRadius;
varying vec3 vWP;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  vec2 p = vWP.xz;
  float n = vnoise(p * 0.11 + vec2(uTime * 0.05, 0.0)) * 0.6 + vnoise(p * 0.27 - vec2(0.0, uTime * 0.04)) * 0.4;
  float d = length(cameraPosition - vWP);
  float low = 1.0 - smoothstep(0.6, 6.0, cameraPosition.y);                 // a camera high above the lake sees through it
  float far = smoothstep(8.0, 42.0, d) * (1.0 - smoothstep(uRadius * 0.7, uRadius, length(p)));
  float a = pow(n, 2.2) * (0.03 + 0.15 * far) * (0.35 + 0.65 * low);
  gl_FragColor = vec4(uColour * a, 1.0);
  #include <colorspace_fragment>
}
`;

export interface Air {
  readonly group: Group;
  update(t: number): void;
  dispose(): void;
}

export function buildAir(radius = 46, shafts: readonly ShaftSpec[] = SHAFTS): Air {
  const group = new Group();
  group.name = 'lake-air';
  const owned: Array<{ dispose(): void }> = [];
  const materials: ShaderMaterial[] = [];
  shafts.forEach((s, i) => {
    const climb = new Vector3(...s.climb);
    const len = climb.length();
    const axis = climb.clone().normalize();
    const foot = new Vector3(...s.foot);
    const geometry = new CylinderGeometry(s.radius, s.radius, len, 24, 1, true);
    const material = new ShaderMaterial({
      name: 'lake-shaft',
      side: BackSide,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      vertexShader: SHAFT_VERT,
      fragmentShader: SHAFT_FRAG,
      uniforms: { uFoot: { value: foot }, uAxis: { value: axis }, uLen: { value: len }, uR: { value: s.radius }, uColour: { value: new Color(s.colour) }, uStrength: { value: s.strength }, uTime: { value: 0 }, uSeed: { value: i * 3.7 } },
    });
    const mesh = new Mesh(geometry, material);
    mesh.name = `lake-shaft-${i}`;
    mesh.position.copy(foot).addScaledVector(axis, len / 2);
    mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), axis);
    mesh.frustumCulled = false;
    mesh.renderOrder = 8;
    group.add(mesh);
    owned.push(geometry, material);
    materials.push(material);
  });
  const mistGeometry = new PlaneGeometry(radius * 2.2, radius * 2.2).rotateX(-Math.PI / 2);
  const mistMaterial = new ShaderMaterial({
    name: 'lake-mist',
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    vertexShader: SHAFT_VERT,
    fragmentShader: MIST_FRAG,
    uniforms: { uTime: { value: 0 }, uColour: { value: new Color(0x79d6e8) }, uRadius: { value: radius } },
  });
  const mist = new Mesh(mistGeometry, mistMaterial);
  mist.name = 'lake-mist';
  mist.position.y = 0.45;
  mist.frustumCulled = false;
  mist.renderOrder = 6;
  group.add(mist);
  owned.push(mistGeometry, mistMaterial);
  materials.push(mistMaterial);
  return {
    group,
    update(t: number): void {
      for (const m of materials) m.uniforms['uTime']!.value = t;
    },
    dispose(): void {
      for (const o of owned) o.dispose();
      group.removeFromParent();
    },
  };
}
