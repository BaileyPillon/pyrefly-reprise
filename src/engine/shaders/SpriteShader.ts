/**
 * RETIRED — the pixel-art path.
 *
 * The game renders painted 2.5D (`src/engine/PaintedActor.ts`, backdrops and
 * character PNGs generated through `docs/ART-PIPELINE.md`). Nothing here is
 * reachable from `src/main.ts`; `node tools/orphans.mjs` lists this file as an
 * orphan by design. Kept for reference only — do not extend it, and do not
 * build new work against it.
 */
/**
 * Unlit billboard shader for pixel-art actors.
 *
 * Deliberately not a lit material: HD-2D sprites are authored with their own
 * light baked in, so the scene rig must not wash them out. What it does give
 * us is a hard alpha cutout (keeps the pixel silhouette crisp), a uniform tint
 * used by `SpriteActor.flash`, a horizontal flip for facing, and per-actor
 * brightness so a sprite can be sunk into a dark diorama.
 */
export const spriteVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const spriteFragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform float opacity;
  uniform float brightness;
  uniform vec3 tintColor;
  uniform float tintAmount;
  uniform float flipX;
  varying vec2 vUv;

  void main() {
    vec2 uv = vec2(mix(vUv.x, 1.0 - vUv.x, flipX), vUv.y);
    vec4 texel = texture2D(map, uv);
    if (texel.a < 0.02) discard;
    vec3 c = texel.rgb * brightness;
    c = mix(c, tintColor, tintAmount);
    gl_FragColor = vec4(c, texel.a * opacity);
  }
`;
