/**
 * Demo looks, the DEPTH STAGE: the moon's glitter on the ice (GLSL; the maths it mirrors is `StageMaths.facetGlint`, and the numbers are `StageConfig.GlintSpec`). Both games (plumbing).
 *
 * A flat sheet on the floor, drawn additively over the lit ground and under the figures. For every fragment it knows the floor point, the eye and the moon, so it is real geometry: the road of
 * sparkles slides across the ice as the camera drifts, exactly as the painted plates slide behind it. The floor is cut into tiny facets (one hashed tilt each); a facet shines when its normal lines
 * up with the half vector between the eye and the moon, within `uWidth`; each has its own slow twinkle and a soft dot inside its cell, so the road is separate points of light, not a smear. A broad
 * faint sheen under them (`uSheen`) is the same lobe seen from far away. The patch dissolves toward its rim and toward the far distance, so it never shows its own edge.
 */
import { AdditiveBlending, Color, Vector2, Vector3, type ShaderMaterialParameters } from 'three';

export const GLINT_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

export const GLINT_FRAG = /* glsl */ `
  uniform vec3 uMoon;
  uniform vec3 uColor;
  uniform vec3 uSheenColor;
  uniform float uTime;
  uniform float uGain;
  uniform float uCell;
  uniform float uRough;
  uniform float uWidth;
  uniform float uSpeed;
  uniform float uSheen;
  uniform float uAmount;
  uniform vec2 uCenter;
  uniform float uRadius;
  varying vec3 vWorld;
  // Hoskins' hash without sine: stable for the large cell numbers of a wide floor (a sine of 1e5 radians is not)
  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  void main() {
    vec3 P = vWorld;
    vec3 V = normalize(cameraPosition - P);
    vec3 L = normalize(uMoon - P);
    vec3 H = normalize(V + L);
    vec2 g = P.xz / uCell;
    vec2 c = floor(g);
    vec2 f = fract(g);
    float nx = (hash21(c) - 0.5) * 2.0 * uRough;
    float nz = (hash21(vec2(c.y + 7.3, c.x - 3.1)) - 0.5) * 2.0 * uRough;
    float ny = sqrt(max(0.0, 1.0 - nx * nx - nz * nz));
    float lobe = smoothstep(1.0 - uWidth, 1.0, dot(vec3(nx, ny, nz), H));
    lobe *= lobe;
    // a soft dot at a hashed spot in the cell, so the facets read as points of light
    vec2 spot = vec2(hash21(c * 1.3 + 2.1), hash21(c.yx * 1.7 - 4.4)) * 0.5 + 0.25;
    vec2 d = f - spot;
    float dotShape = exp(-dot(d, d) * 34.0);
    float ph = hash21(vec2(c.x * 1.7 + 11.1, c.y * 2.3 - 5.7)) * 6.2831853;
    float tw = 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * uSpeed * (0.6 + hash21(c.yx)) + ph));
    float sparkle = lobe * dotShape * tw;
    // the same lobe from far away: a faint road under the sparkles, brighter toward the horizon (a floor reflects more at a grazing angle: StageMaths.glintFresnel) and
    // broken into slow patches by a low noise that drifts with the clock (a blown-clean sheet of ice, then a drift of snow over it)
    float road = smoothstep(cos(2.4 * uRough), 1.0, H.y);
    road *= road;
    float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 4.0);
    vec2 q = P.xz * 0.16 + vec2(uTime * 0.05, uTime * 0.021);
    vec2 qi = floor(q);
    vec2 qf = fract(q);
    vec2 qu = qf * qf * (3.0 - 2.0 * qf);
    float blow = mix(mix(hash21(qi), hash21(qi + vec2(1.0, 0.0)), qu.x), mix(hash21(qi + vec2(0.0, 1.0)), hash21(qi + vec2(1.0, 1.0)), qu.x), qu.y);
    road *= (0.2 + 0.8 * fres) * (0.55 + 0.9 * blow);
    float dist = length(cameraPosition - P);
    float fade = 1.0 - smoothstep(uRadius * 0.55, uRadius, length(P.xz - uCenter));
    fade *= 1.0 - smoothstep(26.0, 48.0, dist);
    // the sparkles are the moon's own cold white; the broad sheen under them is a saturated blue, so on a deep blue floor it reads as luminous ice and not as a grey veil
    vec3 col = (uColor * (sparkle * uGain) + uSheenColor * (road * uSheen)) * (fade * uAmount);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export interface GlintUniforms {
  [uniform: string]: { value: unknown };
  uMoon: { value: Vector3 };
  uColor: { value: Color };
  uSheenColor: { value: Color };
  uTime: { value: number };
  uGain: { value: number };
  uCell: { value: number };
  uRough: { value: number };
  uWidth: { value: number };
  uSpeed: { value: number };
  uSheen: { value: number };
  uAmount: { value: number };
  uCenter: { value: Vector2 };
  uRadius: { value: number };
}

export function glintMaterial(u: GlintUniforms): ShaderMaterialParameters {
  return {
    uniforms: u,
    vertexShader: GLINT_VERT,
    fragmentShader: GLINT_FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    fog: false,
    blending: AdditiveBlending,
  };
}
