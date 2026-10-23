import { Vector2, Vector3, Vector4 } from 'three';

/**
 * Demo looks: the one compound pass that carries every look's spatial effects, built per look with `#define`s so each look compiles only what it uses.
 * It runs just before the grade, in the chain's linear light, and keeps the frame's alpha (the figure mask: 0 where a painted figure covers the pixel).
 *
 *   LOOK_HD2D    light shafts from the backdrop's light (a radial march that the figures occlude; beams from a noise round the source) and floating motes
 *                (up to three layers of drifting grid-cell points, the far ones behind the figures and the near one in front of them).
 *   LOOK_CINE    drifting fog (two layers of fbm, thick at the bottom, thinning up the frame, mostly behind the figures), a key-coloured rim on the silhouettes
 *                (an edge ring over the mask, weighted toward the side the light comes from) and a trace of chromatic aberration (a radial shift of red and blue).
 *   LOOK_ANIME   a thin ink outline round every figure (the mask blurred over a ring: the line sits where the blurred mask crosses a third, so it is smooth, not
 *                a hard threshold: no jaggies) and a clean unsharp mask.
 * Common: the figures' own light (`figGain` / `figLift` / `figContrast` seat a painted figure in the room), and a mask view for captures (`debugMask`).
 *
 * Constants by quality: `SHAFT_SAMPLES`, `MOTE_LAYERS`, `FOG_OCTAVES`, `EDGE_TAPS`; `USE_CA` keeps the aberration. Both games.
 */
