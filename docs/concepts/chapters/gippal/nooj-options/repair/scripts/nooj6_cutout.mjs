#!/usr/bin/env node
/**
 * Nooj shade attempt 6 (FFX-2 only): cut a repaired raw out with the pipeline's own rembg cutout and run the
 * cutout guard on it, as nooj5_render.mjs does for fresh renders. Candidates only; nothing is installed.
 *
 *   node nooj6_cutout.mjs <raw.png> <out.png> <sourceWidth> <sourceHeight>
 */
import { writeFileSync } from 'node:fs';
import { cutout } from 'file:///D:/Final%20Fantasy/tools/gen/comfy.mjs';
import { checkCutoutFile } from 'file:///D:/Final%20Fantasy/tools/gen/cutout-guard.mjs';

const [raw, out, w, h] = process.argv.slice(2);
const meta = cutout(raw, out);
const guard = await checkCutoutFile(out, { sourceWidth: Number(w), sourceHeight: Number(h), composition: 'full' });
writeFileSync(out.replace(/\.png$/, '.cutout.json'), JSON.stringify({ raw, cutout: meta, guard: { ok: guard.ok, reasons: guard.reasons } }, null, 1));
console.log(`${out}: ${meta.width}x${meta.height} guard ${guard.ok ? 'ok' : 'REJECT ' + guard.reasons.join('; ')}`);
if (!guard.ok) process.exit(2);
