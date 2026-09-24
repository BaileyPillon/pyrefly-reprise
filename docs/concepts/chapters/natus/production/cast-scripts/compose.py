"""Frame helper (FFX only): the idle and the cast each composited over the ring layer exactly as idle.json
'layers' says (diameter 974 px, centre (346, 469) in idle pixels, ring BEHIND the figure), on one shared
1006x1199 canvas so both poses keep one pixel scale. Scratch output only; nothing in public/art is written."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nlib import *
lay = json.load(open(IDLE.replace('.png', '.json')))['layers']
ring = load(f'{REPO}/public/art/{lay["ring"]}').astype(np.float32)
ys, xs = np.where(ring[:, :, 3] > 0); ring = ring[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
D = lay['ringDiameterPx']; ring = cv2.resize(ring, (D, D), interpolation=cv2.INTER_AREA)
cx, cy = lay['ringCentre']; OX, OY = D // 2 - cx + 16, D // 2 - cy + 16
CW, CH = OX + 693 + 16 + (D // 2 + cx - 693 if D // 2 + cx > 693 else 0), OY + 1165
CW = max(CW, OX + cx + D // 2 + 16)
g = json.load(open(f'{OUT}/cast.gates.json'))
os.makedirs(f'{SCR}/frame', exist_ok=True)
for name, path, off in (('idle', IDLE, 0), ('cast', f'{REPO}/public/art/characters/seymour-natus/cast.png', g['idleOffsetX'])):
    fig = load(path).astype(np.float32)
    c = np.zeros((CH, CW, 4), np.float32)
    rx, ry = OX + cx - D // 2, OY + cy - D // 2
    c[ry:ry + D, rx:rx + D] = ring
    f = np.zeros_like(c); x = OX - off; f[OY:OY + fig.shape[0], x:x + fig.shape[1]] = fig
    o = over(f, c); save(o, f'{SCR}/frame/natus-{name}.png')
    json.dump({'width': CW, 'height': CH, 'baselineY': OY + 1148, 'pose': name, 'composition': 'full', 'nonBiped': False, 'facing': 'front', 'status': 'CANDIDATE'}, open(f'{SCR}/frame/natus-{name}.json', 'w'))
print('canvas', CW, CH, 'origin', OX, OY)
