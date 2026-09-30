"""Clear the white backdrop wedge between Auron's scabbard and rear leg (Low-HP cand-4, already floor-fixed).
Pixels are only made transparent (plus a one-pixel alpha halving on the new edge); nothing is repainted.
  python fix_wedge.py <in.png> <out.png> <report.json>
"""
import json, sys
from collections import deque
import numpy as np
from PIL import Image

src, dst, rep = sys.argv[1:4]
im = Image.open(src).convert('RGBA')
a = np.array(im)
H, W = a.shape[:2]
rgb = a[..., :3].astype(int)
alpha = a[..., 3]
white = (rgb.min(axis=2) > 232) & (alpha > 0)


def comps(mask):
    seen = np.zeros_like(mask, bool)
    out = []
    for y in range(H):
        for x in range(W):
            if mask[y, x] and not seen[y, x]:
                q = deque([(x, y)]); seen[y, x] = True; pts = []
                while q:
                    cx, cy = q.popleft(); pts.append((cx, cy))
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < W and 0 <= ny < H and mask[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True; q.append((nx, ny))
                out.append(pts)
    return out


def describe(pts):
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return {'px': len(pts), 'bbox': [min(xs), min(ys), max(xs), max(ys)]}


before = [describe(c) for c in sorted(comps(white), key=len, reverse=True)]

seed = (380, 780)
assert white[seed[1], seed[0]], 'seed not near-white'
wedge = next(c for c in comps(white) if seed in set(c))
new = a.copy()
for x, y in wedge:
    new[y, x] = (0, 0, 0, 0)

# one-pixel fringe: opaque neighbours of the cleared region that are pale (min > 200) are halved in alpha
cleared = set(wedge)
fr = 0
for x, y in wedge:
    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
        if 0 <= nx < W and 0 <= ny < H and (nx, ny) not in cleared and new[ny, nx, 3] > 0:
            r, g, b, al = (int(v) for v in new[ny, nx])
            if min(r, g, b) > 200 and al == 255:
                new[ny, nx, 3] = al // 2
                fr += 1

Image.fromarray(new, 'RGBA').save(dst)

# diff mask: pixels that changed, split into cleared / fringe
old_a = alpha
changed = (new != a).any(axis=2)
cleared_mask = changed & (new[..., 3] == 0)
fringe_mask = changed & (new[..., 3] > 0)
# own pixels: opaque in source and not in the wedge -> RGB must be unchanged
own = (old_a > 0) & ~cleared_mask
rgb_changed_own = int(((new[..., :3] != a[..., :3]).any(axis=2) & own).sum())
after_white = (new[..., :3].astype(int).min(axis=2) > 232) & (new[..., 3] > 0)
after = [describe(c) for c in sorted(comps(after_white), key=len, reverse=True)]

# holes: transparent regions not connected to the canvas edge (trapped between limbs)
tr = new[..., 3] == 0
seen = np.zeros_like(tr, bool)
q = deque()
for x in range(W):
    for y in (0, H - 1):
        if tr[y, x] and not seen[y, x]:
            seen[y, x] = True; q.append((x, y))
for y in range(H):
    for x in (0, W - 1):
        if tr[y, x] and not seen[y, x]:
            seen[y, x] = True; q.append((x, y))
while q:
    cx, cy = q.popleft()
    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
        if 0 <= nx < W and 0 <= ny < H and tr[ny, nx] and not seen[ny, nx]:
            seen[ny, nx] = True; q.append((nx, ny))
holes = tr & ~seen
hole_comps = [describe(c) for c in sorted(comps(holes), key=len, reverse=True)]

# near-white (min > 232) opaque pixels connected to a transparent pixel (i.e. touching the outside or a hole)
near_trans = np.zeros_like(after_white)
t = tr
nt = np.zeros_like(t)
nt[1:, :] |= t[:-1, :]; nt[:-1, :] |= t[1:, :]; nt[:, 1:] |= t[:, :-1]; nt[:, :-1] |= t[:, 1:]
touching = after_white & nt

rep_d = {
    'source': src.replace('\\', '/'),
    'seed': list(seed),
    'wedgeCleared': describe(wedge),
    'fringeHalved': fr,
    'nearWhiteComponents_before (min rgb > 232, opaque)': before[:12],
    'nearWhiteComponents_after': after[:12],
    'nearWhiteOpaqueTouchingTransparent_after': int(touching.sum()),
    'enclosedTransparentHoles_after': hole_comps,
    'diff': {'changedPixels': int(changed.sum()), 'clearedToTransparent': int(cleared_mask.sum()), 'fringeAlphaHalved': int(fringe_mask.sum()),
             'figureOwnPixelsWithChangedRGB': rgb_changed_own},
    'size': [W, H],
    'method': 'pixels made transparent only: 4-connected near-white (min(r,g,b) > 232) region from one seed inside the wedge; a 1 px pale fringe (min > 200) halved in alpha; no repaint',
}
json.dump(rep_d, open(rep, 'w'), indent=1)
# diff mask image: red = cleared, yellow = fringe
m = np.zeros((H, W, 3), np.uint8)
m[cleared_mask] = (255, 0, 0); m[fringe_mask] = (255, 255, 0)
Image.fromarray(m).save(dst.replace('.png', '.diffmask.png'))
print(json.dumps(rep_d, indent=1))
