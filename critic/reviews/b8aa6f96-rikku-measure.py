# Rikku's dressphere paintings as the LIVE site serves them (critic live review of b8aa6f96), measured against the two masters:
#   the corrected master in D:/pyrefly-art-r47 (the served pixels must EQUAL it) and the old one in D:/pyrefly-art-r44 (they must DIFFER).
# usage: python -I b8aa6f96-rikku-measure.py <files.json> <out.json>
#   files.json = [{ "id": str, "served": "<scratch file the live site's bytes were saved to>", "rel": "art/characters/rikku-x/idle.png" }, ...]
# The statistic is the colour round's own (docs/handoff/r47-rikku-colour/rikku_colour2.py stats_of): the mean HSV saturation of the opaque
# pixels (alpha > 200) of the 256 px thumbnail (PIL Image.thumbnail), plus the same on the full-size picture. Nothing is written but <out.json>.
import hashlib
import json
import os
import sys

import numpy as np
from PIL import Image

R47 = 'D:/pyrefly-art-r47'
R44 = 'D:/pyrefly-art-r44'


def load(p):
    return np.array(Image.open(p).convert('RGBA'), dtype=np.uint8)


def thumb256(a):
    t = Image.fromarray(a).copy()
    t.thumbnail((256, 256))
    return np.asarray(t, dtype=np.uint8)


def mean_s(a):
    px = a.reshape(-1, 4)
    px = px[px[:, 3] > 200]
    if px.shape[0] == 0:
        return None
    rgb = px[:, :3].astype(np.float64) / 255.0
    mx, mn = rgb.max(1), rgb.min(1)
    s = np.divide(mx - mn, mx, out=np.zeros_like(mx), where=mx > 0)
    return float(s.mean())


def master_of(root, rel):
    # a shipped .webp stands for the master .png of the same name
    r = rel[len('art/'):] if rel.startswith('art/') else rel
    base, ext = os.path.splitext(r)
    if ext.lower() == '.webp':
        r = base + '.png'
    return os.path.join(root, r)


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def compare(a, b):
    if a.shape != b.shape:
        return {'sameShape': False, 'shapeA': list(a.shape), 'shapeB': list(b.shape)}
    same_all = bool(np.array_equal(a, b))
    same_alpha = bool(np.array_equal(a[:, :, 3], b[:, :, 3]))
    vis = a[:, :, 3] > 0
    diff_vis = int(np.count_nonzero(np.any(a[:, :, :3] != b[:, :, :3], axis=2) & vis))
    return {'sameShape': True, 'identicalRGBA': same_all, 'identicalAlpha': same_alpha, 'rgbPixelsDifferingWhereVisible': diff_vis, 'visiblePixels': int(vis.sum())}


files = json.load(open(sys.argv[1], 'r', encoding='utf8'))
out = []
for f in files:
    served = load(f['served'])
    m47p, m44p = master_of(R47, f['rel']), master_of(R44, f['rel'])
    rec = {'id': f['id'], 'rel': f['rel'], 'servedBytes': os.path.getsize(f['served']), 'servedSha256': sha(f['served']), 'size': [int(served.shape[1]), int(served.shape[0])]}
    rec['master47'] = {'exists': os.path.exists(m47p), 'sha256': sha(m47p) if os.path.exists(m47p) else None}
    rec['master44'] = {'exists': os.path.exists(m44p), 'sha256': sha(m44p) if os.path.exists(m44p) else None}
    rec['meanSaturationThumb256'] = {'served': mean_s(thumb256(served))}
    rec['meanSaturationFull'] = {'served': mean_s(served)}
    if rec['master47']['exists']:
        m47 = load(m47p)
        rec['vsMaster47'] = compare(served, m47)
        rec['meanSaturationThumb256']['master47'] = mean_s(thumb256(m47))
        rec['meanSaturationFull']['master47'] = mean_s(m47)
    if rec['master44']['exists']:
        m44 = load(m44p)
        rec['vsMaster44'] = compare(served, m44)
        rec['meanSaturationThumb256']['master44'] = mean_s(thumb256(m44))
        rec['meanSaturationFull']['master44'] = mean_s(m44)
    out.append(rec)
json.dump(out, open(sys.argv[2], 'w', encoding='utf8'), indent=1)
for r in out:
    t = r['meanSaturationThumb256']
    v47, v44 = r.get('vsMaster47', {}), r.get('vsMaster44', {})
    print(r['id'], 'served', round(t['served'], 4), 'm47', round(t.get('master47', -1), 4), 'm44', round(t.get('master44', -1), 4), '| equal47', v47.get('identicalRGBA'), 'diff44 px', v44.get('rgbPixelsDifferingWhereVisible'))
