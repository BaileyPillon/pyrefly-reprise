/**
 * Living portrait — a painted still, given a head that turns, eyes that lead it,
 * lungs and eyelids. Raw WebGL2, no dependencies, no build step.
 *
 * The whole trick: a PROCEDURAL depth field (a face ellipsoid + a hair shell + a
 * nose lobe + a chest dome) fitted to the eye positions this project already
 * measured in src/ui/common/face-crops.json. Nothing is repainted, so the
 * character cannot drift off-model; the pixels are only ever moved.
 *
 * Tuning lives in TUNE below. Everything is expressed in multiples of the
 * measured inter-pupil distance, so the same numbers fit every painting in the
 * roster without a per-character pass.
 */

const PORTRAIT_ID = 'yuna-x2';
const DISPLAY_NAME = 'Yuna';
const EYEBROW = 'Chapter IV · Party';

/** Fallback if face-crops.json cannot be fetched (row copied from it verbatim). */
const FALLBACK_CROP = { fx: 0.5691, fy: 0.3406, ipd: 0.3274, px: [832, 1216] };
/** Pupils in file pixels, from the face-crops.json note for this row. */
const FALLBACK_PUPILS = [[338, 422], [609, 406]];

const TUNE = {
  /** Head scale on screen: the inter-pupil distance as a fraction of canvas width. */
  screenIpd: 0.150,
  /** Where the eye line sits on screen (0..1). Face right of centre, as in the reference. */
  faceAt: [0.645, 0.400],
  /** Gaze parallax of the nearest surface, in width-units. */
  parallax: 0.030,
  /** Extra horizontal squash across the head that sells a yaw rather than a slide. */
  squash: 0.055,
  /** Iris travel. Larger than `parallax`, so the eyes lead the head. */
  iris: 0.019,
  /** Hair and cloth sway amplitude, in uv. */
  sway: 0.0075,
  /** Breathing amplitude in uv.y at the chest. */
  breath: 0.0075,
  /** Head turn limit, degrees-equivalent — only used for the readout. */
  maxDeg: 11,
  /** Critically damped spring stiffness for the gaze (rad/s). */
  omega: 7.0,
  /** Seconds of no input before she starts looking around on her own. */
  idleAfter: 1.4,
  /** Slow push-in: amplitude and period. */
  pushAmp: 0.022,
  pushPeriod: 27,
  /**
   * Eye anatomy, in multiples of the ipd measured DOWN/UP from the pupil centre.
   * Read off this painting's own pixels (a column through each pupil: the lash
   * line is the black band, the lid skin the warm strip above it, and above that
   * her fringe). face-crops.json records the pupils but NOT these, and the first
   * cut of this shader guessed them — it dragged a bar of her eyebrow across her
   * eye on every blink. The real build needs an `eyeBox` row per character.
   */
  eye: { lashTop: 0.132, lashBot: 0.125, cheek: 0.300, boxRx: 0.26, boxRy: 0.20 },
};

const STATES = [
  { key: 'calm', label: 'Holding steady.', lid: 0.0, breathRate: 1.30, breathScale: 1.0, blinkEvery: [2.6, 5.4] },
  { key: 'determined', label: 'Eyes on the Vegnagun.', lid: 0.16, breathRate: 0.95, breathScale: 1.35, blinkEvery: [3.8, 7.0] },
  { key: 'hurt', label: 'Running on nothing.', lid: 0.34, breathRate: 2.15, breathScale: 0.62, blinkEvery: [1.4, 2.8] },
];

/* ------------------------------------------------------------------ assets */

/**
 * Fetch the first URL that works. A Vite dev server at the repo root maps
 * `public/` onto `/`, a plain static server does not, and neither is worth
 * hard-coding — so try both plus the honest relative path.
 */
async function loadFirst(paths, asImage) {
  const errors = [];
  for (const p of paths) {
    try {
      if (asImage) {
        const img = await new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = () => rej(new Error('img ' + p));
          i.src = p;
        });
        return { value: img, from: p };
      }
      const r = await fetch(p);
      if (!r.ok) throw new Error(r.status + ' ' + p);
      return { value: await r.json(), from: p };
    } catch (e) { errors.push(e.message); }
  }
  throw new Error('none of these loaded:\n' + errors.join('\n'));
}

