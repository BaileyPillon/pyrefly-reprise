"""CAMERA LAB: shrink the private page's paintings so the bundle fits the artifact limits.

    python tools/lab/shrink_lab.py <dist-lab>

Called by `node tools/lab/build-lab.mjs --artifact`. Every painting of one subject is scaled by
the same factor (the engine sizes a figure by world height against its idle, so a subject scaled
as a whole keeps its size on the field), the rear candidates with their own subject, and every
sidecar's pixel fields (width, height, baselineY, anchorY, headTopY, figurePx) with them; face
crops are fractions and need nothing. Backdrops lose less. The launcher's full build is untouched.
Needs Pillow.
"""
import json
import os
import sys

from PIL import Image

FACTORS = {
    os.path.join('art', 'characters'): 0.6,
    'mock-art': 0.6,
    os.path.join('art', 'portraits'): 0.5,
    os.path.join('art', 'backdrops'): 0.8,
}
PIXEL_KEYS = ('width', 'height', 'baselineY', 'headTopY', 'figurePx')


def factor_for(rel):
    for prefix, k in FACTORS.items():
        if rel.startswith(prefix + os.sep):
            return k
    return None


def shrink_png(path, k):
    with Image.open(path) as im:
        im.load()
        w, h = im.size
        nw, nh = max(1, round(w * k)), max(1, round(h * k))
        out = im.resize((nw, nh), Image.LANCZOS)
    out.save(path, optimize=True)
    return w, h, nw, nh


def scale_sidecar(path, k):
    with open(path, encoding='utf-8') as f:
        meta = json.load(f)
    for key in PIXEL_KEYS:
        v = meta.get(key)
        if isinstance(v, (int, float)):
            meta[key] = round(v * k, 2) if key == 'baselineY' else round(v * k)
    a = meta.get('anchorY')
    if isinstance(a, (int, float)) and a > 1:
        meta['anchorY'] = round(a * k, 2)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=1)


def main(root):
    before = after = 0
    count = 0
    for dirpath, _dirs, files in os.walk(root):
        for name in files:
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, root)
            k = factor_for(rel)
            if k is None:
                continue
            if name.endswith('.png'):
                before += os.path.getsize(full)
                shrink_png(full, k)
                after += os.path.getsize(full)
                count += 1
            elif name.endswith('.json'):
                scale_sidecar(full, k)
    print(f'shrank {count} paintings: {before / 1048576:.1f} MB -> {after / 1048576:.1f} MB')


if __name__ == '__main__':
    main(sys.argv[1])
