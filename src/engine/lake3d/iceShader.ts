/**
 * **The mirror ice's shader** (the hidden Wendigo chapter's 3D stage; FFX only): GLSL and numbers, no `three` import, so a test can read them. The floor is a `Reflector` (`./ice.ts`) whose fragment shader is this one: a
 * deep blue-teal body under a polished surface, the **reflection** of everything above it (the aurora, the moon, the figures, the crystals) bent by a slow undulation and by the cracks, blurred a little more with distance;
 * a network of plate boundaries that catch the light as thin white lines, a fine frost, a dusting of snow toward the shore, and ice glitter. Output is linear: the chapter's grade encodes it.
 *
 * **The epilogue** (the sourced ice break, `research/re-ffx-wendigo-lake-macalania.md` RE 2: a magic effect, the twelve ice layers hidden, two shakes, a fade to white) is three uniforms: `uPulse` (a ring of light that runs
 * out from `uCentre`), `uBreak` (fine cracks that grow out from the party and glow) and `uLayer[12]` (each of the twelve concentric layers, outermost first, shatters cell by cell as its number rises from 0 to 1: a fragment
 * of a shattered cell is discarded and the dark water below shows).
 */

export const ICE = {
  /** The disc's radius, metres, and the number of layers in the epilogue. */
  radius: 46,
  layers: 12,
  /** The reflection's strength at normal incidence and at grazing, the share of the body the reflection hides. */
  mirrorLow: 0.34,
  mirrorHigh: 1.0,
  /** The plate size (metres) of the big cracks and of the epilogue's fine ones. */
  plate: 6.5,
  fine: 1.35,
  /** The reflection render's size. */
  reflectionRes: [1280, 720] as readonly [number, number],
} as const;

export const ICE_VERT = /* glsl */ `
uniform mat4 textureMatrix;
varying vec4 vProj;
varying vec3 vWP;
void main() {
  vProj = textureMatrix * vec4(position, 1.0);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const ICE_FRAG = /* glsl */ `
uniform vec3 color;                 // (Reflector's own uniform, unused)
uniform sampler2D tDiffuse;         // everything above the ice, mirrored
uniform float uTime;
uniform vec2 uCentre;               // where the epilogue starts: under the party
uniform float uRadius;
uniform float uMirrorLow; uniform float uMirrorHigh;
uniform float uPlate; uniform float uFine;
uniform float uPulse; uniform float uPulseR;
uniform float uBreak;
uniform float uLayer[12];
varying vec4 vProj;
varying vec3 vWP;

float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 h22(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 11.0; a *= 0.5; }
  return s;
}
// voronoi: x = distance to the nearest point, y = distance to the nearest boundary, z = the cell's hash
vec3 voronoi(vec2 p) {
  vec2 n = floor(p), f = fract(p);
  float d1 = 8.0; vec2 c1 = vec2(0.0); float id = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = h22(n + g);
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < d1) { d1 = d; c1 = r; id = h21(n + g); }
  }
  float e = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = h22(n + g);
    vec2 r = g + o - f;
    vec2 diff = r - c1;
    if (dot(diff, diff) > 0.00001) e = min(e, dot(0.5 * (c1 + r), normalize(diff)));
  }
  return vec3(sqrt(d1), e, id);
}

