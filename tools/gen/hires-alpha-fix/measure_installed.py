"""Measure the INSTALLED tiers (2x, 3x, 4x) of the independent check's sample against the approved 1x paintings, new tree against the old files.

before: the old 2x/4x are the library's (D:/Tools/pyrefly-art-backup/hires), the old 3x are the parked derived files (F:/pyrefly-parked/.../install-parked/);
after:  public/art of the r39-int tree. Only the assets this repair rebuilt are compared (an approved pilot 2x that stayed is reported separately).
"""
import json, os, sys
import numpy as np
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import alphafix as af

TREE = 'D:/pyrefly-r39-int/public/art'
OLDLIB = 'D:/Tools/pyrefly-art-backup/hires'
PARKED = sys.argv[1] if len(sys.argv) > 1 else 'F:/pyrefly-parked/2026-10-04/r39-repair/install-parked'
OUT = 'D:/Tools/pyrefly-scratch/2026-10-04/r39-repair/installed-measure.json'
chk = json.load(open('D:/Tools/pyrefly-scratch/2026-10-04/r39-check/likeness/edgeband.json'))
labels = sorted({r['label'].rsplit('@', 1)[0] for r in chk if 'bias' in r})   # 'sid/state'


def job(label):
    sid, state = label.split('/')
    p1 = f'{TREE}/characters/{sid}/{state}.png'
    if not os.path.exists(p1):
        return None
    P = af.load_rgba(p1)
    out = {'label': label}
    for s in (2, 3, 4):
        new = f'{TREE}/characters/{sid}/{state}@{s}x.png'
        old = f'{OLDLIB}/characters/{sid}/{state}@{s}x.png' if s != 3 else f'{PARKED}/characters/{sid}/{state}@3x.png'
        if not (os.path.exists(new) and os.path.exists(old)):
            continue
        N = af.load_rgba(new)
        O = af.load_rgba(old)
        if N.shape != O.shape:
            out[f'{s}x'] = {'error': f'shape {N.shape} vs {O.shape}'}
            continue
        same = bool(np.array_equal(N, O))
        mb = af.metrics(P, O, s)
        ma = af.metrics(P, N, s) if not same else mb
        out[f'{s}x'] = {'unchanged': same, 'before': mb, 'after': ma}
    return out


if __name__ == '__main__':
    with Pool(3) as pool:
        res = [r for r in pool.imap_unordered(job, labels) if r]
    json.dump(res, open(OUT, 'w'))
    for s in (2, 3, 4):
        rows = [r[f'{s}x'] for r in res if f'{s}x' in r and 'before' in r[f'{s}x']]
        ch = [x for x in rows if not x['unchanged'] and 'rim_bias' in x['before']]
        un = [x for x in rows if x['unchanged']]
        if ch:
            b = np.array([x['before']['rim_bias'] for x in ch])
            a = np.array([x['after']['rim_bias'] for x in ch])
            mb = np.array([x['before']['rim_mad'] for x in ch])
            ma = np.array([x['after']['rim_mad'] for x in ch])
            print(f'{s}x: {len(ch)} replaced masters measured ({len(un)} unchanged kept): rim bias median {np.median(b):+.2f} -> {np.median(a):+.2f}; below -8: {int((b < -8).sum())} -> {int((a < -8).sum())}; MAD median {np.median(mb):.2f} -> {np.median(ma):.2f}')
