#!/usr/bin/env node
/**
 * De-fringes a cut-out layer PNG's soft alpha edge: replaces the RGB of every
 * partially-transparent pixel with colour extended in from the nearest fully
 * opaque pixels, leaving alpha untouched. Fixes a "light halo at the cut
 * edge" defect (rig-cut.py's polygon-mask cuts leave a soft alpha border
 * whose *colour* was never re-extended from the true opaque content, so a
 * pixel at alpha=40 keeps whatever RGB the source had there — commonly a
 * light/white matte colour — and blending that at low opacity over a
 * different, differently-lit layer underneath reads as a bright rectangular
 * seam right at the cut's own boundary; found this pass, living-portrait-v2,
 * by comparing a derived layer (art/layers/frontal/headCore.png) against the
 * untouched approved plate (public/art/portraits/yuna-x2.png, which has no
 * such seam) and against the layer file directly (the halo is visible even
 * with no renderer involved at all).
 *
 * This is the standard "alpha-edge defringe" / "colour bleed" fix (the same
 * idea as `rig-cut.py fillhole`'s neighbour-pixel clone, applied to a border
 * instead of a hole): iteratively dilate each fully-opaque pixel's colour
 * into its not-fully-opaque neighbours, `--iterations` times (default 12,
 * comfortably wider than any feather this pipeline authors), never touching
 * alpha. Idempotent-ish: running it again on an already-fixed file is a
 * no-op past the first pass (there's no more "wrong" colour left to bleed).
 *
 * Usage:
 *   node tools/gen/defringe-layer.mjs <in.png> [out.png] [--iterations N] [--opaque-threshold N]
 * With no `out.png`, overwrites `in.png` in place (the layer files under
 * prototype-v2/art/ are already derived, disposable copies — see the
 * project's own "approved painting is never edited" rule, which this never
 * touches: it never runs on anything under public/art/).
 */
import sharp from 'sharp';
import path from 'node:path';

function parseArgs(argv) {
  const positional = [];
  let iterations = 12;
  let opaqueThreshold = 250;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--iterations') iterations = Number.parseInt(argv[++i], 10);
    else if (argv[i] === '--opaque-threshold') opaqueThreshold = Number.parseInt(argv[++i], 10);
    else positional.push(argv[i]);
  }
  return { positional, iterations, opaqueThreshold };
}

async function defringe(inPath, outPath, { iterations, opaqueThreshold }) {
  const img = sharp(inPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (channels !== 4) throw new Error(`expected RGBA, got ${channels} channels for ${inPath}`);

  // "resolved" = this pixel's RGB is trustworthy (either originally opaque,
  // or already had colour bled into it this pass) and may seed its own
  // not-yet-resolved neighbours on the NEXT iteration.
  const resolved = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    if (data[i * 4 + 3] >= opaqueThreshold) resolved[i] = 1;
  }

  const before = resolved.reduce((a, b) => a + b, 0);
  let changedTotal = 0;
  for (let iter = 0; iter < iterations; iter++) {
    let changed = 0;
    // Read from a snapshot so one pass doesn't let colour race ahead within
    // the same iteration (keeps the dilation isotropic, one ring at a time).
    const srcResolved = resolved.slice();
    const srcData = data.slice();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (srcResolved[idx]) continue;
        if (data[idx * 4 + 3] === 0) continue; // fully transparent: no colour to fix, nothing shows anyway
        let sr = 0;
        let sg = 0;
        let sb = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const nIdx = ny * width + nx;
            if (!srcResolved[nIdx]) continue;
            sr += srcData[nIdx * 4];
            sg += srcData[nIdx * 4 + 1];
            sb += srcData[nIdx * 4 + 2];
            n++;
          }
        }
        if (n > 0) {
          data[idx * 4] = Math.round(sr / n);
          data[idx * 4 + 1] = Math.round(sg / n);
          data[idx * 4 + 2] = Math.round(sb / n);
          resolved[idx] = 1;
          changed++;
        }
      }
    }
    changedTotal += changed;
    if (changed === 0) break;
  }

  const after = resolved.reduce((a, b) => a + b, 0);
  await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(outPath);
  return { width, height, resolvedBefore: before, resolvedAfter: after, pixelsFixed: changedTotal };
}

async function main() {
  const { positional, iterations, opaqueThreshold } = parseArgs(process.argv.slice(2));
  const inPath = positional[0];
  if (!inPath) {
    console.error('usage: node tools/gen/defringe-layer.mjs <in.png> [out.png] [--iterations N] [--opaque-threshold N]');
    process.exit(1);
  }
  const outPath = positional[1] ?? inPath;
  const result = await defringe(inPath, outPath, { iterations, opaqueThreshold });
  console.log(JSON.stringify({ in: inPath, out: path.resolve(outPath), ...result }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
