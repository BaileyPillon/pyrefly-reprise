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

    varying vec2 vUv;

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

      // saturation around Rec.709 luma
      float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(luma), c, saturation);

      // vignette
      vec2 d = vUv - 0.5;
      d.x *= 1.06;
      float r = length(d) * 1.4142;
      float v = smoothstep(vignetteRadius, 1.05, r);
      c *= 1.0 - v * vignette;

      // dither
      c += bayer(gl_FragCoord.xy) * dither;

      gl_FragColor = vec4(clamp(c, 0.0, 1.0), texel.a);
    }
  `,
};
