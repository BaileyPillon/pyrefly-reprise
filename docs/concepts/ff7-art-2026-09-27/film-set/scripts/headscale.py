"""Film set: a head-size scale proxy, for poses where stature does not work (a crouch, a lunge, a sword overhead).
Cloud: sqrt of the blond hair area (hue 38-62 deg, saturation > 0.45, value > 0.55): the same spiky hair in every pose.
Barret: sqrt of the near-black hair and beard area (value < 0.16, saturation < 0.6) in the top 30 % of the rows above
the shoulders (the gun-arm is steel grey and lower). Ratio idle / pose = the resample factor to the idle's scale.
Usage: python headscale.py cloud|barret <cut.png>"""
import json, sys
import numpy as np
from PIL import Image
sub, src = sys.argv[1], sys.argv[2]
a = np.asarray(Image.open(src).convert('RGBA')).astype(float) / 255
op = a[..., 3] > 0.5
mx, mn = a[..., :3].max(-1), a[..., :3].min(-1)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
s = (mx - mn) / np.maximum(mx, 1e-6)
hue = np.degrees(np.arctan2(np.sqrt(3) * (g - b), 2 * r - g - b)) % 360
if sub == 'cloud':
    m = op & (hue > 38) & (hue < 62) & (s > 0.45) & (mx > 0.55)
else:
    m = op & (mx < 0.16) & (s < 0.6)
    rows = np.nonzero(m.any(1))[0]
    top = rows.min()
    m[int(top + 0.16 * op.shape[0]):] = False          # hair + beard sit in the top ~16 % of a standing figure's height
print(json.dumps({'head': round(float(np.sqrt(m.sum())), 1)}))
