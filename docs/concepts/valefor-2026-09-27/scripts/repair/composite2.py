# Repair-round composite (2026-09-28). Same layers as ../composite.py (plate -> Valefor -> the party,
# cut from the real frame by its difference to the plate), with three changes the judge asked for:
#  1. NO mirror. The cut-out is painted facing RIGHT and is pasted exactly as painted.
#  2. She stands LEFT of the party, a step behind them (feet 5 % of party height above the party's
#     ground line), so facing right means facing Yojimbo (up and to the right of the party).
#  3. Placement is searched: every x where her opaque pixels stay clear of the enemies' projected
#     boxes (padded) and inside the screen margin; of those, the one the party hides least.
# ratio: a number (figure height / party mean figure height), or "fit" = the largest ratio whose
# width fits the screen with the margin, or "clear" = the largest ratio (<= fit) with a placement
# that keeps every opaque pixel off the enemies' boxes.
# stage: canon staging (research/ffx-combat-core.md 6.1: the party leaves the field while an aeon is out):
# the plate only, no party layer, and her feet may come forward (down the screen, toward the camera,
# never past the painted ground) until she is clear of the enemies' boxes.
# usage: composite2.py <frames dir> <WxH> <valefor.png> <out.png> <ratio|fit|clear> [margin=12] [stage]
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

fdir, size, val, out, ratio_arg = sys.argv[1:6]
margin = int(sys.argv[6]) if len(sys.argv) > 6 else 12
stage = len(sys.argv) > 7 and sys.argv[7] == 'stage'
meta = json.load(open(f'{fdir}/ix-{size}.json'))
frame = np.asarray(Image.open(f'{fdir}/ix-{size}-nohud.png').convert('RGB')).astype(np.int16)
plate = np.asarray(Image.open(f'{fdir}/ix-{size}-plate.png').convert('RGB')).astype(np.int16)
H, W = frame.shape[:2]
staged = meta['staged']
party = [v['box'] for v in staged.values() if v['side'] == 'party']
enemies = {k: v['box'] for k, v in staged.items() if v['side'] == 'enemy'}
ph = float(np.mean([b[3] for b in party]))
feet = float(np.mean([b[1] + b[3] for b in party]))
pad = max(4, round(0.04 * ph))

inbox = np.zeros((H, W), bool)
for x, y, w, h in party:
    inbox[max(0, y - 12):min(H, y + h + 12), max(0, x - 12):min(W, x + w + 12)] = True
diff = np.abs(frame - plate).sum(-1) > 24
pm = ndimage.binary_fill_holes(ndimage.binary_closing(diff & inbox, iterations=2))
soft = ndimage.gaussian_filter(pm.astype(np.float32), 0.8)[..., None]
if stage:
    pm[:] = False
    soft[:] = 0
rows = np.where(plate.mean(-1).mean(-1) > 18)[0]
ground_bottom = int(rows.max())  # last painted row (below it: the HUD band)

enemy_mask = np.zeros((H, W), bool)
for x, y, w, h in enemies.values():
    enemy_mask[max(0, y - pad):min(H, y + h + pad), max(0, x - pad):min(W, x + w + pad)] = True
yoj = np.zeros((H, W), bool)
x, y, w, h = enemies['yojimbo']
yoj[max(0, y - pad):min(H, y + h + pad), max(0, x - pad):min(W, x + w + pad)] = True

src = Image.open(val).convert('RGBA')  # never mirrored
a0 = np.asarray(src)[..., 3] >= 8
ys, xs = np.where(a0)
src = src.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
aspect = src.width / src.height
depth_frac = 0.05


def place(r):
    vh = max(1, round(r * ph))
    vw = max(1, round(vh * aspect))
    v = src.resize((vw, vh), Image.LANCZOS)
    a = np.asarray(v)[..., 3] >= 128
    best = None
    shifts = [0] if not stage else range(0, max(1, ground_bottom - margin - round(feet - depth_frac * ph)), 4)
    for dy in shifts:
        top = round(feet - depth_frac * ph - vh) + dy
        b = scan(a, vw, vh, top)
        if b is not None and (best is None or b[0] < best[0]):
            best = b + (top,)
        if best is not None and best[2] == 0:
            break
    return v, vw, vh, (best[5] if best else None), (best[:5] if best else None)


def scan(a, vw, vh, top):
    best = None
    for left in range(margin, W - margin - vw + 1, 2):
        m = np.zeros((H, W), bool)
        y0, y1 = max(0, top), min(H, top + vh)
        m[y0:y1, left:left + vw] = a[y0 - top:y1 - top]
        hit_e = int((m & enemy_mask).sum())
        hit_y = int((m & yoj).sum())
        hidden = int((m & pm).sum())
        key = (hit_e, hidden, left)
        if best is None or key < best[0]:
            best = (key, left, hit_e, hit_y, hidden)
    return best


fit = (W - 2 * margin) / aspect / ph
if ratio_arg == 'fit':
    r = fit
elif ratio_arg == 'clear':
    r = fit
    while r > 0.5:
        _, _, _, _, b = place(r)
        if b is not None and b[2] == 0:
            break
        r -= 0.02
else:
    r = float(ratio_arg)
v, vw, vh, top, best = place(r)
if best is None:
    raise SystemExit(f'ratio {r:.3f}: {vw}px wide does not fit {W}px with a {margin}px margin')
_, left, hit_e, hit_y, hidden = best
canvas = Image.fromarray(plate.clip(0, 255).astype(np.uint8)).convert('RGBA')
layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
layer.paste(v, (int(left), int(top)), v)
canvas = Image.alpha_composite(canvas, layer)
comp = np.asarray(canvas.convert('RGB')).astype(np.float32)
comp = comp * (1 - soft) + frame.astype(np.float32) * soft
Image.fromarray(comp.clip(0, 255).astype(np.uint8)).save(out)
print(json.dumps({'out': out.replace('\\', '/').split('/')[-1], 'viewport': size, 'partyFigureH': round(ph, 1),
                  'valeforFigureH': vh, 'valeforFigureW': vw, 'ratio': round(vh / ph, 3), 'fitRatio': round(fit, 3),
                  'left': int(left), 'top': int(top), 'marginL': int(left), 'marginR': int(W - left - vw),
                  'enemyBoxPx': hit_e, 'yojimboBoxPx': hit_y, 'hiddenByPartyPx': hidden, 'padPx': pad,
                  'mirrored': False, 'stage': 'party off the field (canon)' if stage else 'party on the field', 'feetY': int(top + vh), 'partyFeetY': round(feet), 'bundle': meta.get('bundle')}))
