import { Matrix3, Vector2, Vector3, Vector4 } from 'three';

/**
 * Demo looks, BOLD strength (`?lookstrength=bold`; dev flag only): the one extra pass that carries what the first pass's compound pass cannot. It runs right after it,
 * before the grade, in the chain's linear light, and keeps the frame's alpha (the figure mask: 0 where a painted figure covers the pixel). In order:
 *
 *   1. fog          far fog from the backdrop's depth map (`uDepth`, through the homography `uHomo` from the frame to the painting) and a height fog that thickens toward the
 *                   floor, both over the backdrop only; a figure gets a trace of mist at its feet and nothing over its face.
 *   2. contact      a soft ellipse under every figure, shaped from the figure's own base width (`uFigA`, `uFigB`), darker under the feet, leaning away from the light.
 *   3. reflection   on a glossy floor: the figure flipped about its foot line, blurred more the farther it falls, faded and cut off by distance (never over another figure).
 *   4. pools        a coloured pool of light on the floor round the target of a spell or the orb (`uPoolA`, `uPoolC`), sized to the effect.
 *   5. rim          a bright rim along each figure's back edge, in the room's key colour (an edge ring over the mask, weighted toward the light's side), inside the silhouette.
 *   6. embers       sparks rising from the room's lamps (`uEmber`).
 * Constants: `MAX_FIG`, `MAX_POOL`, `MAX_EMB`, `EMBER_PARTS`, `FOG_OCTAVES`, `EDGE_TAPS`. Both games.
 */
