"""Hi-fi round: take the baked green/yellow colour cast off a Guard Scorpion cut-out. Its reference render was
lit by a green glow from the RIGHT (the studio background), but in the battle frame the mako core is on its LEFT,
so compose.py adds the core rim on the correct side instead. Pixels that read olive, yellow or green (green well
above blue and at least half of red) get their green pulled down toward the red armour's; the cyan eye and lens
(blue close to green) and the neutral steel are untouched. Alpha is untouched.
Usage: python decast.py <cut.png> <out.png>"""
import json, sys
import numpy as np
from PIL import Image
a = np.asarray(Image.open(sys.argv[1]).convert('RGBA')).astype(float)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
m = (g > b + 25) & (g > 0.5 * r) & (a[..., 3] > 0)
w = np.clip((g - b - 25) / 40, 0, 1) * m                       # soft onset, no hard seams
target_g = np.minimum(g, 0.38 * r + 0.3 * b)
a[..., 1] = g * (1 - w) + target_g * w
a[..., 0] = r * (1 - 0.15 * w) + np.maximum(r, g) * 0.15 * w  # green-dominant pixels keep their brightness in red
Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(sys.argv[2])
print(json.dumps({'step': 'decast', 'pixels': int(m.sum())}))
