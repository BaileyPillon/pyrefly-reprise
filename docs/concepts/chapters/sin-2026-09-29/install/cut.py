"""Sin production art (FFX only, 2026-09-29): cut each picked creature out of its plate.

Every Sin creature was painted INTO its plate (gen.py mouth mode), so there is no white cyclorama to key and rembg's
anime matte has nothing to separate. The cut is SAM 2.1 small (the repo's tools/gen/rig-sam.py loader, D:/Tools/sam2),
prompted per subject from cuts.json (a box and positive/negative points, fractions of the 2352x1344 painting), then:

  1. intersected with the repaint mask (nothing outside the painted region can belong to the creature);
  2. optionally cut by a keep/drop polygon (the Core's hump against Genais's shell: one painting, two foes);
  3. the largest connected parts kept (specks dropped), holes inside the silhouette filled;
  4. the edge DEFRINGED: every soft edge pixel is recoloured from the creature's own opaque pixels nearby (a normalised
     blur), so no sky or rock colour rides along the edge (round 3's jaw fix, repair.py 4a);
  5. written full-frame (2352x1344 RGBA) as <out>/<key>.full.png, with a magenta check JPEG.

No pixel is painted here. Run with ComfyUI's embedded python (torch, sam2, scipy):

  python_embeded/python.exe -s cut.py <cuts.json> <outdir> [key ...]
"""
import importlib.util
import json
import os
import pathlib
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

W, H = 2352, 1344
_s = importlib.util.spec_from_file_location('rigsam', pathlib.Path(__file__).resolve().parents[5] / 'tools' / 'gen' / 'rig-sam.py')


def sam_fn():
    """rig-sam.py's `sam` (it imports its own libs at load; fall back to a local loader when that fails)."""
    try:
        m = importlib.util.module_from_spec(_s); _s.loader.exec_module(m)
        return m.sam
    except Exception as exc:  # noqa: BLE001
        print('rig-sam.py import failed, local loader:', exc)
        import torch
        torch.jit.script = lambda f, *a, **k: f
        cwd = os.getcwd(); os.chdir('D:/Tools/sam2/repo')
        from sam2.build_sam import build_sam2
        from sam2.sam2_image_predictor import SAM2ImagePredictor
        dev = 'cuda' if torch.cuda.is_available() and torch.cuda.mem_get_info()[0] > 2 * 1024 ** 3 else 'cpu'
        pred = SAM2ImagePredictor(build_sam2('configs/sam2.1/sam2.1_hiera_s.yaml', 'D:/Tools/sam2/checkpoints/sam2.1_hiera_small.pt', device=dev))
        os.chdir(cwd); print('SAM 2.1 small on', dev)

        def sam(rgb, pos, neg, box=None, pick='best', area=(0, 10 ** 9)):
            pts = [list(map(float, q)) for q in pos] + [list(map(float, q)) for q in neg]
            lab = [1] * len(pos) + [0] * len(neg)
            with torch.inference_mode():
                pred.set_image(np.clip(rgb, 0, 255).astype(np.uint8))
                lg, sc, _ = pred.predict(point_coords=np.array(pts) if pts else None, point_labels=np.array(lab) if pts else None,
                                         box=np.array(box, np.float32) if box is not None else None, multimask_output=True, return_logits=True)
            pr = 1 / (1 + np.exp(-np.clip(lg, -30, 30)))
            ar = (pr > 0.5).reshape(3, -1).sum(1)
            ok = [i for i in range(3) if area[0] <= ar[i] <= area[1]] or list(range(3))
            i = max(ok, key=lambda k: (ar[k], sc[k])) if pick == 'large' else max(ok, key=lambda k: sc[k])
            return pr[i].astype(np.float32), float(sc[i])
        return sam


def px(p):
    return (p[0] * W, p[1] * H)


def poly(pts, blur=0.0):
    im = Image.new('L', (W, H), 0)
    ImageDraw.Draw(im).polygon([px(p) for p in pts], fill=255)
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(im, float) / 255


def nblur(x, r):
    return ndi.gaussian_filter(x, r)


