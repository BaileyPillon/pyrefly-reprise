"""
Eye-candy options round, option B "Living Paintings" (2026-09-29): a depth map per approved backdrop.

Depth Anything V2 **Small** (Apache-2.0; the Base and Large weights are CC-BY-NC, never use them), run on the
CPU through `transformers` in ComfyUI's embedded Python, so it never queues on the GPU. The weights come from
the local Hugging Face cache (HF_HOME, see docs/concepts/eye-candy-2026-09-29/downloads.md); nothing is
installed into ComfyUI.

Reads the painting (never writes it), writes only `public/fx/<scene>/depth.png` (16-bit grey, 1344x768,
1 = near, 0 = far) and `depth.json` (model id, revision, the source PNG's sha256). The raw prediction is
snapped to the painting's own edges with a guided filter (He et al. 2010), so plate masks follow outlines.

  set HF_HOME=D:/Tools/pyrefly-scratch/eye-candy/hf
  D:/Tools/ComfyUI/python_embeded/python.exe tools/fx/depth.py gagazet macalania-temple ...

Game case: both (shared tooling); each scene's masks are its own.
"""

import hashlib
import json
import os
import sys

import numpy as np
from PIL import Image

MODEL = 'depth-anything/Depth-Anything-V2-Small-hf'
REVISION = '5426e4f0f36572d16453bbda7a8389317b1bef99'
OUT_W, OUT_H = 1344, 768
# The network's input: multiples of 14 near the paintings' 1.75 aspect.
IN_W, IN_H = 1036, 588

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def box(a, r):
    """Mean over a (2r+1)^2 window, edges clamped, by cumulative sums."""
    p = np.pad(a, r + 1, mode='edge')
    c = p.cumsum(0).cumsum(1)
    k = 2 * r + 1
    s = c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]
    return s[: a.shape[0], : a.shape[1]] / (k * k)


def guided(guide, src, r=6, eps=1e-3):
    mi, mp = box(guide, r), box(src, r)
    cov = box(guide * src, r) - mi * mp
    var = box(guide * guide, r) - mi * mi
    a = cov / (var + eps)
    b = mp - a * mi
    return box(a, r) * guide + box(b, r)


def main(scenes):
    import torch
    from transformers import AutoImageProcessor, AutoModelForDepthEstimation

    torch.set_num_threads(max(1, (os.cpu_count() or 4) // 2))
    proc = AutoImageProcessor.from_pretrained(MODEL, revision=REVISION, local_files_only=True)
    model = AutoModelForDepthEstimation.from_pretrained(MODEL, revision=REVISION, local_files_only=True).eval()
    for scene in scenes:
        src = os.path.join(ROOT, 'public', 'art', 'backdrops', scene + '.png')
        raw = open(src, 'rb').read()
        sha = hashlib.sha256(raw).hexdigest()
        img = Image.open(src).convert('RGB')
        inp = proc(images=img.resize((IN_W, IN_H), Image.BICUBIC), return_tensors='pt', do_resize=False)
        with torch.no_grad():
            pred = model(**inp).predicted_depth[0].numpy().astype(np.float64)
        lo, hi = np.percentile(pred, 0.5), np.percentile(pred, 99.5)
        d = np.clip((pred - lo) / max(1e-6, hi - lo), 0, 1)
        d = np.asarray(Image.fromarray((d * 65535).astype(np.uint16)).resize((OUT_W, OUT_H), Image.BICUBIC), dtype=np.float64) / 65535
        g = np.asarray(img.resize((OUT_W, OUT_H), Image.LANCZOS).convert('L'), dtype=np.float64) / 255
        d = np.clip(guided(g, d, 6, 2e-3), 0, 1)
        out_dir = os.path.join(ROOT, 'public', 'fx', scene)
        os.makedirs(out_dir, exist_ok=True)
        Image.fromarray((d * 65535).round().astype(np.uint16)).save(os.path.join(out_dir, 'depth.png'))
        meta = {
            'what': 'Relative depth of the approved painting, 1 = near (white), 0 = far. A derived greyscale layer for option B "Living Paintings"; never colour.',
            'model': MODEL,
            'revision': REVISION,
            'licence': 'Apache-2.0 (Depth Anything V2 Small only)',
            'input': [IN_W, IN_H],
            'output': [OUT_W, OUT_H],
            'edgeSnap': 'guided filter r=6 eps=2e-3 on the painting luma',
            'source': 'public/art/backdrops/' + scene + '.png',
            'sourceSha256': sha,
            'generator': 'tools/fx/depth.py',
        }
        with open(os.path.join(out_dir, 'depth.json'), 'w', newline='\n') as f:
            json.dump(meta, f, indent=1)
            f.write('\n')
        print(scene, 'ok', sha[:12])


if __name__ == '__main__':
    main(sys.argv[1:] or ['gagazet', 'macalania-temple', 'bevelle-underground', 'djose-chamber-provisional'])
