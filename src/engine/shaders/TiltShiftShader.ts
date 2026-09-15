import { Vector2 } from 'three';

/**
 * Screen-space tilt-shift depth of field.
 *
 * Blur strength is driven by the distance of a fragment from a horizontal
 * focus band (in normalised screen Y), which is exactly the HD-2D "miniature
 * diorama" look: the far ground at the top of the frame and the very bottom
 * edge go soft while the actors in the band stay crisp.
 *
 * Two-pass: run this once with `direction = (1, 0)` and again with
 * `direction = (0, 1)`. Nine taps per pass with Gaussian-ish weights.
 */
export const TiltShiftShader = {
  name: 'TiltShiftShader',

  uniforms: {
    tDiffuse: { value: null as unknown },
    /** 1 / (width, height) in device pixels. */
    resolution: { value: new Vector2(1 / 1600, 1 / 900) },
    /** (1,0) for the horizontal pass, (0,1) for the vertical pass. */
    direction: { value: new Vector2(1, 0) },
    /** Centre of the sharp band, 0 = bottom of screen, 1 = top. */
    focus: { value: 0.42 },
    /** Half-height of the fully sharp band, in screen units. */
    bandWidth: { value: 0.16 },
    /** Maximum blur radius in pixels at the far edge of the frame. */
    maxBlur: { value: 3.2 },
    /** Shapes the falloff from the band edge (1 = linear, 2 = quadratic). */
    falloff: { value: 1.6 },
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
    uniform vec2 resolution;
    uniform vec2 direction;
    uniform float focus;
    uniform float bandWidth;
    uniform float maxBlur;
    uniform float falloff;

    varying vec2 vUv;

    void main() {
      // Distance from the sharp band, normalised to 0..1 over the rest of the frame.
      float d = abs(vUv.y - focus);
      float t = clamp((d - bandWidth) / max(1.0 - bandWidth, 0.0001), 0.0, 1.0);
      float radius = maxBlur * pow(t, falloff);

      vec4 base = texture2D(tDiffuse, vUv);
      if (radius < 0.05) {
        gl_FragColor = base;
        return;
      }

      vec2 stepUv = direction * resolution * radius;

      // 9 taps, symmetric binomial-ish weights (sum = 1.0).
      vec4 sum = base * 0.2270270270;
      sum += texture2D(tDiffuse, vUv + stepUv * 1.0) * 0.1945945946;
      sum += texture2D(tDiffuse, vUv - stepUv * 1.0) * 0.1945945946;
      sum += texture2D(tDiffuse, vUv + stepUv * 2.0) * 0.1216216216;
      sum += texture2D(tDiffuse, vUv - stepUv * 2.0) * 0.1216216216;
      sum += texture2D(tDiffuse, vUv + stepUv * 3.0) * 0.0540540541;
      sum += texture2D(tDiffuse, vUv - stepUv * 3.0) * 0.0540540541;
      sum += texture2D(tDiffuse, vUv + stepUv * 4.0) * 0.0162162162;
      sum += texture2D(tDiffuse, vUv - stepUv * 4.0) * 0.0162162162;

      gl_FragColor = sum;
    }
  `,
};