def defringe(rgb, a, r=4.0):
    solid = (a > 0.97).astype(float)
    den = nblur(solid, r)
    num = np.dstack([nblur(rgb[..., c] * solid, r) for c in range(3)])
    edge = np.where(den[..., None] > 0.02, num / np.maximum(den, 1e-3)[..., None], rgb)
    soft = ((a > 0) & (a < 0.97))[..., None]
    return np.where(soft, edge, rgb)


def guided(guide, p, r=5, eps=2e-3):
    """He et al.'s guided filter (grey guide): snaps SAM's 256-px logit edge to the painting's own edges."""
    box = lambda x: ndi.uniform_filter(x, 2 * r + 1)
    mi, mp = box(guide), box(p)
    cov = box(guide * p) - mi * mp
    var = box(guide * guide) - mi * mi
    a_ = cov / (var + eps)
    b_ = mp - a_ * mi
    return box(a_) * guide + box(b_)


def cut(sam, key, c):
    rgb = np.asarray(Image.open(c['src']).convert('RGB'), float)
    box = [c['box'][0] * W, c['box'][1] * H, c['box'][2] * W, c['box'][3] * H]
    prob, score = sam(rgb, [px(p) for p in c['pos']], [px(p) for p in c.get('neg', [])], box, c.get('pick', 'best'))
    lo, hi = c.get('edge', [0.42, 0.58])
    a = np.clip((prob - lo) / (hi - lo), 0, 1)
    if c.get('mask'):
        a *= np.clip(np.asarray(Image.open(c['mask']).convert('L').resize((W, H)), float) / 255 * 1.6, 0, 1)
    if c.get('keep'):
        a *= poly(c['keep'], 2.0)
    for d in c.get('drop', []):
        a *= 1 - poly(d, 2.0)
    hard = a > 0.5
    lab, n = ndi.label(hard)
    if n:
        sizes = ndi.sum(hard, lab, range(1, n + 1))
        keep = [i + 1 for i, s in enumerate(sizes) if s >= max(sizes) * c.get('minPart', 0.02)]
        comp = np.isin(lab, keep)
        filled = ndi.binary_fill_holes(comp)
        a = np.where(filled & ~comp, 1.0, a) * ndi.binary_dilation(filled, iterations=1)
        # the silhouette's interior is opaque: SAM's low-confidence speckle inside textured hide is not transparency
        a = np.maximum(a, ndi.binary_erosion(filled, iterations=c.get('solidInset', 4)).astype(float))
    band = ndi.binary_dilation(a > 0.5, iterations=8) & ~ndi.binary_erosion(a > 0.5, iterations=8)
    g = guided(rgb.mean(axis=2) / 255, a, c.get('gr', 5), c.get('geps', 2e-3))
    a = np.where(band, np.clip((g - 0.3) / 0.4, 0, 1), a)
    a = ndi.grey_erosion(a, size=(1 + 2 * c.get('shrink', 2),) * 2)
    a = ndi.gaussian_filter(a, 0.5)
    a = np.where(a < 0.03, 0, a)
    out_rgb = defringe(rgb, a)
    return out_rgb, a, score


def main(cfg_p, outdir, *keys):
    cfg = json.load(open(cfg_p))
    os.makedirs(outdir, exist_ok=True)
    sam = sam_fn()
    for key, c in cfg.items():
        if key.startswith('_') or (keys and key not in keys):
            continue
        rgb, a, score = cut(sam, key, c)
        im = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8), 'RGBA')
        im.save(f'{outdir}/{key}.full.png')
        mag = Image.new('RGBA', im.size, (255, 0, 255, 255)); mag.alpha_composite(im)
        ys, xs = np.nonzero(a > 0.03)
        bb = (max(0, xs.min() - 20), max(0, ys.min() - 20), min(W, xs.max() + 20), min(H, ys.max() + 20))
        crop = mag.crop(bb).convert('RGB'); crop.thumbnail((1400, 900))
        crop.save(f'{outdir}/{key}.check.jpg', quality=85)
        print(key, 'score', round(score, 3), 'bbox', bb, 'opaque', int((a > 0.5).sum()))


if __name__ == '__main__':
    main(*sys.argv[1:])
