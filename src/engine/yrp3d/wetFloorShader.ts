/**
 * **The wet tile floor's numbers and shader** (the hidden 3D Bahamut chapter; FFX-2 only): the look lab's floor (`look-lab-d/look-shaders.js`, `PARAMS.floor`, `FLOOR_VERT` / `FLOOR_FRAG`), ported. Dark violet tiles with thin seams that
 * catch the lanterns; the **lantern streaks** (the painted backdrop, as the camera sees it, mirrored about the floor's horizon in screen space, stretched and smeared downward, strongest on the wet tiles and fading with distance);
 * the **figures' reflection** (the mirror render, a little smeared); a hair of tilt per tile; and a fade at the far end so the floor dissolves into the painting as Chapter IV's deck does. The shader's output is **linear**: the scene
 * grade of this chapter (`../../scenes/exp-yrp-3d-stage.ts`) encodes it.
 *
 * No three.js import: GLSL and numbers, so a test can read them.
 */

/** The floor's parameters, by the lab's names. Heights and distances are metres; colours sRGB hex; `*Px` are pixels at 1080p. */
export const FLOOR = {
  /** The plane is `size` square, centred on x 0 and z `centreZ`. */
  size: 80,
  centreZ: -5,
  /** The floor is solid in front of `fadeNear` (z) and gone behind `fadeFar`; `horizonZ` is where the streaks mirror about. */
  fadeFar: -17,
  fadeNear: -9.5,
  horizonZ: -13.5,
  baseNear: 0x1c1f3e,
  baseFar: 0x14162c,
  tileMetres: 3.4,
  seamMetres: 0.05,
  seamDark: 0.42,
  seamGlow: 3.2,
  tilt: 0.0008,
  /** The share of the wet gloss the driest tile keeps. */
  wetLo: 0.6,
  streak: 2.1,
  streakStretch: 0.5,
  streakBlurPx: 22,
  falloff: 1.7,
  figureReflection: 0.5,
  /** The mirror render's size (it is only figures, smeared on the floor). */
  reflectionRes: [1280, 720] as readonly [number, number],
  /** The backdrop-only render the streaks read is this share of the frame's size on each side (it is blurred anyway). */
  backScale: 0.5,
  /** Where the camera's x stands for the horizon's screen height (Yuna's mark): the lab projected the horizon at the main figure's x. */
  horizonX: 4.6,
} as const;

/** A soft contact shadow under each figure: its radius per metre of figure height, its opacity and colour, and how far it is pushed away from the key light (metres per unit of the light's horizontal direction). */
export const CONTACT = { radius: 0.75, opacity: 0.5, colour: 0x120a14, push: 0.12, bossRadius: 3.2, lift: 0.012 } as const;

export const FLOOR_VERT = /* glsl */ `
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

export const FLOOR_FRAG = /* glsl */ `
uniform vec3 color;                 // (Reflector's own uniform, unused)
uniform sampler2D tDiffuse;         // the figures, mirrored (the Reflector's render)
uniform sampler2D tBack;            // the backdrop alone, this camera, linear
uniform vec3 uBaseNear; uniform vec3 uBaseFar;
uniform vec2 uRes; uniform float uYh;
uniform float uStretch; uniform float uStreak; uniform float uBlurPx; uniform float uFall; uniform float uFigRefl; uniform float uTilt; uniform float uWetLo;
uniform float uFadeFar; uniform float uFadeNear; uniform float uTile; uniform float uSeamW; uniform float uSeamDark; uniform float uSeamGlow;
uniform sampler2D uGrain;
varying vec4 vProj;
varying vec3 vWP;

float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
}

void main() {
  float a = smoothstep(uFadeFar, uFadeNear, vWP.z);
  float nearT = smoothstep(-10.0, 12.0, vWP.z);
  vec3 base = mix(uBaseFar, uBaseNear, nearT);

  vec2 g = vWP.xz / uTile;
  vec2 cell = floor(g);
  vec2 f = fract(g);
  float hc = h21(cell);
  vec2 e = min(f, 1.0 - f);
  float sd = min(e.x, e.y) * uTile;
  float seam = 1.0 - smoothstep(0.0, uSeamW, sd);
  vec2 tilt = (vec2(h21(cell + 3.1), h21(cell + 7.7)) - 0.5) * 2.0 * uTilt;     // each tile is laid a hair off true
  float wet = mix(uWetLo, 1.0, smoothstep(0.25, 0.75, vnoise(vWP.xz * 0.35 + hc * 3.0)));
  float grainN = texture2D(uGrain, vWP.xz * 0.9).b;

  vec3 V = normalize(cameraPosition - vWP);
  float fres = mix(0.3, 1.0, pow(1.0 - clamp(V.y, 0.0, 1.0), 2.0));

  // lantern streaks: the backdrop mirrored about the floor's horizon in screen space, stretched and smeared downward
  vec2 sUv = gl_FragCoord.xy / uRes;
  float dy = max(uYh - sUv.y, 0.0);
  float sy = uYh + dy * uStretch;
  float bl = uBlurPx / uRes.y * (0.5 + dy * 7.0);
  vec3 streak = vec3(0.0);
  float ws = 0.0;
  for (int i = -7; i <= 7; i++) {
    float t = float(i) / 7.0;
    float w = 1.0 - abs(t) * 0.75;
    float wob = (tilt.x * 2.0 + 0.0022 * sin(dy * 55.0 + vWP.x * 0.9 + t * 2.0)) * (0.4 + dy * 3.0);
    streak += texture2D(tBack, vec2(sUv.x + wob, sy + t * bl)).rgb * w;
    ws += w;
  }
  streak /= ws;
  float fall = exp(-dy * uFall);

  // the figures, mirrored, a little smeared
  vec3 fr = vec3(0.0);
  for (int i = -2; i <= 2; i++) {
    vec4 pj = vProj;
    pj.xy += (tilt * 0.8 + vec2(0.0, float(i) * 0.0035)) * pj.w;
    fr += texture2DProj(tDiffuse, pj).rgb;
  }
  fr /= 5.0;

  vec3 col = base * (0.9 + 0.2 * hc) * (0.92 + 0.16 * grainN) * (1.0 - uSeamDark * seam);
  col += streak * uStreak * wet * fres * fall * (0.75 + 0.5 * hc);
  col += streak * seam * uSeamGlow * fres * fall * 0.35;       // the seams catch the lanterns
  col += fr * uFigRefl * (0.55 + 0.45 * wet) * fres;
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}
`;
