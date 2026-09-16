/**
 * Unlit shader for painted character planes.
 *
 * The paintings carry their own lighting, so the scene rig must not relight
 * them. What this shader adds on top is the handful of things a 2.5D figure
 * needs to belong to a 3D scene:
 *
 * - a hard-ish alpha cutout (`alphaCut`, ~0.02) that keeps the painted edge
 *   soft but throws away the transparent bulk of the PNG;
 * - a multiply `tint` (stand-in party members, faction colours) and a
 *   `brightness` trim so a figure can be sunk into a dark diorama;
 * - an additive `flash` for hit feedback;
 * - a **rim light** derived from the alpha silhouette: sampling alpha a few
 *   texels toward `rimDir` and differencing gives a band that hugs the figure's
 *   outline on one side only, which is what actually welds a cut-out into a lit
 *   scene;
 * - `groundShade`, a short darkening ramp at the bottom of the plane so the
 *   feet read as contacting the ground rather than floating;
 * - a noise-threshold `dissolve` with an emissive edge, for KO / pyrefly death.
 */
export const paintedVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const paintedFragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform sampler2D noiseMap;
  uniform float opacity;
  uniform float brightness;
  uniform vec3 tint;
  uniform vec3 flashColor;
  uniform float flashAmount;
  uniform vec3 rimColor;
  uniform float rimStrength;
  uniform vec2 rimDir;
  uniform float rimWidth;
  uniform vec3 bounceColor;
  uniform float bounceStrength;
  uniform float dissolve;
  uniform vec3 dissolveColor;
  uniform float groundShade;
  uniform vec2 texel;
  uniform float alphaCut;
  uniform float edgeFade;

  varying vec2 vUv;

  void main() {
    // Mirroring is done with a negative plane scale.x, not in UV space, so the
    // texture's own orientation (and the rim sampling below) stays honest.
    vec2 uv = vUv;
    vec4 texel4 = texture2D(map, uv);
    float a = texel4.a;

    // --- edge feather --------------------------------------------------------
    // Generated character art often bleeds a full-bleed aura or glow all the
    // way to the PNG's border, so the "cut-out" ends on a hard rectangle that
    // is invisible on a dark frame and glaring on a bright one. Feathering the
    // outer band of the plane turns that edge into atmosphere. Zero = off, and
    // properly cropped art never needs it.
    if (edgeFade > 0.0) {
      vec2 d = abs(vUv - 0.5) * 2.0;
      float box = max(d.x, d.y);
      a *= 1.0 - smoothstep(1.0 - edgeFade, 1.0, box);
    }

    if (a < alphaCut) discard;

    vec3 c = texel4.rgb * tint * brightness;

    // --- rim light from the alpha silhouette -------------------------------
    if (rimStrength > 0.0) {
      vec2 dir = normalize(rimDir + vec2(1e-5, 0.0));
      vec2 off = dir * texel * rimWidth;
      float inward =
        texture2D(map, uv + off).a * 0.34 +
        texture2D(map, uv + off * 2.0).a * 0.34 +
        texture2D(map, uv + off * 3.2).a * 0.32;
      float edge = clamp(a - inward, 0.0, 1.0);
      edge = pow(edge, 0.75);
      c += rimColor * rimStrength * edge;
    }

    // --- bounce light from the ground --------------------------------------
    if (bounceStrength > 0.0) {
      float up = 1.0 - smoothstep(0.0, 0.42, vUv.y);
      c += bounceColor * bounceStrength * up * 0.55;
    }

    // --- contact darkening at the feet -------------------------------------
    float contact = mix(1.0 - groundShade, 1.0, smoothstep(0.0, 0.1, vUv.y));
    c *= contact;

    // --- flash --------------------------------------------------------------
    // Weighted by alpha, not applied flat. A generated PNG whose matte was
    // only partly cut leaves a wash of near-transparent pixels across the
    // whole plane; a flat flash lights those up and the figure hits inside a
    // glowing rectangle. Ramping the flash in over the alpha edge keeps the
    // hit on the silhouette.
    float flashMask = clamp(flashAmount, 0.0, 1.0) * smoothstep(alphaCut, alphaCut + 0.38, a);
    c = mix(c, flashColor, flashMask);

    // --- dissolve -----------------------------------------------------------
    if (dissolve > 0.0) {
      float n = texture2D(noiseMap, uv * vec2(1.6, 2.4)).r;
      // Bias so the figure burns away from the feet up, like pyreflies leaving.
      n = clamp(n * 0.72 + (1.0 - vUv.y) * 0.34, 0.0, 1.0);
      if (n < dissolve) discard;
      float edge = 1.0 - smoothstep(dissolve, dissolve + 0.13, n);
      c += dissolveColor * edge * 2.2;
      a *= mix(1.0, 0.82, edge);
    }

    gl_FragColor = vec4(c, a * opacity);
  }
`;
