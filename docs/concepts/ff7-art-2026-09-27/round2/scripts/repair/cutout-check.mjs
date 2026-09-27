// Repair round (2026-09-27): cut out a full frame and run BOTH cut-out checks.
//
// 1. The pipeline's own guard (tools/gen/cutout-guard.mjs checkCutoutFile), as comfy.mjs runs it.
// 2. A STRICT detached-piece check. The canon judge found that round 2 barret/idle-c.2 passed the
//    guard with a 648-pixel grey chip floating above the gun barrel: the guard's `touchesLargest`
//    compares bounding boxes, and a chip inside the figure's box always "touches". Here any opaque
//    component other than the largest with >= STRICT_MIN_PX pixels (alpha >= 8, 8-connected) fails,
//    and its bounding box is reported.
//
// Usage: node cutout-check.mjs <full.png> <out.png> [sidecar-in.json]
//   writes <out.png> (the cut-out) and <out>.json (provenance + both reports); exit 1 on a fail.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { cutout } from '../../../../../../tools/gen/comfy.mjs';
import { checkCutoutFile } from '../../../../../../tools/gen/cutout-guard.mjs';

const STRICT_MIN_PX = 24;
const PY = 'D:/Tools/ComfyUI/python_embeded/python.exe';
const [full, out, sidecarIn] = process.argv.slice(2);

const crop = cutout(full, out, 16);
const guard = await checkCutoutFile(out, { sourceWidth: crop.source?.width, sourceHeight: crop.source?.height });

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
  fullFrame: full.replace(/\\/g, '/'),
  width: crop.width, height: crop.height, cropBox: crop.cropBox ?? crop.box, baselineY: crop.baselineY,
  cutout: { guard: { ok: guard.ok, reasons: guard.reasons, measurements: guard.measurements }, strict: { minPixels: STRICT_MIN_PX, ...strict, ok: strictOk } },
  cutoutOk: ok,
};
writeFileSync(out.replace(/\.png$/, '.json'), `${JSON.stringify(sidecar, null, 2)}\n`);
console.log(`${ok ? 'PASS' : 'FAIL'} ${out} guard=${guard.ok} strict=${strictOk} pieces=${JSON.stringify(strict.detachedPieces)}`);
process.exit(ok ? 0 : 1);
