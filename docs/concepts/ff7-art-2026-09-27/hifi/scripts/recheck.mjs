// Hi-fi round: re-run BOTH cut-out checks (the pipeline guard and the strict one-component check, the same code
// as ../../round2/scripts/cleanup/final-cut.mjs) on a cut-out that was post-processed after final-cut
// (fill-holes.py, drop-specks.py). Merges the reports into <out>.json next to the file. Exit 1 on a fail.
// Usage: node recheck.mjs <cut.png> <base-sidecar.json> [step-json]
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { checkCutoutFile } from '../../../../../tools/gen/cutout-guard.mjs';
const PY = 'D:/Tools/ComfyUI/python_embeded/python.exe';
const [cut, sidecar, step] = process.argv.slice(2);
const base = JSON.parse(readFileSync(sidecar, 'utf8'));
const guard = await checkCutoutFile(cut, {});
const py = `
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
a = np.asarray(Image.open(sys.argv[1]).convert('RGBA'))[:, :, 3] >= 8
lab, n = ndimage.label(a, structure=np.ones((3, 3)))
sizes = ndimage.sum(a, lab, range(1, n + 1)) if n else []
order = sorted(range(n), key=lambda i: -sizes[i])
extra = [int(sizes[i]) for i in order[1:] if sizes[i] >= 24]
print(json.dumps({'components': int(n), 'detachedPieces': extra}))
`;
const r = spawnSync(PY, ['-s', '-c', py, cut], { encoding: 'utf8' });
const strict = JSON.parse(r.stdout.trim().split(/\r?\n/).pop());
const ok = guard.ok && strict.detachedPieces.length === 0;
const out = { ...base, postProcess: [...(base.postProcess ?? []), ...(step ? [JSON.parse(step)] : [])],
  recheck: { guard: { ok: guard.ok, reasons: guard.reasons }, strict: { minPixels: 24, ...strict, ok: strict.detachedPieces.length === 0 } }, cutoutOk: ok };
writeFileSync(cut.replace(/\.png$/, '.json'), `${JSON.stringify(out, null, 2)}\n`);
console.log(`${ok ? 'PASS' : 'FAIL'} ${cut} guard=${guard.ok} ${JSON.stringify(strict)}`);
process.exit(ok ? 0 : 1);
