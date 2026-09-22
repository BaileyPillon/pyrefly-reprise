/**
 * GLSL ES 3.00 sources. Kept as plain strings (no `.glsl` loader) so this
 * stays a zero-build-step prototype, same as v1.
 */

/**
 * The body/head mesh. A grid of vertices covering the whole plate; a
 * feathered mask (`uHeadBox`) confines any displacement to the head so the
 * shoulders, collar and background stay pinned to the pixel — the reference
 * spec's headline finding (section 8) and v1's biggest documented gap
 * (`pause-living-portraits-motion-spec.md` section 13, item 2).
 */
export const BODY_VERT = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
layout(location = 1) in vec2 aUV;

uniform vec4 uHeadBox; // x, y, w, h, normalised UV space
uniform float uYawNorm; // -1..1
uniform float uPitchNorm; // -1..1
uniform float uWarpScale;
// Rigid NDC nudge, used to land two different keys' landmark anchors (e.g.
// the chin) on the same point while they cross-dissolve — see renderer.ts,
// drawHeadProgramCommon. Zero for the stand-in's single-texture procedural warp.
uniform vec2 uOffset;
// Places a smaller-than-canvas quad (an authored key's own crop) at its own
// box: displaced = aPos * uScale + uCenter (+ the warp/offset above). The
// stand-in's full-canvas grid mesh uses the identity (scale 1, center 0).
uniform vec2 uScale;
uniform vec2 uCenter;

out vec2 vUV;
out float vMask;

float headMask(vec2 uv) {
  vec2 c = uHeadBox.xy + uHeadBox.zw * 0.5;
  vec2 h = uHeadBox.zw * 0.5;
  vec2 d = abs(uv - c) / max(h, vec2(1e-4));
  float mx = 1.0 - smoothstep(0.7, 1.05, d.x);
  float my = 1.0 - smoothstep(0.7, 1.05, d.y);
  return clamp(mx * my, 0.0, 1.0);
}

void main() {
  float mask = headMask(aUV);
  vec2 c = uHeadBox.xy + uHeadBox.zw * 0.5;
  vec2 fromCenter = aUV - c;
  // Horizontal squash (a real head turning presents a narrower silhouette)
  // plus a small rigid shift, both gated by the head mask so nothing outside
  // it ever moves.
  float dx = uYawNorm * mask * (uWarpScale * fromCenter.x + uWarpScale * 0.5);
  float dy = uPitchNorm * mask * uWarpScale * 0.6 * fromCenter.y;
  vec2 displaced = aPos * uScale + uCenter + vec2(dx, -dy) * 2.0 * uScale + uOffset;
  gl_Position = vec4(displaced, 0.0, 1.0);
  vUV = aUV;
  vMask = mask;
}
`;

/** Relights the masked head as it turns, plus a fixed shadow-side falloff. */
export const BODY_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUV;
in float vMask;
uniform sampler2D uTex;
uniform float uRelightGain;
uniform float uYawNorm;
uniform float uOpacity; // cross-dissolve weight between two authored keys; 1.0 for the stand-in
out vec4 fragColor;

void main() {
  vec4 c = texture(uTex, vUV);
  float shadowSide = smoothstep(-1.0, 1.0, -uYawNorm * (vUV.x - 0.5) * 2.0);
  float gain = mix(1.0, uRelightGain, vMask);
  float shade = mix(1.0, 0.94, vMask * shadowSide * 0.5);
  c.rgb *= gain * shade;
  fragColor = vec4(c.rgb, c.a * uOpacity);
}
`;

/** A single overlay quad (an eye or mouth patch) with a feathered edge and its own opacity. */
export const PATCH_VERT = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos; // -1..1 quad corners
layout(location = 1) in vec2 aUV; // 0..1 within the patch texture

uniform vec2 uCenter; // clip space
uniform vec2 uHalfSize; // clip space
uniform vec2 uOffset; // clip space, follows the head warp so the patch tracks the turn

out vec2 vUV;
out vec2 vLocal;

void main() {
  vLocal = aUV * 2.0 - 1.0;
  vUV = aUV;
  gl_Position = vec4(uCenter + uOffset + aPos * uHalfSize, 0.0, 1.0);
}
`;

export const PATCH_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUV;
in vec2 vLocal;
uniform sampler2D uTex;
uniform float uOpacity;
uniform float uFeather; // 0..1 fraction of the half-size
out vec4 fragColor;

void main() {
  vec4 c = texture(uTex, vUV);
  float edge = 1.0 - max(abs(vLocal.x), abs(vLocal.y));
  float alpha = smoothstep(0.0, max(uFeather, 1e-3), edge);
  fragColor = vec4(c.rgb, c.a * alpha * uOpacity);
}
`;

export const FULLSCREEN_VERT = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUV;
void main() {
  vUV = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

/**
 * Post: focus falloff (sharp face, softer hair/background), temporal grain
 * weighted to the shadows, and the asymmetric grade toward the bottom-right
 * (section 9 / 11). `uReduced` drops grain and freezes nothing here — motion
 * freezing is the caller's job (`dynamics.ts`/`input.ts`), this shader only
 * mutes the image-noise layer reduced motion says to drop.
 */
export const POST_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uScene;
uniform vec2 uTexel;
uniform vec4 uHeadBox;
uniform float uTime;
uniform float uGrainAmount; // 0..~0.005
uniform float uReduced; // 0 or 1
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float focusWeight(vec2 uv) {
  vec2 c = uHeadBox.xy + uHeadBox.zw * 0.5;
  vec2 h = uHeadBox.zw * 0.5;
  float d = length((uv - c) / max(h, vec2(1e-4)));
  return clamp(1.0 - smoothstep(0.55, 1.6, d), 0.0, 1.0); // 1 = sharp face, 0 = soft background
}

void main() {
  float focus = focusWeight(vUV);
  vec4 sharp = texture(uScene, vUV);
  vec4 blurred = vec4(0.0);
  float r = mix(2.2, 0.0, focus);
  if (r > 0.01) {
    blurred += texture(uScene, vUV + uTexel * vec2(r, 0.0));
    blurred += texture(uScene, vUV - uTexel * vec2(r, 0.0));
    blurred += texture(uScene, vUV + uTexel * vec2(0.0, r));
    blurred += texture(uScene, vUV - uTexel * vec2(0.0, r));
    blurred *= 0.25;
  } else {
    blurred = sharp;
  }
  vec4 color = mix(blurred, sharp, focus);

  // Grain: temporal (uTime folded into the hash), weighted to the shadows.
  float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  float shadowWeight = 1.0 - smoothstep(0.0, 0.6, luma);
  float n = (hash(vUV * vec2(1920.0, 1080.0) + uTime) - 0.5) * 2.0;
  color.rgb += n * uGrainAmount * (0.3 + 0.7 * shadowWeight) * (1.0 - uReduced);

  // Asymmetric grade toward the bottom-right.
  vec2 d = vUV - vec2(0.42, 0.38);
  float radial = length(d);
  float towardCorner = max(0.0, vUV.x - 0.5) * 0.6 + max(0.0, vUV.y - 0.5) * 0.6;
  float vignette = clamp(radial * 0.55 + towardCorner * 0.6, 0.0, 0.55);
  color.rgb *= (1.0 - vignette);

  fragColor = vec4(color.rgb, 1.0);
}
`;
