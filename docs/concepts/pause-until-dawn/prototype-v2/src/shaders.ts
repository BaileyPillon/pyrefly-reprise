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

uniform vec4 uHeadBox; // x, y, w, h, normalised UV space (canvas-relative, not this quad's own local UV)
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
// This quad's own box in CANVAS-normalised UV space (x, y, w, h), so
// aUV (always 0..1 across just THIS quad/crop, never the whole canvas) can be
// converted to a canvas-relative UV before it's compared against uHeadBox —
// see the FIX note below. Identity (0,0,1,1) for the stand-in's full-canvas
// grid mesh, where aUV already IS the canvas UV.
uniform vec4 uUVBox;

out vec2 vUV;
out float vMask;
out vec2 vCanvasUV;

float headMask(vec2 uv) {
  vec2 c = uHeadBox.xy + uHeadBox.zw * 0.5;
  vec2 h = uHeadBox.zw * 0.5;
  vec2 d = abs(uv - c) / max(h, vec2(1e-4));
  float mx = 1.0 - smoothstep(0.7, 1.05, d.x);
  float my = 1.0 - smoothstep(0.7, 1.05, d.y);
  return clamp(mx * my, 0.0, 1.0);
}

void main() {
  // FIX (living-portrait-v2 fix pass): every placed sub-quad (an authored
  // key's own crop, a frontal sub-layer, the body) is a SMALL quad whose own
  // aUV always runs 0..1 across just that quad -- never across the whole
  // canvas. uHeadBox/headMask are defined in CANVAS-normalised UV space
  // (rig.json's own headBox). Feeding the quad's own local aUV straight into
  // headMask (as this shader did before this pass) treats "the middle of
  // whatever's been cropped" as "the middle of the actual head box" for
  // every quad, independently -- a rectangular vignette centred on EACH
  // quad's own crop, at full opacity, present even with no cross-dissolve
  // happening at all (measured this pass: identical at yaw 0 with a single
  // fully-opaque key). uUVBox is this quad's real box in canvas UV space
  // (identity for the stand-in's one full-canvas mesh, where aUV already IS
  // canvas UV); reconstructing the true canvas-relative UV from it before
  // masking removes the false vignette. Texture sampling (vUV) is untouched
  // -- it must stay local, or the crop would sample the wrong pixels of its
  // own (smaller) texture.
  vec2 canvasUV = uUVBox.xy + aUV * uUVBox.zw;
  float mask = headMask(canvasUV);
  vec2 c = uHeadBox.xy + uHeadBox.zw * 0.5;
  vec2 fromCenter = canvasUV - c;
  // Horizontal squash (a real head turning presents a narrower silhouette)
  // plus a small rigid shift, both gated by the head mask so nothing outside
  // it ever moves.
  float dx = uYawNorm * mask * (uWarpScale * fromCenter.x + uWarpScale * 0.5);
  float dy = uPitchNorm * mask * uWarpScale * 0.6 * fromCenter.y;
  vec2 displaced = aPos * uScale + uCenter + vec2(dx, -dy) * 2.0 * uScale + uOffset;
  gl_Position = vec4(displaced, 0.0, 1.0);
  vUV = aUV;
  vMask = mask;
  vCanvasUV = canvasUV;
}
`;

/** Relights the masked head as it turns, plus a fixed shadow-side falloff. */
export const BODY_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUV;
in float vMask;
in vec2 vCanvasUV;
uniform sampler2D uTex;
uniform float uRelightGain;
uniform float uYawNorm;
uniform float uOpacity; // cross-dissolve weight between two authored keys; 1.0 for the stand-in
out vec4 fragColor;

void main() {
  vec4 c = texture(uTex, vUV);
  // FIX (see the vertex shader's own note on uUVBox/canvasUV): the shadow
  // side must fall off across the CANVAS (left half lit, right half not, or
  // vice versa by yaw sign), not across each small quad's own local UV --
  // using vUV.x here made every placed quad darken/lighten across its own
  // width independently, another piece of the same false-vignette artifact.
  float shadowSide = smoothstep(-1.0, 1.0, -uYawNorm * (vCanvasUV.x - 0.5) * 2.0);
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
  return clamp(1.0 - smoothstep(0.8, 1.8, d), 0.0, 1.0); // 1 = sharp face, 0 = soft background
}

void main() {
  float focus = focusWeight(vUV);
  vec4 sharp = texture(uScene, vUV);
  vec4 blurred = vec4(0.0);
  float r = mix(1.0, 0.0, focus); // v3.2: 1 px at most (v3.1: 2.2 px softened the approved hair)
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

  // Asymmetric grade toward the bottom-right corner (vUV.y = 0 is the bottom
  // of the framebuffer). v3.2: v3.1's grade reached 55 percent and covered the
  // figure (mean figure luminance 140.5 -> 100.9, the approved painting read
  // desaturated); this one leaves the figure's core untouched and darkens only
  // the far corner, by at most 22 percent.
  vec2 d = (vUV - vec2(0.35, 0.7)) * vec2(1.0, 0.8);
  float vignette = 0.22 * smoothstep(0.55, 1.25, length(d));
  color.rgb *= (1.0 - vignette);

  fragColor = vec4(color.rgb, 1.0);
}
`;