void main() {
  vec2 p = vWP.xz;
  float r = length(p - uCentre);
  float rc = length(p);

  // the twelve layers: concentric bands, the outermost first; a shattered cell is gone
  float band = clamp(floor((1.0 - clamp(rc / uRadius, 0.0, 1.0)) * 12.0), 0.0, 11.0);
  float prog = uLayer[int(band)];
  vec3 cellV = voronoi(p / 1.9);
  if (prog > 0.0 && prog > cellV.z * 0.78) discard;

  vec3 V = normalize(cameraPosition - vWP);
  float grazing = pow(1.0 - clamp(V.y, 0.0, 1.0), 4.0);
  float fres = mix(uMirrorLow, uMirrorHigh, grazing);

  float thick = fbm(p * 0.16 + 3.0);
  float rough = fbm(p * 1.6);
  vec3 plate = voronoi(p / uPlate);
  float crack = 1.0 - smoothstep(0.0, 0.035, plate.y);
  float crackWide = 1.0 - smoothstep(0.0, 0.16, plate.y);
  vec2 grad = vec2(fbm(p * 0.8 + 0.5), fbm(p * 0.8 + 9.0)) - 0.5;

  // the break: fine cracks growing out from the party, glowing
  vec2 warp = (vec2(fbm(p * 0.35), fbm(p * 0.35 + 7.0)) - 0.5) * 2.4;                        // the cracks wander: a regular web would read as a grid, not as ice
  vec3 fineV = voronoi((p + warp) / uFine);
  float reach = uBreak * (uRadius * 0.9);
  float grown = 1.0 - smoothstep(reach - 5.0, reach, r);
  float fineCrack = (1.0 - smoothstep(0.0, 0.05, fineV.y)) * grown * step(0.001, uBreak);

  // the mirror, bent by the undulation and the cracks and smeared a little downward
  vec2 bend = grad * (0.010 + 0.020 * crackWide) + (fineV.y - 0.25) * 0.004 * grown * uBreak;
  float smear = 0.0012 + 0.0035 * clamp(rc / uRadius, 0.0, 1.0) + 0.0016 * rough;
  vec3 refl = vec3(0.0);
  for (int i = -2; i <= 2; i++) {
    vec4 pj = vProj;
    pj.xy += (bend + vec2(0.0, float(i) * smear)) * pj.w;
    refl += texture2DProj(tDiffuse, pj).rgb;
  }
  refl /= 5.0;

  // the body: deep blue-teal, lighter where the ice is thin, bright along the plate boundaries
  vec3 deep = mix(vec3(0.004, 0.028, 0.065), vec3(0.020, 0.135, 0.190), thick);
  deep += vec3(0.05, 0.26, 0.34) * crackWide * 0.35;
  deep *= 0.9 + 0.2 * plate.z;
  vec3 col = deep * (1.0 - 0.7 * fres) + refl * fres;
  float nearLines = 1.0 - smoothstep(10.0, 38.0, length(vWP.xz - cameraPosition.xz));   // the plate lines are a near detail: far off they would be a web
  col += vec3(0.45, 0.72, 0.9) * crack * (0.22 + 0.4 * rough * plate.z) * (0.1 + 0.4 * grazing) * (0.3 + 0.7 * nearLines);
  col += vec3(0.50, 0.80, 1.0) * smoothstep(0.62, 0.9, rough) * 0.05 * (1.0 - grazing);   // frost

  // ice glitter: tiny points that catch the light and twinkle
  vec2 gp = p * 38.0;
  float g = h21(floor(gp));
  float tw = 0.5 + 0.5 * sin(uTime * (2.0 + 5.0 * g) + g * 60.0);
  col += vec3(0.8, 0.95, 1.0) * step(0.9965, g) * (1.0 - smoothstep(0.0, 0.35, length(fract(gp) - 0.5))) * tw * (0.3 + grazing) * 1.4;

  // snow toward the shore
  float shore = smoothstep(uRadius * 0.66, uRadius * 0.97, rc) * (0.55 + 0.45 * fbm(p * 0.35 + 5.0));
  col = mix(col, vec3(0.34, 0.45, 0.58), shore * 0.85);

  // the epilogue: fine cracks glow, the magic effect runs out as a ring
  col += vec3(0.45, 0.9, 1.0) * fineCrack * (1.4 + 2.2 * uBreak);
  col *= 1.0 - 0.35 * grown * uBreak * (1.0 - fineCrack);
  float ring = exp(-pow((r - uPulseR) / 1.6, 2.0)) * uPulse;
  col += vec3(0.7, 0.95, 1.0) * ring * 2.4;
  col += vec3(0.25, 0.55, 0.8) * uPulse * exp(-r * 0.22) * 0.9;

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

/** The water under the broken ice: near black, teal where the light finds it, a slow caustic shimmer. */
export const WATER_FRAG = /* glsl */ `
uniform float uTime;
varying vec3 vWP;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  vec2 p = vWP.xz;
  float c = vnoise(p * 0.7 + vec2(uTime * 0.25, 0.0)) * vnoise(p * 1.3 - vec2(0.0, uTime * 0.2));
  vec3 col = mix(vec3(0.002, 0.012, 0.03), vec3(0.01, 0.12, 0.17), c * 1.6);
  col += vec3(0.02, 0.2, 0.28) * pow(c, 3.0) * 2.0;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

export const WATER_VERT = /* glsl */ `
varying vec3 vWP;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

/** The shards that fall when a layer goes: each starts at its place on the ice, waits for its layer's number to pass its own delay, then falls spinning. */
export const SHARD_VERT = /* glsl */ `
uniform float uLayer[12];
attribute vec3 aStart;
attribute vec4 aRand;      // x: size, y: spin axis seed, z: spin speed, w: delay (0..0.78, as the floor's cells)
attribute float aBand;
varying float vFall;
varying vec3 vN;
mat3 rot(vec3 axis, float a) {
  axis = normalize(axis);
  float s = sin(a), c = cos(a), oc = 1.0 - c;
  return mat3(oc*axis.x*axis.x + c, oc*axis.x*axis.y + axis.z*s, oc*axis.z*axis.x - axis.y*s,
              oc*axis.x*axis.y - axis.z*s, oc*axis.y*axis.y + c, oc*axis.y*axis.z + axis.x*s,
              oc*axis.z*axis.x + axis.y*s, oc*axis.y*axis.z - axis.x*s, oc*axis.z*axis.z + c);
}
void main() {
  float prog = uLayer[int(aBand)];
  float t = max(0.0, prog - aRand.w) * 2.6;                // seconds of falling
  float live = step(aRand.w, prog) * (1.0 - smoothstep(1.6, 2.2, t));
  vFall = clamp(t / 2.0, 0.0, 1.0);
  vec3 axis = vec3(sin(aRand.y * 12.9), cos(aRand.y * 78.2), sin(aRand.y * 37.7));
  mat3 R = rot(axis, t * (2.0 + 6.0 * aRand.z));
  vec3 local = R * (position * aRand.x * live);
  vN = R * normal;
  vec3 world = aStart + local;
  world.y += 0.04 - 0.5 * 9.0 * t * t * 0.35;
  world.xz += vec2(sin(aRand.y * 5.0), cos(aRand.y * 9.0)) * t * 0.5;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`;

export const SHARD_FRAG = /* glsl */ `
varying float vFall;
varying vec3 vN;
void main() {
  vec3 n = normalize(vN);
  float l = 0.35 + 0.65 * max(0.0, dot(n, normalize(vec3(-0.4, 0.8, 0.5))));
  vec3 col = mix(vec3(0.22, 0.6, 0.78), vec3(0.62, 0.9, 1.0), l * 0.7) * l;
  col += vec3(0.4, 0.8, 1.0) * pow(1.0 - abs(n.y), 2.0) * 0.4;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;