const ROOTS = ['../../../../', '/', '/public/'];
const imgPaths = ROOTS.map((r) => `${r}art/portraits/${PORTRAIT_ID}.png`)
  .concat([`../../../../public/art/portraits/${PORTRAIT_ID}.png`]);
const cropPaths = ['../../../../src/ui/common/face-crops.json', '/src/ui/common/face-crops.json'];

/* ------------------------------------------------------------------ shader */

const VERT = `#version 300 es
void main() {
  vec2 v = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;

uniform sampler2D uTex;
uniform vec2  uRes, uOrigin, uScale, uFace, uEyeA, uEyeB, uGaze, uHeadScreen;
uniform float uAspect, uIpd, uTime, uBlink, uBreath, uMotion, uLid;
uniform vec3  uEye;      // lashTop, lashBot, lidSkin — ipd multiples from the pupil
uniform vec2  uEyeBox;   // eye-mask radii, ipd multiples
uniform float uPar, uSquash, uIris, uSway, uBreathAmp;
uniform vec3  uGrade;        // x warm, y desat, z vignette bias
uniform float uAccentHue;    // 0 = gold, 1 = pyre pink

/* uv.y is a fraction of the image HEIGHT; width-units make the ellipsoids round. */
vec2 wu(vec2 d) { return vec2(d.x, d.y * uAspect); }
float toV(float widthUnits) { return widthUnits / uAspect; }

float lobe(vec2 d, vec2 r) { vec2 e = d / r; return sqrt(max(0.0, 1.0 - dot(e, e))); }
float smax(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
  return mix(b, a, h) + k * h * (1.0 - h);
}
float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), u.x),
             mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), u.x), u.y);
}

/*
 * Fake eyelid. Returns vec4(lid colour, coverage) and writes the lash-line
 * darkening to the out parameter. A painted closed-eye variant replaces this
 * whole function — see README. (No back-ticks in here: this comment lives
 * inside a JS template literal and one of them ended the string.)
 *
 * It PAINTS the lid rather than stretching texels into it. Two earlier cuts
 * stretched a strip of the painting downward and both failed on the same
 * thing: any painted line inside the source strip (her eyebrow first, then the
 * eyelid crease) smears into a black bar across the eye. Sampling one clean
 * patch of cheek skin and shading it has no line to drag.
 */
vec4 lidOverlay(vec2 uvp, vec2 eye, float amt, out float lash) {
  lash = 0.0;
  vec2 e2 = wu(uvp - eye) / (uIpd * uEyeBox);
  float m = smoothstep(1.0, 0.55, length(e2));
  if (m < 0.002 || amt < 0.002) return vec4(0.0);
  float top = eye.y - toV(uIpd * uEye.x);        /* upper lash line, eye open */
  float bot = eye.y + toV(uIpd * uEye.y);        /* lower lash line */
  float lid = mix(top, bot, amt);                /* the travelling lid edge */
  /* A closing lid is convex: the centre reaches the cheek before the corners. */
  float nx = clamp(wu(uvp - eye).x / (uIpd * uEyeBox.x), -1.0, 1.0);
  float curve = 1.0 - nx * nx;
  float lidC = lid + toV(uIpd * 0.045) * curve * amt;
  float eps = toV(uIpd * 0.008);
  float covered = smoothstep(top - eps, top + eps, uvp.y)
                * smoothstep(lidC + eps, lidC - eps, uvp.y) * m;
  /* clean cheek skin, well clear of lashes, hair and the earring */
  vec3 base = texture(uTex, vec2(eye.x, eye.y + toV(uIpd * uEye.z))).rgb;
  float u = clamp((uvp.y - top) / max(1e-5, lidC - top), 0.0, 1.0);
  /* The lash line rides the closing edge — without it a shut eye is a blank
     patch. It gets a HORIZONTAL-only mask: the elliptical one fades to zero at
     exactly the height the fully-closed lid lands on, which erased it. */
  float mx = smoothstep(1.02, 0.80, abs(nx));
  lash = smoothstep(toV(uIpd * 0.030), 0.0, abs(uvp.y - lidC)) * mx * amt * (0.30 + 0.70 * curve);
  return vec4(base * mix(1.06, 0.74, u), covered);
}

void main() {
  vec2 p = gl_FragCoord.xy / uRes;
  p.y = 1.0 - p.y;
  vec2 uv = (p - uOrigin) / uScale;

  /* ---- background: ink void, a pool of light behind her, motes ---------- */
  float vign = smoothstep(1.22, 0.22, length((p - vec2(0.5)) * vec2(1.22, 1.0)) + uGrade.z);
  vec3 bg = mix(vec3(0.013, 0.012, 0.020), vec3(0.068, 0.050, 0.080), vign);
  float pool = smoothstep(0.62, 0.0, length((p - uHeadScreen) * vec2(1.0, 1.12)));
  bg += mix(vec3(0.115, 0.070, 0.055), vec3(0.120, 0.060, 0.095), uAccentHue) * pool * 0.52;

  vec3 rgb = bg;
  float sil = 0.0;

  if (uv.x > -0.02 && uv.x < 1.02 && uv.y > -0.02 && uv.y < 1.02) {
    sil = texture(uTex, clamp(uv, 0.0, 1.0)).a;

    /* ---- procedural depth, fitted to the measured eye line -------------- */
    vec2 d = wu(uv - uFace);
    float ip = uIpd;
    float zFace = lobe(d - vec2(0.0, ip * 0.45), vec2(ip * 0.90, ip * 1.05));
    float zHair = lobe(d - vec2(0.0, ip * 0.35), vec2(ip * 1.70, ip * 1.60)) * 0.42;
    float zBody = lobe(d - vec2(0.0, ip * 3.10), vec2(ip * 2.70, ip * 1.60)) * 0.46;
    float zNose = lobe(d - vec2(0.0, ip * 0.55), vec2(ip * 0.34, ip * 0.44)) * 0.26;
    float z = smax(smax(zFace, zHair, 0.18), zBody, 0.18) + zNose;
    z *= smoothstep(0.12, 0.62, sil);

    vec2 s = uv;
    vec2 g = uGaze;

    /* breathing: the chest moves most, the head rides a quarter of it */
    float bm = smoothstep(uFace.y + toV(ip * 0.9), uFace.y + toV(ip * 2.7), uv.y);
    s.y -= uBreath * uBreathAmp * (0.22 + 0.78 * bm);
    s.x -= (uv.x - uFace.x) * uBreath * uBreathAmp * 0.85 * bm;

    /* gaze parallax: near surfaces travel, the void does not */
    s.x -= g.x * z * uPar;
    s.y += g.y * z * toV(uPar);

    /* yaw squash across the head — the far cheek compresses */
    float headM = smoothstep(1.30, 0.50, length((d - vec2(0.0, ip * 0.45)) / vec2(ip * 1.05, ip * 1.25)));
    float dx = uv.x - uFace.x;
    s.x += sqrt(dx * dx + 1e-6) * g.x * uSquash * headM;

    /* the irises lead the head */
    float irisR = ip * 0.135;
    float wI = max(smoothstep(irisR, irisR * 0.15, length(wu(uv - uEyeA))),
                   smoothstep(irisR, irisR * 0.15, length(wu(uv - uEyeB))));
    s.x -= g.x * wI * uIris;
    s.y += g.y * wI * toV(uIris);

    /* hair and cloth sway, never across the face core */
    float core = smoothstep(1.40, 0.65, length((d - vec2(0.0, ip * 0.45)) / vec2(ip * 1.00, ip * 1.18)));
    float n1 = vnoise(uv * vec2(5.0, 3.4) + vec2(uTime * 0.13, uTime * 0.09));
    float n2 = vnoise(uv * vec2(4.2, 3.0) + vec2(-uTime * 0.11, uTime * 0.16) + 17.3);
    s += (vec2(n1, n2) - 0.5) * uSway * (1.0 - core) * uMotion;

    /* blink + the resting lid the state sets */
    float amt = clamp(uBlink + uLid, 0.0, 1.0);
    float lashA, lashB;
    vec4 lidA = lidOverlay(uv, uEyeA, amt, lashA);
    vec4 lidB = lidOverlay(uv, uEyeB, amt, lashB);
    float lash = clamp(lashA + lashB, 0.0, 1.0);

    vec4 col = texture(uTex, clamp(s, 0.0, 1.0));
    /* The cut-out runs right up to the file's edges (hair on the right, collar at
       the bottom), so an un-faded border draws a hard rectangle across the void.
       Dissolve the last few percent into ink instead — it reads as the bust
       emerging from the dark, which is what the reference does anyway. */
    float edge = smoothstep(0.0, 0.045, s.x) * smoothstep(1.0, 0.955, s.x)
               * smoothstep(0.0, 0.035, s.y) * smoothstep(1.0, 0.920, s.y);
    float a = col.a * edge;

    /* grade: warmth and saturation follow the state */
    vec3 c = col.rgb;
    c = mix(c, lidA.rgb, lidA.a);        /* the lids close over the painting */
    c = mix(c, lidB.rgb, lidB.a);
    c *= (1.0 - 0.80 * lash);            /* lash line at the closing edge */
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(c, vec3(lum), uGrade.y);
    c *= mix(vec3(1.0), vec3(1.06, 0.99, 0.92), uGrade.x);

    /* eye highlight: a catchlight that tracks the gaze and breathes slowly */
    float shimmer = 0.55 + 0.45 * sin(uTime * 1.7);
    for (int i = 0; i < 2; i++) {
      vec2 eye = i == 0 ? uEyeA : uEyeB;
      vec2 hp = eye + vec2(g.x, -g.y) * ip * 0.030 + vec2(-ip * 0.035, -toV(ip * 0.040));
      float h = smoothstep(ip * 0.030, 0.0, length(wu(uv - hp)));
      c += vec3(1.0, 0.97, 0.92) * h * 0.55 * shimmer * (1.0 - amt);
    }

    /* rim light on the accent side, so she separates from the void */
    float rim = smoothstep(0.35, 0.95, 1.0 - sil) * 0.0;
    c += mix(vec3(0.9, 0.72, 0.30), vec3(0.97, 0.71, 0.85), uAccentHue) * rim;

    rgb = mix(bg, c, a);
  }

  /* motes drifting up through the pool of light */
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    vec2 seed = vec2(hash21(vec2(fi, 3.7)), hash21(vec2(fi, 9.1)));
    vec2 mp = vec2(seed.x * 0.9 + 0.05, fract(seed.y - uTime * (0.012 + seed.x * 0.016)));
    float m = smoothstep(0.0045, 0.0, length((p - mp) * vec2(1.0, 1.0)));
    rgb += mix(vec3(0.95, 0.80, 0.42), vec3(0.98, 0.76, 0.90), uAccentHue)
         * m * 0.55 * (0.4 + 0.6 * sin(uTime * 1.2 + fi)) * uMotion;
  }

  rgb *= mix(0.55, 1.0, vign);
  rgb += (hash21(p * uRes + fract(uTime)) - 0.5) * 0.016;   /* grain */

  outColor = vec4(rgb, 1.0);
}`;

