# Nooj idle attempt 3 (METHOD-nooj.md): base = fresh render n9.4 (seed 970704, IP-Adapter forced on portraits/nooj.png).
# 1. key out three background holes the cut-out left white (inside the near loop, beside the neck, beside the far cheek);
# 2. block in the FAR hair loop behind the head on screen-left (his right side), in the render's own hair colours, with a
#    red tie where it is gathered, composited BEHIND the figure so only what peeks past the head shows;
# writes work/n94-pre.png and work/n94-mask.png for one masked repaint with IP-Adapter on the portrait.
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage
src = Image.open('renders/n9.4.png').convert('RGBA')
A = np.asarray(src).astype(np.float32).copy(); H, W = A.shape[:2]
lum = A[..., :3].mean(-1); sat = A[..., :3].max(-1) - A[..., :3].min(-1)
white = (lum > 225) & (sat < 30) & (A[..., 3] > 0)
lab, n = ndimage.label(white)
keyed = np.zeros((H, W), bool)
for (x, y) in [(430, 105), (318, 180), (283, 128)]:
    l = lab[y - 3:y + 4, x - 3:x + 4].max()
    if l: keyed |= lab == l
# grow into the anti-aliased rim: pale pixels within 2 px
rim = ndimage.binary_dilation(keyed, iterations=2) & (lum > 170) & (sat < 60)
keyed |= rim
A[keyed, 3] = 0
print('keyed px', int(keyed.sum()))
fig = Image.fromarray(A.astype(np.uint8), 'RGBA')
# far loop, behind the head
cx, cy, rx, ry = 252, 100, 20, 34
L = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
d.ellipse((cx - rx - 2, cy - ry - 2, cx + rx + 2, cy + ry + 2), fill=(5, 3, 4, 255))
d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(100, 62, 59, 255))
d.ellipse((cx - rx + 4, cy - ry + 6, cx + rx - 8, cy + ry - 4), fill=(170, 103, 87, 255))
d.ellipse((cx - rx + 7, cy - ry + 9, cx + rx - 6, cy + ry - 6), fill=(100, 62, 59, 255))
d.ellipse((cx - 10, cy - 14, cx + 8, cy + 22), fill=(5, 3, 4, 255))
d.ellipse((cx - 8, cy - 12, cx + 6, cy + 20), fill=(0, 0, 0, 0))
d.polygon([(cx + 6, cy - ry - 4), (cx + 20, cy - ry - 8), (cx + 24, cy - ry + 4), (cx + 10, cy - ry + 8)], fill=(220, 54, 29, 255), outline=(48, 7, 6, 255))
out = Image.alpha_composite(L, fig)
out.save('work/n94-pre.png')
LA = np.asarray(L)[..., 3] > 0
showing = LA & (np.asarray(fig)[..., 3] < 128)
mask = ndimage.binary_dilation(showing, iterations=5) & ~((np.asarray(fig)[..., 3] > 200) & ~ndimage.binary_dilation(showing, iterations=3))
m = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
m.save('work/n94-mask.png')
print('loop showing px', int(showing.sum()), 'mask px', int(mask.sum()))
bg = Image.new('RGBA', (W, H), (128, 128, 128, 255)); bg.alpha_composite(out)
bg.crop((180, 0, 520, 280)).convert('RGB').resize((680, 560)).save('work/n94-pre-head.jpg', quality=92)
