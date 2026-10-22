import { Vector3, Vector4 } from 'three';
import { MAX_MOTES, MAX_RIPPLES, RIPPLE_K, RIPPLE_SPREAD, RIPPLE_SQUASH } from './LivingConfig.ts';

/**
 * THE LIVING CATHEDRAL, the GLSL (release 62, decision 173a; FFX-2's Bevelle underground; `LivingConfig.ts` says what it is). Four chunks spliced into the bold pass (`LookBoldShader.ts`), each a no-op while
 * `uLiv.x` (the master, 0 = off) is zero, so with the living room off the pass is the pass it was:
 *
 *  - {@link LIVING_GLSL_DECL}   the uniforms;
 *  - {@link LIVING_GLSL_FUNCS}  `lampFlick`, `ripple` (the rings' bend and glint at a pixel) and `beamMotes` (the motes and the faint shaft at a pixel);
 *  - {@link LIVING_GLSL_TOP}    right after the frame is read: where a ring is passing over the floor, the floor's pixels are read from a little to the side (the polished floor's reflections bend; a pixel
 *                               that is, or would read, a figure is left alone, so no figure ever wobbles);
 *  - {@link LIVING_GLSL_END}    after the embers: the lamps' flicker and the warm light they throw, the ring's glint, and the dust in the beam (behind the figures).
 * The maths of each is mirrored in `LivingConfig.ts` (`lampFlicker`, `rippleWave`, `moteAt`), which the unit tests pin.
 */
export const LIVING_UNIFORMS = {
  /** x the master (0 = off), y how many motes, z how many ripples may show, w the lamps' flicker depth (1 +- w). */
  uLiv: { value: new Vector4(0, 0, 0, 0) },
  /** The beam's axis in aspect-corrected frame coordinates (x times the aspect, y up): top.xy, bottom.xy. */
  uBeamA: { value: new Vector4(0.5, 1, 0.5, 0.3) },
  /** x half width at the top, y at the bottom (frame heights), z the motes' gain, w a mote's size (frame heights). */
  uBeamB: { value: new Vector4(0.05, 0.12, 1, 0.003) },
  /** rgb the beam's colour (linear), w the faint shaft's glow. */
  uBeamC: { value: new Vector4(0.2, 0.7, 1, 0.05) },
  /** Per ripple: xy the centre (frame uv), z its age in seconds (below 0: not there), w its strength. */
  uRip: { value: Array.from({ length: MAX_RIPPLES }, () => new Vector4(0, 0, -1, 0)) },
  /** x how far a ring bends the reflection (frame heights), y how fast it spreads (frame heights a second), z how fast it dies (1 / s), w the floor's top edge (frame v, up). */
  uRipP: { value: new Vector4(0.0085, 0.32, 1.5, 0.34) },
  /** The crest's glint. */
  uRipG: { value: 0 },
  /** The lamps: x the warm light's gain, y its reach (frame heights), z how much of the flicker the lamp glass takes. */
  uLamp: { value: new Vector4(0.5, 0.2, 1.5, 0) },
  uLampC: { value: new Vector3(1, 0.3, 0.05) },
};

export const LIVING_GLSL_DECL = /* glsl */ `
    uniform vec4 uLiv;
    uniform vec4 uBeamA;
    uniform vec4 uBeamB;
    uniform vec4 uBeamC;
    uniform vec4 uRip[${MAX_RIPPLES}];
    uniform vec4 uRipP;
    uniform float uRipG;
    uniform vec4 uLamp;
    uniform vec3 uLampC;
`;

