/**
 * Procedural canvas art.
 *
 * Everything here exists so the painted-2.5D scene is beautiful *before* the
 * AI-painted PNGs land, and so it degrades gracefully if one of them is ever
 * missing. Nothing here is pixel art: these are soft, painterly canvases meant
 * to be sampled with `LinearFilter` and mipmaps, exactly like the real
 * paintings they stand in for.
 *
 * All of it is deterministic given a seed, so screenshots are reproducible.
 */

/** xorshift32 — small, fast, deterministic. */
export function rng(seed: number): () => number {
  let s = seed >>> 0 || 0x9e3779b9;
  return (): number => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/** `#rrggbb` -> [r,g,b] 0..255 */
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToCss(c: [number, number, number], a = 1): string {
  return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
}

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * Midpoint-displacement fractal line normalised to 0..1.
 * `steps` 7 gives 129 samples, which is plenty for a 2k-wide ridge.
 */
function fractalLine(rand: () => number, steps: number, roughness: number): number[] {
  let arr = [rand(), rand()];
  let range = 1;
  for (let s = 0; s < steps; s++) {
    const next: number[] = [];
    for (let i = 0; i < arr.length - 1; i++) {
      next.push(arr[i]!);
      next.push((arr[i]! + arr[i + 1]!) / 2 + (rand() - 0.5) * range);
    }
    next.push(arr[arr.length - 1]!);
    arr = next;
    range *= roughness;
  }
  let min = Infinity;
  let max = -Infinity;
  for (const v of arr) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = Math.max(1e-6, max - min);
  return arr.map((v) => (v - min) / span);
}

/** A soft gaussian bump, used to plant dominant peaks into a fractal ridge. */
function bump(x: number, centre: number, width: number): number {
  const d = (x - centre) / width;
  return Math.exp(-d * d * 4);
}

// ---------------------------------------------------------------------------
// Backdrop painting
// ---------------------------------------------------------------------------

export interface PaintedBackdropOptions {
  width?: number;
  height?: number;
  seed?: number;
}

/**
 * A stand-in "Mt. Gagazet — trail near the summit" matte painting.
 *
 * Palette and composition follow `research/visual-bible.md` §2.1: cold
 * high-altitude sky, a low sun band behind the peak, layered blue-grey rock
 * with snow shelves, and a pale snow ledge filling the bottom eighth (the band
 * `Backdrop` crops forward as near ground rock, and the band whose average
 * colour tints the 3D ground so the seam disappears).
 */
export function paintGagazetBackdrop(opts: PaintedBackdropOptions = {}): HTMLCanvasElement {
  const W = opts.width ?? 2048;
  const H = opts.height ?? Math.round((W * 9) / 16);
  const rand = rng(opts.seed ?? 20260915);
  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext('2d')!;

  /*
   * Vertical layout. The 3D ground plane covers everything below roughly
   * v = 0.45 once the distance fog has taken hold, so the whole tonal story —
   * zenith, peaks, the warm horizon band — has to live in the **top 45%**.
   * Everything below 0.76 is the trail itself: never seen directly, but it is
   * the band `Backdrop` samples to tint the 3D ground, so it has to be the
   * right snow colour.
   */
  const SKY_STOPS: Array<[number, string]> = [
    [0.0, '#1b2749'],
    [0.14, '#2f4d87'],
    [0.26, '#5c7cae'],
    [0.34, '#93aacb'],
    [0.395, '#d8cdba'],
    [0.435, '#f2dcb4'],
    [0.5, '#c4ccdb'],
    [0.62, '#a3b3cd'],
    [0.78, '#b3c1d8'],
    [1.0, '#cdd9ec'],
  ];
  const HAZE = hexToRgb('#e3d3ba');
  const SUN = hexToRgb('#ffd79a');

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  for (const [at, hex] of SKY_STOPS) sky.addColorStop(at, hex);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // ---------------------------------------------------------------- the sun
  const sunX = W * 0.265;
  const sunY = H * 0.422;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const wide = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.62);
  wide.addColorStop(0, rgbToCss(SUN, 0.5));
  wide.addColorStop(0.28, rgbToCss(SUN, 0.2));
  wide.addColorStop(1, rgbToCss(SUN, 0));
  ctx.fillStyle = wide;
  ctx.fillRect(0, 0, W, H);

  const core = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.11);
  core.addColorStop(0, 'rgba(255,248,232,0.95)');
  core.addColorStop(0.28, rgbToCss(SUN, 0.5));
  core.addColorStop(1, rgbToCss(SUN, 0));
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, W, H);

  // A flat warm band along the horizon, which is what reads as altitude.
  const band = ctx.createLinearGradient(0, H * 0.33, 0, H * 0.52);
  band.addColorStop(0, rgbToCss(HAZE, 0));
  band.addColorStop(0.45, rgbToCss(HAZE, 0.34));
  band.addColorStop(0.75, rgbToCss(SUN, 0.22));
  band.addColorStop(1, rgbToCss(HAZE, 0));
  ctx.fillStyle = band;
  ctx.fillRect(0, H * 0.33, W, H * 0.2);
  ctx.restore();

  // ------------------------------------------------------------ cloud bands
  for (let i = 0; i < 30; i++) {
    const y = H * (0.06 + rand() * 0.42);
    const x = W * rand();
    const w = W * (0.14 + rand() * 0.44);
    const h = H * (0.005 + rand() * 0.02);
    const warm = clamp(1 - Math.abs(x - sunX) / (W * 0.55), 0, 1);
    const high = clamp(1 - y / (H * 0.45), 0, 1);
    const col = mixRgb(mixRgb(hexToRgb('#9fb3d2'), SUN, warm * 0.6), hexToRgb('#ffffff'), 0.2);
    const g = ctx.createRadialGradient(x, y, 0, x, y, w);
    const a = 0.06 + rand() * 0.12 + warm * 0.1 - high * 0.03;
    g.addColorStop(0, rgbToCss(col, Math.max(0.02, a)));
    g.addColorStop(1, rgbToCss(col, 0));
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, h / w);
    ctx.beginPath();
    ctx.arc(0, 0, w, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- ridges
  interface RidgeSpec {
    baseY: number;
    amp: number;
    colour: string;
    fog: number;
    peaks: Array<[number, number, number]>;
    snow: number;
    roughness: number;
    seed: number;
    strata: number;
  }

  const ridges: RidgeSpec[] = [
    {
      baseY: 0.455,
      amp: 0.2,
      colour: '#8fa2c4',
      fog: 0.78,
      peaks: [
        [0.14, 0.15, 0.62],
        [0.58, 0.2, 0.46],
        [0.9, 0.16, 0.38],
      ],
      snow: 0.75,
      roughness: 0.56,
      seed: 3,
      strata: 40,
    },
    {
      baseY: 0.505,
      amp: 0.23,
      colour: '#6e7b92',
      fog: 0.52,
      peaks: [
        [0.33, 0.13, 0.78],
        [0.79, 0.17, 0.52],
      ],
      snow: 0.85,
      roughness: 0.54,
      seed: 17,
      strata: 70,
    },
    {
      baseY: 0.585,
      amp: 0.2,
      colour: '#4e5a70',
      fog: 0.26,
      peaks: [
        [0.68, 0.16, 0.82],
        [0.05, 0.14, 0.5],
      ],
      snow: 0.6,
      roughness: 0.52,
      seed: 41,
      strata: 90,
    },
    {
      baseY: 0.69,
      amp: 0.12,
      colour: '#3a4456',
      fog: 0.09,
      peaks: [[0.45, 0.3, 0.55]],
      snow: 0.42,
      roughness: 0.5,
      seed: 73,
      strata: 70,
    },
  ];

  const horizonHaze = mixRgb(hexToRgb('#cfd7e4'), HAZE, 0.5);

  for (const spec of ridges) {
    const r = rng(spec.seed);
    const line = fractalLine(r, 7, spec.roughness);
    const n = line.length;
    const ys: number[] = [];
    for (let i = 0; i < n; i++) {
      const x = i / (n - 1);
      let k = line[i]! * 0.5;
      for (const [c, w, hgt] of spec.peaks) k += bump(x, c, w) * hgt;
      ys.push(H * (spec.baseY - k * spec.amp));
    }

    const base = hexToRgb(spec.colour);
    const lit = mixRgb(base, horizonHaze, spec.fog);
    const dark = mixRgb(mixRgb(base, [14, 19, 34], 0.5), horizonHaze, spec.fog * 0.78);

    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let i = 0; i < n; i++) ctx.lineTo((i / (n - 1)) * W, ys[i]!);
    ctx.lineTo(W, H);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, H * (spec.baseY - spec.amp), 0, H * (spec.baseY + 0.16));
    g.addColorStop(0, rgbToCss(lit));
    g.addColorStop(0.4, rgbToCss(mixRgb(lit, dark, 0.5)));
    g.addColorStop(1, rgbToCss(dark));
    ctx.fillStyle = g;
    ctx.fill();

    // Sun-facing faces catch the warm light; the rest stays blue.
    ctx.save();
    ctx.clip();
    const warmSide = ctx.createLinearGradient(0, 0, W * 0.75, 0);
    warmSide.addColorStop(0, rgbToCss(mixRgb(lit, SUN, 0.5), 0.3 * (1 - spec.fog * 0.5)));
    warmSide.addColorStop(0.55, rgbToCss(SUN, 0));
    ctx.fillStyle = warmSide;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Snow shelves under each crest, thicker where the slope is gentle.
    const snowDepth = H * 0.055 * spec.snow;
    const snowTop: number[] = [];
    for (let i = 0; i < n; i++) {
      const prev = ys[Math.max(0, i - 1)]!;
      const next = ys[Math.min(n - 1, i + 1)]!;
      const slope = Math.abs(next - prev) / (W / (n - 1)) / 3;
      snowTop.push(ys[i]! + snowDepth * clamp(1 - slope * 1.7, 0.05, 1));
    }
    ctx.beginPath();
    for (let i = 0; i < n; i++) ctx.lineTo((i / (n - 1)) * W, ys[i]!);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo((i / (n - 1)) * W, snowTop[i]!);
    ctx.closePath();
    const snowCol = mixRgb(hexToRgb('#f2f7ff'), horizonHaze, spec.fog * 0.85);
    const sg = ctx.createLinearGradient(0, H * (spec.baseY - spec.amp), 0, H * (spec.baseY + 0.05));
    sg.addColorStop(0, rgbToCss(snowCol, 0.96));
    sg.addColorStop(1, rgbToCss(mixRgb(snowCol, hexToRgb('#8fa6c8'), 0.65), 0.15));
    ctx.fillStyle = sg;
    ctx.fill();

    // Strata scratches so the fills are not flat.
    ctx.save();
    ctx.globalAlpha = 0.12 * (1 - spec.fog);
    ctx.strokeStyle = rgbToCss(mixRgb(base, [255, 255, 255], 0.4));
    ctx.lineWidth = Math.max(1, W / 1500);
    for (let i = 0; i < spec.strata; i++) {
      const x = rand() * W;
      const idx = clamp(Math.round((x / W) * (n - 1)), 0, n - 1);
      const top = ys[idx]! + snowDepth * 0.85;
      const len = H * (0.015 + rand() * 0.075);
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x + (rand() - 0.5) * W * 0.012, top + len);
      ctx.stroke();
    }
    ctx.restore();

    // Aerial perspective wash on everything painted so far.
    if (spec.fog > 0.05) {
      ctx.save();
      ctx.globalAlpha = spec.fog * 0.26;
      const top = H * (spec.baseY - spec.amp);
      const fw = ctx.createLinearGradient(0, top, 0, H * (spec.baseY + 0.1));
      fw.addColorStop(0, rgbToCss(horizonHaze, 0));
      fw.addColorStop(1, rgbToCss(horizonHaze, 1));
      ctx.fillStyle = fw;
      ctx.fillRect(0, top, W, H * 0.34);
      ctx.restore();
    }
  }

  // ------------------------------------------------------- valley mist band
  // Sits right where the 3D ground fogs out, so the seam is a soft gradient
  // rather than a line.
  ctx.save();
  const mist = ctx.createLinearGradient(0, H * 0.4, 0, H * 0.66);
  mist.addColorStop(0, rgbToCss(horizonHaze, 0));
  mist.addColorStop(0.35, rgbToCss(horizonHaze, 0.5));
  mist.addColorStop(0.7, rgbToCss(mixRgb(horizonHaze, hexToRgb('#b7c4da'), 0.6), 0.55));
  mist.addColorStop(1, rgbToCss(hexToRgb('#b7c4da'), 0));
  ctx.fillStyle = mist;
  ctx.fillRect(0, H * 0.4, W, H * 0.28);
  ctx.restore();

  // --------------------------------------------------- snow ledge (the trail)
  const ledgeTop = H * 0.755;
  const ledge = ctx.createLinearGradient(0, ledgeTop, 0, H);
  ledge.addColorStop(0, 'rgba(160,178,206,0)');
  ledge.addColorStop(0.16, rgbToCss(hexToRgb('#a6b8d4'), 0.92));
  ledge.addColorStop(0.5, rgbToCss(hexToRgb('#c2cfe6')));
  ledge.addColorStop(1, rgbToCss(hexToRgb('#d6e0f0')));
  ctx.fillStyle = ledge;
  ctx.fillRect(0, ledgeTop, W, H - ledgeTop);

  for (let i = 0; i < 46; i++) {
    const y = ledgeTop + (H - ledgeTop) * (0.05 + rand() * 1.0);
    const x = rand() * W;
    const w = W * (0.06 + rand() * 0.22);
    const h = (H - ledgeTop) * (0.03 + rand() * 0.1);
    const pale = rand() > 0.45;
    const col = pale ? hexToRgb('#f2f7ff') : hexToRgb('#8fa6c8');
    const g = ctx.createRadialGradient(x, y, 0, x, y, w);
    g.addColorStop(0, rgbToCss(col, pale ? 0.3 : 0.22));
    g.addColorStop(1, rgbToCss(col, 0));
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, h / w);
    ctx.beginPath();
    ctx.arc(0, 0, w, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Memorial stone and rock outcrops along the trail, per the location sheet.
  const drawOutcrop = (cx: number, cy: number, rw: number, rh: number, seed: number): void => {
    const r = rng(seed);
    const pts = 14;
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const rr = 0.72 + r() * 0.42;
      ctx.lineTo(cx + Math.cos(a) * rw * rr, cy + Math.sin(a) * rh * rr);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(cx, cy - rh, cx, cy + rh);
    g.addColorStop(0, rgbToCss(hexToRgb('#7c8aa6')));
    g.addColorStop(0.4, rgbToCss(hexToRgb('#576480')));
    g.addColorStop(1, rgbToCss(hexToRgb('#2b3446')));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    const sg = ctx.createLinearGradient(cx, cy - rh, cx, cy - rh * 0.1);
    sg.addColorStop(0, 'rgba(242,247,255,0.92)');
    sg.addColorStop(1, 'rgba(242,247,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(cx - rw * 1.4, cy - rh * 1.4, rw * 2.8, rh * 1.6);
    ctx.restore();
  };
  drawOutcrop(W * 0.05, H * 0.97, W * 0.1, H * 0.09, 11);
  drawOutcrop(W * 0.22, H * 1.01, W * 0.08, H * 0.06, 29);
  drawOutcrop(W * 0.94, H * 0.98, W * 0.11, H * 0.085, 53);
  drawOutcrop(W * 0.73, H * 1.02, W * 0.085, H * 0.06, 67);

  ctx.save();
  const mx = W * 0.125;
  const my = H * 0.9;
  const mw = W * 0.022;
  const mh = H * 0.145;
  ctx.beginPath();
  ctx.moveTo(mx - mw, my);
  ctx.lineTo(mx - mw * 0.82, my - mh);
  ctx.lineTo(mx + mw * 0.2, my - mh * 1.06);
  ctx.lineTo(mx + mw, my - mh * 0.1);
  ctx.closePath();
  const mg = ctx.createLinearGradient(mx - mw, my - mh, mx + mw, my);
  mg.addColorStop(0, rgbToCss(hexToRgb('#8b8478')));
  mg.addColorStop(0.55, rgbToCss(hexToRgb('#5e5a54')));
  mg.addColorStop(1, rgbToCss(hexToRgb('#332f2c')));
  ctx.fillStyle = mg;
  ctx.fill();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = 'rgba(227,185,74,0.85)';
  ctx.lineWidth = Math.max(1.5, W / 900);
  for (let i = 0; i < 4; i++) {
    const gy = my - mh * (0.25 + i * 0.18);
    ctx.beginPath();
    ctx.arc(mx, gy, mw * 0.32, 0.4, 0.4 + Math.PI * 1.4);
    ctx.stroke();
  }
  ctx.restore();

  // --------------------------------------------------------- light shafts
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 8; i++) {
    const a = -1.0 + i * 0.24 + rand() * 0.05;
    const len = H * 1.5;
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(a);
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, rgbToCss(SUN, 0.11));
    g.addColorStop(1, rgbToCss(SUN, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, -H * 0.05);
    ctx.lineTo(len, H * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // ------------------------------------------------------ painterly texture
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  for (let i = 0; i < 3000; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const w = W * (0.004 + rand() * 0.018);
    const h = w * (0.16 + rand() * 0.4);
    const light = rand() > 0.5;
    ctx.fillStyle = light ? 'rgba(255,255,255,0.03)' : 'rgba(12,18,36,0.03)';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rand() - 0.5) * 0.7);
    ctx.beginPath();
    ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  return canvas;
}

// ---------------------------------------------------------------------------
// Placeholder figures
// ---------------------------------------------------------------------------

export interface FigureOptions {
  width?: number;
  height?: number;
  seed?: number;
  /** Base body colour. Kept desaturated so it reads as "not final art". */
  tint?: string;
  /** Side the rim light comes from. */
  rimFrom?: 'left' | 'right';
  /** Draws the hatch overlay that marks this as a placeholder. */
  hatch?: boolean;
}

/**
 * A soft grey painted humanoid: the stand-in for a character PNG that has not
 * been generated yet. Deliberately not magenta — it has to sit in a composed
 * frame without wrecking it — but the diagonal hatch makes it unmistakably a
 * placeholder at a glance.
 *
 * Returns a canvas whose figure's feet sit on `baselineY = height * 0.965`.
 */
export function paintPlaceholderFigure(opts: FigureOptions = {}): HTMLCanvasElement {
  const W = opts.width ?? 512;
  const H = opts.height ?? 1024;
  const rand = rng(opts.seed ?? 7);
  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext('2d')!;

  const body = hexToRgb(opts.tint ?? '#6a7386');
  const rimLeft = opts.rimFrom !== 'right';

  const cx = W * 0.5;
  const feet = H * 0.965;
  const headR = W * 0.105;
  const headY = H * 0.105;

  // Silhouette: head, torso, legs, arms, plus a wind-caught cloth edge so the
  // shape has a bit of gesture instead of reading as a mannequin.
  const path = new Path2D();
  path.ellipse(cx, headY, headR * 0.86, headR, 0, 0, Math.PI * 2);

  const torso = new Path2D();
  torso.moveTo(cx - W * 0.055, headY + headR * 0.7);
  torso.lineTo(cx - W * 0.2, H * 0.245); // left shoulder
  torso.quadraticCurveTo(cx - W * 0.235, H * 0.42, cx - W * 0.145, H * 0.52);
  torso.lineTo(cx + W * 0.145, H * 0.52);
  torso.quadraticCurveTo(cx + W * 0.235, H * 0.42, cx + W * 0.2, H * 0.245);
  torso.lineTo(cx + W * 0.055, headY + headR * 0.7);
  torso.closePath();

  const legs = new Path2D();
  legs.moveTo(cx - W * 0.145, H * 0.5);
  legs.lineTo(cx - W * 0.16, H * 0.72);
  legs.lineTo(cx - W * 0.135, feet);
  legs.lineTo(cx - W * 0.025, feet);
  legs.lineTo(cx - W * 0.02, H * 0.68);
  legs.lineTo(cx + W * 0.035, H * 0.68);
  legs.lineTo(cx + W * 0.045, feet);
  legs.lineTo(cx + W * 0.155, feet);
  legs.lineTo(cx + W * 0.17, H * 0.71);
  legs.lineTo(cx + W * 0.145, H * 0.5);
  legs.closePath();

  const arms = new Path2D();
  // trailing arm
  arms.moveTo(cx - W * 0.185, H * 0.26);
  arms.quadraticCurveTo(cx - W * 0.3, H * 0.4, cx - W * 0.265, H * 0.56);
  arms.lineTo(cx - W * 0.205, H * 0.555);
  arms.quadraticCurveTo(cx - W * 0.235, H * 0.41, cx - W * 0.135, H * 0.29);
  arms.closePath();
  // leading arm, held out
  arms.moveTo(cx + W * 0.185, H * 0.26);
  arms.quadraticCurveTo(cx + W * 0.33, H * 0.36, cx + W * 0.36, H * 0.49);
  arms.lineTo(cx + W * 0.3, H * 0.515);
  arms.quadraticCurveTo(cx + W * 0.27, H * 0.4, cx + W * 0.14, H * 0.3);
  arms.closePath();

  const cloth = new Path2D();
  cloth.moveTo(cx + W * 0.14, H * 0.3);
  cloth.quadraticCurveTo(cx + W * 0.34, H * 0.46, cx + W * 0.29, H * 0.68);
  cloth.quadraticCurveTo(cx + W * 0.19, H * 0.6, cx + W * 0.16, H * 0.46);
  cloth.closePath();

  const all = [cloth, arms, legs, torso, path];

  // Base fill with a top-lit vertical gradient.
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, rgbToCss(mixRgb(body, [225, 235, 255], 0.42)));
  g.addColorStop(0.45, rgbToCss(body));
  g.addColorStop(1, rgbToCss(mixRgb(body, [10, 14, 26], 0.55)));
  ctx.fillStyle = g;
  for (const p of all) ctx.fill(p);

  // Rim light down one edge.
  ctx.save();
  const region = new Path2D();
  for (const p of all) region.addPath(p);
  ctx.clip(region);
  const rg = ctx.createLinearGradient(rimLeft ? 0 : W, 0, rimLeft ? W * 0.55 : W * 0.45, 0);
  rg.addColorStop(0, 'rgba(206,228,255,0.85)');
  rg.addColorStop(0.16, 'rgba(206,228,255,0.18)');
  rg.addColorStop(0.45, 'rgba(206,228,255,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);

  // Warm bounce from the ground.
  const bg = ctx.createLinearGradient(0, H, 0, H * 0.55);
  bg.addColorStop(0, 'rgba(255,214,168,0.3)');
  bg.addColorStop(1, 'rgba(255,214,168,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Hatch: the "this is a placeholder" marker.
  if (opts.hatch !== false) {
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = '#dce8ff';
    ctx.lineWidth = Math.max(1, W / 190);
    const step = W * 0.075;
    for (let x = -H; x < W + H; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + H, H);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // Soft outline so the figure separates from the backdrop.
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = 'rgba(12,18,34,0.9)';
  ctx.lineWidth = Math.max(2, W / 150);
  ctx.lineJoin = 'round';
  for (const p of all) ctx.stroke(p);
  ctx.restore();

  // A couple of painterly strokes for texture.
  ctx.save();
  ctx.clip(region);
  ctx.globalCompositeOperation = 'overlay';
  for (let i = 0; i < 260; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const w = W * (0.01 + rand() * 0.05);
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(1.2 + (rand() - 0.5) * 0.5);
    ctx.beginPath();
    ctx.ellipse(0, 0, w, w * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  return canvas;
}

export interface BossSilhouetteOptions {
  width?: number;
  height?: number;
  seed?: number;
  core?: string;
}

/**
 * The boss stand-in: a large dark silhouette with a glowing core, in the shape
 * of a robed, horned figure riding a mechanical under-body (Seymour Flux and
 * the Mortibody, without pretending to be the real painting).
 */
export function paintBossSilhouette(opts: BossSilhouetteOptions = {}): HTMLCanvasElement {
  const W = opts.width ?? 1024;
  const H = opts.height ?? 1280;
  const rand = rng(opts.seed ?? 31);
  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext('2d')!;
  const coreCol = hexToRgb(opts.core ?? '#8affd0');

  const cx = W * 0.5;
  const feet = H * 0.97;

  const body = new Path2D();
  // robe: wide flared base narrowing to the shoulders
  body.moveTo(cx - W * 0.42, feet);
  body.quadraticCurveTo(cx - W * 0.33, H * 0.6, cx - W * 0.17, H * 0.33);
  body.lineTo(cx - W * 0.09, H * 0.25);
  body.lineTo(cx + W * 0.09, H * 0.25);
  body.lineTo(cx + W * 0.17, H * 0.33);
  body.quadraticCurveTo(cx + W * 0.33, H * 0.6, cx + W * 0.42, feet);
  body.closePath();

  // head + collar horns
  const head = new Path2D();
  head.ellipse(cx, H * 0.185, W * 0.075, H * 0.062, 0, 0, Math.PI * 2);

  const horns = new Path2D();
  for (const dir of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x0 = cx + dir * W * (0.07 + i * 0.055);
      const y0 = H * (0.27 - i * 0.012);
      horns.moveTo(x0, y0);
      horns.quadraticCurveTo(
        x0 + dir * W * 0.08,
        y0 - H * (0.09 + i * 0.03),
        x0 + dir * W * 0.03,
        y0 - H * (0.16 + i * 0.045),
      );
      horns.quadraticCurveTo(x0 + dir * W * 0.02, y0 - H * 0.07, x0 - dir * W * 0.015, y0);
      horns.closePath();
    }
  }

  // Mortibody: a hunched mechanical mass at the base
  const under = new Path2D();
  under.ellipse(cx, H * 0.86, W * 0.33, H * 0.13, 0, 0, Math.PI * 2);
  for (let i = 0; i < 6; i++) {
    const a = Math.PI + (i / 5) * Math.PI;
    const x = cx + Math.cos(a) * W * 0.34;
    const y = H * 0.86 + Math.sin(a) * H * 0.1;
    under.moveTo(x, y);
    under.lineTo(x + Math.cos(a) * W * 0.12, y + H * 0.1);
    under.lineTo(x + Math.cos(a) * W * 0.05, feet);
    under.lineTo(x - W * 0.02, y + H * 0.02);
    under.closePath();
  }

  const shapes = [under, body, horns, head];
  const g = ctx.createLinearGradient(0, H * 0.12, 0, feet);
  g.addColorStop(0, 'rgba(38,46,74,1)');
  g.addColorStop(0.45, 'rgba(20,25,44,1)');
  g.addColorStop(1, 'rgba(8,10,20,1)');
  ctx.fillStyle = g;
  for (const s of shapes) ctx.fill(s);

  const region = new Path2D();
  for (const s of shapes) region.addPath(s);

  // Rim light
  ctx.save();
  ctx.clip(region);
  const rl = ctx.createLinearGradient(W, 0, W * 0.5, 0);
  rl.addColorStop(0, 'rgba(180,214,255,0.7)');
  rl.addColorStop(0.2, 'rgba(180,214,255,0.12)');
  rl.addColorStop(0.6, 'rgba(180,214,255,0)');
  ctx.fillStyle = rl;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Glowing core, drawn through the silhouette.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const coreY = H * 0.44;
  const halo = ctx.createRadialGradient(cx, coreY, 0, cx, coreY, W * 0.3);
  halo.addColorStop(0, rgbToCss(coreCol, 0.95));
  halo.addColorStop(0.16, rgbToCss(coreCol, 0.45));
  halo.addColorStop(0.5, rgbToCss(coreCol, 0.1));
  halo.addColorStop(1, rgbToCss(coreCol, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  const inner = ctx.createRadialGradient(cx, coreY, 0, cx, coreY, W * 0.075);
  inner.addColorStop(0, 'rgba(255,255,255,1)');
  inner.addColorStop(0.55, rgbToCss(coreCol, 0.85));
  inner.addColorStop(1, rgbToCss(coreCol, 0));
  ctx.fillStyle = inner;
  ctx.fillRect(0, 0, W, H);

  // Secondary glow in the under-body.
  const u = ctx.createRadialGradient(cx, H * 0.86, 0, cx, H * 0.86, W * 0.24);
  u.addColorStop(0, rgbToCss(coreCol, 0.4));
  u.addColorStop(1, rgbToCss(coreCol, 0));
  ctx.fillStyle = u;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Clip everything back to the silhouette so the halo does not make a square.
  const out = makeCanvas(W, H);
  const octx = out.getContext('2d')!;
  octx.save();
  // Keep a little glow bleeding outside the body: draw a blurred copy first.
  octx.globalAlpha = 0.5;
  octx.filter = `blur(${Math.round(W / 42)}px)`;
  octx.drawImage(canvas, 0, 0);
  octx.filter = 'none';
  octx.globalAlpha = 1;
  octx.restore();
  octx.save();
  octx.clip(region);
  octx.drawImage(canvas, 0, 0);
  octx.restore();

  // Painterly noise inside the silhouette.
  octx.save();
  octx.clip(region);
  octx.globalCompositeOperation = 'overlay';
  for (let i = 0; i < 700; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const w = W * (0.006 + rand() * 0.03);
    octx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
    octx.save();
    octx.translate(x, y);
    octx.rotate((rand() - 0.5) * 1.4);
    octx.beginPath();
    octx.ellipse(0, 0, w, w * 0.22, 0, 0, Math.PI * 2);
    octx.fill();
    octx.restore();
  }
  octx.restore();

  return out;
}

// ---------------------------------------------------------------------------
// Utility canvases
// ---------------------------------------------------------------------------

/**
 * Soft radial blob. `stops` are `[position, value]` pairs.
 *
 * In the default mode the value is written to the **alpha** channel (contact
 * shadows, light pools). With `opaque`, it is written to **luminance** on a
 * black opaque field instead — which is what `THREE.Texture` used as an
 * `alphaMap` actually samples (the green channel), so a gradient alpha map has
 * to be built this way or it comes out as a hard-edged disc.
 */
export function radialCanvas(
  size = 256,
  stops: Array<[number, number]> = [],
  opaque = false,
): HTMLCanvasElement {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  if (opaque) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
  }
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  const list = stops.length ? stops : ([[0, 1], [0.42, 0.62], [0.72, 0.18], [1, 0]] as Array<[number, number]>);
  for (const [at, a] of list) {
    if (opaque) {
      const v = Math.round(clamp(a, 0, 1) * 255);
      g.addColorStop(at, `rgb(${v},${v},${v})`);
    } else {
      g.addColorStop(at, `rgba(255,255,255,${a})`);
    }
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

/** Value-noise canvas used as a dissolve mask. */
export function noiseCanvas(size = 256, seed = 5, octaves = 4): HTMLCanvasElement {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const rand = rng(seed);
  const grids: number[][] = [];
  const sizes: number[] = [];
  for (let o = 0; o < octaves; o++) {
    const n = 4 << o;
    sizes.push(n);
    const g: number[] = new Array(n * n);
    for (let i = 0; i < n * n; i++) g[i] = rand();
    grids.push(g);
  }
  const sample = (g: number[], n: number, x: number, y: number): number => {
    const fx = x * n;
    const fy = y * n;
    const x0 = Math.floor(fx) % n;
    const y0 = Math.floor(fy) % n;
    const x1 = (x0 + 1) % n;
    const y1 = (y0 + 1) % n;
    const tx = fx - Math.floor(fx);
    const ty = fy - Math.floor(fy);
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const a = g[y0 * n + x0]! + (g[y0 * n + x1]! - g[y0 * n + x0]!) * sx;
    const b = g[y1 * n + x0]! + (g[y1 * n + x1]! - g[y1 * n + x0]!) * sx;
    return a + (b - a) * sy;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0;
      let amp = 0.5;
      let norm = 0;
      for (let o = 0; o < octaves; o++) {
        v += sample(grids[o]!, sizes[o]!, x / size, y / size) * amp;
        norm += amp;
        amp *= 0.5;
      }
      const n = Math.round((v / norm) * 255);
      const i = (y * size + x) * 4;
      img.data[i] = n;
      img.data[i + 1] = n;
      img.data[i + 2] = n;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Soft drifting cloud sheet with alpha, for the fog plane stack. */
export function cloudCanvas(size = 512, seed = 9): HTMLCanvasElement {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  const rand = rng(seed);
  ctx.clearRect(0, 0, size, size);
  for (let i = 0; i < 90; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = size * (0.05 + rand() * 0.22);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const a = 0.05 + rand() * 0.14;
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(0.5, `rgba(255,255,255,${a * 0.4})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.34 + rand() * 0.3);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  return c;
}

/**
 * Painterly snow/stone ground. Mostly luminance: the scene tints it with the
 * colour sampled from the backdrop painting so the seam disappears.
 */
export function groundCanvas(size = 1024, seed = 13): HTMLCanvasElement {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  const rand = rng(seed);
  ctx.fillStyle = '#dfe7f2';
  ctx.fillRect(0, 0, size, size);

  // Wind-drift bands.
  for (let i = 0; i < 70; i++) {
    const y = rand() * size;
    const x = rand() * size;
    const w = size * (0.15 + rand() * 0.45);
    const h = size * (0.01 + rand() * 0.05);
    const pale = rand() > 0.42;
    const g = ctx.createRadialGradient(x, y, 0, x, y, w);
    g.addColorStop(0, pale ? 'rgba(255,255,255,0.5)' : 'rgba(126,144,180,0.42)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, h / w);
    ctx.beginPath();
    ctx.arc(0, 0, w, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Wind-carved sastrugi: long soft ridges with a bright lip and a blue trough.
  for (let i = 0; i < 120; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = size * (0.04 + rand() * 0.14);
    const th = size * (0.004 + rand() * 0.008);
    const a = -0.35 + rand() * 0.7;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, len, th, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${(0.18 + rand() * 0.2).toFixed(3)})`;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, th * 2.2, len * 0.9, th * 0.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(122,142,180,${(0.1 + rand() * 0.12).toFixed(3)})`;
    ctx.fill();
    ctx.restore();
  }

  // A handful of stones poking through the snow — sparse, so the tiling of the
  // texture never becomes readable as a repeat.
  for (let i = 0; i < 48; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = size * (0.003 + rand() * 0.009);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rand() * Math.PI);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * (0.4 + rand() * 0.4), 0, 0, Math.PI * 2);
    const shade = 0.42 + rand() * 0.3;
    ctx.fillStyle = `rgba(${Math.round(128 * shade)},${Math.round(140 * shade)},${Math.round(
      166 * shade,
    )},${(0.3 + rand() * 0.3).toFixed(3)})`;
    ctx.fill();
    // a snow shoulder on the upwind side
    ctx.beginPath();
    ctx.ellipse(-r * 0.4, -r * 0.5, r * 0.9, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
    ctx.restore();
  }

  // Fine grain.
  ctx.globalCompositeOperation = 'overlay';
  for (let i = 0; i < 4200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(50,64,96,0.05)';
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  return c;
}
