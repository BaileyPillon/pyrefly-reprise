#!/usr/bin/env node
/**
 * Re-fills a `rig-cut.py fillhole` hole properly, by cloning colour inward
 * from the hole's own true border instead of whatever flat block the
 * original fill left there.
 *
 * Found this pass (living-portrait-v2 fix pass): `eyeApertureR.filled.png`
 * / `eyeApertureL.filled.png` (the iris-hole "filled from neighbouring
 * sclera pixels" per the art pass's own README) actually has a hard-edged,
 * near-uniform GREY-GREEN RECTANGLE sitting over the iris hole -- visibly
 * wrong, and a visible defect in the live render (a grey box on the iris,
 * confirmed at 1:1). Comparing the filled file against its own un-filled
 * sibling (`eyeApertureR.png`, which still has the true, irregular,
 * iris-shaped transparent hole) shows exactly which pixels the original
 * fillhole pass invented, and confirms the surrounding sclera content is
 * otherwise correct and untouched, so this only needs to redo the hole
 * itself, using the SAME two inputs the original fillhole pass had.
 *
 * Method: alpha comes from the FILLED file (the complete intended shape);
 * colour comes ONLY from the UNFILLED file's own real pixels (wherever ITS
 * alpha says there's real content) — the filled file's own colour is never
 * trusted, since it's the thing that was corrupted. Whatever the unfilled
 * file leaves transparent (the actual hole) gets its colour by iteratively
 * averaging already-resolved 8-neighbours inward from the hole's real
 * border (same ring-dilation idea as defringe-layer.mjs, driven by an
 * explicit hole mask instead of an alpha threshold).
 *
 * Usage:
 *   node tools/gen/fillhole-fix.mjs <unfilled.png> <filled.png> [out.png] [--iterations N] [--hole-threshold N]
 * With no out.png, overwrites <filled.png> in place (a derived file under
 * prototype-v2/art/ — never the approved plate).
 */
import sharp from 'sharp';
import path from 'node:path';

function parseArgs(argv) {
  const positional = [];
  let iterations = 40;
  let holeThreshold = 16;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--iterations') iterations = Number.parseInt(argv[++i], 10);
    else if (argv[i] === '--hole-threshold') holeThreshold = Number.parseInt(argv[++i], 10);
    else positional.push(argv[i]);
  }
  return { positional, iterations, holeThreshold };
}

async function fillholeFix(unfilledPath, filledPath, outPath, { iterations, holeThreshold }) {
  const unfilled = await sharp(unfilledPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const filled = await sharp(filledPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = filled.info;
  if (channels !== 4) throw new Error(`expected RGBA for ${filledPath}`);
  if (unfilled.info.width !== width || unfilled.info.height !== height) {
    throw new Error(`size mismatch: ${unfilledPath} is ${unfilled.info.width}x${unfilled.info.height}, ${filledPath} is ${width}x${height}`);
  }

  // FIX (found while building this): the first version of this script
  // trusted the FILLED file's own RGB as the seed colour for every pixel it
  // didn't classify as "hole", then dilated from there. That was wrong —
  // the original `rig-cut.py fillhole` run corrupted RGB across a whole
  // rectangular region (a visible grey-green box, confirmed by rendering
  // eyeApertureR.filled.png's RGB channel alone, alpha ignored: a flat box
  // sits right over the iris, while the UNFILLED sibling's RGB in that same
  // area is the real, correct iris art it always was, just gated by alpha=0
  // there). So the FILLED file's colour cannot be trusted as a seed even for
  // pixels this script wouldn't call "the hole" by an alpha test alone.
  // Correct construction: alpha comes from the FILLED file (the complete,
  // intended visible shape); colour comes ONLY from the UNFILLED file's own
  // trustworthy pixels (wherever ITS alpha is high), dilated inward to cover
  // whatever the unfilled file left transparent (the hole) — never copying
  // any colour that ever passed through the broken fillhole.
  const data = Buffer.alloc(width * height * 4);
  const holeMask = new Uint8Array(width * height);
  const resolved = new Uint8Array(width * height);
  let holeCount = 0;
  for (let i = 0; i < width * height; i++) {
    const unfilledAlpha = unfilled.data[i * 4 + 3];
    const finalAlpha = filled.data[i * 4 + 3]; // the complete intended shape
    data[i * 4 + 3] = finalAlpha;
    if (unfilledAlpha >= holeThreshold) {
      // Trustworthy: seed with the UNFILLED file's own real colour, never the filled file's.
      data[i * 4] = unfilled.data[i * 4];
      data[i * 4 + 1] = unfilled.data[i * 4 + 1];
      data[i * 4 + 2] = unfilled.data[i * 4 + 2];
      resolved[i] = 1;
    } else if (finalAlpha >= holeThreshold) {
      // Part of the complete shape, but the unfilled file has no real colour
      // here (the hole) -- needs dilation from the resolved ring around it.
      holeMask[i] = 1;
      holeCount++;
    } else {
      // Transparent in both: nothing shows here regardless, leave as-is (0,0,0 is fine, alpha already 0).
    }
  }

  let changedTotal = 0;
  for (let iter = 0; iter < iterations; iter++) {
    let changed = 0;
    const srcResolved = resolved.slice();
    const srcData = Buffer.from(data);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (!holeMask[idx] || srcResolved[idx]) continue;
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

  await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(outPath);
  return { width, height, holeCount, pixelsFixed: changedTotal, holeUnresolved: holeCount - changedTotal };
}

async function main() {
  const { positional, iterations, holeThreshold } = parseArgs(process.argv.slice(2));
  const [unfilledPath, filledPath, outArg] = positional;
  if (!unfilledPath || !filledPath) {
    console.error('usage: node tools/gen/fillhole-fix.mjs <unfilled.png> <filled.png> [out.png] [--iterations N] [--hole-threshold N]');
    process.exit(1);
  }
  const outPath = outArg ?? filledPath;
  const result = await fillholeFix(unfilledPath, filledPath, outPath, { iterations, holeThreshold });
  console.log(JSON.stringify({ unfilled: unfilledPath, filled: filledPath, out: path.resolve(outPath), ...result }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
