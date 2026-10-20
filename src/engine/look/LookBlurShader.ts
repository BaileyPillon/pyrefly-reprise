import { Vector2 } from 'three';

/**
 * Demo looks: the mask-aware tilt-shift (HD-2D, and a trace of it in the cinematic look). Two passes (`direction` (1,0) then (0,1)) with a variable radius from a
 * horizontal sharp band, like the stock tilt-shift, but:
 *  - a painted figure (the frame's alpha, 0 where a painting covers it: `BloomMask.ts`) is never blurred, so the fighters stay crisp whatever the band;
 *  - the blur gathers only from backdrop pixels, so a figure's colour never smears into the background (no ghost halo round a silhouette);
 *  - the far side (top) and the near side (bottom) have their own strengths, and bright points in the blur grow into soft bokeh discs (`bokeh`);
 *  - the taps are jittered per pixel (interleaved gradient noise) so a wide blur from few taps is a fine grain, not bands.
 * `BLUR_TAPS` is a compile-time constant (the quality tier). The alpha is passed through untouched, so the next passes still see the mask. Both games.
 */
export const LookBlurShader = {
  name: 'LookBlurShader',

  uniforms: {
    tDiffuse: { value: null as unknown },
    /** 1 / (width, height) in device pixels. */
    resolution: { value: new Vector2(1 / 1600, 1 / 900) },
    direction: { value: new Vector2(1, 0) },
    /** Centre of the sharp band (0 bottom .. 1 top), its half height, and the fall-off exponent. */
    focus: { value: 0.38 },
    band: { value: 0.2 },
    falloff: { value: 1.5 },
    /** Blur radius in device pixels at the top edge (`farPx`) and the bottom edge (`nearPx`). */
    farPx: { value: 10 },
    nearPx: { value: 7 },
    /** How much a highlight's weight grows in the blur (0 = a plain blur). */
    bokeh: { value: 1.5 },
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
    // level 0 always: the chain's targets have no mipmaps, and a loop or a branch must not ask the GPU for derivatives
    vec4 texelAt(vec2 uv) { return textureLod(tDiffuse, uv, 0.0); }
    uniform vec2 resolution;
    uniform vec2 direction;
    uniform float focus;
    uniform float band;
    uniform float falloff;
    uniform float farPx;
    uniform float nearPx;
    uniform float bokeh;
    varying vec2 vUv;

    float ign(vec2 p) {
      return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
    }

    void main() {
      vec4 base = texelAt(vUv);
      float d = vUv.y - focus;
      float span = d >= 0.0 ? max(1.0 - focus - band, 1e-4) : max(focus - band, 1e-4);
      float t = clamp((abs(d) - band) / span, 0.0, 1.0);
      float radius = (d >= 0.0 ? farPx : nearPx) * pow(t, falloff);
      float fig = 1.0 - clamp(base.a, 0.0, 1.0);
      // a figure keeps its own pixels: its blur share fades out as the pixel becomes mostly figure
      float keep = smoothstep(0.15, 0.85, fig);
      if (radius < 0.4 || keep >= 0.999) {
        gl_FragColor = base;
        return;
      }
      vec2 stepUv = direction * resolution * radius;
      float jitter = (ign(gl_FragCoord.xy) - 0.5) * (2.0 / float(BLUR_TAPS - 1));
      vec3 sum = vec3(0.0);
      float wsum = 0.0;
      for (int i = 0; i < BLUR_TAPS; i++) {
        float o = float(i) / float(BLUR_TAPS - 1) * 2.0 - 1.0 + jitter;
        vec4 s = texelAt(vUv + stepUv * o);
        float w = exp(-(o * o) * 2.0);
        w *= smoothstep(0.5, 1.0, s.a); // backdrop pixels only: a figure never smears into the background
        float l = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
        w *= 1.0 + bokeh * smoothstep(0.75, 1.6, l);
        sum += s.rgb * w;
        wsum += w;
      }
      vec3 blurred = wsum > 1e-4 ? sum / wsum : base.rgb;
      gl_FragColor = vec4(mix(blurred, base.rgb, keep), base.a);
    }
  `,
};
