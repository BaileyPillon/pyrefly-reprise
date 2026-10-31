#!/usr/bin/env node
/**
 * THE SKY READ of the Farplane's two plates (release 71, branch `booth-ffx2-b4-sky`; FFX-2 only: Chapter V `ffx2-vegnagun-shuyin`, Chapter XI `ffx2-fallen-aeons`; `docs/handoff/booth-ffx2-b4-sky.md`).
 *
 * The number the lift of the held look is judged by, read from stills with no browser: for each PNG the mean luma and the share of pixels over 240 and over 235 of the WHOLE frame (the r70 lanes' own formula, Rec. 709 weights on the
 * 8-bit values, so the numbers match `docs/handoff/booth-b3.md` section 12: Chapter V's first menu at 2560 x 1440 reads 101.5 and 2.66 percent on release 69, 126.6 and 13.52 on the r70 build) and of the SKY BAND (the part of the frame above
 * the party that no HUD panel of either build covers, so the old HUD's pale buttons and the F1 slab do not count). The band is named in frame fractions: Chapter V x 0.27 to 0.62, y 0.14 to 0.42; Chapter XI x 0.27 to 0.52, y 0.14 to 0.42.
 *
 *   node tools/sky-plate-read.mjs <v|xi> <still.png> [<still.png> ...]
 *   node tools/sky-plate-read.mjs <v|xi> --json <still.png> ...     one JSON line per still
 *
 * The lift of the `hd2d` and `arena` holds (`PieceHolds.ts`) reads "under 3 percent of pixels over 240 on the Farplane plates": judge it on the band's `over240` here, against release 69's own band (Chapter V: 179.5 mean, 0.2 percent),
 * since the whole frame of Chapter XI already reads 3.14 percent on release 69 (its old HUD's pale buttons). Exit 0 always (a measuring tool); it never writes a file.
 *
 * Game case: FFX-2 only (the two chapters named above). Pure but for the PNG decode (`sharp`).
 */
import { pathToFileURL } from 'node:url';

/** The sky band of each chapter, in frame fractions (x0, x1, y0, y1). */
export const BANDS = Object.freeze({
  v: Object.freeze({ id: 'ffx2-vegnagun-shuyin', x0: 0.27, x1: 0.62, y0: 0.14, y1: 0.42 }),
  xi: Object.freeze({ id: 'ffx2-fallen-aeons', x0: 0.27, x1: 0.52, y0: 0.14, y1: 0.42 }),
});

/** Rec. 709 luma of one 8-bit pixel. */
export const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/**
 * Mean luma and the share of pixels over 240 and over 235 (percent) of a region of an RGB(A) frame: `data` is the decoded bytes, `channels` 3 or 4, the region the half-open pixel rectangle [x0, x1) x [y0, y1). Pure.
 * Returns `{ pixels, mean, over240, over235 }` (zeroes for an empty region).
 */
export function regionStats(data, width, channels, x0, x1, y0, y1) {
  let n = 0;
  let sum = 0;
  let o240 = 0;
  let o235 = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * channels;
      const l = luma(data[i], data[i + 1], data[i + 2]);
      sum += l;
      if (l > 240) o240++;
      if (l > 235) o235++;
      n++;
    }
  }
  if (n === 0) return { pixels: 0, mean: 0, over240: 0, over235: 0 };
  return { pixels: n, mean: sum / n, over240: (100 * o240) / n, over235: (100 * o235) / n };
}

/** The whole-frame and the sky-band statistics of one decoded frame for a chapter key (`v` or `xi`). Pure. */
export function skyRead(data, width, height, channels, key) {
  const b = BANDS[key];
  if (!b) throw new Error(`unknown chapter key "${key}" (v or xi)`);
  return {
    chapter: b.id,
    size: `${width}x${height}`,
    frame: regionStats(data, width, channels, 0, width, 0, height),
    band: regionStats(data, width, channels, Math.floor(b.x0 * width), Math.floor(b.x1 * width), Math.floor(b.y0 * height), Math.floor(b.y1 * height)),
  };
}

const fmt = (s) => `mean ${s.mean.toFixed(1)}, over 240 ${s.over240.toFixed(2)}%, over 235 ${s.over235.toFixed(2)}%`;

async function main(argv) {
  const json = argv.includes('--json');
  const args = argv.filter((a) => a !== '--json');
  const key = (args[0] ?? '').toLowerCase();
  const files = args.slice(1);
  if (!BANDS[key] || files.length === 0) {
    console.error('usage: node tools/sky-plate-read.mjs <v|xi> [--json] <still.png> [<still.png> ...]');
    return;
  }
  const { default: sharp } = await import('sharp');
  for (const f of files) {
    const { data, info } = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const r = skyRead(data, info.width, info.height, info.channels, key);
    if (json) console.log(JSON.stringify({ file: f, ...r }));
    else console.log(`${f}\n  ${r.chapter} ${r.size}\n  whole frame: ${fmt(r.frame)}\n  sky band:    ${fmt(r.band)}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main(process.argv.slice(2));
