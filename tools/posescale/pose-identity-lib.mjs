/**
 * **Is this the same figure?** The identity measure of the pose-continuity method check (section 3.5; PR-0517; pc-residues lane, 2026-10-28; both games).
 *
 * The install gates measure a painting's overlap, head and feet. Nothing measured *who it is*: Paine Warrior's ready painting draws a sleeveless white top, a red sash and silver
 * heels where her idle wears a black jacket and boots. A repaint "locked to the idle" can keep the outline and lose the costume (the GPU repaint keeps identity in about one seed of
 * three, backlog V-06). This is the missing measure, written before any render, and it is the one the method check names: the colour distance per body region against the idle,
 * with the figure's own approved poses as the ceiling.
 *
 * **The regions.** Down the figure, anatomically, so a crouch or a lunge compares like with like: the HEAD (the registered head box grown by half a head upward for hair and a quarter
 * downward for the neck), the BODY (from there to half way to the soles) and the LEGS (from there to the soles). A painting with no registered head and feet row (the hidden chapter's
 * copies) is cut by the silhouette's height instead (top fifth, next 35 percent, the rest). A figure's whole silhouette is read too and reported, never judged (a costume change that
 * keeps the palette moves a region and not the whole).
 *
 * **The distance.** In each region the solid pixels' colours (CIE L*a*b*, D65) are compared as DISTRIBUTIONS, not as means: the sliced Wasserstein-1 distance (24 fixed directions of the
 * colour space, 32 quantiles each; a delta-E-sized number: the mean colour distance the pixels would have to travel). A mean hides a white top over black boots; a distribution does not.
 * The distance of two paintings is the worst region.
 *
 * **The ceiling.** A pose may differ from the idle by as much as the figure's own attack does (the approved painting of the same figure in a dynamic pose, the ceiling the method check names: lighting, motion,
 * a sleeve fold, what shows when a body turns), per region, never less than {@link MIN_CEILING} (the measure's noise floor). A ready painting that is {@link FAIL_RATIO} times over that
 * ceiling in any region reads as another figure and FAILS; {@link WATCH_RATIO} times is reported. The figure's other poses are reported beside it (`ceilingAny`), never judged.
 *
 * What it can and cannot say (the tests and `docs/handoff/pc-residues.md` give the numbers): a costume the palette of which is the idle's (Rikku Dark Knight's ready: dark armour, the same
 * gold, a different hair colour) moves no region more than her other poses do and PASSES; whether such a painting still reads as a paler figure on the screen is the picture's, not this
 * measure's. Pure: plain numbers and typed arrays in, plain numbers out. `tools/pose-identity.mjs` reads the files.
 */

/** Pixels count only above this alpha (0 to 255): the soft edge of a cutout carries the backdrop it was cut from. */
export const SOLID_ALPHA = 250;
/** The lowest ceiling a region may have: the measure's noise floor (two paintings of one costume in two poses never differ by less than a few units from shading alone). */
export const MIN_CEILING = 6;
/**
 * How far over its ceiling a region must be to count (the ratio of the ready's distance to the attack's, the attack floored at {@link MIN_CEILING}). FAIL (2.5): the painting reads as another figure
 * and the engine holds the idle through the wind-up. WATCH (1.5): over the ceiling, reported, nothing held. Calibrated on the 47 ready paintings of the FFX and FFX-2 casts looked at by eye
 * (`docs/handoff/pc-residues.md`): the three that read as another figure (Paine Warrior's white top, Yuna White Mage's hood down against a hood up, Rikku Warrior's hair) read 2.7 to 3.1; the
 * next, which drift (Paine Thief's hair colour, Rikku Berserker's mane, Paine Songstress's cape), 2.2 to 2.3; there is no painting between 2.3 and 2.7.
 */
export const FAIL_RATIO = 2.5;
export const WATCH_RATIO = 1.5;
/** A region with fewer solid pixels than this is not read (a region the pose does not reach). */
export const MIN_PIXELS = 300;
/** The regions, in order. */
export const REGIONS = ['head', 'body', 'legs'];
/** Where a silhouette with no registered anatomy is cut: fractions of its height from the top. */
export const FALLBACK_CUTS = [0.2, 0.55];
/** How the head box is grown into the head region, in heads: up (hair), down (neck). */
export const HEAD_GROW = { up: 0.5, down: 0.25 };