export const LookBoldShader = {
  name: 'LookBoldShader',

  uniforms: {
    tDiffuse: { value: null as unknown },
    resolution: { value: new Vector2(1 / 1600, 1 / 900) },
    time: { value: 0 },
    pxScale: { value: 1 },
    aspect: { value: 16 / 9 },
    uLight: { value: new Vector2(0.5, 0.9) },
    lightColor: { value: new Vector3(1, 0.9, 0.7) },
    /** Per figure: xy the foot on the floor (frame uv), zw the shadow ellipse's radii (z in frame heights across, w up the frame). */
    uFigA: { value: [] as Vector4[] },
    /** Per figure: x the contact shadow's strength, y the reflection's, z the figure's half width (frame heights), w its height (frame uv). */
    uFigB: { value: [] as Vector4[] },
    /** The contact shadow: x the share that is the tight core, y how far it leans from the light (0..1 of its radius). */
    shadowP: { value: new Vector2(0.6, 0.25) },
    shadowColor: { value: new Vector3(0.2, 0.22, 0.3) },
    /** The reflection: x the strength (already times the room's gloss), y the reach in figure heights, z the blur in px, w the squash. */
    refl: { value: new Vector4(0, 0.5, 5, 0.85) },
    /** The backdrop's depth map (white = near; the log depth of the maps lane), and the map from the frame to the painting's uv; 0 = no map. */
    uDepth: { value: null as unknown },
    depthOn: { value: 0 },
    uHomo: { value: new Matrix3() },
    /** Far fog: density, where the far end starts. Height fog: density, how far it climbs, how much reaches a figure's feet. */
    depthFog: { value: new Vector2(0.5, 0.2) },
    heightFog: { value: new Vector3(0.5, 0.34, 0.25) },
    fogColor: { value: new Vector3(0.4, 0.5, 0.7) },
    uPoolA: { value: [] as Vector4[] },
    uPoolC: { value: [] as Vector4[] },
    poolGain: { value: 1 },
    /** The rim: gain, width (device px), how far it follows the light's side; its colour. */
    bRim: { value: new Vector3(1.7, 2.6, 0.85) },
    rimColor: { value: new Vector3(0.8, 0.9, 1) },
    /** Embers: the lamps (frame uv and a radius in frame heights), how many, then gain, size (frame heights), rise rate; the colour. */
    uEmber: { value: [] as Vector3[] },
    emberN: { value: 0 },
    ember: { value: new Vector3(1, 0.003, 0.15) },
    emberColor: { value: new Vector3(1.0, 0.5, 0.14) },
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
    vec4 texelAt(vec2 uv) { return textureLod(tDiffuse, uv, 0.0); }
    uniform vec2 resolution;
    uniform float time;
    uniform float pxScale;
    uniform float aspect;
    uniform vec2 uLight;
    uniform vec3 lightColor;
    uniform vec4 uFigA[MAX_FIG];
    uniform vec4 uFigB[MAX_FIG];
    uniform vec2 shadowP;
    uniform vec3 shadowColor;
    uniform vec4 refl;
    uniform sampler2D uDepth;
    uniform float depthOn;
    uniform mat3 uHomo;
    uniform vec2 depthFog;
    uniform vec3 heightFog;
    uniform vec3 fogColor;
    uniform vec4 uPoolA[MAX_POOL];
    uniform vec4 uPoolC[MAX_POOL];
    uniform float poolGain;
    uniform vec3 bRim;
    uniform vec3 rimColor;
    uniform vec3 uEmber[MAX_EMB];
    uniform float emberN;
    uniform vec3 ember;
    uniform vec3 emberColor;
    varying vec2 vUv;

    float luma3(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float fbm(vec2 p) {
      float a = 0.5;
      float s = 0.0;
      for (int i = 0; i < FOG_OCTAVES; i++) {
        s += a * vnoise(p);
        p = p * 2.03 + vec2(17.1, 9.2);
        a *= 0.5;
      }
      return s;
    }
    float figAt(vec2 uv) { return 1.0 - clamp(texelAt(uv).a, 0.0, 1.0); }

    void main() {
      vec2 uv = vUv;
      vec4 src = texelAt(uv);
      float fig = 1.0 - clamp(src.a, 0.0, 1.0);
      vec3 col = src.rgb;
      float lum0 = luma3(col);

      // ---- 1. fog: far (from the depth map) and low (thickening toward the floor), over the backdrop; a trace of mist at a figure's feet
      {
        float farK = smoothstep(0.1, 0.78, uv.y);
        if (depthOn > 0.5) {
          vec3 h = uHomo * vec3(uv, 1.0);
          vec2 q = clamp(h.xy / h.z, 0.0, 1.0);
          farK = 1.0 - textureLod(uDepth, q, 0.0).r;
        }
        vec2 np = vec2(uv.x * aspect, uv.y);
        float n = fbm(np * vec2(1.7, 3.2) + vec2(time * 0.012, 0.0));
        float body = 0.5 + 0.95 * n;
        float dfog = depthFog.x * smoothstep(depthFog.y, 1.0, farK);
        float low = 1.0 - smoothstep(0.0, max(heightFog.y, 1e-3), uv.y);
        float hfog = heightFog.x * low * low;
        float backAmt = (dfog + hfog) * body;
        float feet = heightFog.z * (1.0 - smoothstep(0.05, 0.3, uv.y)) * (0.5 + 0.9 * n);
        float amt = clamp(mix(backAmt, feet, fig), 0.0, 0.62);
        vec2 dL = (uLight - uv) * vec2(aspect, 1.0);
        vec3 fc = fogColor + lightColor * exp(-dot(dL, dL) * 2.0) * 0.35;
        // the haze follows the scene's own light (dark floor, dark haze): it veils the far and the low without lifting the blacks into a flat colour
        col = mix(col, fc * (0.22 + 1.05 * lum0), amt);
      }

      // ---- 2. contact shadows under every figure, from the base width, darker under the feet
      {
        float sh = 0.0;
        for (int i = 0; i < MAX_FIG; i++) {
          vec4 fa = uFigA[i];
          vec4 fb = uFigB[i];
          if (fb.x > 0.001) {
            vec2 d = vec2((uv.x - fa.x) * aspect, uv.y - fa.y);
            float lean = sign((fa.x - uLight.x) + 1e-4) * shadowP.y * fa.z;
            d.x -= lean;
            vec2 e = d / fa.zw;
            float r2 = dot(e, e);
            if (r2 < 2.2) {
              float wide = exp(-r2 * 1.7);
              vec2 c = e / 0.5;
              float core = exp(-dot(c, c) * 1.9);
              float s = fb.x * mix(wide, core, shadowP.x * 0.9) * (0.45 + 0.55 * wide + 0.5 * core * shadowP.x);
              sh = 1.0 - (1.0 - sh) * (1.0 - clamp(s, 0.0, 1.0));
            }
          }
        }
        col *= mix(vec3(1.0), shadowColor, clamp(sh, 0.0, 1.0) * (1.0 - fig));
      }

      // ---- 3. floor reflection: the figure flipped about its foot line, blurred and faded with distance; never over a figure
      if (refl.x > 0.001 && fig < 0.5) {
        vec3 rsum = vec3(0.0);
        float ra = 0.0;
        for (int i = 0; i < MAX_FIG; i++) {
          vec4 fa = uFigA[i];
          vec4 fb = uFigB[i];
          float dy = fa.y - uv.y;
          float len = fb.w * refl.y;
          if (fb.y > 0.001 && dy > 0.0 && dy < len) {
            float dx = (uv.x - fa.x) * aspect;
            float hw = fb.z;
            float ex = abs(dx) / max(hw, 1e-4);
            if (ex < 1.2) {
              float k = dy / len;
              float srcY = fa.y + dy / refl.w;
              vec2 bp = resolution * refl.z * pxScale * (0.3 + 1.5 * k);
              float wob = sin(dy * 90.0 + time * 1.3) * 0.0016;
              vec3 acc = vec3(0.0);
              float cov = 0.0;
              for (int t = 0; t < 5; t++) {
                float o = float(t) - 2.0;
                vec4 r4 = texelAt(vec2(uv.x + wob + o * bp.x * 0.9, srcY + o * bp.y * 0.5));
                float m = 1.0 - clamp(r4.a, 0.0, 1.0);
                acc += r4.rgb * m;
                cov += m;
              }
              float a = refl.x * fb.y * pow(1.0 - k, 1.7) * smoothstep(0.0, 0.012, dy) * (1.0 - smoothstep(0.85, 1.2, ex)) * (cov / 5.0);
              rsum += (acc / max(cov, 1e-3)) * a;
              ra = 1.0 - (1.0 - ra) * (1.0 - clamp(a, 0.0, 1.0));
            }
          }
        }
        if (ra > 0.0005) col = mix(col, col * 0.4 + rsum / max(ra, 1e-3) * 0.6, clamp(ra * 0.65, 0.0, 0.75));
      }

      // ---- 4. a coloured pool of light on the floor round the target of an effect
      if (fig < 0.99) {
        for (int i = 0; i < MAX_POOL; i++) {
          vec4 pc = uPoolC[i];
          if (pc.w > 0.001) {
            vec4 pa = uPoolA[i];
            vec2 d = vec2((uv.x - pa.x) * aspect, uv.y - pa.y) / vec2(pa.z, pa.w);
            float r2 = dot(d, d);
            if (r2 < 2.0) {
              float f = exp(-r2 * 2.3) * (1.0 - smoothstep(1.0, 2.0, r2));
              col += pc.rgb * pc.w * poolGain * f * (0.16 + 2.4 * col) * (1.0 - fig);
            }
          }
        }
      }

      // ---- 5. a bright rim along the back edge of each figure, in the key colour, inside the silhouette (no halo)
      if (fig > 0.02 && bRim.x > 0.0) {
        vec2 dirL = normalize((uLight - uv) * vec2(aspect, 1.0) + 1e-5);
        vec2 px = resolution * bRim.y;
        float lit = 0.0;
        float sumBg = 0.0;
        float wl = 0.0;
        for (int k = 0; k < EDGE_TAPS; k++) {
          float a = 6.2831853 * (float(k) + 0.5) / float(EDGE_TAPS);
          vec2 d = vec2(cos(a), sin(a));
          float bg = 1.0 - figAt(uv + d * px * ((k % 2 == 0) ? 1.0 : 0.55));
          float w = max(0.0, dot(d, dirL)) + 0.05;
          lit += bg * w;
          wl += w;
          sumBg += bg;
        }
        float e = fig * mix(sumBg / float(EDGE_TAPS), lit / wl, bRim.z);
        e = smoothstep(0.04, 0.85, e);
        col += rimColor * e * bRim.x * (0.5 + 0.9 * luma3(col));
      }

      // ---- 6. embers rising from the room's lamps
      if (emberN > 0.5 && ember.x > 0.0) {
        vec3 em = vec3(0.0);
        for (int j = 0; j < MAX_EMB; j++) {
          if (float(j) < emberN) {
            vec3 e0 = uEmber[j];
            vec2 d = vec2((uv.x - e0.x) * aspect, uv.y - e0.y);
            if (abs(d.x) < e0.z && d.y > -0.04 && d.y < e0.z * 2.4) {
              for (int k = 0; k < EMBER_PARTS; k++) {
                float h1 = hash21(vec2(float(j) * 7.3 + 1.0, float(k) * 3.1 + 2.0));
                float h2 = hash21(vec2(float(k) * 5.7 + 0.3, float(j) * 2.9 + 4.0));
                float ph = fract(time * ember.z * (0.6 + h1) + h2);
                vec2 pos = vec2((h1 - 0.5) * e0.z * 0.9 + sin(time * 0.9 + h2 * 20.0 + ph * 6.0) * 0.014 * ph, ph * e0.z * 2.0);
                float dd = length(d - pos);
                float sz = ember.y * (0.6 + 0.8 * h2) * (1.0 - 0.45 * ph);
                float g = 1.0 - smoothstep(0.0, sz, dd);
                float gl = 1.0 - smoothstep(0.0, sz * 4.5, dd);
                float life = sin(3.14159 * ph);
                em += (g * g * 1.6 + gl * gl * 0.28) * life * (0.7 + 0.5 * sin(time * 7.0 + h1 * 30.0));
              }
            }
          }
        }
        col += emberColor * em * ember.x * (1.0 - 0.9 * fig);
      }

      gl_FragColor = vec4(max(col, 0.0), src.a);
    }
  `,
};
