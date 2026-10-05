// Continuity harness: what a painting says about where its head and its feet are.
//
// Two sources for the anchors CHK-026 measures, and each measurement says which one it used:
//   registration  the owner-reviewed pose registration (docs/target/pose-measure.json, tools/posescale/): a head box and a
//                 stance for every pose of a character, read against rulers. Used where it exists and is not stale.
//   silhouette    read here from the painting's own alpha. The STANCE is the middle of the lowest thick part of the
//                 silhouette (the registration's own automatic rule, `stance_from_hem`): against the 333 standing poses
//                 whose stance is on record it is within 0.11 percent of the painting's height at the median, 0.40 at the
//                 90th percentile (about 1.4 px on screen) and 0.60 at the 95th, with 7 outliers of more than 2 percent
//                 where a thick weapon hangs lowest. The HEAD cannot be read from a silhouette: a neck-and-bulge
//                 estimator was tried against the reviewed head boxes of 37 poses and was wrong by 22 percent at the
//                 median and 50 percent at the 90th percentile (and found no neck in 18 of the 37), because the painter
//                 inflates a head independently of the body. So where a pose has no registration the figure's size is
//                 its MASS (the square root of the area its opened silhouette fills, on screen), the measurement is marked
//                 `metric: 'mass'`, and it is judged against the wide tolerance (`continuity.size.*Coarse`). The mass
//                 tracks a whole-figure jump (a pose painted at two thirds of the idle) and is only half as sensitive to a
//                 head that is inflated alone: on the 28 poses that have a registered head, mass ratios ran 0.73 to 1.12
//                 where the head agreed with the idle's within 10 percent (so 30 percent is the narrowest tolerance with no
//                 false alarm there), and the mass was off by more than 25 percent for only 3 of the 9 poses whose head was.
//                 A bounding box was tried first and rejected: one raised greatsword doubles it. A head and a mass are never
//                 compared with each other.
//
// Everything is in the painting's normalised coordinates (u across from the left, t down from the top, 0..1), so a 1x
// master, a 2x master and the shipped WebP of either give the same answer.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

/** The alpha of an image as a binary mask on a grid at most `maxSide` on its long side (aspect kept). */
export async function decodeMask(buffer, maxSide = 320) {
  const meta = await sharp(buffer, { failOn: 'none' }).metadata();
  const sw = meta.width ?? 0, sh = meta.height ?? 0;
  if (!sw || !sh) throw new Error('image has no size');
  const k = Math.min(1, maxSide / Math.max(sw, sh));
  const w = Math.max(8, Math.round(sw * k)), h = Math.max(8, Math.round(sh * k));
  const { data } = await sharp(buffer, { failOn: 'none' }).ensureAlpha().extractChannel(3).resize(w, h, { fit: 'fill', kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  const bits = new Uint8Array(w * h);
  for (let i = 0; i < bits.length; i++) bits[i] = data[i] >= 128 ? 1 : 0;
  return { w, h, bits, srcW: sw, srcH: sh };
}

const rowCount = (m, y) => { let n = 0; for (let x = 0; x < m.w; x++) n += m.bits[y * m.w + x]; return n; };

/** First and last row that holds any solid pixel, or null for an empty mask. */
export function bboxRows(m) {
  let t = -1, b = -1;
  for (let y = 0; y < m.h; y++) if (rowCount(m, y) > 0) { if (t < 0) t = y; b = y; }
  return t < 0 ? null : { top: t, bottom: b + 1 };
}

/** The mask with its thin parts (blades, staffs, tails, hair wisps) taken away: an opening by a disc of radius `r`. */
export function openMask(m, r) {
  r = Math.max(1, Math.round(r));
  const off = [];
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) off.push([dx, dy]);
  const erode = new Uint8Array(m.w * m.h);
  for (let y = 0; y < m.h; y++) {
    for (let x = 0; x < m.w; x++) {
      if (!m.bits[y * m.w + x]) continue;
      let ok = 1;
      for (const [dx, dy] of off) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= m.w || yy >= m.h || !m.bits[yy * m.w + xx]) { ok = 0; break; }
      }
      erode[y * m.w + x] = ok;
    }
  }
  const out = new Uint8Array(m.w * m.h);
  for (let y = 0; y < m.h; y++) {
    for (let x = 0; x < m.w; x++) {
      if (!erode[y * m.w + x]) continue;
      for (const [dx, dy] of off) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < m.w && yy < m.h) out[yy * m.w + xx] = 1;
      }
    }
  }
  return { ...m, bits: out };
}