const DIRECTIONS = (() => {
  const out = [];
  const n = 24;
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), t = i * 2.399963229728653; // a Fibonacci sphere: fixed, so a number never moves between runs
    out.push([Math.cos(t) * r, y, Math.sin(t) * r]);
  }
  return out;
})();
const QUANTILES = 32;

const srgbToLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const labF = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);

/** sRGB bytes to CIE L*a*b* (D65), `[L, a, b]`. */
export function rgbToLab(r, g, b) {
  const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
  const x = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047;
  const y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B;
  const z = (0.0193339 * R + 0.119192 * G + 0.9503041 * B) / 1.08883;
  const fx = labF(x), fy = labF(y), fz = labF(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/**
 * The silhouette's vertical extent from the alpha channel: the first and last row that holds at least `minRun` solid pixels (a stray speck, a floating spark, does not move the top).
 * @param {{data: ArrayLike<number>, w: number, h: number}} img RGBA, row-major
 */
export function verticalExtent(img, minRun = 3) {
  const { data, w, h } = img;
  let top = -1, base = -1;
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] >= SOLID_ALPHA) n++;
    if (n >= minRun) {
      if (top < 0) top = y;
      base = y;
    }
  }
  return top < 0 ? null : { top, base };
}

/**
 * The rows of the three regions in an image: `{ head: [y0, y1], body: [...], legs: [...], by: 'registration' | 'silhouette' }`, or null for an empty painting.
 * `geometry` (optional): the registered `head` box `[x0, y0, x1, y1]` and the `feetRow`, in THIS image's pixels.
 */
export function regionRows(img, geometry = null) {
  const ext = verticalExtent(img);
  if (!ext) return null;
  const head = geometry?.head, feet = geometry?.feetRow;
  if (head && Number.isFinite(feet) && head[3] > head[1] && feet > head[3]) {
    const hh = head[3] - head[1];
    const y0 = Math.max(ext.top, head[1] - HEAD_GROW.up * hh), y1 = head[3] + HEAD_GROW.down * hh;
    const mid = y1 + 0.5 * (feet - y1);
    return { head: [y0, y1], body: [y1, mid], legs: [mid, Math.min(img.h, feet + 4)], by: 'registration' };
  }
  const span = ext.base - ext.top + 1;
  const c0 = ext.top + FALLBACK_CUTS[0] * span, c1 = ext.top + FALLBACK_CUTS[1] * span;
  return { head: [ext.top, c0], body: [c0, c1], legs: [c1, ext.base + 1], by: 'silhouette' };
}

/** The solid pixels' Lab colours of rows `[y0, y1)`, every `step`-th pixel (a fixed stride: deterministic). */
function labSamples(img, y0, y1, step = 2) {
  const { data, w, h } = img;
  const out = [];
  for (let y = Math.max(0, Math.floor(y0)); y < Math.min(h, Math.ceil(y1)); y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < SOLID_ALPHA) continue;
      out.push(rgbToLab(data[i], data[i + 1], data[i + 2]));
    }
  }
  return out;
}

const quantiles = (pts, d) => {
  const p = new Float64Array(pts.length);
  for (let i = 0; i < pts.length; i++) p[i] = pts[i][0] * d[0] + pts[i][1] * d[1] + pts[i][2] * d[2];
  p.sort();
  const q = new Float64Array(QUANTILES);
  for (let k = 0; k < QUANTILES; k++) q[k] = p[Math.round(((k + 0.5) / QUANTILES) * (p.length - 1))];
  return q;
};

/** What a painting's regions hold: the Lab samples of each region (and of the whole figure), with the quantile profiles the distance compares, computed once. */
export function readRegions(img, geometry = null) {
  const rows = regionRows(img, geometry);
  if (!rows) return { by: null, regions: Object.fromEntries([...REGIONS, 'whole'].map((r) => [r, null])) };
  const ext = verticalExtent(img);
  const regions = {};
  for (const id of REGIONS) regions[id] = profile(labSamples(img, ...rows[id]));
  regions.whole = profile(labSamples(img, ext.top, ext.base + 1, 3));
  return { by: rows.by, regions };
}