/* ------------------------------------------------------------------- setup */

const canvas = document.getElementById('gl');
const fatal = document.getElementById('fatal');
const fatalMsg = document.getElementById('fatalMsg');
const legend = document.getElementById('legend');
const hud = document.getElementById('hud');
const note = document.getElementById('note');
const mood = document.getElementById('mood');

function die(msg) {
  fatalMsg.textContent = msg;
  fatal.hidden = false;
  canvas.style.display = 'none';
}

const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
if (!gl) die('WebGL2 is not available in this browser.');

function compile(type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
  return sh;
}

let prog, U = {}, tex, img, crop, pupils;

function link() {
  prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  for (const n of ['uTex', 'uRes', 'uOrigin', 'uScale', 'uFace', 'uEyeA', 'uEyeB', 'uGaze',
    'uHeadScreen', 'uAspect', 'uIpd', 'uTime', 'uBlink', 'uBreath', 'uMotion', 'uLid',
    'uPar', 'uSquash', 'uIris', 'uSway', 'uBreathAmp', 'uGrade', 'uAccentHue', 'uEye', 'uEyeBox']) {
    U[n] = gl.getUniformLocation(prog, n);
  }
}

/* ------------------------------------------------------------------- state */

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
let forceReduced = false;
const reduced = () => reduce.matches || forceReduced;

