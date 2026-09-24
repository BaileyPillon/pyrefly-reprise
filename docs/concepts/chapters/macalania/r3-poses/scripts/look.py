"""Look-only JPEG: idle | candidates side by side at a scale, holes tinted magenta. usage: look.py <out.jpg> <scale> <idle> <cand...>"""
import sys, numpy as np, cv2, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import load, on_bg
out, sc = sys.argv[1], float(sys.argv[2]); ps = sys.argv[3:]
H = 0; tiles = []
for p in ps:
    im = load(p); t = on_bg(im, 0.42)
    hp = p.replace('.png', '.hole.png')
    if os.path.exists(hp) and os.environ.get('HOLES', '1') == '1':
        hm = cv2.imread(hp, 0) > 0; t[hm] = t[hm] * 0.5 + np.array([1, 0, 1]) * 0.5
    t = cv2.resize(t, None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA)
    cv2.putText(t, os.path.basename(p), (4, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 1, 1), 1)
    tiles.append(t)
H = max(t.shape[0] for t in tiles)
tiles = [np.pad(t, ((0, H - t.shape[0]), (0, 4), (0, 0)), constant_values=0.2) for t in tiles]
cv2.imwrite(out, (np.hstack(tiles) * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 85])
