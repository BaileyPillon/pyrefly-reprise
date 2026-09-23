#!/usr/bin/env node
/**
 * Cut out a pixel-edited Ormi frame (FFX-2 only, Chapter 6): the pipeline's rembg
 * (comfy.mjs cutout, isnet-anime) and the cut-out guard, for a <tag>.raw.png that a
 * Python edit (hemfix.py, the eye or floor fixes in redo.md) wrote beside its
 * <tag>.json. Updates that json's cutout and guard.
 *
 *   node docs/concepts/chapters/leblanc/lora/ormi/poses/cut.mjs <state> <tag>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const G = await import(pathToFileURL(join(REPO, 'tools/gen/comfy.mjs')).href);
const C = await import(pathToFileURL(join(REPO, 'tools/gen/cutout-guard.mjs')).href);
const R = await import(pathToFileURL(join(HERE, 'render.mjs')).href);
const [state, tag] = process.argv.slice(2);
const dir = join(R.OUT, state);
const s = R.STATES[state];
const cut = G.cutout(join(dir, `${tag}.raw.png`), join(dir, `${tag}.png`));
const guard = await C.checkCutoutFile(join(dir, `${tag}.png`), { sourceWidth: s.size[0], sourceHeight: s.size[1], composition: s.composition });
const j = JSON.parse(readFileSync(join(dir, `${tag}.json`), 'utf8'));
writeFileSync(join(dir, `${tag}.json`), JSON.stringify({ ...j, tag, cutout: cut, guard: { ok: guard.ok, reasons: guard.reasons } }, null, 1));
console.log(`[ormi-cut] ${tag} guard ${guard.ok ? 'ok' : 'REJECT ' + guard.reasons.join('; ')}`);
