import { Vector3 } from 'three';

/**
 * Final composite pass: vignette + lift / gamma / gain colour grade,
 * plus saturation control and ordered dither to kill banding in the big dark
 * gradients this game lives in.
 */
export const GradeShader = {
  name: 'GradeShader',

  uniforms: {
    tDiffuse: { value: null as unknown },
    /** Shadow tint / offset. Neutral = (0,0,0). */
    lift: { value: new Vector3(0.004, 0.008, 0.02) },
    /** Midtone curve, per channel. Neutral = (1,1,1). */
    gamma: { value: new Vector3(1.0, 1.0, 1.02) },
    /** Highlight multiplier. Neutral = (1,1,1). */
    gain: { value: new Vector3(1.04, 1.01, 0.99) },
    /** 1 = untouched, >1 richer. */
    saturation: { value: 1.08 },
    /** 0 = no vignette, 1 = heavy. */
    vignette: { value: 0.46 },
    /** Larger = the clear centre reaches further out. */
    vignetteRadius: { value: 0.78 },
    /** Ordered-dither amount in 0..1 units (1/255 ~ 0.0039). */
    dither: { value: 0.0035 },
    /** Animated film grain opacity. 0 = off, ~0.03 is a gentle painted grain. */
    grain: { value: 0.03 },
    /** Seconds; drives the grain's animation. Written by `Renderer.render`. */
    time: { value: 0 },
    /** Colour pushed into the shadows (split-toning). */
    shadowTint: { value: new Vector3(0.4, 0.5, 0.85) },
    /** How much of `shadowTint` reaches the shadows, 0..1. */
    shadowTintAmount: { value: 0.12 },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec3 lift;
    uniform vec3 gamma;
    uniform vec3 gain;
    uniform float saturation;
    uniform float vignette;
    uniform float vignetteRadius;
    uniform float dither;
    uniform float grain;
    uniform float time;
    uniform vec3 shadowTint;
    uniform float shadowTintAmount;

    varying vec2 vUv;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    // 4x4 ordered dither with no dynamic array indexing (GLSL ES 1.00 safe).
    float bayer2(vec2 a) {
      a = floor(a);
      return fract(a.x * 0.5 + a.y * a.y * 0.75);
    }
    // Returns -0.5 .. 0.5
    float bayer(vec2 p) {
      return (bayer2(0.5 * p) * 0.25 + bayer2(p)) - 0.5;
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 c = max(texel.rgb, 0.0);

      // lift / gamma / gain
      c = c * gain + lift;
      c = pow(max(c, 0.0), vec3(1.0) / max(gamma, vec3(0.001)));

      // split-tone: push the shadows toward a single hue before saturation, so
      // the darks stay coloured instead of collapsing to neutral black
      float shadowMask = 1.0 - smoothstep(0.0, 0.45, dot(c, vec3(0.2126, 0.7152, 0.0722)));
      c = mix(c, c * shadowTint * 2.0, shadowMask * shadowTintAmount);

      // saturation around Rec.709 luma
      float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(luma), c, saturation);

      // film grain: fine, animated, and strongest in the mid-tones so it reads
      // as paper/film tooth rather than as noise in the blacks
      if (grain > 0.0) {
        float g = hash21(gl_FragCoord.xy + fract(time) * 137.13) - 0.5;
        float mids = 1.0 - abs(luma * 2.0 - 1.0);
        c += g * grain * (0.35 + 0.65 * mids);
      }

      // vignette
      vec2 d = vUv - 0.5;
      d.x *= 1.06;
      float r = length(d) * 1.4142;
      float v = smoothstep(vignetteRadius, 1.05, r);
      c *= 1.0 - v * vignette;

      // dither
      c += bayer(gl_FragCoord.xy) * dither;

      // Opaque: the frame alpha carries the bloom mask (BloomMask.ts) and must not reach the canvas.
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }
  `,
};
