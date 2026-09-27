// Film set: final-cut.mjs from round 2 with the cut swapped for cut2.py (max of two rembg models + non-background
// hole fill, for grey steel on the grey studio background); then the same defringe and BOTH checks on the FINAL file:
// the pipeline guard (tools/gen/cutout-guard.mjs) and the strict one-component check.
// Usage: node final-cut.mjs <full.png> <out.png> [sidecar-in.json] [extra-json]
//   writes <out.png> and <out>.json (provenance + both reports); exit 1 on a fail.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkCutoutFile } from '../../../../../tools/gen/cutout-guard.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const STRICT_MIN_PX = 24;
const PY = 'D:/Tools/ComfyUI/python_embeded/python.exe';
const [full, out, sidecarIn, extra] = process.argv.slice(2);

const cr = spawnSync(PY, ['-s', join(HERE, 'cut2.py'), '--in', full, '--out', out, '--margin', '16'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
if (cr.status !== 0) throw new Error(cr.stderr);
const crop = JSON.parse(cr.stdout.trim().split(/\r?\n/).pop());
const df = spawnSync(PY, ['-s', join(HERE, '../../round2/scripts/cleanup/defringe.py'), out, out, '2'], { encoding: 'utf8' });
if (df.status !== 0) throw new Error(df.stderr);
const defringe = JSON.parse(df.stdout.trim().split(/\r?\n/).pop());
const guard = await checkCutoutFile(out, { sourceWidth: crop.sourceWidth, sourceHeight: crop.sourceHeight });

const py = `
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
a = np.asarray(Image.open(sys.argv[1]).convert('RGBA'))[:, :, 3] >= 8
lab, n = ndimage.label(a, structure=np.ones((3, 3)))
sizes = ndimage.sum(a, lab, range(1, n + 1)) if n else []
order = sorted(range(n), key=lambda i: -sizes[i])
extra = []
for i in order[1:]:
    if sizes[i] >= int(sys.argv[2]):
        ys, xs = np.where(lab == i + 1)
        extra.append({'pixels': int(sizes[i]), 'box': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]})
print(json.dumps({'components': int(n), 'largest': int(sizes[order[0]]) if n else 0, 'detachedPieces': extra}))
`;
const res = spawnSync(PY, ['-s', '-c', py, out, String(STRICT_MIN_PX)], { encoding: 'utf8' });
if (res.status !== 0) throw new Error(res.stderr);
const strict = JSON.parse(res.stdout.trim().split(/\r?\n/).pop());
const strictOk = strict.detachedPieces.length === 0;
const ok = guard.ok && strictOk;

const base = sidecarIn && existsSync(sidecarIn) ? JSON.parse(readFileSync(sidecarIn, 'utf8')) : {};
const sidecar = {
  ...base,
  ...(extra ? JSON.parse(readFileSync(extra, 'utf8')) : {}),
  fullFrame: full.replace(/\\/g, '/'),
  width: crop.width, height: crop.height, cropBox: crop.cropBox ?? crop.box, baselineY: crop.baselineY,
  defringe,
  cutout: { guard: { ok: guard.ok, reasons: guard.reasons, measurements: guard.measurements }, strict: { minPixels: STRICT_MIN_PX, ...strict, ok: strictOk } },
  cutoutOk: ok,
};
writeFileSync(out.replace(/\.png$/, '.json'), `${JSON.stringify(sidecar, null, 2)}\n`);
console.log(`${ok ? 'PASS' : 'FAIL'} ${out} guard=${guard.ok} strict=${strictOk} components=${strict.components} pieces=${JSON.stringify(strict.detachedPieces)} defringe=${JSON.stringify(defringe)}`);
process.exit(ok ? 0 : 1);
