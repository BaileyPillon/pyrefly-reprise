# Valefor repair round (2026-09-28): build an img2img init from option B's OWN raw render
# (B/idle-2709234.raw.png, which was painted facing RIGHT; it is NOT mirrored here or anywhere).
#  - recolours the dark slate scaled body to the option's body colour (red feathers, red wing
#    membranes, cream throat/belly, ivory beak and talons are left alone);
#  - removes the floor shadow and the thin returning tail tip that made the pale smear at the
#    tail fold, so the tail ends in one clean line for the repaint.
# The init is only a starting point; the sampler repaints it at --denoise.
# usage: make-init.py <raw.png> <out.png> <ash|teal|bronze>
import sys
import numpy as np
from PIL import Image

src, out, scheme = sys.argv[1:4]
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
H, W = im.shape[:2]
r, g, b = im[..., 0], im[..., 1], im[..., 2]
lum = 0.299 * r + 0.587 * g + 0.114 * b
chroma = im.max(-1) - im.min(-1)
redness = r - np.maximum(g, b)

# body: dark, not red, not cream (cream has r > b clearly and high lum)
body = (redness < 12) & (lum < 125) & ~((r > b + 25) & (lum > 90))
# the painted floor shadow under the feet (bottom band, grey, not the near-black claws)
yy, xx = np.mgrid[0:H, 0:W]
shadow = (yy >= 690) & (lum >= 75) & (chroma < 30) & (redness < 12)
body &= ~shadow
schemes = {
    # pale ash: warm light stone grey (dark shadow -> light top)
    'ash': ((88, 82, 78), (222, 214, 202)),
    # muted teal-green, desaturated from the installed #0b6871 / #58c595
    'teal': ((26, 62, 58), (112, 168, 150)),
    'bronze': ((78, 50, 28), (206, 150, 86)),
}
lo, hi = (np.array(c, np.float32) for c in schemes[scheme])
t = np.clip((lum - 8) / 105.0, 0, 1)[..., None]
new = lo + (hi - lo) * t
outline = body & (lum < 22)
res = im.copy()
res[body] = new[body]
res[outline] = lo * 0.55

# floor shadow and pale greys (background side): to white
bg = ((lum > 140) & (chroma < 22)) | shadow
res[bg] = 255
# the returning thin tail tip under the main tail (raw coords, measured on the 1344x768 render)
tip = ((xx >= 830) & (xx <= 1250) & (yy >= 714)) | ((xx >= 830) & (xx <= 1150) & (yy >= 685))
res[tip] = 255
# replace the folded tail end with one tapering tail (drawn flat; the repaint shades it)
from PIL import ImageDraw
end = (xx >= 1150) & (yy >= 600)
col = res[655:675, 1120:1140][body[655:675, 1120:1140]].mean(0) if body[655:675, 1120:1140].any() else (lo + hi) / 2
res[end] = 255
pim = Image.fromarray(res.clip(0, 255).astype(np.uint8))
d = ImageDraw.Draw(pim)
d.polygon([(1146, 643), (1230, 652), (1300, 664), (1326, 672), (1296, 678), (1220, 684), (1146, 686)],
          fill=tuple(int(v) for v in col), outline=tuple(int(v) for v in lo * 0.55))
res = np.asarray(pim).astype(np.float32)
Image.fromarray(res.clip(0, 255).astype(np.uint8)).save(out)
print(out, int(body.sum()), 'body px recoloured to', scheme)
