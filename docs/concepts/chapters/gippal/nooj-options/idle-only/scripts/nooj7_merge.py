"""Nooj shade attempt 7 (FFX-2 only): merge the kept repaint of each region onto attempt 6's repaired raw.

Each repaint was pasted onto the same base only inside its own feathered mask, and the masks do not overlap, so the
merge takes each kept file's pixels through its region's mask. Pixels outside every mask stay the base's.

    python nooj7_merge.py --out merged.raw.png loops=<file> sleeve=<file> near=<file> [...]
"""
import sys

from PIL import Image

BASE = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj6/idle-repair/idle-repaired.raw.png'
PREP = 'D:/Tools/pyrefly-scratch/nooj7/prep'

args = sys.argv[1:]
out = args[args.index('--out') + 1]
picks = [a.split('=', 1) for a in args if '=' in a]
res = Image.open(BASE).convert('RGB')
for region, path in picks:
    m = Image.open(f'{PREP}/{region}-mask.png').convert('L')
    res = Image.composite(Image.open(path).convert('RGB'), res, m)
res.save(out)
print('merged', out, picks)