export const LookMainShader = {
  name: 'LookMainShader',

  uniforms: {
    tDiffuse: { value: null as unknown },
    /** 1 / (width, height) in device pixels. */
    resolution: { value: new Vector2(1 / 1600, 1 / 900) },
    time: { value: 0 },
    /** Device pixels per pixel-at-900p (frame height / 900) and the aspect ratio. */
    pxScale: { value: 1 },
    aspect: { value: 16 / 9 },
    // --- the room's light (uv, 0..1 from the bottom-left of the frame) and its colour
    uLight: { value: new Vector2(0.5, 0.9) },
    /** Where the shafts start (frame uv): the room's light, unless a room names another (release 61: Mt. Gagazet's moon, with the depth stage). */
    shaftL: { value: new Vector2(0.5, 0.9) },
    /** 1: the beams' noise runs on the direction itself, with no cut where the angle wraps (needed when the source is inside the frame: Gagazet's moon, release 61); 0: release 60's. */
    shaftCont: { value: 0 },
    lightColor: { value: new Vector3(1, 0.9, 0.7) },
    /** hd2d shafts: gain, reach (0..1 of the way to the light), threshold. */
    shaft: { value: new Vector3(0.5, 0.9, 0.5) },
    shaftDecay: { value: 0.96 },
    shaftRays: { value: 0.5 },
    /** The beams' angular frequency (6 = pass 1's; bold uses fewer, broader ones). */
    shaftFreq: { value: 6 },
    /** hd2d motes: gain, size (frame heights), speed. */
    motes: { value: new Vector3(1, 0.003, 1) },
    /** Bold: the soft glow round each mote and the share of grid cells that carry one (0.4 = pass 1's). */
    moteExtra: { value: new Vector2(0, 0.4) },
    moteColor: { value: new Vector3(1, 0.82, 0.55) },
    /** cinematic fog: density, speed, height (0..1 up the frame). */
    fog: { value: new Vector3(0.5, 1, 0.6) },
    fogOnFigures: { value: 0.3 },
    fogColor: { value: new Vector3(0.4, 0.5, 0.6) },
    /** cinematic rim: gain, width (device px), how far it follows the light. */
    rim: { value: new Vector3(1, 2, 0.7) },
    rimColor: { value: new Vector3(0.8, 0.9, 1) },
    /** Lane boss-matte (`look/pro/BossRimOff.ts`): the re-cut bosses' screen boxes (no rim inside one, unless another figure's box also holds the pixel) and every other figure's box; counts 0 = today's rim. */
    uRimBoss: { value: [] as Vector4[] },
    uRimOther: { value: [] as Vector4[] },
    rimBossN: { value: 0 },
    rimOtherN: { value: 0 },
    /** cinematic chromatic aberration: the shift per unit of distance from the centre (uv). */
    caShift: { value: 0 },
    /** anime outline: ring radius (device px), strength; the ink (linear). */
    outline: { value: new Vector2(2, 0.9) },
    ink: { value: new Vector3(0.012, 0.01, 0.02) },
    sharpen: { value: 0 },
    /** The figures' own light. */
    figGain: { value: new Vector3(1, 1, 1) },
    figLift: { value: new Vector3(0, 0, 0) },
    figContrast: { value: 0 },
    debugMask: { value: 0 },
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
    uniform float time;
    uniform float pxScale;
    uniform float aspect;
    uniform vec2 uLight;
    uniform vec2 shaftL;
    uniform float shaftCont;
    uniform vec3 lightColor;
    uniform vec3 shaft;
    uniform float shaftDecay;
    uniform float shaftRays;
    uniform float shaftFreq;
    uniform vec3 motes;
    uniform vec2 moteExtra;
    uniform vec3 moteColor;
    uniform vec3 fog;
    uniform float fogOnFigures;
    uniform vec3 fogColor;
    uniform vec3 rim;
    uniform vec3 rimColor;
    uniform vec4 uRimBoss[2];
    uniform vec4 uRimOther[8];
    uniform float rimBossN;
    uniform float rimOtherN;
    uniform float caShift;
    uniform vec2 outline;
    uniform vec3 ink;
    uniform float sharpen;
    uniform vec3 figGain;
    uniform vec3 figLift;
    uniform float figContrast;
    uniform float debugMask;
    varying vec2 vUv;

    float luma3(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    vec2 hash22(vec2 p) {
      float n = hash21(p);
      return vec2(n, hash21(p + n + 19.19));
    }
    float ign(vec2 p) {
      return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
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
    float figAt(vec2 uv) {
      return 1.0 - clamp(texelAt(uv).a, 0.0, 1.0);
    }

    void main() {
      vec2 uv = vUv;
      vec4 src = texelAt(uv);
      float fig = 1.0 - clamp(src.a, 0.0, 1.0);
      if (debugMask > 0.5) {
        gl_FragColor = vec4(vec3(1.0 - fig), 1.0);
        return;
      }
      vec3 col = src.rgb;

      #ifdef USE_CA
      if (caShift > 0.0) {
        vec2 sh = (uv - 0.5) * caShift;
        col.r = texelAt(uv + sh).r;
        col.b = texelAt(uv - sh).b;
      }
      #endif

      #if defined(LOOK_ANIME) || defined(LOOK_CINE)
      if (sharpen > 0.0) {
        vec3 n = texelAt(uv + vec2(resolution.x, 0.0)).rgb + texelAt(uv - vec2(resolution.x, 0.0)).rgb
               + texelAt(uv + vec2(0.0, resolution.y)).rgb + texelAt(uv - vec2(0.0, resolution.y)).rgb;
        vec3 detail = col - n * 0.25;
        col += clamp(detail, vec3(-0.18), vec3(0.18)) * sharpen;
      }
      #endif

      // the figures' own light: seats a painted figure in the room (a tint, a lift and a touch of contrast); the backdrop is untouched here
      if (fig > 0.001) {
        vec3 f = col * figGain + figLift;
        f = mix(f, f * f * (3.0 - 2.0 * min(f, vec3(1.0))) + max(f - 1.0, 0.0), figContrast);
        col = mix(col, f, fig);
      }

      #if defined(LOOK_HD2D) || defined(LOOK_CINE)
      {
        vec2 toL = shaftL - uv;
        vec2 toLa = toL * vec2(aspect, 1.0);
        float dist = length(toLa);
        // light shafts: march from this pixel toward the light, gathering light from the bright backdrop pixels on the way (a figure blocks it)
        if (shaft.x > 0.0) {
        vec3 acc = vec3(0.0);
        float wgt = 1.0;
        vec2 stepv = toL * shaft.y / float(SHAFT_SAMPLES);
        vec2 p = uv + stepv * ign(gl_FragCoord.xy);
        for (int i = 0; i < SHAFT_SAMPLES; i++) {
          vec4 s = texelAt(p);
          float l = luma3(s.rgb);
          float lit = smoothstep(shaft.z, shaft.z + 0.35, l) * smoothstep(0.35, 0.95, s.a);
          acc += s.rgb * lit * wgt;
          wgt *= shaftDecay;
          p += stepv;
        }
        acc /= float(SHAFT_SAMPLES) * 0.28;
        vec2 dirL = toLa / max(dist, 1e-4);
        // the beams: noise over the direction to the light. Release 60's runs on the angle, which jumps where it wraps (a straight seam through the source: out of the frame for a source below it,
        // in it for the moon); with shaftCont the same noise runs on the unit direction, which has no seam
        vec2 bn = shaftCont > 0.5 ? dirL * (shaftFreq * 0.9 + 3.0) + vec2(time * 0.04 * 0.9, 3.7 * 0.9) : vec2(atan(dirL.y, dirL.x) * shaftFreq + time * 0.04, 3.7) * 0.9 + dirL * 3.0;
        float beams = mix(1.0, 0.25 + 1.5 * vnoise(bn), shaftRays);
        float atSrc = 1.0 - smoothstep(0.02, 0.1, dist);
        float reach = 1.0 - smoothstep(0.35, 1.25, dist);
        vec3 sh = acc * lightColor * shaft.x * beams * reach * (0.4 + 0.6 * (1.0 - atSrc));
        col += sh * (1.0 - (shaft.x > 0.9 ? 0.45 : 0.7) * fig);
        }

        // motes: drifting points of light in layers; the far ones go behind the figures, the near one passes in front
        if (motes.x > 0.0) {
        vec2 q = vec2(uv.x * aspect, uv.y);
        vec3 m = vec3(0.0);
        for (int L = 0; L < MOTE_LAYERS; L++) {
          float fl = float(L);
          float gs = (L == MOTE_LAYERS - 1 && MOTE_LAYERS > 1) ? 0.3 : 0.17 - 0.04 * fl;
          vec2 qq = q;
          qq.y -= time * motes.z * (0.012 + 0.009 * fl);
          qq.x += sin(time * motes.z * 0.21 + fl * 2.0 + q.y * 3.0) * 0.012;
          vec2 id = floor(qq / gs);
          for (int dy = -1; dy <= 1; dy++) {
            for (int dx = -1; dx <= 1; dx++) {
              vec2 c = id + vec2(float(dx), float(dy));
              vec2 h = hash22(c + fl * 31.7);
              float present = step(1.0 - moteExtra.y, hash21(c * 1.37 + fl * 7.1));
              vec2 pos = (c + 0.15 + 0.7 * h) * gs;
              float r = motes.y * (1.0 + 1.1 * fl) * (0.6 + 0.8 * h.x);
              float d = length(qq - pos);
              float tw = 0.55 + 0.45 * sin(time * (0.8 + 1.7 * h.y) + h.x * 40.0);
              float a = 1.0 - smoothstep(0.0, r, d);
              float core = a * a * (0.35 + 0.65 * a);
              float halo = 1.0 - smoothstep(0.0, r * 3.4, d);
              core += moteExtra.x * halo * halo * 0.4;
              float front = (L == MOTE_LAYERS - 1) ? 1.0 : 0.0;
              m += moteColor * core * tw * present * (0.55 + 0.45 * fl / max(1.0, float(MOTE_LAYERS - 1))) * mix(1.0 - fig, 1.0, front);
            }
          }
        }
        col += m * motes.x * 0.7;
        }
      }
      #endif

      #ifdef LOOK_CINE
      {
        // drifting fog, mostly behind the figures
        float t = time * fog.y;
        vec2 q = vec2(uv.x * aspect, uv.y);
        float n1 = fbm(q * vec2(1.5, 3.4) + vec2(t * 0.014, 0.0));
        float n2 = fbm(q * vec2(3.2, 5.6) + vec2(-t * 0.024, t * 0.004) + 11.7);
        float body = smoothstep(0.2, 0.66, n1 * 0.7 + n2 * 0.5);
        float band = 1.0 - smoothstep(0.0, max(fog.z, 1e-3), uv.y);
        float onFig = fogOnFigures * (1.0 - smoothstep(0.12, 0.34, uv.y));
        float amt = fog.x * (0.25 + 0.75 * body) * (0.35 + 0.65 * band) * mix(1.0, onFig, fig);
        vec2 dL = (uLight - uv) * vec2(aspect, 1.0);
        float lightBloom = exp(-dot(dL, dL) * 2.2);
        vec3 fc = fogColor + lightColor * lightBloom * 0.55;
        col = mix(col, fc * (0.55 + 0.9 * luma3(col)), clamp(amt, 0.0, 0.92) * 0.85);

        // rim light on the silhouettes, from the room's key: an edge ring over the mask, weighted toward the side the light comes from
        if (fig > 0.02 && rim.x > 0.0) {
          vec2 dirL = normalize((uLight - uv) * vec2(aspect, 1.0) + 1e-5);
          vec2 px = resolution * rim.y;
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
          float edgeLit = lit / wl;
          float edgeAll = sumBg / float(EDGE_TAPS);
          float e = fig * mix(edgeAll, edgeLit, rim.z);
          e = smoothstep(0.08, 0.7, e);
          if (rimBossN > 0.5) { // a re-cut boss draws no rim: inside its box and no other figure's
            float inBoss = 0.0;
            for (int j = 0; j < 2; j++) { vec4 b = uRimBoss[j]; if (float(j) < rimBossN && uv.x > b.x && uv.x < b.z && uv.y > b.y && uv.y < b.w) inBoss = 1.0; }
            for (int k = 0; k < 8; k++) { vec4 b = uRimOther[k]; if (float(k) < rimOtherN && uv.x > b.x && uv.x < b.z && uv.y > b.y && uv.y < b.w) inBoss = 0.0; }
            e *= 1.0 - inBoss;
          }
          col += rimColor * e * rim.x * (0.35 + 0.9 * luma3(col));
        }
      }
      #endif

      #ifdef LOOK_ANIME
      if (outline.y > 0.0) {
        // the mask blurred over a ring: the ink runs where it crosses about a third, which sits just outside the silhouette
        vec2 px = resolution * outline.x;
        float b = fig;
        for (int k = 0; k < EDGE_TAPS; k++) {
          float a = 6.2831853 * (float(k) + 0.5) / float(EDGE_TAPS);
          b += figAt(uv + vec2(cos(a), sin(a)) * px * ((k % 2 == 0) ? 1.0 : 0.6));
        }
        b /= float(EDGE_TAPS + 1);
        float line = smoothstep(0.0, 0.3, b) * (1.0 - smoothstep(0.3, 0.62, b));
        line = clamp(line * 1.6, 0.0, 1.0);
        vec3 inkCol = mix(ink, col * 0.18, 0.5);
        col = mix(col, inkCol, line * outline.y);
      }
      #endif

      gl_FragColor = vec4(max(col, 0.0), src.a);
    }
  `,
};
