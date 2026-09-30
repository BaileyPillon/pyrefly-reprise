/**
 * Option C's one post pass (eye-candy options round, 2026-09-29), after the grade, enabled only
 * on the frames that need it, so it costs nothing at rest:
 *
 * - C1, the impact frame: two frames of ink and paper. Luma over a threshold goes to paper,
 *   under it to ink, with a gold (FFX) or pink (FFX-2) edge on the luma gradient and ink speed
 *   lines radiating from the blow. Frame 2 mixes halfway back. Under REDUCE FLASHES it is one
 *   frame at 35 % toward ivory, no inversion.
 * - C5, heat haze over a fire column (desktop only): a small noise warp inside an ellipse.
 * - C5, the lightning exposure lift: one frame, capped.
 *
 * It draws on the WebGL canvas only. The HUD, the numerals and the cut-ins are DOM above it, so
 * nothing here can blur or recolour them. Game case: both, colours per game.
 */

import { Vector2, Vector3 } from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export const SpectacleShader = {
  name: 'SpectacleShader',
  uniforms: {
    tDiffuse: { value: null as unknown },
    uImpact: { value: 0 },
    uSoft: { value: 0 },
    uInk: { value: new Vector3(0.04, 0.06, 0.13) },
    uPaper: { value: new Vector3(1, 0.96, 0.88) },
    uEdge: { value: new Vector3(0.89, 0.73, 0.29) },
    uTexel: { value: new Vector2(1 / 1600, 1 / 900) },
    uCenter: { value: new Vector2(0.5, 0.5) },
    uAspect: { value: 16 / 9 },
    uHaze: { value: 0 },
    uHazeCenter: { value: new Vector2(0.5, 0.5) },
    uHazeRadius: { value: new Vector2(0.1, 0.2) },
    uTime: { value: 0 },
    uLift: { value: 0 },
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
    uniform float uImpact;
    uniform float uSoft;
    uniform vec3 uInk;
    uniform vec3 uPaper;
    uniform vec3 uEdge;
    uniform vec2 uTexel;
    uniform vec2 uCenter;
    uniform float uAspect;
    uniform float uHaze;
    uniform vec2 uHazeCenter;
    uniform vec2 uHazeRadius;
    uniform float uTime;
    uniform float uLift;
    varying vec2 vUv;

    float h11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
    float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

    void main() {
      vec2 uv = vUv;
      if (uHaze > 0.0) {
        vec2 d = (uv - uHazeCenter) / uHazeRadius;
        float m = 1.0 - smoothstep(0.55, 1.0, length(d));
        float wob = sin(uv.y * 120.0 - uTime * 11.0) * 0.5 + sin(uv.y * 57.0 + uv.x * 40.0 - uTime * 7.0) * 0.5;
        uv.x += wob * uHaze * m * 0.0035;
        uv.y += cos(uv.x * 90.0 + uTime * 9.0) * uHaze * m * 0.0018;
      }
      vec3 c = texture2D(tDiffuse, uv).rgb;
      c += uLift * (0.35 + 0.65 * c);
      if (uImpact > 0.0) {
        if (uSoft > 0.5) {
          c = mix(c, uPaper, 0.35 * uImpact);
        } else {
          float l = lum(c);
          float gx = lum(texture2D(tDiffuse, uv + vec2(uTexel.x, 0.0)).rgb) - lum(texture2D(tDiffuse, uv - vec2(uTexel.x, 0.0)).rgb);
          float gy = lum(texture2D(tDiffuse, uv + vec2(0.0, uTexel.y)).rgb) - lum(texture2D(tDiffuse, uv - vec2(0.0, uTexel.y)).rgb);
          float edge = smoothstep(0.06, 0.2, length(vec2(gx, gy)));
          vec3 two = mix(uInk, uPaper, smoothstep(0.30, 0.36, l));
          two = mix(two, uEdge, edge * 0.9);
          vec2 p = (uv - uCenter) * vec2(uAspect, 1.0);
          float ang = atan(p.y, p.x);
          float ray = step(0.72, h11(floor((ang + 3.1416) * 38.0)));
          float r = length(p);
          float lines = ray * smoothstep(0.22, 0.5, r + h11(floor((ang + 3.1416) * 38.0) + 7.0) * 0.2);
          two = mix(two, uInk, lines * 0.85);
          c = mix(c, two, uImpact);
        }
      }
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }
  `,
};

export class SpectaclePass extends ShaderPass {
  constructor() {
    super(SpectacleShader);
    this.enabled = false;
  }

  u(name: keyof typeof SpectacleShader.uniforms): { value: unknown } {
    return this.uniforms[name]!;
  }
}