function profile(pts) {
  if (pts.length < MIN_PIXELS / 4) return null; // the stride keeps a quarter of the pixels
  let L = 0;
  for (const p of pts) L += p[0];
  return { n: pts.length * 4, meanL: L / pts.length, q: DIRECTIONS.map((d) => quantiles(pts, d)) };
}

/** The sliced Wasserstein-1 distance of two region profiles (a delta-E-sized number), or null when either is unread. */
export function regionDistance(p, q) {
  if (!p || !q) return null;
  let s = 0;
  for (let d = 0; d < DIRECTIONS.length; d++) {
    let m = 0;
    for (let k = 0; k < QUANTILES; k++) m += Math.abs(p.q[d][k] - q.q[d][k]);
    s += m / QUANTILES;
  }
  return s / DIRECTIONS.length;
}

const r2 = (v) => (v === null || v === undefined ? null : Math.round(v * 100) / 100);

/** Per-region distances of two paintings' readings (`readRegions` results) and the worst of the three judged regions; the whole figure is reported beside them. */
export function identityDistance(a, b) {
  const per = {};
  let worst = null;
  for (const id of [...REGIONS, 'whole']) {
    const d = regionDistance(a.regions[id], b.regions[id]);
    per[id] = r2(d);
    if (id !== 'whole' && d !== null && (worst === null || d > worst)) worst = d;
  }
  return { per, worst: r2(worst) };
}

/**
 * Judge one pose against the figure's idle, the attack as the ceiling (the method check's words).
 * @param {{idle: object, pose: object, attack?: object|null, others?: object[]}} o `readRegions` results. `others` are the figure's other approved standing poses (hurt, follow, cast, item, defend,
 *   victory, critical): REPORTED as `ceilingAny` (the largest distance of any of them), never judged: a figure's other poses can themselves wander, and a ceiling made of them lets the
 *   odd one out pass (Paine Warrior's ready is 3.1 times her attack's distance and 0.98 of her widest pose's)
 * @returns {{distance: IdentityDistance, ceiling: Record<string, number>, ceilingAny: Record<string, number|null>, ratio: number|null, over: string[], verdict: 'pass'|'watch'|'fail'|'unread', pass: boolean, unread: boolean}}
 *   `ceiling`: per region, the attack's distance from the idle floored at {@link MIN_CEILING}; `ratio`: the worst region's distance over its ceiling; `over`: the regions over {@link WATCH_RATIO} times
 *   their ceilings; `verdict`: `fail` at {@link FAIL_RATIO} (and only where the regions were cut by the registration: a coarse silhouette cut can at most watch), `watch` at {@link WATCH_RATIO}
 */
export function judgeIdentity({ idle, pose, attack = null, others = [] }) {
  const distance = identityDistance(idle, pose);
  const att = attack ? identityDistance(idle, attack) : null;
  const rest = others.filter(Boolean).map((r) => identityDistance(idle, r));
  const ceiling = {}, ceilingAny = {};
  const over = [];
  let ratio = null;
  for (const id of REGIONS) {
    const c = Math.max(MIN_CEILING, att?.per[id] ?? 0);
    ceiling[id] = r2(c);
    ceilingAny[id] = rest.length || att ? r2(Math.max(MIN_CEILING, att?.per[id] ?? 0, ...rest.map((r) => r.per[id] ?? 0))) : null;
    const d = distance.per[id];
    if (d === null || d === undefined) continue;
    const q = d / c;
    if (ratio === null || q > ratio) ratio = q;
    if (q >= WATCH_RATIO) over.push(id);
  }
  const unread = distance.worst === null;
  const verdict = unread ? 'unread' : ratio >= FAIL_RATIO && pose.by === 'registration' && idle.by === 'registration' ? 'fail' : ratio >= WATCH_RATIO ? 'watch' : 'pass';
  return { distance, ceiling, ceilingAny, ratio: r2(ratio), over, verdict, pass: verdict === 'pass' || verdict === 'watch', unread };
}

/** @typedef {{per: Record<string, number|null>, worst: number|null}} IdentityDistance */
