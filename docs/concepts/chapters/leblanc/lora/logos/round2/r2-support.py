"""Logos round 2 (FFX-2 only): image side of masked repaints made directly on an
installed CUTOUT (coordinates are the cutout's own pixels), plus the proof tools.

    python -s r2-support.py flat    <cutout.png> <out-flat.png>
    python -s r2-support.py finish  <fixes.json> <key> <orig-cutout.png> <patched-flat.png> <out.png>
    python -s r2-support.py diff    <a.png> <b.png> <fixes.json> <key> <out-diff.png>
    python -s r2-support.py recolor <cutout.png> <l,t,r,b> <out.png>

finish : the original cutout's RGBA is kept exactly wherever every pass mask is 0;
         inside a mask RGB = patched * m + orig * (1 - m) (the same blend fix-support.py
         merge used), alpha is the original's (interior fixes only). Same canvas size.
diff   : proves it. Prints how many pixels differ, how many differ OUTSIDE the union of
         the pass masks (must be 0), and writes a difference image (changed pixels
         bright red over a dimmed copy, the mask outline in green).
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'poses'))
import importlib.util  # noqa: E402

_spec = importlib.util.spec_from_file_location('fs', os.path.join(HERE, '..', 'poses', 'fix-support.py'))
fs = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(fs)


def flat(src, out):
    fs.flat(src).save(out)
    print(json.dumps({'flat': out}))


def union_mask(fx, key, size):
    s = json.load(open(fx, encoding='utf-8'))[key]
    m = np.zeros((size[1], size[0]), np.float32)
    for p in s['passes']:
        m = np.maximum(m, np.asarray(fs.pass_mask(size, p)).astype(np.float32) / 255.0)
    return m


def finish(fx, key, orig_path, patched_path, out_path):
    orig = Image.open(orig_path).convert('RGBA')
    pr = np.asarray(Image.open(patched_path).convert('RGB')).astype(np.float32)
    assert pr.shape[:2] == (orig.height, orig.width)
    o = np.asarray(orig).astype(np.float32)
    m = union_mask(fx, key, orig.size)
    rgb = o[..., :3] * (1 - m[..., None]) + pr * m[..., None]
    out = np.dstack([rgb, o[..., 3]]).clip(0, 255).round().astype(np.uint8)
    # pixels whose mask is exactly 0 are copied, not recomputed (byte-identical by construction)
    out[m == 0] = np.asarray(orig)[m == 0]
    Image.fromarray(out, 'RGBA').save(out_path, 'PNG', optimize=True)
    print(json.dumps({'out': out_path, 'size': list(orig.size), 'maskPixels': int((m > 0).sum())}))


def diff(a_path, b_path, fx, key, out_path):
    a = np.asarray(Image.open(a_path).convert('RGBA'))
    b = np.asarray(Image.open(b_path).convert('RGBA'))
    assert a.shape == b.shape, (a.shape, b.shape)
    ch = (a != b).any(axis=2)
    m = union_mask(fx, key, (a.shape[1], a.shape[0]))
    outside = int((ch & (m == 0)).sum())
    base = fs.flat(a_path)
    dim = (np.asarray(base).astype(np.float32) * 0.35 + 255 * 0.65).astype(np.uint8)
    vis = dim.copy()
    vis[ch] = [230, 0, 0]
    edge = np.asarray(Image.fromarray(((m > 0) * 255).astype(np.uint8)).filter(ImageFilter.FIND_EDGES)) > 0
    vis[edge] = [0, 170, 0]
    Image.fromarray(vis).save(out_path)
    print(json.dumps({'changedPixels': int(ch.sum()), 'changedOutsideMask': outside, 'maskPixels': int((m > 0).sum()),
                      'maxAbsDiffInside': int(np.abs(a.astype(int) - b.astype(int)).max())}))


def _main():
    cmd, *a = sys.argv[1:]
    {'flat': flat, 'finish': finish, 'diff': diff, 'recolor': recolor}[cmd](*a)


def recolor(src, box, out):
    """Brown wooden grip -> the idle's dark grip, as a pixel edit: inside the box, pixels with a
    warm hue (320 to 45 degrees) and saturation above 0.10 keep their own lightness pattern but
    become a near-black blue-grey (value x 0.32, a cool tint). Everything else is copied."""
    l, t, r, b = [int(v) for v in box.split(',')]
    im = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32)
    rgb = im[..., :3] / 255
    mx, mn = rgb.max(2), rgb.min(2)
    d = np.maximum(mx - mn, 1e-6)
    R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    hue = np.where(mx == R, ((G - B) / d) % 6, np.where(mx == G, (B - R) / d + 2, (R - G) / d + 4)) * 60
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    sel = np.zeros(mx.shape, bool)
    sel[t:b, l:r] = True
    sel &= ((hue <= 45) | (hue >= 320)) & (sat > 0.10) & (im[..., 3] > 0)
    v = mx * 0.32
    new = np.stack([v * 0.92, v * 0.95, v * 1.1], -1).clip(0, 1) * 255
    o = im.copy()
    o[sel, :3] = new[sel]
    res = o.round().astype(np.uint8)
    Image.fromarray(res, 'RGBA').save(out, 'PNG', optimize=True)
    print(json.dumps({'recolored': int(sel.sum()), 'box': [l, t, r, b]}))


if __name__ == '__main__':
    _main()