/**
 * Where the figure stands: the middle of the lowest thick part of the silhouette (`stance_from_hem` of
 * tools/posescale/ps_lib.py: boots or a hem, a blade's tip or a tail opened away). Normalised; null for an empty mask.
 */
export function estimateStance(m) {
  const bb = bboxRows(m);
  if (!bb) return null;
  const o = openMask(m, 0.02 * (bb.bottom - bb.top));
  let fb = -1;
  for (let y = 0; y < o.h; y++) if (rowCount(o, y) >= 2) fb = y;
  if (fb < 0) return null;
  const band = Math.max(2, Math.round(0.03 * (bb.bottom - bb.top)));
  let lo = Infinity, hi = -Infinity;
  for (let y = Math.max(0, fb - band); y <= fb; y++) for (let x = 0; x < o.w; x++) if (o.bits[y * o.w + x]) { lo = Math.min(lo, x); hi = Math.max(hi, x + 1); }
  if (!Number.isFinite(lo)) return null;
  return { u: ((lo + hi) / 2) / m.w, t: (fb + 1) / m.h };
}

/**
 * The figure's mass: the fraction of the painting that its opened silhouette fills (thin blades, staffs and wisps taken away).
 * The square root of this times the plane's size on screen is how big the figure is drawn; it is what a figure with no
 * registration is measured by (see the header). Null for an empty mask.
 */
export function estimateMass(m) {
  const bb = bboxRows(m);
  if (!bb) return null;
  const o = openMask(m, 0.02 * (bb.bottom - bb.top));
  let n = 0;
  for (let i = 0; i < o.bits.length; i++) n += o.bits[i];
  return n > 0 ? n / (m.w * m.h) : null;
}

// ------------------------------------------------------------------ the registration records

/** The registration records file, or null when there is none. `subjects[subject].poses[pose]` = { head, size, stance, prone, ... }. */
export function loadPoseMeasure(path) {
  if (!path) return null;
  try {
    const raw = readFileSync(path);
    const json = JSON.parse(raw.toString('utf8'));
    return { path, sha256: createHash('sha256').update(raw).digest('hex'), subjects: json.subjects ?? {}, count: Object.keys(json.subjects ?? {}).length };
  } catch {
    return null;
  }
}

/** `/art/characters/tidus/attack@2x.webp?v=1` -> { subject: 'tidus', pose: 'attack' }, or null (not a character painting). */
export function subjectPoseOf(url) {
  const m = /\/art\/characters\/([^/]+)\/([^/.?#]+)\.(?:png|webp)(?:[?#].*)?$/i.exec(String(url));
  return m ? { subject: m[1], pose: m[2].replace(/@\d+x$/i, '') } : null;
}

/**
 * The anchors of one painting. A fresh registration record wins (head box and stance as the reviewers read them);
 * otherwise the silhouette's estimate. A record whose picture has another shape than the painting drawn is stale and
 * is not used. Always returns the mask, which the outline jump needs whatever the anchors came from.
 */
export function anchorsFor({ url, mask, measure }) {
  const sp = subjectPoseOf(url);
  const rec = sp ? measure?.subjects?.[sp.subject]?.poses?.[sp.pose] : null;
  const aspect = mask.srcW / mask.srcH;
  const fresh = Boolean(rec) && Array.isArray(rec.size) && rec.size[1] > 0 && Math.abs(rec.size[0] / rec.size[1] / aspect - 1) < 0.01;
  // Lying down: the registration says so (a lunge is wider than tall and still standing), else the engine's own aspect test.
  const out = {
    subject: sp?.subject ?? null, pose: sp?.pose ?? null, mask, stale: Boolean(rec) && !fresh,
    prone: fresh ? Boolean(rec.prone) && !rec.standing : mask.srcW > mask.srcH * 1.15,
    head: null, mass: estimateMass(mask), stance: null, stanceSrc: null,
  };
  if (fresh && Array.isArray(rec.head) && rec.head.length === 4) {
    const [w, h] = rec.size;
    out.head = { u0: rec.head[0] / w, t0: rec.head[1] / h, u1: rec.head[2] / w, t1: rec.head[3] / h };
  }
  if (fresh && rec.stance && Number.isFinite(rec.stance.x) && Number.isFinite(rec.stance.row)) {
    out.stance = { u: rec.stance.x / rec.size[0], t: rec.stance.row / rec.size[1] };
    out.stanceSrc = 'registration';
  }
  if (!out.stance) {
    const st = estimateStance(mask);
    if (st) Object.assign(out, { stance: st, stanceSrc: 'silhouette' });
  }
  return out;
}