export const LIVING_GLSL_FUNCS = /* glsl */ `
    // ---- the living cathedral (release 62, FFX-2): the maths is mirrored in look/living/LivingConfig.ts
    const float RIPPLE_SPREAD = ${RIPPLE_SPREAD.toFixed(3)};
    const float RIPPLE_K = ${RIPPLE_K.toFixed(1)};
    const float RIPPLE_SQUASH = ${RIPPLE_SQUASH.toFixed(2)};

    float lampFlick(float j) {
      float a = vnoise(vec2(time * 6.3 + j * 13.7, j * 3.1));
      float b = vnoise(vec2(time * 2.1 + j * 5.9, j * 7.7 + 30.0));
      return 1.0 + uLiv.w * (0.5 * a + 0.5 * b - 0.5) * 2.0;
    }

    // the rings' bend (xy, frame uv) and glint (z) at a pixel
    vec3 ripple(vec2 uv) {
      vec2 off = vec2(0.0);
      float glint = 0.0;
      for (int i = 0; i < ${MAX_RIPPLES}; i++) {
        vec4 r = uRip[i];
        if (float(i) < uLiv.z && r.z >= 0.0 && r.w > 0.001) {
          vec2 d = vec2((uv.x - r.x) * aspect, (uv.y - r.y) / RIPPLE_SQUASH);
          float rad = length(d);
          float x = rad - r.z * uRipP.y;
          float env = exp(-(x * x) / (RIPPLE_SPREAD * RIPPLE_SPREAD)) * exp(-r.z * uRipP.z) * smoothstep(0.0, 0.05, r.z) * r.w;
          float w = sin(x * RIPPLE_K) * env;
          vec2 dir = d / max(rad, 1e-4);
          off += vec2(dir.x / aspect, dir.y * RIPPLE_SQUASH) * w * uRipP.x;
          glint += max(w, 0.0);
        }
      }
      return vec3(off, glint);
    }

    // the dust in the skylight beam at a pixel: x the motes' light, y the beam's own faint shaft
    vec2 beamMotes(vec2 uv) {
      vec2 p = vec2(uv.x * aspect, uv.y);
      vec2 T = uBeamA.xy;
      vec2 ax = uBeamA.zw - T;
      float sp = dot(p - T, ax) / max(dot(ax, ax), 1e-6);
      if (sp < -0.06 || sp > 1.06) return vec2(0.0);
      vec2 perp = normalize(vec2(-ax.y, ax.x));
      float hw = mix(uBeamB.x, uBeamB.y, clamp(sp, 0.0, 1.0));
      float an = dot(p - T, perp) / max(hw, 1e-4);
      if (abs(an) > 1.3) return vec2(0.0);
      float shaft = exp(-an * an * 1.6) * smoothstep(0.0, 0.08, sp) * (1.0 - smoothstep(0.7, 1.05, sp));
      float m = 0.0;
      for (int k = 0; k < ${MAX_MOTES}; k++) {
        if (float(k) >= uLiv.y) break;
        float fk = float(k);
        float h1 = hash21(vec2(fk * 7.3 + 1.0, fk * 3.1 + 2.0));
        float h2 = hash21(vec2(fk * 5.7 + 0.3, fk * 2.9 + 4.0));
        float h3 = hash21(vec2(fk * 1.9 + 8.0, fk * 6.1 + 5.0));
        float ph = fract(time / (11.0 + 14.0 * h1) + h2);
        float a = (h3 * 2.0 - 1.0) * 0.82 + sin(time * 0.31 + h2 * 40.0) * 0.1 + sin(time * 0.13 + h1 * 17.0) * 0.06;
        float life = smoothstep(0.0, 0.12, ph) * (1.0 - smoothstep(0.78, 1.0, ph));
        float tw = 0.55 + 0.45 * sin(time * (0.7 + 1.6 * h3) + h1 * 30.0);
        float prof = exp(-a * a * 1.6);
        vec2 c = T + ax * ph + perp * a * mix(uBeamB.x, uBeamB.y, ph);
        vec2 dd = p - c;
        float sz = uBeamB.w * (0.55 + 0.9 * h2);
        float q = dot(dd, dd) / (sz * sz);
        m += (exp(-q * 2.2) + 0.18 * exp(-q / 12.0)) * tw * life * prof;
      }
      return vec2(m, shaft);
    }
`;

/** Placed right after \`vec4 src = texelAt(uv);\`: declares \`ro\` (the ring's bend at this pixel, 0 off the floor) and \`rg\` (its glint), and bends the floor's own pixels. */
export const LIVING_GLSL_TOP = /* glsl */ `
      vec2 ro = vec2(0.0);
      float rg = 0.0;
      {
        float floorK = 1.0 - smoothstep(uRipP.w - 0.07, uRipP.w, uv.y);
        if (uLiv.x > 0.001 && uLiv.z > 0.5 && floorK > 0.001) {
          vec3 rr = ripple(uv);
          ro = rr.xy * floorK;
          rg = rr.z * floorK;
          if (dot(ro, ro) > 1e-12) {
            vec4 s2 = texelAt(uv + ro);
            if (src.a > 0.98 && s2.a > 0.98) src = s2; // a pixel that is, or would read, a figure is left alone: no figure wobbles
          }
        }
      }
`;

/** Placed after the embers (section 6) and before the Mega Flare's flood: needs \`col\`, \`fig\`, \`lum0\`, \`uv\`, \`rg\`. */
export const LIVING_GLSL_END = /* glsl */ `
      // ---- 6b. the living cathedral (FFX-2): the lamps' flames flicker and throw moving light, a ring's glint crosses the floor, dust drifts in the skylight's beam (behind the figures)
      if (uLiv.x > 0.001) {
        if (emberN > 0.5 && uLamp.x > 0.0 && uLiv.w > 0.0) {
          float warm = smoothstep(0.02, 0.16, col.r - col.b * 0.9) * smoothstep(0.03, 0.3, col.r);
          float mulK = 0.0;
          vec3 spill = vec3(0.0);
          for (int j = 0; j < MAX_EMB; j++) {
            if (float(j) < emberN) {
              vec3 e0 = uEmber[j];
              float f = lampFlick(float(j));
              vec2 sway = vec2(sin(time * 1.7 + float(j) * 2.3), vnoise(vec2(time * 3.0 + float(j), 9.0)) - 0.5) * 0.006;
              vec2 d = vec2((uv.x - e0.x) * aspect - sway.x, uv.y - e0.y - sway.y);
              float r2 = dot(d, d);
              float re = uLamp.y * uLamp.y;
              float nearG = exp(-r2 / (re * 0.3));
              float far = exp(-r2 / (re * 2.4));
              // the lamp's reflection in the polished floor sits straight under it: the same flame, so the same flicker
              float refl = exp(-(d.x * d.x) / (0.012)) * (1.0 - smoothstep(0.16, 0.3, uv.y)) * 0.7;
              mulK += (f - 1.0) * (nearG + refl);
              spill += uLampC * (0.55 + 0.45 * f) * far;
            }
          }
          col *= 1.0 + mulK * uLamp.z * warm;
          col += spill * uLamp.x * (0.08 + 0.7 * lum0) * (1.0 - 0.6 * fig);
        }
        col += vec3(0.55, 0.78, 1.0) * rg * uRipG * (1.0 - fig);
        if (uLiv.y > 0.5 && fig < 0.5) {
          vec2 bm = beamMotes(uv);
          col += uBeamC.rgb * uBeamB.z * bm.x * (1.0 - fig);
          col += uBeamC.rgb * uBeamC.w * bm.y * (0.2 + 0.6 * lum0) * (1.0 - fig);
        }
      }
`;
