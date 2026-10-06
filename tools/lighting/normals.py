"""
Lighting mockups (branch lighting-mockups, never merged): a normal map per painted pose, for look 2 "Lit by the room".

The same method as eye candy option C's `tools/proto-candy/c-normals.py` (branch candy-max-proto): Depth Anything V2 **Small**
(Apache-2.0; never Base or Large, which are CC-BY-NC) on the CPU, from the local Hugging Face cache; the figure composited on mid
grey, its depth predicted, normalised inside the painting's alpha, snapped to the painting's own edges with a guided filter,
blended with a soft "dome" from the alpha's distance field (so the silhouette always turns away), and turned into tangent-space
normals with a Sobel filter. Two changes for this use:

- the output is RGB only (alpha 255 everywhere, and the flat normal 0,0,1 outside the figure), because a browser that
  premultiplies an RGBA PNG on upload would corrupt the normal where the painting's alpha is small; the painting's own alpha is
  read from the painting itself in the shader;
- the maps go to a scratch folder, never into `public/art`. The dev server (`tools/lighting/vite-lighting.config.mjs`) serves
  them at `/__lightmaps/`.

Reads the approved PNGs, never writes them.

  set HF_HOME=D:/Tools/pyrefly-scratch/eye-candy/hf
  set CUDA_VISIBLE_DEVICES=
  D:/Tools/ComfyUI/python_embeded/python.exe tools/lighting/normals.py tidus yuna kimahri      (these art ids)
  D:/Tools/ComfyUI/python_embeded/python.exe tools/lighting/normals.py --all-girls            (every FFX-2 dressphere of the three girls)

Game case: both (tooling).
"""

import json
import os
import sys
import time

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

MODEL = 'depth-anything/Depth-Anything-V2-Small-hf'
REVISION = '5426e4f0f36572d16453bbda7a8389317b1bef99'
MAX_SIDE = 384
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ART = os.environ.get('PYREFLY_ART', os.path.join(ROOT, 'public', 'art'))
OUT = os.environ.get('PYREFLY_LIGHT_MAPS', 'D:/Tools/pyrefly-scratch/2026-10-06/lighting/normals')


def box(a, r):
    p = np.pad(a, r + 1, mode='edge')
    c = p.cumsum(0).cumsum(1)
    k = 2 * r + 1
    s = c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]
    return s[: a.shape[0], : a.shape[1]] / (k * k)


def guided(guide, src, r=4, eps=2e-3):
    mi, mp = box(guide, r), box(src, r)
    cov = box(guide * src, r) - mi * mp
    var = box(guide * guide, r) - mi * mi
    a = cov / (var + eps)
    b = mp - a * mi
    return box(a, r) * guide + box(b, r)


def dist_inside(mask, iters):
    """The exact Euclidean distance (in pixels) from the outside, capped at `iters` (the chamfer of the first version left stripes)."""
    return np.minimum(ndi.distance_transform_edt(np.pad(mask, 1, mode='constant'))[1:-1, 1:-1], float(iters))