const gaze = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
let stateIdx = 0;
let lastInput = -99;
let blink = 0, blinkT = 0, nextBlink = 2.5;
let breathPhase = 0;
let frozen = false;
/** Accumulated, pausable clock — so `freeze()` stops the sway and motes too and
    a captured still differs from the next one only in what the script changed. */
let clock = 0;
const keys = new Set();
const frames = [];

function flash(text) {
  note.textContent = text;
  note.classList.add('show');
  clearTimeout(flash.t);
  flash.t = setTimeout(() => note.classList.remove('show'), 1400);
}

function setState(i) {
  stateIdx = (i + STATES.length) % STATES.length;
  mood.textContent = STATES[stateIdx].label;
  flash('state · ' + STATES[stateIdx].key);
  nextBlink = 0.35;
}

addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (k === 'h') { legend.hidden = !legend.hidden; return; }
  if (k === 'f') { hud.hidden = !hud.hidden; return; }
  if (k === 'e') { setState(stateIdx + 1); return; }
  if (k === 'b') { blinkT = 0; blink = 0.0001; nextBlink = 0.001; return; }
  if (k === 'r') { forceReduced = !forceReduced; flash(reduced() ? 'reduced motion · on' : 'reduced motion · off'); return; }
  keys.add(k);
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

let mouseGaze = null;
addEventListener('mousemove', (e) => {
  mouseGaze = [(e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1)];
  lastInput = performance.now() / 1000;
});
addEventListener('mouseleave', () => { mouseGaze = null; });

