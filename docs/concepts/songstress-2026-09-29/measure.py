"""Scale measurements for the Songstress poses (FFX-2 only), against each girl's new idle.

    python docs/concepts/songstress-2026-09-29/measure.py > measure.json
For each cut-out: the iris blobs (Rikku green, Paine red) in the top 40 percent of the figure, their
centroid y (the eye line), mean iris height and spacing, and the feet row (lowest opaque row).
  stature = feet row - eye line (hair, raised arms and head turn do not change it)
  scaleStature = idle stature / pose stature  (right for an upright pose)
  scaleIris    = idle iris height / pose iris height  (head size; does not shrink with a head turn)
The sidecar `scale` multiplies the idle's pixels-per-unit, so a figure painted smaller gets > 1.
"""
import json
import sys
from PIL import Image

C = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-29-songstress'
SETS = {
    'rikku': {'idle': f'{C}/options/rikku-A/cand-4.png', 'cast': 'cast/cand-2', 'item': 'item/cand-4', 'attack': 'attack/cand-5',
              'hurt': 'hurt/cand-3', 'victory': 'victory/cand-6', 'dance': 'dance/cand-5', 'ko': 'ko/cand-7'},
    'paine': {'idle': f'{C}/options/paine-A/cand-2.png', 'cast': 'cast/cand-14', 'item': 'item/cand-11', 'victory': 'victory/cand-14',
              'dance': 'dance/cand-11', 'ko': 'ko/cand-13'},
}


def is_iris(girl, r, g, b):
    if girl == 'rikku':
        return g > r + 45 and g > b + 15 and g > 90
    return r > g + 80 and r > b + 60 and r > 120


def blobs(im, girl, region):
    x0, y0, x1, y1 = region
    px = im.load()
    seen = set(); out = []
    for y in range(y0, y1):
        for x in range(x0, x1):
            if (x, y) in seen:
                continue
            r, g, b, a = px[x, y]
            if a < 200 or not is_iris(girl, r, g, b):
                continue
            stack = [(x, y)]; seen.add((x, y)); pts = []
            while stack:
                cx, cy = stack.pop(); pts.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if x0 <= nx < x1 and y0 <= ny < y1 and (nx, ny) not in seen:
                        rr, gg, bb, aa = px[nx, ny]
                        if aa >= 200 and is_iris(girl, rr, gg, bb):
                            seen.add((nx, ny)); stack.append((nx, ny))
            if len(pts) >= 12:
                xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
                out.append({'n': len(pts), 'cx': sum(xs) / len(xs), 'cy': sum(ys) / len(ys), 'h': max(ys) - min(ys) + 1, 'w': max(xs) - min(xs) + 1})
    return out


def eyes(im, girl):
    bb = im.getbbox(); H = bb[3] - bb[1]
    bl = blobs(im, girl, (bb[0], bb[1], bb[2], bb[1] + int(H * 0.45)))
    best = None
    for i, a in enumerate(bl):
        for b in bl[i + 1:]:
            dx = abs(a['cx'] - b['cx']); dy = abs(a['cy'] - b['cy'])
            ratio = max(a['n'], b['n']) / min(a['n'], b['n'])
            if 12 < dx < 140 and dy < 18 and ratio < 3 and 0.6 < a['h'] / b['h'] < 1.7 and a['h'] / max(1, a['w']) > 0.8:
                score = dy + ratio * 5
                if best is None or score < best[0]:
                    best = (score, a, b)
    if not best:
        return None
    _, a, b = best
    return {'eyeY': round((a['cy'] + b['cy']) / 2, 1), 'irisH': round((a['h'] + b['h']) / 2, 1), 'spacing': round(abs(a['cx'] - b['cx']), 1)}


def main():
    out = {}
    for girl, s in SETS.items():
        idle = Image.open(s['idle']).convert('RGBA')
        ie = eyes(idle, girl); ifeet = idle.getbbox()[3]
        out[girl] = {'idle': {**(ie or {}), 'feet': ifeet, 'file': s['idle']}}
        for slot, rel in s.items():
            if slot == 'idle':
                continue
            f = f'{C}/poses/{girl}-songstress/{rel}.png'
            im = Image.open(f).convert('RGBA')
            e = eyes(im, girl) if slot != 'ko' else None
            feet = im.getbbox()[3]
            rec = {'file': f, 'feet': feet, **(e or {})}
            if e and ie:
                rec['scaleStature'] = round((ifeet - ie['eyeY']) / (feet - e['eyeY']), 3)
                rec['scaleIris'] = round(ie['irisH'] / e['irisH'], 3)
            out[girl][slot] = rec
    json.dump(out, sys.stdout, indent=1)


if __name__ == '__main__':
    main()