def normals_for(model, proc, src):
    import torch
    img = Image.open(src).convert('RGBA')
    W, H = img.size
    k = MAX_SIDE / max(W, H)
    w, h = max(8, round(W * k)), max(8, round(H * k))
    rgb = Image.new('RGB', img.size, (128, 128, 128))
    rgb.paste(img, mask=img.split()[3])
    cache = os.path.join(OUT, 'depth', os.path.splitext(os.path.basename(src))[0] + '.npy')
    cache = os.path.join(os.path.dirname(cache), os.path.basename(os.path.dirname(src)) + '__' + os.path.basename(cache))
    if os.path.exists(cache):
        pred = np.load(cache).astype(np.float32)
    else:
        with torch.no_grad():
            inp = proc(images=rgb, return_tensors='pt')
            pred = model(**inp).predicted_depth[0].numpy().astype(np.float32)
        os.makedirs(os.path.dirname(cache), exist_ok=True)
        np.save(cache, pred.astype(np.float16))
    small = img.resize((w, h), Image.LANCZOS)
    A = np.asarray(small.split()[3], dtype=np.float64) / 255
    g = np.asarray(small.convert('L'), dtype=np.float64) / 255
    d = np.asarray(Image.fromarray(pred).resize((w, h), Image.BILINEAR), dtype=np.float64)
    inside = A > 0.5
    if inside.sum() < 16:
        return None
    lo, hi = np.percentile(d[inside], 2), np.percentile(d[inside], 98)
    d = np.clip((d - lo) / max(1e-6, hi - lo), 0, 1)
    d = np.clip(guided(g, d), 0, 1)
    # The dome: distance from the silhouette, eased, so every edge turns away from the viewer.
    reach = max(4, round(min(w, h) * 0.08))
    dome = dist_inside(inside, reach) / reach
    dome = np.sqrt(np.clip(dome, 0, 1))
    z = (0.55 * d + 0.45 * dome) * A
    z = ndi.gaussian_filter(z, 1.4)  # smooth the height before the Sobel: no steps, no stripes
    p = np.pad(z, 1, mode='edge')
    gx = (p[:-2, 2:] + 2 * p[1:-1, 2:] + p[2:, 2:]) - (p[:-2, :-2] + 2 * p[1:-1, :-2] + p[2:, :-2])
    gy = (p[2:, :-2] + 2 * p[2:, 1:-1] + p[2:, 2:]) - (p[:-2, :-2] + 2 * p[:-2, 1:-1] + p[:-2, 2:])
    s = 0.125 * reach * 1.6
    nx, ny, nz = -gx * s, gy * s, np.ones_like(z)  # image rows go down; normal y points up
    n = np.sqrt(nx * nx + ny * ny + nz * nz)
    nx, ny, nz = nx / n, ny / n, nz / n
    # Outside the figure the normal is flat (0, 0, 1): nothing there is ever lit.
    out = np.stack([nx * 0.5 + 0.5, ny * 0.5 + 0.5, nz * 0.5 + 0.5], -1)
    flat = np.array([0.5, 0.5, 1.0])
    out = np.where((A > 0.02)[..., None], out, flat)
    return Image.fromarray((out * 255).round().astype(np.uint8), 'RGB')


def main(args):
    import torch
    from transformers import AutoImageProcessor, AutoModelForDepthEstimation

    torch.set_num_threads(max(1, (os.cpu_count() or 4) // 2))
    proc = AutoImageProcessor.from_pretrained(MODEL, revision=REVISION, local_files_only=True)
    model = AutoModelForDepthEstimation.from_pretrained(MODEL, revision=REVISION, local_files_only=True).eval()
    os.makedirs(OUT, exist_ok=True)
    man_path = os.path.join(OUT, 'manifest.json')
    man = json.load(open(man_path)) if os.path.exists(man_path) else {'model': MODEL, 'revision': REVISION, 'maps': []}
    have = set(man['maps'])
    chars = sorted(os.listdir(os.path.join(ART, 'characters')))
    only = set(a for a in args if not a.startswith('--'))
    if '--all-girls' in args:
        only |= {c for c in chars if c.split('-')[0] in ('yuna', 'rikku', 'paine') and not c.startswith('ff7')}
    t0 = time.time()
    n = 0
    for cid in chars:
        if cid.startswith('ff7') or (only and cid not in only):
            continue
        cdir = os.path.join(ART, 'characters', cid)
        if not os.path.isdir(cdir):
            continue
        for f in sorted(os.listdir(cdir)):
            if not f.endswith('.png') or '@' in f:  # the @2x, @3x masters share the base pose's map
                continue
            stem = f'{cid}__{f[:-4]}'
            dst = os.path.join(OUT, stem + '.png')
            if os.path.exists(dst) and stem in have:
                continue
            try:
                im = normals_for(model, proc, os.path.join(cdir, f))
            except Exception as err:  # a damaged or odd file: skip it, the runtime falls back to the alpha dome
                print('skip', stem, err, flush=True)
                continue
            if im is None:
                continue
            im.save(dst, optimize=True)
            have.add(stem)
            n += 1
            print('ok', stem, im.size, f'{time.time() - t0:.0f}s', flush=True)
            if n % 10 == 0:  # keep the manifest current while a long run goes on
                man['maps'] = sorted(have)
                json.dump(man, open(man_path, 'w'), indent=1)
    man['maps'] = sorted(have)
    json.dump(man, open(man_path, 'w'), indent=1)
    print('done', n, 'maps in', f'{time.time() - t0:.0f}s')


if __name__ == '__main__':
    main(sys.argv[1:])