function readInput(t) {
  let x = 0, y = 0, active = false;
  if (keys.has('arrowleft') || keys.has('a')) { x -= 1; active = true; }
  if (keys.has('arrowright') || keys.has('d')) { x += 1; active = true; }
  if (keys.has('arrowup') || keys.has('w')) { y += 1; active = true; }
  if (keys.has('arrowdown') || keys.has('s')) { y -= 1; active = true; }

  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const pad of pads) {
    if (!pad) continue;
    const ax = pad.axes[2] || 0, ay = pad.axes[3] || 0;
    if (Math.abs(ax) > 0.14 || Math.abs(ay) > 0.14) { x = ax; y = -ay; active = true; }
  }

  if (!active && mouseGaze && t - lastInput < 0.4) { x = mouseGaze[0] * 0.85; y = mouseGaze[1] * 0.85; active = true; }
  if (active) lastInput = t;
  return [Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)), active];
}

/** A slow wander plus the occasional saccade, so she is never a mannequin. */
function idleTarget(t) {
  const s = t * 0.21;
  const saccade = Math.floor(t / 3.1);
  const jx = (hashf(saccade) - 0.5) * 0.9;
  const jy = (hashf(saccade + 71) - 0.5) * 0.5;
  const ease = Math.min(1, (t % 3.1) / 0.55);
  return [
    (Math.sin(s) * 0.34 + Math.sin(s * 2.3 + 1.1) * 0.15) * 0.7 + jx * ease * 0.5,
    (Math.sin(s * 0.8 + 2.0) * 0.20 + Math.sin(s * 1.7) * 0.08) * 0.7 + jy * ease * 0.5,
  ];
}
function hashf(n) { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }

/* ------------------------------------------------------------------- frame */

let last = performance.now() / 1000;
let fitOrigin = [0, 0], fitScale = [1, 1], headScreen = [0.5, 0.4];

/* Real GPU cost of the shader. A full-screen fragment pass is GPU-bound, so
   CPU timings alone would flatter it; EXT_disjoint_timer_query_webgl2 is the
   only honest number. Absent on some drivers — the readout says so. */
const gpuFrames = [], rafGaps = [];
let timerExt = null, pendingQuery = null;
function initTimer() { timerExt = gl.getExtension('EXT_disjoint_timer_query_webgl2'); }
function beginGpu() { if (timerExt && !pendingQuery) { pendingQuery = gl.createQuery(); gl.beginQuery(timerExt.TIME_ELAPSED_EXT, pendingQuery); return true; } return false; }
function endGpu(began) {
  if (!began) return;
  gl.endQuery(timerExt.TIME_ELAPSED_EXT);
  const q = pendingQuery;
  setTimeout(() => {
    if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE) || gl.getParameter(timerExt.GPU_DISJOINT_EXT)) { gl.deleteQuery(q); pendingQuery = null; return; }
    gpuFrames.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
    if (gpuFrames.length > 240) gpuFrames.shift();
    gl.deleteQuery(q); pendingQuery = null;
  }, 24);
}
function pct(arr, p) { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; }

function layout(t) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }

  const aspectScreen = innerWidth / innerHeight;
  const push = reduced() ? 0 : TUNE.pushAmp * 0.5 * (1 - Math.cos((t / TUNE.pushPeriod) * Math.PI * 2));
  /* Screen-normalised width of the whole image, chosen so the measured ipd
     lands at TUNE.screenIpd of the canvas width. */
  const sw = (TUNE.screenIpd * (1 + push)) / crop.ipd;
  const sh = (sw * (img.height / img.width)) * aspectScreen;
  fitScale = [sw, sh];
  fitOrigin = [TUNE.faceAt[0] - crop.fx * sw, TUNE.faceAt[1] - crop.fy * sh];
  headScreen = [TUNE.faceAt[0], TUNE.faceAt[1] + 0.03];
}

