#!/usr/bin/env node
/**
 * Cut out a pixel-edited round-2 Ormi frame (FFX-2 only, Chapter 6): the pipeline's rembg
 * (comfy.mjs cutout, isnet-anime) and the cut-out guard, for a <tag>.raw.png under
 * D:/Tools/pyrefly-lora/ormi/r2/poses/<state>/ that a Python edit (erase-poly.py, the ko
 * shadow fix in round2.md) wrote beside a copy of its source's <tag>.json.
 *
 *   node docs/concepts/chapters/leblanc/lora/ormi/round2/cut-r2.mjs <state> <tag> [--size WxH] [--edit "what was done"]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const G = await import(pathToFileURL(join(REPO, 'tools/gen/comfy.mjs')).href);
const C = await import(pathToFileURL(join(REPO, 'tools/gen/cutout-guard.mjs')).href);
const R = await import(pathToFileURL(join(HERE, 'render-r2.mjs')).href);
const argv = process.argv.slice(2);
const [state, tag] = argv;
const opt = {};
for (let i = 2; i < argv.length; i += 2) opt[argv[i].slice(2)] = argv[i + 1];
const dir = join(R.OUT, state);
const size = opt.size ? opt.size.split('x').map(Number) : R.STATES[state].size;
const cut = G.cutout(join(dir, `${tag}.raw.png`), join(dir, `${tag}.png`));
const guard = await C.checkCutoutFile(join(dir, `${tag}.png`), { sourceWidth: size[0], sourceHeight: size[1], composition: R.STATES[state].composition });
const j = JSON.parse(readFileSync(join(dir, `${tag}.json`), 'utf8'));
writeFileSync(join(dir, `${tag}.json`), JSON.stringify({ ...j, tag, cutout: cut, guard: { ok: guard.ok, reasons: guard.reasons }, pixelEdit: opt.edit || j.pixelEdit }, null, 1));
console.log(`[ormi-r2-cut] ${tag} guard ${guard.ok ? 'ok' : 'REJECT ' + guard.reasons.join('; ')}`);
