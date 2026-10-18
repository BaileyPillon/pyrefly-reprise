/**
 * **The hi-DPI masters of a painting** (pose continuity, repair of 2026-10-17; both games): `<pose>@2x.png`, `@3x.png` and `@4x.png` sit beside the 1x master and the
 * game draws them from 1440p up and on hi-DPI screens (`src/engine/ArtTier.ts`), with the 1x painting's sidecar and registration. `tools/hires-install.mjs` adds them
 * only beside a 1x file with the sha256 it rendered them from, at exactly N times its size. Nothing checked that afterwards: replace the 1x painting and the old
 * `@2x` stays (the installer left it), so the next hi-DPI player saw the OLD painting at the NEW registration, and the gate was green.
 *
 * What is checked, for every `@Nx` that exists:
 *   - its size is exactly N times the 1x painting's (`hires-size`; the header only, cheap, for all three tiers);
 *   - for `@2x`, its silhouette is the 1x painting's: the alpha above 128, taken down to the 1x size, overlaps the 1x alpha by at least {@link MIN_IOU}
 *     (`hires-differs`). `@3x` and `@4x` are derived from the same library render, so one decoded tier is the sample (a decode of a `@4x` is three times the work).
 * Pure reading: nothing is written.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

/** The overlap the downscaled `@2x` must have with the 1x painting. An honest 2x upscale of the same figure reads 0.97 to 1.00; a different painting reads far less. */
export const MIN_IOU = 0.95;
export const TIERS = Object.freeze([2, 3, 4]);

/** `[n, path]` of the hi-res masters that exist beside `<dir>/<pose>.png`. */
export function hiresFiles(dir, pose) {
  return TIERS.map((n) => [n, join(dir, `${pose}@${n}x.png`)]).filter(([, p]) => existsSync(p));
}

/**
 * Check the hi-res masters of one painting against its 1x master.
 * @param {string} dir the subject's folder @param {string} pose
 * @param {{W:number,H:number,mask:Uint8Array}} one the 1x painting as `readPaint` read it
 * @returns {Promise<Array<{code: 'hires-size'|'hires-differs'|'hires-unreadable', tier: number, message: string}>>}
 */
export async function checkHires(dir, pose, one) {
  const problems = [];
  for (const [n, path] of hiresFiles(dir, pose)) {
    let meta;
    try { meta = await sharp(path).metadata(); } catch (e) {
      problems.push({ code: 'hires-unreadable', tier: n, message: `${pose}@${n}x.png does not decode (${e instanceof Error ? e.message.split('\n')[0] : String(e)})` });
      continue;
    }
    if (meta.width !== one.W * n || meta.height !== one.H * n) {
      problems.push({ code: 'hires-size', tier: n, message: `${pose}@${n}x.png is ${meta.width} x ${meta.height}, not ${n} x the ${one.W} x ${one.H} painting (a different painting, or the 1x was replaced and this master was left behind)` });
      continue;
    }
    if (n !== 2) continue;
    try {
      const { data } = await sharp(path).ensureAlpha().extractChannel(3).resize(one.W, one.H, { fit: 'fill', kernel: 'linear' }).raw().toBuffer({ resolveWithObject: true });
      let inter = 0;
      let union = 0;
      for (let i = 0; i < one.mask.length; i++) {
        const a = one.mask[i] === 1;
        const b = data[i] > 128;
        if (a && b) inter++;
        if (a || b) union++;
      }
      const iou = union ? inter / union : 1;
      if (iou < MIN_IOU) problems.push({ code: 'hires-differs', tier: n, message: `${pose}@${n}x.png is not the 1x painting at twice the size (its silhouette overlaps the 1x by ${iou.toFixed(2)}, not ${MIN_IOU}): the 1x master was replaced and this one left behind` });
    } catch (e) {
      problems.push({ code: 'hires-unreadable', tier: n, message: `${pose}@${n}x.png does not decode (${e instanceof Error ? e.message.split('\n')[0] : String(e)})` });
    }
  }
  return problems;
}