function frame(now) {
  requestAnimationFrame(frame);
  const t0 = performance.now();
  const t = now / 1000;
  let dt = Math.min(0.05, t - last);
  last = t;
  if (frozen) dt = 0;
  clock += dt;

  const st = STATES[stateIdx];
  const rm = reduced();

  /* gaze target */
  const [ix, iy, active] = readInput(t);
  if (active) { gaze.tx = ix; gaze.ty = iy; }
  else if (!rm && t - lastInput > TUNE.idleAfter) { const [ax, ay] = idleTarget(t); gaze.tx = ax; gaze.ty = ay; }
  else if (rm) { gaze.tx = 0; gaze.ty = 0; }

  /* critically damped spring (zeta = 1) */
  const w = TUNE.omega;
  for (const ax of ['x', 'y']) {
    const v = 'v' + ax, tg = 't' + ax;
    if (rm) { gaze[ax] = gaze[tg]; gaze[v] = 0; continue; }
    const a = -2 * w * gaze[v] - w * w * (gaze[ax] - gaze[tg]);
    gaze[v] += a * dt;
    gaze[ax] += gaze[v] * dt;
  }

  /* micro drift: she is never perfectly still */
  const drift = rm ? [0, 0] : [Math.sin(clock * 0.73) * 0.035 + Math.sin(clock * 1.9) * 0.014,
                               Math.sin(clock * 0.61 + 1.3) * 0.022];

  /* breathing and blinking */
  if (!rm) {
    breathPhase += dt * st.breathRate;
    blinkT += dt;
    if (blinkT > nextBlink) {
      blink = Math.min(1, blink + dt * 11);
      if (blink >= 1) { blinkT = 0; nextBlink = st.blinkEvery[0] + Math.random() * (st.blinkEvery[1] - st.blinkEvery[0]); }
    } else { blink = Math.max(0, blink - dt * 7.5); }
  } else { blink = 0; }

  layout(clock);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniform2f(U.uRes, canvas.width, canvas.height);
  gl.uniform2f(U.uOrigin, fitOrigin[0], fitOrigin[1]);
  gl.uniform2f(U.uScale, fitScale[0], fitScale[1]);
  gl.uniform2f(U.uHeadScreen, headScreen[0], headScreen[1]);
  gl.uniform2f(U.uFace, crop.fx, crop.fy);
  gl.uniform2f(U.uEyeA, pupils[0][0], pupils[0][1]);
  gl.uniform2f(U.uEyeB, pupils[1][0], pupils[1][1]);
  gl.uniform2f(U.uGaze, gaze.x + drift[0], gaze.y + drift[1]);
  gl.uniform1f(U.uAspect, img.height / img.width);
  gl.uniform1f(U.uIpd, crop.ipd);
  gl.uniform1f(U.uTime, rm ? 0 : clock);
  gl.uniform1f(U.uBlink, blink);
  gl.uniform1f(U.uBreath, rm ? 0 : Math.sin(breathPhase) * st.breathScale);
  gl.uniform1f(U.uMotion, rm ? 0 : 1);
  gl.uniform1f(U.uLid, st.lid);
  gl.uniform3f(U.uEye, TUNE.eye.lashTop, TUNE.eye.lashBot, TUNE.eye.cheek);
  gl.uniform2f(U.uEyeBox, TUNE.eye.boxRx, TUNE.eye.boxRy);
  gl.uniform1f(U.uPar, TUNE.parallax);
  gl.uniform1f(U.uSquash, TUNE.squash);
  gl.uniform1f(U.uIris, TUNE.iris);
  gl.uniform1f(U.uSway, TUNE.sway);
  gl.uniform1f(U.uBreathAmp, TUNE.breath);
  gl.uniform3f(U.uGrade, st.key === 'determined' ? 0.55 : 0.0, st.key === 'hurt' ? 0.34 : 0.0,
    st.key === 'hurt' ? 0.10 : 0.0);
  gl.uniform1f(U.uAccentHue, 1.0);
  const began = beginGpu();
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  endGpu(began);

  frames.push(performance.now() - t0);
  if (frames.length > 240) frames.shift();
  if (dt > 0) { rafGaps.push(dt * 1000); if (rafGaps.length > 240) rafGaps.shift(); }
  if (!hud.hidden) {
    const g50 = pct(gpuFrames, 0.5), g95 = pct(gpuFrames, 0.95);
    hud.textContent =
      `gpu draw    ${g50 === null ? 'timer ext unavailable' : `p50 ${g50.toFixed(2)} ms   p95 ${g95.toFixed(2)} ms`}\n` +
      `cpu+submit  p50 ${(pct(frames, 0.5) || 0).toFixed(2)} ms   p95 ${(pct(frames, 0.95) || 0).toFixed(2)} ms\n` +
      `raf gap     p50 ${(pct(rafGaps, 0.5) || 0).toFixed(2)} ms   p95 ${(pct(rafGaps, 0.95) || 0).toFixed(2)} ms\n` +
      `canvas      ${canvas.width}x${canvas.height} @${(devicePixelRatio || 1).toFixed(2)}x\n` +
      `gaze        ${gaze.x.toFixed(2)}, ${gaze.y.toFixed(2)}  ->  ${(gaze.x * TUNE.maxDeg).toFixed(1)}deg yaw\n` +
      `blink ${blink.toFixed(2)}   state ${st.key}   reduced ${rm ? 'yes' : 'no'}`;
  }
}

