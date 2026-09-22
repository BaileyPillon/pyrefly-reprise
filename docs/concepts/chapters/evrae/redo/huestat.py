"""Hue/saturation/value of the body's cool pixels (hue 150-260) and share of warm pixels, per image."""
import sys, colorsys
import numpy as np
from PIL import Image
for f in sys.argv[1:]:
    im = Image.open(f).convert("RGBA").resize((300, 200))
    a = np.array(im).astype(np.float32) / 255
    m = a[..., 3] > 0.5
    rgb = a[..., :3][m]
    hsv = np.array([colorsys.rgb_to_hsv(*p) for p in rgb])
    h = hsv[:, 0] * 360; s = hsv[:, 1]; v = hsv[:, 2]
    cool = (h > 150) & (h < 260) & (s > 0.2)
    warm = ((h < 50) | (h > 330)) & (s > 0.35)
    print(f"{f.split('/')[-1][:28]:28s} cool: hue {np.median(h[cool]):5.1f} sat {np.median(s[cool]):.2f} val {np.median(v[cool]):.2f} share {cool.mean():.2f} | warm share {warm.mean():.2f}")
