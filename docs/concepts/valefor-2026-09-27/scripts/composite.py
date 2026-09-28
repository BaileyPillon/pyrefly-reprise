# Composite a Valefor option at 1:1 onto a real Chapter IX frame (headless production run).
# Layers: background plate (party faded out) -> Valefor -> the party, cut from the real frame by
# its difference to the plate inside the party's projected boxes. Valefor is mirrored, as the stage
# mirrors an aeon to face the enemy, and scaled so her figure (tight alpha box) is RATIO x the
# party's mean figure height (projectRect is the tight alpha box too).
# usage: composite.py <frames dir> <WxH> <valefor.png> <out.png> [ratio=1.8]
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

fdir, size, val, out = sys.argv[1:5]
ratio = float(sys.argv[5]) if len(sys.argv) > 5 else 1.8
meta = json.load(open(f'{fdir}/ix-{size}.json'))
frame = np.asarray(Image.open(f'{fdir}/ix-{size}-nohud.png').convert('RGB')).astype(np.int16)
plate = np.asarray(Image.open(f'{fdir}/ix-{size}-plate.png').convert('RGB')).astype(np.int16)
H, W = frame.shape[:2]
party = [v['box'] for v in meta['staged'].values() if v['side'] == 'party']
ph = float(np.mean([b[3] for b in party]))
feet = float(np.mean([b[1] + b[3] for b in party]))
x0, x1 = min(b[0] for b in party), max(b[0] + b[2] for b in party)

# party layer mask
inbox = np.zeros((H, W), bool)
for x, y, w, h in party:
    inbox[max(0, y - 12):min(H, y + h + 12), max(0, x - 12):min(W, x + w + 12)] = True
diff = np.abs(frame - plate).sum(-1) > 24
pm = ndimage.binary_closing(diff & inbox, iterations=2)
pm = ndimage.binary_fill_holes(pm)
soft = ndimage.gaussian_filter(pm.astype(np.float32), 0.8)[..., None]

# Valefor, mirrored, scaled on her tight figure height
v = Image.open(val).convert('RGBA').transpose(Image.FLIP_LEFT_RIGHT)
a = np.asarray(v)[..., 3] >= 8
ys, xs = np.where(a)
v = v.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
target_h = ratio * ph
s = target_h / v.height
v = v.resize((max(1, round(v.width * s)), max(1, round(v.height * s))), Image.LANCZOS)
vw, vh = v.size
depth = round(0.05 * ph)  # stands a step behind the party row
base = feet - depth
if W >= 768:
    left = W - 8 - vw if x1 + vw > W - 8 else x1 - round(0.25 * vw)
    left = max(int(x0 + (x1 - x0) * 0.55), min(left, W - 8 - vw))
else:
    left = round((x0 + x1) / 2 - vw / 2)
top = round(base - vh)
canvas = Image.fromarray(plate.clip(0, 255).astype(np.uint8)).convert('RGBA')
layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
layer.paste(v, (int(left), int(top)), v)
canvas = Image.alpha_composite(canvas, layer)
comp = np.asarray(canvas.convert('RGB')).astype(np.float32)
comp = comp * (1 - soft) + frame.astype(np.float32) * soft
Image.fromarray(comp.clip(0, 255).astype(np.uint8)).save(out)
info = {'out': out, 'partyFigureH': round(ph, 1), 'valeforFigureH': vh, 'valeforFigureW': vw, 'ratio': round(vh / ph, 3),
        'left': int(left), 'top': int(top), 'clippedPx': int(max(0, -left) + max(0, left + vw - W)), 'bundle': meta.get('bundle')}
print(json.dumps(info))