/* -------------------------------------------------------------------- boot */

async function boot() {
  document.getElementById('name').textContent = DISPLAY_NAME;
  document.getElementById('eyebrow').textContent = EYEBROW;
  mood.textContent = STATES[0].label;

  const loaded = await loadFirst(imgPaths, true);
  img = loaded.value;

  crop = FALLBACK_CROP;
  pupils = FALLBACK_PUPILS.map(([x, y]) => [x / FALLBACK_CROP.px[0], y / FALLBACK_CROP.px[1]]);
  try {
    const cr = await loadFirst(cropPaths, false);
    const row = cr.value.portraits[PORTRAIT_ID];
    if (row) {
      crop = row;
      /* The row's note carries the pupils in file pixels; fall back to fx/fy +- ipd/2. */
      const m = /\((\d+),\s*(\d+)\)\s*and\s*\((\d+),\s*(\d+)\)/.exec(row.note || '');
      pupils = m
        ? [[+m[1] / row.px[0], +m[2] / row.px[1]], [+m[3] / row.px[0], +m[4] / row.px[1]]]
        : [[row.fx - row.ipd / 2, row.fy], [row.fx + row.ipd / 2, row.fy]];
    }
  } catch { /* fallback row already in place */ }

  link();
  initTimer();
  tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(U.uTex, 0);

  /* Handles for driving the prototype from a script when capturing stills. */
  window.__lp = {
    setGaze(x, y) { gaze.tx = gaze.x = x; gaze.ty = gaze.y = y; gaze.vx = gaze.vy = 0; lastInput = performance.now() / 1000 + 1e6; },
    setBlink(v) { blink = v; blinkT = 0; nextBlink = 1e6; },
    setState, freeze(v = true) { frozen = v; }, hideLegend(v = true) { legend.hidden = v; hud.hidden = v; },
    showHud(v = true) { hud.hidden = !v; },
    debug() {
      return {
        gaze: [+gaze.x.toFixed(4), +gaze.y.toFixed(4)],
        target: [+gaze.tx.toFixed(4), +gaze.ty.toFixed(4)],
        blink: +blink.toFixed(3), state: STATES[stateIdx].key,
        reduced: reduced(), legendHidden: legend.hidden, frames: frames.length,
      };
    },
    stats() {
      return {
        samples: { gpu: gpuFrames.length, cpu: frames.length },
        gpuMs: timerExt ? { p50: pct(gpuFrames, 0.5), p95: pct(gpuFrames, 0.95), max: pct(gpuFrames, 1) } : null,
        cpuMs: { p50: pct(frames, 0.5), p95: pct(frames, 0.95) },
        rafGapMs: { p50: pct(rafGaps, 0.5), p95: pct(rafGaps, 0.95) },
        canvas: [canvas.width, canvas.height], dpr: devicePixelRatio || 1,
      };
    },
    ready: true,
  };

  requestAnimationFrame(frame);
}

if (gl) boot().catch((e) => die(String(e && e.message ? e.message : e)));
