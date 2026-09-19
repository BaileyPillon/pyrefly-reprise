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
 *   `brightness` trim so a figure can be sunk into a dark diorama, both
 *   floored so they wash the painting rather than erase it;
 * - a `flash` for hit and cast feedback that is genuinely additive: alpha- and
 *   reflectance-weighted, and clamped to display white, so the brightest hit
 *   in the game still leaves the painting readable underneath it;
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
  // 0 = the painting as painted, 1 = fully grey. The quiet dim that marks a
  // figure as "not the target you are choosing" (option B, approved
  // 2026-09-19) drops brightness AND colour together: brightness alone reads
  // as a lighting change, and the eye still picks the saturated fiend out of a
  // dark frame. Applied last, after the flash and before the dissolve, so a
  // hit landing on a dimmed figure still reads.
  uniform float desaturate;
  // UV height of the contact ramp. Set per plane from the pose's world height
  // (see contactBandFor) so the darkening is a fixed distance off the ground
  // instead of a fixed fraction of the image -- a landscape KO plane given the
  // standing figure's 10% band reads as a hard horizontal seam.
  uniform float contactBand;
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

    // A tint MULTIPLIES the painting -- it is a wash (stand-in party members,
    // faction colours), never a replacement. The floor is what guarantees
    // that: a fully saturated tint such as 0x00ff00 would otherwise zero two
    // channels and leave a flat green silhouette, which is the exact failure
    // the flash below is written to avoid. Every tint the game actually ships
    // is a pastel well above this floor, so it changes nothing on screen.
    const float TINT_FLOOR = 0.18;
    vec3 c = texel4.rgb * max(tint, vec3(TINT_FLOOR)) * brightness;

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
      float up = 1.0 - smoothstep(0.0, max(0.08, contactBand * 4.2), vUv.y);
      c += bounceColor * bounceStrength * up * 0.55;
    }

    // --- contact darkening at the feet -------------------------------------
    float contact = mix(1.0 - groundShade, 1.0, smoothstep(0.0, max(0.01, contactBand), vUv.y));
    c *= contact;

    // --- flash --------------------------------------------------------------
    // A flash is light landing *on* the painting. It is added, never mixed in.
    //
    // mix(c, flashColor, amount) replaces the texture, so at a high amount
    // the figure becomes a flat colour-shaped hole: a pure-white Rikku on a
    // cast, a flat green Braska's Final Aeon while a heal number is up. The
    // painting was there the whole time, buried under a full-strength lerp.
    //
    // Three things keep the additive version honest:
    //
    // - **alpha-weighted.** A generated PNG whose matte was only partly cut
    //   leaves a wash of near-transparent pixels across the plane; a flat
    //   flash lights those up and the figure hits inside a glowing rectangle.
    //   Ramping in over the alpha edge keeps the flash on the silhouette.
    // - **reflectance-weighted.** The lift scales with what the painting
    //   already shows, so light areas catch the light and dark ones stay dark.
    //   That difference *is* the internal detail a mix destroys. FLASH_FLOOR
    //   is the share a near-black texel still receives, so a dark figure
    //   (Braska's Final Aeon is nearly black armour) still visibly reacts.
    // - **clamped.** min() against FLASH_CEIL caps the result at display white
    //   -- the renderer uses NoToneMapping, so anything above 1.0 is just
    //   clipping -- and max(c, ...) guarantees a flash can only ever
    //   brighten a texel, never darken one that was already brighter.
    const float FLASH_FLOOR = 0.34;
    const float FLASH_GAIN = 0.85;
    const float FLASH_CEIL = 1.0;
    float flashMask = clamp(flashAmount, 0.0, 1.0) * smoothstep(alphaCut, alphaCut + 0.38, a);
    if (flashMask > 0.0) {
      vec3 reflectance = mix(vec3(FLASH_FLOOR), clamp(c, 0.0, 1.0), 1.0 - FLASH_FLOOR);
      vec3 lift = flashColor * (flashMask * FLASH_GAIN) * reflectance;
      c = min(c + lift, max(c, vec3(FLASH_CEIL)));
    }

    // --- the quiet dim ------------------------------------------------------
    if (desaturate > 0.0) {
      // Rec. 709 luma, so a red fiend and a green one lose the same amount of
      // apparent brightness on the way to grey.
      float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(c, vec3(luma), clamp(desaturate, 0.0, 1.0));
    }

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
